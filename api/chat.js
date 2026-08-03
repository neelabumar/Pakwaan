/* The only piece that touches your API key. The browser never sees it.
   Runs on Vercel's edge runtime, which streams the reply straight through. */

export const config = { runtime: "edge" };

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2000;

/* Per-instance memory, so this is a speed bump rather than a lock. It stops
   a stuck loop or a curious visitor from running up a bill. For a real limit
   across instances, swap in Upstash Redis or Vercel KV. */
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

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Server is missing ANTHROPIC_API_KEY" }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (overLimit(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests, wait a minute" }), {
      status: 429, headers: { "content-type": "application/json" },
    });
  }

  let input;
  try { input = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }

  const { system, prompt, search, stream } = input || {};
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 4000) {
    return new Response("Bad request", { status: 400 });
  }

  /* The client asks for a recipe; it does not get to pick the model, the
     token budget, or the tools. That stays here. */
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
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    },
  });
}
