# MiAvion

A personal flight tracker you can install on your phone. Add a flight by its number and MiAvion follows it from check-in to baggage claim.

## Features

- **Your flights**: in-progress, upcoming and past flights as cards with status, gate, delay and a countdown.
- **Live progress**: a 3D globe (drag to spin) with the route and the plane's current position.
- **Flight detail**: departure and arrival times (scheduled vs. expected), terminal, gate, check-in desk, baggage belt, altitude, speed and heading in flight.
- **Day of travel timeline**: check-in, boarding, gate close, pushback, takeoff, landing, gate arrival, bags.
- **Where your plane is now**: the inbound aircraft's leg and how much turnaround time is left.
- **Logbook**: total flights, distance, hours aloft, airports, top airlines and airports, longest flight, flights per year.
- **Settings**: km or miles, 24 or 12 hour clock, sample trips on or off.
- Works offline and installs to the home screen (PWA). Data stays on the device.

## Flight data

Out of the box, flights are **simulated**: the route, times, gates and delays are generated from the flight number and date, so the app is fully usable without an account. Sample trips are shown until you hide them.

For **real schedules**, get a free [AeroDataBox](https://rapidapi.com/aedbx-aedbx/api/aerodatabox) key on RapidAPI and paste it in Settings → Live flight data. New flights are then looked up live, and each live flight has a Refresh button.

## Run it

It's a static site with no build step:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

To host it, enable GitHub Pages on this repository (Settings → Pages → deploy from branch, root folder). Then open the site on your phone and choose "Add to Home Screen".

## Code layout

| File | What it does |
| --- | --- |
| `index.html` | App shell |
| `css/app.css` | Styles, dark and light themes |
| `js/data.js` | Airports and airlines |
| `js/sim.js` | Time zones, great-circle math, flight simulator, status engine |
| `js/provider.js` | AeroDataBox live data, mapped to the same shape as the simulator |
| `js/globe.js` | Canvas globe (d3-geo) |
| `js/app.js` | Storage, views, add flight and settings sheets |
| `js/land.js` | Natural Earth land outlines (public domain) |
| `sw.js`, `manifest.webmanifest` | Offline support and install |
