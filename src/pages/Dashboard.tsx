import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, LayoutGrid, CalendarClock, PackageOpen } from 'lucide-react'
import { useItems } from '../hooks/useItems'
import { useCategories } from '../hooks/useCategories'
import { useLocations } from '../hooks/useLocations'
import { useActiveLocation } from '../hooks/useActiveLocation'
import { CategoryFilter } from '../components/CategoryFilter'
import { ItemCard } from '../components/ItemCard'
import { displayName } from '../lib/displayName'
import {
  compareByOpenedThenExpiry,
  expiryStatus,
  type ExpiryThresholds,
} from '../lib/expiry'
import type { Category, Item, Lang } from '../lib/types'

type ViewMode = 'category' | 'expiry'

export function Dashboard() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'cs') as Lang
  const { data: items = [], isLoading } = useItems()
  const { data: categories = [] } = useCategories()
  const { data: locations = [] } = useLocations()
  const { activeLocationId } = useActiveLocation()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [view, setView] = useState<ViewMode>('category')

  const activeLocation = locations.find((l) => l.id === activeLocationId)
  const thresholds: ExpiryThresholds = {
    critical_days: activeLocation?.critical_days ?? 14,
    soon_days: activeLocation?.soon_days ?? 60,
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (categoryFilter !== 'all' && it.category_id !== categoryFilter) return false
      if (q) {
        const hay = [...Object.values(it.name_i18n ?? {}), it.brand]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, search, categoryFilter])

  const summary = useMemo(() => {
    let expired = 0
    let soon = 0
    for (const it of items) {
      const s = expiryStatus(it.expiration_date, thresholds)
      if (s === 'expired') expired++
      else if (s === 'critical' || s === 'soon') soon++
    }
    return { expired, soon }
  }, [items, thresholds])

  return (
    <div className="space-y-4">
      {/* Souhrn */}
      <div className="flex gap-2">
        <SummaryPill
          tone="red"
          label={t('inventory.summaryExpired', { count: summary.expired })}
        />
        <SummaryPill
          tone="amber"
          label={t('inventory.summarySoon', { count: summary.soon })}
        />
      </div>

      {/* Hledání */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 outline-none focus:border-brand"
        />
      </div>

      {/* Filtr kategorií */}
      <CategoryFilter
        categories={categories}
        value={categoryFilter}
        onChange={setCategoryFilter}
      />

      {/* Přepínač pohledu */}
      <div className="flex gap-2">
        <ViewToggle
          active={view === 'category'}
          onClick={() => setView('category')}
          icon={<LayoutGrid className="h-4 w-4" />}
          label={t('inventory.groupByCategory')}
        />
        <ViewToggle
          active={view === 'expiry'}
          onClick={() => setView('expiry')}
          icon={<CalendarClock className="h-4 w-4" />}
          label={t('inventory.sortByExpiry')}
        />
      </div>

      {/* Obsah */}
      {isLoading ? (
        <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <EmptyState
          title={t('inventory.empty')}
          hint={t('inventory.emptyHint')}
        />
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-slate-400">
          {t('inventory.noResults')}
        </p>
      ) : view === 'expiry' ? (
        <div className="space-y-2">
          {[...filtered]
            .sort((a, b) => compareByOpenedThenExpiry(a, b))
            .map((it) => (
              <ItemCard key={it.id} item={it} thresholds={thresholds} />
            ))}
        </div>
      ) : (
        <GroupedByCategory
          items={filtered}
          categories={categories}
          thresholds={thresholds}
          lang={lang}
        />
      )}
    </div>
  )
}

function GroupedByCategory({
  items,
  categories,
  thresholds,
  lang,
}: {
  items: Item[]
  categories: Category[]
  thresholds: ExpiryThresholds
  lang: Lang
}) {
  const { t } = useTranslation()

  const groups = useMemo(() => {
    const byId = new Map<string, Item[]>()
    const uncategorized: Item[] = []
    for (const it of items) {
      if (!it.category_id) {
        uncategorized.push(it)
        continue
      }
      const arr = byId.get(it.category_id) ?? []
      arr.push(it)
      byId.set(it.category_id, arr)
    }
    const ordered = categories
      .filter((c) => byId.has(c.id))
      .map((c) => ({ key: c.id, name: displayName(c.name_i18n, lang), items: byId.get(c.id)! }))
    if (uncategorized.length > 0) {
      ordered.push({
        key: 'uncategorized',
        name: t('inventory.uncategorized'),
        items: uncategorized,
      })
    }
    return ordered
  }, [items, categories, lang, t])

  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const packages = g.items.reduce((s, it) => s + it.quantity, 0)
        const servings = g.items.reduce(
          (s, it) => s + (it.servings_per_unit ? it.servings_per_unit * it.quantity : 0),
          0,
        )
        return (
          <section key={g.key}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {g.name}
              </h2>
              <span className="text-xs text-slate-400">
                {t('inventory.packages', { count: packages })}
                {servings > 0 &&
                  ` · ${t('inventory.servingsApprox', { count: Math.round(servings) })}`}
              </span>
            </div>
            <div className="space-y-2">
              {[...g.items]
                .sort((a, b) => compareByOpenedThenExpiry(a, b))
                .map((it) => (
                  <ItemCard key={it.id} item={it} thresholds={thresholds} />
                ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function SummaryPill({ tone, label }: { tone: 'red' | 'amber'; label: string }) {
  const tones = {
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <div className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium ${tones[tone]}`}>
      {label}
    </div>
  )
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-sm ${
        active
          ? 'border-brand bg-brand/10 text-brand'
          : 'border-slate-200 bg-white text-slate-500'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
      <PackageOpen className="h-12 w-12" />
      <p className="font-medium text-slate-500">{title}</p>
      <p className="text-sm">{hint}</p>
    </div>
  )
}
