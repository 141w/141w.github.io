/** 全站共用的动效偏好判断：动画默认关掉，只留交互那一下 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? 'auto' : 'smooth'
}

/** 整数按千分位格式化，用于点赞数与访问人次 */
export function formatCount(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

/** 读取 :root 上的 CSS 变量当前值 */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
