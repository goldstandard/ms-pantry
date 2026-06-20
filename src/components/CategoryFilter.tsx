import { useTranslation } from 'react-i18next'
import type { Category } from '../lib/types'
import { displayName } from '../lib/displayName'

export function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: string
  onChange: (value: string) => void
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'cs'
  const base =
    'whitespace-nowrap rounded-full border px-3 py-1 text-sm transition'
  const on = 'border-brand bg-brand text-white'
  const off = 'border-slate-200 bg-white text-slate-600'

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`${base} ${value === 'all' ? on : off}`}
      >
        {t('common.all')}
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={`${base} ${value === c.id ? on : off}`}
        >
          {displayName(c.name_i18n, lang)}
        </button>
      ))}
    </div>
  )
}
