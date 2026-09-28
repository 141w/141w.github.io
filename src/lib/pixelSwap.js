/* PixelSwap 开屏溶解 —— React Bits 同名组件（TS + CSS 版）的原生实现，不引 motion。
 原组件把整块内容画进每个像素格，用「窗口变换 + 内容的精确逆运算」成对关键帧
 让画面从像素态收敛成完整卡片。以下数学部分照搬样品里已验证过的代码。 */
const MAX_PIXELS = 220;
const KEYFRAME_STEPS = 14;
export const SPLASH_DEFAULTS = {
  pixelSize: 48,
  gap: 0,
  pixelRadius: 0,
  pixelSpin: 0,
  pixelScale: 0.35,
  fade: true,
  duration: 1400,
  pixelDuration: 450,
  pattern: "random",
  randomness: 0,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
};
const PATTERNS = {
  random: () => null,
  center: (x, y) => Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2,
  edges: (x, y) => Math.min(x, 1 - x, y, 1 - y) * 2,
  "left-to-right": (x) => x,
  "right-to-left": (x) => 1 - x,
  "top-to-bottom": (_x, y) => y,
  "bottom-to-top": (_x, y) => 1 - y,
  diagonal: (x, y) => (x + y) / 2,
  spiral: (x, y) => {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
    const radius = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
    return (angle + radius) % 1;
  },
};
const EASING_POINTS = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};
const clampNum = (value, min, max) => Math.min(Math.max(value, min), max);
const noise = (seed) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};
function makeEasing(value) {
  const match = /cubic-bezier\(([^)]+)\)/.exec(value);
  const points = match ? match[1].split(",").map(Number) : EASING_POINTS[value];
  if (!points || points.length !== 4 || points.some(Number.isNaN)) return makeEasing("ease");
  const [x1, y1, x2, y2] = points;
  if (x1 === y1 && x2 === y2) return (progress) => progress;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return (progress) => {
    let t = progress;
    for (let i = 0; i < 5; i += 1) {
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (!slope) break;
      t -= (((ax * t + bx) * t + cx) * t - progress) / slope;
    }
    t = clampNum(t, 0, 1);
    return ((ay * t + by) * t + cy) * t;
  };
}
// 像素略微长过自己的格子，缝隙与圆角在结束时刚好闭合成完整画面
const coverScale = (size, gap, radius) => {
  const p = clampNum(radius, 0, 50) / 100;
  const corner = Math.SQRT1_2 / (Math.SQRT2 * (0.5 - p) + p);
  return ((size + gap) / size) * Math.max(1, corner);
};
function buildGrid({ width, height, pixelSize, gap, pattern, randomness }) {
  let size = pixelSize;
  let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
  let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  }
  const stride = size + gap;
  const originX = (width - (columns * stride - gap)) / 2;
  const originY = (height - (rows * stride - gap)) / 2;
  const order = PATTERNS[pattern] || PATTERNS.random;
  const mix = clampNum(randomness, 0, 1);
  const pixels = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const x = columns <= 1 ? 0.5 : column / (columns - 1);
      const y = rows <= 1 ? 0.5 : row / (rows - 1);
      const base = order(x, y);
      const random = noise(index + 1);
      pixels.push({
        left: originX + column * stride,
        top: originY + row * stride,
        offset: base === null ? random : base * (1 - mix) + random * mix,
      });
    }
  }
  return { pixels, size, gap, width, height };
}
// 整张网格共用同一对关键帧：窗口变换与其精确逆运算，画面不会漂移
function buildKeyframes({ ease, startScale, endScale, spin, fade }) {
  const windowFrames = [];
  const contentFrames = [];
  for (let step = 0; step <= KEYFRAME_STEPS; step += 1) {
    const progress = step / KEYFRAME_STEPS;
    const eased = ease(progress);
    const scale = startScale + (endScale - startScale) * eased;
    const angle = spin * (1 - eased);
    windowFrames.push({
      offset: progress,
      opacity: fade ? Math.min(1, eased * 1.6) : 1,
      transform: `rotate(${angle}deg) scale(${scale})`,
    });
    contentFrames.push({
      offset: progress,
      transform: `scale(${1 / scale}) rotate(${-angle}deg)`,
    });
  }
  return { windowFrames, contentFrames };
}
const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * 在 box 上跑一次像素溶解，把 source（默认隐藏的那层）显影出来。
 * 返回 true 表示动画已启动；false 表示尺寸缺失或用户要求减少动效，
 * 调用方应直接切换到显影态。
 */
export function revealPixelSwap(box, source, onDone, options) {
  const cfg = Object.assign({}, SPLASH_DEFAULTS, options || {})
  const width = box.clientWidth
  const height = box.clientHeight

  if (!width || !height || reducedMotion()) return false

  const grid = buildGrid({
    width,
    height,
    pixelSize: Math.max(8, Math.round(cfg.pixelSize)),
    gap: Math.max(0, Math.round(cfg.gap)),
    pattern: cfg.pattern,
    randomness: cfg.randomness,
  })
  const total = Math.max(200, cfg.duration)
  const pixelMs = clampNum(cfg.pixelDuration, 60, total)
  const spread = Math.max(0, total - pixelMs)
  const endScale = coverScale(grid.size, grid.gap, cfg.pixelRadius)
  const frames = buildKeyframes({
    ease: makeEasing(cfg.easing),
    startScale: clampNum(cfg.pixelScale, 0.05, 1) * endScale,
    endScale,
    spin: cfg.pixelSpin,
    fade: cfg.fade,
  })
  const timing = { duration: pixelMs, easing: 'linear', fill: 'both' }
  const gridEl = document.createElement('div')
  gridEl.className = 'pixel-swap__grid'
  gridEl.setAttribute('aria-hidden', 'true')
  const animations = []
  let cancelled = false

  grid.pixels.forEach(pixel => {
    const cell = document.createElement('div')
    cell.className = 'pixel-swap__pixel'
    cell.style.left = `${pixel.left}px`
    cell.style.top = `${pixel.top}px`
    cell.style.width = `${grid.size}px`
    cell.style.height = `${grid.size}px`
    cell.style.borderRadius = `${clampNum(cfg.pixelRadius, 0, 50)}%`

    const content = document.createElement('div')
    content.className = 'pixel-swap__pixel-content'
    content.style.left = `${-pixel.left}px`
    content.style.top = `${-pixel.top}px`
    content.style.width = `${width}px`
    content.style.height = `${height}px`
    content.style.transformOrigin = `${pixel.left + grid.size / 2}px ${pixel.top + grid.size / 2}px`

    const clone = source.cloneNode(true)
    clone.dataset.visible = 'true'
    clone.removeAttribute('aria-hidden')
    content.appendChild(clone)
    cell.appendChild(content)
    gridEl.appendChild(cell)

    const delay = pixel.offset * spread
    animations.push(
      cell.animate(frames.windowFrames, { ...timing, delay }),
      content.animate(frames.contentFrames, { ...timing, delay })
    )
  })

  box.appendChild(gridEl)

  const done = window.setTimeout(() => {
    if (cancelled) return
    animations.forEach(a => a.cancel())
    gridEl.remove()
    onDone()
  }, total)

  return () => {
    cancelled = true
    window.clearTimeout(done)
    animations.forEach(a => a.cancel())
    gridEl.remove()
  }
}
