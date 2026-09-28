/* ---------- SpecularButton 镜面高光按钮（原生移植） ----------
   原组件依赖 ogl，且每个按钮各起一个 WebGL 上下文 + 一条 rAF。样品是零构建
   页面，一页最多同时有 13 个按钮，所以改成：一块全屏画布、一个上下文、一条
   rAF，按按钮逐个 scissor 画。指针远离时高光衰减到 0，画完最后一帧静态描边
   就停掉循环，页面静止期不吃 CPU。着色器保持原稿。 */
const SPEC_VERT = `#version 300 es
in vec2 position;
void main() {
gl_Position = vec4(position, 0.0, 1.0);
}
`;

const SPEC_FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
vec2 q = abs(p) - b + r;
return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { return sdRoundedRect(p, uHalfSize, uRadius); }

float gaussianLine(float d, float sigma) {
float x = d / (sigma + 1e-6);
float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
return exp(-k * x * x);
}

void main() {
vec2 p = gl_FragCoord.xy - uCenter;
float d = shapeSDF(p);
vec2 L = vec2(cos(uAngle), sin(uAngle));

float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
float line = gaussianLine(d, uThickness);
float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
float hi = line * rim * edgeClamp * uIntensity;

vec3 col = uBaseColor * base + uLineColor * hi;
float a = clamp(base + hi, 0.0, 1.0);
fragColor = vec4(col, a);
}
`;

const SPEC_PAD = 20;
let spec = null

/** 由 ScrollStack 挂载时注入：先同步它的 transform，再需要按遮挡剔除按钮 */
const stackHooks = { syncLayout: null, occlusionTest: false }

export function bindSpecularStack(hooks) {
  stackHooks.syncLayout = hooks && hooks.syncLayout ? hooks.syncLayout : null
  stackHooks.occlusionTest = !!(hooks && hooks.occlusionTest)
}

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

const it0H = (el) => el.offsetHeight || 1;

const specRgb = (hex) => {
  const v = String(hex).replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
};

/* 主次按钮共用同一套高光，只把静态描边和亮度分开 */
function specProps(el) {
  const primary = el.classList.contains("btn-primary");
  return {
    radius: 18,
    lineColor: specRgb("#ffffff"),
    baseColor: specRgb(primary ? "#8f8f8f" : "#525252"),
    intensity: primary ? 1.2 : 1,
    shineSize: (10 * Math.PI) / 180,
    shineFade: (40 * Math.PI) / 180,
    thickness: 1,
    speed: 0.35,
    followMouse: true,
    proximity: 250,
    autoAnimate: false,
  };
}

function specShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("specular shader:", gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

function specResize() {
  if (!spec) return;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(window.innerWidth * dpr));
  const h = Math.max(1, Math.round(window.innerHeight * dpr));
  spec.dpr = dpr;
  if (spec.canvas.width !== w || spec.canvas.height !== h) {
    spec.canvas.width = w;
    spec.canvas.height = h;
    spec.canvas.style.width = `${w / dpr}px`;
    spec.canvas.style.height = `${h / dpr}px`;
    spec.gl.viewport(0, 0, w, h);
  }
}

function specInit() {
  if (spec) return spec;
  if (reducedMotion()) return null;

  const canvas = document.createElement("canvas");
  const layer = document.createElement("div");
  layer.className = "specular-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.appendChild(canvas);

  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
  });
  if (!gl) return null;

  const vs = specShader(gl, gl.VERTEX_SHADER, SPEC_VERT);
  const fs = specShader(gl, gl.FRAGMENT_SHADER, SPEC_FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("specular link:", gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(prog, "position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const u = (name) => gl.getUniformLocation(prog, name);
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  document.body.appendChild(layer);
  document.documentElement.classList.add("specular-on");

  spec = {
    gl,
    canvas,
    layer,
    buf,
    posLoc,
    dpr: 1,
    raf: 0,
    last: 0,
    items: [],
    u: {
      center: u("uCenter"),
      halfSize: u("uHalfSize"),
      radius: u("uRadius"),
      angle: u("uAngle"),
      px: u("uPx"),
      lineColor: u("uLineColor"),
      baseColor: u("uBaseColor"),
      intensity: u("uIntensity"),
      shineSize: u("uShineSize"),
      shineFade: u("uShineFade"),
      thickness: u("uThickness"),
      baseWidth: u("uBaseWidth"),
    },
  };
  specResize();
  window.addEventListener("pointermove", specOnPointerMove);
  window.addEventListener("scroll", specKick, { passive: true });
  window.addEventListener("resize", () => {
    specResize();
    /* 窗口宽度变了会重排换行，布局高度要重新量一次（滚动中不必每帧读） */
    spec.items.forEach((it) => {
      if (it.el.isConnected) it.layoutH = it0H(it.el);
    });
    specKick();
  });
  return spec;
}

/* 原组件的指针逻辑：靠近则定角、覆盖则停在斜对角并随指针轻微摆动 */
function specOnPointerMove(e) {
  if (!spec) return;
  for (const it of spec.items) {
    const rect = it.el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
    const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
    const dist = Math.hypot(dx, dy);
    if (dist === 0) {
      const nx = (e.clientX - cx) / (rect.width / 2);
      const ny = (cy - e.clientY) / (rect.height / 2);
      it.pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15;
    } else {
      it.pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx);
    }
    const t = Math.max(0, 1 - dist / Math.max(it.p.proximity, 1));
    it.prox = t * t * (3 - 2 * t);
  }
  specKick();
}

function specKick() {
  if (!spec || spec.raf) return;
  spec.last = performance.now();
  spec.raf = requestAnimationFrame(specUpdate);
}

function specDrawItem(it, rect) {
  const gl = spec.gl;
  const dpr = spec.dpr;
  const w = rect.width;
  const h = rect.height;
  const left = Math.max(0, Math.round((rect.left - SPEC_PAD) * dpr));
  const bottom = Math.max(0, Math.round((window.innerHeight - rect.bottom - SPEC_PAD) * dpr));
  const width = Math.min(spec.canvas.width - left, Math.round((w + SPEC_PAD * 2) * dpr));
  const height = Math.min(spec.canvas.height - bottom, Math.round((h + SPEC_PAD * 2) * dpr));
  if (width <= 0 || height <= 0) return;
  gl.scissor(left, bottom, width, height);

  const U = spec.u;
  const p = it.p;
  /* ScrollStack 会对卡片做等比 scale，rect 已含缩放；圆角与线宽要同比缩小才贴边 */
  const k = it.layoutH ? Math.min(1, rect.height / it.layoutH) : 1;
  gl.uniform2f(U.center, (rect.left + w / 2) * dpr, (window.innerHeight - rect.top - h / 2) * dpr);
  gl.uniform2f(U.halfSize, (w / 2) * dpr, (h / 2) * dpr);
  gl.uniform1f(U.radius, Math.min(p.radius * k, Math.min(w, h) / 2) * dpr);
  gl.uniform1f(U.angle, it.angle);
  gl.uniform1f(U.px, dpr);
  gl.uniform3fv(U.lineColor, p.lineColor);
  gl.uniform3fv(U.baseColor, p.baseColor);
  gl.uniform1f(U.intensity, p.intensity * it.bright);
  gl.uniform1f(U.shineSize, p.shineSize);
  gl.uniform1f(U.shineFade, p.shineFade);
  gl.uniform1f(U.thickness, p.thickness * k * dpr);
  gl.uniform1f(U.baseWidth, k * dpr);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function specUpdate(now) {
  /* 同一帧里先把会移动卡片的布局写完，再一次性读几何。
     写成读交替每次都强制重排（同样的读取量实测 0.01ms -> 0.52ms），
     而且高光会停在上一帧的位置，看起来像拖着抖。 */
  if (stackHooks.syncLayout) stackHooks.syncLayout()
  const gl = spec.gl;
  const dt = Math.min((now - spec.last) / 1000, 0.05);
  spec.last = now;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const needHit = stackHooks.occlusionTest;
  let moving = false;

  gl.disable(gl.SCISSOR_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.SCISSOR_TEST);

  for (const it of spec.items) {
    if (!it.el.isConnected) continue;
    const rect = it.el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    /* 叠卡会被后面的卡片整块盖住，高光层是全屏覆盖层、画在内容之上，
       所以用命中测试剔掉被遮住的按钮，避免残影浮在前面的卡上。 */
    if (needHit) {
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (!hit || (hit !== it.el && !it.el.contains(hit))) continue;
    }
    if (rect.right < -SPEC_PAD || rect.left > vw + SPEC_PAD) continue;
    if (rect.bottom < -SPEC_PAD || rect.top > vh + SPEC_PAD) continue;

    it.idle += it.p.speed * dt;
    const target =
      it.p.followMouse && it.pointerAngle != null && (!it.p.autoAnimate || it.prox > 0)
        ? it.pointerAngle
        : it.idle;
    const diff = ((target - it.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    it.angle += diff * (1 - Math.exp(-dt * 7));
    const brightTarget = it.p.autoAnimate ? 1 : it.prox;
    it.bright += (brightTarget - it.bright) * (1 - Math.exp(-dt * 8));
    if (it.bright > 0.003 || it.p.autoAnimate) moving = true;

    specDrawItem(it, rect);
  }

  gl.disable(gl.SCISSOR_TEST);
  if (moving) {
    spec.raf = requestAnimationFrame(specUpdate);
  } else {
    /* 最后一帧只留静态描边，之后停循环 */
    spec.raf = 0;
  }
}

function mountSpecularButtons() {
  const els = [...document.querySelectorAll(".btn")];
  if (!els.length) return;
  if (!specInit()) return;
  spec.items = [];
  for (const el of els) {
    el.classList.add("is-specular");
    el.style.borderRadius = "18px";
    spec.items.push({
      el,
      layoutH: it0H(el),
      p: specProps(el),
      angle: 2.4,
      idle: 2.4,
      bright: 0,
      prox: 0,
      pointerAngle: null,
    });
  }
  specKick();
}

function destroySpecularButtons() {
  if (!spec) return;
  spec.items = [];
  const gl = spec.gl;
  gl.disable(gl.SCISSOR_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT);
}


export { mountSpecularButtons, destroySpecularButtons, specKick }
