// Interactive globe on a <canvas>: land, flight arcs, airports and the live plane.
// Drag to spin. Colors come from CSS custom properties so it follows the theme.
(function () {
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
        ocean: css("--ocean"), land: css("--land"), coast: css("--coast"),
        grid: css("--grid"), rim: css("--rim"), fg: css("--fg"), accent: css("--accent"),
        bg: css("--bg"),
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
      this.scale = Math.min(this.w, this.h) * 0.46 * (this.opts.zoom || 1);
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

    draw(ts) {
      const { ctx, c, proj, path } = this;
      proj.rotate(this.rotate);
      ctx.clearRect(0, 0, this.w, this.h);
      const [cx, cy] = proj.translate();
      const r = proj.scale();

      // Atmosphere halo
      const halo = ctx.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.14);
      halo.addColorStop(0, c.rim);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.14, 0, Math.PI * 2); ctx.fill();

      // Ocean
      ctx.fillStyle = c.ocean;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

      // Graticule
      ctx.beginPath(); path(d3.geoGraticule10());
      ctx.strokeStyle = c.grid; ctx.lineWidth = 0.6; ctx.stroke();

      // Land
      ctx.beginPath(); path(window.MA_LAND);
      ctx.fillStyle = c.land; ctx.fill();
      ctx.strokeStyle = c.coast; ctx.lineWidth = 0.6; ctx.stroke();

      // Shading for depth
      const shade = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
      shade.addColorStop(0, "rgba(255,255,255,0.07)");
      shade.addColorStop(1, "rgba(0,0,0,0.18)");
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
          ctx.beginPath(); path(rest); ctx.strokeStyle = rt.color; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath(); path(flown); ctx.lineWidth = 2.6; ctx.stroke();
        } else {
          ctx.beginPath(); path(line); ctx.strokeStyle = rt.color; ctx.lineWidth = rt.dim ? 1.2 : 2.2; ctx.stroke();
        }
        [rt.from, rt.to].forEach((p) => {
          if (!visible(p)) return;
          const [x, y] = proj([p.lon, p.lat]);
          ctx.beginPath(); ctx.arc(x, y, rt.dim ? 2 : 3.2, 0, Math.PI * 2);
          ctx.fillStyle = c.bg; ctx.fill();
          ctx.lineWidth = 1.6; ctx.strokeStyle = rt.color; ctx.stroke();
          if (rt.labels && p.iata) {
            ctx.font = "600 11px " + css("--font-mono");
            ctx.fillStyle = c.fg; ctx.textAlign = "center";
            ctx.fillText(p.iata, x, y - 8);
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
        drawPlane(ctx, x, y, ang, 13, pl.color, c.bg);
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
