import { useCallback, useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ALLOWED_MEDIA_EXTENSIONS } from '@shared/media'

export interface MediaDrop {
  dragOver: boolean
  dropError: string | null
  dropProps: {
    onDragOver: (e: DragEvent) => void
    onDragLeave: (e: DragEvent) => void
    onDrop: (e: DragEvent) => void
  }
  /** True while a dropped file is awaiting confirmation to replace existing media. */
  replaceOpen: boolean
  confirmReplace: () => Promise<void>
  cancelReplace: () => void
}

/**
 * Drag-and-drop plumbing for a single media slot. Dropping onto an empty slot
 * attaches immediately; dropping onto a filled slot stages the file and opens a
 * replace confirmation the caller renders from `replaceOpen`.
 */
export function useMediaDrop(
  hasExisting: boolean,
  attach: (path: string) => Promise<unknown>,
  onAttached: () => void
): MediaDrop {
  const { t } = useTranslation()
  const [dragOver, setDragOver] = useState(false)
  const [dropError, setDropError] = useState<string | null>(null)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const pendingPathRef = useRef<string | null>(null)
  const dropTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showDropError = useCallback((msg: string) => {
    setDropError(msg)
    clearTimeout(dropTimerRef.current)
    dropTimerRef.current = setTimeout(() => setDropError(null), 3000)
  }, [])

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const onDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      setDropError(null)

      const files = e.dataTransfer.files
      if (files.length > 1) {
        showDropError(t('builder.dropOneFileOnly'))
        return
      }
      if (files.length === 0) return

      const file = files[0]
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !ALLOWED_MEDIA_EXTENSIONS.includes(ext)) {
        showDropError(t('builder.dropUnsupportedType'))
        return
      }

      const path = window.api.getFilePath(file)
      if (hasExisting) {
        pendingPathRef.current = path
        setReplaceOpen(true)
        return
      }
      await attach(path)
      onAttached()
    },
    [hasExisting, attach, onAttached, t, showDropError]
  )

  const confirmReplace = useCallback(async () => {
    if (pendingPathRef.current) {
      await attach(pendingPathRef.current)
      pendingPathRef.current = null
      onAttached()
    }
    setReplaceOpen(false)
  }, [attach, onAttached])

  const cancelReplace = useCallback(() => {
    pendingPathRef.current = null
    setReplaceOpen(false)
  }, [])

  return {
    dragOver,
    dropError,
    dropProps: { onDragOver, onDragLeave, onDrop },
    replaceOpen,
    confirmReplace,
    cancelReplace
  }
}
