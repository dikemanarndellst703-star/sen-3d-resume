import { create } from 'zustand'

interface StoreState {
  active: string | null
  hovered: string | null
  entered: boolean
  night: boolean
  pet: number
  spin: number
  chapter: number
  route: number
  setActive: (id: string | null) => void
  setHovered: (id: string | null) => void
  enter: () => void
  toggleNight: () => void
  petHamster: () => void
  spinHamster: () => void
  setChapter: (chapter: number) => void
  setRoute: (route: number) => void
}

let lastPetAt = -Infinity
let lastSpinAt = -Infinity

export const useStore = create<StoreState>((set) => ({
  active: null, hovered: null, entered: false, night: false, pet: 0, spin: 0, chapter: 0, route: 0,
  setActive: (active) => set({ active }), setHovered: (hovered) => set({ hovered }), enter: () => set({ entered: true }),
  toggleNight: () => set((state) => ({ night: !state.night })),
  petHamster: () => {
    const now = performance.now()
    if (now - lastPetAt < 1400) return
    lastPetAt = now
    set((state) => ({ pet: state.pet + 1 }))
  },
  spinHamster: () => {
    const now = performance.now()
    if (now - lastSpinAt < 2500) return
    lastSpinAt = now
    set((state) => ({ spin: state.spin + 1 }))
  },
  setChapter: (chapter) => set({ chapter }), setRoute: (route) => set({ route }),
}))
