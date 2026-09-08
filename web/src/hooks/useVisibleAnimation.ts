import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const subscribeVisibility = (notify: () => void) => {
  document.addEventListener('visibilitychange', notify)
  return () => document.removeEventListener('visibilitychange', notify)
}

/** Pause decorative loops off-screen or in hidden tabs without resetting their phase. */
export function useVisibleAnimation<T extends Element>(enabled: boolean) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  const pageVisible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && entry.intersectionRatio >= .15)
    }, { threshold: [0, .15] })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, playing: enabled && visible && pageVisible }
}
