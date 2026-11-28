import { useCallback, useEffect, useState } from 'react'

/** Calls `fn` now and every `ms`; keeps the last good value on a failed call. */
export function usePoll(fn, ms, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => fn().then((d) => { setData(d); setError(null) }, setError), deps)
  useEffect(() => {
    run()
    const id = setInterval(run, ms)
    return () => clearInterval(id)
  }, [run, ms])
  return { data, error, reload: run }
}
