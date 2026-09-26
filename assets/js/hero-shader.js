/**
 * Hero Aurora Veil WebGL Shader
 * Converted to pure vanilla WebGL & tailored to the site's dark Raycast theme (#ff6161)
 */
(function initAuroraVeil() {
  function startShader() {
    const canvas = document.getElementById('hero-shader-canvas');
    if (!canvas) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let gl = null;
    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        desynchronized: true,
        powerPreference: 'low-power',
      });
    } catch (e) {
      return;
    }
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif

      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_pointer;

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);

        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));

        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 4; i++) {
          value += amplitude * noise(p);
          p = rotate2d(0.72) * p * 2.03 + 4.17;
          amplitude *= 0.5;
        }
        return value;
      }

      vec3 shaderColor(vec2 uv, vec2 p, float t, vec2 pointer) {
        vec2 q = p;
        q.x += sin(q.y * 2.0 + t * 0.18) * 0.22;
        q.y += cos(q.x * 1.7 - t * 0.14) * 0.16;

        // Interactive mouse distortion
        vec2 mouseDelta = (uv - pointer);
        float mouseDist = length(mouseDelta);
        q += mouseDelta * exp(-mouseDist * 3.5) * 0.25;

        float veilA = smoothstep(0.72, 0.04, abs(q.y + sin(q.x * 1.8 + t * 0.24) * 0.32));
        float veilB = smoothstep(0.62, 0.02, abs(q.y * 0.85 - cos(q.x * 2.4 - t * 0.2) * 0.24));
        float grain = fbm(q * 2.5 + t * 0.04);

        // Raycast Dark Theme Base (#07080a)
        vec3 base = vec3(0.027, 0.031, 0.039);
        // Primary Red Accent (#ff6161) & Crimson Glow (#a1131a)
        vec3 primaryRed = vec3(1.0, 0.38, 0.38);
        vec3 crimson = vec3(0.63, 0.07, 0.10);

        vec3 color = base + primaryRed * veilA * 0.44 + crimson * veilB * 0.30;
        color += (grain - 0.5) * 0.032;
        return color * 0.96;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / max(u_resolution.xy, vec2(1.0));
        vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / max(min(u_resolution.x, u_resolution.y), 1.0);
        vec2 pointer = u_pointer * 2.0 - 1.0;
        pointer.x *= u_resolution.x / max(u_resolution.y, 1.0);

        vec3 color = shaderColor(uv, p, u_time, pointer);
        color = pow(max(color, vec3(0.0)), vec3(0.92));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function compileShader(glCtx, type, source) {
      const shader = glCtx.createShader(type);
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
        glCtx.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const pointerLoc = gl.getUniformLocation(program, 'u_pointer');

    gl.useProgram(program);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const pointer = { x: 0.5, y: 0.5 };
    const heroSection = document.getElementById('home');
    if (heroSection) {
      heroSection.addEventListener('pointermove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        pointer.x = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(rect.width, 1)));
        pointer.y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / Math.max(rect.height, 1)));
      });
      heroSection.addEventListener('pointerleave', () => {
        pointer.x = 0.5;
        pointer.y = 0.5;
      });
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    let animationFrameId = null;
    let isVisible = true;

    function render(now) {
      if (!isVisible) return;
      resize();
      const t = prefersReduced ? 18.0 : now * 0.001;

      gl.useProgram(program);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, t);
      gl.uniform2f(pointerLoc, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!prefersReduced) {
        animationFrameId = requestAnimationFrame(render);
      }
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !prefersReduced) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(render);
        }
      }, { threshold: 0.05 });
      observer.observe(canvas);
    }

    resize();
    render(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startShader);
  } else {
    startShader();
  }
})();
