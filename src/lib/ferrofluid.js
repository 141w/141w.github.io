/* Ferrofluid —— React Bits 同名组件的原生 WebGL 实现（不引 ogl）。
   随样品验证过的版本原样迁入，只把 IIFE 改成 ES 模块。 */
const global = window;

  const MAX_COLORS = 8;

  const DEFAULTS = {
    colors: ["#ffffff", "#ffffff", "#ffffff"],
    speed: 0.5,
    scale: 1.6,
    turbulence: 1,
    fluidity: 0.1,
    rimWidth: 0.2,
    sharpness: 2.5,
    shimmer: 1.5,
    glow: 2,
    flowDirection: "down",
    opacity: 1,
    mouseInteraction: true,
    mouseStrength: 1,
    mouseRadius: 0.35,
    mouseDampening: 0.15,
    mixBlendMode: "",
    dpr: 0,
  };

  const hexToRGB = (hex) => {
    const c = String(hex).replace("#", "").padEnd(6, "0");
    return [
      parseInt(c.slice(0, 2), 16) / 255,
      parseInt(c.slice(2, 4), 16) / 255,
      parseInt(c.slice(4, 6), 16) / 255,
    ];
  };

  const prepColors = (input) => {
    const base = (input && input.length ? input : DEFAULTS.colors).slice(0, MAX_COLORS);
    const count = base.length;
    const arr = [];
    for (let i = 0; i < MAX_COLORS; i++) arr.push(hexToRGB(base[Math.min(i, base.length - 1)]));
    const avg = [0, 0, 0];
    for (let i = 0; i < count; i++) {
      avg[0] += arr[i][0];
      avg[1] += arr[i][1];
      avg[2] += arr[i][2];
    }
    return { arr, count, avg: [avg[0] / count, avg[1] / count, avg[2] / count] };
  };

  const flowVec = (d) =>
    d === "up" ? [0, 1] : d === "left" ? [-1, 0] : d === "right" ? [1, 0] : [0, -1];

  const VERTEX = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const FRAGMENT = `
precision highp float;

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

uniform vec3  uMouseColor;
uniform vec2  uFlow;
uniform float uSpeed;
uniform float uScale;
uniform float uTurbulence;
uniform float uFluidity;
uniform float uRimWidth;
uniform float uSharpness;
uniform float uShimmer;
uniform float uGlow;
uniform float uOpacity;
uniform float uMouseEnabled;
uniform float uMouseStrength;
uniform float uMouseRadius;

varying vec2 vUv;

#define PI 3.14159265

vec3 palette(float h) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int idx = int(floor(clamp(h, 0.0, 0.999999) * float(count)));
  if (idx <= 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

float hash(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smin(float a, float b, float k) {
  float r = exp2(-a / k) + exp2(-b / k);
  return -k * log2(r);
}

float sinlerp(float a, float b, float w) {
  return mix(a, b, (sin(w * PI - PI / 2.0) + 1.0) / 2.0);
}

float vn(vec2 p, float s, float seed) {
  vec2 cellp = floor(p / s);
  vec2 relp = mod(p, s);
  float g1 = hash(vec3(cellp, seed));
  float g2 = hash(vec3(cellp.x + 1.0, cellp.y, seed));
  float g3 = hash(vec3(cellp.x + 1.0, cellp.y + 1.0, seed));
  float g4 = hash(vec3(cellp.x, cellp.y + 1.0, seed));
  float bx = sinlerp(g1, g2, relp.x / s);
  float tx = sinlerp(g4, g3, relp.x / s);
  return sinlerp(bx, tx, relp.y / s);
}

float dbn(vec2 p, float s, float seed) {
  float o = s / 2.0;
  float n0 = vn(p, s, seed);
  float n1 = vn(p + vec2(o, o), s, seed + 0.1);
  float n2 = vn(p + vec2(-o, o), s, seed + 0.2);
  float n3 = vn(p + vec2(o, -o), s, seed + 0.3);
  float n4 = vn(p + vec2(-o, -o), s, seed + 0.4);
  return (2.0 * n0 + 1.5 * n1 + 1.25 * n2 + 1.125 * n3 + n4) / 7.0;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float ref = 700.0 / max(uScale, 0.05);
  vec2 p = fragCoord / iResolution.y * ref;

  float spd = 200.0 * uSpeed;
  float t = iTime;

  vec2 dir = uFlow;
  vec2 perp = vec2(-dir.y, dir.x);

  float distort1 = vn(p + perp * (t * spd), 60.0, 10.0) * 50.0 * uTurbulence;
  float distort2 = vn(p - perp * (t * spd), 120.0, 15.0) * 100.0 * uTurbulence;

  float peaks = dbn(p + distort1 + dir * (t * spd * 0.5), 40.0, 1.0);
  float peaks2 = dbn(p + distort2 - dir * (t * spd * 0.5), 40.0, 0.0);

  float mapeaks = smin(peaks, peaks2, max(uFluidity, 0.001));

  float mGlow = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mp = iMouse / iResolution.y * ref;
    float md = length(p - mp) / ref;
    float rr = max(uMouseRadius, 0.02);
    mGlow = exp(-md * md / (rr * rr)) * uMouseStrength;
  }

  float band = (uRimWidth - abs((mapeaks - 0.4) * 2.0)) * 5.0;
  float ltn = clamp(band - vn(p + dir * (t * spd * 0.5), 60.0, 12.0) * uShimmer, 0.0, 1.0);
  ltn = pow(ltn, uSharpness) * uGlow;
  ltn *= clamp(1.0 - mGlow, 0.0, 1.0);

  float h = clamp(0.5 + (peaks - peaks2) * 0.8, 0.0, 1.0);
  vec3 col = palette(h);

  vec3 outc = col * ltn;
  float a = clamp(max(outc.r, max(outc.g, outc.b)), 0.0, 1.0);
  fragColor = vec4(outc, a * uOpacity);
}

void main() {
  vec4 color;
  mainImage(color, vUv * iResolution.xy);
  gl_FragColor = color;
}
`;

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createFerrofluid(container, options) {
    const s = Object.assign({}, DEFAULTS, options || {});
    const noop = { setOptions() {}, destroy() {} };
    if (!container) return noop;

    const gl = (container.querySelector("canvas") || container.appendChild(document.createElement("canvas")))
      .getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return noop;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return noop;
    }
    gl.useProgram(program);

    // 与 ogl 的 Triangle 一致：一个覆盖视口的超大三角形，无需索引缓冲
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, 3, 1, -1, -3, 0, 0, 1, 0, 0, 1]), gl.STATIC_DRAW);
    const positionLoc = gl.getAttribLocation(program, "position");
    const uvLoc = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 12);

    const u = {};
    const loc = (name) => (u[name] === undefined ? (u[name] = gl.getUniformLocation(program, name)) : u[name]);
    const f = (name, v) => gl.uniform1f(loc(name), v);
    const i = (name, v) => gl.uniform1i(loc(name), v);
    const v2 = (name, a, b) => gl.uniform2f(loc(name), a, b);
    const v3 = (name, arr) => gl.uniform3f(loc(name), arr[0], arr[1], arr[2]);

    const { arr, count, avg } = prepColors(s.colors);
    const canvas = gl.canvas;
    const reduced = !!global.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const flow = flowVec(s.flowDirection);
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;
    let alive = true;
    let visible = true;
    let time = 0;
    let last = 0;
    let dirty = true;

    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    if (s.mixBlendMode) canvas.style.mixBlendMode = s.mixBlendMode;

    const settings = s;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(global.devicePixelRatio || 1, settings.dpr || 1.5);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      dirty = true;
    };

    const draw = () => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform3f(loc("iResolution"), canvas.width, canvas.height, 1);
      v2("iMouse", mouse.x, mouse.y);
      f("iTime", time);
      for (let k = 0; k < MAX_COLORS; k++) v3("uColor" + k, arr[k]);
      i("uColorCount", count);
      v3("uMouseColor", avg);
      v2("uFlow", flow[0], flow[1]);
      f("uSpeed", settings.speed);
      f("uScale", settings.scale);
      f("uTurbulence", settings.turbulence);
      f("uFluidity", settings.fluidity);
      f("uRimWidth", settings.rimWidth);
      f("uSharpness", settings.sharpness);
      f("uShimmer", settings.shimmer);
      f("uGlow", settings.glow);
      f("uOpacity", settings.opacity);
      f("uMouseEnabled", settings.mouseInteraction ? 1 : 0);
      f("uMouseStrength", settings.mouseStrength);
      f("uMouseRadius", settings.mouseRadius);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now) => {
      raf = 0;
      if (!alive || !visible) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!reduced) time += dt * settings.speed * 2;
      if (settings.mouseDampening > 0) {
        const factor = 1 - Math.exp(-dt / Math.max(1e-4, settings.mouseDampening));
        mouse.x += (mouse.tx - mouse.x) * factor;
        mouse.y += (mouse.ty - mouse.y) * factor;
      }
      draw();
      if (reduced && !dirty) return;
      dirty = false;
      raf = requestAnimationFrame(loop);
    };

    const wake = () => {
      if (!raf && alive && visible) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sc = canvas.width / Math.max(1, rect.height);
      mouse.tx = (e.clientX - rect.left) * sc;
      mouse.ty = (rect.height - (e.clientY - rect.top)) * sc;
      if (settings.mouseDampening <= 0) {
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
      dirty = true;
      wake();
    };

    if (settings.mouseInteraction) {
      global.addEventListener("pointermove", onPointerMove, { passive: true });
    }
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) wake();
    };
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    wake();

    return {
      setOptions(next) {
        Object.assign(settings, next || {});
        dirty = true;
        wake();
      },
      destroy() {
        alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        if (settings.mouseInteraction) global.removeEventListener("pointermove", onPointerMove);
        gl.deleteProgram(program);
        gl.deleteBuffer(buffer);
        canvas.remove();
      },
    };
  }

export { createFerrofluid }
