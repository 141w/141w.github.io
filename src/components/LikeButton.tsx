import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { prefersReducedMotion } from '../lib/site'

const LIKE_KEY = 'ww-site-likes'
const HEART_PATH =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'

const LIKE_RUN = 560
const LIKE_SWAP_AT = 0.4
const LIKE_DOT = 0.3
const LIKE_OVERSHOOT = 1.7
const LIKE_BEAT = 3

function likedSet(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(LIKE_KEY) ?? '[]')
    return new Set(Array.isArray(raw) ? raw : [])
  } catch {
    return new Set()
  }
}

function rememberLiked(id: string, on: boolean) {
  const set = likedSet()
  if (on) set.add(id)
  else set.delete(id)
  try {
    localStorage.setItem(LIKE_KEY, JSON.stringify([...set]))
  } catch {
    /* 隐私模式下写不进去，忽略 */
  }
}

const easeBack = (k: number, c: number) => {
  const u = k - 1
  return 1 + (c + 1) * u ** 3 + c * u ** 2
}

const swellOf = (t: number, c: number) =>
  t <= 0
    ? 0
    : t < LIKE_SWAP_AT
      ? 1 - (1 - t / LIKE_SWAP_AT) ** 3
      : 1 - easeBack((t - LIKE_SWAP_AT) / (1 - LIKE_SWAP_AT), c)

interface LikeButtonProps {
  id: string
  name: string
  size?: number
}

/**
 * PulseHeart 点赞：心形缩放 + 药丸心跳。
 * 站点没有计数后端，所以只表达访客本地的「我喜欢过」，不显示任何总数。
 */
export default function LikeButton({ id, name, size = 20 }: LikeButtonProps) {
  const [liked, setLiked] = useState(() => likedSet().has(id))
  const btnRef = useRef<HTMLButtonElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const heartRef = useRef<HTMLSpanElement>(null)
  const glyphRef = useRef<SVGGElement>(null)
  const rafRef = useRef(0)

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    },
    []
  )

  const animate = useCallback(() => {
    const btn = btnRef.current
    const pill = pillRef.current
    const heart = heartRef.current
    const glyph = glyphRef.current
    if (!btn || !pill || !heart) return

    btn.dataset.running = ''
    const t0 = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / LIKE_RUN)
      const swell = swellOf(t, LIKE_OVERSHOOT)
      const k = 1 - (1 - LIKE_DOT) * swell

      if (glyph) glyph.setAttribute('transform', `translate(12 12) scale(${k}) translate(-12 -12)`)
      else heart.style.transform = `scale(${k})`
      pill.style.transform = `scale(${1 - (LIKE_BEAT / 100) * swell})`

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      rafRef.current = 0
      glyph?.removeAttribute('transform')
      heart.style.transform = ''
      pill.style.transform = ''
      delete btn.dataset.running
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const onClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (rafRef.current) return
    const next = !liked
    setLiked(next)
    rememberLiked(id, next)

    /* e.detail 为 0 是键盘触发，或用户要求减少动效：只切状态，不放动画 */
    if (e.detail !== 0 && !prefersReducedMotion()) animate()
  }

  const release = () => {
    const btn = btnRef.current
    if (btn) delete btn.dataset.pressed
  }

  return (
    <button
      type="button"
      ref={btnRef}
      className="pulse-heart"
      data-liked={liked}
      aria-pressed={liked}
      aria-label={`${liked ? '取消喜欢' : '喜欢'} ${name}`}
      style={
        {
          '--ph-size': `${size}px`,
          '--ph-corner': `${Math.round(size * 1.2)}px`,
          '--ph-stroke': `${((1.5 * size) / 24).toFixed(2)}px`,
        } as CSSProperties
      }
      onPointerDown={ev => {
        if (ev.button !== 0 || prefersReducedMotion()) return
        ev.currentTarget.dataset.pressed = ''
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onClick={onClick}
    >
      <span className="pulse-heart__pill" ref={pillRef}>
        <span className="pulse-heart__heart" aria-hidden="true" ref={heartRef}>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g ref={glyphRef}>
              <path d={HEART_PATH} vectorEffect="non-scaling-stroke" />
            </g>
          </svg>
        </span>
        <span className="pulse-heart__sr">{liked ? '我喜欢过' : '未标记'}</span>
      </span>
    </button>
  )
}
