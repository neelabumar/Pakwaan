import React, { useState, useEffect, useRef } from "react";

/* ------------------------------------------------------------------
   PAKWAN — AI recipe agent
   Tell it what is in your kitchen, it finds dishes and walks you
   through cooking them, in English or Urdu.
-------------------------------------------------------------------*/

/* Change to "ur" if she should always land on Urdu, and 1.2 or 1.45
   if the biggest text should be the starting point. */
const DEFAULT_LANG = "en";
const DEFAULT_SCALE = 1;

function remember(k, fallback) {
  try {
    const v = window.localStorage.getItem("pakwan:" + k);
    return v === null ? fallback : JSON.parse(v);
  } catch (_) { return fallback; }
}
function store(k, v) {
  try { window.localStorage.setItem("pakwan:" + k, JSON.stringify(v)); } catch (_) {}
}

const C = {
  cream: "#FFF7EC",
  paper: "#FFFFFF",
  ink: "#2B1A10",
  inkSoft: "#7A6252",
  line: "#EADBC6",
  saffron: "#F2830B",
  chili: "#C1341A",
  haldi: "#FFB300",
  leaf: "#2E7D32",
  leafSoft: "#E7F3E7",
};

const CARD_SKINS = [
  "linear-gradient(135deg,#FF9A2E 0%,#F2700B 55%,#DE4E12 100%)",
  "linear-gradient(135deg,#FFC24B 0%,#F79E1B 60%,#E07A0C 100%)",
  "linear-gradient(135deg,#F4713B 0%,#DA4A22 60%,#B62F16 100%)",
  "linear-gradient(135deg,#FFB03A 0%,#EE8318 55%,#CF5E10 100%)",
  "linear-gradient(135deg,#E8632B 0%,#C93F1C 60%,#A32C12 100%)",
  "linear-gradient(135deg,#FFA83C 0%,#F08519 55%,#D25E0B 100%)",
];

/* ----------------------------- words ----------------------------- */
const T = {
  en: {
    dir: "ltr",
    brand: "Pakwan",
    tagline: "Tell me what is in your kitchen",
    step1: "1. Add your ingredients",
    inputLabel: "Type in English, Urdu or Roman Urdu — aloo, دہی, chicken",
    placeholder: "for example: aloo, dahi, chicken",
    add: "Add",
    suggestions: "Tap to choose",
    addAsTyped: (x) => `Add “${x}” as written`,
    already: "already in your basket",
    common: "Or tap the ones you have",
    yourBasket: "In your basket",
    empty: "Your basket is empty. Add at least two things.",
    clear: "Empty the basket",
    step2: "2. What kind of food?",
    prefAny: "Anything",
    prefVeg: "No meat",
    prefQuick: "Under 30 minutes",
    prefLight: "Light / low oil",
    find: "Find dishes for me",
    finding: "Looking for dishes…",
    results: "Dishes you can make",
    backToBasket: "Change ingredients",
    youHave: "You have",
    youNeed: "You still need",
    ingredients: "Ingredients",
    method: "How to cook",
    tips: "Good to know",
    startCooking: "Start cooking, step by step",
    back: "Back",
    next: "Next step",
    prev: "Previous",
    finish: "Finished",
    stepOf: (a, b) => `Step ${a} of ${b}`,
    done: "Well done. Your dish is ready.",
    closeCook: "Close",
    listen: "Read aloud",
    stop: "Stop reading",
    print: "Print this recipe",
    loadingRecipe: "Writing the full recipe…",
    errTitle: "That did not work",
    errBody: "The kitchen assistant could not be reached. Check your internet and try again.",
    retry: "Try again",
    kcal: "kcal",
    mins: "min",
    serves: "serves",
    text: "Text size",
    lang: "اردو",
    web: "Search the web for recipes",
    webNote: "more authentic, about 10 seconds slower",
    webOn: "on",
    webOff: "off",
    writing: "writing the rest…",
    noResults: "No dishes came back. Add one or two more ingredients and try again.",
  },
  ur: {
    dir: "rtl",
    brand: "پکوان",
    tagline: "بتائیں آپ کے کچن میں کیا موجود ہے",
    step1: "١۔ اپنی چیزیں شامل کریں",
    inputLabel: "اردو، انگریزی یا رومن اردو میں لکھیں — آلو، aloo، potato",
    placeholder: "مثلاً: آلو، دہی، مرغی",
    add: "شامل کریں",
    suggestions: "منتخب کرنے کے لیے ٹچ کریں",
    addAsTyped: (x) => `“${x}” اسی طرح شامل کریں`,
    already: "پہلے سے ٹوکری میں ہے",
    common: "یا جو موجود ہے اس پر ٹچ کریں",
    yourBasket: "آپ کی ٹوکری میں",
    empty: "ٹوکری خالی ہے۔ کم از کم دو چیزیں شامل کریں۔",
    clear: "ٹوکری خالی کریں",
    step2: "٢۔ کس قسم کا کھانا؟",
    prefAny: "کوئی بھی",
    prefVeg: "بغیر گوشت",
    prefQuick: "تیس منٹ سے کم",
    prefLight: "ہلکا / کم تیل",
    find: "میرے لیے کھانے ڈھونڈیں",
    finding: "کھانے تلاش کیے جا رہے ہیں…",
    results: "یہ کھانے آپ بنا سکتی ہیں",
    backToBasket: "چیزیں بدلیں",
    youHave: "آپ کے پاس ہے",
    youNeed: "یہ چاہیے ہوگا",
    ingredients: "اجزاء",
    method: "بنانے کا طریقہ",
    tips: "مفید باتیں",
    startCooking: "قدم بہ قدم پکانا شروع کریں",
    back: "واپس",
    next: "اگلا قدم",
    prev: "پچھلا",
    finish: "مکمل",
    stepOf: (a, b) => `قدم ${a} از ${b}`,
    done: "شاباش! آپ کا کھانا تیار ہے۔",
    closeCook: "بند کریں",
    listen: "پڑھ کر سنائیں",
    stop: "پڑھنا بند کریں",
    print: "ترکیب پرنٹ کریں",
    loadingRecipe: "پوری ترکیب لکھی جا رہی ہے…",
    errTitle: "کام نہیں ہو سکا",
    errBody: "رابطہ نہیں ہو سکا۔ انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔",
    retry: "دوبارہ کوشش کریں",
    kcal: "کیلوری",
    mins: "منٹ",
    serves: "افراد",
    text: "لکھائی کا سائز",
    lang: "English",
    web: "ترکیبیں انٹرنیٹ سے تلاش کریں",
    webNote: "زیادہ مستند، مگر تقریباً دس سیکنڈ سست",
    webOn: "آن",
    webOff: "آف",
    writing: "باقی لکھا جا رہا ہے…",
    noResults: "کوئی کھانا نہیں ملا۔ ایک دو چیزیں اور شامل کر کے کوشش کریں۔",
  },
};

