import { useCallback, useEffect, useState } from 'react'
import { getInsights } from '../services/api'

/** Loads the measured model metrics from the API: { data, error, loading, retry }. */
export function useInsights() {
  const [state, setState] = useState({ data: null, error: null, loading: true })

  const load = useCallback((force = false) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    getInsights({ force })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, retry: () => load(true) }
}
