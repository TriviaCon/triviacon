import { useEffect } from 'react'

/**
 * A drag carrying a file or a navigable URL — the two payload kinds whose
 * default Chromium handling can navigate the window away or hang the
 * renderer parsing them. Plain text/HTML (e.g. dragging a text selection
 * between fields) carries neither and is left alone.
 */
function isUnsafeDrag(e: DragEvent): boolean {
  const types = e.dataTransfer?.types
  if (!types) return false
  return Array.from(types).some((type) => type === 'Files' || type === 'text/uri-list')
}

/**
 * Blocks unsafe native drag-and-drop (files, navigable URLs — e.g. an image
 * dragged from a browser tab rather than a file from disk) everywhere except
 * inside elements opted in via `data-dropzone`. Ordinary text/HTML drags
 * (dragging a text selection between fields) are left alone.
 *
 * Without this, Chromium's default handling for an unsafe drag it doesn't
 * recognize can navigate the window away from the app or hang the renderer
 * trying to parse the payload — and it can do this on dragover alone,
 * before anything is even dropped.
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
      if (!isUnsafeDrag(e)) return
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
