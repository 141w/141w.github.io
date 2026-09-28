/* BorderGlow —— React Bits 同名组件的事件委托版实现。
   随样品验证过的版本原样迁入，只把 IIFE 改成 ES 模块。 */
const global = window;

  /* 需要发光效果的框 —— 与 style.css 里 .glow-card 的作用范围保持一致。 */
  const SELECTORS = [
    ".ss-card",
    ".featured",
    ".skill",
    ".detail-body",
    ".contact-box",
    ".boot-card",
  ].join(", ");

  const centerOf = (el) => {
    const rect = el.getBoundingClientRect();
    return [rect.width / 2, rect.height / 2];
  };

  // 指针越靠边越接近 1，正中心为 0
  const edgeProximity = (el, x, y) => {
    const [cx, cy] = centerOf(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  };

  const cursorAngle = (el, x, y) => {
    const [cx, cy] = centerOf(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    let degrees = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  };

  /* 叠卡全页最多只留一张带光：其余卡也带着三层 mix-blend 图层，
     跟着卡片一起被 scale 合成时滚动成本极高。指针落在哪张就只给哪张挂，
     换卡/离开叠卡区时把上一张的光层摘掉。 */
  let activeStackCard = null;

  function strip(el) {
    if (!el.classList.contains("glow-card")) return;
    el.classList.remove("glow-card");
    const light = el.querySelector(":scope > .edge-light");
    if (light) el.removeChild(light);
    el.style.removeProperty("--edge-proximity");
    el.style.removeProperty("--cursor-angle");
    if (el === activeStackCard) activeStackCard = null;
  }

  function focusStackCard(el) {
    if (activeStackCard && activeStackCard !== el) strip(activeStackCard);
    activeStackCard = el;
  }

  function enhance(el) {
    if (el.classList.contains("glow-card")) return el;
    el.classList.add("glow-card");
    const light = document.createElement("span");
    light.className = "edge-light";
    light.setAttribute("aria-hidden", "true");
    el.appendChild(light);
    return el;
  }

  function initBorderGlow() {
    if (global.__borderGlowBound) return;

    document.addEventListener(
      "pointermove",
      (e) => {
        const el = e.target.closest && e.target.closest(SELECTORS);
        const onStack = !!el && el.classList.contains("ss-card");
        /* 指针离开叠卡区就把上一张的光摘掉，全页只留一张带混合图层 */
        if (!onStack && activeStackCard) strip(activeStackCard);
        if (!el) return;
        if (onStack) focusStackCard(el);
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const card = enhance(el);
        card.style.setProperty("--edge-proximity", (edgeProximity(card, x, y) * 100).toFixed(3));
        card.style.setProperty("--cursor-angle", `${cursorAngle(card, x, y).toFixed(3)}deg`);
      },
      { passive: true }
    );
  }

export { initBorderGlow, strip as borderGlowStrip }
