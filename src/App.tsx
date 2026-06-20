import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings2 } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { useLocations } from './hooks/useLocations'
import { useActiveLocation } from './hooks/useActiveLocation'
import { Layout } from './components/Nav'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { AddItem } from './pages/AddItem'
import { EditItem } from './pages/EditItem'
import { Categories } from './pages/Categories'
import { Locations } from './pages/Locations'

export default function App() {
  const { configured, loading, session } = useAuth()

  if (!configured) return <Setup />
  if (loading) return <FullSpinner />
  if (!session) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <ActiveLocationGate>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddItem />} />
          <Route path="/item/:id" element={<EditItem />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/locations" element={<Locations />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ActiveLocationGate>
  )
}

/** Zajistí, že aktivní sklad existuje; jinak vybere výchozí/první. */
function ActiveLocationGate({ children }: { children: ReactNode }) {
  const { data: locations = [] } = useLocations()
  const { activeLocationId, setActiveLocationId } = useActiveLocation()

  useEffect(() => {
    if (locations.length === 0) return
    const valid = locations.some((l) => l.id === activeLocationId)
    if (!valid) {
      const def = locations.find((l) => l.is_default) ?? locations[0]
      setActiveLocationId(def.id)
    }
  }, [locations, activeLocationId, setActiveLocationId])

  return <>{children}</>
}

function FullSpinner() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">
      {t('common.loading')}
    </div>
  )
}

function Setup() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-sm space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Settings2 className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{t('setup.title')}</h1>
        <p className="text-sm text-slate-600">{t('setup.body')}</p>
        <p className="text-xs text-slate-400">{t('setup.docs')}</p>
      </div>
    </div>
  )
}
