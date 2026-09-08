import { useSyncExternalStore } from 'react'

const query = window.matchMedia('(prefers-reduced-motion: reduce)')
const subscribe = (notify: () => void) => {
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}

/** Respond immediately if the operating system preference changes while this page is open. */
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, () => query.matches, () => false)
}
