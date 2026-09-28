/* Counter 滚轮数字 —— React Bits 同名组件的原生实现，不引 motion：
   自写弹簧驱动的里程表数字，每格 10 个数字上下位移。
   注意：数字节点读屏会念成 "0123456789…"，所以计数器整体 aria-hidden，
   真实值另由 .sr-only 播报。 */
/* 位数按真实值算，避免固定 5/6 格在前面留一串 0 */
const placesFor = value => {
  const digits = Math.max(1, String(Math.floor(value)).length);
  return Array.from({ length: digits }, (_, i) => 10 ** (digits - 1 - i));
};

function springTo(from, to, onUpdate, done) {
  let x = from;
  let v = 0;
  let last = performance.now();
  const alive = { ref: true };
  const stiffness = 100;
  const damping = 10;
  const step = (now) => {
    if (!alive.ref) return;
    const dt = Math.min((now - last) / 1000, 0.064);
    last = now;
    v += ((-stiffness * (x - to) - damping * v) / 1) * dt;
    x += v * dt;
    onUpdate(x);
    if (Math.abs(x - to) < 0.0005 && Math.abs(v) < 0.0005) {
      onUpdate(to);
      if (done) done();
      return;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return () => {
    alive.ref = false;
  };
}

function createCounter(el, opts) {
  const fontSize = opts.fontSize || 24;
  const height = fontSize + (opts.padding || 0);
  const places = opts.places || placesFor(opts.value);
  const reduced = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  let current = opts.value;

  el.classList.add("counter-container");
  el.innerHTML = "";

  const counter = document.createElement("span");
  counter.className = "counter-counter";
  counter.style.fontSize = `${fontSize}px`;
  counter.style.gap = `${opts.gap || 4}px`;
  const digits = places.map((place) => {
    const cell = document.createElement("span");
    cell.className = "counter-digit";
    cell.style.height = `${height}px`;
    const nums = [];
    for (let n = 0; n < 10; n += 1) {
      const num = document.createElement("span");
      num.className = "counter-number";
      num.textContent = String(n);
      cell.appendChild(num);
      nums.push(num);
    }
    counter.appendChild(cell);
    return { place, nums };
  });
  el.appendChild(counter);

  /* 上下渐隐遮罩：让窗口外泄的半个数字柔和消失 */
  const grads = document.createElement("span");
  grads.className = "gradient-container";
  grads.setAttribute("aria-hidden", "true");
  grads.innerHTML = '<span class="top-gradient"></span><span class="bottom-gradient"></span>';
  el.appendChild(grads);

  /* 与原实现一致：每格放 0-9 十个绝对定位数字，靠各自的 y 把该露出的那个推进窗口 */
  function render(mv) {
    digits.forEach(({ place, nums }) => {
      const scaled = Math.floor(Math.abs(mv) / place);
      const placeValue = ((scaled % 10) + 10) % 10;
      nums.forEach((num, n) => {
        let offset = (10 + n - placeValue) % 10;
        let y = offset * height;
        if (offset > 5) y -= 10 * height;
        num.style.transform = `translateY(${y}px)`;
      });
    });
  }

  /* 每格 0-9 十个数字都在 DOM 里（靠位移选窗口），读屏会念成一长串数字：
     所以画布部分整体对辅助技术隐藏，另给一份真实数值。 */
  counter.setAttribute("aria-hidden", "true");
  const sr = document.createElement("span");
  sr.className = "sr-only";
  el.appendChild(sr);

  function say(value) {
    sr.textContent = new Intl.NumberFormat().format(Math.round(value));
  }
  say(opts.value);

  function jump(value) {
    current = value;
    render(value);
    say(value);
  }

  function set(value, animate) {
    const from = current;
    current = value;
    if (!animate || reduced) {
      render(value);
      say(value);
      return;
    }
    springTo(from, value, (v) => {
      render(v);
      if (Math.abs(v - value) < 0.5) say(value);
    });
  }

  render(opts.value);
  return { set, jump };
}

/**
 * 真实访问数来自服务器定时生成的 stats.json（见 scripts/visit-stats.py）。
 * 读不到就返回 null，调用方整块不显示——不编数字。
 */
export async function loadVisitStats(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const n = Number(data.visits);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(n);
  } catch {
    return null;
  }
}

export function initVisitCounter(el, value) {
  if (!el || !Number.isFinite(value) || el.dataset.ready) return null;
  el.dataset.ready = "1";
  const counter = createCounter(el, { value, fontSize: 22, gap: 3 });

  let seen = null;
  try {
    seen = sessionStorage.getItem("ww-visit-rolled");
  } catch {
    seen = null;
  }
  if (seen) return counter;

  /* 首次进入从 0 滚到位；同一会话内不再重复（静态优先） */
  counter.jump(0);
  requestAnimationFrame(() => counter.set(value, true));
  try {
    sessionStorage.setItem("ww-visit-rolled", "1");
  } catch {
    /* 无痕模式下写不进去，忽略 */
  }
  return counter;
}

export { createCounter }
