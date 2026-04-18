import { useEffect, useRef } from 'react'
import Header from './components/layout/Header'
import ControlView from './components/layout/ControlView'
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
  QueryKey,
  useQueryClient
} from '@tanstack/react-query'
import { useGameState } from '@renderer/hooks/useGameState'

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
  return (
    <div className="px-1 py-1 flex flex-col h-full">
      <QueryClientProvider client={queryClient}>
        <QueryInvalidator />
        <Header />
        <div className="flex-grow flex flex-col">
          <ControlView />
        </div>
      </QueryClientProvider>
    </div>
  )
}

export default App
