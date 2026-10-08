/**
 * Sorter: a stepped sorting tray holding eight punched data record cards.
 * The card under the pointer lifts to reveal its punched data pattern;
 * adjacent cards fan out, staggered by distance on the 700ms lift curve.
 * Geometry carries identity: a chamfered corner and punched data columns.
 */
const {
  Cam, clamp, facing, fillet, fit, hull, open, poly, proj, rad, ringAt, rrect, run, seg,
  tdone, tset, tval, tween, disposer, mk, place, pointer, reflect, register,
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

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;

  const C = Cam(45, 0.5, 1.62);
  fit(C, [
    [X0, Y0, 0], [X1, Y1, -8], [X1, Y0, 0], [X0, Y1, 0],
    [X0, Y0, H], [X1, Y0, H + LIFT], [X0, Y1, H + LIFT],
  ], 200, 166);
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

hairline({
  name: "sorter",
  means: "A stepped tray of punched index cards: the card under the pointer lifts to show its notches, and adjacent cards fan out.",
  rules: [1, 2, 4, 8, 10],
  range: [0, 40, 90],
  tour: [[160, 165], [205, 120], [275, 115], null],
  mount,
});
