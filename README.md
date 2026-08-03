# Pakwan

An AI recipe agent. You tell it what is in the kitchen, it finds dishes you can
cook with those things and walks you through them, in English or Urdu.

Built for someone who is not comfortable with apps: large text, large buttons,
read-aloud instructions, and one step on the screen at a time while cooking.

---

## Getting it online

Roughly ten minutes, most of it waiting.

### 1. Get an API key

Create one at <https://console.anthropic.com> under **API Keys**. Add a few
dollars of credit. Keep the key somewhere private — it is a password that spends
money.

### 2. Put the code on GitHub

```bash
cd pakwan
git init
git add .
git commit -m "Pakwan"
```

Create an empty repository on GitHub, then follow the two commands it shows you
to push. The `.gitignore` already keeps `node_modules` and any `.env` file out.

### 3. Deploy on Vercel

1. Sign in at <https://vercel.com> with your GitHub account.
2. **Add New → Project**, pick the repository, click **Deploy**.
   Vercel detects Vite on its own; leave every build setting alone.
3. When it finishes, open **Settings → Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `ANTHROPIC_API_KEY` | your key from step 1 |

4. Go to **Deployments**, open the newest one, and choose **Redeploy**. The key
   is only picked up by a build that runs after you add it. Skipping this
   redeploy is the usual reason a fresh deploy answers "Server is missing
   ANTHROPIC_API_KEY".

You now have a URL like `pakwan.vercel.app`. Anyone can open it. No Claude
account, no sign-in, no usage limits on her side.

### 4. Set it up on her phone

Do this on her phone yourself rather than over the telephone.

1. Open the URL in Safari or Chrome.
2. **Share → Add to Home Screen.** It gets the pot icon and opens without
   browser chrome, like a normal app.
3. Set the language to اردو and tap the largest **A**. Those choices are saved
   now, so they will still be set tomorrow.

If she should always start in Urdu at the largest size, change the two constants
at the top of `src/App.jsx` before deploying:

```js
const DEFAULT_LANG = "ur";
const DEFAULT_SCALE = 1.45;
```

---

## Running it on your own machine

The recipe endpoint is a serverless function, so the plain Vite dev server
cannot answer it. Use the Vercel CLI, which runs both:

```bash
npm install
cp .env.example .env.local     # then put your real key in it
npx vercel dev
```

`npm run dev` still works for pure layout and styling work — the interface
loads, but asking for recipes fails until you use `vercel dev`.

---

## What is where

```
api/chat.js      the only file that touches your API key
src/App.jsx      the whole interface and the model prompts
src/styles.css   the dozen utility classes the app uses, no framework
public/          home-screen icons and the web manifest
```

### Things worth knowing before you change it

**The key never reaches the browser.** `api/chat.js` accepts a prompt and
returns an answer. It sets the model, the token budget and the tools itself, so
nothing in the browser can ask for something expensive.

**There is a rate limit, and it is a soft one.** Twenty calls per minute per IP,
counted in the memory of one serverless instance. It stops a runaway loop. It is
not protection against someone determined. If the URL ever spreads further than
family, move the counter to Vercel KV or Upstash Redis.

**Recipes stream.** The reply is parsed while it is still arriving, which is why
ingredients appear about a second in and steps fill in one at a time. The parser
in `looseParse` repairs half-finished JSON on purpose — do not "fix" it to be
strict.

**Web search is off by default.** It makes recipes more authentic and costs
about ten seconds. The switch is on the first screen; the default is set by
`useState(() => remember("web", false))`.

**Cost.** A recipe is a fraction of a cent without web search, a little more
with it. Ordinary family use will not be noticeable. Set a monthly spend limit
in the Anthropic console anyway.

---

## Deploying somewhere else

Netlify works with one change: move `api/chat.js` to
`netlify/functions/chat.js`, export a `handler`, and add a redirect from
`/api/chat` to `/.netlify/functions/chat` in `netlify.toml`. Cloudflare Pages
Functions is closer still — the edge-runtime handler is nearly the same shape.

Any host works as long as the API key stays on the server side. Do not build a
version that puts the key in the browser, however convenient it looks: anyone
who opens the page can read it and spend your money.
