import { useEffect, useRef, useState } from 'react'
import { profile } from '../data/profile'
import { initVisitCounter, loadVisitStats } from '../lib/visitCounter'

/**
 * 访问人次的真实来源：服务器定时任务生成的 stats.json（见 scripts/visit-stats.py）。
 * Pages 那条腿没有这个文件，所以没显式配 VITE_STATS_URL 且域名是 *.github.io 时
 * 干脆不请求，免得每次加载在 console 留一条 404。读不到就整块不显示，不编数字。
 */
const configuredStatsUrl = import.meta.env?.VITE_STATS_URL as string | undefined
const STATS_URL =
  configuredStatsUrl ?? (window.location.hostname.endsWith('.github.io') ? '' : '/stats.json')

/** 页脚：品牌行 + 访问人次滚轮 + 联系入口 + 构建说明 */
export default function SiteFooter() {
  const counterRef = useRef<HTMLSpanElement>(null)
  const [visits, setVisits] = useState<number | null>(null)

  useEffect(() => {
    if (!STATS_URL) return
    let alive = true
    loadVisitStats(STATS_URL).then(n => {
      if (alive) setVisits(n)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (visits === null) return
    initVisitCounter(counterRef.current, visits)
  }, [visits])

  return (
    <footer className="footer">
      <span>WW · Portfolio</span>

      {visits !== null && (
        <span className="visit-stat">
          访问 <span className="visit-counter" ref={counterRef} /> 人次
        </span>
      )}

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
