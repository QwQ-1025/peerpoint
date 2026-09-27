# AGENTS.md — PeerPoint demo website

Instructions for any coding agent (Codex, Claude Code, Cursor…) working on this repository.
**Read this fully before changing anything.**

---

## 1. What this project is

A **clickable demonstration prototype** of PeerPoint, a peer-tutoring service concept for
Grade 10–11 AP Microeconomics students. It is a school business-project deliverable.

It is a **static site with no build step, no dependencies, no backend and no network calls**
at runtime. Four files, opened directly in a browser.

- **Repo root = this folder.** Do not modify files outside it.
- **Language of the UI: English only.** Brand name: **PeerPoint**.
- The site is live at https://qwq-1025.github.io/peerpoint/ (GitHub Pages, branch `main`, path `/`).

```
index.html   entry point — loads styles.css, data.js, app.js
styles.css   design system (:root variables, components, media queries)
data.js      all demo content: topics, mentors, practice questions, sample request
app.js       hash router + sessionStorage state + the seven page views
README.md    demo script for the presenter + acceptance checklist
.nojekyll    keep this — stops GitHub Pages running Jekyll
AGENTS.md    this file
```

---

## 2. Architecture (understand before editing)

**Routing.** Hash-based, defined by the `ROUTES` table near the top of `app.js`.
Each entry is `[regex, viewName, guard]`. Views are functions on the `V` object:
`V.home`, `V.request`, `V.matches`, `V.booking`, `V.session`, `V.practice`, `V.summary`, `V.learning`.

```
#/                     home
#/request              describe the learning gap (form)
#/matches              mentor matches
#/booking/:mentorId    choose date + time
#/session/:id          booking confirmation + session prep
#/practice/:id         independent practice question
#/summary/:id          learning summary
#/my-learning          bookings created in this browser session
```

Guards: `#/matches` and `#/booking/*` require `S.request`; `#/session|practice|summary/*`
require an existing booking. If the guard fails the router redirects to `#/request`
(functions `route()` and `bounce()`). **Keep those guards working** — deep-linking into a
page with no data must never crash.

**State.** One object `S`, persisted to `sessionStorage` under the key `peerpoint.demo.v1`.
Shape (see `blank()`):

```js
{ request, bookings[], activeId, attempt, feedback, sessionOpened, toast }
// plus transient: draft { mentorId, iso, slot, agreed, goal }
```

Rendering is `render()` → `V[view](arg)` returns an HTML string → `innerHTML` →
then `wireRequest()` / `wirePractice()` / `refreshConfirm()` attach listeners.

**Everything is client-side.** There is no server, no API, no database, no LLM call.

---

## 3. Design system — do not drift

Defined once in `styles.css` under `:root`. These exact values come from the client's
design brief. **Do not substitute "nicer" colours.**

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F7F5F0` | page background |
| `--ink` | `#203E4A` | primary text, primary buttons |
| `--surface-2` | `#EAF0F3` | secondary background / panels |
| `--gold` | `#BF8952` | accent — decorative and labels only |
| `--body` | `#263238` | body text |
| `--ok` | `#2F6B50` | success feedback |

**Typography.** Headings `Source Serif 4`; body/UI `Inter`; **body text never below 16px**.
Fonts load from Google Fonts with system fallbacks — keep the fallback stacks so the page
still renders offline.

**Aesthetic rules from the brief — do not violate:**
- Quiet, credible, friendly. Suitable for high-school students.
- **No exaggerated gradients. No looping/floating animations.** (The only `linear-gradient`
  allowed is the small CSS triangle used to draw the `<select>` arrow.)
- Establish credibility through hierarchy, whitespace and real service content — not decoration.

---

## 4. Content rules — these are graded

The project brief forbids unverified claims. **Breaking these loses marks.** Before you add
any copy, check it against this list.

