import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Boxes, Tags, Warehouse, PlusCircle, LogOut } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { LocationSwitcher } from './LocationSwitcher'
import { useAuth } from '../hooks/useAuth'

export function Layout() {
  const { t } = useTranslation()
  const { signOut } = useAuth()

  const tab = 'flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px]'
  const tabActive = 'text-brand'
  const tabIdle = 'text-slate-400'
  const cls = ({ isActive }: { isActive: boolean }) =>
    `${tab} ${isActive ? tabActive : tabIdle}`

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur">
        <span className="mr-auto text-lg font-bold text-brand">{t('app.title')}</span>
        <LocationSwitcher />
        <LanguageSwitcher />
        <button
          type="button"
          onClick={() => void signOut()}
          aria-label={t('nav.logout')}
          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed bottom-0 left-1/2 z-20 flex w-full max-w-lg -translate-x-1/2 border-t border-slate-200 bg-white">
        <NavLink to="/" end className={cls}>
          <Boxes className="h-5 w-5" />
          {t('nav.inventory')}
        </NavLink>
        <NavLink to="/add" className={cls}>
          <PlusCircle className="h-5 w-5" />
          {t('nav.add')}
        </NavLink>
        <NavLink to="/categories" className={cls}>
          <Tags className="h-5 w-5" />
          {t('nav.categories')}
        </NavLink>
        <NavLink to="/locations" className={cls}>
          <Warehouse className="h-5 w-5" />
          {t('nav.locations')}
        </NavLink>
      </nav>
    </div>
  )
}