/* Every item is searchable by English, Urdu script, or Roman Urdu.
   `r` holds the Roman Urdu spellings people actually type, including
   the common misspellings. `top` marks the ones shown as quick taps. */
const PANTRY = [
  { en: "Chicken", ur: "مرغی", e: "🍗", top: 1, r: ["murghi", "murgi", "murgh", "chikan"] },
  { en: "Beef mince", ur: "قیمہ", e: "🥩", top: 1, r: ["qeema", "keema", "kheema"] },
  { en: "Mutton", ur: "بکرے کا گوشت", e: "🍖", top: 1, r: ["gosht", "bakra", "mutton"] },
  { en: "Fish", ur: "مچھلی", e: "🐟", r: ["machli", "machhli", "fish"] },
  { en: "Eggs", ur: "انڈے", e: "🥚", top: 1, r: ["anday", "ande", "anda", "unday"] },
  { en: "Potato", ur: "آلو", e: "🥔", top: 1, r: ["aloo", "alu", "aalu"] },
  { en: "Onion", ur: "پیاز", e: "🧅", top: 1, r: ["pyaz", "piyaz", "pyaaz"] },
  { en: "Tomato", ur: "ٹماٹر", e: "🍅", top: 1, r: ["tamatar", "timatar"] },
  { en: "Garlic", ur: "لہسن", e: "🧄", top: 1, r: ["lehsan", "lahsan", "lasan"] },
  { en: "Ginger", ur: "ادرک", e: "🫚", top: 1, r: ["adrak", "adrack"] },
  { en: "Rice", ur: "چاول", e: "🍚", top: 1, r: ["chawal", "chaval", "rice"] },
  { en: "Flour (atta)", ur: "آٹا", e: "🌾", top: 1, r: ["atta", "aata", "maida"] },
  { en: "Lentils (daal)", ur: "دال", e: "🥣", top: 1, r: ["daal", "dal", "masoor", "moong", "chana daal"] },
  { en: "Chickpeas", ur: "چنے", e: "🫘", top: 1, r: ["chanay", "chane", "chole", "kabuli chana"] },
  { en: "Kidney beans", ur: "لوبیا", e: "🫘", r: ["lobia", "rajma"] },
  { en: "Yogurt", ur: "دہی", e: "🥛", top: 1, r: ["dahi", "dhai", "yoghurt"] },
  { en: "Milk", ur: "دودھ", e: "🥛", top: 1, r: ["doodh", "dudh"] },
  { en: "Cream", ur: "بالائی", e: "🍶", r: ["balai", "malai", "cream"] },
  { en: "Butter", ur: "مکھن", e: "🧈", r: ["makhan", "butter"] },
  { en: "Ghee", ur: "گھی", e: "🧈", r: ["ghee", "ghi", "banaspati"] },
  { en: "Cooking oil", ur: "تیل", e: "🫒", top: 1, r: ["tel", "teil", "oil"] },
  { en: "Spinach", ur: "پالک", e: "🥬", top: 1, r: ["palak", "paalak", "saag"] },
  { en: "Okra", ur: "بھنڈی", e: "🥒", top: 1, r: ["bhindi", "bhinday"] },
  { en: "Cauliflower", ur: "گوبھی", e: "🥦", top: 1, r: ["gobi", "gobhi", "phool gobi"] },
  { en: "Cabbage", ur: "بند گوبھی", e: "🥬", r: ["band gobi", "cabbage"] },
  { en: "Carrot", ur: "گاجر", e: "🥕", top: 1, r: ["gajar", "gaajar"] },
  { en: "Peas", ur: "مٹر", e: "🟢", top: 1, r: ["matar", "mutter"] },
  { en: "Bottle gourd", ur: "کدو", e: "🥒", r: ["kaddu", "lauki", "ghiya"] },
  { en: "Eggplant", ur: "بینگن", e: "🍆", r: ["baingan", "bengan"] },
  { en: "Green chilli", ur: "ہری مرچ", e: "🌶️", top: 1, r: ["hari mirch", "mirchi", "green chilli"] },
  { en: "Coriander", ur: "ہرا دھنیا", e: "🌿", r: ["dhania", "hara dhania", "cilantro"] },
  { en: "Mint", ur: "پودینہ", e: "🌿", r: ["podina", "pudina"] },
  { en: "Lemon", ur: "لیموں", e: "🍋", r: ["limu", "nimbu", "lemon"] },
  { en: "Turmeric", ur: "ہلدی", e: "🟡", r: ["haldi", "haldee"] },
  { en: "Red chilli powder", ur: "لال مرچ", e: "🌶️", r: ["lal mirch", "laal mirch"] },
  { en: "Cumin", ur: "زیرہ", e: "🟤", r: ["zeera", "jeera"] },
  { en: "Garam masala", ur: "گرم مصالحہ", e: "🥄", r: ["garam masala", "masala"] },
  { en: "Salt", ur: "نمک", e: "🧂", r: ["namak", "salt"] },
  { en: "Sugar", ur: "چینی", e: "🍬", r: ["cheeni", "chini", "shakar"] },
  { en: "Bread", ur: "ڈبل روٹی", e: "🍞", top: 1, r: ["bread", "double roti", "toast"] },
  { en: "Pasta", ur: "پاستا", e: "🍝", r: ["pasta", "macaroni", "spaghetti"] },
  { en: "Cheese", ur: "پنیر", e: "🧀", r: ["paneer", "cheese"] },
  { en: "Semolina", ur: "سوجی", e: "🥣", r: ["suji", "sooji"] },
  { en: "Vermicelli", ur: "سویاں", e: "🍜", r: ["seviyan", "sewaiyan"] },
];

/* --------------------------- helpers ----------------------------- */
/* Roman Urdu has no fixed spelling: dahi / dhai, qeema / keema, pyaz /
   pyaaz all mean the same thing. Normalising collapses the noise so the
   search still lands on the right item. */
