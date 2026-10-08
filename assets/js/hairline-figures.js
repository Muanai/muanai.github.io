/* â”€â”€ HAIRLINE ISOMETRIC ENGINE & FIGURES â”€â”€ */
/* hairline kernel sha256:3a19aa2640ba8c6c306184d05fddfbd4f3323a6ebd9217dd3cbb38e9db74991c */
/*
 * HL: everything a figure may call. Read this index; the code under it is the
 * package's src/core, unchanged, and a figure should not need to read it.
 *
 * Every figure is drawn in a 400 × 320 viewBox. World space is x/y on the
 * ground and z up. Plates are filled with the ground colour and painted back
 * to front, so a nearer one covers a farther one: append in that order. At
 * the default camera, Cam(45, 0.5, S), +x runs down to the right and +y down
 * to the left, so the corner with the largest x and y is nearest the viewer:
 * append by ascending x + y, from the far corner (smallest x and y) to it.
 *
 * Camera
 *   Cam(azDeg, k, S)                       a camera: azimuth in degrees, k = sin(elevation) (0.5 is the 2:1 view), S = scale
 *   fit(C, points, cx, cy)                 centres the box of [x, y, z] points on (cx, cy); call it once, before proj
 *                                          it only centres, it never scales: choose S by trying values, with the most extreme pose in points.
 *                                          The six figures use S 1.42 to 2.12; the boxes they fit come out 230 to 310 wide and 180 to 245 tall
 *   proj(C)                                returns P(x, y, z), which gives [sx, sy]
 *   unproj(C, sx, sy, z)                   the world [x, y] under a screen point, on the plane at height z
 *   facing(C)                              returns front(sample): whether a ring sample faces the camera
 * Rounded solids
 *   rrect(u0, v0, u1, v1, r, n)            a rounded rectangle, as a ring of samples {u, v, nu, nv}
 *   circ(R, n)                             a circle, as a ring
 *   rings(x0, y0, x1, y1, r, b)            [ring, inner]: a rounded footprint and its crease ring, inset by b
 *                                          r, the corner radius, is cut to half the shorter side. b, the crease's inset in world units
 *                                          (0.6 to 2.2 in the figures), must stay under half the shorter side or the crease turns inside out
 *   prism(P, front, ring, inner, z0, z1)   {sil, crease}: a solid standing from z0 to z1, as two path strings
 *   ringAt(P, ring, z)                     the ring's points, projected at height z
 *   run(ring, keep)                        the one cyclic run of samples that pass keep
 *   hull(points)                           the convex hull of screen points
 *   extremes(P, ring)                      [left, right, nearest] samples: where dashed drops fall from
 *   fillet(points, radii, n)               rounds every vertex of a closed polygon; returns the new points
 *                                          radii is an array, one radius per vertex, each cut to half its shorter edge; a single number gives NaN.
 *                                          n is the steps round each corner, default 4: each vertex becomes n + 1 points
 *   ghost(P, front, ring, z0, depth)       a reflection's path {d, y0, y1}; reflect() draws it for you
 * Paths and numbers
 *   poly(points)                           a closed path string
 *   open(points)                           an open polyline string
 *   seg(a, b)                              one segment between two screen points [sx, sy], as its own subpath; project world points with P first
 *   clamp(v, a, b)
 *   lerp(a, b, t)
 *   rad(deg)
 *   r2(n)                                  two decimals
 * The continuous clock: one spring per moving number
 *   spring(x, opts)                        at rest on x; write .t to retarget; opts {k, c, m, eps}, default k 100, c 18, m 1
 *   stepS(sp, dt)                          advances by dt seconds; returns whether it is still moving
 * The discrete clock: a 700ms tween on (.32, .72, 0, 1)
 *   tween(v, dur)                          at rest on v; dur defaults to 700 (ms)
 *   tset(tw, to, now, delay)               retargets from where it is, after delay ms: the stagger
 *                                          the same target again does nothing, so calling it on every pointer move is safe
 *   tval(tw, now)                          its value at now
 *   tdone(tw, now)                         whether it has landed
 *   bezier(x1, y1, x2, y2)                 a CSS cubic-bezier, as a function of progress
 *   EASE_LIFT                              the lift curve itself
 *   reducedMotion()                        true when the reader asked for less motion; springs and tweens already land at once
 *   setReducedMotion(on)                   the loop's business, not a figure's
 * Drawing
 *   mk(tag, attrs, parent)                 one svg element: the only way a figure makes a node
 *   solid(parent)                          {g, sil, cr}: a group holding a silhouette path and a crease path
 *   put(solid, paths)                      writes prism()'s {sil, crease} into solid()'s {sil, cr}: sil into sil, crease into cr
 *   flatDot(parent, C, r, cls)             a dot lying on the ground plane; cls is "dot", "dot m" or "dot off"
 *   place(el, point)                       moves a dot or a circle to [sx, sy]
 *   reflect(svg, parent, P, front, ring, z0, depth)   a fading mirror under a solid
 *   fade(svg, y0, y1, a0)                  a vertical fade, as a mask; returns the value for a mask attribute
 * Life
 *   register(stage, tick)                  joins the one frame loop; tick(dt in seconds, now in ms) returns true to ask for another frame; gives {wake, unregister}
 *   pointer(stage, handlers)               {move(point), down(point), leave()}, points in viewBox units; returns its disposer
 *   disposer()                             {add, on, dispose}: collects tear-down, so destroy is bag.dispose
 * The bench's business, not a figure's
 *   css(lightDark)
 *   inject(root)
 *   tour(stage, stops, onStop)             an unseen pointer that walks the stops, [x, y] in viewBox units or null to leave, and gives way to a real one; onStop(i) on each arrival; returns {stop}
 *   LAP                                    the default stops: a diamond around the centre, then a leave
 *
 * Classes, on path, polygon, ellipse and line. They are the whole palette; a
 * figure sets no colour, width or fill of its own.
 *     (none)   filled with the ground colour, medium stroke
 *     sil      the silhouette's stroke        hi    the bright stroke: the only highlight
 *     lo       the dim stroke                 nf    no fill        fo   fill only, no stroke
 *     dash     a dashed guide
 *     dot      a bright dot                   dot m   a medium dot     dot off   a dim dot
 */
