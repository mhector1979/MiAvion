// MiAvion app: storage, sample trips, views (flights, flight detail, logbook) and sheets.
(function () {
  const { MIN, HOUR, DAY } = MA;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- icons ----------
  const ICON = {
    plane: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/></svg>',
  };

  // ---------- storage ----------
  const KEY = "miavion.v1";
  const defaults = { flights: [], hiddenSamples: [], settings: { units: "km", clock: "24", apiKey: "", samples: true } };
  let store;
  try { store = Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || "{}")); }
  catch (e) { store = JSON.parse(JSON.stringify(defaults)); }
  store.settings = Object.assign({}, defaults.settings, store.settings);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage unavailable */ } }

  // ---------- sample trips (relative to app start, so there's always something live) ----------
  const ANCHOR = Math.floor(Date.now() / (5 * MIN)) * 5 * MIN;
  const SAMPLE_ROWS = [
    // code, from, to, departure offset from now, delay (min), reason
    ["IB6403", "MAD", "MEX", -4.3 * HOUR, 12],
    ["AM565", "MEX", "CUN", 2 * HOUR + 50 * MIN, 25, "Late-arriving aircraft"],
    ["UA901", "SFO", "FRA", 3 * DAY + 2 * HOUR, 0, null, "Ana"],
    ["AV19", "BOG", "MAD", -3 * HOUR, 20, "Weather at destination", "Carlos"],
    ["AM2", "MEX", "LAX", -24 * DAY, 4],
    ["AA2496", "LAX", "JFK", -21 * DAY, 38],
    ["BA112", "JFK", "LHR", -17 * DAY, -6],
    ["IB3167", "LHR", "MAD", -12 * DAY, 15],
    ["AM642", "MEX", "CUN", -190 * DAY, 0],
    ["AM643", "CUN", "MEX", -184 * DAY, 22],
    ["AV245", "BOG", "LIM", -260 * DAY, 3],
    ["LA2369", "LIM", "SCL", -255 * DAY, 0],
    ["LA800", "SCL", "SYD", -248 * DAY, 51, null, "Carlos"],
    ["QF11", "SYD", "LAX", -236 * DAY, 8],
    ["AM179", "LAX", "MEX", -235 * DAY, 0],
    ["CM117", "PTY", "BOG", -420 * DAY, 0],
    ["CM390", "MEX", "PTY", -421 * DAY, 18],
  ];
  function samples() {
    if (!store.settings.samples) return [];
    return SAMPLE_ROWS.map((r, i) => {
      const dep = ANCHOR + Math.round(r[3] / (5 * MIN)) * 5 * MIN;
      const date = MA.localDate(dep, MA.AIRPORTS[r[1]].tz);
      const data = MA.simulate(r[0], date, { from: r[1], to: r[2], depUtc: dep, delay: r[4], reason: r[5] });
      return { id: "sample" + i, sample: true, code: r[0], date, data, who: r[6] || "" };
    }).filter((f) => !store.hiddenSamples.includes(f.id));
  }
  function userFlights() {
    return store.flights.map((f) => Object.assign({}, f, { who: f.who || "", data: f.data && f.data.source === "live" ? f.data : MA.simulate(f.code, f.date, f.opts) }));
  }
  function allFlights() { return userFlights().concat(samples()); }
  function findFlight(id) { return allFlights().find((f) => f.id === id); }

  // ---------- formatting ----------
  function fmtTime(ts, tz) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: store.settings.clock === "12",
    }).format(ts).replace(/\s?([ap])m/i, (m, x) => x.toLowerCase() + "m");
  }
  function fmtDate(ts, tz, opts) {
    return new Intl.DateTimeFormat("en-GB", Object.assign({ timeZone: tz, weekday: "short", day: "numeric", month: "short" }, opts || {})).format(ts);
  }
  function tzAbbr(ts, tz) {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(ts).find((x) => x.type === "timeZoneName");
    return p ? p.value : "";
  }
  function dist(km) {
    if (store.settings.units === "mi") return Math.round(km * 0.621371).toLocaleString("en-US") + " mi";
    return Math.round(km).toLocaleString("en-US") + " km";
  }
  function distNum(km) {
    const v = store.settings.units === "mi" ? km * 0.621371 : km;
    return v >= 100000 ? Math.round(v / 1000).toLocaleString("en-US") + "k" : Math.round(v).toLocaleString("en-US");
  }
  function relDays(ts, now) {
    const d = Math.round((now - ts) / DAY);
    if (d < 1) return "today";
    if (d === 1) return "yesterday";
    if (d < 60) return d + " days ago";
    const m = Math.round(d / 30);
    return m < 18 ? m + " months ago" : Math.round(d / 365) + " years ago";
  }
  // People: "" means the flight is yours; any other value is who is flying.
  function knownPeople() {
    const names = [];
    store.flights.forEach((f) => { if (f.who && !names.includes(f.who)) names.push(f.who); });
    return names;
  }
  function initials(name) {
    const parts = String(name).trim().split(/\s+/);
    return ((parts[0] || "")[0] + ((parts[1] || "")[0] || "")).toUpperCase();
  }
  function avatar(name, cls) {
    const hue = MA.hash(name) % 360;
    return '<span class="av' + (cls ? " " + cls : "") + '" style="--av:hsl(' + hue + ' 52% 44%)" title="' + esc(name) + '">' + esc(initials(name)) + "</span>";
  }
  function cleanName(v) { return String(v || "").replace(/\s+/g, " ").trim().slice(0, 24); }
  function prettyCode(code) { return code.slice(0, 2) + " " + code.slice(2); }

  function whenText(f, st, now) {
    const mins = (t) => MA.fmtDur((t - now) / MIN);
    switch (st.phase) {
      case "cancelled": return "Cancelled";
      case "scheduled": {
        const d = st.dep - now;
        if (d > 2 * DAY) return "In " + Math.round(d / DAY) + " days";
        if (d >= DAY) return "In 1 day " + Math.floor((d - DAY) / HOUR) + "h";
        return "Departs in " + mins(st.dep);
      }
      case "boarding": return "Departs in " + mins(st.dep);
      case "closing": return "Departs in " + mins(st.dep);
      case "taxi-out": return "Taking off";
      case "airborne": return "Lands in " + mins(st.landing);
      case "taxi-in": return "At gate in " + mins(st.arr);
      default: return relDays(st.arr, now);
    }
  }

  function headline(f, st, now) {
    const A = MA.AIRPORTS[f.data.from], B = MA.AIRPORTS[f.data.to];
    const dur = (t) => "<em>" + MA.fmtDur((t - now) / MIN) + "</em>";
    switch (st.phase) {
      case "cancelled": return "This flight was cancelled.";
      case "scheduled": return st.dep - now > 2 * DAY
        ? "Departs " + esc(A.city) + " on " + fmtDate(st.dep, A.tz) + " at " + fmtTime(st.dep, A.tz) + "."
        : "Departs in " + dur(st.dep) + " from gate " + esc(f.data.dep.gate) + ".";
      case "boarding": return "Boarding now at gate " + esc(f.data.dep.gate) + ". Doors close in " + dur(st.dep) + ".";
      case "closing": return "Final call at gate " + esc(f.data.dep.gate) + ". Pushback in " + dur(st.dep) + ".";
      case "taxi-out": return "Taxiing to the runway at " + esc(A.city) + ".";
      case "airborne": return "Landing in " + esc(B.city) + " in " + dur(st.landing) + ".";
      case "taxi-in": return "Landed. Arriving at gate " + esc(f.data.arr.gate) + " in " + dur(st.arr) + ".";
      default: return "Arrived in " + esc(B.city) + " " + relDays(st.arr, now) + ".";
    }
  }

  // ---------- shared pieces ----------
  function toneClass(t) { return "tone-" + (t || "muted"); }
  function pill(st) {
    const tone = st.done ? "muted" : st.tone;
    return '<span class="pill ' + toneClass(tone) + (st.live ? " pulse" : "") + '">' + esc(st.label) + "</span>";
  }
  function timeCell(sched, est, tz, kind, phase) {
    const delay = Math.round((est - sched) / MIN);
    const cls = phase === "cancelled" ? "bad" : delay > 9 ? "late" : "";
    return '<span class="t ' + cls + '">' + fmtTime(est, tz) + (Math.abs(delay) > 4 ? "<s>" + fmtTime(sched, tz) + "</s>" : "") + "</span>";
  }

  function card(f, now) {
    const d = f.data, st = MA.status(d, now);
    const A = MA.AIRPORTS[d.from], B = MA.AIRPORTS[d.to];
    const p = st.phase === "airborne" ? st.progress : st.progress >= 1 ? 1 : 0;
    const tone = st.done ? "var(--faint)" : "var(--" + (st.tone === "ok" ? "accent" : st.tone) + ")";
    return (
      '<a class="card' + (st.live ? " live" : "") + '" href="#f-' + esc(f.id) + '" style="--al:' + esc(d.airline.color) + '">' +
        '<div class="card-top">' +
          '<span class="al-chip">' + esc(d.airline.iata) + (f.who ? avatar(f.who, "on-chip") : "") + "</span>" +
          '<div class="card-id"><b>' + esc(prettyCode(d.code)) + "</b><span>" + (f.who ? '<em class="who">' + esc(f.who) + "</em> · " : "") + esc(d.airline.name) + " · " + fmtDate(d.dep.sched, A.tz) + "</span></div>" +
          pill(st) +
        "</div>" +
        '<div class="route">' +
          '<div class="ap"><b class="iata">' + esc(d.from) + "</b><small>" + esc(A.city) + "</small></div>" +
          '<div class="track" style="--tone:' + tone + '">' +
            '<span class="flown" style="width:' + (p * 100).toFixed(1) + '%"></span>' +
            (st.phase === "airborne" ? '<span class="plane" style="left:' + (p * 100).toFixed(1) + '%">' + ICON.plane + "</span>" : '<span class="dur">' + MA.fmtDur((d.arr.sched - d.dep.sched) / MIN) + "</span>") +
          "</div>" +
          '<div class="ap right"><b class="iata">' + esc(d.to) + "</b><small>" + esc(B.city) + "</small></div>" +
        "</div>" +
        '<div class="card-foot">' +
          "<div>" + timeCell(d.dep.sched, d.dep.actual || d.dep.est, A.tz, "dep", st.phase) + '<span class="lbl">Gate ' + esc(d.dep.gate) + "</span></div>" +
          '<div class="when">' + esc(whenText(f, st, now)) + "</div>" +
          '<div class="right">' + timeCell(d.arr.sched, d.arr.actual || d.arr.est, B.tz, "arr", st.phase) + '<span class="lbl">' + (st.done ? "Belt " + esc(d.arr.belt) : "Terminal " + esc(d.arr.terminal)) + "</span></div>" +
        "</div>" +
      "</a>"
    );
  }

  function routeFor(d, st, opts) {
    const A = MA.AIRPORTS[d.from], B = MA.AIRPORTS[d.to];
    const color = getComputedStyle(document.documentElement).getPropertyValue(st && st.tone && st.tone !== "ok" && !st.done ? "--" + st.tone : "--route").trim();
    return Object.assign({
      from: { lat: A.lat, lon: A.lon, iata: A.iata }, to: { lat: B.lat, lon: B.lon, iata: B.iata },
      color, progress: st && st.phase === "airborne" ? st.progress : null,
    }, opts || {});
  }
  function planeFor(d, st, now) {
    const tm = MA.telemetry(d, st, now);
    const B = MA.AIRPORTS[d.to];
    const color = getComputedStyle(document.documentElement).getPropertyValue("--route").trim();
    return { lat: tm.pos.lat, lon: tm.pos.lon, next: MA.interpolate(tm.pos, B, 0.02), color };
  }

  // ---------- views ----------
  let globe = null;
  let view = null; // { name, tick() }
  const main = () => $("#view");

  function mountGlobe(el, opts) {
    if (globe) globe.destroy();
    globe = new MA.Globe(el, opts);
    return globe;
  }

  function viewFlights() {
    main().innerHTML =
      '<div class="wrap">' +
        '<div class="globe"><canvas id="globe-home" aria-label="Globe showing your upcoming routes"></canvas><div class="caption" id="globe-cap"></div></div>' +
        '<div id="home-body"></div>' +
      "</div>";
    const g = mountGlobe($("#globe-home"), { spin: true });
    let focused = false;

    function tick() {
      const now = Date.now();
      const every = allFlights();
      const mineCount = every.filter((f) => !f.who).length, friendsCount = every.length - mineCount;
      const tab = store.settings.who === "friends" ? "friends" : "mine";
      const list = every.filter((f) => (tab === "friends" ? !!f.who : !f.who)).map((f) => ({ f, st: MA.status(f.data, now) }));
      const live = list.filter((x) => x.st.live).sort((a, b) => a.st.dep - b.st.dep);
      const upcoming = list.filter((x) => !x.st.live && x.st.phase !== "arrived" && x.st.arr > now).sort((a, b) => a.st.dep - b.st.dep);
      const past = list.filter((x) => !x.st.live && !upcoming.includes(x)).sort((a, b) => b.st.dep - a.st.dep);

      const showSamples = store.settings.samples && every.some((f) => f.sample);
      const sec = (title, items, empty) =>
        '<section class="section"><h2>' + title + ' <span class="count">' + items.length + "</span></h2>" +
        (items.length ? items.map((x) => card(x.f, now)).join("") : empty || "") + "</section>";

      const emptyUp = tab === "friends"
        ? '<div class="empty"><b>No upcoming flights from friends</b>Tap + and choose "Someone else" to follow a friend or family member.</div>'
        : '<div class="empty"><b>No upcoming flights</b>Tap + and enter a flight number, like IB6403.</div>';
      $("#home-body").innerHTML =
        '<div class="seg who-seg" role="group" aria-label="Whose flights">' +
          '<button data-who="mine" aria-pressed="' + (tab === "mine") + '">My flights <span class="count">' + mineCount + "</span></button>" +
          '<button data-who="friends" aria-pressed="' + (tab === "friends") + '">Friends <span class="count">' + friendsCount + "</span></button>" +
        "</div>" +
        (showSamples
          ? '<div class="banner"><p>These are sample trips with simulated data. Add a flight with the + button to start your own.</p><button class="link-btn" data-act="hide-samples">Hide samples</button></div>'
          : "") +
        (live.length ? sec("In progress", live) : "") +
        sec("Upcoming", upcoming, emptyUp) +
        (past.length ? sec("Past", past.slice(0, 12)) : "");

      // Globe: live + upcoming routes, planes for airborne flights.
      const active = live.concat(upcoming.slice(0, 4));
      g.set({
        routes: active.map((x, i) => routeFor(x.f.data, x.st, { dim: i > 0 && !x.st.live, labels: i === 0 })),
        planes: live.filter((x) => x.st.phase === "airborne").map((x) => planeFor(x.f.data, x.st, now)),
      });
      const lead = live[0] || upcoming[0];
      if (lead && !focused) {
        focused = true;
        const pos = lead.st.phase === "airborne" ? MA.telemetry(lead.f.data, lead.st, now).pos : MA.AIRPORTS[lead.f.data.from];
        g.focusOn({ lat: pos.lat - 12, lon: pos.lon }, true);
      }
      $("#globe-cap").textContent = live.length
        ? live.length + (live.length > 1 ? " flights" : " flight") + " in progress"
        : upcoming.length ? "Next: " + (upcoming[0].f.who ? upcoming[0].f.who + " · " : "") + prettyCode(upcoming[0].f.data.code) + " · " + whenText(upcoming[0].f, upcoming[0].st, now).toLowerCase()
        : tab === "friends" ? "Friends' flights appear here" : "Add a flight to see it here";
    }
    main().onclick = (e) => {
      const b = e.target.closest("[data-who]");
      if (!b) return;
      store.settings.who = b.dataset.who; save();
      focused = false; tick();
    };
    tick();
    return { name: "flights", tick };
  }

  function viewDetail(id) {
    const f0 = findFlight(id);
    if (!f0) { location.hash = ""; return viewFlights(); }
    main().innerHTML =
      '<div class="wrap">' +
        '<div class="globe small"><canvas id="globe-detail" aria-label="Globe showing this flight\'s route"></canvas></div>' +
        '<div id="detail-body"></div>' +
      "</div>";
    const km = f0.data.km;
    const g = mountGlobe($("#globe-detail"), { zoom: km < 1200 ? 2.6 : km < 3000 ? 1.9 : km < 7000 ? 1.35 : 1.05, offsetY: 0.06 });
    let armed = false;
    let focusedLive = null;

    function tick() {
      const f = findFlight(id);
      if (!f) { location.hash = ""; return; }
      const d = f.data, now = Date.now(), st = MA.status(d, now);
      const A = MA.AIRPORTS[d.from], B = MA.AIRPORTS[d.to];
      const tm = MA.telemetry(d, st, now);
      setTitle(prettyCode(d.code) + " · " + d.from + "–" + d.to);

      // Globe
      const isAir = st.phase === "airborne";
      g.set({ routes: [routeFor(d, st, { labels: true })], planes: isAir ? [planeFor(d, st, now)] : [] });
      if (focusedLive !== isAir) {
        const c = isAir ? tm.pos : MA.interpolate(A, B, 0.5);
        g.focusOn({ lat: c.lat, lon: c.lon }, focusedLive === null);
        focusedLive = isAir;
      }

      const depTime = d.dep.actual || d.dep.est, arrTime = d.arr.actual || d.arr.est;
      const depLate = Math.round((d.dep.est - d.dep.sched) / MIN), arrLate = Math.round((d.arr.est - d.arr.sched) / MIN);
      const lateCls = (m) => (st.phase === "cancelled" ? "bad" : m > 9 ? "late" : m < -4 ? "early" : "");
      const was = (sched, est, tz, label) => {
        const m = Math.round((est - sched) / MIN);
        if (Math.abs(m) <= 4) return '<span class="was">' + label + " on schedule · " + esc(tzAbbr(est, tz)) + "</span>";
        return '<span class="was">' + (m > 0 ? MA.fmtDur(m) + " late" : MA.fmtDur(m) + " early") + " · <s>" + fmtTime(sched, tz) + "</s> · " + esc(tzAbbr(est, tz)) + "</span>";
      };

      // Timeline events
      const ev = [
        { t: depTime - 3 * HOUR, n: "Check-in opens", s: "Desk " + d.dep.checkin + " · Terminal " + d.dep.terminal, tz: A.tz },
        { t: depTime - 45 * MIN, n: "Boarding", s: "Gate " + d.dep.gate, tz: A.tz },
        { t: depTime - 15 * MIN, n: "Gate closes", s: "Doors close", tz: A.tz },
        { t: depTime, n: "Pushback", s: A.city, tz: A.tz },
        { t: st.takeoff, n: "Takeoff", s: "Wheels up", tz: A.tz },
        { t: st.landing, n: "Landing", s: B.city, tz: B.tz },
        { t: arrTime, n: "At the gate", s: "Gate " + d.arr.gate + " · Terminal " + d.arr.terminal, tz: B.tz },
        { t: arrTime + 18 * MIN, n: "Bags on belt", s: "Belt " + d.arr.belt + " (estimate)", tz: B.tz },
      ];
      const nextIdx = ev.findIndex((e) => e.t > now);
      const timeline = st.phase === "cancelled" ? "" :
        '<section class="panel"><h3>Day of travel</h3><ol class="timeline">' +
        ev.map((e, i) =>
          '<li class="' + (e.t <= now ? "done" : i === nextIdx ? "now" : "") + '"><span class="dot"></span>' +
          '<span class="ev">' + esc(e.n) + "<small>" + esc(e.s) + "</small></span>" +
          "<time>" + fmtTime(e.t, e.tz) + "</time></li>").join("") +
        "</ol></section>";

      // Progress / telemetry
      const elapsed = Math.max(0, Math.min(now, st.landing) - st.takeoff);
      const remain = Math.max(0, st.landing - now);
      const progress = (st.phase === "airborne" || st.phase === "taxi-in" || st.phase === "arrived")
        ? '<section class="panel" style="--tone:var(--' + (st.tone === "ok" || st.done ? "accent" : st.tone) + ')"><div class="progress">' +
            '<div class="row"><span><b>' + dist(tm.flownKm) + "</b> flown</span><span><b>" + dist(tm.leftKm) + "</b> to go</span></div>" +
            '<div class="bar"><i style="width:' + (st.progress * 100).toFixed(1) + '%"></i></div>' +
            '<div class="row"><span>' + MA.fmtDur(elapsed / MIN) + " elapsed</span><span>" + (remain ? MA.fmtDur(remain / MIN) + " remaining" : "Complete") + "</span></div>" +
          "</div>" +
          (st.phase === "airborne"
            ? '<div class="telemetry"><div><b>' + tm.altFt.toLocaleString("en-US") + '</b><span>Altitude ft</span></div><div><b>' + tm.kts + '</b><span>Speed kts</span></div><div><b>' + Math.round(tm.heading) + '°</b><span>Heading</span></div></div>'
            : "") +
          "</section>"
        : "";

      // Delay explanation
      let delayNote = "";
      if (st.phase === "cancelled") delayNote = '<p class="note warn">The airline cancelled this flight. Check your airline app for rebooking options.</p>';
      else if (depLate > 9 && !st.done) delayNote = '<p class="note warn">Delayed ' + MA.fmtDur(depLate) + (d.delayReason ? " · " + esc(d.delayReason) : "") + ". Arrival is expected " + (arrLate > 4 ? MA.fmtDur(arrLate) + " late" : "on time") + ".</p>";

      // Inbound aircraft
      let inbound = "";
      if (d.inbound && !st.done && st.phase !== "cancelled") {
        const ib = d.inbound;
        const ibSt = MA.status({ code: ib.code, from: ib.from, to: ib.to, km: ib.km, dep: { sched: ib.schedDep, est: ib.estDep }, arr: { sched: ib.schedArr, est: ib.estArr } }, now);
        const IA = MA.AIRPORTS[ib.from];
        const turn = Math.round((d.dep.est - ib.estArr) / MIN);
        inbound = '<section class="panel"><h3>Where your plane is now</h3>' +
          '<div class="inbound"><span class="al-chip" style="--al:' + esc(d.airline.color) + '">' + esc(d.airline.iata) + "</span>" +
          '<div><b>' + esc(prettyCode(ib.code)) + " · " + esc(ib.from) + " → " + esc(ib.to) + '</b><p class="note">' +
          (ibSt.phase === "arrived" || ibSt.phase === "taxi-in" ? "Your aircraft is already at " + esc(A.city) + "." :
            ibSt.phase === "airborne" ? "In the air from " + esc(IA.city) + ", landing " + fmtTime(ib.estArr, A.tz) + "." :
            "Leaves " + esc(IA.city) + " at " + fmtTime(ib.estDep, IA.tz) + " local.") +
          " " + (turn < 45 ? "Tight turnaround: " + turn + " min." : turn + " min to turn around.") + "</p></div>" +
          pill(ibSt) + "</div></section>";
      }

      const sourceLine = d.source === "live"
        ? "Live data from AeroDataBox · updated " + fmtTime(d.fetchedAt, Intl.DateTimeFormat().resolvedOptions().timeZone)
        : "Simulated data. Add a live data key in Settings for real times.";

      $("#detail-body").innerHTML =
        '<div class="d-head">' +
          '<div class="d-meta"><span class="al-chip" style="--al:' + esc(d.airline.color) + '">' + esc(d.airline.iata) + "</span><b>" + esc(prettyCode(d.code)) + "</b><span>" + esc(d.airline.name) + " · " + fmtDate(d.dep.sched, A.tz, { year: "numeric" }) + "</span>" + (f.sample ? '<span class="tag">Sample</span>' : "") + "</div>" +
          (f.who ? '<div class="d-who">' + avatar(f.who) + "<span><b>" + esc(f.who) + "</b> is on this flight</span></div>" : "") +
          '<div class="d-route"><span>' + esc(d.from) + '</span><span class="arrow">→</span><span>' + esc(d.to) + "</span></div>" +
          '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' + pill(st) + '<span class="d-sub">' + esc(A.city) + " to " + esc(B.city) + " · " + dist(d.km) + "</span></div>" +
          '<p class="d-headline">' + headline(f, st, now) + "</p>" +
          delayNote +
        "</div>" +
        '<section class="section">' +
          progress +
          '<section class="panel"><div class="legs">' +
            '<div class="leg"><h3>Departs</h3><span class="city">' + esc(A.name) + '</span><span class="big ' + lateCls(depLate) + '">' + fmtTime(depTime, A.tz) + "</span>" + was(d.dep.sched, d.dep.est, A.tz, "Leaving") +
              '<div class="kv"><div><span>Terminal</span><b>' + esc(d.dep.terminal) + "</b></div><div><span>Gate</span><b>" + esc(d.dep.gate) + "</b></div><div><span>Check-in</span><b>" + esc(d.dep.checkin) + "</b></div></div></div>" +
            '<div class="leg"><h3>Arrives</h3><span class="city">' + esc(B.name) + '</span><span class="big ' + lateCls(arrLate) + '">' + fmtTime(arrTime, B.tz) + "</span>" + was(d.arr.sched, d.arr.est, B.tz, "Arriving") +
              '<div class="kv"><div><span>Terminal</span><b>' + esc(d.arr.terminal) + "</b></div><div><span>Gate</span><b>" + esc(d.arr.gate) + "</b></div><div><span>Bags</span><b>" + esc(d.arr.belt) + "</b></div></div></div>" +
          "</div></section>" +
          timeline +
          inbound +
          '<section class="panel"><h3>Aircraft and route</h3><div class="facts">' +
            "<div><span>Aircraft</span><b>" + esc(d.aircraft.type) + "</b></div>" +
            "<div><span>Registration</span><b>" + esc(d.aircraft.reg) + "</b></div>" +
            (d.aircraft.seats ? "<div><span>Seats</span><b>" + d.aircraft.seats + "</b></div>" : "") +
            (d.aircraft.built ? "<div><span>First flight</span><b>" + d.aircraft.built + "</b></div>" : "") +
            "<div><span>Distance</span><b>" + dist(d.km) + "</b></div>" +
            "<div><span>Gate to gate</span><b>" + MA.fmtDur((d.arr.sched - d.dep.sched) / MIN) + "</b></div>" +
            "<div><span>Time difference</span><b>" + tzDiff(A.tz, B.tz, d.dep.sched) + "</b></div>" +
            "<div><span>Cruise</span><b>" + (d.cruiseFt || 37000).toLocaleString("en-US") + " ft</b></div>" +
          "</div></section>" +
          (f.sample ? "" : whoPanel(f.who)) +
          '<p class="note" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + esc(sourceLine) +
            (d.source === "live" ? ' <button class="link-btn" data-act="refresh">Refresh</button>' : "") + "</p>" +
          (f.sample
            ? '<button class="btn block" data-act="hide-sample">Hide this sample</button>'
            : '<button class="btn block danger' + (armed ? " armed" : "") + '" data-act="delete">' + (armed ? "Tap again to remove" : "Remove flight") + "</button>") +
        "</section>";
    }

    main().onclick = async (e) => {
      const pick = e.target.closest("[data-pick-who]");
      if (pick) { setWho(pick.dataset.pickWho); return; }
      const b = e.target.closest("[data-act]");
      if (!b) return;
      const f = findFlight(id);
      if (b.dataset.act === "who-add") {
        const v = cleanName($("#who-new").value);
        if (!v) { $("#who-new").focus(); return; }
        setWho(v); return;
      }
      if (b.dataset.act === "delete") {
        if (!armed) { armed = true; tick(); setTimeout(() => { armed = false; if (view && view.name === "detail") tick(); }, 4000); return; }
        store.flights = store.flights.filter((x) => x.id !== id); save();
        toast("Flight removed"); location.hash = "";
      } else if (b.dataset.act === "hide-sample") {
        store.hiddenSamples.push(id); save(); toast("Sample hidden"); location.hash = "";
      } else if (b.dataset.act === "refresh" && f) {
        b.disabled = true; b.textContent = "Refreshing…";
        try {
          const res = await MA.liveLookup(f.code, f.date, store.settings.apiKey);
          const match = res.find((r) => r.from === f.data.from) || res[0];
          if (match) { const s = store.flights.find((x) => x.id === id); s.data = match; save(); toast("Updated"); }
          else toast("No live update found");
        } catch (err) { toast(err.message || "Couldn't reach live data"); }
        tick();
      }
    };
    function setWho(name) {
      const s = store.flights.find((x) => x.id === id);
      if (!s) return;
      s.who = cleanName(name); save();
      toast(s.who ? "Saved as " + s.who + "'s flight" : "Saved as your flight");
      tick();
    }
    main().onkeydown = (e) => {
      if (e.key === "Enter" && e.target.id === "who-new") { e.preventDefault(); const v = cleanName(e.target.value); if (v) setWho(v); }
    };
    tick();
    return { name: "detail", tick };
  }

  // Chips to choose who is on a flight: you, someone you've used before, or a new name.
  function whoChips(current, attr) {
    return '<button type="button" class="chip" ' + attr + '="" aria-pressed="' + !current + '">Me</button>' +
      knownPeople().map((n) => '<button type="button" class="chip" ' + attr + '="' + esc(n) + '" aria-pressed="' + (current === n) + '">' + esc(n) + "</button>").join("");
  }
  function whoPanel(current) {
    return '<section class="panel"><h3>Who\'s flying</h3><div class="chips">' + whoChips(current, "data-pick-who") + "</div>" +
      '<div class="who-new"><input id="who-new" class="input" placeholder="Add a name, like Ana" maxlength="24" autocomplete="off"><button class="btn" data-act="who-add" type="button">Save</button></div>' +
      '<p class="hint">Friends\' flights stay out of your logbook.</p></section>';
  }

  function tzDiff(a, b, ts) {
    const h = (MA.tzOffset(ts, b) - MA.tzOffset(ts, a)) / HOUR;
    if (!h) return "Same time zone";
    const abs = Math.abs(h);
    return (h > 0 ? "+" : "−") + (Number.isInteger(abs) ? abs : abs.toFixed(1)) + " h";
  }

  let logRange = "all";
  function viewLogbook() {
    setTitle("Logbook");
    main().innerHTML =
      '<div class="wrap">' +
        '<div class="globe"><canvas id="globe-log" aria-label="Globe showing every route you have flown"></canvas><div class="caption" id="log-cap"></div></div>' +
        '<div id="log-body"></div>' +
      "</div>";
    const g = mountGlobe($("#globe-log"), { spin: true });

    function tick() {
      const now = Date.now();
      const year = new Date(now).getFullYear();
      const flown = allFlights().filter((f) => { const st = MA.status(f.data, now); return !f.who && st.done && !f.data.cancelled; });
      const set = logRange === "year" ? flown.filter((f) => new Date(f.data.dep.sched).getFullYear() === year) : flown;

      const km = set.reduce((s, f) => s + f.data.km, 0);
      const mins = set.reduce((s, f) => s + (f.data.arr.est - f.data.dep.est) / MIN, 0);
      const airports = new Set(); set.forEach((f) => { airports.add(f.data.from); airports.add(f.data.to); });
      const cities = new Set([...airports].map((a) => MA.AIRPORTS[a] && MA.AIRPORTS[a].city));
      const byAirline = {};
      set.forEach((f) => { const k = f.data.airline.iata; byAirline[k] = byAirline[k] || { n: 0, km: 0, a: f.data.airline }; byAirline[k].n++; byAirline[k].km += f.data.km; });
      const airlines = Object.values(byAirline).sort((a, b) => b.n - a.n || b.km - a.km);
      const byAirport = {};
      set.forEach((f) => [f.data.from, f.data.to].forEach((a) => { byAirport[a] = (byAirport[a] || 0) + 1; }));
      const topAirports = Object.entries(byAirport).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const longest = set.slice().sort((a, b) => b.data.km - a.data.km)[0];
      const onTime = set.filter((f) => (f.data.arr.est - f.data.arr.sched) / MIN <= 14).length;
      const years = {};
      flown.forEach((f) => { const y = new Date(f.data.dep.sched).getFullYear(); years[y] = (years[y] || 0) + 1; });
      const yKeys = Object.keys(years).sort();
      const yMax = Math.max(1, ...Object.values(years));
      const laps = km / 40075;

      g.set({ routes: set.map((f) => routeFor(f.data, null, { dim: false })) });
      $("#log-cap").textContent = set.length ? set.length + " flights · " + airports.size + " airports" : "No completed flights yet";

      const maxN = airlines.length ? airlines[0].n : 1;
      $("#log-body").innerHTML =
        '<section class="section">' +
          '<div class="seg" role="group" aria-label="Time range"><button data-range="all" aria-pressed="' + (logRange === "all") + '">All time</button><button data-range="year" aria-pressed="' + (logRange === "year") + '">' + year + "</button></div>" +
          (set.length ? (
          '<div class="stats">' +
            '<div class="stat"><span>Flights</span><b>' + set.length + "</b><em>" + onTime + " arrived on time</em></div>" +
            '<div class="stat"><span>Distance</span><b>' + distNum(km) + "<small>" + store.settings.units + "</small></b><em>" + (laps >= 0.1 ? laps.toFixed(1) + "× around the Earth" : Math.round(km / 384400 * 1000) / 10 + "% of the way to the Moon") + "</em></div>" +
            '<div class="stat"><span>Time aloft</span><b>' + Math.round(mins / 60) + "<small>h</small></b><em>" + (mins / 1440).toFixed(1) + " days in the sky</em></div>" +
            '<div class="stat"><span>Airports</span><b>' + airports.size + "</b><em>" + cities.size + " cities</em></div>" +
          "</div>" +
          (longest ? '<section class="panel"><h3>Longest flight</h3><div class="inbound"><span class="al-chip" style="--al:' + esc(longest.data.airline.color) + '">' + esc(longest.data.airline.iata) + '</span><div><b>' + esc(longest.data.from) + " → " + esc(longest.data.to) + '</b><p class="note">' + esc(prettyCode(longest.data.code)) + " · " + fmtDate(longest.data.dep.sched, MA.AIRPORTS[longest.data.from].tz, { year: "numeric" }) + "</p></div><b>" + dist(longest.data.km) + "</b></div></section>" : "") +
          '<section class="panel"><h3>Airlines</h3><ol class="rank">' +
            airlines.slice(0, 6).map((x) => '<li style="--al:' + esc(x.a.color) + '"><span class="al-chip">' + esc(x.a.iata) + '</span><span class="nm"><b>' + esc(x.a.name) + '</b><i style="width:' + Math.max(6, (x.n / maxN) * 100) + '%"></i></span><span class="n">' + x.n + "</span></li>").join("") +
          "</ol></section>" +
          '<section class="panel"><h3>Top airports</h3><ol class="rank">' +
            topAirports.map(([a, n]) => '<li><span class="al-chip" style="--al:var(--surface-2);color:var(--fg)">' + esc(a) + '</span><span class="nm"><b>' + esc(MA.AIRPORTS[a] ? MA.AIRPORTS[a].city : a) + '</b><i style="width:' + Math.max(6, (n / topAirports[0][1]) * 100) + '%"></i></span><span class="n">' + n + "</span></li>").join("") +
          "</ol></section>" +
          (yKeys.length > 1 || logRange === "all" ? '<section class="panel"><h3>Flights per year</h3><div class="years">' +
            yKeys.map((y) => '<div><b>' + years[y] + '</b><i style="height:' + (years[y] / yMax) * 100 + '%"></i><span>' + y + "</span></div>").join("") +
          "</div></section>" : "")
          ) : '<div class="empty"><b>Nothing logged ' + (logRange === "year" ? "this year" : "yet") + "</b>Flights appear here after they land.</div>") +
        "</section>";
    }
    main().onclick = (e) => {
      const b = e.target.closest("[data-range]");
      if (b) { logRange = b.dataset.range; tick(); }
    };
    tick();
    return { name: "logbook", tick };
  }

  // ---------- add-flight sheet ----------
  function isoDay(offset) {
    const d = new Date(Date.now() + offset * DAY);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function openAdd() {
    let date = isoDay(0);
    let results = [];
    const el = openSheet(
      '<div class="sheet-head"><h2>Add flight</h2><button class="icon-btn" data-act="close" aria-label="Close">' + ICON.close + "</button></div>" +
      '<form id="add-form" class="section" style="margin:0" autocomplete="off">' +
        '<div class="field"><label for="add-code">Flight number</label><input id="add-code" class="input code" inputmode="text" autocapitalize="characters" placeholder="IB6403" maxlength="8" required></div>' +
        '<div class="field"><label for="add-date">Date of departure</label>' +
          '<div class="chips" id="date-chips">' +
            '<button type="button" class="chip" data-day="-1">Yesterday</button><button type="button" class="chip" data-day="0" aria-pressed="true">Today</button><button type="button" class="chip" data-day="1">Tomorrow</button>' +
          "</div>" +
          '<input id="add-date" type="date" class="input" value="' + date + '"></div>' +
        '<div class="field"><label for="add-who">Who\'s flying?</label>' +
          '<div class="chips" id="who-chips">' + whoChips(store.settings.who === "friends" && knownPeople()[0] ? knownPeople()[0] : "", "data-who-pick") +
            '<button type="button" class="chip" data-who-other aria-pressed="false">Someone else</button></div>' +
          '<input id="add-who" class="input" placeholder="Their name, like Ana" maxlength="24" hidden></div>' +
        '<button class="btn primary block" id="add-find" type="submit">Find flight</button>' +
        '<p class="hint">' + (store.settings.apiKey ? "Searching live schedules from AeroDataBox." : "No live data key set, so results are simulated from the flight number. Add a key in Settings for real schedules.") + "</p>" +
        '<p class="error" id="add-error" hidden></p>' +
      "</form>" +
      '<div class="results" id="add-results"></div>'
    );
    const code = $("#add-code", el), dateIn = $("#add-date", el);
    setTimeout(() => code.focus(), 60);
    const syncChips = () => el.querySelectorAll("[data-day]").forEach((c) => c.setAttribute("aria-pressed", String(isoDay(+c.dataset.day) === dateIn.value)));
    el.addEventListener("click", (e) => {
      const w = e.target.closest("[data-who-pick], [data-who-other]");
      if (w) {
        el.querySelectorAll("#who-chips .chip").forEach((x) => x.setAttribute("aria-pressed", String(x === w)));
        const other = w.hasAttribute("data-who-other");
        $("#add-who", el).hidden = !other;
        if (other) $("#add-who", el).focus();
      }
      const c = e.target.closest("[data-day]");
      if (c) { dateIn.value = isoDay(+c.dataset.day); syncChips(); }
      const a = e.target.closest("[data-add]");
      if (a) addResult(results[+a.dataset.add]);
    });
    dateIn.addEventListener("change", syncChips);

    $("#add-form", el).addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("#add-error", el), out = $("#add-results", el), btn = $("#add-find", el);
      err.hidden = true; out.innerHTML = "";
      const fn = MA.parseFlightNumber(code.value);
      if (!fn) { err.textContent = "Enter an airline code and number, like IB6403 or AM 565."; err.hidden = false; return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIn.value)) { err.textContent = "Pick a departure date."; err.hidden = false; return; }
      date = dateIn.value;
      btn.disabled = true; btn.textContent = "Searching…";
      results = [];
      let note = "";
      if (store.settings.apiKey) {
        try { results = await MA.liveLookup(fn.code, date, store.settings.apiKey); if (!results.length) note = "No live schedule found for " + prettyCode(fn.code) + " on that date. Showing a simulated flight instead."; }
        catch (x) { note = (x.message && !/fetch/i.test(x.message) ? x.message : "Couldn't reach live data.") + " Showing a simulated flight instead."; }
      }
      if (!results.length) results = [MA.simulate(fn.code, date)];
      btn.disabled = false; btn.textContent = "Find flight";
      const now = Date.now();
      out.innerHTML = (note ? '<p class="note warn">' + esc(note) + "</p>" : "") +
        results.map((d, i) => card({ id: "preview" + i, data: d }, now).replace(/^<a /, "<div ").replace(/<\/a>$/, "</div>").replace(/ href="[^"]*"/, "") +
          '<button class="btn primary block" data-add="' + i + '">Add ' + esc(prettyCode(d.code)) + " · " + esc(d.from) + " → " + esc(d.to) + "</button>").join("");
    });

    function addResult(d) {
      if (!d) return;
      const id = "f" + Date.now().toString(36);
      const picked = el.querySelector('#who-chips [aria-pressed="true"]');
      const who = !picked ? "" : picked.hasAttribute("data-who-other") ? cleanName($("#add-who", el).value) : picked.getAttribute("data-who-pick");
      if (picked && picked.hasAttribute("data-who-other") && !who) { toast("Type the person's name first"); $("#add-who", el).focus(); return; }
      store.flights.push({ id, code: d.code, date: d.date, who, data: d.source === "live" ? d : null, addedAt: Date.now() });
      store.settings.who = who ? "friends" : "mine";
      save(); closeSheet(); toast("Added " + prettyCode(d.code));
      location.hash = "f-" + id;
    }
  }

  // ---------- settings sheet ----------
  function openSettings() {
    const s = store.settings;
    const seg = (name, opts) => '<div class="seg" role="group">' + opts.map(([v, l]) => '<button type="button" data-set="' + name + '" data-val="' + v + '" aria-pressed="' + (s[name] === v) + '">' + l + "</button>").join("") + "</div>";
    const el = openSheet(
      '<div class="sheet-head"><h2>Settings</h2><button class="icon-btn" data-act="close" aria-label="Close">' + ICON.close + "</button></div>" +
      '<section class="panel" style="gap:0">' +
        '<div class="setting"><div><b>Distance</b><small>Used for routes and your logbook</small></div>' + seg("units", [["km", "km"], ["mi", "mi"]]) + "</div>" +
        '<div class="setting"><div><b>Clock</b><small>Times are always local to each airport</small></div>' + seg("clock", [["24", "24 h"], ["12", "12 h"]]) + "</div>" +
        '<div class="setting"><div><b>Sample trips</b><small>Example flights to explore the app</small></div>' + seg("samples", [[true, "Show"], [false, "Hide"]]) + "</div>" +
      "</section>" +
      '<form id="key-form" class="panel" autocomplete="off"><h3>Live flight data</h3>' +
        '<div class="field"><label for="api-key">AeroDataBox API key (RapidAPI)</label><input id="api-key" class="input" type="password" placeholder="Paste your key" value="' + esc(s.apiKey) + '"></div>' +
        '<p class="hint">With a key, new flights use real schedules, gates and delays. Get a free key at <a href="https://rapidapi.com/aedbx-aedbx/api/aerodatabox" target="_blank" rel="noopener">rapidapi.com</a>. The key stays on this device.</p>' +
        '<button class="btn block" type="submit">Save key</button>' +
      "</form>" +
      '<p class="hint">MiAvion · flight tracker · map data from Natural Earth</p>'
    );
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-set]");
      if (!b) return;
      let v = b.dataset.val; if (v === "true") v = true; if (v === "false") v = false;
      s[b.dataset.set] = v;
      if (b.dataset.set === "samples" && v) store.hiddenSamples = [];
      save();
      b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      if (view) view.tick();
    });
    $("#key-form", el).addEventListener("submit", (e) => {
      e.preventDefault();
      s.apiKey = $("#api-key", el).value.trim(); save();
      toast(s.apiKey ? "Key saved" : "Key removed");
    });
  }

  // ---------- sheet + toast plumbing ----------
  let sheetEl = null;
  function openSheet(html) {
    closeSheet();
    sheetEl = document.createElement("div");
    sheetEl.className = "scrim";
    sheetEl.innerHTML = '<div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + "</div>";
    sheetEl.addEventListener("click", (e) => {
      if (e.target === sheetEl || e.target.closest('[data-act="close"]')) closeSheet();
    });
    document.body.appendChild(sheetEl);
    return sheetEl;
  }
  function closeSheet() { if (sheetEl) { sheetEl.remove(); sheetEl = null; } }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

  let toastT;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    clearTimeout(toastT);
    toastT = setTimeout(() => t.remove(), 2600);
  }

  // ---------- header / routing ----------
  function setTitle(t) { const el = $("#top-title"); if (el) el.textContent = t; }
  function renderTop(name) {
    const top = $("#top");
    if (name === "detail") {
      top.innerHTML = '<div class="wrap"><a class="icon-btn" href="#" aria-label="Back to flights">' + ICON.back + '</a><span class="title" id="top-title"></span></div>';
    } else {
      top.innerHTML = '<div class="wrap"><span class="brand">' + ICON.plane + "MiAvion</span>" +
        '<span class="spacer"></span><button class="icon-btn" id="open-settings" aria-label="Settings">' + ICON.gear + "</button></div>";
      $("#open-settings").onclick = openSettings;
    }
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-current", t.dataset.tab === name || (name === "detail" && t.dataset.tab === "flights") ? "page" : "false"));
  }
  function route() {
    const h = location.hash.replace(/^#/, "");
    main().onclick = null;
    main().onkeydown = null;
    window.scrollTo(0, 0);
    if (h.startsWith("f-")) { renderTop("detail"); view = viewDetail(h.slice(2)); }
    else if (h === "logbook") { renderTop("logbook"); view = viewLogbook(); }
    else { renderTop("flights"); view = viewFlights(); setTitle(""); }
    if (!view) { renderTop("flights"); view = viewFlights(); }
  }

  // Home-view clicks that don't belong to a specific view (banner button).
  document.addEventListener("click", (e) => {
    const b = e.target.closest('[data-act="hide-samples"]');
    if (b) { store.settings.samples = false; save(); toast("Samples hidden. Turn them back on in Settings."); view && view.tick(); }
  });

  function boot() {
    document.querySelector(".tabbar .wrap").innerHTML =
      '<a class="tab" data-tab="flights" href="#">' + ICON.list + "Flights</a>" +
      '<button class="fab" id="fab" aria-label="Add flight">' + ICON.plus + "</button>" +
      '<a class="tab" data-tab="logbook" href="#logbook">' + ICON.book + "Logbook</a>";
    $("#fab").onclick = openAdd;
    window.addEventListener("hashchange", route);
    route();
    setInterval(() => { if (view && !document.hidden) view.tick(); }, 10000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && view) view.tick(); });

    // Re-read globe colors when the theme changes.
    const retheme = () => { if (globe) globe.readColors(); if (view) view.tick(); };
    if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);
    new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register("sw.js").catch(() => { /* not available here */ });
    }
  }

  MA.app = { boot, store };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
