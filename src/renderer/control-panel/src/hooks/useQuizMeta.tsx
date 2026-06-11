import { useMutation, useQuery } from '@tanstack/react-query'
import keys from '@renderer/utils/keys'

export const useQuizMeta = () =>
  useQuery({
    queryKey: keys.meta(),
    queryFn: () => window.api.quizMetaGet()
  })

const createMetaMutation = (fn: (v: string) => Promise<void>) =>
  useMutation({
    mutationFn: (v: string) => fn(v),
    meta: {
      invalidateQueries: keys.meta()
    }
  })

export const useUpdateName = () => createMetaMutation(window.api.quizMetaUpdateName)
export const useUpdateAuthor = () => createMetaMutation(window.api.quizMetaUpdateAuthor)
export const useUpdateDate = () => createMetaMutation(window.api.quizMetaUpdateDate)
export const useUpdateLocation = () => createMetaMutation(window.api.quizMetaUpdateLocation)
export const useUpdateSplash = () => createMetaMutation(window.api.quizMetaUpdateSplash)

export const useUpdateTimer = () =>
  useMutation({
    mutationFn: (v: number) => window.api.quizMetaUpdateTimer(v),
    meta: { invalidateQueries: keys.meta() }
  })

// ── Splash media ──────────────────────────────────────────────────

const splashMutation = <A,>(fn: (arg: A) => Promise<unknown>) =>
  useMutation({
    mutationFn: (arg: A) => fn(arg),
    meta: { invalidateQueries: keys.meta() }
  })

export const useSplashPickVisual = () => splashMutation<void>(() => window.api.splashPickVisual())
export const useSplashPickAudio = () => splashMutation<void>(() => window.api.splashPickAudio())
export const useSplashClearVisual = () => splashMutation<void>(() => window.api.splashClearVisual())
export const useSplashClearAudio = () => splashMutation<void>(() => window.api.splashClearAudio())
export const useSplashSetMuted = () => splashMutation<boolean>((m) => window.api.splashSetMuted(m))
export const useSplashSetLoop = () => splashMutation<boolean>((l) => window.api.splashSetLoop(l))
