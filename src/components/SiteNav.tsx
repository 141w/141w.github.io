import { useCallback, useEffect, useRef } from 'react'
import { navKeyOf, useRoute } from '../router/hashRoute'
import { prefersReducedMotion } from '../lib/site'

const items = [
  { label: '首页', path: '/' },
  { label: '项目', path: '/projects' },
  { label: '关于', path: '/about' },
  { label: '联系', path: '/contact' },
]

/** GooeyNav 参数：沿用 reactbits 原组件默认值 */
const GN = {
  animationTime: 600,
  particleCount: 15,
  particleDistances: [90, 10] as [number, number],
  particleR: 100,
  timeVariance: 300,
  colors: [1, 2, 3, 1, 2, 3, 1, 4],
}

const noise = (n = 1) => n / 2 - Math.random() * n

const getXY = (distance: number, i: number, total: number): [number, number] => {
  const angle = ((360 + noise(8)) / total) * i * (Math.PI / 180)
  return [distance * Math.cos(angle), distance * Math.sin(angle)]
}

/**
 * 黏液导航：.effect.filter 上的 blur -> contrast 把药丸与飞出的气泡粒子“融”在一起，
 * 距离足够近时二值化后连成一挂，看起来像拉丝的胶水。
 * 气泡只在用户点击时炸开；程序化换路由只做静默位移。
 */
export default function SiteNav() {
  const route = useRoute()
  const containerRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const lisRef = useRef<Array<HTMLLIElement | null>>([])
  const appliedRef = useRef(-1)
  const timersRef = useRef<number[]>([])

  const activePath = navKeyOf(route.pathname)
  const activeIndex = items.findIndex(item => item.path === activePath)

  const makeParticles = useCallback((element: HTMLSpanElement) => {
    const d = GN.particleDistances
    const r = GN.particleR
    element.style.setProperty('--time', `${GN.animationTime * 2 + GN.timeVariance}ms`)

    for (let i = 0; i < GN.particleCount; i++) {
      const t = GN.animationTime * 2 + noise(GN.timeVariance * 2)
      const rotate = noise(r / 10)
      const p = {
        start: getXY(d[0], GN.particleCount - i, GN.particleCount),
        end: getXY(d[1] + noise(7), GN.particleCount - i, GN.particleCount),
        scale: 1 + noise(0.2),
        color: GN.colors[Math.floor(Math.random() * GN.colors.length)],
        rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
      }
      element.classList.remove('active')

      const spawn = window.setTimeout(() => {
        const particle = document.createElement('span')
        const point = document.createElement('span')
        particle.className = 'particle'
        particle.style.setProperty('--start-x', `${p.start[0]}px`)
        particle.style.setProperty('--start-y', `${p.start[1]}px`)
        particle.style.setProperty('--end-x', `${p.end[0]}px`)
        particle.style.setProperty('--end-y', `${p.end[1]}px`)
        particle.style.setProperty('--time', `${t}ms`)
        particle.style.setProperty('--scale', `${p.scale}`)
        particle.style.setProperty('--color', `var(--color-${p.color}, #fff)`)
        particle.style.setProperty('--rotate', `${p.rotate}deg`)
        point.className = 'point'
        particle.appendChild(point)
        element.appendChild(particle)
        /* 原组件靠 requestAnimationFrame 补 active；后台标签页 rAF 挂起时药丸永远不动。
           move() 里已强制过重排，这里同步加回更稳。 */
        element.classList.add('active')

        const reap = window.setTimeout(() => {
          try {
            element.removeChild(particle)
          } catch {
            /* 粒子已经不在了 */
          }
        }, t)
        timersRef.current.push(reap)
      }, 30)
      timersRef.current.push(spawn)
    }
  }, [])

  const move = useCallback(
    (index: number, burst: boolean) => {
      const container = containerRef.current
      const filter = filterRef.current
      const text = textRef.current
      const li = lisRef.current[index]
      const anchor = li?.querySelector('a')
      if (!container || !filter || !text || !li || !anchor) return

      appliedRef.current = index
      lisRef.current.forEach((el, i) => el?.classList.toggle('active', i === index))

      const box = container.getBoundingClientRect()
      const pos = anchor.getBoundingClientRect()
      const styles = {
        left: `${pos.x - box.x}px`,
        top: `${pos.y - box.y}px`,
        width: `${pos.width}px`,
        height: `${pos.height}px`,
      }
      Object.assign(filter.style, styles)
      Object.assign(text.style, styles)
      text.innerText = anchor.innerText

      filter.querySelectorAll('.particle').forEach(p => filter.removeChild(p))
      text.classList.remove('active')
      filter.classList.remove('active')
      void filter.offsetWidth
      text.classList.add('active')

      if (burst && !prefersReducedMotion()) makeParticles(filter)
      else filter.classList.add('active')
    },
    [makeParticles]
  )

  // 路由变化 -> 同步药丸位置，不放大气泡
  useEffect(() => {
    if (activeIndex >= 0 && activeIndex !== appliedRef.current) move(activeIndex, false)
  }, [activeIndex, move])

  // 容器尺寸变化（换行、窗口缩放）后重新对位
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(() => {
      if (appliedRef.current >= 0) move(appliedRef.current, false)
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [move])

  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach(id => window.clearTimeout(id))
  }, [])

  return (
    <>
      <a className="nav-logo" href="#/" aria-label="返回首页">
        <img src="/logo.svg" alt="WW" />
      </a>

      <div className="gooey-nav-container" ref={containerRef}>
        <nav aria-label="主导航">
          <ul>
            {items.map((item, i) => (
              <li
                key={item.path}
                ref={el => {
                  lisRef.current[i] = el
                }}
              >
                <a
                  href={`#${item.path}`}
                  onClick={() => {
                    if (i !== appliedRef.current) move(i, true)
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <span className="effect filter" ref={filterRef} aria-hidden="true" />
        <span className="effect text" ref={textRef} aria-hidden="true" />
      </div>
    </>
  )
}
