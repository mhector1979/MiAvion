// Flight model: time-zone helpers, a deterministic flight simulator,
// and the status engine that turns a flight + "now" into a phase.
(function () {
  const MIN = 60000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  MA.MIN = MIN; MA.HOUR = HOUR; MA.DAY = DAY;

  // ---------- hashing / pseudo-random ----------
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seed) {
    let s = hash(seed) || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  MA.hash = hash;

  // ---------- time zones ----------
  const dtfCache = {};
  function partsIn(ts, tz) {
    let f = dtfCache[tz];
    if (!f) {
      f = dtfCache[tz] = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit",
        day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
      });
    }
    const o = {};
    f.formatToParts(new Date(ts)).forEach((p) => { if (p.type !== "literal") o[p.type] = +p.value; });
    return o;
  }
  function tzOffset(ts, tz) {
    const p = partsIn(ts, tz);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - Math.floor(ts / 1000) * 1000;
  }
  // Local wall-clock time in a zone -> UTC timestamp.
  function zonedToUtc(y, m, d, h, min, tz) {
    const guess = Date.UTC(y, m - 1, d, h, min);
    let ts = guess - tzOffset(guess, tz);
    ts = guess - tzOffset(ts, tz);
    return ts;
  }
  // "YYYY-MM-DD" for a timestamp in a zone.
  function localDate(ts, tz) {
    const p = partsIn(ts, tz);
    return p.year + "-" + String(p.month).padStart(2, "0") + "-" + String(p.day).padStart(2, "0");
  }
  MA.tzOffset = tzOffset;
  MA.zonedToUtc = zonedToUtc;
  MA.localDate = localDate;
  MA.partsIn = partsIn;

  // ---------- geography ----------
  const R = 6371;
  function distanceKm(a, b) {
    const toRad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * toRad;
    const dLon = (b.lon - a.lon) * toRad;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  // Point at fraction f along the great circle from a to b.
  function interpolate(a, b, f) {
    const toRad = Math.PI / 180, toDeg = 180 / Math.PI;
    const φ1 = a.lat * toRad, λ1 = a.lon * toRad, φ2 = b.lat * toRad, λ2 = b.lon * toRad;
    const d = distanceKm(a, b) / R;
    if (d === 0) return { lat: a.lat, lon: a.lon };
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    return { lat: Math.atan2(z, Math.sqrt(x * x + y * y)) * toDeg, lon: Math.atan2(y, x) * toDeg };
  }
  function bearing(a, b) {
    const toRad = Math.PI / 180;
    const φ1 = a.lat * toRad, φ2 = b.lat * toRad, Δλ = (b.lon - a.lon) * toRad;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  MA.distanceKm = distanceKm;
  MA.interpolate = interpolate;
  MA.bearing = bearing;

  // Block time (gate to gate) for a distance.
  function blockMinutes(km) {
    return Math.round((km / 820) * 60 + 32);
  }

  // ---------- flight number parsing ----------
  MA.parseFlightNumber = function (raw) {
    const s = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const m = s.match(/^([A-Z][A-Z0-9]|[0-9][A-Z])(\d{1,4})$/);
    if (!m) return null;
    return { airline: m[1], num: String(+m[2]), code: m[1] + String(+m[2]) };
  };

  // ---------- simulator ----------
  // Builds a complete flight from a flight number + origin-local date.
  // opts: { from, to, depUtc, delay, cancelled } override the generated values.
  MA.simulate = function (code, date, opts) {
    opts = opts || {};
    const fn = MA.parseFlightNumber(code);
    const airline = MA.airline(fn.airline);
    const r = rng(fn.code);              // stable per flight number (route, time)
    const rd = rng(fn.code + "|" + date); // varies per day (delay, gate)

    // Route: odd numbers fly out of a hub, even numbers fly back.
    const all = Object.keys(MA.AIRPORTS);
    const hub = airline.hubs[Math.floor(r() * airline.hubs.length)];
    let other;
    for (let i = 0; i < 40; i++) {
      other = all[Math.floor(r() * all.length)];
      const km = distanceKm(MA.AIRPORTS[hub], MA.AIRPORTS[other]);
      if (other !== hub && km > 350 && km < 14500) break;
    }
    let from = +fn.num % 2 ? hub : other;
    let to = +fn.num % 2 ? other : hub;
    if (opts.from) from = opts.from;
    if (opts.to) to = opts.to;
    const A = MA.AIRPORTS[from], B = MA.AIRPORTS[to];
    const km = Math.round(distanceKm(A, B));
    const block = blockMinutes(km);

    // Scheduled departure in origin local time.
    const [y, mo, d] = date.split("-").map(Number);
    const depHour = 6 + Math.floor(r() * 17);
    const depMin = Math.floor(r() * 12) * 5;
    const schedDep = opts.depUtc != null ? opts.depUtc : zonedToUtc(y, mo, d, depHour, depMin, A.tz);
    const schedArr = schedDep + block * MIN;

    // Aircraft and registration (stable per flight number).
    const fam = km < 2600 ? "short" : km < 7500 ? "medium" : "long";
    const ac = MA.AIRCRAFT[fam][Math.floor(r() * MA.AIRCRAFT[fam].length)];
    const letters = "ABCDEFGHJKLMNPRSTUVWXYZ";
    let reg;
    if (airline.reg === "N") reg = "N" + (100 + Math.floor(rd() * 899)) + letters[Math.floor(rd() * 23)] + letters[Math.floor(rd() * 23)];
    else if (airline.reg === "JA" || airline.reg === "HL") reg = airline.reg + (1000 + Math.floor(rd() * 8999));
    else reg = airline.reg + [0, 1, 2].map(() => letters[Math.floor(rd() * 23)]).join("");
    const built = 2012 + Math.floor(rd() * 13);

    // Inbound aircraft ("where's my plane"): previous leg landing at origin.
    const prevFrom = all.filter((k) => k !== from)[Math.floor(rd() * (all.length - 1))];
    const prevKm = Math.round(distanceKm(MA.AIRPORTS[prevFrom], A));
    const turn = 55 + Math.floor(rd() * 50);
    const inSchedArr = schedDep - turn * MIN;
    const inDelay = rd() < 0.7 ? Math.floor(rd() * 8) - 4 : 15 + Math.floor(rd() * 80);
    const inEstArr = inSchedArr + inDelay * MIN;
    const inbound = {
      code: airline.iata + (1000 + Math.floor(rd() * 8999)),
      from: prevFrom, to: from, km: prevKm,
      schedDep: inSchedArr - blockMinutes(prevKm) * MIN,
      estDep: inEstArr - blockMinutes(prevKm) * MIN,
      schedArr: inSchedArr, estArr: inEstArr,
    };

    // Delay: own causes, or late inbound aircraft (needs 40 min to turn).
    let delay;
    const roll = rd();
    if (roll < 0.62) delay = Math.floor(rd() * 6) - 3;
    else if (roll < 0.94) delay = 10 + Math.floor(rd() * 60);
    else delay = 60 + Math.floor(rd() * 120);
    const knock = Math.round((inEstArr + 40 * MIN - schedDep) / MIN);
    let reason = delay > 9 ? ["Air traffic control", "Weather at destination", "Crew scheduling", "Late baggage loading"][Math.floor(rd() * 4)] : null;
    if (knock > delay) { delay = knock; reason = "Late-arriving aircraft"; }
    if (opts.delay != null) { delay = opts.delay; reason = delay > 9 ? (opts.reason || "Air traffic control") : null; }
    const arrDelay = delay > 0 ? Math.round(delay * 0.85) : delay;

    const gate = (t, ap) => {
      const term = ap.terminals[Math.floor(rd() * ap.terminals.length)];
      const pier = /^\d/.test(term) ? "ABCD"[Math.floor(rd() * 4)] : term[0];
      return { terminal: term, gate: pier + (1 + Math.floor(rd() * 48)) };
    };
    const dg = gate("d", A), ag = gate("a", B);

    return {
      code: fn.code,
      airline: { iata: airline.iata, name: airline.name, color: airline.color },
      date,
      from, to, km,
      dep: { sched: schedDep, est: schedDep + delay * MIN, terminal: dg.terminal, gate: dg.gate, checkin: String(10 + Math.floor(rd() * 80)) },
      arr: { sched: schedArr, est: schedArr + arrDelay * MIN, terminal: ag.terminal, gate: ag.gate, belt: String(1 + Math.floor(rd() * 14)) },
      delayReason: reason,
      cancelled: !!opts.cancelled,
      aircraft: { type: ac.type, seats: ac.seats, reg, built },
      cruiseFt: fam === "short" ? 35000 + Math.floor(r() * 3) * 1000 : 37000 + Math.floor(r() * 4) * 1000,
      inbound,
      source: "sim",
    };
  };

  // ---------- status engine ----------
  // Phases, in order. Times are gate-out (dep.est) and gate-in (arr.est).
  const TAXI_OUT = 14 * MIN, TAXI_IN = 7 * MIN;
  MA.status = function (f, now) {
    const dep = f.dep.actual || f.dep.est;
    const arr = f.arr.actual || f.arr.est;
    const takeoff = f.dep.runway || dep + TAXI_OUT;
    const landing = f.arr.runway || arr - TAXI_IN;
    const depDelay = Math.round((f.dep.est - f.dep.sched) / MIN);
    const arrDelay = Math.round((f.arr.est - f.arr.sched) / MIN);
    const s = { dep, arr, takeoff, landing, depDelay, arrDelay, progress: 0 };

    if (f.cancelled) return Object.assign(s, { phase: "cancelled", label: "Cancelled", tone: "bad" });

    if (now < dep - 45 * MIN) {
      Object.assign(s, { phase: "scheduled", label: depDelay > 9 ? "Delayed " + MA.fmtDur(depDelay) : depDelay < -4 ? "Early" : "On time" });
    } else if (now < dep - 15 * MIN) {
      Object.assign(s, { phase: "boarding", label: "Boarding" });
    } else if (now < dep) {
      Object.assign(s, { phase: "closing", label: "Gate closing" });
    } else if (now < takeoff) {
      Object.assign(s, { phase: "taxi-out", label: "Taxiing" });
    } else if (now < landing) {
      s.progress = (now - takeoff) / (landing - takeoff);
      Object.assign(s, { phase: "airborne", label: "In flight" });
    } else if (now < arr) {
      s.progress = 1;
      Object.assign(s, { phase: "taxi-in", label: "Landed" });
    } else {
      s.progress = 1;
      Object.assign(s, { phase: "arrived", label: "Arrived" });
    }
    const late = s.phase === "scheduled" || s.phase === "boarding" || s.phase === "closing" ? depDelay : arrDelay;
    s.tone = late > 44 ? "bad" : late > 9 ? "warn" : "ok";
    s.done = s.phase === "arrived";
    s.live = ["boarding", "closing", "taxi-out", "airborne", "taxi-in"].includes(s.phase);
    return s;
  };

  // Live telemetry for an airborne flight: position, heading, altitude, speed.
  MA.telemetry = function (f, st, now) {
    const A = MA.AIRPORTS[f.from], B = MA.AIRPORTS[f.to];
    const p = Math.max(0, Math.min(1, st.progress));
    const pos = interpolate(A, B, p);
    const ahead = interpolate(A, B, Math.min(1, p + 0.002));
    const t = now - st.takeoff, left = st.landing - now;
    const climb = 22 * MIN, descent = 28 * MIN;
    let alt = f.cruiseFt || 37000;
    if (st.phase !== "airborne") alt = 0;
    else if (t < climb) alt = alt * Math.sin((t / climb) * Math.PI / 2);
    else if (left < descent) alt = alt * Math.sin((left / descent) * Math.PI / 2);
    const cruiseKts = 470 + (MA.hash(f.code) % 40);
    const kts = st.phase !== "airborne" ? 0 : Math.round(150 + (cruiseKts - 150) * (alt / (f.cruiseFt || 37000)));
    return {
      pos, heading: bearing(pos, ahead),
      altFt: Math.round(alt / 100) * 100, kts,
      flownKm: Math.round(f.km * p), leftKm: Math.round(f.km * (1 - p)),
    };
  };

  MA.fmtDur = function (mins) {
    mins = Math.round(Math.abs(mins));
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h && m) return h + "h " + m + "m";
    if (h) return h + "h";
    return m + "m";
  };
})();
