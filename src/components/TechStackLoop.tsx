import { useEffect, useRef } from 'react'
import { createLogoLoop } from '../lib/logoLoop'
import { techIconFor } from '../lib/techIcons'

interface TechStackLoopProps {
  items: string[]
  /** 同一页面出现多条时用来区分读屏区域名 */
  label?: string
}

/**
 * 技术栈跑马灯：按容器宽度自动补足副本数，rAF 以指数平滑逼近目标速度。
 * 持续滚动（speed 45），悬停停住（hoverSpeed 0）。
 * 有品牌图标的条目走 Simple Icons 的 path，没有的退化成文字芯片。
 */
export default function TechStackLoop({ items, label }: TechStackLoopProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !items.length) return

    const mapped = items.map(name => {
      const icon = techIconFor(name)
      return icon ? { label: name, paths: icon.paths } : name
    })

    const inst = createLogoLoop(host, {
      items: mapped,
      speed: 45,
      hoverSpeed: 0,
      direction: 'left',
      logoHeight: 28,
      gap: 12,
      fadeOut: true,
      scaleOnHover: true,
      ariaLabel: label ?? '技术栈',
    })

    return () => inst.destroy()
  }, [items, label])

  return <div className="logo-loop-host" ref={hostRef} />
}
