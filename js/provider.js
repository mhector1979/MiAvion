// Live flight data via AeroDataBox (RapidAPI). Optional: used only when the
// user saves an API key in Settings. Results are mapped to the same shape
// the simulator produces, so the rest of the app doesn't care where data came from.
(function () {
  const HOST = "aerodatabox.p.rapidapi.com";

  function t(v) {
    if (!v) return null;
    const s = typeof v === "string" ? v : v.utc;
    if (!s) return null;
    const ts = Date.parse(s.replace(" ", "T").replace(/Z?$/, "Z"));
    return isNaN(ts) ? null : ts;
  }

  // Register airports we don't ship with, so the globe can draw them.
  function ensureAirport(a) {
    if (!a || !a.iata) return null;
    if (!MA.AIRPORTS[a.iata] && a.location) {
      MA.AIRPORTS[a.iata] = {
        iata: a.iata, name: a.name || a.iata, city: a.municipalityName || a.shortName || a.name || a.iata,
        lat: a.location.lat, lon: a.location.lon, tz: a.timeZone || "UTC", terminals: ["1"],
      };
    }
    return a.iata;
  }

  function map(x, date) {
    const D = x.departure || {}, A = x.arrival || {};
    const from = ensureAirport(D.airport), to = ensureAirport(A.airport);
    if (!from || !to || !MA.AIRPORTS[from] || !MA.AIRPORTS[to]) return null;
    const fn = MA.parseFlightNumber(x.number);
    const al = MA.airline(fn ? fn.airline : (x.airline && x.airline.iata) || "XX");
    const schedDep = t(D.scheduledTime), schedArr = t(A.scheduledTime);
    if (!schedDep || !schedArr) return null;
    const km = x.greatCircleDistance && x.greatCircleDistance.km
      ? Math.round(x.greatCircleDistance.km)
      : Math.round(MA.distanceKm(MA.AIRPORTS[from], MA.AIRPORTS[to]));
    const status = String(x.status || "").toLowerCase();
    return {
      code: fn ? fn.code : x.number.replace(/\s/g, ""),
      airline: { iata: al.iata, name: (x.airline && x.airline.name) || al.name, color: al.color },
      date, from, to, km,
      dep: {
        sched: schedDep,
        est: t(D.revisedTime) || t(D.predictedTime) || schedDep,
        runway: t(D.runwayTime),
        terminal: D.terminal || "—", gate: D.gate || "—", checkin: D.checkInDesk || "—",
      },
      arr: {
        sched: schedArr,
        est: t(A.revisedTime) || t(A.predictedTime) || schedArr,
        runway: t(A.runwayTime),
        terminal: A.terminal || "—", gate: A.gate || "—", belt: A.baggageBelt || "—",
      },
      delayReason: null,
      cancelled: status.includes("cancel"),
      aircraft: {
        type: (x.aircraft && x.aircraft.model) || "Aircraft not assigned",
        reg: (x.aircraft && x.aircraft.reg) || "—", seats: null, built: null,
      },
      cruiseFt: km < 2600 ? 36000 : 38000,
      inbound: null,
      source: "live",
      fetchedAt: Date.now(),
    };
  }

  MA.liveLookup = async function (code, date, key) {
    const url = "https://" + HOST + "/flights/number/" + encodeURIComponent(code) + "/" + date + "?withAircraftImage=false&withLocation=false";
    const res = await fetch(url, { headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": HOST } });
    if (res.status === 204 || res.status === 404) return [];
    if (res.status === 401 || res.status === 403) throw new Error("The API key was rejected. Check it in Settings.");
    if (res.status === 429) throw new Error("Live data limit reached for now. Try again later.");
    if (!res.ok) throw new Error("Live data service returned an error (" + res.status + ").");
    const body = await res.json();
    return (Array.isArray(body) ? body : []).map((x) => map(x, date)).filter(Boolean);
  };
})();
