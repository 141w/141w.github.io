import { useEffect, useRef } from 'react'
import { createFerrofluid } from '../lib/ferrofluid'
import { cssVar, prefersReducedMotion } from '../lib/site'

/**
 * 全站磁流体背景：原生 WebGL 跑全屏三角形，取代原本站点的 Three.js Dither。
 * WebGl 不可用或用户偏好减少动效时不初始化，退回 .site-bg 的静态光晕。
 */
export default function SiteBackground() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || prefersReducedMotion()) return

    const colors = ['--fluid-1', '--fluid-2', '--fluid-3']
      .map(cssVar)
      .filter(Boolean)

    const inst = createFerrofluid(host, {
      colors,
      speed: 0.5,
      scale: 1.6,
      turbulence: 1,
      fluidity: 0.1,
      rimWidth: 0.2,
      sharpness: 3,
      shimmer: 1,
      glow: 2,
      flowDirection: 'down',
      opacity: 0.55,
      mouseInteraction: true,
      mouseStrength: 1,
      mouseRadius: 0.3,
      mouseDampening: 0.15,
      dpr: 1.5,
    })

    return () => inst.destroy()
  }, [])

  return <div className="site-bg" ref={hostRef} aria-hidden="true" />
}
