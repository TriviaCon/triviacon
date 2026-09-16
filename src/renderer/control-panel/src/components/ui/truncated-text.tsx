import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@renderer/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@renderer/components/ui/tooltip'

/**
 * Text clipped to its container, with the full string in a tooltip — but only
 * when it is actually clipped, so a name that fits doesn't sprout a tooltip
 * repeating what is already on screen. Re-measures when the text or the
 * container width changes, since the panel it lives in is resizable.
 */
export function TruncatedText({
  text,
  className,
  onClick
}: {
  text: string
  className?: string
  onClick?: () => void
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [clipped, setClipped] = useState(false)

  const measure = useCallback(() => {
    const el = ref.current
    if (el) setClipped(el.scrollWidth > el.clientWidth)
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure, text])

  const label = (
    <span ref={ref} className={cn('block truncate', className)} onClick={onClick}>
      {text}
    </span>
  )

  if (!clipped) return label

  return (
    <Tooltip>
      <TooltipTrigger asChild>{label}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}
