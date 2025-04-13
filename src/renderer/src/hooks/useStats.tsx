import { useState, useEffect } from 'react'
import { ipc } from '@renderer/main'
import { Stats } from '@renderer/types'

const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const fetchedStats: Stats = await ipc.db.getStats()
        setStats(fetchedStats)
      } catch (err) {
        setError('Failed to fetch stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}

export default useStats
