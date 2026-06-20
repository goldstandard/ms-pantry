import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'ms-pantry-active-location'

interface ActiveLocationState {
  activeLocationId: string | null
  setActiveLocationId: (id: string | null) => void
}

const Ctx = createContext<ActiveLocationState | undefined>(undefined)

export function ActiveLocationProvider({ children }: { children: ReactNode }) {
  const [activeLocationId, setIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  )

  const setActiveLocationId = (id: string | null) => {
    setIdState(id)
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <Ctx.Provider value={{ activeLocationId, setActiveLocationId }}>
      {children}
    </Ctx.Provider>
  )
}

export function useActiveLocation(): ActiveLocationState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useActiveLocation musí být uvnitř <ActiveLocationProvider>')
  return ctx
}
