
  (function () {

    /* ════════════════════════════════
       FLOATING PARTICLE BACKGROUND
    ════════════════════════════════ */
    const canvas = document.getElementById('bg-canvas');
    const ctx    = canvas.getContext('2d');
    let W, H;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const NUM_PARTICLES = 55;
    const particles = [];

    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x:  Math.random() * 1,
        y:  Math.random() * 1,
        vx: (Math.random() - 0.5) * 0.00015,
        vy: (Math.random() - 0.5) * 0.00015,
        r:  Math.random() * 1.5 + 0.5,
        a:  Math.random() * 0.25 + 0.05,
      });
    }

    const CONNECT_DIST = 0.18; /* fraction of screen width */

    function drawParticles() {
      ctx.clearRect(0, 0, W, H);

      /* Update positions */
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      });

      /* Draw connections */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = (a.x - b.x) * W;
          const dy = (a.y - b.y) * H;
          const d  = Math.sqrt(dx*dx + dy*dy);
          const maxD = CONNECT_DIST * W;

          if (d < maxD) {
            const alpha = (1 - d / maxD) * 0.12;
            ctx.beginPath();
            ctx.moveTo(a.x * W, a.y * H);
            ctx.lineTo(b.x * W, b.y * H);
            ctx.strokeStyle = `rgba(255,97,97,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      /* Draw dots */
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,97,97,${p.a})`;
        ctx.fill();
      });

      requestAnimationFrame(drawParticles);
    }

    drawParticles();

    /* ════════════════════════════════
       CUSTOM CURSOR
    ════════════════════════════════ */
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const ring = document.getElementById('cursor-ring');
    const dot  = document.getElementById('cursor-dot');

    let mouseX = -100, mouseY = -100;
    let ringX  = -100, ringY  = -100;

    const CLICKABLE = 'a, button, [role="button"]';

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX; mouseY = e.clientY;
      document.body.classList.remove('cursor-out');
      document.body.classList.toggle('cursor-pointer', !!e.target.closest(CLICKABLE));
    });

    document.addEventListener('mouseleave', () => document.body.classList.add('cursor-out'));

    const LERP = 0.12;
    function lerp(a, b, t) { return a + (b - a) * t; }

    function animateCursor() {
      dot.style.transform  = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
      ringX = lerp(ringX, mouseX, LERP);
      ringY = lerp(ringY, mouseY, LERP);
      ring.style.transform = `translate(calc(${ringX}px - 50%), calc(${ringY}px - 50%))`;
      requestAnimationFrame(animateCursor);
    }

    animateCursor();

  })();
  
