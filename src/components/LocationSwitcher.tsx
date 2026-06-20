import { useTranslation } from 'react-i18next'
import { Warehouse } from 'lucide-react'
import { useLocations } from '../hooks/useLocations'
import { useActiveLocation } from '../hooks/useActiveLocation'
import { displayName } from '../lib/displayName'

export function LocationSwitcher() {
  const { i18n } = useTranslation()
  const { data: locations } = useLocations()
  const { activeLocationId, setActiveLocationId } = useActiveLocation()

  if (!locations || locations.length === 0) return null

  return (
    <label className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700">
      <Warehouse className="h-4 w-4 text-brand" />
      <select
        aria-label="Storage"
        value={activeLocationId ?? ''}
        onChange={(e) => setActiveLocationId(e.target.value)}
        className="max-w-[40vw] bg-transparent pr-1 font-medium outline-none"
      >
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {displayName(loc.name_i18n, i18n.resolvedLanguage ?? 'cs')}
          </option>
        ))}
      </select>
    </label>
  )
}
