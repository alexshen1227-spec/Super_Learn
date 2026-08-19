import { useEffect, useState } from 'react'

/**
 * A clock that only changes once a minute, so it can be used as a memo
 * dependency. Review dues, deadlines, and coach lines all move at minute
 * resolution at best; a per-render timestamp just defeats memoization.
 */
export function useMinuteClock(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 60_000) * 60_000)
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 60_000) * 60_000), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}
