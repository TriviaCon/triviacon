import { useEffect } from 'react'

/**
 * Blocks native drag-and-drop everywhere except inside elements opted in via
 * `data-dropzone`. Without this, Chromium's default handling for a drag it
 * doesn't recognize (e.g. an image dragged from a browser tab, rather than a
 * file from disk) can navigate the window away from the app or hang the
 * renderer trying to parse the payload — and it can do this on dragover
 * alone, before anything is even dropped.
 */
export function useBlockStrayDragDrop(): void {
  useEffect(() => {
    const dropzoneAncestor = (target: EventTarget | null): Element | null => {
      if (target instanceof Element) return target.closest('[data-dropzone]')
      if (target instanceof Node) return target.parentElement?.closest('[data-dropzone]') ?? null
      return null
    }

    const block = (e: DragEvent) => {
      if (dropzoneAncestor(e.target)) return
      e.preventDefault()
      e.stopPropagation()
    }

    document.addEventListener('dragenter', block, true)
    document.addEventListener('dragover', block, true)
    document.addEventListener('drop', block, true)
    return () => {
      document.removeEventListener('dragenter', block, true)
      document.removeEventListener('dragover', block, true)
      document.removeEventListener('drop', block, true)
    }
  }, [])
}
