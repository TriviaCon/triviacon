import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FileOpenProgressPayload } from '@shared/types/ipc'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'

interface Props {
  open: boolean
  onClose: () => void
}

interface State {
  meta: { name: string; author: string; location: string; date: string } | null
  categoryCount: number | null
  questionCount: number | null
  extractCurrent: number
  extractTotal: number
  phase: FileOpenProgressPayload['phase'] | 'idle'
  errorMessage: string | null
}

const INITIAL: State = {
  meta: null,
  categoryCount: null,
  questionCount: null,
  extractCurrent: 0,
  extractTotal: 0,
  phase: 'idle',
  errorMessage: null,
}

export function OpenProgressModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const [state, setState] = useState<State>(INITIAL)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!open) {
      setState(INITIAL)
      return
    }

    const unsub = window.api.onOpenProgress((event) => {
      setState((prev) => {
        switch (event.phase) {
          case 'metadata':
            return { ...prev, meta: event.meta, phase: 'metadata' }
          case 'structure':
            return { ...prev, categoryCount: event.categoryCount, questionCount: event.questionCount, phase: 'structure' }
          case 'extracting':
            return { ...prev, extractCurrent: event.current, extractTotal: event.total, phase: 'extracting' }
          case 'done':
            return { ...prev, phase: 'done' }
          case 'error':
            return { ...prev, phase: 'error', errorMessage: event.message }
          default:
            return prev
        }
      })
    })

    unsubRef.current = unsub
    return () => {
      unsub()
      unsubRef.current = null
    }
  }, [open])

  const isDone = state.phase === 'done'
  const isError = state.phase === 'error'
  const isTerminal = isDone || isError

  const pct = state.extractTotal > 0
    ? Math.round((state.extractCurrent / state.extractTotal) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{t('openProgress.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Metadata block */}
          {state.meta && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p className="font-semibold truncate">{state.meta.name || '—'}</p>
              {state.meta.author && <p className="text-muted-foreground">{state.meta.author}</p>}
              {state.meta.location && <p className="text-muted-foreground">{state.meta.location}</p>}
              {state.meta.date && <p className="text-muted-foreground">{state.meta.date}</p>}
            </div>
          )}

          {/* Structure counts */}
          {state.categoryCount !== null && (
            <div className="text-sm space-y-0.5">
              <p>
                <span className="text-muted-foreground">{t('openProgress.categories')}</span>{' '}
                <span className="font-medium">{state.categoryCount}</span>
              </p>
              <p>
                <span className="text-muted-foreground">{t('openProgress.questions')}</span>{' '}
                <span className="font-medium">{state.questionCount}</span>
              </p>
            </div>
          )}

          {/* Extraction progress */}
          {state.extractTotal > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                {t('openProgress.extracting')}{' '}
                <span className="font-medium tabular-nums text-foreground">
                  {state.extractCurrent}/{state.extractTotal}
                </span>
              </p>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden relative">
                {!isDone && (
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}
                <div
                  className="h-full rounded-full bg-primary transition-all duration-100"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-semibold mb-1">{t('openProgress.error')}</p>
              <p className="font-mono text-xs break-all">{state.errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {isTerminal && (
          <div className="flex justify-end pt-1">
            <Button onClick={onClose}>{t('openProgress.close')}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
