import { useTranslation } from 'react-i18next'
import {
  daysUntil,
  expiryStatus,
  STATUS_STYLES,
  type ExpiryThresholds,
} from '../lib/expiry'

export function ExpiryBadge({
  date,
  thresholds,
}: {
  date: string | null
  thresholds: ExpiryThresholds
}) {
  const { t } = useTranslation()
  const status = expiryStatus(date, thresholds)
  const d = daysUntil(date)
  const style = STATUS_STYLES[status]

  let label: string
  if (d === null) label = t('expiry.none')
  else if (d === 0) label = t('expiry.today')
  else if (d > 0) label = t('expiry.daysLeft', { count: d })
  else label = t('expiry.expiredAgo', { count: -d })

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  )
}
