import { useEffect, useState } from 'react'

/** Tiny hash router: works offline and on any static host. */
export function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const [parts, setParts] = useState(read)
  useEffect(() => {
    const on = () => {
      setParts(read())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return parts
}

export const href = (...parts: string[]) => `#/${parts.join('/')}`
export const go = (...parts: string[]) => { window.location.hash = href(...parts) }
