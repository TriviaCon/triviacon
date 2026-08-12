import { useEffect, useRef } from 'react'
import Header from './components/layout/Header'
import ControlView from './components/layout/ControlView'
import { CloseConfirmModal } from './components/layout/CloseConfirmModal'
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  QueryKey,
  useQueryClient
} from '@tanstack/react-query'
import { useGameState } from '@renderer/hooks/useGameState'
import { useBlockStrayDragDrop } from '@shared/hooks/useBlockStrayDragDrop'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      invalidateQueries?: QueryKey
    }
  }
}

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSettled: (_data, _error, _variables, _context, mutation) => {
      if (mutation.meta?.invalidateQueries) {
        queryClient.invalidateQueries({
          queryKey: mutation.meta.invalidateQueries
        })
      }
    }
  })
})

/** Invalidates all queries whenever the open quiz file changes. */
function QueryInvalidator() {
  const qc = useQueryClient()
  const { quizFilePath } = useGameState()
  const prev = useRef(quizFilePath)

  useEffect(() => {
    if (quizFilePath !== prev.current) {
      prev.current = quizFilePath
      qc.invalidateQueries()
    }
  }, [quizFilePath, qc])

  return null
}

function App() {
  useBlockStrayDragDrop()

  return (
    <div className="px-1 py-1 flex flex-col h-full overflow-hidden">
      <QueryClientProvider client={queryClient}>
        <QueryInvalidator />
        <Header />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <ControlView />
        </div>
        <CloseConfirmModal />
      </QueryClientProvider>
    </div>
  )
}

export default App
