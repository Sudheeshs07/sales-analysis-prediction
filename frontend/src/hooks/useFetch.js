import { useState, useEffect } from 'react'

export function useFetch(fetchFn, deps = [], initialData = null) {
  const [data, setData]       = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchFn()
      setData(res.data)
    } catch (e) {
      setError(e?.response?.data?.detail ?? e.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, deps)  // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, reload: load }
}

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('darkMode', JSON.stringify(dark))
  }, [dark])

  return [dark, () => setDark(d => !d)]
}
