/* Aurora — port 1:1 do componente React <Aurora /> (React Bits) para
 * HTML + CSS + JS puros, SEM dependências (ogl, React, etc).
 *
 * Shader idêntico ao original: WebGL2 (#version 300 es), Simplex noise (snoise),
 * COLOR_RAMP macro, smoothstep alpha, lightMode, blend, amplitude.
 *
 * Cores do site: ["#b32e2e", "#d9a441", "#8f2020"] (vinho → dourado → vinho escuro).
 * Escopo: FUNDO FIXO DO SITE TODO (canvas fixed, atrás de todo o conteúdo).
 */
(function () {
  'use strict';

  /* ===================== CONFIGURAÇÃO ===================== */
  var CONFIG = {
    colorStops: ['#b32e2e', '#d9a441', '#8f2020'],
    amplitude: 1.0,
    blend: 0.5,
    speed: 1.0,
    lightMode: false
  };

  /* ===================== SHADERS (cópia exata do React) ===================== */
  var VERT = [
    '#version 300 es',
    'in vec2 position;',
    'void main() {',
    '  gl_Position = vec4(position, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    '#version 300 es',
    'precision highp float;',
    '',
    'uniform float uTime;',
    'uniform float uAmplitude;',
    'uniform vec3 uColorStops[3];',
    'uniform vec2 uResolution;',
    'uniform float uBlend;',
    'uniform float uLightMode;',
    '',
    'out vec4 fragColor;',
    '',
    'vec3 permute(vec3 x) {',
    '  return mod(((x * 34.0) + 1.0) * x, 289.0);',
    '}',
    '',
    'float snoise(vec2 v){',
    '  const vec4 C = vec4(',
    '      0.211324865405187, 0.366025403784439,',
    '      -0.577350269189626, 0.024390243902439',
    '  );',
    '  vec2 i  = floor(v + dot(v, C.yy));',
    '  vec2 x0 = v - i + dot(i, C.xx);',
    '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
    '  vec4 x12 = x0.xyxy + C.xxzz;',
    '  x12.xy -= i1;',
    '  i = mod(i, 289.0);',
    '',
    '  vec3 p = permute(',
    '      permute(i.y + vec3(0.0, i1.y, 1.0))',
    '    + i.x + vec3(0.0, i1.x, 1.0)',
    '  );',
    '',
    '  vec3 m = max(',
    '      0.5 - vec3(',
    '          dot(x0, x0),',
    '          dot(x12.xy, x12.xy),',
    '          dot(x12.zw, x12.zw)',
    '      ),',
    '      0.0',
    '  );',
    '  m = m * m;',
    '  m = m * m;',
    '',
    '  vec3 x = 2.0 * fract(p * C.www) - 1.0;',
    '  vec3 h = abs(x) - 0.5;',
    '  vec3 ox = floor(x + 0.5);',
    '  vec3 a0 = x - ox;',
    '  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);',
    '',
    '  vec3 g;',
    '  g.x  = a0.x  * x0.x  + h.x  * x0.y;',
    '  g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
    '  return 130.0 * dot(m, g);',
    '}',
    '',
    'struct ColorStop {',
    '  vec3 color;',
    '  float position;',
    '};',
    '',
    '#define COLOR_RAMP(colors, factor, finalColor) {',
    '  int index = 0;',
    '  for (int i = 0; i < 2; i++) {',
    '     ColorStop currentColor = colors[i];',
    '     bool isInBetween = currentColor.position <= factor;',
    '     index = int(mix(float(index), float(i), float(isInBetween)));',
    '  }',
    '  ColorStop currentColor = colors[index];',
    '  ColorStop nextColor = colors[index + 1];',
    '  float range = nextColor.position - currentColor.position;',
    '  float lerpFactor = (factor - currentColor.position) / range;',
    '  finalColor = mix(currentColor.color, nextColor.color, lerpFactor);',
    '}',
    '',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / uResolution;',
    '',
    '  ColorStop colors[3];',
    '  colors[0] = ColorStop(uColorStops[0], 0.0);',
    '  colors[1] = ColorStop(uColorStops[1], 0.5);',
    '  colors[2] = ColorStop(uColorStops[2], 1.0);',
    '',
    '  vec3 rampColor;',
    '  COLOR_RAMP(colors, uv.x, rampColor);',
    '',
    '  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;',
    '  height = exp(height);',
    '  height = (uv.y * 2.0 - height + 0.2);',
    '  float intensity = 0.6 * height;',
    '',
    '  float midPoint = 0.20;',
    '  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);',
    '',
    '  vec3 auroraColor = intensity * rampColor;',
    '',
    '  if (uLightMode > 0.5) {',
    '    float energy = clamp(max(intensity, 0.0), 0.0, 1.0);',
    '    float coverage = clamp(auroraAlpha * (0.55 + 0.45 * energy), 0.0, 0.86);',
    '    vec3 chroma = pow(clamp(rampColor, 0.0, 1.0), vec3(1.2));',
    '    float chromaPeak = max(chroma.r, max(chroma.g, chroma.b));',
    '    chroma /= max(chromaPeak, 0.0001);',
    '    fragColor = vec4(mix(vec3(1.0), chroma, min(coverage * 1.08, 0.94)), 1.0);',
    '  } else {',
    '    fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);',
    '  }',
    '}'
  ].join('\n');

  /* ===================== UTILITÁRIOS ===================== */

  /** Converte hex "#rrggbb" para [r, g, b] (0-1) — equivalente ao Color() do ogl */
  function hexToRgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  function compileShader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('[aurora] shader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  /* ===================== INIT ===================== */
  function init() {
    var canvas = document.getElementById('aurora-bg');
    if (!canvas) return;
    var container = canvas.closest('.aurora-fixed') || canvas.parentElement;

    /* Respeita prefers-reduced-motion */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }

    /* WebGL2 (exigido pelo #version 300 es) */
    var gl = null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
        depth: false,
        stencil: false,
        powerPreference: 'low-power'
      });
    } catch (e) { gl = null; }

    if (!gl) {
      console.warn('[aurora] WebGL2 indisponível — usando fallback CSS.');
      canvas.style.display = 'none';
      return;
    }

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    /* Compila shaders */
    var vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.style.display = 'none'; return; }

    /* Linka programa */
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[aurora] program link error:', gl.getProgramInfoLog(prog));
      canvas.style.display = 'none';
      return;
    }
    gl.useProgram(prog);

    /* Triângulo fullscreen — Geometry do ogl: só position, sem uv */
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       3, -1,
      -1,  3
    ]), gl.STATIC_DRAW);

    var locPos = gl.getAttribLocation(prog, 'position');
    if (locPos >= 0) {
      gl.enableVertexAttribArray(locPos);
      gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 0, 0);
    }

    /* Uniform locations */
    function U(name) { return gl.getUniformLocation(prog, name); }
    var uTime      = U('uTime');
    var uAmplitude = U('uAmplitude');
    var uColorStops = [U('uColorStops[0]'), U('uColorStops[1]'), U('uColorStops[2]')];
    var uResolution = U('uResolution');
    var uBlend      = U('uBlend');
    var uLightMode  = U('uLightMode');

    /* Estado */
    var currentColors = CONFIG.colorStops.map(hexToRgb);

    function setColors(stops) {
      currentColors = stops.map(hexToRgb);
      for (var i = 0; i < 3; i++) {
        gl.uniform3f(uColorStops[i], currentColors[i][0], currentColors[i][1], currentColors[i][2]);
      }
    }

    function resize() {
      var w = Math.max(1, Math.floor(canvas.clientWidth * (window.devicePixelRatio || 1)));
      var h = Math.max(1, Math.floor(canvas.clientHeight * (window.devicePixelRatio || 1)));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uResolution, w, h);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    /* Seta uniforms iniciais */
    gl.uniform1f(uAmplitude, CONFIG.amplitude);
    gl.uniform1f(uBlend, CONFIG.blend);
    gl.uniform1i(uLightMode, CONFIG.lightMode ? 1 : 0);
    setColors(CONFIG.colorStops);

    /* Animação */
    var running = true;
    var startTime = performance.now();

    function frame(now) {
      if (!running) return;
      gl.uniform1f(uTime, (now - startTime) * 0.001 * CONFIG.speed);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      requestAnimationFrame(frame);
    }

    /* Pausa em aba oculta */
    var pausedAt = 0;
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        running = false;
        pausedAt = performance.now();
      } else if (!running) {
        running = true;
        startTime += performance.now() - pausedAt;
        requestAnimationFrame(frame);
      }
    });

    /* Expõe pra ajuste rápido via console: AuroraSet({amplitude: 2}) */
    window.AuroraSet = function (opts) {
      if (opts.colorStops) setColors(opts.colorStops);
      if (opts.amplitude !== undefined) { CONFIG.amplitude = opts.amplitude; gl.uniform1f(uAmplitude, opts.amplitude); }
      if (opts.blend !== undefined) { CONFIG.blend = opts.blend; gl.uniform1f(uBlend, opts.blend); }
      if (opts.lightMode !== undefined) { CONFIG.lightMode = opts.lightMode; gl.uniform1i(uLightMode, opts.lightMode ? 1 : 0); }
      if (opts.speed !== undefined) CONFIG.speed = opts.speed;
    };

    if (container) container.classList.add('aurora-webgl-on');
    console.info('[aurora] WebGL2 ativo — fundo animado ligado.');
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
