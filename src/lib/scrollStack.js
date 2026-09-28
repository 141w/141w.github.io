/* ScrollStack 滚动堆叠卡 —— React Bits 同名组件的原生实现，不引 lenis。
   原组件用 lenis 把滚轮插值成平滑滚动，再从 scrollTop 反推每张卡的 translate/scale；
   这里直接读 window.scrollY + rAF 节流，几何公式逐条照搬。 */
import { bindSpecularStack, specKick } from './specular'
import { borderGlowStrip } from './borderGlow'

const SS = {
  itemScale: 0.03,
  itemStackDistance: 30,
  stackPosition: 0.2, // 原稿 '20%'
  scaleEndPosition: 0.1, // 原稿 '10%'
  baseScale: 0.85,
  rotationAmount: 0,
  blurAmount: 0,
};
const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

let ss = null;

const ssTop = (el) => el.getBoundingClientRect().top + window.scrollY;

/* 卡片一旦 transform，rect.top 就含了位移；原组件在 window 模式下拿
   rect.top + scrollY 当布局位置，被自己写的 translateY 反馈回去会抖。
   这里在没有任何 transform 时量一次真实布局位置存下来。 */
function ssMeasure() {
  if (!ss) return;
  ss.cards.forEach((c) => {
    c.style.transform = "";
  });
  ss.tops = ss.cards.map(ssTop);
  ss.endTop = ssTop(ss.end);
  ss.cache.clear();
}

function ssUpdate() {
  if (!ss) return;
  const scrollTop = window.scrollY;
  const vh = window.innerHeight;
  const stackPx = SS.stackPosition * vh;
  const scaleEndPx = SS.scaleEndPosition * vh;
  const pinEnd = ss.endTop - vh / 2;

  ss.cards.forEach((card, i) => {
    const cardTop = ss.tops[i];
    const triggerStart = cardTop - stackPx - SS.itemStackDistance * i;
    const triggerEnd = cardTop - scaleEndPx;
    const span = triggerEnd - triggerStart;
    /* 原稿直接 (scrollTop-start)/(end-start)；窗口很矮时 span<=0 会得到负进度、
       卡片反而被放大，这里补一层保护 */
    let prog;
    if (span <= 0) prog = scrollTop >= triggerEnd ? 1 : 0;
    else prog = Math.min(1, Math.max(0, (scrollTop - triggerStart) / span));

    const targetScale = SS.baseScale + i * SS.itemScale;
    const scale = 1 - prog * (1 - targetScale);
    const rotation = SS.rotationAmount ? i * SS.rotationAmount * prog : 0;

    let blur = 0;
    if (SS.blurAmount) {
      let topIdx = 0;
      ss.tops.forEach((t, j) => {
        if (scrollTop >= t - stackPx - SS.itemStackDistance * j) topIdx = j;
      });
      if (i < topIdx) blur = Math.max(0, (topIdx - i) * SS.blurAmount);
    }

    let translateY = 0;
    const pinned = scrollTop >= triggerStart && scrollTop <= pinEnd;
    if (pinned) {
      translateY = scrollTop - cardTop + stackPx + SS.itemStackDistance * i;
    } else if (scrollTop > pinEnd) {
      translateY = pinEnd - cardTop + stackPx + SS.itemStackDistance * i;
    }

    const next = {
      translateY: Math.round(translateY * 100) / 100,
      scale: Math.round(scale * 1000) / 1000,
      rotation: Math.round(rotation * 100) / 100,
      blur: Math.round(blur * 100) / 100,
    };
    const last = ss.cache.get(i);
    const changed =
      !last ||
      Math.abs(last.translateY - next.translateY) > 0.1 ||
      Math.abs(last.scale - next.scale) > 0.001 ||
      Math.abs(last.rotation - next.rotation) > 0.1 ||
      Math.abs(last.blur - next.blur) > 0.1;

    if (changed) {
      card.style.transform =
        `translate3d(0, ${next.translateY}px, 0) scale(${next.scale}) rotate(${next.rotation}deg)`;
      card.style.filter = next.blur > 0 ? `blur(${next.blur}px)` : "";
      ss.cache.set(i, next);
    }
  });

}

function ssFrame() {
  if (!ss) return;
  ss.raf = 0;
  ssUpdate();
  specKick(); /* 卡片动了，高光层下一帧跟着重画 */
}

function ssSchedule() {
  if (!ss || ss.raf) return;
  ss.raf = requestAnimationFrame(ssFrame);
}

function ssResize() {
  if (!ss) return;
  ssMeasure();
  ssSchedule();
}

function mountScrollStack() {
  const root = document.querySelector("[data-ss-stack]");
  if (!root) return;
  const cards = [...root.querySelectorAll("[data-ss-card]")];
  const end = root.querySelector(".ss-end");
  if (!cards.length || !end) return;

  if (reducedMotion()) {
    root.classList.add("is-ss-static");
    return;
  }

  ss = { root, cards, end, tops: [], endTop: 0, cache: new Map(), raf: 0 };
  bindSpecularStack({
    occlusionTest: true,
    syncLayout() {
      if (!ss || !ss.raf) return;
      cancelAnimationFrame(ss.raf);
      ss.raf = 0;
      ssUpdate();
    },
  });
  ssMeasure();
  window.addEventListener("scroll", ssSchedule, { passive: true });
  window.addEventListener("resize", ssResize);
  ssUpdate();
}

function refreshScrollStack() {
  if (ss) ssSchedule();
}

function destroyScrollStack() {
  if (!ss) return;
  ss.cards.forEach(c => borderGlowStrip(c));
  if (ss.raf) cancelAnimationFrame(ss.raf);
  window.removeEventListener("scroll", ssSchedule);
  window.removeEventListener("resize", ssResize);
  bindSpecularStack(null);
  ss = null;
}


export { mountScrollStack, destroyScrollStack, refreshScrollStack }