**Never add:**
- ❌ Star ratings, testimonials, user counts, lesson counts, completion counts
- ❌ "Verified" / "Screened" / "Certified" badges on mentors
- ❌ Percentage match scores ("92% match")
- ❌ AP scores on mentor profiles
- ❌ Claims about score improvement, before/after gains, or predicted AP scores
- ❌ Media endorsements, school partnerships, or school logos
- ❌ Fake loading states or "AI analysing…" spinners (nothing is being analysed)
- ❌ Real tutor names, photos of real people, or real schools

**Always keep:**
- ✅ The banner wording `Sample mentor profiles for demonstration.`
- ✅ `Proposed pilot price: RMB 49` (never presented as a settled price)
- ✅ `No payment will be taken. No real session will be scheduled.`
- ✅ `Simulated classroom` + `No camera or microphone is used. No call is created.`
- ✅ The summary block "What this summary **does not claim**"
- ✅ `This session is for learning and practice, not completing graded work for me.`
- ✅ The footer line: *PeerPoint is an independent student project and is not affiliated with College Board.*

**Fixed facts that must stay consistent with the pitch deck:**
first customers are Grade 10–11 AP Microeconomics students at one school · sessions are
**25 minutes** · price is **RMB 49** (pilot assumption) · mentors are matched **by knowledge
point** · every session ends with **independent practice**.

---

## 5. Common tasks → where to edit

| Task | Where |
|---|---|
| Mentor names, focus, style, languages, session plan | `data.js` → `MENTORS` |
| Which mentor is suggested for which topic | `data.js` → `TOPICS[].mentor` |
| Topic list in the form dropdown | `data.js` → `TOPICS` |
| Practice question per topic (stem, options, explanations) | `data.js` → `PRACTICE` |
| Key takeaway per topic (used on the summary + classroom) | `data.js` → `KEY_TAKEAWAYS` |
| The one-click sample problem | `data.js` → `SAMPLE_REQUEST` |
| "Where did you get stuck?" tags | `data.js` → `STUCK_TAGS` |
| Default booking goal text | `data.js` → `BOOKING_GOAL_DEFAULT` |
| Page copy, headings, layout of any page | `app.js` → the matching `V.*` function |
| Nav links, step spine, footer | `app.js` → `nav()`, `spine()`, `footer()` |
| Colours, spacing, type scale, components | `styles.css` `:root` + component blocks |
| The two SVG illustrations (hero art, avatars) | `app.js` → `heroArt()`, `avatarSVG()` |

**Watch out — text that appears in more than one place:**
`RMB 49` appears in `V.matches`, `V.booking`, `V.session`, `V.practice` and the README.
`grep -rn "RMB 49" .` before and after changing any price or duration.

**Adding a new topic** requires three edits, or the practice page will show the wrong question:
1. add it to `TOPICS` (with a `mentor` id),
2. add an entry to `PRACTICE` with the same key,
3. add the key to `KEY_TAKEAWAYS` and, if you want the mentor to lead on it, to that mentor's `topics: []`.

---

## 6. How to run and verify

```bash
# run locally (recommended — the hash routes behave more predictably than file://)
cd "<repo root>"
python3 -m http.server 8777
# open http://127.0.0.1:8777/index.html
```

The site also works by double-clicking `index.html`.

**Always walk the whole flow after a change:**

```
Home → Try a sample problem → See mentor matches → Choose mentor →
pick a slot → tick the learning-principle box → Confirm demo booking →
Preview session → Finish demo session & practise → pick an answer →
Check my answer → See my session summary → My learning → Reset demo
```

**Acceptance checklist** (from the client brief — verify before finishing):

1. Home reaches the request form
2. Sample problem fills in one click
3. User input appears in later summaries
4. Different topics change mentor ordering
5. Mentor + date + time can be confirmed
6. Booking summary shows the choices accurately
7. Classroom preview is clearly labelled as simulated
8. Practice gives correct feedback per answer
9. Summary reflects what the user actually did
10. My Learning lists locally created bookings
11. Reset demo clears demo data
12. The whole flow works on desktop **and** mobile
13. No fabricated reviews, score gains or verified-demand claims anywhere
14. Price / duration / positioning stay consistent with the pitch deck

