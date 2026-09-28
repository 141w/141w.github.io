import { useCallback, useEffect, useRef, useState } from 'react'
import { motto } from '../data/profile'
import { revealPixelSwap } from '../lib/pixelSwap'

const SPLASH_FLAG = 'ww-splash-shown'

function readFlag(): boolean {
  try {
    return sessionStorage.getItem(SPLASH_FLAG) !== null
  } catch {
    return false
  }
}

function writeFlag() {
  try {
    sessionStorage.setItem(SPLASH_FLAG, '1')
  } catch {
    /* 无痕模式写不进去就算了 */
  }
}

function BootCard({ entered }: { entered: boolean }) {
  if (entered) {
    return (
      <div className="boot-card boot-card--entered">
        <div className="boot-mark">WW</div>
        <p className="boot-ok">已进入作品集 · 正在展开页面</p>
        <div className="boot-prompt">
          ww@portfolio:~$ <span className="boot-cursor">▍</span>
        </div>
      </div>
    )
  }
  return (
    <div className="boot-card">
      <div className="boot-mark">WW</div>
      <h2>{motto.chars}</h2>
      <ul className="boot-log">
        {motto.gloss.map(line => {
          const at = line.indexOf(' ')
          return (
            <li key={line}>
              <b>{line.slice(0, at)}</b>
              {line.slice(at + 1)}
            </li>
          )
        })}
      </ul>
      <div className="boot-prompt">
        点击进入作品集 <span className="boot-cursor">▍</span>
      </div>
    </div>
  )
}

/**
 * 开屏：每会话只放一次的像素溶解（PixelSwap），取代原先的 BootSequence 打字日志。
 * 遮罩完全不透明盖住页面内容；点一下或回车即显影并放行。
 */
export default function SplashGate() {
  const [open, setOpen] = useState(() => !readFlag())
  const [fading, setFading] = useState(false)

  const boxRef = useRef<HTMLDivElement>(null)
  const bootRef = useRef<HTMLDivElement>(null)
  const enteredRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<(() => void) | null>(null)
  const timerRef = useRef(0)
  const revealedRef = useRef(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    boxRef.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(
    () => () => {
      cancelRef.current?.()
      window.clearTimeout(timerRef.current)
    },
    []
  )

  const showEntered = useCallback(() => {
    if (bootRef.current) bootRef.current.dataset.visible = 'false'
    if (enteredRef.current) {
      enteredRef.current.dataset.visible = 'true'
      enteredRef.current.removeAttribute('aria-hidden')
    }
  }, [])

  const finish = useCallback(() => {
    setFading(true)
    timerRef.current = window.setTimeout(() => {
      setOpen(false)
      writeFlag()
    }, 240)
  }, [])

  const reveal = useCallback(() => {
    if (revealedRef.current) return
    revealedRef.current = true

    const box = boxRef.current
    const entered = enteredRef.current
    if (!box || !entered) {
      finish()
      return
    }

    const cancel = revealPixelSwap(box, entered, () => {
      showEntered()
      finish()
    })

    if (!cancel) {
      /* 尺寸拿不到或用户要求减少动效：直接切到显影态，不做溶解 */
      showEntered()
      finish()
    } else {
      cancelRef.current = cancel
    }
  }, [finish, showEntered])

  if (!open) return null

  return (
    <div className="splash" data-fading={fading ? '' : undefined}>
      <div
        className="pixel-swap"
        role="button"
        tabIndex={0}
        aria-label="进入作品集"
        ref={boxRef}
        onClick={reveal}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            reveal()
          }
        }}
      >
        <div className="pixel-swap__layer" data-visible="true" ref={bootRef}>
          <BootCard entered={false} />
        </div>
        <div className="pixel-swap__layer" data-visible="false" aria-hidden="true" ref={enteredRef}>
          <BootCard entered />
        </div>
      </div>
    </div>
  )
}
