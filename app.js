/* ============================================================
   PeerPoint — demo application
   Hash router, sessionStorage state, no backend, no external calls.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     State
     --------------------------------------------------------- */
  const KEY = "peerpoint.demo.v1";

  const blank = () => ({
    request: null,
    bookings: [],          // {id, mentorId, dateISO, dateLabel, slot, goal, agreed, createdAt, stage}
    activeId: null,
    attempt: null,         // {choiceId, correct}
    feedback: null,        // {clarity, price, improve}
    sessionOpened: false,
    toast: "",
  });

  let S = load();

  function load() {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return blank();
      return Object.assign(blank(), JSON.parse(raw));
    } catch (e) { return blank(); }
  }
  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }
  function reset() {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    S = blank();
    location.hash = "#/";
    render();
  }

  /* ---------------------------------------------------------
     Small helpers
     --------------------------------------------------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const money = (n) => "RMB " + n;
  const topicById = (id) => TOPICS.find((t) => t.id === id) || null;
  const mentorById = (id) => MENTORS.find((m) => m.id === id) || null;
  const bookingById = (id) => S.bookings.find((b) => b.id === id) || null;

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  /* Wall-clock date in China Standard Time (UTC+8) */
  function nowCST() {
    const d = new Date();
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000 + 8 * 3600000);
  }
  function nextDays(n) {
    const base = nowCST();
    const out = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(base.getTime() + i * 86400000);
      out.push({
        iso: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"),
        dow: DOW[d.getDay()],
        day: d.getDate(),
        mon: MON[d.getMonth()],
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: i === 0,
      });
    }
    return out;
  }
  function slotsFor(day) {
    const times = day.isWeekend ? ["10:00", "14:00", "19:00"] : ["18:00", "19:00", "20:00"];
    if (!day.isToday) return times;
    const nowH = nowCST().getHours() + nowCST().getMinutes() / 60;
    return times.filter((t) => parseInt(t, 10) > nowH);
  }
  function addMin(t, mins) {
    const parts = String(t).split(":");
    const total = Number(parts[0]) * 60 + Number(parts[1]) + mins;
    return String(Math.floor(total / 60) % 24).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
  }
  function fmtDate(iso) {
    const p = String(iso).split("-");
    const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return DOW[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()];
  }

  /* ---------------------------------------------------------
     Router
     --------------------------------------------------------- */
  const ROUTES = [
    [/^#\/?$/,                    "home",      null],
    [/^#\/request\/?$/,           "request",   null],
    [/^#\/matches\/?$/,           "matches",   "request"],
    [/^#\/booking\/([\w-]+)$/,    "booking",   "request"],
    [/^#\/session\/([\w-]+)$/,    "session",   "booking"],
    [/^#\/practice\/([\w-]+)$/,   "practice",  "booking"],
    [/^#\/summary\/([\w-]+)$/,    "summary",   "booking"],
    [/^#\/my-learning\/?$/,       "learning",  null],
  ];

  function route() {
    const hash = location.hash || "#/";
    for (const [re, view, guard] of ROUTES) {
      const m = hash.match(re);
      if (!m) continue;
      const arg = m[1] || null;

      if (guard === "request" && !S.request) return bounce("request");
      if (guard === "booking") {
        const b = bookingById(arg);
        if (!b) return bounce("request");
      }
      return { view, arg };
    }
    return bounce("home");
  }
  function bounce(to) {
    S.toast = to === "request"
      ? "Start by describing the problem you want help with."
      : "";
    save();
    if (location.hash !== "#/" + (to === "request" ? "request" : "")) {
      location.hash = "#/" + (to === "request" ? "request" : "");
    }
    return { view: to, arg: null };
  }

  /* ---------------------------------------------------------
     Shared fragments
     --------------------------------------------------------- */
  function demobar() {
    return "";
  }

  function nav(active) {
    const link = (id, label, hash) =>
      `<button class="nav__link" data-nav="${id}" ${active === id ? 'aria-current="page"' : ""}
        onclick="PP.go('${hash}')">${label}</button>`;
    return `
    <header class="nav">
      <div class="nav__inner">
        <button class="brand" onclick="PP.go('#/')" aria-label="PeerPoint home">
          <span class="brand__mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.2" stroke="#203E4A" stroke-width="1.4"/>
              <circle cx="8" cy="8" r="1.7" fill="#BF8952"/>
            </svg>
          </span>
          <span>
            <span class="brand__name">PeerPoint</span>
            <span class="brand__tag">AP peer tutoring</span>
          </span>
        </button>

        <button class="nav__toggle" aria-expanded="false" aria-controls="navlinks"
                onclick="PP.toggleNav(this)">Menu</button>

        <nav class="nav__links" id="navlinks" aria-label="Main">
          ${link("how", "How it works", "#/")}
          ${link("find", "Find a mentor", S.request ? "#/matches" : "#/request")}
          ${link("learning", "My learning", "#/my-learning")}
          <span class="demo-chip" title="This is a demonstration prototype with sample data">Demo</span>
          <button class="btn-reset" onclick="PP.reset()">Reset demo</button>
        </nav>
      </div>
    </header>`;
  }

  function spine(current) {
    const steps = [
      ["request", "Describe your gap"],
      ["matches", "Mentor matches"],
      ["booking", "Book the session"],
      ["session", "Session prep"],
      ["practice", "Independent practice"],
      ["summary", "Summary"],
    ];
    const order = steps.map((s) => s[0]);
    const ci = order.indexOf(current);
    return `<ol class="spine">${steps.map(([id, label], i) => {
      const state = i < ci ? "done" : i === ci ? "current" : "todo";
      return `<li data-state="${state}">
        <span class="n" aria-hidden="true">${i < ci ? "✓" : i + 1}</span>${esc(label)}
        <span class="sr-only">${state === "done" ? "completed" : state === "current" ? "current step" : "not started"}</span>
      </li>`;
    }).join("")}</ol>`;
  }

  function footer() {
    return `
    <footer class="footer">
      <div class="wrap">
        <div class="between">
          <div><strong style="color:var(--ink)">PeerPoint</strong> — Bring one problem. Practise the next one independently.</div>
          <div class="row" style="gap:16px">
            <button class="nav__link" onclick="PP.go('#/')">About PeerPoint</button>
            <button class="nav__link" onclick="PP.demoInfo()">Demo information</button>
          </div>
        </div>
        <p class="footer__note">
          PeerPoint is an independent student project and is not affiliated with College Board.
          This site is a demonstration prototype built for a school business project: it uses local sample data,
          takes no payment, and schedules no real sessions.
        </p>
      </div>
    </footer>`;
  }

  function avatarSVG(name, seed) {
    const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2);
    const tones = ["#EAF0F3", "#F5EDE3", "#E7F0EA"];
    const bg = tones[seed % tones.length];
    return `<svg viewBox="0 0 54 54" width="54" height="54" role="img" aria-label="Illustrated avatar for ${esc(name)}">
      <rect width="54" height="54" fill="${bg}"/>
      <circle cx="27" cy="21" r="9" fill="#203E4A" opacity=".18"/>
      <path d="M9 54c0-10 8-17 18-17s18 7 18 17z" fill="#203E4A" opacity=".18"/>
      <text x="27" y="33" text-anchor="middle" font-family="Source Serif 4, Georgia, serif"
            font-size="16" font-weight="600" fill="#203E4A">${initials}</text>
    </svg>`;
  }

  function heroArt() {
    return `
    <svg viewBox="0 0 420 300" width="100%" height="auto" role="img"
         aria-label="Illustration: two students working through an economics question together at a desk.">
      <rect width="420" height="300" fill="#FFFFFF"/>
      <rect x="20" y="20" width="180" height="120" rx="8" fill="#EAF0F3" stroke="#DFE3E1"/>
      <path d="M40 118 L92 74 L146 96 L182 52" fill="none" stroke="#203E4A" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M40 66 L96 96 L150 62 L182 88" fill="none" stroke="#BF8952" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="5 5"/>
      <circle cx="92" cy="74" r="3.6" fill="#203E4A"/>
      <circle cx="96" cy="96" r="3.6" fill="#BF8952"/>
      <text x="36" y="44" font-family="Inter, sans-serif" font-size="11" fill="#5C6B70">PRICE</text>
      <text x="176" y="140" text-anchor="end" font-family="Inter, sans-serif" font-size="11" fill="#5C6B70">QUANTITY</text>

      <rect x="22" y="166" width="240" height="112" rx="8" fill="#F5EDE3" stroke="#E7D5BE"/>
      <line x1="42" y1="200" x2="242" y2="200" stroke="#BF8952" stroke-width="1.4" opacity=".55"/>
      <line x1="42" y1="232" x2="242" y2="232" stroke="#BF8952" stroke-width="1.4" opacity=".55"/>
      <text x="42" y="192" font-family="Inter, sans-serif" font-size="11.5" fill="#6B4E2E">Country C: 4 ÷ 12 = 1/3 banana per apple</text>
      <text x="42" y="224" font-family="Inter, sans-serif" font-size="11.5" fill="#6B4E2E">Country D: 8 ÷ 8 = 1 banana per apple</text>
      <text x="42" y="262" font-family="Inter, sans-serif" font-size="11.5" font-weight="600" fill="#203E4A">Lower opportunity cost wins.</text>

      <circle cx="320" cy="92" r="26" fill="#EAF0F3" stroke="#203E4A" stroke-width="1.4"/>
      <path d="M292 176c0-20 12-34 28-34s28 14 28 34z" fill="#EAF0F3" stroke="#203E4A" stroke-width="1.4"/>
      <circle cx="372" cy="118" r="22" fill="#F5EDE3" stroke="#203E4A" stroke-width="1.4"/>
      <path d="M350 176c0-17 10-29 22-29s22 12 22 29z" fill="#F5EDE3" stroke="#203E4A" stroke-width="1.4"/>
      <path d="M300 234h108" stroke="#DFE3E1" stroke-width="2" stroke-linecap="round"/>
      <text x="354" y="266" text-anchor="middle" font-family="Inter, sans-serif" font-size="11.5" fill="#5C6B70">one question, two people</text>
    </svg>`;
  }

  /* ---------------------------------------------------------
     Views
     --------------------------------------------------------- */
  const V = {};

  /* ---- Home ---- */
  V.home = () => `
    ${nav("how")}
    <main class="wrap">
      <section class="hero">
        <div>
          <div class="eyebrow">Focused support for AP Microeconomics</div>
          <h1>Get help with the concept that&rsquo;s holding you back.</h1>
          <p class="lede mt-16">Share where you got stuck, meet a senior mentor, and practise the next question independently.</p>
          <div class="row mt-24">
            <button class="btn btn--primary" onclick="PP.go('#/request')">Find my mentor</button>
            <button class="btn btn--ghost" onclick="PP.sample()">Try a sample problem</button>
          </div>
          <p class="hint mt-16">First customers: Grade 10–11 AP Microeconomics students at one school. This prototype uses local sample data.</p>
        </div>
        <div class="hero__art">${heroArt()}</div>
      </section>

      <hr class="hr">

      <section id="how" class="section">
        <div class="eyebrow">How it works</div>
        <h2>Three steps, one question at a time.</h2>
        <div class="grid grid--3 mt-24">
          <div class="card step3__item" style="border-bottom:0;padding:22px">
            <div class="step3__n" aria-hidden="true">1</div>
            <div><h3>Share your question</h3>
            <p class="mb-0 muted">Upload the question and your attempt, and say where your reasoning stopped working.</p></div>
          </div>
          <div class="card step3__item" style="border-bottom:0;padding:22px">
            <div class="step3__n" aria-hidden="true">2</div>
            <div><h3>Meet a topic-matched mentor</h3>
            <p class="mb-0 muted">A senior student whose focus matches your knowledge point, for a 25-minute session.</p></div>
          </div>
          <div class="card step3__item" style="border-bottom:0;padding:22px">
            <div class="step3__n" aria-hidden="true">3</div>
            <div><h3>Check your understanding</h3>
            <p class="mb-0 muted">A new question on your own, so understanding is not mistaken for being able to apply it.</p></div>
          </div>
        </div>
      </section>

      <section class="section section--tight">
        <dl class="factrow">
          <div class="fact"><dt>Session length</dt><dd>25-minute session</dd></div>
          <div class="fact"><dt>Price</dt><dd>Proposed pilot price: RMB 49</dd></div>
          <div class="fact"><dt>Afterwards</dt><dd>A new question to try afterward</dd></div>
        </dl>
        <div class="notice notice--calm mt-24">
          <span class="notice__icon" aria-hidden="true">ℹ</span>
          <div>Mentors would be screened through subject checks and a short teaching demonstration.
          A high exam score on its own is not treated as proof of teaching ability.</div>
        </div>
      </section>
    </main>
    ${footer()}`;

  /* ---- Request ---- */
  V.request = () => {
    const r = S.request || {};
    const topic = r.topic || "";
    const attached = r.attachName;
    return `
    ${nav("find")}
    <main class="wrap wrap--narrow">
      ${spine("request")}
      <h1>Where are you getting stuck?</h1>
      <p class="lede mt-8">Show us what you tried so we can suggest a mentor who fits your question.</p>

      <div class="notice mt-24">
        <span class="notice__icon" aria-hidden="true">◈</span>
        <div><strong>Demo form.</strong> Nothing is uploaded. Your answers stay in this browser tab and are cleared by
        <em>Reset demo</em>.</div>
      </div>

      <form id="reqForm" class="card mt-24" novalidate>
        <div class="field">
          <label class="label" for="f-subject">Subject</label>
          <input class="input" id="f-subject" value="AP Microeconomics" readonly
                 aria-describedby="h-subject">
          <p class="hint" id="h-subject">This prototype supports one subject only.</p>
        </div>

        <div class="field">
          <label class="label" for="f-topic">Topic <span class="req" aria-hidden="true">*</span></label>
          <select class="select" id="f-topic" aria-describedby="e-topic">
            <option value="">Choose a topic…</option>
            ${TOPICS.map((t) => `<option value="${t.id}" ${topic === t.id ? "selected" : ""}>${esc(t.label)}</option>`).join("")}
          </select>
          <p class="field-error" id="e-topic" hidden></p>
        </div>

        <div class="field">
          <label class="label" for="f-question">Your question <span class="req" aria-hidden="true">*</span></label>
          <textarea class="textarea" id="f-question" aria-describedby="e-question"
            placeholder="Paste or type the question you were working on.">${esc(r.question || "")}</textarea>
          <p class="field-error" id="e-question" hidden></p>
        </div>

        <div class="field">
          <label class="label" for="f-attempt">Your attempt <span class="req" aria-hidden="true">*</span></label>
          <textarea class="textarea" id="f-attempt" aria-describedby="e-attempt"
            placeholder="What did you try? Which step stopped making sense?">${esc(r.attempt || "")}</textarea>
          <p class="field-error" id="e-attempt" hidden></p>
        </div>

        <div class="field">
          <span class="label" id="l-stuck">Where did you get stuck? <span class="muted" style="font-weight:400">(optional)</span></span>
          <div class="chips" role="group" aria-labelledby="l-stuck" id="stuckChips">
            ${STUCK_TAGS.map((t) => `<button type="button" class="chip" data-stuck="${esc(t)}"
              aria-pressed="${r.stuck === t}">${esc(t)}</button>`).join("")}
          </div>
        </div>

        <div class="field">
          <span class="label" id="l-lang">Preferred language</span>
          <div class="chips" role="group" aria-labelledby="l-lang" id="langChips">
            ${LANGUAGES.map((l) => `<button type="button" class="chip" data-lang="${esc(l)}"
              aria-pressed="${(r.language || "Either") === l}">${esc(l)}</button>`).join("")}
          </div>
        </div>

        <div class="field">
          <span class="label" id="l-attach">Attach your work — optional</span>
          <div class="attach" role="button" tabindex="0" id="attachBtn"
               aria-labelledby="l-attach" onclick="PP.pickFile()" onkeydown="PP.attachKey(event)">
            <span class="attach__big">Choose an image of your working</span>
            PNG or JPG · preview only
          </div>
          <input type="file" id="f-file" accept="image/*" class="sr-only" onchange="PP.fileChosen(event)">
          <p class="hint">Preview only. Your file stays in this browser session.</p>
          <div class="preview" id="previewBox" ${attached ? "" : "hidden"}>
            <img id="previewImg" alt="Preview of the work you attached" ${attached ? `src="${S.attachData || ""}"` : ""}>
            <div>
              <div class="mono" id="previewName">${esc(attached || "")}</div>
              <button type="button" class="btn btn--quiet btn--sm mt-8" onclick="PP.clearFile()">Remove</button>
            </div>
          </div>
        </div>

        <hr class="hr">
        <div class="row between">
          <button type="button" class="btn btn--gold" onclick="PP.sample()">Use sample problem</button>
          <button type="submit" class="btn btn--primary">See mentor matches</button>
        </div>
      </form>
    </main>
    ${footer()}`;
  };

  /* ---- Matches ---- */
  V.matches = () => {
    const r = S.request;
    const topic = topicById(r.topic);
    const preferred = topic ? topic.mentor : null;
    const ordered = MENTORS.slice().sort((a, b) =>
      (a.id === preferred ? -1 : 0) - (b.id === preferred ? -1 : 0));
    const stuck = r.stuck ? `<dt>Difficulty</dt><dd>${esc(r.stuck)}</dd>` : "";

    return `
    ${nav("find")}
    <main class="wrap">
      ${spine("matches")}
      <div class="between">
        <div>
          <h1>Mentors for your learning gap</h1>
          <p class="lede mt-8">Matched on the knowledge point in your question — not on who is simply available.</p>
        </div>
        <button class="btn btn--quiet btn--sm" onclick="PP.go('#/request')">Edit my request</button>
      </div>

      <div class="card card--tint mt-24">
        <div class="panel-title">Your request</div>
        <dl class="slist">
          <div><dt>Subject</dt><dd>${esc(r.subject)}</dd></div>
          <div><dt>Topic</dt><dd>${esc(topic ? topic.label : "—")}</dd></div>
          ${stuck}
          <div><dt>Preferred language</dt><dd>${esc(r.language || "Either")}</dd></div>
        </dl>
      </div>

      <div class="notice mt-24">
        <span class="notice__icon" aria-hidden="true">◈</span>
        <div><strong>Sample mentor profiles for demonstration.</strong> These are fictional profiles used to show
        how matching would work. They are not screened, verified or rated.</div>
      </div>

      <div class="grid grid--3 mt-24">
        ${ordered.map((m, i) => {
          const suggested = m.id === preferred;
          const reason = (m.reason && (m.reason[r.topic] || m.reason._default)) || "";
          return `
          <article class="mentor" data-suggested="${suggested}">
            <div class="mentor__head">
              <span class="avatar">${avatarSVG(m.name, i)}</span>
              <div>
                <div class="mentor__name">${esc(m.name)}</div>
                <div class="mentor__role">${esc(m.role)}</div>
              </div>
            </div>
            ${suggested ? `<div><span class="tag-suggested">Suggested for your topic</span></div>` : ""}
            <dl class="mentor__rows">
              <div><dt>Focus</dt><dd>${esc(m.focus)}</dd></div>
              <div><dt>Style</dt><dd>${esc(m.style)}</dd></div>
              <div><dt>Languages</dt><dd>${esc(m.languages)}</dd></div>
            </dl>
            <p class="mentor__why mb-0">${esc(reason)}</p>
            <dl class="mentor__rows">
              <div><dt>Session</dt><dd>25-minute session</dd></div>
              <div><dt>Price</dt><dd>Proposed pilot price: RMB 49</dd></div>
            </dl>
            <div class="mentor__foot">
              <button class="btn btn--quiet btn--sm" onclick="PP.profile('${m.id}', this)">View profile</button>
              <button class="btn btn--primary btn--sm" onclick="PP.choose('${m.id}')">Choose mentor</button>
            </div>
          </article>`;
        }).join("")}
      </div>
    </main>
    ${footer()}`;
  };

  /* ---- Booking ---- */
  V.booking = (mentorId) => {
    const m = mentorById(mentorId) || MENTORS[0];
    const r = S.request;
    const topic = topicById(r.topic);
    const days = nextDays(7);
    const draft = S.draft || (S.draft = {});
    const goal = draft.goal || BOOKING_GOAL_DEFAULT;

    return `
    ${nav("find")}
    <main class="wrap">
      ${spine("booking")}
      <h1>Plan your focused session</h1>
      <p class="lede mt-8">Choose a time that works. Nothing is charged and no real session is scheduled.</p>

      <div class="grid grid--split mt-24">
        <div class="stack">
          <section class="card">
            <div class="between">
              <h3>Sample availability</h3>
              <span class="muted" style="font-size:13.5px">China Standard Time (UTC+8)</span>
            </div>
            <p class="hint mb-16">Dates are generated from today. Times already passed are not offered.</p>

            <div class="stack" id="dayList">
              ${days.map((d) => {
                const times = slotsFor(d);
                if (!times.length) return "";
                return `
                <div>
                  <div style="font-size:14px;font-weight:600;color:var(--ink);margin-bottom:8px">
                    ${d.isToday ? "Today · " : ""}${fmtDate(d.iso)}
                  </div>
                  <div class="slotgrid" role="group" aria-label="Times on ${fmtDate(d.iso)}">
                    ${times.map((t) => {
                      const sel = draft.iso === d.iso && draft.slot === t;
                      return `<button type="button" class="slot" data-iso="${d.iso}" data-slot="${t}"
                        aria-pressed="${sel}" onclick="PP.slot('${d.iso}','${t}')">
                        <span class="slot__dow">${d.dow} ${d.day} ${d.mon}</span>
                        <span class="slot__time">${t}–${addMin(t, 25)}</span>
                      </button>`;
                    }).join("")}
                  </div>
                </div>`;
              }).join("")}
            </div>
          </section>

          <section class="card">
            <h3>Before you continue</h3>
            <label class="check mt-16">
              <input type="checkbox" id="agree" ${draft.agreed ? "checked" : ""} onchange="PP.agree(this.checked)">
              <span>This session is for learning and practice, not completing graded work for me.</span>
            </label>
          </section>
        </div>

        <aside class="stack">
          <section class="card">
            <div class="panel-title">Booking summary</div>
            <div class="mentor__head mb-16">
              <span class="avatar">${avatarSVG(m.name, MENTORS.indexOf(m))}</span>
              <div>
                <div class="mentor__name">${esc(m.name)}</div>
                <div class="mentor__role">${esc(m.role)}</div>
              </div>
            </div>
            <dl class="slist">
              <div><dt>Mentor</dt><dd>${esc(m.name)}</dd></div>
              <div><dt>Subject</dt><dd>${esc(r.subject)}</dd></div>
              <div><dt>Topic</dt><dd>${esc(topic ? topic.label : "—")}</dd></div>
              <div><dt>Date and time</dt><dd id="sumWhen">${draft.iso ? fmtDate(draft.iso) + " · " + draft.slot : "Not selected yet"}</dd></div>
              <div><dt>Duration</dt><dd>25 minutes</dd></div>
              <div><dt>Price</dt><dd>Proposed pilot price: RMB 49</dd></div>
            </dl>

            <div class="field mt-16">
              <label class="label" for="f-goal">What would you like to understand by the end?</label>
              <textarea class="textarea" id="f-goal" style="min-height:82px"
                oninput="PP.goal(this.value)">${esc(goal)}</textarea>
            </div>

            <button class="btn btn--primary btn--wide" id="confirmBtn"
              ${(!draft.iso || !draft.agreed) ? "disabled" : ""}
              onclick="PP.confirm()">Confirm demo booking</button>
            <p class="hint mb-0">No payment will be taken. No real session will be scheduled.</p>
          </section>
        </aside>
      </div>
    </main>
    ${footer()}`;
  };

  /* ---- Session ---- */
  V.session = (id) => {
    const b = bookingById(id);
    const m = mentorById(b.mentorId);
    const topic = topicById(S.request.topic);
    if (!b.sessionOpenedAt) { b.sessionOpenedAt = null; }

    return `
    ${nav("find")}
    <main class="wrap">
      ${spine("session")}
      <h1>Your demo session is booked</h1>
      <p class="lede mt-8">Here is what to have ready, and how the 25 minutes are planned.</p>

      <div class="notice mt-24">
        <span class="notice__icon" aria-hidden="true">◈</span>
        <div><strong>Nothing has been scheduled.</strong> This is a walkthrough of the service using sample data —
        no mentor has been contacted and no video call will start.</div>
      </div>

      <div class="grid grid--2 mt-24">
        <section class="card">
          <div class="panel-title">Session</div>
          <dl class="slist">
            <div><dt>Mentor</dt><dd>${esc(m.name)}</dd></div>
            <div><dt>Topic</dt><dd>${esc(topic ? topic.label : "—")}</dd></div>
            <div><dt>Date and time</dt><dd>${esc(fmtDate(b.dateISO))} · ${esc(b.slot)}–${addMin(b.slot, 25)} (UTC+8)</dd></div>
            <div><dt>Duration</dt><dd>25 minutes</dd></div>
            <div><dt>Price</dt><dd>Proposed pilot price: RMB 49</dd></div>
          </dl>
          <div class="mt-16">
            <div class="panel-title">Your learning goal</div>
            <p class="mb-0">${esc(b.goal || "—")}</p>
          </div>
        </section>

        <section class="card card--tint">
          <div class="panel-title">Preparation checklist</div>
          <ul style="margin:0;padding-left:20px;display:grid;gap:10px">
            <li>Bring your original question.</li>
            <li>Keep your attempt available.</li>
            <li>Be ready to explain your thinking.</li>
          </ul>
        </section>
      </div>

      <section class="card mt-24">
        <div class="panel-title">How the 25 minutes are planned</div>
        <div class="grid grid--3">
          ${m.sessionPlan.map(([t, title, desc]) => `
            <div class="step3__item" style="border-bottom:0;padding:14px 0">
              <div class="step3__n" aria-hidden="true" style="width:34px;height:34px;font-size:13px">${esc(t.replace(" min", ""))}<span class="sr-only"> minutes</span></div>
              <div><h3 style="font-size:17px">${esc(title)}</h3><p class="mb-0 muted">${esc(desc)}</p></div>
            </div>`).join("")}
        </div>
        <p class="hint mb-0">A suggested structure — the mentor would adjust it to the question.</p>
      </section>

      <section class="mt-24">
        <button class="btn btn--ghost" id="previewBtn" onclick="PP.togglePreview()" aria-expanded="false"
          aria-controls="classroom">Preview session</button>

        <div id="classroom" class="classroom mt-16" hidden>
          <div class="classroom__bar">
            <span class="status status--ready"><span aria-hidden="true">▶</span> Simulated classroom</span>
            <span>No camera or microphone is used. No call is created.</span>
          </div>
          <div class="classroom__body">
            <div class="row" style="gap:14px;align-items:center">
              <span class="avatar">${avatarSVG(m.name, MENTORS.indexOf(m))}</span>
              <div>
                <div class="mentor__name">${esc(m.name)}</div>
                <div class="mentor__role">${esc(m.focus)}</div>
              </div>
            </div>

            <div class="recap">
              <div class="panel-title" style="margin-bottom:6px">Your question</div>
              ${esc(S.request.question)}
            </div>

            <div class="card card--flush" style="padding:16px">
              <div class="panel-title">Shared notes</div>
              <p class="mb-8"><strong>${esc(KEY_TAKEAWAYS[S.request.topic] || "The idea behind your question.")}</strong></p>
              <p class="mb-8 muted">Alex reads your attempt first: you compared how much each country could produce,
              rather than what each one gives up.</p>
              <p class="mb-0 muted">The table is rebuilt with you: for each good, write what is given up per unit,
              then compare the same good in both countries.</p>
            </div>

            <div class="notice notice--calm">
              <span class="notice__icon" aria-hidden="true">ℹ</span>
              <div>This panel is a static illustration of a session. It does not connect to anyone.</div>
            </div>
          </div>
        </div>
      </section>

      <div class="row mt-32">
        <button class="btn btn--primary" onclick="PP.finishSession('${b.id}')">Finish demo session &amp; practise</button>
        <button class="btn btn--quiet" onclick="PP.go('#/my-learning')">My learning</button>
      </div>
    </main>
    ${footer()}`;
  };

  /* ---- Practice ---- */
  V.practice = (id) => {
    const b = bookingById(id);
    const q = PRACTICE[S.request.topic];
    const a = S.attempt;
    const topic = topicById(S.request.topic);

    return `
    ${nav("find")}
    <main class="wrap">
      ${spine("practice")}
      <h1>Try the next question on your own</h1>
      <p class="lede mt-8">Apply the idea before opening the explanation.</p>

      <div class="grid grid--split mt-24">
        <section class="card">
          <div class="panel-title">Question · ${esc(topic ? topic.label : "")}</div>
          <p class="qstem">${esc(q.stem)}</p>
          <div class="opts" id="optList" role="group" aria-label="Answer choices">
            ${q.options.map((o) => {
              const selected = a && a.choiceId === o.id;
              return `<button type="button" class="opt" data-opt="${o.id}" aria-pressed="${selected}"
                ${a ? "disabled" : ""} onclick="PP.pick('${o.id}')">
                <span class="opt__l" aria-hidden="true">${o.id}</span>
                <span>${esc(o.text)}</span>
              </button>`;
            }).join("")}
          </div>

          <div class="row mt-24">
            <button class="btn btn--primary" id="checkBtn" ${a ? "disabled" : "disabled"} onclick="PP.check()">Check my answer</button>
            <span class="hint" id="checkHint">Choose an answer first.</span>
          </div>

          <div id="verdictBox" class="mt-24">${a ? verdictHTML(q, a) : ""}</div>
        </section>

        <aside class="stack">
          <section class="card card--tint">
            <div class="panel-title">Why this question</div>
            <p class="mb-0">It uses the same idea as your original question with different numbers. Solving it
            unaided is the signal that the explanation landed — one attempt is not proof of learning.</p>
          </section>

          <section class="card" id="fbCard" ${a ? "" : "hidden"}>
            <div class="panel-title">Two quick questions</div>
            <div class="field">
              <span class="label" id="l-clarity">How clear was the explanation?</span>
              <div class="scale" role="group" aria-labelledby="l-clarity" id="clarityScale">
                ${["1","2","3","4","5"].map((n) => `<button type="button" data-clarity="${n}"
                  aria-pressed="${S.feedback && S.feedback.clarity === n}">${n}</button>`).join("")}
              </div>
              <div class="scale-labels"><span>Not clear</span><span>Very clear</span></div>
            </div>
            <div class="field">
              <span class="label" id="l-price">Would you consider booking at ${money(49)}?</span>
              <div class="chips" role="group" aria-labelledby="l-price" id="priceChips">
                ${["Yes","Maybe","No"].map((v) => `<button type="button" class="chip" data-price="${v}"
                  aria-pressed="${S.feedback && S.feedback.price === v}">${v}</button>`).join("")}
              </div>
            </div>
            <div class="field">
              <label class="label" for="f-improve">What should we improve? <span class="muted" style="font-weight:400">(optional)</span></label>
              <textarea class="textarea" id="f-improve" style="min-height:74px"
                oninput="PP.improve(this.value)">${esc((S.feedback && S.feedback.improve) || "")}</textarea>
            </div>
            <button class="btn btn--primary btn--wide" onclick="PP.toSummary('${b.id}')">See my session summary</button>
            <p class="hint mb-0">Answers are kept only in this demo session. They are not research data.</p>
          </section>
        </aside>
      </div>
    </main>
    ${footer()}`;
  };

  function verdictHTML(q, a) {
    const chosen = q.options.find((o) => o.id === a.choiceId);
    const right = chosen && chosen.correct;
    return `
    <div class="verdict ${right ? "verdict--ok" : "verdict--no"}">
      <div class="row mb-8">
        <span class="status ${right ? "status--done" : "status--ready"}">
          <span aria-hidden="true">${right ? "✓" : "!"}</span>${right ? "Correct" : "Not yet"}
        </span>
        <span class="muted" style="font-size:13.5px">attempt 1 of 2</span>
      </div>
      <h3>${right ? "That is the right reasoning." : "Not quite — check which quantity you compared."}</h3>
      <p class="mb-0">${esc(right ? q.correct : q.incorrect)}</p>
      <ul class="working">${q.working.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
      <p class="hint mb-0">This is one question, not a unit-level result, and it says nothing about an AP score.</p>
    </div>`;
  }

  /* ---- Summary ---- */
  V.summary = (id) => {
    const b = bookingById(id);
    const m = mentorById(b.mentorId);
    const q = PRACTICE[S.request.topic];
    const topic = topicById(S.request.topic);
    const a = S.attempt;
    const done = !!a;
    const right = done && q.options.find((o) => o.id === a.choiceId).correct;

    return `
    ${nav("learning")}
    <main class="wrap">
      ${spine("summary")}
      <h1>Your session summary</h1>
      <p class="lede mt-8">Everything below comes from what you entered in this walkthrough.</p>

      <div class="grid grid--split mt-24">
        <section class="card">
          <div class="panel-title">What happened</div>
          <dl class="slist">
            <div><dt>Topic practised</dt><dd>${esc(topic ? topic.label : "—")}</dd></div>
            <div><dt>Mentor</dt><dd>${esc(m.name)} <span class="muted">(sample profile)</span></dd></div>
            <div><dt>Original question</dt><dd>${esc(S.request.question)}</dd></div>
            <div><dt>Learning goal</dt><dd>${esc(b.goal || "—")}</dd></div>
            <div><dt>Key takeaway</dt><dd>${esc(KEY_TAKEAWAYS[S.request.topic] || "—")}</dd></div>
            <div><dt>Practice response</dt><dd>
              ${done
                ? `${esc(a.choiceId)} — ${esc(q.options.find((o) => o.id === a.choiceId).text)}
                   <span class="status ${right ? "status--done" : "status--ready"}" style="margin-left:8px">
                     <span aria-hidden="true">${right ? "✓" : "!"}</span>${right ? "Correct" : "Incorrect"}</span>`
                : `<span class="status status--booked"><span aria-hidden="true">○</span>Not completed</span>`}
            </dd></div>
            <div><dt>Suggested next step</dt><dd>
              ${done ? esc(right ? q.nextIfRight : q.nextIfWrong) : "Complete the independent practice question to get a next step."}
            </dd></div>
          </dl>
        </section>

        <aside class="stack">
          <section class="card card--tint">
            <div class="panel-title">What this summary does not claim</div>
            <p class="mb-0">It does not measure improvement, predict an AP score, or show a before-and-after gain.
            One learner, one question. The pilot hypothesis — that a targeted explanation helps most learners solve
            a similar question independently — is still untested.</p>
          </section>

          <section class="card">
            <div class="panel-title">Continue</div>
            <div class="stack">
              <button class="btn btn--primary btn--wide" onclick="PP.newTopic()">Find help with another topic</button>
              <button class="btn btn--quiet btn--wide" onclick="PP.go('#/')">Back to home</button>
              <button class="btn btn--quiet btn--wide" onclick="PP.reset()">Reset demo</button>
            </div>
          </section>
        </aside>
      </div>
    </main>
    ${footer()}`;
  };

  /* ---- My learning ---- */
  V.learning = () => {
    const list = S.bookings.slice().reverse();
    const statusOf = (b) => {
      if (b.stage === "practised") return ["status--done", "✓", "Practice completed"];
      if (b.stage === "sessionDone") return ["status--ready", "▶", "Practice ready"];
      return ["status--booked", "○", "Booked"];
    };
    return `
    ${nav("learning")}
    <main class="wrap">
      <h1>My learning</h1>
      <p class="lede mt-8">Bookings created in this browser session. Nothing here is stored on a server.</p>

      ${list.length ? `
      <div class="stack mt-24">
        ${list.map((b) => {
          const m = mentorById(b.mentorId);
          const t = topicById(b.topicId);
          const [cls, icon, word] = statusOf(b);
          const target = b.stage === "practised" ? `#/summary/${b.id}`
                       : b.stage === "sessionDone" ? `#/practice/${b.id}`
                       : `#/session/${b.id}`;
          return `
          <article class="card">
            <div class="between">
              <div>
                <div class="mentor__name">${esc(t ? t.label : "—")}</div>
                <div class="mentor__role">${esc(m.name)} · ${esc(fmtDate(b.dateISO))} · ${esc(b.slot)}–${addMin(b.slot, 25)} (UTC+8)</div>
              </div>
              <div class="row">
                <span class="status ${cls}"><span aria-hidden="true">${icon}</span>${word}</span>
                <button class="btn btn--quiet btn--sm" onclick="PP.go('${target}')">
                  ${b.stage === "practised" ? "View summary" : b.stage === "sessionDone" ? "Go to practice" : "Open session"}
                </button>
              </div>
            </div>
          </article>`;
        }).join("")}
      </div>` : `
      <div class="empty mt-24">
        <p class="mb-16">No sessions yet. Start with a question you want to understand.</p>
        <button class="btn btn--primary" onclick="PP.go('#/request')">Describe your learning gap</button>
      </div>`}
    </main>
    ${footer()}`;
  };

  /* ---------------------------------------------------------
     Profile modal
     --------------------------------------------------------- */
  let lastFocus = null;

  function openProfile(mentorId, trigger) {
    const m = mentorById(mentorId);
    lastFocus = trigger || document.activeElement;
    const existing = $("#modal");
    if (existing) existing.remove();

    const wrap = document.createElement("div");
    wrap.className = "modal is-open";
    wrap.id = "modal";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-labelledby", "modalTitle");
    wrap.innerHTML = `
      <div class="modal__scrim" onclick="PP.closeProfile()"></div>
      <div class="modal__box">
        <button class="modal__close" aria-label="Close profile" onclick="PP.closeProfile()">✕</button>
        <div class="row" style="gap:14px;align-items:center">
          <span class="avatar">${avatarSVG(m.name, MENTORS.indexOf(m))}</span>
          <div>
            <h2 id="modalTitle" style="font-size:24px">${esc(m.name)}</h2>
            <div class="mentor__role">${esc(m.role)} · sample profile for demonstration</div>
          </div>
        </div>

        <div class="notice notice--calm mt-16">
          <span class="notice__icon" aria-hidden="true">◈</span>
          <div>Fictional profile. No credentials, ratings or lesson counts are shown because none have been verified.</div>
        </div>

        <dl class="slist mt-16">
          <div><dt>Teaching focus</dt><dd>${esc(m.focus)}</dd></div>
          <div><dt>Teaching style</dt><dd>${esc(m.style)}</dd></div>
          <div><dt>Languages</dt><dd>${esc(m.languages)}</dd></div>
          <div><dt>Suited to</dt><dd>${esc(m.topics.map((t) => (topicById(t) || {}).label).filter(Boolean).join(" · "))}</dd></div>
        </dl>

        <div class="mt-24">
          <div class="panel-title">Session plan</div>
          <div class="grid grid--3">
            ${m.sessionPlan.map(([t, title, desc]) => `
              <div>
                <div class="mono" style="color:var(--gold);font-weight:600">${esc(t)}</div>
                <div style="font-weight:600;color:var(--ink);margin:4px 0 4px">${esc(title)}</div>
                <div class="muted" style="font-size:14px">${esc(desc)}</div>
              </div>`).join("")}
          </div>
        </div>

        <div class="row mt-24">
          <button class="btn btn--primary" onclick="PP.closeProfile();PP.choose('${m.id}')">Choose ${esc(m.name.split(" ")[0])}</button>
          <button class="btn btn--quiet" onclick="PP.closeProfile()">Close</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    $("#modal .modal__box").querySelector(".modal__close").focus();
    document.addEventListener("keydown", modalKeys);
  }
  function modalKeys(e) {
    if (e.key === "Escape") { closeProfile(); return; }
    if (e.key === "Tab") {
      const box = $("#modal .modal__box");
      if (!box) return;
      const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', box)
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function closeProfile() {
    const m = $("#modal");
    if (m) m.remove();
    document.removeEventListener("keydown", modalKeys);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  /* ---------------------------------------------------------
     Render
     --------------------------------------------------------- */
  function render() {
    const stale = $("#modal");
    if (stale) stale.remove();
    const { view, arg } = route();
    const app = $("#app");
    const fn = V[view] || V.home;
    app.innerHTML = fn(arg);
    if (S.toast) {
      const t = document.createElement("div");
      t.className = "wrap";
      t.innerHTML = `<div class="notice notice--calm" style="margin-top:14px">
        <span class="notice__icon" aria-hidden="true">→</span><div>${esc(S.toast)}</div></div>`;
      app.querySelector("main").prepend(t);
      S.toast = ""; save();
    }
    if (view === "request") wireRequest();
    if (view === "practice") wirePractice();
    if (view === "booking") refreshConfirm();
    document.title = view === "home"
      ? "PeerPoint — Bring one problem. Practise the next one independently."
      : "PeerPoint — " + view;
  }

  function wireRequest() {
    const form = $("#reqForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const topic = $("#f-topic").value;
      const question = $("#f-question").value.trim();
      const attempt = $("#f-attempt").value.trim();
      let ok = true;
      ok = fieldErr("f-topic", "e-topic", !topic, "Choose the topic your question is about.") && ok;
      ok = fieldErr("f-question", "e-question", question.length < 8, "Write the question you were working on — a sentence is enough.") && ok;
      ok = fieldErr("f-attempt", "e-attempt", attempt.length < 8, "Describe what you tried, so the mentor can see your reasoning.") && ok;

      if (!ok) {
        const first = $('[aria-invalid="true"]');
        if (first) first.focus();
        return;
      }
      S.request = {
        subject: "AP Microeconomics",
        topic,
        question,
        attempt,
        stuck: ($$("#stuckChips .chip").find((c) => c.getAttribute("aria-pressed") === "true") || {}).dataset?.stuck || "",
        language: ($$("#langChips .chip").find((c) => c.getAttribute("aria-pressed") === "true") || {}).dataset?.lang || "Either",
        attachName: S.request && S.request.attachName || "",
      };
      if (S.attachData) S.request.attachName = S.attachName || (S.request.attachName);
      S.attempt = null; S.feedback = null;
      save();
      PP.go("#/matches");
    });

    $$("#stuckChips .chip").forEach((c) => c.addEventListener("click", () => {
      const on = c.getAttribute("aria-pressed") === "true";
      $$("#stuckChips .chip").forEach((x) => x.setAttribute("aria-pressed", "false"));
      c.setAttribute("aria-pressed", on ? "false" : "true");
      stashForm();
    }));
    $$("#langChips .chip").forEach((c) => c.addEventListener("click", () => {
      $$("#langChips .chip").forEach((x) => x.setAttribute("aria-pressed", "false"));
      c.setAttribute("aria-pressed", "true");
      stashForm();
    }));
    ["f-topic", "f-question", "f-attempt"].forEach((id) =>
      $("#" + id).addEventListener("input", stashForm));
  }

  function stashForm() {
    if (!S.request) S.request = { subject: "AP Microeconomics" };
    S.request.topic = $("#f-topic") ? $("#f-topic").value : S.request.topic;
    S.request.question = $("#f-question") ? $("#f-question").value : S.request.question;
    S.request.attempt = $("#f-attempt") ? $("#f-attempt").value : S.request.attempt;
    save();
  }

  function fieldErr(inputId, errId, bad, msg) {
    const i = $("#" + inputId), e = $("#" + errId);
    if (!i || !e) return true;
    if (bad) {
      i.setAttribute("aria-invalid", "true");
      e.textContent = msg; e.hidden = false;
      return false;
    }
    i.removeAttribute("aria-invalid");
    e.hidden = true; e.textContent = "";
    return true;
  }

  function wirePractice() {
    const a = S.attempt;
    if (a) {
      const q = PRACTICE[S.request.topic];
      const chosen = q.options.find((o) => o.id === a.choiceId);
      $$(".opt").forEach((b) => {
        if (b.dataset.opt === q.options.find((o) => o.correct).id) b.classList.add("is-correct");
        if (b.dataset.opt === a.choiceId && !chosen.correct) b.classList.add("is-wrong");
        b.disabled = true;
      });
    }
  }

  function refreshConfirm() {
    const btn = $("#confirmBtn");
    if (!btn) return;
    const d = S.draft || {};
    btn.disabled = !(d.iso && d.agreed);
    const when = $("#sumWhen");
    if (when) when.textContent = d.iso ? (fmtDate(d.iso) + " · " + d.slot) : "Not selected yet";
  }

  /* ---------------------------------------------------------
     Public actions
     --------------------------------------------------------- */
  const PP = {
    go(hash) { location.hash = hash; },

    toggleNav(btn) {
      const links = $("#navlinks");
      const open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    },

    reset() { reset(); },

    demoInfo() {
      alert("Demo information\n\n" +
        "• Everything on this site uses local sample data.\n" +
        "• No payment is taken and no real session is scheduled.\n" +
        "• Mentor profiles are fictional; nothing is marked verified.\n" +
        "• Your entries stay in this browser tab only.\n" +
        "• Use “Reset demo” to clear everything and start again.");
    },

    /* --- request form --- */
    sample() {
      S.request = Object.assign({}, SAMPLE_REQUEST);
      save();
      if (location.hash === "#/request") render();
      else location.hash = "#/request";
    },
    pickFile() { const f = $("#f-file"); if (f) f.click(); },
    attachKey(e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); PP.pickFile(); } },
    fileChosen(ev) {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) { alert("Please choose an image file."); return; }
      const reader = new FileReader();
      reader.onload = () => {
        S.attachData = reader.result;      // memory + session only
        S.attachName = file.name;
        if (!S.request) S.request = { subject: "AP Microeconomics" };
        S.request.attachName = file.name;
        save();
        const box = $("#previewBox"), img = $("#previewImg"), nm = $("#previewName");
        if (box) { box.hidden = false; img.src = reader.result; nm.textContent = file.name; }
      };
      reader.readAsDataURL(file);
    },
    clearFile() {
      S.attachData = null; S.attachName = "";
      if (S.request) S.request.attachName = "";
      save();
      const box = $("#previewBox"); if (box) box.hidden = true;
      const f = $("#f-file"); if (f) f.value = "";
    },

    /* --- matches --- */
    profile(id, trigger) { openProfile(id, trigger); },
    closeProfile() { closeProfile(); },

    choose(id) {
      S.draft = { mentorId: id, iso: null, slot: null, agreed: false, goal: BOOKING_GOAL_DEFAULT };
      save();
      PP.go("#/booking/" + id);
    },

    /* --- booking --- */
    slot(iso, slot) {
      const d = S.draft || (S.draft = {});
      const same = d.iso === iso && d.slot === slot;
      d.iso = same ? null : iso;
      d.slot = same ? null : slot;
      save();
      $$(".slot").forEach((b) => {
        b.setAttribute("aria-pressed",
          (!same && b.dataset.iso === iso && b.dataset.slot === slot) ? "true" : "false");
      });
      refreshConfirm();
    },
    agree(v) { (S.draft = S.draft || {}).agreed = v; save(); refreshConfirm(); },
    goal(v) { (S.draft = S.draft || {}).goal = v; save(); },

    confirm() {
      const d = S.draft || {};
      if (!d.iso || !d.slot || !d.agreed) return;
      const id = "bk" + Date.now().toString(36);
      S.bookings.push({
        id, mentorId: d.mentorId, topicId: S.request.topic,
        dateISO: d.iso, slot: d.slot, goal: d.goal || BOOKING_GOAL_DEFAULT,
        agreed: true, createdAt: Date.now(), stage: "booked",
      });
      S.activeId = id;
      S.draft = null;
      save();
      PP.go("#/session/" + id);
    },

    /* --- session --- */
    togglePreview() {
      const box = $("#classroom"), btn = $("#previewBtn");
      const open = box.hidden;
      box.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Hide session preview" : "Preview session";
    },
    finishSession(id) {
      const b = bookingById(id);
      if (b && b.stage === "booked") { b.stage = "sessionDone"; save(); }
      PP.go("#/practice/" + id);
    },

    /* --- practice --- */
    pick(id) {
      if (S.attempt) return;
      PP._choice = id;
      $$(".opt").forEach((b) => b.setAttribute("aria-pressed", b.dataset.opt === id ? "true" : "false"));
      const btn = $("#checkBtn"), hint = $("#checkHint");
      if (btn) btn.disabled = false;
      if (hint) hint.textContent = "Ready when you are.";
    },
    check() {
      if (S.attempt || !PP._choice) return;
      const q = PRACTICE[S.request.topic];
      const chosen = q.options.find((o) => o.id === PP._choice);
      S.attempt = { choiceId: PP._choice, correct: !!chosen.correct };
      const b = bookingById(S.activeId);
      if (b) b.stage = "practised";
      save();
      render();
      const box = $("#verdictBox");
      if (box) box.scrollIntoView({ behavior: "smooth", block: "center" });
    },

    /* --- feedback --- */
    setClarity(v) {
      S.feedback = Object.assign({ clarity: null, price: null, improve: "" }, S.feedback, { clarity: v });
      save();
      $$("#clarityScale button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.clarity === v ? "true" : "false"));
    },
    setPrice(v) {
      S.feedback = Object.assign({ clarity: null, price: null, improve: "" }, S.feedback, { price: v });
      save();
      $$("#priceChips .chip").forEach((b) => b.setAttribute("aria-pressed", b.dataset.price === v ? "true" : "false"));
    },
    improve(v) {
      S.feedback = Object.assign({ clarity: null, price: null, improve: "" }, S.feedback, { improve: v });
      save();
    },
    toSummary(id) { PP.go("#/summary/" + id); },

    /* --- summary --- */
    newTopic() {
      S.request = null; S.attempt = null; S.feedback = null; S.draft = null;
      save();
      PP.go("#/request");
    },
  };

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  document.addEventListener("click", (e) => {
    const c = e.target.closest("#clarityScale button");
    if (c) { PP.setClarity(c.dataset.clarity); return; }
    const p = e.target.closest("#priceChips .chip");
    if (p) { PP.setPrice(p.dataset.price); }
  });

  window.addEventListener("hashchange", render);
  window.PP = PP;
  if (!location.hash) location.hash = "#/";
  render();
})();
