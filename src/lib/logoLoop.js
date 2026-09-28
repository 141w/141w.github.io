/* LogoLoop —— React Bits 同名组件的无限跑马灯实现。
   随样品验证过的版本原样迁入，只把 IIFE 改成 ES 模块。 */
const global = window;

  const SVG_NS = "http://www.w3.org/2000/svg";

  const SMOOTH_TAU = 0.25;
  const MIN_COPIES = 2;
  const COPY_HEADROOM = 2;

  const DEFAULTS = {
    items: [],
    speed: 120,
    direction: "left",
    logoHeight: 28,
    gap: 32,
    hoverSpeed: 0,
    fadeOut: true,
    fadeOutColor: "",
    scaleOnHover: false,
    ariaLabel: "技术栈",
  };

  function createLogoLoop(container, options) {
    const s = Object.assign({}, DEFAULTS, options || {});
    if (!container) return { setOptions() {}, destroy() {} };

    const isVertical = s.direction === "up" || s.direction === "down";
    const multiplier = isVertical ? (s.direction === "up" ? 1 : -1) : s.direction === "left" ? 1 : -1;
    const targetVelocity = Math.abs(s.speed) * multiplier * (s.speed < 0 ? -1 : 1);
    const reduced = !!global.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    container.classList.add("logoloop", isVertical ? "logoloop--vertical" : "logoloop--horizontal");
    if (s.fadeOut) container.classList.add("logoloop--fade");
    if (s.scaleOnHover) container.classList.add("logoloop--scale-hover");
    if (s.fadeOutColor) container.style.setProperty("--logoloop-fadeColor", s.fadeOutColor);
    container.style.setProperty("--logoloop-gap", `${s.gap}px`);
    container.style.setProperty("--logoloop-logoHeight", `${s.logoHeight}px`);
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", s.ariaLabel);

    const track = document.createElement("div");
    track.className = "logoloop__track";
    container.appendChild(track);

    let seqWidth = 0;
    let seqHeight = 0;
    let copyCount = 0;
    let offset = 0;
    let velocity = 0;
    let raf = 0;
    let last = 0;
    let alive = true;
    let hovered = false;

    function buildLists() {
      track.textContent = "";
      for (let copy = 0; copy < copyCount; copy += 1) {
        const list = document.createElement("ul");
        list.className = "logoloop__list";
        list.setAttribute("role", "list");
        if (copy > 0) list.setAttribute("aria-hidden", "true");
        s.items.forEach((item) => {
          const label = typeof item === "string" ? item : item.label;
          const paths = typeof item === "string" ? null : item.paths;
          const li = document.createElement("li");
          li.className = "logoloop__item";
          const chip = document.createElement("span");
          chip.className = "logoloop__chip" + (paths ? " logoloop__chip--icon" : "");
          chip.setAttribute("title", label);
          if (paths) {
            const svg = document.createElementNS(SVG_NS, "svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("aria-hidden", "true");
            svg.setAttribute("focusable", "false");
            paths.forEach((d) => {
              const p = document.createElementNS(SVG_NS, "path");
              p.setAttribute("d", d);
              svg.appendChild(p);
            });
            chip.appendChild(svg);
            const sr = document.createElement("span");
            sr.className = "sr-only";
            sr.textContent = label;
            chip.appendChild(sr);
          } else {
            chip.textContent = label;
          }
          li.appendChild(chip);
          list.appendChild(li);
        });
        track.appendChild(list);
      }
    }

    function updateDimensions() {
      const first = track.firstElementChild;
      if (!first) return;
      const rect = first.getBoundingClientRect();
      if (isVertical) {
        const h = Math.ceil(rect.height);
        if (!h) return;
        seqHeight = h;
        const viewport = container.clientHeight || h;
        build(Math.max(MIN_COPIES, Math.ceil(viewport / h) + COPY_HEADROOM));
      } else {
        const w = Math.ceil(rect.width);
        if (!w) return;
        seqWidth = w;
        build(Math.max(MIN_COPIES, Math.ceil(container.clientWidth / w) + COPY_HEADROOM));
      }
    }

    function build(next) {
      if (next === copyCount) return;
      copyCount = next;
      buildLists();
    }

    const seqSize = () => (isVertical ? seqHeight : seqWidth);

    const frame = (now) => {
      raf = 0;
      if (!alive) return;
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)) || 0;
      last = now;
      const size = seqSize();
      const target = hovered && s.hoverSpeed !== undefined ? Math.abs(s.hoverSpeed) * multiplier : targetVelocity;
      velocity += (target - velocity) * (1 - Math.exp(-dt / SMOOTH_TAU));
      if (size > 0 && velocity !== 0) {
        offset = (((offset + velocity * dt) % size) + size) % size;
        track.style.transform = isVertical
          ? `translate3d(0, ${-offset}px, 0)`
          : `translate3d(${-offset}px, 0, 0)`;
      }
      // 静止且没有目标速度时收掉这一帧循环，等悬停再唤醒，避免空转 rAF
      if (target === 0 && Math.abs(velocity) < 0.01) {
        velocity = 0;
        return;
      }
      wake();
    };

    function wake() {
      if (raf || !alive || reduced || !seqSize()) return;
      last = global.performance.now();
      raf = global.requestAnimationFrame(frame);
    }

    const onEnter = () => {
      hovered = true;
      wake();
    };
    const onLeave = () => {
      hovered = false;
      wake();
    };
    track.addEventListener("mouseenter", onEnter);
    track.addEventListener("mouseleave", onLeave);

    const ro = new ResizeObserver(() => updateDimensions());
    ro.observe(container);
    if (track.firstElementChild) ro.observe(track.firstElementChild);

    copyCount = MIN_COPIES;
    buildLists();
    updateDimensions();
    if (!reduced) wake();

    return {
      setOptions(next) {
        Object.assign(s, next || {});
        copyCount = 0;
        updateDimensions();
        if (copyCount === 0) {
          copyCount = MIN_COPIES;
          buildLists();
        }
        wake();
      },
      destroy() {
        alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        track.removeEventListener("mouseenter", onEnter);
        track.removeEventListener("mouseleave", onLeave);
        /* 只回收自己造的节点：容器属于调用方（React 管理的 DOM），不能替它删掉 */
        if (track.parentNode === container) container.removeChild(track);
        container.classList.remove(
          "logoloop",
          "logoloop--vertical",
          "logoloop--horizontal",
          "logoloop--fade",
          "logoloop--scale-hover"
        );
        container.style.removeProperty("--logoloop-gap");
        container.style.removeProperty("--logoloop-logoHeight");
        container.style.removeProperty("--logoloop-fadeColor");
      },
    };
  }

export { createLogoLoop }
