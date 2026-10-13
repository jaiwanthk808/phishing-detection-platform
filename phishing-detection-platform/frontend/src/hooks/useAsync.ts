import { useCallback, useState } from 'react'
import { errorMessage } from '../services/api'

/** Tracks loading and error state for one async action. */
export function useAsync<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = useCallback(async (...args: A): Promise<R | undefined> => {
    setLoading(true)
    setError(null)
    try {
      return await fn(...args)
    } catch (err) {
      setError(errorMessage(err))
      return undefined
    } finally {
      setLoading(false)
    }
  }, [fn])
  return { loading, error, run, setError }
}