function norm(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u0652\u0670]/g, "")   // Urdu vowel marks
    .replace(/[^\p{L}\p{N} ]/gu, "")         // punctuation
    .replace(/\s+/g, " ");
}
/* Softens the vowel-doubling and h/kh swaps typical of Roman Urdu. */
function fuzz(s) {
  return norm(s)
    .replace(/aa+/g, "a").replace(/ee+/g, "i").replace(/oo+/g, "u")
    .replace(/ii+/g, "i").replace(/uu+/g, "u")
    .replace(/kh/g, "k").replace(/gh/g, "g").replace(/ph/g, "f")
    .replace(/y/g, "i").replace(/w/g, "v")
    .replace(/[aeiou]/g, "");                // consonant skeleton
}

function matchScore(p, q) {
  const nq = norm(q), fq = fuzz(q);
  if (!nq) return 0;
  const names = [p.en, p.ur, ...(p.r || [])];
  let best = 0;
  for (const raw of names) {
    const n = norm(raw);
    if (n === nq) return 100;
    if (n.startsWith(nq)) best = Math.max(best, 80);
    else if (n.includes(nq)) best = Math.max(best, 60);
    else {
      /* Skeleton match only counts when the two words are a similar length,
         otherwise short queries drag in unrelated items. */
      const f = fuzz(raw);
      const close = f && fq && Math.abs(f.length - fq.length) <= 1;
      if (close && (f === fq || f.startsWith(fq))) best = Math.max(best, 45);
      else if (close && f.includes(fq)) best = Math.max(best, 30);
    }
  }
  return best;
}

function searchPantry(q, limit = 6) {
  return PANTRY.map((p) => ({ p, s: matchScore(p, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}

function autoClose(s) {
  let out = "";
  let inStr = false, esc = false;
  const stack = [];
  for (const ch of s) {
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
  }
  if (inStr) out += '"';
  for (let i = stack.length - 1; i >= 0; i--) out += stack[i] === "{" ? "}" : "]";
  return out;
}

/** Parses JSON even when the model output is fenced or cut off mid-way. */
function looseParse(raw) {
  if (!raw) return null;
  let s = raw.replace(/```json|```/g, "").trim();
  const start = Math.min(
    ...[s.indexOf("{"), s.indexOf("[")].filter((i) => i >= 0).concat([Infinity])
  );
  if (start === Infinity) return null;
  s = s.slice(start);
  try { return JSON.parse(s); } catch (_) { /* keep trying */ }
  for (let i = s.length; i > 20; i--) {
    const cut = s.slice(0, i).replace(/,\s*$/, "");
    try { return JSON.parse(cut + autoClose(cut)); } catch (_) { /* next */ }
  }
  return null;
}

/* Streams by default. Every chunk is handed to onText as the full text so
   far, so the screen can fill in while the model is still writing. Falls
   back to a plain request if the stream cannot be read. */
async function askClaude({ system, prompt, search, onText }) {
  /* The key lives on the server, in api/chat.js. This only sends the request. */
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, prompt, search, stream: Boolean(onText) }),
  });
  if (!res.ok) {
    /* The reason lives in the body. Without this it is all "request failed". */
    let detail = "HTTP " + res.status;
    try {
      const j = await res.json();
      detail = j.error || j.message || detail;
    } catch (_) {
      try { const txt = await res.text(); if (txt) detail = txt.slice(0, 200); } catch (_) {}
    }
    const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    err.status = res.status;
    throw err;
  }

  if (!onText || !res.body || !res.body.getReader) {
    const data = await res.json();
    return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "", last = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const ev = JSON.parse(raw);
        if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") {
          text += ev.delta.text;
        }
      } catch (_) { /* keep-alive line */ }
    }
    /* Re-parsing on every token is wasteful; 120ms is smooth enough. */
    const now = Date.now();
    if (text && now - last > 120) { last = now; onText(text); }
  }
  if (text) onText(text);
  return text;
}

/* Plain-English next step for whoever deployed this. Not shown to cooks. */
function hintFor(e) {
  const m = ((e && e.message) || "").toLowerCase();
  const st = e && e.status;
  if (st === 404 && m.includes("<!doctype")) return "The /api/chat function did not deploy. Check the api folder is committed.";
  if (m.includes("anthropic_api_key")) return "Add ANTHROPIC_API_KEY in Vercel, then redeploy. A new build is required.";
  if (st === 401 || m.includes("authentication")) return "The key is wrong, revoked, or has a stray space. Paste it again.";
  if (m.includes("credit") || m.includes("balance") || m.includes("quota")) return "Add credit to the Anthropic account.";
  if (st === 404 && m.includes("model")) return "The model id is not available to this key.";
  if (st === 429) return "Rate limited. Wait a minute, or raise MAX_CALLS in api/chat.js.";
  if (st === 400) return "The request was rejected. The exact reason is in the line above.";
  if (st >= 500) return "Server error. Open the function logs in Vercel for the stack trace.";
  return "Open Vercel then Deployments then Logs to see the function error.";
}

function speak(text, lang) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "ur" ? "ur-PK" : "en-US";
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
  return true;
}
function hush() {
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}