var HL = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/hairline/src/core/kernel.ts
  var kernel_exports = {};
  __export(kernel_exports, {
    Cam: () => Cam,
    EASE_LIFT: () => EASE_LIFT,
    LAP: () => LAP,
    bezier: () => bezier,
    circ: () => circ,
    clamp: () => clamp,
    css: () => css,
    disposer: () => disposer,
    extremes: () => extremes,
    facing: () => facing,
    fade: () => fade,
    fillet: () => fillet,
    fit: () => fit,
    flatDot: () => flatDot,
    ghost: () => ghost,
    hull: () => hull,
    inject: () => inject,
    lerp: () => lerp,
    mk: () => mk,
    open: () => open,
    place: () => place,
    pointer: () => pointer,
    poly: () => poly,
    prism: () => prism,
    proj: () => proj,
    put: () => put,
    r2: () => r2,
    rad: () => rad,
    reducedMotion: () => reducedMotion,
    reflect: () => reflect,
    register: () => register,
    ringAt: () => ringAt,
    rings: () => rings,
    rrect: () => rrect,
    run: () => run,
    seg: () => seg,
    setReducedMotion: () => setReducedMotion,
    solid: () => solid,
    spring: () => spring,
    stepS: () => stepS,
    tdone: () => tdone,
    tour: () => tour,
    tset: () => tset,
    tval: () => tval,
    tween: () => tween,
    unproj: () => unproj
  });

  // packages/hairline/src/core/iso.ts
  var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  var lerp = (a, b, t) => a + (b - a) * t;
  var rad = (d) => d * Math.PI / 180;
  var r2 = (n) => Math.round(n * 100) / 100;
  var poly = (pts) => "M" + pts.map((p) => r2(p[0]) + " " + r2(p[1])).join("L") + "Z";
  var seg = (a, b) => `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}`;
  var open = (pts) => pts.length < 2 ? "" : "M" + pts.map((p) => r2(p[0]) + " " + r2(p[1])).join("L");
  var Cam = (azDeg, k, S) => ({ az: rad(azDeg), k, S, ox: 0, oy: 0 });
  function proj(C) {
    const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
    return (x, y, z) => {
      const X = x * c - y * s, Y = x * s + y * c;
      return [C.ox + C.S * X, C.oy + C.S * (Y * C.k - z * zf)];
    };
  }
  function unproj(C, sx, sy, z) {
    const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
    const X = (sx - C.ox) / C.S, Y = ((sy - C.oy) / C.S + z * zf) / C.k;
    return [X * c + Y * s, -X * s + Y * c];
  }
  function fit(C, pts, cx, cy) {
    C.ox = 0;
    C.oy = 0;
    const P = proj(C);
    let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    for (const p of pts) {
      const q = P(p[0], p[1], p[2]);
      a = Math.min(a, q[0]);
      b = Math.max(b, q[0]);
      c = Math.min(c, q[1]);
      d = Math.max(d, q[1]);
    }
    C.ox = cx - (a + b) / 2;
    C.oy = cy - (c + d) / 2;
  }
  function rrect(u0, v0, u1, v1, r, n = 4) {
    r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
    const out = [];
    for (const [cu, cv, a0] of [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]])
      for (let k = 0; k <= n; k++) {
        const a = rad(a0 + 90 * k / n), ca = Math.cos(a), sa = Math.sin(a);
        out.push({ u: cu + r * ca, v: cv + r * sa, nu: ca, nv: sa });
      }
    return out;
  }
  function circ(R, n = 96) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      out.push({ u: R * ca, v: R * sa, nu: ca, nv: sa });
    }
    return out;
  }
  function hull(input) {
    const pts = input.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) {
      while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
      lo.push(p);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
      up.push(p);
    }
    lo.pop();
    up.pop();
    return lo.concat(up);
  }
  var ringAt = (P, ring, z) => ring.map((q) => P(q.u, q.v, z));
  var facing = (C) => {
    const s = Math.sin(C.az), c = Math.cos(C.az);
    return (q) => q.nu * s + q.nv * c >= -1e-6;
  };
  function run(ring, keep) {
    const n = ring.length;
    let s = -1;
    for (let i = 0; i < n; i++) if (keep(ring[i]) && !keep(ring[(i + n - 1) % n])) {
      s = i;
      break;
    }
    if (s < 0) return keep(ring[0]) ? ring.slice() : [];
    const out = [];
    for (let k = 0; k < n && keep(ring[(s + k) % n]); k++) out.push(ring[(s + k) % n]);
    return out;
  }
  function prism(P, front, ring, inner, z0, z1) {
    return {
      sil: poly(hull(ringAt(P, ring, z1).concat(ringAt(P, ring, z0)))),
      crease: inner ? open(ringAt(P, run(inner, front), z1)) : ""
    };
  }
  var rings = (x0, y0, x1, y1, r, b) => [
    rrect(x0, y0, x1, y1, r),
    rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.3, r - b))
  ];
  function extremes(P, ring) {
    const pr = ring.map((q) => P(q.u, q.v, 0));
    let a = 0, b = 0, c = 0;
    pr.forEach((p, k) => {
      if (p[0] < pr[a][0]) a = k;
      if (p[0] > pr[b][0]) b = k;
      if (p[1] > pr[c][1]) c = k;
    });
    return [ring[a], ring[b], ring[c]];
  }
  function fillet(pts, rs, n = 4) {
    const m = pts.length, out = [];
    for (let i = 0; i < m; i++) {
      const a = pts[(i + m - 1) % m], p = pts[i], b = pts[(i + 1) % m];
      const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const t = Math.min(rs[i], la / 2, lb / 2);
      const p1 = [p[0] + (a[0] - p[0]) / la * t, p[1] + (a[1] - p[1]) / la * t];
      const p2 = [p[0] + (b[0] - p[0]) / lb * t, p[1] + (b[1] - p[1]) / lb * t];
      for (let k = 0; k <= n; k++) {
        const s = k / n, w = 1 - s;
        out.push([w * w * p1[0] + 2 * w * s * p[0] + s * s * p2[0], w * w * p1[1] + 2 * w * s * p[1] + s * s * p2[1]]);
      }
    }
    return out;
  }
  function ghost(P, front, ring, z0, depth) {
    const f = run(ring, front), lowP = ringAt(P, f, z0 - depth);
    return {
      d: open(lowP) + [f[0], f[f.length - 1]].map((q) => seg(P(q.u, q.v, z0), P(q.u, q.v, z0 - depth))).join(""),
      y0: Math.min(...ringAt(P, f, z0).map((p) => p[1])),
      y1: Math.max(...lowP.map((p) => p[1])) + 2
    };
  }

  // packages/hairline/src/core/motion.ts
  var reduced = false;
  var setReducedMotion = (on) => {
    reduced = on;
  };
  var reducedMotion = () => reduced;
  function spring(x, o = {}) {
    return { x, v: 0, t: x, k: o.k ?? 100, c: o.c ?? 18, m: o.m ?? 1, eps: o.eps ?? 0.01 };
  }
  function stepS(sp, dt) {
    if (reduced) {
      sp.x = sp.t;
      sp.v = 0;
      return false;
    }
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = (-sp.k * (sp.x - sp.t) - sp.c * sp.v) / sp.m;
      sp.v += a * h;
      sp.x += sp.v * h;
    }
    if (Math.abs(sp.x - sp.t) < sp.eps && Math.abs(sp.v) < sp.eps * 10) {
      sp.x = sp.t;
      sp.v = 0;
      return false;
    }
    return true;
  }
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (u) => ((ax * u + bx) * u + cx) * u;
    const Y = (u) => ((ay * u + by) * u + cy) * u;
    const dX = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      let u = t;
      for (let i = 0; i < 8; i++) {
        const e = X(u) - t;
        if (Math.abs(e) < 1e-5) break;
        const d = dX(u);
        if (Math.abs(d) < 1e-6) break;
        u -= e / d;
      }
      if (!(u >= 0 && u <= 1) || Math.abs(X(u) - t) > 1e-4) {
        let lo = 0, hi = 1;
        u = t;
        for (let i = 0; i < 24; i++) {
          if (X(u) < t) lo = u;
          else hi = u;
          u = (lo + hi) / 2;
        }
      }
      return Y(u);
    };
  }
  var EASE_LIFT = bezier(0.32, 0.72, 0, 1);
  var tween = (v, dur = 700) => ({ from: v, to: v, t0: -1e9, dur });
  var tval = (tw, now) => {
    const p = clamp((now - tw.t0) / tw.dur, 0, 1);
    return tw.from + (tw.to - tw.from) * (reduced ? 1 : EASE_LIFT(p));
  };
  var tset = (tw, to, now, delay) => {
    if (tw.to === to) return;
    tw.from = tval(tw, now);
    tw.to = to;
    tw.t0 = now + delay;
  };
  var tdone = (tw, now) => reduced || now >= tw.t0 + tw.dur;

  // packages/hairline/src/core/stage.ts
  var NS = "http://www.w3.org/2000/svg";
  function mk(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, String(attrs[k]));
    if (parent) parent.appendChild(e);
    return e;
  }
  function solid(parent) {
    const g = mk("g", {}, parent);
    return { g, sil: mk("path", { class: "sil" }, g), cr: mk("path", { class: "nf lo" }, g) };
  }
  var put = (el, s) => {
    el.sil.setAttribute("d", s.sil);
    el.cr.setAttribute("d", s.crease);
  };
  var flatDot = (parent, C, r, cls) => mk("ellipse", { rx: r2(r * C.S), ry: r2(r * C.S * C.k), class: cls }, parent);
  var place = (el, q) => {
    el.setAttribute("cx", String(r2(q[0])));
    el.setAttribute("cy", String(r2(q[1])));
  };
  var fid = 0;
  function fade(svg, y0, y1, a0 = 0.7) {
    const id = "hl-fd" + ++fid, defs = mk("defs", {}, svg);
    const lg = mk("linearGradient", { id: id + "g", gradientUnits: "userSpaceOnUse", x1: 0, y1: r2(y0), x2: 0, y2: r2(y1) }, defs);
    mk("stop", { offset: 0, "stop-color": "#fff", "stop-opacity": a0 }, lg);
    mk("stop", { offset: 1, "stop-color": "#fff", "stop-opacity": 0 }, lg);
    const m = mk("mask", { id, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 400, height: 320 }, defs);
    mk("rect", { x: 0, y: 0, width: 400, height: 320, fill: `url(#${id}g)` }, m);
    return `url(#${id})`;
  }
  function reflect(svg, parent, P, front, ring, z0, depth) {
    const r = ghost(P, front, ring, z0, depth);
    const gh = mk("g", { class: "ghost", mask: fade(svg, r.y0, r.y1) }, parent);
    mk("path", { d: r.d }, gh);
  }
  var boards = [];
  var byStage = /* @__PURE__ */ new Map();
  var raf = 0;
  var last = 0;
  var io = null;
  var rm = null;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1e3));
    last = now;
    let any = false;
    for (const b of boards.slice()) if (b.vis && b.awake) {
      try {
        b.awake = !!b.tick(dt, now);
      } catch (err) {
        b.awake = false;
        setTimeout(() => {
          throw err;
        });
      }
      any = any || b.awake;
    }
    raf = any ? requestAnimationFrame(frame) : 0;
  }
  function wake(b) {
    b.awake = true;
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  var onMotion = () => {
    setReducedMotion(!!rm?.matches);
    boards.forEach(wake);
  };
  function start() {
    if (io) return;
    io = new IntersectionObserver((es) => {
      for (const e of es) {
        const set = byStage.get(e.target);
        if (!set) continue;
        for (const b of set) {
          b.vis = e.isIntersecting;
          if (b.vis) wake(b);
        }
      }
    }, { rootMargin: "80px" });
    rm = matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(rm.matches);
    rm.addEventListener("change", onMotion);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    io?.disconnect();
    io = null;
    rm?.removeEventListener("change", onMotion);
    rm = null;
  }
  function register(stage, tick) {
    start();
    const b = { stage, tick, vis: false, awake: true };
    boards.push(b);
    const peers = byStage.get(stage);
    if (peers) {
      for (const p of peers) b.vis = p.vis;
      peers.add(b);
      if (b.vis) wake(b);
    } else {
      byStage.set(stage, /* @__PURE__ */ new Set([b]));
      io.observe(stage);
    }
    tick(0, performance.now());
    let gone = false;
    return {
      wake: () => {
        if (!gone) wake(b);
      },
      unregister: () => {
        if (gone) return;
        gone = true;
        boards = boards.filter((x) => x !== b);
        const set = byStage.get(stage);
        if (set) {
          set.delete(b);
          if (!set.size) {
            byStage.delete(stage);
            io?.unobserve(stage);
          }
        }
        if (!boards.length) stop();
      }
    };
  }
  var handlers = /* @__PURE__ */ new WeakMap();
  var touring = /* @__PURE__ */ new WeakMap();
  function pointer(stage, on) {
    handlers.set(stage, on);
    let tm = 0;
    const pt = (e) => {
      const r = stage.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width * 400, (e.clientY - r.top) / r.height * 320];
    };
    const move = (e) => {
      clearTimeout(tm);
      touring.get(stage)?.hold();
      on.move(pt(e), e);
    };
    const down = (e) => {
      clearTimeout(tm);
      touring.get(stage)?.hold();
      if (e.pointerType !== "mouse") stage.releasePointerCapture?.(e.pointerId);
      if (on.down) on.down(pt(e), e);
      else on.move(pt(e), e);
    };
    const leave = (e) => {
      clearTimeout(tm);
      tm = window.setTimeout(() => {
        on.leave(e);
        touring.get(stage)?.release();
      }, e.pointerType === "mouse" ? 0 : 1400);
    };
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerdown", down);
    stage.addEventListener("pointerleave", leave);
    return () => {
      clearTimeout(tm);
      if (handlers.get(stage) === on) handlers.delete(stage);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointerleave", leave);
    };
  }
  var LAP = [[128, 150], [200, 118], [272, 150], [200, 206], null];
  var TRAVEL = 900;
  var DWELL = 1200;
  var REST = 1800;
  var RESUME = 1200;
  var STAGGER = 450;
  var GHOST = { pointerType: "ghost" };
  var started = 0;
  function entry([x, y]) {
    const dx = x - 200, dy = y - 160;
    if (!dx && !dy) return [200, 320];
    const k = Math.min(dx ? (dx > 0 ? 200 : -200) / dx : Infinity, dy ? (dy > 0 ? 160 : -160) / dy : Infinity);
    return [200 + dx * k, 160 + dy * k];
  }
  function tour(stage, stops, onStop) {
    let i = 0;
    let wait = RESUME + STAGGER * (started++ % 4);
    let t = -1;
    let at = null;
    let origin = [200, 320];
    let hand = false, keys = stage.contains(stage.ownerDocument.activeElement);
    let gone = false;
    const leave = () => {
      at = null;
      t = -1;
      handlers.get(stage)?.leave(GHOST);
    };
    const tick = (dt) => {
      if (hand || keys || !stops.length) return false;
      if (reducedMotion()) {
        if (at) leave();
        return false;
      }
      if (wait > 0) {
        wait -= dt * 1e3;
        return true;
      }
      const stop2 = stops[i];
      if (stop2 === null) {
        if (at) leave();
        onStop?.(i);
        i = (i + 1) % stops.length;
        wait = REST;
        return true;
      }
      const h = handlers.get(stage);
      if (!h) return true;
      if (t < 0) {
        origin = at ?? entry(stop2);
        t = 0;
      }
      t = Math.min(TRAVEL, t + dt * 1e3);
      const k = EASE_LIFT(t / TRAVEL);
      at = [origin[0] + (stop2[0] - origin[0]) * k, origin[1] + (stop2[1] - origin[1]) * k];
      h.move(at, GHOST);
      if (t < TRAVEL) return true;
      onStop?.(i);
      i = (i + 1) % stops.length;
      t = -1;
      wait = DWELL;
      return true;
    };
    const take = () => {
      at = null;
      t = -1;
    };
    const give = () => {
      if (hand || keys) return;
      i = 0;
      t = -1;
      wait = RESUME;
      board.wake();
    };
    const me = {
      hold: () => {
        hand = true;
        take();
      },
      release: () => {
        if (!hand) return;
        hand = false;
        give();
      }
    };
    const focusIn = () => {
      keys = true;
      take();
    };
    const focusOut = (e) => {
      if (keys && !stage.contains(e.relatedTarget)) {
        keys = false;
        give();
      }
    };
    stage.addEventListener("focusin", focusIn);
    stage.addEventListener("focusout", focusOut);
    touring.set(stage, me);
    const board = register(stage, tick);
    return {
      stop: () => {
        if (gone) return;
        gone = true;
        board.unregister();
        stage.removeEventListener("focusin", focusIn);
        stage.removeEventListener("focusout", focusOut);
        if (touring.get(stage) === me) touring.delete(stage);
        if (at) leave();
      }
    };
  }
  function disposer() {
    let fns = [];
    return {
      add: (fn) => {
        fns.push(fn);
      },
      on: (target, type, fn, opts) => {
        const h = fn;
        target.addEventListener(type, h, opts);
        fns.push(() => target.removeEventListener(type, h, opts));
      },
      dispose: () => {
        const run2 = fns;
        fns = [];
        for (let i = run2.length - 1; i >= 0; i--) run2[i]();
      }
    };
  }

  // packages/hairline/src/core/styles.ts
  var LIGHT = { plate: "#ffffff", hi: "#232327", edge: "#a4a4ac", mid: "#c3c3c9", lo: "#e0e0e4" };
  var DARK = { plate: "#08090a", hi: "#d0d6e0", edge: "#5b5d64", mid: "#3e3e44", lo: "#29292d" };
  var KEYS = ["plate", "hi", "edge", "mid", "lo"];
  var vars = (p) => KEYS.map((k) => `--hl-${k}:var(--hairline-${k},${p[k]});`).join("");
  var EASE = "cubic-bezier(0.5,0,0.1,1)";
  var SVG = ":where([data-hairline]>svg)";
  function css(lightDark) {
    const both = Object.fromEntries(KEYS.map((k) => [k, `light-dark(${LIGHT[k]},${DARK[k]})`]));
    return [
      // the box, and the palette: light unless something below says otherwise
      `:where([data-hairline]){display:block;position:relative;aspect-ratio:5/4;touch-action:pan-y;user-select:none;-webkit-user-select:none;--hl-sw:var(--hairline-stroke,0.9);${vars(LIGHT)}}`,
      // the page's color-scheme
      lightDark ? `:where([data-hairline]){${vars(both)}}` : "",
      // an ancestor that says dark
      `:where(.dark,[data-theme="dark"]) :where([data-hairline]){${vars(DARK)}}`,
      // the figure's own theme option
      `:where([data-hairline][data-hairline-theme="light"]){${vars(LIGHT)}}`,
      `:where([data-hairline][data-hairline-theme="dark"]){${vars(DARK)}}`,
      `:where([data-hairline]:focus-visible){outline:1.5px solid var(--hl-hi);outline-offset:2px}`,
      `${SVG}{position:absolute;inset:0;width:100%;height:100%;display:block}`,
      // Riffle's live region: read, not seen
      `:where([data-hairline]>[data-hairline-live]){position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`,
      // the drawing: plates are filled with the plate colour and painted back to front
      `${SVG} :where(path,polygon,ellipse,line){fill:var(--hl-plate);stroke:var(--hl-mid);stroke-width:var(--hl-sw);vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round;transition:stroke 260ms ${EASE}}`,
      `${SVG} :where(.nf){fill:none}`,
      `${SVG} :where(.fo){stroke:none}`,
      `${SVG} :where(.sil){stroke:var(--hl-edge)}`,
      `${SVG} :where(.hi){stroke:var(--hl-hi)}`,
      `${SVG} :where(.lo){stroke:var(--hl-lo)}`,
      `${SVG} :where(.dash){stroke-dasharray:1 3}`,
      `${SVG} :where(.dot){stroke:none;fill:var(--hl-hi);transition:fill 260ms ${EASE}}`,
      `${SVG} :where(.dot.m){fill:var(--hl-edge)}`,
      `${SVG} :where(.dot.off){fill:var(--hl-lo)}`,
      `${SVG} :where(.ghost path){fill:none;stroke:var(--hl-mid)}`
    ].join("");
  }
  var done = /* @__PURE__ */ new WeakSet();
  function inject(root) {
    if (done.has(root)) return;
    done.add(root);
    const doc = root.nodeType === 9 ? root : root.ownerDocument;
    const win = doc.defaultView;
    const text = css(!!win?.CSS?.supports?.("color", "light-dark(#000,#fff)"));
    if (win && "adoptedStyleSheets" in root) {
      try {
        const sheet = new win.CSSStyleSheet();
        sheet.replaceSync(text);
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
        return;
      } catch {
      }
    }
    const style = doc.createElement("style");
    style.setAttribute("data-hairline-style", "");
    style.textContent = text;
    (root.nodeType === 9 ? doc.head ?? doc.documentElement : root).appendChild(style);
  }
  return __toCommonJS(kernel_exports);
})();
/* /hairline kernel */


