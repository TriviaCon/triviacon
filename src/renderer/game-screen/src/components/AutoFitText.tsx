import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type AutoFitTextProps = {
  children: ReactNode
  /** Ideal (maximum) font size in px. */
  maxPx: number
  /** Readability floor in px — never shrinks below this. */
  minPx: number
  className?: string
  /** Re-fit when this value changes (e.g. the active question id). */
  resetKey?: unknown
}

/**
 * Scales its children's font-size down — between `minPx` and `maxPx` — so the
 * content fits its box instead of overflowing. Re-fits on container resize and
 * whenever `resetKey` changes, keeping long questions readable on the projector
 * rather than clipping them.
 */
export function AutoFitText({ children, maxPx, minPx, className, resetKey }: AutoFitTextProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [fontPx, setFontPx] = useState(maxPx)

  useLayoutEffect(() => {
    const box = boxRef.current
    const inner = innerRef.current
    if (!box || !inner) return

    const fits = (px: number): boolean => {
      inner.style.fontSize = `${px}px`
      return inner.scrollHeight <= box.clientHeight && inner.scrollWidth <= box.clientWidth
    }

    const fit = () => {
      let best = minPx
      if (fits(maxPx)) {
        best = maxPx
      } else {
        let lo = minPx
        let hi = maxPx
        for (let i = 0; i < 8; i++) {
          const mid = (lo + hi) / 2
          if (fits(mid)) {
            best = mid
            lo = mid
          } else {
            hi = mid
          }
        }
      }
      setFontPx(best)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
  }, [maxPx, minPx, resetKey])

  return (
    <div
      ref={boxRef}
      className={`flex h-full w-full items-center justify-center overflow-hidden ${className ?? ''}`}
    >
      <div ref={innerRef} style={{ fontSize: `${fontPx}px` }}>
        {children}
      </div>
    </div>
  )
}

export default AutoFitText
