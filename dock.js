/**
 * Dock: a container terminal gantry crane spanning five modular pods.
 * The trolley glides along overhead rails to the bay under the pointer;
 * hoist cables engage and lift the pod, revealing its docking base.
 */
const {
  Cam, clamp, facing, fit, flatDot, hull, mk, open, place, pointer, poly,
  prism, proj, put, rad, reflect, register, ringAt, rings, rrect, run, seg,
  solid, spring, stepS, unproj, disposer,
} = HL;

const N = 5, CW = 52, CD = 14, CH = 14, G = 18;
const X0 = 12, X1 = X0 + CW;
const LIFT = 14;
const RAIL_Z = 36;
const POST_X0 = 2, POST_X1 = X1 + 10;
const POST_Y0 = -6, POST_Y1 = (N - 1) * G + CD + 6;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.66);

  fit(C, [
    [-10, -14, -8], [POST_X1 + 8, POST_Y1 + 10, -8],
    [POST_X1 + 8, -14, -8], [-10, POST_Y1 + 10, -8],
    [POST_X0, POST_Y0, RAIL_Z + 6], [POST_X1, POST_Y1, RAIL_Z + 6],
  ], 200, 158);

  const P = proj(C), front = facing(C);
  let maxLift = value;
  let activeBay = -1;

  const g = mk("g", {}, svg);

  // 1. Concrete dock plinth
  const [br, bi] = rings(-8, -12, POST_X1 + 6, POST_Y1 + 8, 8, 2.4);
  put(solid(g), prism(P, front, br, bi, -8, 0));
  reflect(svg, g, P, front, br, -8, 14);

  // Guide markings on dock slab
  const dockGuides = [];
  for (let i = 0; i < N; i++) {
    const y = i * G;
    dockGuides.push(seg(P(X0 - 4, y + CD / 2, 0.1), P(X0, y + CD / 2, 0.1)));
    dockGuides.push(seg(P(X1, y + CD / 2, 0.1), P(X1 + 4, y + CD / 2, 0.1)));
  }
  mk("path", { d: dockGuides.join(""), class: "dash lo" }, g);

  // 2. Far gantry legs (Post 0 and Post 1)
  const farPosts = [
    { x: POST_X0, y: POST_Y0 },
    { x: POST_X0, y: POST_Y1 },
  ];
  farPosts.forEach((pt) => {
    const [pr, pi] = rings(pt.x, pt.y, pt.x + 4, pt.y + 4, 1.2, 0.5);
    put(solid(g), prism(P, front, pr, pi, 0, RAIL_Z));
  });

  // Far crane rail
  const [frr, fri] = rings(POST_X0 - 1, POST_Y0 - 4, POST_X0 + 5, POST_Y1 + 4, 1.4, 0.6);
  put(solid(g), prism(P, front, frr, fri, RAIL_Z - 2, RAIL_Z + 2));

  // 3. Container pods & docking bays
  const pods = [];
  for (let i = 0; i < N; i++) {
    const y0 = i * G, y1 = y0 + CD;
    
    // Static bay floor outline
    const floorMark = open(ringAt(P, rrect(X0, y0, X1, y1, 2.2), 0.2));
    mk("path", { d: floorMark, class: "dash lo" }, g);

    // Pod solid
    const el = solid(g);
    const [ring, inner] = rings(X0, y0, X1, y1, 2.2, 0.8);
    
    // Top container ridges / corner pads
    const ridgeD = [
      seg(P(X0 + 8, y0 + CD / 2, 0), P(X1 - 8, y0 + CD / 2, 0)),
      seg(P(X0 + 8, y0 + 3, 0), P(X1 - 8, y0 + 3, 0)),
      seg(P(X0 + 8, y1 - 3, 0), P(X1 - 8, y1 - 3, 0)),
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
    { x: POST_X1 - 4, y: POST_Y0 },
    { x: POST_X1 - 4, y: POST_Y1 },
  ];
  nearPosts.forEach((pt) => {
    const [pr, pi] = rings(pt.x, pt.y, pt.x + 4, pt.y + 4, 1.2, 0.5);
    put(solid(g), prism(P, front, pr, pi, 0, RAIL_Z));
  });

  // Near crane rail
  const [nrr, nri] = rings(POST_X1 - 5, POST_Y0 - 4, POST_X1 + 1, POST_Y1 + 4, 1.4, 0.6);
  put(solid(g), prism(P, front, nrr, nri, RAIL_Z - 2, RAIL_Z + 2));

  // 5. Overhead Travelling Trolley & Spreader
  const trolleyEl = solid(g);
  const spreaderCables = mk("path", { class: "dash hi" }, g);
  const trolleySp = spring(2 * G + CD / 2, { k: 80, c: 16, eps: 0.03 });
  let trolleyDrawn = NaN;

  // Active status indicator dot on trolley spreader
  const dotEl = flatDot(g, C, 0.8, "dot m");

  function drawPod(pod) {
    const z = Math.max(0, pod.sp.x);
    if (Math.abs(z - pod.drawnZ) < 0.05) return;
    pod.drawnZ = z;

    put(pod.el, prism(P, front, pod.ring, pod.inner, z, z + CH));
    pod.el.sil.classList.toggle("hi", z > 2);

    // Reposition container roof ridge markings
    const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
    const dz = z + CH;
    const offsetSy = -dz * zf * C.S;
    pod.ridgeEl.setAttribute("d", pod.ridgeD);
    pod.ridgeEl.setAttribute("transform", `translate(0, ${offsetSy})`);
  }

  function drawTrolley(ty) {
    if (Math.abs(ty - trolleyDrawn) < 0.05) return;
    trolleyDrawn = ty;

    const [tr, ti] = rings(POST_X0 - 2, ty - 5, POST_X1 + 2, ty + 5, 2.2, 0.8);
    put(trolleyEl, prism(P, front, tr, ti, RAIL_Z + 1, RAIL_Z + 5));

    // Update cables dropping from trolley to lifted container
    const activePod = pods.find((p) => p.id === activeBay);
    const curZ = activePod ? Math.max(0, activePod.sp.x) + CH : 0;
    const cableLines = [
      seg(P(X0 + 4, ty - 3, RAIL_Z + 1), P(X0 + 4, ty - 3, Math.max(CH, curZ))),
      seg(P(X1 - 4, ty - 3, RAIL_Z + 1), P(X1 - 4, ty - 3, Math.max(CH, curZ))),
      seg(P(X0 + 4, ty + 3, RAIL_Z + 1), P(X0 + 4, ty + 3, Math.max(CH, curZ))),
      seg(P(X1 - 4, ty + 3, RAIL_Z + 1), P(X1 - 4, ty + 3, Math.max(CH, curZ))),
    ];
    spreaderCables.setAttribute("d", cableLines.join(""));
    spreaderCables.classList.toggle("hi", activePod && curZ > CH + 1);

    // Indicator dot on trolley center
    place(dotEl, P((X0 + X1) / 2, ty, RAIL_Z + 5.4));
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
      trolleySp.t = idx * G + CD / 2;
      if (read) read.textContent = `bay 0${idx + 1}`;
      dotEl.setAttribute("class", "dot");
    } else {
      trolleySp.t = 2 * G + CD / 2;
      if (read) read.textContent = "rest";
      dotEl.setAttribute("class", "dot m");
    }

    B.wake();
  }

  // Pointer hit testing against static bay slots
  function hit([sx, sy]) {
    if (sx < 60 || sx > 340 || sy < 50 || sy > 270) return -1;
    const pt = unproj(C, sx, sy, 0);
    if (!pt || pt[0] < X0 - 8 || pt[0] > X1 + 8) return -1;
    const y = pt[1];
    if (y < -4 || y > (N - 1) * G + CD + 4) return -1;
    const idx = Math.round((y - CD / 2) / G);
    return clamp(idx, 0, N - 1);
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

hairline({
  name: "dock",
  means: "A modular container gantry: the trolley glides along overhead rails to hoist the pod under the pointer.",
  rules: [1, 2, 4, 7, 9],
  range: [8, 14, 22],
  tour: [[150, 140], [210, 160], [270, 125], null],
  mount,
});
