import { useCallback, useEffect, useRef } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { formatCount, prefersReducedMotion } from '../lib/site'

const LIKE_KEY = 'ww-site-likes'
const HEART_PATH =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'

const LIKE_RUN = 560
const LIKE_ROLL = 350
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
  t <= 0 ? 0 : t < LIKE_SWAP_AT ? 1 - (1 - t / LIKE_SWAP_AT) ** 3 : 1 - easeBack((t - LIKE_SWAP_AT) / (1 - LIKE_SWAP_AT), c)

interface LikeButtonProps {
  id: string
  name: string
  /**
   * 占位数字：站点没有计数后端，点赞状态只存在访客本地 localStorage。
   * 公开前要么接真实计数，要么把这个数字收掉。
   */
  likes: number
  size?: number
}

/**
 * PulseHeart 点赞：心形缩放 + 药丸心跳 + 数字滚轮。
 * 动效全程走 rAF + 内联样式，动画结束后再落回最终值，不留常驻动画。
 */
export default function LikeButton({ id, name, likes, size = 20 }: LikeButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const heartRef = useRef<HTMLSpanElement>(null)
  const glyphRef = useRef<SVGGElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  const srRef = useRef<HTMLSpanElement>(null)

  const state = useRef({
    liked: false,
    total: likes,
    shown: likes,
    raf: 0,
    rollTimer: 0,
  })

  const paint = useCallback((n: number) => {
    const el = countRef.current
    if (el) el.innerHTML = [...formatCount(n)].map(ch => `<span>${ch}</span>`).join('')
  }, [])

  const say = useCallback((on: boolean, n: number) => {
    const el = srRef.current
    if (el) el.textContent = `${on ? '已点赞' : '点赞'}，${formatCount(n)}`
  }, [])

  /** 只滚动发生变化的那一位；位数变了就整体滚一次 */
  const rollTo = useCallback(
    (from: number, to: number) => {
      const el = countRef.current
      if (!el || from === to) return
      const a = formatCount(from)
      const b = formatCount(to)
      const changed = a.length === b.length ? [...b].flatMap((ch, i) => (ch !== a[i] ? [i] : [])) : []
      const at = changed.length === 1 ? changed[0] : -1
      const up = to > from
      const slot = (inner: string) => `<span class="pulse-heart__slot">${inner}</span>`
      const roll = (top: string, bottom: string) =>
        `<span class="pulse-heart__roll"><span>${top}</span><span>${bottom}</span></span>`

      el.innerHTML =
        at === -1
          ? slot(up ? roll(a, b) : roll(b, a))
          : [...b]
              .map((ch, i) => (i === at ? slot(up ? roll(a[i], ch) : roll(ch, a[i])) : `<span>${ch}</span>`))
              .join('')

      const roller = el.querySelector<HTMLElement>('.pulse-heart__roll')
      if (!roller) return
      roller.style.transition = 'none'
      roller.style.transform = `translateY(${up ? '0' : '-1em'})`
      roller.getBoundingClientRect()
      roller.style.transition = ''
      roller.style.transform = `translateY(${up ? '-1em' : '0'})`

      window.clearTimeout(state.current.rollTimer)
      state.current.rollTimer = window.setTimeout(() => paint(to), LIKE_ROLL)
    },
    [paint]
  )

  const animate = useCallback(
    (nextLiked: boolean, nextCount: number) => {
      const btn = btnRef.current
      const pill = pillRef.current
      const heart = heartRef.current
      const glyph = glyphRef.current
      if (!btn || !pill || !heart) return

      btn.dataset.running = ''
      const s = state.current
      let swapped = false
      let prev = 0
      const t0 = performance.now()

      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / LIKE_RUN)
        const step = prev ? now - prev : 1000 / 60
        prev = now
        const swell = swellOf(t, LIKE_OVERSHOOT)
        const k = 1 - (1 - LIKE_DOT) * swell

        if (glyph) glyph.setAttribute('transform', `translate(12 12) scale(${k}) translate(-12 -12)`)
        else heart.style.transform = `scale(${k})`
        pill.style.transform = `scale(${1 - (LIKE_BEAT / 100) * swell})`

        if (!swapped && t + step / 2 / LIKE_RUN >= LIKE_SWAP_AT) {
          swapped = true
          btn.dataset.liked = String(nextLiked)
          btn.setAttribute('aria-pressed', String(nextLiked))
          say(nextLiked, nextCount)
          rollTo(s.shown, nextCount)
          s.shown = nextCount
        }

        if (t < 1) {
          s.raf = requestAnimationFrame(tick)
          return
        }

        s.raf = 0
        glyph?.removeAttribute('transform')
        heart.style.transform = ''
        pill.style.transform = ''
        delete btn.dataset.running
        if (s.shown !== s.total) {
          s.shown = s.total
          paint(s.total)
        }
      }

      s.raf = requestAnimationFrame(tick)
    },
    [paint, rollTo, say]
  )

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    const s = state.current
    s.liked = likedSet().has(id)
    s.total = likes + (s.liked ? 1 : 0)
    s.shown = s.total
    btn.dataset.liked = String(s.liked)
    btn.setAttribute('aria-pressed', String(s.liked))
    paint(s.total)
    say(s.liked, s.total)

    return () => {
      if (s.raf) cancelAnimationFrame(s.raf)
      window.clearTimeout(s.rollTimer)
      s.raf = 0
    }
  }, [id, likes, paint, say])

  const release = () => {
    const btn = btnRef.current
    if (btn) delete btn.dataset.pressed
  }

  const onClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current
    const s = state.current
    if (!btn || s.raf) return

    s.liked = !s.liked
    s.total = likes + (s.liked ? 1 : 0)
    rememberLiked(id, s.liked)
    btn.setAttribute('aria-pressed', String(s.liked))
    say(s.liked, s.total)

    if (!prefersReducedMotion()) {
      /* e.detail 为 0 是键盘触发：走无动画的直接切换 */
      if (e.detail !== 0) {
        animate(s.liked, s.total)
        return
      }
    }

    btn.dataset.instant = ''
    btn.dataset.liked = String(s.liked)
    s.shown = s.total
    paint(s.total)
    requestAnimationFrame(() => {
      if (btnRef.current) delete btnRef.current.dataset.instant
    })
  }

  return (
    <button
      type="button"
      ref={btnRef}
      className="pulse-heart"
      data-liked="false"
      aria-pressed={false}
      aria-label={`点赞 ${name}`}
      style={
        {
          '--ph-size': `${size}px`,
          '--ph-corner': `${Math.round(size * 1.2)}px`,
          '--ph-stroke': `${((1.5 * size) / 24).toFixed(2)}px`,
        } as CSSProperties
      }
      onPointerDown={e => {
        if (e.button !== 0 || prefersReducedMotion()) return
        e.currentTarget.dataset.pressed = ''
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
        <span className="pulse-heart__count" aria-hidden="true" ref={countRef} />
        <span className="pulse-heart__sr" ref={srRef} />
      </span>
    </button>
  )
}
