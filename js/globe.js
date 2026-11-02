// Interactive globe on a <canvas>: land, flight arcs, airports and the live plane.
// Drag to spin. Colors come from CSS custom properties so it follows the theme.
(function () {
  // Land color by latitude: ice caps, tundra, boreal and temperate forest,
  // subtropical deserts and the green equatorial belt.
  const LAND_RAMP = [
    [-90, "#F4F8FA"], [-66, "#E8EFF2"], [-54, "#8C9F7A"], [-44, "#6A9550"],
    [-30, "#B9A26C"], [-20, "#A9965E"], [-12, "#4E8A3C"], [0, "#2E7634"],
    [10, "#4C8A3A"], [17, "#B79E66"], [24, "#D2B57C"], [32, "#BFA673"],
    [40, "#7EA057"], [52, "#4D7E44"], [62, "#5E7F52"], [67, "#8D9A7C"],
    [74, "#CFD8D4"], [81, "#F2F6F8"], [90, "#F7FAFB"],
  ];
  function rampColor(lat) {
    for (let i = 1; i < LAND_RAMP.length; i++) {
      const [l1, c1] = LAND_RAMP[i];
      if (lat <= l1) {
        const [l0, c0] = LAND_RAMP[i - 1];
        return d3.interpolateRgb(c0, c1)((lat - l0) / (l1 - l0));
      }
    }
    return LAND_RAMP[LAND_RAMP.length - 1][1];
  }
  // Color lookup table: one RGB entry per 0.25° of latitude.
  const LUT_STEP = 0.25;
  const LUT = [];
  for (let lat = -90; lat <= 90; lat += LUT_STEP) {
    const c = d3.rgb(rampColor(lat));
    LUT.push([c.r, c.g, c.b]);
  }

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  class Globe {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.opts = Object.assign({ spin: false, tilt: 18 }, opts || {});
      this.rotate = [10, -25, 0];
      this.target = null;
      this.routes = [];
      this.planes = [];
      this.dragging = false;
      this.lastInteract = 0;
      this.proj = d3.geoOrthographic().clipAngle(90).precision(0.4);
      this.path = d3.geoPath(this.proj, this.ctx);
      this.reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.readColors();
      this.bind();
      this.resize();
      this.loop = this.loop.bind(this);
      this.running = true;
      requestAnimationFrame(this.loop);
    }

    readColors() {
      this.c = {
        ocean: css("--ocean"), oceanDeep: css("--ocean-deep"), coast: css("--coast"),
        grid: css("--grid"), rim: css("--rim"), fg: css("--fg"), accent: css("--accent"),
        bg: css("--bg"), route: css("--route"), under: css("--route-under"),
      };
    }

    bind() {
      const el = this.canvas;
      let start = null;
      el.addEventListener("pointerdown", (e) => {
        this.dragging = true;
        this.target = null;
        start = { x: e.clientX, y: e.clientY, r: this.rotate.slice() };
        el.setPointerCapture(e.pointerId);
      });
      el.addEventListener("pointermove", (e) => {
        if (!this.dragging || !start) return;
        const k = 90 / this.scale;
        this.rotate = [start.r[0] + (e.clientX - start.x) * k, Math.max(-80, Math.min(80, start.r[1] - (e.clientY - start.y) * k)), 0];
        this.lastInteract = performance.now();
      });
      const end = () => { this.dragging = false; start = null; this.lastInteract = performance.now(); };
      el.addEventListener("pointerup", end);
      el.addEventListener("pointercancel", end);
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(el);
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.scale = Math.min(this.w, this.h) * 0.44 * (this.opts.zoom || 1);
      this.proj.translate([this.w / 2, this.h / 2 + (this.opts.offsetY || 0) * this.h]).scale(this.scale);
    }

    // routes: [{from:{lat,lon}, to:{lat,lon}, color, progress, dim}]
    // planes: [{lat, lon, heading, color}]
    set(data) {
      this.routes = data.routes || [];
      this.planes = data.planes || [];
      if (data.focus) this.focusOn(data.focus, data.jump);
    }

    focusOn(p, jump) {
      const t = [-p.lon, Math.max(-60, Math.min(60, -p.lat + this.opts.tilt * 0)), 0];
      if (jump || this.reduce) { this.rotate = t; this.target = null; }
      else this.target = t;
    }

    destroy() {
      this.running = false;
      if (this.ro) this.ro.disconnect();
    }

    loop(ts) {
      if (!this.running) return;
      if (!this.canvas.isConnected) { this.destroy(); return; }
      if (this.target) {
        let dx = this.target[0] - this.rotate[0];
        dx = ((dx + 540) % 360) - 180;
        const dy = this.target[1] - this.rotate[1];
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) { this.rotate = this.target; this.target = null; }
        else this.rotate = [this.rotate[0] + dx * 0.08, this.rotate[1] + dy * 0.08, 0];
      } else if (this.opts.spin && !this.dragging && !this.reduce && ts - this.lastInteract > 2500) {
        this.rotate = [this.rotate[0] + 0.04, this.rotate[1], 0];
      }
      this.draw(ts);
      requestAnimationFrame(this.loop);
    }

    // Low-resolution image of land color by latitude for the current view.
    // The coastline clip keeps edges sharp, so a coarse, smoothed field is enough.
    landField(r) {
      const n = Math.max(48, Math.min(240, Math.round(r * 0.8)));
      const key = n + "|" + this.rotate[1].toFixed(2);
      if (this.fieldKey === key) return this.field;
      if (!this.field) this.field = document.createElement("canvas");
      const f = this.field;
      if (f.width !== n) { f.width = n; f.height = n; this.fieldData = f.getContext("2d").createImageData(n, n); }
      const img = this.fieldData, px = img.data;
      const latC = -this.rotate[1] * Math.PI / 180;
      const sinC = Math.sin(latC), cosC = Math.cos(latC);
      const last = LUT.length - 1;
      for (let j = 0; j < n; j++) {
        const y = 1 - ((j + 0.5) / n) * 2;
        for (let i = 0; i < n; i++) {
          const x = ((i + 0.5) / n) * 2 - 1;
          const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
          const lat = Math.asin(Math.max(-1, Math.min(1, y * cosC + z * sinC))) * 180 / Math.PI;
          const k = (lat + 90) / LUT_STEP;
          const k0 = Math.min(last, Math.floor(k)), k1 = Math.min(last, k0 + 1), t = k - k0;
          const a = LUT[k0], b = LUT[k1], o = (j * n + i) * 4;
          px[o] = a[0] + (b[0] - a[0]) * t;
          px[o + 1] = a[1] + (b[1] - a[1]) * t;
          px[o + 2] = a[2] + (b[2] - a[2]) * t;
          px[o + 3] = 255;
        }
      }
      f.getContext("2d").putImageData(img, 0, 0);
      this.fieldKey = key;
      return f;
    }

    draw(ts) {
      const { ctx, c, proj, path } = this;
      proj.rotate(this.rotate);
      ctx.clearRect(0, 0, this.w, this.h);
      const [cx, cy] = proj.translate();
      const r = proj.scale();

      // Atmosphere halo
      const halo = ctx.createRadialGradient(cx, cy, r * 0.97, cx, cy, r * 1.1);
      halo.addColorStop(0, c.rim);
      halo.addColorStop(1, c.rim.replace(/rgba?\(([^,]+),([^,]+),([^,)]+).*$/, "rgba($1,$2,$3,0)"));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2); ctx.fill();

      // Ocean: lighter where the sun hits, deeper toward the edge
      const sea = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy, r);
      sea.addColorStop(0, c.ocean);
      sea.addColorStop(1, c.oceanDeep);
      ctx.fillStyle = sea;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // Graticule
      ctx.beginPath(); path(d3.geoGraticule10());
      ctx.strokeStyle = c.grid; ctx.lineWidth = 0.6; ctx.stroke();

      // Land, painted in latitude bands clipped to the coastline
      ctx.save();
      ctx.beginPath(); path(window.MA_LAND); ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.landField(r), cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
      ctx.beginPath(); path(window.MA_LAND);
      ctx.strokeStyle = c.coast; ctx.lineWidth = 0.7; ctx.stroke();

      // Sunlight and night-side shading for a round look
      const shade = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r);
      shade.addColorStop(0, "rgba(255,255,255,0.22)");
      shade.addColorStop(0.45, "rgba(255,255,255,0)");
      shade.addColorStop(1, "rgba(0,10,30,0.35)");
      ctx.fillStyle = shade;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // Routes
      const center = [-this.rotate[0], -this.rotate[1]];
      const visible = (p) => d3.geoDistance([p.lon, p.lat], center) < Math.PI / 2 - 0.01;
      this.routes.forEach((rt) => {
        const line = { type: "LineString", coordinates: d3.range(0, 1.0001, 1 / 64).map((t) => { const p = MA.interpolate(rt.from, rt.to, t); return [p.lon, p.lat]; }) };
        ctx.globalAlpha = rt.dim ? 0.45 : 1;
        if (rt.progress != null && rt.progress > 0 && rt.progress < 1) {
          const k = Math.max(1, Math.round(rt.progress * 64));
          const flown = { type: "LineString", coordinates: line.coordinates.slice(0, k + 1) };
          const rest = { type: "LineString", coordinates: line.coordinates.slice(k) };
          ctx.setLineDash([3, 4]);
          ctx.beginPath(); path(rest); ctx.strokeStyle = c.under; ctx.lineWidth = 3.5; ctx.stroke();
          ctx.beginPath(); path(rest); ctx.strokeStyle = rt.color; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath(); path(flown); ctx.strokeStyle = c.under; ctx.lineWidth = 5; ctx.stroke();
          ctx.beginPath(); path(flown); ctx.strokeStyle = rt.color; ctx.lineWidth = 2.6; ctx.stroke();
        } else {
          const w = rt.dim ? 1.3 : 2.2;
          ctx.beginPath(); path(line); ctx.strokeStyle = c.under; ctx.lineWidth = w + 2.4; ctx.stroke();
          ctx.beginPath(); path(line); ctx.strokeStyle = rt.color; ctx.lineWidth = w; ctx.stroke();
        }
        [rt.from, rt.to].forEach((p) => {
          if (!visible(p)) return;
          const [x, y] = proj([p.lon, p.lat]);
          ctx.beginPath(); ctx.arc(x, y, rt.dim ? 2 : 3.2, 0, Math.PI * 2);
          ctx.fillStyle = rt.color; ctx.fill();
          ctx.lineWidth = 1.6; ctx.strokeStyle = c.under; ctx.stroke();
          if (rt.labels && p.iata) {
            ctx.font = "700 11px " + css("--font-mono");
            ctx.textAlign = "center"; ctx.lineJoin = "round";
            ctx.lineWidth = 3; ctx.strokeStyle = c.under; ctx.strokeText(p.iata, x, y - 8);
            ctx.fillStyle = "#FFFFFF"; ctx.fillText(p.iata, x, y - 8);
          }
        });
        ctx.globalAlpha = 1;
      });

      // Planes
      this.planes.forEach((pl) => {
        if (!visible(pl)) return;
        const [x, y] = proj([pl.lon, pl.lat]);
        const ahead = MA.interpolate(pl, pl.next || pl, 1);
        const [x2, y2] = proj([ahead.lon, ahead.lat]) || [x, y - 1];
        const ang = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
        const pulse = this.reduce ? 0.5 : (Math.sin(ts / 420) + 1) / 2;
        ctx.beginPath(); ctx.arc(x, y, 11 + pulse * 6, 0, Math.PI * 2);
        ctx.fillStyle = pl.color; ctx.globalAlpha = 0.18; ctx.fill(); ctx.globalAlpha = 1;
        drawPlane(ctx, x, y, ang, 14, pl.color, c.under);
      });
    }
  }

  // Simple top-down airliner silhouette pointing "up" before rotation.
  function drawPlane(ctx, x, y, ang, s, fill, stroke) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s / 24, s / 24);
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.bezierCurveTo(1.6, -12, 1.8, -9, 1.8, -6);
    ctx.lineTo(1.8, -2); ctx.lineTo(11, 3.5); ctx.lineTo(11, 6); ctx.lineTo(1.8, 3);
    ctx.lineTo(1.6, 8.5); ctx.lineTo(4.5, 11); ctx.lineTo(4.5, 12.5); ctx.lineTo(0, 11.3);
    ctx.lineTo(-4.5, 12.5); ctx.lineTo(-4.5, 11); ctx.lineTo(-1.6, 8.5); ctx.lineTo(-1.8, 3);
    ctx.lineTo(-11, 6); ctx.lineTo(-11, 3.5); ctx.lineTo(-1.8, -2); ctx.lineTo(-1.8, -6);
    ctx.bezierCurveTo(-1.8, -9, -1.6, -12, 0, -12);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 1.4; ctx.strokeStyle = stroke; ctx.stroke();
    ctx.restore();
  }

  MA.Globe = Globe;
})();
