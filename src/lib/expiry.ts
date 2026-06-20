import { differenceInCalendarDays, parseISO } from 'date-fns'

export type ExpiryStatus = 'expired' | 'critical' | 'soon' | 'ok' | 'none'

export interface ExpiryThresholds {
  critical_days: number
  soon_days: number
}

/** Počet dní do expirace (záporné = už prošlé). null = bez data. */
export function daysUntil(dateISO: string | null | undefined): number | null {
  if (!dateISO) return null
  return differenceInCalendarDays(parseISO(dateISO), new Date())
}

export function expiryStatus(
  dateISO: string | null | undefined,
  t: ExpiryThresholds,
): ExpiryStatus {
  const d = daysUntil(dateISO)
  if (d === null) return 'none'
  if (d < 0) return 'expired'
  if (d < t.critical_days) return 'critical'
  if (d < t.soon_days) return 'soon'
  return 'ok'
}

/** Řazení: otevřená balení nahoře, uvnitř skupiny podle expirace. */
export function compareByOpenedThenExpiry(
  a: { is_opened: boolean; expiration_date: string | null | undefined },
  b: { is_opened: boolean; expiration_date: string | null | undefined },
): number {
  if (a.is_opened !== b.is_opened) return a.is_opened ? -1 : 1
  return compareByExpiry(a.expiration_date, b.expiration_date)
}

/** Řazení podle expirace: nejbližší (i prošlé) nahoře, bez data nakonec. */
export function compareByExpiry(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const da = daysUntil(a)
  const db = daysUntil(b)
  if (da === null && db === null) return 0
  if (da === null) return 1
  if (db === null) return -1
  return da - db
}

export const STATUS_STYLES: Record<
  ExpiryStatus,
  { badge: string; dot: string; card: string }
> = {
  expired: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-600',
    card: 'border-l-red-500',
  },
  critical: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
    card: 'border-l-red-500',
  },
  soon: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    card: 'border-l-amber-500',
  },
  ok: {
    badge: 'bg-green-100 text-green-800 border-green-200',
    dot: 'bg-green-500',
    card: 'border-l-green-500',
  },
  none: {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    card: 'border-l-slate-300',
  },
}
