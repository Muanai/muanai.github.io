/**
 * Smooth Ticker with Dynamic Cloning & Hover Deceleration
 */
(function initTicker() {
  function setup() {
    const track = document.querySelector('.hero-ticker-track');
    const wrap = document.querySelector('.hero-ticker-wrap');
    const baseGroup = document.getElementById('base-ticker-group');
    if (!track || !wrap || !baseGroup) return;

    const originalChildren = Array.from(baseGroup.children);
    
    function populateTicker() {
      // 1. Ensure base group is wider than viewport + some buffer
      const minWidth = window.innerWidth * 1.5;
      let currentWidth = baseGroup.getBoundingClientRect().width;
      
      // Safety limit to avoid infinite loop
      let iterations = 0;
      while (currentWidth < minWidth && iterations < 10) {
        originalChildren.forEach(child => {
          baseGroup.appendChild(child.cloneNode(true));
        });
        currentWidth = baseGroup.getBoundingClientRect().width;
        iterations++;
      }

      // 2. Clone the whole group for the CSS animation loop
      const cloneGroup = baseGroup.cloneNode(true);
      cloneGroup.removeAttribute('id');
      cloneGroup.setAttribute('aria-hidden', 'true');
      cloneGroup.querySelectorAll('a').forEach(a => a.setAttribute('tabindex', '-1'));
      track.appendChild(cloneGroup);
    }
    
    populateTicker();

    // Smooth Hover Deceleration
    let anim = null;
    function getAnim() {
      if (!anim) {
        const anims = track.getAnimations();
        if (anims && anims.length > 0) anim = anims[0];
      }
      return anim;
    }

    let targetRate = 1.0;
    let currentRate = 1.0;
    let rafId = null;

    function stepRate() {
      const a = getAnim();
      if (!a) return;

      // Smooth exponential lerp towards targetRate
      currentRate += (targetRate - currentRate) * 0.07;

      if (Math.abs(targetRate - currentRate) < 0.005) {
        currentRate = targetRate;
        a.playbackRate = currentRate;
      } else {
        a.playbackRate = currentRate;
        rafId = requestAnimationFrame(stepRate);
      }
    }

    wrap.addEventListener('mouseenter', () => {
      targetRate = 0.22; // Melambat secara mulus hingga ~22% kecepatan normal
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(stepRate);
    });

    wrap.addEventListener('mouseleave', () => {
      targetRate = 1.0; // Berakselerasi kembali secara bertahap
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(stepRate);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
