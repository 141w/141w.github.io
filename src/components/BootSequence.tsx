import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface BootLine {
  text: string
  color: string
  delay: number
}

const bootLines: BootLine[] = [
  { text: '[boot] initializing dawn runtime...', color: '#6b7280', delay: 300 },
  { text: '[core] loading modules...', color: '#6b7280', delay: 500 },
  { text: '[agent] syncing providers...', color: '#6b7280', delay: 400 },
  { text: '[net] establishing secure channel...', color: '#6b7280', delay: 350 },
  { text: '[gpu] shader pipeline ready', color: '#6b7280', delay: 250 },
  { text: '[ok] system ready', color: '#4ade80', delay: 600 },
]

interface BootSequenceProps {
  onComplete: () => void
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []
    const hasBooted = sessionStorage.getItem('boot-complete')
    if (hasBooted) {
      onCompleteRef.current()
      return
    }

    let cumulativeDelay = 400

    bootLines.forEach((line, i) => {
      cumulativeDelay += line.delay

      const t = setTimeout(() => {
        setVisibleLines(i + 1)

        if (i === bootLines.length - 1) {
          const t2 = setTimeout(() => {
            setDone(true)
            sessionStorage.setItem('boot-complete', 'true')
            const t3 = setTimeout(() => {
              onCompleteRef.current()
            }, 800)
            timeouts.push(t3)
          }, 500)
          timeouts.push(t2)
        }
      }, cumulativeDelay)

      timeouts.push(t)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
              lineHeight: 1.8,
              maxWidth: '520px',
              width: '100%',
              padding: '0 20px',
            }}
          >
            {bootLines.slice(0, visibleLines).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                style={{ color: line.color }}
              >
                {line.text}
              </motion.div>
            ))}

            {visibleLines > 0 && visibleLines < bootLines.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{ color: '#4ade80', marginTop: '4px' }}
              >
                <span className="cursor-blink" />
              </motion.div>
            )}

            {done && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{ color: '#4ade80', marginTop: '4px' }}
              >
                <span className="cursor-blink" />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
