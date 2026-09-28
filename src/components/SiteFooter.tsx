import { useEffect, useRef } from 'react'
import { profile } from '../data/profile'
import { initVisitCounter } from '../lib/visitCounter'

/** 页脚：品牌行 + 访问人次滚轮 + 联系入口 + 构建说明 */
export default function SiteFooter() {
  const counterRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    initVisitCounter(counterRef.current)
  }, [])

  return (
    <footer className="footer">
      <span>WW · Portfolio</span>
      <span className="visit-stat">
        访问 <span className="visit-counter" ref={counterRef} /> 人次
      </span>
      <span className="muted">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        {' · '}
        <a href={profile.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </span>
      <span className="muted build-note">React 19 · Vite · 原生 WebGL 特效 · 严格单色</span>
    </footer>
  )
}
