/* Fallback proxy, Node runtime instead of edge.
   Use this only if the site loads but /api/chat 404s on its own:
     1. delete api/chat.js
     2. rename this file to api/chat.js
   Same behaviour, same streaming, no `config` export for Vercel to honour. */

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2000;

/* A name mismatch should not look like a broken app. Accept the obvious
   variants, trim stray whitespace from pasting, and report which one was
   found so the health check can say so out loud. */
const KEY_NAMES = ["ANTHROPIC_API_KEY", "apiKey", "API_KEY", "CLAUDE_API_KEY", "ANTHROPIC_KEY"];

function readKey() {
  for (const name of KEY_NAMES) {
    const v = process.env[name];
    if (v && v.trim()) return { name, value: v.trim() };
  }
  return null;
}

const WINDOW_MS = 60_000;
const MAX_CALLS = 20;
const hits = new Map();

function overLimit(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, since: now };
  if (now - rec.since > WINDOW_MS) { rec.n = 0; rec.since = now; }
  rec.n += 1;
  hits.set(ip, rec);
  if (hits.size > 5000) hits.clear();
  return rec.n > MAX_CALLS;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const found = readKey();
    res.status(200).json({
      ok: true,
      function: "deployed",
      runtime: "node",
      hasKey: Boolean(found),
      keyName: found ? found.name : null,
      keyLooksValid: found ? found.value.startsWith("sk-ant-") : false,
      keyLength: found ? found.value.length : 0,
      lookedFor: KEY_NAMES,
      model: MODEL,
    });
    return;
  }
  if (req.method !== "POST") { res.status(405).end("Method not allowed"); return; }

  const key = readKey();
  if (!key) {
    res.status(500).json({
      error: "No API key found. Name the variable ANTHROPIC_API_KEY in Vercel, then redeploy.",
    });
    return;
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  if (overLimit(ip)) { res.status(429).json({ error: "Too many requests, wait a minute" }); return; }

  /* Vercel parses JSON bodies for Node functions, but not always. */
  let input = req.body;
  if (typeof input === "string") { try { input = JSON.parse(input); } catch { input = null; } }
  const { system, prompt, search, stream } = input || {};
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 4000) {
    res.status(400).end("Bad request");
    return;
  }

  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
    stream: Boolean(stream),
  };
  if (typeof system === "string" && system.trim()) body.system = system.slice(0, 2000);
  if (search) body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 2 }];

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key.value,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const raw = await upstream.text();
    let message = raw.slice(0, 400);
    try {
      const j = JSON.parse(raw);
      message = (j.error && (j.error.message || j.error.type)) || message;
    } catch (_) {}
    console.error("Anthropic error", upstream.status, message);
    res.status(upstream.status).json({ error: message, status: upstream.status });
    return;
  }

  res.setHeader("content-type", upstream.headers.get("content-type") || "application/json");
  res.setHeader("cache-control", "no-store");

  const reader = upstream.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}