**Accessibility requirements that must keep working:** every input has a `<label>`; field-level
errors with `aria-invalid`; the profile modal closes with `Escape` and returns focus to the
button that opened it; status is never conveyed by colour alone (each pill has an icon **and**
a word); visible focus rings; `prefers-reduced-motion` respected; no horizontal overflow on mobile.

---

## 7. Conventions and non-negotiables

- **No build step. No npm packages. No frameworks.** Plain HTML/CSS/JS, ES5-ish syntax,
  wrapped in one IIFE in `app.js`, exposed as `window.PP`. Keep it that way unless the user
  explicitly asks for a React/TypeScript port.
- **No backend, no network calls at runtime, no analytics, no cookies.**
  Uploaded images must stay in memory (`FileReader`) — never persisted, never uploaded.
- **No secrets, tokens or personal data** in this repository. It is public.
- Dates must stay **dynamically generated** from the visitor's current date (see `nextDays()`);
  never hard-code calendar dates. Times are labelled **China Standard Time (UTC+8)**.
- Keep user-entered text escaped through `esc()` before it reaches `innerHTML`.
- Comments in English. UI copy in English.

---

## 8. Publishing changes

The local folder is a git clone of `QwQ-1025/peerpoint`; GitHub Pages rebuilds automatically.

**Preferred method — `gh` Contents API, one file at a time.**
`git push` on this machine has repeatedly failed with
`Error in the HTTP2 framing layer`, and the local `osxkeychain` credential helper can block on
an invisible keychain prompt. The API route avoids both and is the house convention.

```bash
cd "<repo root>"
# new file
gh api -X PUT repos/QwQ-1025/peerpoint/contents/<path> \
  -f message="Describe the change" -f branch=main \
  -f content="$(base64 -i <path> | tr -d '\n')"

# existing file: the API needs its current blob SHA
SHA=$(gh api repos/QwQ-1025/peerpoint/contents/<path> --jq .sha)
gh api -X PUT repos/QwQ-1025/peerpoint/contents/<path> \
  -f message="Describe the change" -f branch=main -f sha="$SHA" \
  -f content="$(base64 -i <path> | tr -d '\n')"
```

Keep the local working copy in sync afterwards (`git fetch origin && git reset --hard origin/main`),
otherwise the next API push will be based on a stale `sha`.

**Fallback — plain git**, if the API is unavailable:

```bash
git add -A
git -c user.name="QwQ-1025" -c user.email="QwQ-1025@users.noreply.github.com" commit -m "Describe the change"
GIT_TERMINAL_PROMPT=0 git -c http.version=HTTP/1.1 \
  -c credential.helper= -c credential.helper='!gh auth git-credential' push origin main
```

Verify the live copy afterwards (hard-refresh to bypass cache):

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://qwq-1025.github.io/peerpoint/
```

Do **not** swap this repository to a different branch, and do **not** delete `.nojekyll`.

---

## 9. Testing tips (learned the hard way)

- When driving the app from a script, remember that `location.hash = "..."` fires
  `hashchange` **asynchronously**. To assert immediately after navigating, dispatch it yourself:
  ```js
  location.hash = "#/matches";
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  ```
- Assert on **`textContent`, not `innerText`**, for phrase checks — `innerText` inserts line
  breaks where text wraps on screen, so `"does not claim"` can become `"does not\nclaim"`.
- To check the mobile layout, load the site inside a narrow `<iframe>` (e.g. 390px wide) —
  media queries evaluate against the iframe viewport.
- The full flow can be exercised without any UI clicking:
  `PP.sample()`, `PP.choose('alex')`, `PP.slot(iso,time)`, `PP.confirm()`, `PP.check()`,
  `PP.go('#/summary/' + id)`, `PP.reset()`.

---

## 10. Out of scope unless the user explicitly asks

Real accounts · payment · video calls · real mentor scheduling · a database · a mentor admin
console · an automatic grading model · server-side rendering · a React rewrite.
The prototype must keep working with none of these present.
