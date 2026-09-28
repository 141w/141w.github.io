import { useEffect, useRef } from 'react'
import { createTechText } from '../lib/techText'
import { cssVar } from '../lib/site'

interface Props {
  text: string
  /** canvas 对读屏不可见，真实文本走这里 */
  srLabel: string
  size?: number
}

/**
 * Hero 字标：实心字形 + 虚线轮廓精灵，指针靠近的那几个字转为矢量描边。
 * canvas 是装饰层，标题的真实文本留在 .sr-only 里。
 */
export default function TechTitle({ text, srLabel, size = 168 }: Props) {
  const hostRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const inst = createTechText(host, {
      text,
      fontSize: size,
      fontWeight: 700,
      letterSpacing: 0,
      color: cssVar('--text') || '#f5f5f5',
      accentColor: cssVar('--accent') || '#ffffff',
      reach: 150,
      reveal: 'letter',
      dashLength: 4,
      dashGap: 2,
      strokeWidth: 1.5,
      specks: 0,
      selection: true,
      labels: false,
      draggable: true,
      sweep: false,
      speed: 1,
    })

    return () => inst.destroy()
  }, [text, size])

  return (
    <h1 className="hero-title" ref={hostRef}>
      <span className="sr-only">{srLabel}</span>
    </h1>
  )
}