/* --------------------------- small UI ---------------------------- */
function Btn({ children, onClick, tone = "primary", full, style, disabled, ariaLabel }) {
  const tones = {
    primary: { background: C.saffron, color: "#fff", border: "2px solid " + C.saffron },
    dark: { background: C.ink, color: "#fff", border: "2px solid " + C.ink },
    ghost: { background: "#fff", color: C.ink, border: "2px solid " + C.line },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="rounded-2xl font-bold transition"
      style={{
        ...tones[tone],
        padding: "16px 22px",
        minHeight: 60,
        width: full ? "100%" : undefined,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: tone === "ghost" ? "none" : "0 4px 0 rgba(0,0,0,0.12)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Pill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full font-semibold"
      style={{
        padding: "12px 18px",
        minHeight: 52,
        border: "2px solid " + (active ? C.saffron : C.line),
        background: active ? "#FFEFD9" : "#fff",
        color: active ? C.chili : C.ink,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ padding: "56px 20px", gap: 18 }}>
      <div
        style={{
          width: 54, height: 54, borderRadius: "50%",
          border: "6px solid " + C.line, borderTopColor: C.saffron,
          animation: "pkspin 0.9s linear infinite",
        }}
      />
      <p style={{ color: C.inkSoft, fontWeight: 700 }}>{label}</p>
    </div>
  );
}

function ErrorBox({ t, onRetry, note }) {
  return (
    <div className="rounded-3xl" style={{ background: "#FFEDE8", border: "2px solid #F3B8A8", padding: 22, margin: 16 }}>
      <p style={{ fontWeight: 800, color: C.chili, marginBottom: 6 }}>{t.errTitle}</p>
      <p style={{ color: C.ink, marginBottom: 16 }}>{t.errBody}</p>
      <Btn onClick={onRetry} tone="dark">{t.retry}</Btn>
      {note && (
        <div dir="ltr" style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #F3B8A8" }}>
          <p style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 13, color: "#8A4B3A", wordBreak: "break-word" }}>
            {note.message}
          </p>
          <p style={{ fontSize: 13, color: C.inkSoft, marginTop: 6 }}>→ {note.hint}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ app ------------------------------ */
export default function App() {
  const [lang, setLang] = useState(() => remember("lang", DEFAULT_LANG));
  const [scale, setScale] = useState(() => remember("scale", DEFAULT_SCALE));
  const [screen, setScreen] = useState("home"); // home | results | detail | cook
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);   // ingredient dropdown
  const [hi, setHi] = useState(0);           // highlighted row
  const [pref, setPref] = useState("any");
  const [useWeb, setUseWeb] = useState(() => remember("web", false));

  const [recipes, setRecipes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [errNote, setErrNote] = useState(null);   // what actually went wrong

  const [picked, setPicked] = useState(null);
  const [detail, setDetail] = useState(null);
  const [dBusy, setDBusy] = useState(false);
  const [dLive, setDLive] = useState(false);   // model still writing
  const [dErr, setDErr] = useState(false);

  const [stepNo, setStepNo] = useState(0);
  const [reading, setReading] = useState(false);
  const topRef = useRef(null);
  const cache = useRef(new Map());    // finished recipes
  const flight = useRef(new Map());   // requests in progress
  const sinks = useRef(new Map());    // partial-text listeners
  const reqId = useRef(0);

  const t = T[lang];
  const rtl = lang === "ur";
  const fs = (n) => Math.round(n * scale);
  const urFont = "'Noto Nastaliq Urdu','Jameel Noori Nastaleeq',serif";
  const enFont = "'Nunito','Segoe UI',system-ui,sans-serif";
  const fontFamily = rtl ? urFont : enFont;

  /* Her language and text size should still be there tomorrow morning. */
  useEffect(() => { store("lang", lang); }, [lang]);
  useEffect(() => { store("scale", scale); }, [scale]);
  useEffect(() => { store("web", useWeb); }, [useWeb]);

  useEffect(() => { hush(); setReading(false); }, [screen, lang]);

  /* Basket entries are objects so one ingredient carries all three names:
     the user sees it in their language, the model always receives English. */
  const matches = draft.trim() ? searchPantry(draft) : [];
  const hasItem = (key) => items.some((x) => x.key === key);

  const addPantry = (p) => {
    setItems((prev) =>
      prev.some((x) => x.key === p.en) ? prev : [...prev, { key: p.en, en: p.en, ur: p.ur, e: p.e }]
    );
    setDraft(""); setOpen(false); setHi(0);
  };

  /* Free text, split on both comma shapes. Each piece is matched against the
     pantry first, so "aloo" and "آلو" both land on Potato; anything unknown
     is kept exactly as typed and sent to the model as-is. */
  const addTyped = (text) => {
    const parts = text.split(/[,،]/).map((x) => x.trim()).filter(Boolean);
    setItems((prev) => {
      const next = [...prev];
      parts.forEach((raw) => {
        const hit = searchPantry(raw, 1)[0];
        const known = hit && matchScore(hit, raw) >= 80 ? hit : null;
        const entry = known
          ? { key: known.en, en: known.en, ur: known.ur, e: known.e }
          : { key: norm(raw), en: raw, ur: raw, e: "🥄", custom: true };
        if (!next.some((x) => x.key === entry.key)) next.push(entry);
      });
      return next;
    });
    setDraft(""); setOpen(false); setHi(0);
  };

  const dropItem = (key) => setItems((prev) => prev.filter((x) => x.key !== key));

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, matches.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!draft.trim()) return;
      if (open && hi < matches.length && matches[hi]) addPantry(matches[hi]);
      else addTyped(draft);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  /* -------------------- find dishes -------------------- */
  const prefText = {
    any: "no restriction",
    veg: "vegetarian only, no meat or fish",
    quick: "must be ready in under 30 minutes",
    light: "light, low oil, easy to digest",
  }[pref];

  async function findDishes() {
    setBusy(true); setErr(false); setRecipes([]); setScreen("results");
    const take = (txt) => {
      const parsed = looseParse(txt);
      const list = Array.isArray(parsed) ? parsed : parsed && parsed.recipes;
      if (Array.isArray(list)) {
        const clean = list.filter((r) => r && (r.en || r.ur) && r.kcal !== undefined);
        if (clean.length) { setRecipes(clean); setBusy(false); }
      }
    };
    try {
      const out = await askClaude({
        onText: take,
        system:
          "You are a home cooking assistant for South Asian and international home cooks. You reply with valid JSON only. No markdown, no commentary.",
        prompt:
          `Ingredients I have at home: ${items.map((x) => x.en).join(", ")}.\n` +
          `Some names may be Urdu or Roman Urdu; read them as South Asian kitchen items.\n` +
          `Requirement: ${prefText}.\n` +
          `Suggest exactly 6 real, well known dishes I can realistically cook with these. ` +
          `Prefer dishes that use the most of my ingredients. Mix desi and simple international options.\n` +
          `Reply as a JSON array of 6 objects with exactly these keys:\n` +
          `{"id":1,"en":"English dish name","ur":"نام in Urdu script","kcal":number per serving,"minutes":number,"servings":number,"emoji":"one food emoji","uses":["my ingredients used"],"missing":["up to 3 extra common items"],"note_en":"max 8 words","note_ur":"max 8 words in Urdu"}\n` +
          `Keep every text field short. JSON only.`,
      });
      take(out);
      const parsed = looseParse(out);
      const list = Array.isArray(parsed) ? parsed : (parsed && parsed.recipes) || [];
      const clean = list.filter((r) => r && (r.en || r.ur));
      setRecipes(clean);
      /* The first card is the one most people tap, so start it now. */
      if (clean[0]) setTimeout(() => warm(clean[0]), 250);
    } catch (e) {
      setErr(true);
      setErrNote({ message: e.message || "unknown error", hint: hintFor(e) });
    } finally {
      setBusy(false);
      if (topRef.current) topRef.current.scrollTop = 0;
    }
  }

  /* -------------------- open one dish ------------------ */
  /* A recipe is fetched once per dish + language + web setting, then kept.
     Going back and forth between cards costs nothing after the first time. */
  const key = (r) => `${r.en || r.ur}|${lang}|${useWeb ? 1 : 0}`;

  function detailRequest(r, onText) {
    return askClaude({
      search: useWeb,
      onText,
      system:
        "You are a patient cooking teacher writing for an elderly beginner cook. You reply with valid JSON only. No markdown, no commentary.",
      prompt:
        (useWeb ? "Search the web once for an authentic version of this dish, then answer.\n" : "") +
        `Dish: ${r.en || r.ur}. Cook for ${r.servings || 4} people.\n` +
        `I already have: ${items.map((x) => x.en).join(", ")}.\n` +
        `Write everything in ${rtl ? "Urdu, in Urdu script" : "simple, plain English"}.\n` +
        `Use household measures (cup, spoon). Short sentences. One action per step.\n` +
        `Put "ingredients" before "steps" in the JSON.\n` +
        `Reply as JSON only:\n` +
        `{"title":"","summary":"max 12 words","kcal":number,"minutes":number,"servings":number,` +
        `"ingredients":[{"item":"","qty":""}],"steps":["6 to 8 short steps"],"tips":["2 short tips"]}`,
    });
  }

  /* One request per dish, shared by everyone who asks for it. Whoever is
     watching that dish gets the partial text as it arrives. */
  function fetchDetail(r) {
    const k = key(r);
    if (cache.current.has(k)) return Promise.resolve(cache.current.get(k));
    if (flight.current.has(k)) return flight.current.get(k);

    const job = (async () => {
      let txt = await detailRequest(r, (t) => {
        const sink = sinks.current.get(k);
        if (sink) sink(t);
      });
      if (!txt || !txt.trim()) txt = await detailRequest(r);   // stream blocked
      const parsed = looseParse(txt);
      if (!parsed || !parsed.steps || !parsed.steps.length) throw new Error("bad json");
      cache.current.set(k, parsed);
      return parsed;
    })();

    flight.current.set(k, job);
    job.catch(() => {}).then(() => flight.current.delete(k));
    return job;
  }

  /* Called on hover and on finger-down, a moment before the tap lands. */
  function warm(r) {
    const k = key(r);
    if (cache.current.has(k) || flight.current.has(k)) return;
    fetchDetail(r).catch(() => {});
  }

  function openRecipe(r) {
    setPicked(r); setDErr(false); setScreen("detail"); setStepNo(0);
    const k = key(r);
    if (cache.current.has(k)) { setDetail(cache.current.get(k)); setDBusy(false); setDLive(false); return; }
    setDetail(null);
    loadDetail(r);
  }

  async function loadDetail(r) {
    const id = ++reqId.current;
    const k = key(r);
    setDBusy(true); setDLive(true); setDErr(false);

    /* Show the recipe as it is written instead of waiting for the last token. */
    sinks.current.set(k, (txt) => {
      if (reqId.current !== id) return;
      const part = looseParse(txt);
      if (part && ((part.ingredients && part.ingredients.length) || (part.steps && part.steps.length))) {
        setDetail(part); setDBusy(false);
      }
    });

    try {
      const full = await fetchDetail(r);
      if (reqId.current === id) { setDetail(full); setDBusy(false); }
    } catch (e) {
      if (reqId.current === id) {
        setDErr(true);
        setErrNote({ message: e.message || "unknown error", hint: hintFor(e) });
        setDBusy(false);
      }
    } finally {
      sinks.current.delete(k);
      if (reqId.current === id) setDLive(false);
    }
  }

  /* --------------------- read aloud -------------------- */
  function toggleRead(text) {
    if (reading) { hush(); setReading(false); return; }
    const ok = speak(text, lang);
    setReading(ok);
  }

  /* ---------------------- screens ---------------------- */
  const Header = (
    <header
      className="flex items-center justify-between"
      style={{ padding: "14px 16px", background: C.paper, borderBottom: "2px solid " + C.line, position: "sticky", top: 0, zIndex: 20 }}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{ width: 46, height: 46, background: CARD_SKINS[0], fontSize: 24 }}
          aria-hidden="true"
        >
          🍳
        </div>
        <div>
          <div style={{ fontSize: fs(22), fontWeight: 900, color: C.ink, lineHeight: 1.1, fontFamily }}>{t.brand}</div>
          <div style={{ fontSize: fs(12), color: C.inkSoft, fontFamily }}>{t.tagline}</div>
        </div>
      </div>
      <div className="flex items-center" style={{ gap: 8 }}>
        <div className="flex items-center rounded-full" style={{ border: "2px solid " + C.line, overflow: "hidden" }}>
          {[
            { k: 0.95, l: "A" },
            { k: 1.2, l: "A" },
            { k: 1.45, l: "A" },
          ].map((o, i) => (
            <button
              key={i}
              onClick={() => setScale(o.k)}
              aria-label={t.text + " " + (i + 1)}
              style={{
                padding: "8px 12px", minHeight: 44, fontWeight: 900,
                fontSize: 12 + i * 5, lineHeight: 1,
                background: scale === o.k ? C.haldi : "#fff",
                color: C.ink, border: "none", cursor: "pointer",
              }}
            >
              {o.l}
            </button>
          ))}
        </div>
        <button
          onClick={() => setLang(rtl ? "en" : "ur")}
          className="rounded-full font-bold"
          style={{ padding: "10px 16px", minHeight: 46, background: C.ink, color: "#fff", border: "none", cursor: "pointer", fontSize: fs(15) }}
        >
          {t.lang}
        </button>
      </div>
    </header>
  );

  const Home = (
    <div style={{ padding: 16, display: "grid", gap: 18 }}>
      <section className="rounded-3xl" style={{ background: C.paper, border: "2px solid " + C.line, padding: 18 }}>
        <h2 style={{ fontSize: fs(21), fontWeight: 900, color: C.ink, marginBottom: 12 }}>{t.step1}</h2>
        <label htmlFor="ing" style={{ display: "block", fontSize: fs(15), color: C.inkSoft, marginBottom: 8 }}>
          {t.inputLabel}
        </label>
        <div className="flex" style={{ gap: 10, flexWrap: "wrap", position: "relative" }}>
          <div style={{ flex: "1 1 220px", position: "relative" }}>
            <input
              id="ing"
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setOpen(true); setHi(0); }}
              onKeyDown={onKey}
              onFocus={() => draft.trim() && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder={t.placeholder}
              dir="auto"
              autoComplete="off"
              role="combobox"
              aria-expanded={open && draft.trim().length > 0}
              aria-controls="ing-list"
              className="rounded-2xl"
              style={{
                width: "100%", minHeight: 62, padding: "0 18px", fontSize: fs(19),
                border: "2px solid " + (open && draft.trim() ? C.saffron : C.line),
                background: "#fff", color: C.ink, outlineColor: C.saffron, fontFamily,
              }}
            />

            {open && draft.trim().length > 0 && (
              <ul
                id="ing-list"
                role="listbox"
                className="rounded-2xl"
                style={{
                  position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, top: "calc(100% + 6px)",
                  zIndex: 40, background: "#fff", border: "2px solid " + C.saffron,
                  boxShadow: "0 12px 30px rgba(43,26,16,0.18)", overflow: "hidden",
                  maxHeight: 340, overflowY: "auto",
                }}
              >
                <li style={{ padding: "8px 16px", fontSize: fs(13), color: C.inkSoft, background: "#FFF7EC", fontFamily }}>
                  {t.suggestions}
                </li>

                {matches.map((m, i) => {
                  const on = hasItem(m.en);
                  return (
                    <li key={m.en} role="option" aria-selected={hi === i}>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setHi(i)}
                        onClick={() => (on ? dropItem(m.en) : addPantry(m))}
                        className="flex items-center"
                        style={{
                          width: "100%", gap: 12, minHeight: 62, padding: "10px 16px",
                          background: hi === i ? "#FFF1DC" : "#fff",
                          border: "none", borderTop: "1px solid " + C.line,
                          cursor: "pointer", textAlign: rtl ? "right" : "left",
                        }}
                      >
                        <span aria-hidden="true" style={{ fontSize: 26 }}>{m.e}</span>
                        <span style={{ flex: 1 }}>
                          <span style={{ display: "block", fontSize: fs(18), fontWeight: 800, color: C.ink, fontFamily }}>
                            {rtl ? m.ur : m.en}
                          </span>
                          <span style={{ display: "block", fontSize: fs(14), color: C.inkSoft, fontFamily }}>
                            {rtl ? m.en : m.ur}
                            {m.r && m.r[0] ? " · " + m.r[0] : ""}
                          </span>
                        </span>
                        <span style={{ fontSize: fs(15), fontWeight: 800, color: on ? C.leaf : C.saffron, fontFamily }}>
                          {on ? "✓" : "+"}
                        </span>
                      </button>
                    </li>
                  );
                })}

                <li role="option" aria-selected={hi === matches.length}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHi(matches.length)}
                    onClick={() => addTyped(draft)}
                    style={{
                      width: "100%", minHeight: 62, padding: "10px 16px",
                      background: hi === matches.length ? "#FFF1DC" : "#FAFAF7",
                      border: "none", borderTop: "1px solid " + C.line,
                      cursor: "pointer", textAlign: rtl ? "right" : "left",
                      fontSize: fs(16), fontWeight: 700, color: C.ink, fontFamily,
                    }}
                  >
                    ✏️ {t.addAsTyped(draft.trim())}
                  </button>
                </li>
              </ul>
            )}
          </div>

          <Btn onClick={() => draft.trim() && addTyped(draft)} disabled={!draft.trim()} style={{ fontSize: fs(18) }}>
            + {t.add}
          </Btn>
        </div>

        <p style={{ fontSize: fs(15), color: C.inkSoft, margin: "18px 0 10px" }}>{t.common}</p>
        <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
          {PANTRY.filter((p) => p.top).map((p) => {
            const label = rtl ? p.ur : p.en;
            const on = hasItem(p.en);
            return (
              <button
                key={p.en}
                onClick={() => (on ? dropItem(p.en) : addPantry(p))}
                className="rounded-2xl"
                style={{
                  padding: "10px 14px", minHeight: 52, fontSize: fs(16), fontWeight: 700, fontFamily,
                  border: "2px solid " + (on ? C.leaf : C.line),
                  background: on ? C.leafSoft : "#fff",
                  color: on ? C.leaf : C.ink, cursor: "pointer",
                }}
              >
                <span aria-hidden="true">{p.e}</span> {label} {on ? "✓" : ""}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl" style={{ background: C.paper, border: "2px solid " + C.line, padding: 18 }}>
        <h2 style={{ fontSize: fs(21), fontWeight: 900, color: C.ink, marginBottom: 12 }}>{t.step2}</h2>
        <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
          {[["any", t.prefAny], ["veg", t.prefVeg], ["quick", t.prefQuick], ["light", t.prefLight]].map(([k, l]) => (
            <Pill key={k} active={pref === k} onClick={() => setPref(k)}>
              <span style={{ fontSize: fs(16), fontFamily }}>{l}</span>
            </Pill>
          ))}
        </div>
        <label className="flex items-center" style={{ gap: 10, marginTop: 16, cursor: "pointer" }}>
          <input type="checkbox" checked={useWeb} onChange={(e) => setUseWeb(e.target.checked)} style={{ width: 26, height: 26, accentColor: C.saffron }} />
          <span style={{ fontSize: fs(16), color: C.inkSoft, fontFamily }}>
            🌐 {t.web} — <b style={{ color: useWeb ? C.leaf : C.inkSoft }}>{useWeb ? t.webOn : t.webOff}</b>
            <span style={{ display: "block", fontSize: fs(13) }}>{t.webNote}</span>
          </span>
        </label>
      </section>
    </div>
  );

  const Basket = (
    <div
      style={{
        position: "sticky", bottom: 0, zIndex: 20, background: C.paper,
        borderTop: "2px solid " + C.line, padding: 14, boxShadow: "0 -8px 24px rgba(43,26,16,0.08)",
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: fs(15), fontWeight: 800, color: C.ink, fontFamily }}>
          🧺 {t.yourBasket} ({items.length})
        </span>
        {items.length > 0 && (
          <button onClick={() => setItems([])} style={{ background: "none", border: "none", color: C.chili, fontWeight: 700, fontSize: fs(14), cursor: "pointer", fontFamily }}>
            {t.clear}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: fs(15), color: C.inkSoft, marginBottom: 12, fontFamily }}>{t.empty}</p>
      ) : (
        <div className="flex" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12, maxHeight: 108, overflowY: "auto" }}>
          {items.map((x) => (
            <span key={x.key} className="rounded-full flex items-center" style={{ gap: 8, background: "#FFEFD9", color: C.chili, padding: "8px 12px", fontSize: fs(15), fontWeight: 700, fontFamily }}>
              <span aria-hidden="true">{x.e}</span> {rtl ? x.ur : x.en}
              <button onClick={() => dropItem(x.key)} aria-label={"remove " + x.en} style={{ background: C.chili, color: "#fff", border: "none", borderRadius: "50%", width: 26, height: 26, fontSize: 15, cursor: "pointer", lineHeight: 1 }}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <Btn full onClick={findDishes} disabled={items.length < 1} style={{ fontSize: fs(20) }}>
        🔍 {t.find}
      </Btn>
    </div>
  );

  const Results = (
    <div style={{ padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: fs(22), fontWeight: 900, color: C.ink, fontFamily }}>{t.results}</h2>
        <Btn tone="ghost" onClick={() => setScreen("home")} style={{ fontSize: fs(15), minHeight: 52, padding: "10px 16px" }}>
          ← {t.backToBasket}
        </Btn>
      </div>

      {busy && <Spinner label={t.finding} />}
      {err && <ErrorBox t={t} onRetry={findDishes} note={errNote} />}
      {!busy && !err && recipes.length === 0 && (
        <p style={{ color: C.inkSoft, fontSize: fs(17), fontFamily }}>{t.noResults}</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14 }}>
        {recipes.map((r, i) => {
          const name = rtl ? r.ur || r.en : r.en || r.ur;
          const note = rtl ? r.note_ur || r.note_en : r.note_en || r.note_ur;
          return (
            <button
              key={r.id || i}
              onClick={() => openRecipe(r)}
              onPointerEnter={() => warm(r)}
              onPointerDown={() => warm(r)}
              onFocus={() => warm(r)}
              className="rounded-3xl"
              style={{
                background: CARD_SKINS[i % CARD_SKINS.length],
                border: "none", padding: 0, textAlign: rtl ? "right" : "left",
                cursor: "pointer", overflow: "hidden", position: "relative",
                minHeight: 178, display: "flex", flexDirection: "column", justifyContent: "flex-end",
                animation: `pkrise 0.35s ease ${i * 0.05}s both`,
                boxShadow: "0 6px 16px rgba(190,80,10,0.22)",
              }}
              aria-label={name}
            >
              <span
                aria-hidden="true"
                style={{ position: "absolute", top: 8, insetInlineEnd: 10, fontSize: 54, opacity: 0.35, lineHeight: 1 }}
              >
                {r.emoji || "🍲"}
              </span>
              <span
                aria-hidden="true"
                className="rounded-full flex items-center justify-center"
                style={{ position: "absolute", top: 10, insetInlineStart: 10, width: 28, height: 28, background: "rgba(255,255,255,0.85)", fontSize: 15 }}
              >
                🍳
              </span>

              <div style={{ padding: 12, position: "relative", zIndex: 2 }}>
                <div style={{ color: "#fff", fontWeight: 900, fontSize: fs(17), lineHeight: 1.25, marginBottom: 8, textShadow: "0 1px 3px rgba(0,0,0,0.3)", fontFamily }}>
                  {name}
                </div>
                <span className="rounded-full inline-flex items-center" style={{ gap: 6, background: "#fff", color: C.ink, padding: "6px 12px", fontWeight: 800, fontSize: fs(14), fontFamily }}>
                  🔥 {r.kcal || "—"} {t.kcal}
                </span>
                <div className="flex items-center" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <span className="rounded-full" style={{ background: "rgba(255,255,255,0.9)", color: C.leaf, padding: "4px 10px", fontSize: fs(13), fontWeight: 800, fontFamily }}>
                    🌿 {(r.uses || []).length}
                  </span>
                  <span className="rounded-full" style={{ background: "rgba(255,255,255,0.9)", color: C.ink, padding: "4px 10px", fontSize: fs(13), fontWeight: 800, fontFamily }}>
                    ⏱ {r.minutes || "—"} {t.mins}
                  </span>
                </div>
                {note && (
                  <div style={{ color: "rgba(255,255,255,0.95)", fontSize: fs(13), marginTop: 8, fontFamily }}>{note}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const Detail = (() => {
    if (!picked) return null;
    const name = detail?.title || (rtl ? picked.ur || picked.en : picked.en || picked.ur);
    const have = (picked.uses || []).filter(Boolean);
    const need = (picked.missing || []).filter(Boolean);
    return (
      <div style={{ padding: 16 }}>
        <Btn tone="ghost" onClick={() => setScreen("results")} style={{ fontSize: fs(16), marginBottom: 14 }}>
          ← {t.back}
        </Btn>

        <div className="rounded-3xl" style={{ background: CARD_SKINS[0], padding: 20, marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <span aria-hidden="true" style={{ position: "absolute", insetInlineEnd: 12, top: 6, fontSize: 88, opacity: 0.3 }}>{picked.emoji || "🍲"}</span>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: fs(26), lineHeight: 1.3, position: "relative", fontFamily }}>{name}</h1>
          {detail?.summary && <p style={{ color: "rgba(255,255,255,0.95)", fontSize: fs(16), marginTop: 8, fontFamily }}>{detail.summary}</p>}
          <div className="flex" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {[
              `🔥 ${detail?.kcal || picked.kcal || "—"} ${t.kcal}`,
              `⏱ ${detail?.minutes || picked.minutes || "—"} ${t.mins}`,
              `👥 ${detail?.servings || picked.servings || 4} ${t.serves}`,
            ].map((x) => (
              <span key={x} className="rounded-full" style={{ background: "#fff", color: C.ink, padding: "8px 14px", fontWeight: 800, fontSize: fs(14), fontFamily }}>
                {x}
              </span>
            ))}
          </div>
        </div>

        {(have.length > 0 || need.length > 0) && (
          <div className="rounded-3xl" style={{ background: C.paper, border: "2px solid " + C.line, padding: 16, marginBottom: 16 }}>
            {have.length > 0 && (
              <>
                <p style={{ fontWeight: 800, color: C.leaf, fontSize: fs(16), marginBottom: 8, fontFamily }}>✓ {t.youHave}</p>
                <div className="flex" style={{ gap: 8, flexWrap: "wrap", marginBottom: need.length ? 14 : 0 }}>
                  {have.map((x) => (
                    <span key={x} className="rounded-full" style={{ background: C.leafSoft, color: C.leaf, padding: "6px 12px", fontSize: fs(15), fontWeight: 700, fontFamily }}>{x}</span>
                  ))}
                </div>
              </>
            )}
            {need.length > 0 && (
              <>
                <p style={{ fontWeight: 800, color: C.chili, fontSize: fs(16), marginBottom: 8, fontFamily }}>🛒 {t.youNeed}</p>
                <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
                  {need.map((x) => (
                    <span key={x} className="rounded-full" style={{ background: "#FFEDE8", color: C.chili, padding: "6px 12px", fontSize: fs(15), fontWeight: 700, fontFamily }}>{x}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {dBusy && <Spinner label={t.loadingRecipe} />}
        {dErr && <ErrorBox t={t} onRetry={() => loadDetail(picked)} note={errNote} />}

        {detail && !dBusy && (
          <>
            <div className="rounded-3xl" style={{ background: C.paper, border: "2px solid " + C.line, padding: 18, marginBottom: 16 }}>
              <h2 style={{ fontSize: fs(20), fontWeight: 900, color: C.ink, marginBottom: 12, fontFamily }}>🧾 {t.ingredients}</h2>
              <ul style={{ display: "grid", gap: 10 }}>
                {(detail.ingredients || []).map((g, i) => (
                  <li key={i} className="flex items-start" style={{ gap: 10, fontSize: fs(17), color: C.ink, fontFamily }}>
                    <span style={{ color: C.saffron, fontWeight: 900 }}>•</span>
                    <span><b>{g.qty ? g.qty + " " : ""}</b>{g.item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl" style={{ background: C.paper, border: "2px solid " + C.line, padding: 18, marginBottom: 16 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: fs(20), fontWeight: 900, color: C.ink, fontFamily }}>
                  👩‍🍳 {t.method}
                  {dLive && (
                    <span style={{ fontSize: fs(13), fontWeight: 700, color: C.saffron, marginInlineStart: 10, fontFamily }}>
                      ✍️ {t.writing}
                    </span>
                  )}
                </h2>
                <Btn
                  tone="ghost"
                  onClick={() => toggleRead((detail.steps || []).map((s, i) => `${i + 1}. ${s}`).join(". "))}
                  style={{ fontSize: fs(15), minHeight: 50, padding: "8px 14px" }}
                >
                  🔊 {reading ? t.stop : t.listen}
                </Btn>
              </div>
              <ol style={{ display: "grid", gap: 16 }}>
                {(detail.steps || []).map((s, i) => (
                  <li key={i} className="flex" style={{ gap: 14 }}>
                    <span
                      className="rounded-full flex items-center justify-center"
                      style={{ minWidth: 40, height: 40, background: C.haldi, color: C.ink, fontWeight: 900, fontSize: fs(17) }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: fs(18), lineHeight: 1.7, color: C.ink, fontFamily }}>{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            {(detail.tips || []).length > 0 && (
              <div className="rounded-3xl" style={{ background: "#FFF3D6", border: "2px solid " + C.haldi, padding: 18, marginBottom: 16 }}>
                <h2 style={{ fontSize: fs(19), fontWeight: 900, color: C.ink, marginBottom: 10, fontFamily }}>💡 {t.tips}</h2>
                <ul style={{ display: "grid", gap: 8 }}>
                  {detail.tips.map((x, i) => (
                    <li key={i} style={{ fontSize: fs(16), color: C.ink, fontFamily }}>— {x}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              <Btn full tone="dark" disabled={dLive} onClick={() => { setStepNo(0); setScreen("cook"); }} style={{ fontSize: fs(19) }}>
                ▶ {t.startCooking}
              </Btn>
              <Btn full tone="ghost" onClick={() => window.print()} style={{ fontSize: fs(16) }}>
                🖨 {t.print}
              </Btn>
            </div>
          </>
        )}
      </div>
    );
  })();

  const Cook = (() => {
    if (!detail) return null;
    const steps = detail.steps || [];
    const last = stepNo >= steps.length;
    return (
      <div style={{ padding: 16, minHeight: "70vh", display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontWeight: 800, color: C.inkSoft, fontSize: fs(16), fontFamily }}>
            {last ? "🎉" : t.stepOf(stepNo + 1, steps.length)}
          </span>
          <Btn tone="ghost" onClick={() => setScreen("detail")} style={{ minHeight: 50, padding: "8px 16px", fontSize: fs(15) }}>
            ✕ {t.closeCook}
          </Btn>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {steps.map((_, i) => (
            <span key={i} style={{ flex: 1, height: 8, borderRadius: 99, background: i <= stepNo ? C.saffron : C.line }} />
          ))}
        </div>

        <div
          className="rounded-3xl flex flex-col justify-center"
          style={{ flex: 1, background: last ? C.leafSoft : C.paper, border: "2px solid " + (last ? C.leaf : C.line), padding: 24, minHeight: 260 }}
        >
          {last ? (
            <p style={{ fontSize: fs(26), fontWeight: 900, color: C.leaf, textAlign: "center", lineHeight: 1.5, fontFamily }}>
              ✅ {t.done}
            </p>
          ) : (
            <>
              <span
                className="rounded-full flex items-center justify-center"
                style={{ width: 58, height: 58, background: C.haldi, color: C.ink, fontWeight: 900, fontSize: fs(24), marginBottom: 18 }}
              >
                {stepNo + 1}
              </span>
              <p style={{ fontSize: fs(24), lineHeight: 1.8, color: C.ink, fontFamily }}>{steps[stepNo]}</p>
              <Btn
                tone="ghost"
                onClick={() => toggleRead(steps[stepNo])}
                style={{ marginTop: 20, alignSelf: "flex-start", fontSize: fs(16) }}
              >
                🔊 {reading ? t.stop : t.listen}
              </Btn>
            </>
          )}
        </div>

        <div className="flex" style={{ gap: 12 }}>
          <Btn tone="ghost" onClick={() => { hush(); setReading(false); setStepNo((n) => Math.max(0, n - 1)); }} disabled={stepNo === 0} style={{ flex: 1, fontSize: fs(18) }}>
            {rtl ? "→" : "←"} {t.prev}
          </Btn>
          {!last ? (
            <Btn onClick={() => { hush(); setReading(false); setStepNo((n) => n + 1); }} style={{ flex: 2, fontSize: fs(18) }}>
              {t.next} {rtl ? "←" : "→"}
            </Btn>
          ) : (
            <Btn tone="dark" onClick={() => setScreen("results")} style={{ flex: 2, fontSize: fs(18) }}>
              {t.finish}
            </Btn>
          )}
        </div>
      </div>
    );
  })();

  return (
    <div
      ref={topRef}
      dir={t.dir}
      style={{
        background: C.cream, minHeight: "100vh", color: C.ink,
        fontFamily, fontSize: fs(17),
        display: "flex", flexDirection: "column",
      }}
    >
      {Header}
      <main style={{ flex: 1, maxWidth: 820, width: "100%", margin: "0 auto" }}>
        {screen === "home" && Home}
        {screen === "results" && Results}
        {screen === "detail" && Detail}
        {screen === "cook" && Cook}
      </main>
      {screen === "home" && (
        <div style={{ maxWidth: 820, width: "100%", margin: "0 auto", position: "sticky", bottom: 0 }}>{Basket}</div>
      )}
    </div>
  );
}