(function () {
  /**
 * Sorter: a stepped sorting tray holding eight punched data record cards.
 * The card under the pointer lifts to reveal its punched data pattern;
 * adjacent cards fan out, staggered by distance on the 700ms lift curve.
 * Geometry carries identity: a chamfered corner and punched data columns.
 */
const {
  Cam, clamp, facing, fillet, fit, flatDot, hull, open, place, pointer, poly,
  prism, proj, put, rad, reflect, register, ringAt, rings, rrect, run, seg,
  solid, spring, stepS, tdone, tset, tval, tween, unproj, disposer, mk,
} = HL;

const N = 8, W = 88, H = 52, G = 12, LIFT = 18;
const REST = -14, BACK = -26, FWD = 18;
const X0 = -6, X1 = W + 6, Y0 = -10, Y1 = (N - 1) * G + 10, WH = 20, WR = 6, WT = 2.4;

const LR = (pts) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

/** Stepped sorting tray: far half painted before cards, near half after. */
function tray(P, front, outer, inner) {
  const far = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
    [poly(ringAt(P, inner, WH)), "nf"],
    [open(ringAt(P, run(inner, (q) => !front(q)), 2.5)), "nf lo"],
  ];
  const iF = LR(ringAt(P, run(inner, front), WH));
  const oT = LR(ringAt(P, run(outer, front), WH));
  const oB = LR(ringAt(P, run(outer, front), 0));
  const hx = (X0 + X1) / 2, onFront = (ring) => ring.map((q) => P(q.u, Y1, q.v));
  const near = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
    [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
    [poly(onFront(rrect(hx - 12, 6, hx + 12, 12, 2.5, 5))), "nf"],
    [poly(onFront(rrect(hx - 10, 7.5, hx + 10, 10.5, 1.5, 5))), "nf lo"],
  ];
  return { far, near };
}

/** Card i: punched index card with 45° chamfered top-left corner. */
function card(i) {
  const n = N - i;
  const shape = fillet(
    [[0, 0], [W, 0], [W, H], [10, H], [0, H - 10]],
    [1.2, 1.2, 2.5, 2.2, 2.2],
  );
  return { n, shape };
}

/** Card leaning th degrees, lifted by lift: its outline, rule markings and punch coordinates. */
function pose(P, i, shape, th, lift) {
  const yb = i * G, s = Math.sin(rad(th)), c = Math.cos(rad(th));
  const w = (u, v) => P(u, yb + v * s, v * c + lift);
  const wb = (u, v) => P(u, yb + v * s - 1.4 * c, v * c + 1.4 * s + lift);
  const punch = [];
  for (let col = 0; col < 6; col++) {
    const px = 18 + col * 10;
    punch.push(w(px, H - 18));
    punch.push(w(px, H - 26));
  }
  return {
    back: poly(shape.map((p) => wb(p[0], p[1]))),
    face: poly(shape.map((p) => w(p[0], p[1]))),
    head: seg(w(14, H - 7), w(W - 8, H - 7)),
    rules: [H - 34, H - 41].map((v) => seg(w(8, v), w(W - 8, v))).join(""),
    punch,
  };
}

function mountSorter({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.58);
  fit(C, [
    [X0, Y0, 0], [X1, Y1, -8], [X1, Y0, 0], [X0, Y1, 0],
    [X0, Y0, H], [X1, Y0, H + LIFT], [X0, Y1, H + LIFT],
  ], 200, 158);
  const P = proj(C), front = facing(C);
  const outer = rrect(X0, Y0, X1, Y1, WR, 6);
  const inner = rrect(X0 + WT, Y0 + WT, X1 - WT, Y1 - WT, WR - WT, 6);
  const paths = tray(P, front, outer, inner);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, outer, 0, 14);
  for (const [d, cls] of paths.far) mk("path", { d, class: cls }, g);

  const cards = [];
  for (let i = 0; i < N; i++) {
    const { n, shape } = card(i);
    const grp = mk("g", {}, g);
    const back = mk("path", { class: "lo" }, grp);
    const face = mk("path", { class: "sil" }, grp);
    const head = mk("path", { class: "nf" }, grp);
    const rules = mk("path", { class: "nf lo" }, grp);
    const punch = [];
    for (let k = 0; k < 12; k++) {
      const active = (k % 6 === (n - 1) % 6);
      punch.push(mk("circle", { r: 1.1, class: "dot " + (active ? "m" : "off") }, grp));
    }
    cards.push({ n, shape, back, face, head, rules, punch, a: tween(REST), z: tween(0) });
  }

  for (const [d, cls] of paths.near) mk("path", { d, class: cls }, g);

  // Static hit bands along resting top edges
  const top = (i) => P(W / 2, i * G + H * Math.sin(rad(REST)), H * Math.cos(rad(REST)));
  const c0 = top(0), c1 = top(1), d = [c1[0] - c0[0], c1[1] - c0[1]];
  const px0 = P(0, 0, 0), px1 = P(1, 0, 0), ex = [px1[0] - px0[0], px1[1] - px0[1]];
  const HALF = W / 2 + 6, det = d[0] * ex[1] - d[1] * ex[0];

  function hit([x, y]) {
    if (x < 60 || x > 340 || y < 60 || y > 260) return -1;
    const qx = x - c0[0], qy = y - c0[1];
    const s = (qx * ex[1] - qy * ex[0]) / det, r = (d[0] * qy - d[1] * qx) / det;
    if (Math.abs(r) > HALF || s < -0.3 || s > N - 0.7) return -1;
    return clamp(Math.round(s), 0, N - 1);
  }

  function draw(i, th, lift) {
    const cd = cards[i], q = pose(P, i, cd.shape, th, lift);
    cd.back.setAttribute("d", q.back);
    cd.face.setAttribute("d", q.face);
    cd.head.setAttribute("d", q.head);
    cd.rules.setAttribute("d", q.rules);
    cd.punch.forEach((el, k) => place(el, q.punch[k]));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    cards.forEach((cd, i) => {
      draw(i, tval(cd.a, now), tval(cd.z, now));
      if (!tdone(cd.a, now) || !tdone(cd.z, now)) moving = true;
    });
    return moving;
  });
  bag.add(B.unregister);

  let act = -1;
  const caption = (a) => (a < 0 ? "rest" : `rec ${String(N - a).padStart(2, "0")}`);

  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    cards.forEach((cd, i) => {
      const delay = Math.abs(i - from) * stag;
      const th = a < 0 ? REST : i < a ? BACK : i > a ? FWD : 0;
      tset(cd.a, th, now, delay);
      tset(cd.z, a === i ? LIFT : 0, now, delay);
      cd.face.classList.toggle("hi", i === a);
      cd.head.classList.toggle("hi", i === a);
      cd.punch.forEach((el, k) => {
        const isRec = (k % 6 === (cd.n - 1) % 6);
        el.setAttribute("class", "dot " + (i === a && isRec ? "" : isRec ? "m" : "off"));
      });
    });
    read.textContent = caption(a);
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
}

  /* ════════════════════════════════════════
     LATTICE (ML ENGINEERING FIGURE)
  ════════════════════════════════════════ */
  const FOOT_LAT = 11, HMAX_LAT = 38;
  const falloffLat = (u) => Math.exp(-3.2 * Math.min(u, 1.4) ** 2);
  const LAYERS_LAT = [
    { name: "in", z0: 4, y: 13, xs: [16, 40, 68, 92] },
    { name: "hid", z0: 8, y: 59, xs: [8, 30, 54, 78, 100] },
    { name: "out", z0: 12, y: 106, xs: [24, 54, 84] },
  ];

  function mountLattice({ stage, svg, read }, value) {
    const bag = disposer();
    const C = Cam(45, 0.5, 1.25);

    fit(C, [
      [-12, -12, -8], [122, 132, -8], [122, -12, -8], [-12, 132, -8],
      [0, 0, 16 + HMAX_LAT], [110, 120, 16 + HMAX_LAT],
    ], 200, 158);

    const P = proj(C), front = facing(C);
    let R = value, over = null;

    const g = mk("g", {}, svg);

    // 1. Base plinth
    const [br, bi] = rings(-12, -12, 122, 132, 10, 2.5);
    put(solid(g), prism(P, front, br, bi, -8, 0));
    reflect(svg, g, P, front, br, -8, 14);

    // 2. Three stepped layer slabs
    const slabs = [
      { y0: -6, y1: 32, z0: 0, z1: 4 },
      { y0: 40, y1: 78, z0: 0, z1: 8 },
      { y0: 86, y1: 126, z0: 0, z1: 12 },
    ];

    slabs.forEach((s) => {
      const [sr, si] = rings(-6, s.y0, 116, s.y1, 6, 1.8);
      put(solid(g), prism(P, front, sr, si, s.z0, s.z1));
    });

    // 3. Synaptic guide lines between adjacent layers
    const guides = [];
    for (let l = 0; l < 2; l++) {
      const l1 = LAYERS_LAT[l], l2 = LAYERS_LAT[l + 1];
      l1.xs.forEach((x1) => {
        l2.xs.forEach((x2) => {
          guides.push(seg(P(x1 + FOOT_LAT / 2, l1.y + FOOT_LAT / 2, l1.z0), P(x2 + FOOT_LAT / 2, l2.y + FOOT_LAT / 2, l2.z0)));
        });
      });
    }
    mk("path", { d: guides.join(""), class: "dash lo" }, g);

    // 4. Node pillars
    const nodes = [];
    let totalIdx = 0;

    LAYERS_LAT.forEach((ly, lIdx) => {
      ly.xs.forEach((x, nIdx) => {
        const restRelief = [
          [8, 12, 14, 9],
          [10, 18, 26, 19, 11],
          [9, 16, 10],
        ][lIdx][nIdx];

        const [ring, inner] = rings(x, ly.y, x + FOOT_LAT, ly.y + FOOT_LAT, 2.8, 0.9);
        const el = solid(g);
        const cx = x + FOOT_LAT / 2, cy = ly.y + FOOT_LAT / 2;

        nodes.push({
          id: totalIdx++,
          lIdx,
          nIdx,
          layer: ly.name,
          z0: ly.z0,
          cx,
          cy,
          h0: restRelief,
          ring,
          inner,
          el,
          sp: spring(restRelief, { k: 90, c: 16, eps: 0.04 }),
          drawn: NaN,
        });
      });
    });

    const peak = nodes.reduce((a, b) => (b.h0 > a.h0 ? b : a));
    const dotEl = flatDot(g, C, 0.7, "dot m");
    let activeNode = peak;

    function drawNode(n) {
      const h = Math.max(1.2, n.sp.x);
      if (Math.abs(h - n.drawn) < 0.05) return;
      n.drawn = h;
      put(n.el, prism(P, front, n.ring, n.inner, n.z0, n.z0 + h));
      n.el.sil.classList.toggle("hi", h > HMAX_LAT * 0.58);
    }

    const B = register(stage, (dt) => {
      let moving = false;
      for (const n of nodes) {
        if (stepS(n.sp, dt)) moving = true;
        drawNode(n);
      }
      const h = Math.max(1.2, activeNode.sp.x);
      place(dotEl, P(activeNode.cx, activeNode.cy, activeNode.z0 + h + 0.3));
      return moving;
    });
    bag.add(B.unregister);

    function retarget() {
      if (!over) {
        nodes.forEach((n) => { n.sp.t = n.h0; });
        activeNode = peak;
        if (read) read.textContent = "rest";
        B.wake();
        return;
      }

      let nearest = nodes[0], minDist = Infinity;
      nodes.forEach((n) => {
        const d = Math.hypot(n.cx - over[0], n.cy - over[1]);
        if (d < minDist) { minDist = d; nearest = n; }
        const factor = falloffLat(d / R);
        n.sp.t = clamp(n.h0 + (HMAX_LAT - n.h0) * factor, n.h0, HMAX_LAT);
      });

      activeNode = nearest;
      if (read) read.textContent = `node ${nearest.layer}·0${nearest.nIdx + 1}`;
      B.wake();
    }

    bag.add(pointer(stage, {
      move: (p) => {
        if (p[0] < 50 || p[0] > 350 || p[1] < 50 || p[1] > 270) {
          if (over) { over = null; retarget(); }
          return;
        }
        over = unproj(C, p[0], p[1], 4);
        if (over[0] < -12 || over[0] > 122 || over[1] < -12 || over[1] > 132) over = null;
        retarget();
      },
      leave: () => { over = null; retarget(); },
    }));

    bag.add(() => svg.replaceChildren());

    return {
      set: (v) => { R = v; if (over) retarget(); },
      destroy: bag.dispose,
    };
  }

  /* ════════════════════════════════════════
     DOCK (TOOLS & WORKFLOW FIGURE)
  ════════════════════════════════════════ */
  const N_DCK = 5, CW_DCK = 52, CD_DCK = 14, CH_DCK = 14, G_DCK = 18;
  const X0_DCK = 12, X1_DCK = X0_DCK + CW_DCK;
  const RAIL_Z_DCK = 36;
  const POST_X0_DCK = 2, POST_X1_DCK = X1_DCK + 10;
  const POST_Y0_DCK = -6, POST_Y1_DCK = (N_DCK - 1) * G_DCK + CD_DCK + 6;

  function mountDock({ stage, svg, read }, value) {
    const bag = disposer();
    const C = Cam(45, 0.5, 1.66);

    fit(C, [
      [-10, -14, -8], [POST_X1_DCK + 8, POST_Y1_DCK + 10, -8],
      [POST_X1_DCK + 8, -14, -8], [-10, POST_Y1_DCK + 10, -8],
      [POST_X0_DCK, POST_Y0_DCK, RAIL_Z_DCK + 6], [POST_X1_DCK, POST_Y1_DCK, RAIL_Z_DCK + 6],
    ], 200, 158);

    const P = proj(C), front = facing(C);
    let maxLift = value;
    let activeBay = -1;

    const g = mk("g", {}, svg);

    // 1. Concrete dock plinth
    const [br, bi] = rings(-8, -12, POST_X1_DCK + 6, POST_Y1_DCK + 8, 8, 2.4);
    put(solid(g), prism(P, front, br, bi, -8, 0));
    reflect(svg, g, P, front, br, -8, 14);

    // Guide markings on dock slab
    const dockGuides = [];
    for (let i = 0; i < N_DCK; i++) {
      const y = i * G_DCK;
      dockGuides.push(seg(P(X0_DCK - 4, y + CD_DCK / 2, 0.1), P(X0_DCK, y + CD_DCK / 2, 0.1)));
      dockGuides.push(seg(P(X1_DCK, y + CD_DCK / 2, 0.1), P(X1_DCK + 4, y + CD_DCK / 2, 0.1)));
    }
    mk("path", { d: dockGuides.join(""), class: "dash lo" }, g);

    // 2. Far gantry legs (Post 0 and Post 1)
    const farPosts = [
      { x: POST_X0_DCK, y: POST_Y0_DCK },
      { x: POST_X0_DCK, y: POST_Y1_DCK },
    ];
    farPosts.forEach((pt) => {
      const [pr, pi] = rings(pt.x, pt.y, pt.x + 4, pt.y + 4, 1.2, 0.5);
      put(solid(g), prism(P, front, pr, pi, 0, RAIL_Z_DCK));
    });

    // Far crane rail
    const [frr, fri] = rings(POST_X0_DCK - 1, POST_Y0_DCK - 4, POST_X0_DCK + 5, POST_Y1_DCK + 4, 1.4, 0.6);
    put(solid(g), prism(P, front, frr, fri, RAIL_Z_DCK - 2, RAIL_Z_DCK + 2));

    // 3. Container pods & docking bays
    const pods = [];
    for (let i = 0; i < N_DCK; i++) {
      const y0 = i * G_DCK, y1 = y0 + CD_DCK;
      
      // Static bay floor outline
      const floorMark = open(ringAt(P, rrect(X0_DCK, y0, X1_DCK, y1, 2.2), 0.2));
      mk("path", { d: floorMark, class: "dash lo" }, g);

      // Pod solid
      const el = solid(g);
      const [ring, inner] = rings(X0_DCK, y0, X1_DCK, y1, 2.2, 0.8);
      
      // Top container ridges / corner pads
      const ridgeD = [
        seg(P(X0_DCK + 8, y0 + CD_DCK / 2, 0), P(X1_DCK - 8, y0 + CD_DCK / 2, 0)),
        seg(P(X0_DCK + 8, y0 + 3, 0), P(X1_DCK - 8, y0 + 3, 0)),
        seg(P(X0_DCK + 8, y1 - 3, 0), P(X1_DCK - 8, y1 - 3, 0)),
      ].join("");
      const ridgeEl = mk("path", { class: "nf lo" }, g);

      pods.push({
        id: i,
        y0,
        y1,
        ring,
        inner,
        el,
        ridgeEl,
        ridgeD,
        sp: spring(0, { k: 90, c: 18, eps: 0.02 }),
        drawnZ: NaN,
      });
    }

    // 4. Near gantry legs (Post 2 and Post 3)
    const nearPosts = [
      { x: POST_X1_DCK - 4, y: POST_Y0_DCK },
      { x: POST_X1_DCK - 4, y: POST_Y1_DCK },
    ];
    nearPosts.forEach((pt) => {
      const [pr, pi] = rings(pt.x, pt.y, pt.x + 4, pt.y + 4, 1.2, 0.5);
      put(solid(g), prism(P, front, pr, pi, 0, RAIL_Z_DCK));
    });

    // Near crane rail
    const [nrr, nri] = rings(POST_X1_DCK - 5, POST_Y0_DCK - 4, POST_X1_DCK + 1, POST_Y1_DCK + 4, 1.4, 0.6);
    put(solid(g), prism(P, front, nrr, nri, RAIL_Z_DCK - 2, RAIL_Z_DCK + 2));

    // 5. Overhead Travelling Trolley & Spreader
    const trolleyEl = solid(g);
    const spreaderCables = mk("path", { class: "dash hi" }, g);
    const trolleySp = spring(2 * G_DCK + CD_DCK / 2, { k: 80, c: 16, eps: 0.03 });
    let trolleyDrawn = NaN;

    // Active status indicator dot on trolley spreader
    const dotEl = flatDot(g, C, 0.8, "dot m");

    function drawPod(pod) {
      const z = Math.max(0, pod.sp.x);
      if (Math.abs(z - pod.drawnZ) < 0.05) return;
      pod.drawnZ = z;

      put(pod.el, prism(P, front, pod.ring, pod.inner, z, z + CH_DCK));
      pod.el.sil.classList.toggle("hi", z > 2);

      // Reposition container roof ridge markings
      const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
      const dz = z + CH_DCK;
      const offsetSy = -dz * zf * C.S;
      pod.ridgeEl.setAttribute("d", pod.ridgeD);
      pod.ridgeEl.setAttribute("transform", `translate(0, ${offsetSy})`);
    }

    function drawTrolley(ty) {
      if (Math.abs(ty - trolleyDrawn) < 0.05) return;
      trolleyDrawn = ty;

      const [tr, ti] = rings(POST_X0_DCK - 2, ty - 5, POST_X1_DCK + 2, ty + 5, 2.2, 0.8);
      put(trolleyEl, prism(P, front, tr, ti, RAIL_Z_DCK + 1, RAIL_Z_DCK + 5));

      // Update cables dropping from trolley to lifted container
      const activePod = pods.find((p) => p.id === activeBay);
      const curZ = activePod ? Math.max(0, activePod.sp.x) + CH_DCK : 0;
      const cableLines = [
        seg(P(X0_DCK + 4, ty - 3, RAIL_Z_DCK + 1), P(X0_DCK + 4, ty - 3, Math.max(CH_DCK, curZ))),
        seg(P(X1_DCK - 4, ty - 3, RAIL_Z_DCK + 1), P(X1_DCK - 4, ty - 3, Math.max(CH_DCK, curZ))),
        seg(P(X0_DCK + 4, ty + 3, RAIL_Z_DCK + 1), P(X0_DCK + 4, ty + 3, Math.max(CH_DCK, curZ))),
        seg(P(X1_DCK - 4, ty + 3, RAIL_Z_DCK + 1), P(X1_DCK - 4, ty + 3, Math.max(CH_DCK, curZ))),
      ];
      spreaderCables.setAttribute("d", cableLines.join(""));
      spreaderCables.classList.toggle("hi", activePod && curZ > CH_DCK + 1);

      // Indicator dot on trolley center
      place(dotEl, P((X0_DCK + X1_DCK) / 2, ty, RAIL_Z_DCK + 5.4));
    }

    const B = register(stage, (dt) => {
      let moving = false;
      for (const pod of pods) {
        if (stepS(pod.sp, dt)) moving = true;
        drawPod(pod);
      }
      if (stepS(trolleySp, dt)) moving = true;
      drawTrolley(trolleySp.x);
      return moving;
    });
    bag.add(B.unregister);

    function setActive(idx) {
      if (idx === activeBay) return;
      activeBay = idx;

      pods.forEach((pod) => {
        pod.sp.t = (pod.id === idx) ? maxLift : 0;
      });

      if (idx >= 0) {
        trolleySp.t = idx * G_DCK + CD_DCK / 2;
        if (read) read.textContent = `bay 0${idx + 1}`;
        dotEl.setAttribute("class", "dot");
      } else {
        trolleySp.t = 2 * G_DCK + CD_DCK / 2;
        if (read) read.textContent = "rest";
        dotEl.setAttribute("class", "dot m");
      }

      B.wake();
    }

    // Pointer hit testing against static bay slots
    function hit([sx, sy]) {
      if (sx < 60 || sx > 340 || sy < 50 || sy > 270) return -1;
      const pt = unproj(C, sx, sy, 0);
      if (!pt || pt[0] < X0_DCK - 8 || pt[0] > X1_DCK + 8) return -1;
      const y = pt[1];
      if (y < -4 || y > (N_DCK - 1) * G_DCK + CD_DCK + 4) return -1;
      const idx = Math.round((y - CD_DCK / 2) / G_DCK);
      return clamp(idx, 0, N_DCK - 1);
    }

    bag.add(pointer(stage, {
      move: (p) => setActive(hit(p)),
      leave: () => setActive(-1),
    }));

    bag.add(() => svg.replaceChildren());

    return {
      set: (v) => { maxLift = v; if (activeBay >= 0) pods[activeBay].sp.t = v; },
      destroy: bag.dispose,
    };
  }

  function initHairline() {
    HL.inject(document);

    // 1. Sorter (Card 1: Languages & Data Tools)
    const sorterStage = document.getElementById('figure-sorter');
    if (sorterStage) {
      try {
        sorterStage.setAttribute('data-hairline', 'sorter');
        sorterStage.setAttribute('role', 'img');
        sorterStage.setAttribute('aria-label', 'A stepped tray of punched index cards: the card under the pointer lifts to show its notches, and adjacent cards fan out.');
        sorterStage.innerHTML = '';
        const svg1 = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, sorterStage);
        const read1 = { textContent: '' };
        window.hairlineSorter = mountSorter({ stage: sorterStage, svg: svg1, read: read1 }, 40);
      } catch (err) {
        console.error('Failed to mount Sorter figure:', err);
      }
    }

    // 2. Lattice (Card 2: ML Engineering)
    const latticeStage = document.getElementById('figure-lattice');
    if (latticeStage) {
      try {
        latticeStage.setAttribute('data-hairline', 'lattice');
        latticeStage.setAttribute('role', 'img');
        latticeStage.setAttribute('aria-label', 'Three stepped neural network layers: the node under the pointer spikes, propagating activation across weights.');
        latticeStage.innerHTML = '';
        const svg2 = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, latticeStage);
        const read2 = { textContent: '' };
        window.hairlineLattice = mountLattice({ stage: latticeStage, svg: svg2, read: read2 }, 38);
      } catch (err) {
        console.error('Failed to mount Lattice figure:', err);
      }
    }

    // 3. Dock (Card 3: Tools & Workflow)
    const dockStage = document.getElementById('figure-dock');
    if (dockStage) {
      try {
        dockStage.setAttribute('data-hairline', 'dock');
        dockStage.setAttribute('role', 'img');
        dockStage.setAttribute('aria-label', 'A modular container gantry: the trolley glides along overhead rails to hoist the pod under the pointer.');
        dockStage.innerHTML = '';
        const svg3 = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, dockStage);
        const read3 = { textContent: '' };
        window.hairlineDock = mountDock({ stage: dockStage, svg: svg3, read: read3 }, 14);
      } catch (err) {
        console.error('Failed to mount Dock figure:', err);
      }
    }
  }

  window.initHairline = initHairline;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHairline);
  } else {
    initHairline();
  }
})();