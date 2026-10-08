/**
 * Lattice: three stepped neural network layers holding twelve node pillars.
 * The node under the pointer spikes, propagating activation across weights
 * to adjacent layers on damped springs.
 */
const {
  Cam, clamp, facing, fit, hull, open, poly, prism, proj, ringAt, rings, rrect, run, seg,
  solid, spring, stepS, unproj, disposer, flatDot, mk, place, pointer, put, reflect, register,
} = HL;

const FOOT = 11, HMAX = 38;

/** Gaussian falloff from the pointer: 1 at 0, 0.35 at 0.5R, 0.08 at R */
const falloff = (u) => Math.exp(-3.2 * Math.min(u, 1.4) ** 2);

/** Nodes layout across 3 layers */
const LAYERS = [
  { name: "in", z0: 4, y: 13, xs: [16, 40, 68, 92] },
  { name: "hid", z0: 8, y: 59, xs: [8, 30, 54, 78, 100] },
  { name: "out", z0: 12, y: 106, xs: [24, 54, 84] },
];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.25);

  fit(C, [
    [-12, -12, -8], [122, 132, -8], [122, -12, -8], [-12, 132, -8],
    [0, 0, 16 + HMAX], [110, 120, 16 + HMAX],
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

  // 3. Synaptic guide lines between adjacent layers (drawn behind pillars)
  const guides = [];
  for (let l = 0; l < 2; l++) {
    const l1 = LAYERS[l], l2 = LAYERS[l + 1];
    l1.xs.forEach((x1) => {
      l2.xs.forEach((x2) => {
        guides.push(seg(P(x1 + FOOT / 2, l1.y + FOOT / 2, l1.z0), P(x2 + FOOT / 2, l2.y + FOOT / 2, l2.z0)));
      });
    });
  }
  mk("path", { d: guides.join(""), class: "dash lo" }, g);

  // 4. Node pillars
  const nodes = [];
  let totalIdx = 0;

  LAYERS.forEach((ly, lIdx) => {
    ly.xs.forEach((x, nIdx) => {
      // Designed rest heights: a sculpted activation bell curve
      const restRelief = [
        [8, 12, 14, 9],
        [10, 18, 26, 19, 11],
        [9, 16, 10],
      ][lIdx][nIdx];

      const [ring, inner] = rings(x, ly.y, x + FOOT, ly.y + FOOT, 2.8, 0.9);
      const el = solid(g);
      const cx = x + FOOT / 2, cy = ly.y + FOOT / 2;

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

  // Peak node indicator dot
  const peak = nodes.reduce((a, b) => (b.h0 > a.h0 ? b : a));
  const dotEl = flatDot(g, C, 0.7, "dot m");
  let activeNode = peak;

  function drawNode(n) {
    const h = Math.max(1.2, n.sp.x);
    if (Math.abs(h - n.drawn) < 0.05) return;
    n.drawn = h;
    put(n.el, prism(P, front, n.ring, n.inner, n.z0, n.z0 + h));
    n.el.sil.classList.toggle("hi", h > HMAX * 0.58);
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
      read.textContent = "rest";
      B.wake();
      return;
    }

    let nearest = nodes[0], minDist = Infinity;
    nodes.forEach((n) => {
      const d = Math.hypot(n.cx - over[0], n.cy - over[1]);
      if (d < minDist) { minDist = d; nearest = n; }
      const factor = falloff(d / R);
      n.sp.t = clamp(n.h0 + (HMAX - n.h0) * factor, n.h0, HMAX);
    });

    activeNode = nearest;
    read.textContent = `node ${nearest.layer}·0${nearest.nIdx + 1}`;
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

hairline({
  name: "lattice",
  means: "Three stepped neural network layers: the node under the pointer spikes, propagating activation across weights.",
  rules: [1, 3, 5, 7, 9],
  range: [18, 38, 65],
  tour: [[160, 135], [205, 160], [255, 185], null],
  mount,
});
