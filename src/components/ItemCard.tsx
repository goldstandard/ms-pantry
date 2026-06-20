import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package } from 'lucide-react'
import type { Item } from '../lib/types'
import { displayName } from '../lib/displayName'
import { ExpiryBadge } from './ExpiryBadge'
import { expiryStatus, STATUS_STYLES, type ExpiryThresholds } from '../lib/expiry'

export function ItemCard({
  item,
  thresholds,
}: {
  item: Item
  thresholds: ExpiryThresholds
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'cs'
  const status = expiryStatus(item.expiration_date, thresholds)
  const totalServings = item.servings_per_unit
    ? Math.round(item.servings_per_unit * item.quantity)
    : null

  return (
    <Link
      to={`/item/${item.id}`}
      className={`flex items-center gap-3 rounded-xl border border-slate-200 border-l-4 bg-white p-3 shadow-sm transition active:scale-[0.99] ${STATUS_STYLES[status].card}`}
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt=""
          className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          <Package className="h-6 w-6" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-slate-900">
          {displayName(item.name_i18n, lang) || '—'}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          {item.brand && <span className="truncate">{item.brand}</span>}
          <span>{t('inventory.packages', { count: item.quantity })}</span>
          {totalServings !== null && (
            <span>· {t('inventory.servingsApprox', { count: totalServings })}</span>
          )}
        </div>
      </div>

      <ExpiryBadge date={item.expiration_date} thresholds={thresholds} />
    </Link>
  )
}
