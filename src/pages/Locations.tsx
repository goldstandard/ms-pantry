import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Check } from 'lucide-react'
import {
  useLocations,
  useLocationMutations,
} from '../hooks/useLocations'
import { useActiveLocation } from '../hooks/useActiveLocation'
import { translateMissing } from '../lib/translate'
import { displayName } from '../lib/displayName'
import type { Lang, Location } from '../lib/types'

export function Locations() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'cs') as Lang
  const { data: locations = [] } = useLocations()
  const { create } = useLocationMutations()
  const { activeLocationId } = useActiveLocation()

  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    try {
      const name_i18n = await translateMissing({ [lang]: name }, lang)
      await create.mutateAsync({ name_i18n, critical_days: 14, soon_days: 60 })
      setNewName('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">{t('locations.title')}</h1>

      <div className="flex gap-2">
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={t('locations.namePlaceholder')}
        />
        <button
          type="button"
          onClick={add}
          disabled={busy || !newName.trim()}
          className="flex items-center gap-1 rounded-lg bg-brand px-3 font-medium text-white disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {t('common.add')}
        </button>
      </div>

      <div className="space-y-3">
        {locations.map((loc) => (
          <LocationRow
            key={loc.id}
            location={loc}
            lang={lang}
            isActive={loc.id === activeLocationId}
            canDelete={locations.length > 1}
          />
        ))}
      </div>
    </div>
  )
}

function LocationRow({
  location,
  lang,
  isActive,
  canDelete,
}: {
  location: Location
  lang: Lang
  isActive: boolean
  canDelete: boolean
}) {
  const { t } = useTranslation()
  const { update, remove } = useLocationMutations()
  const { activeLocationId, setActiveLocationId } = useActiveLocation()

  const [name, setName] = useState(displayName(location.name_i18n, lang))
  const [critical, setCritical] = useState(location.critical_days)
  const [soon, setSoon] = useState(location.soon_days)
  const [busy, setBusy] = useState(false)

  const dirty =
    name.trim() !== displayName(location.name_i18n, lang) ||
    critical !== location.critical_days ||
    soon !== location.soon_days

  const save = async () => {
    setBusy(true)
    try {
      const trimmed = name.trim()
      const nameChanged = trimmed !== displayName(location.name_i18n, lang)
      const name_i18n = nameChanged
        ? await translateMissing({ [lang]: trimmed }, lang)
        : location.name_i18n
      await update.mutateAsync({
        id: location.id,
        name_i18n,
        critical_days: critical,
        soon_days: soon,
      })
    } finally {
      setBusy(false)
    }
  }

  const del = async () => {
    if (!confirm(t('locations.deleteConfirm'))) return
    await remove.mutateAsync(location.id)
    if (activeLocationId === location.id) setActiveLocationId(null)
  }

  const numCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-medium outline-none focus:border-brand"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {isActive && (
          <span className="rounded bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
            {t('locations.active')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-500">
          {t('locations.criticalDays')}
          <input
            type="number"
            min={0}
            className={numCls}
            value={critical}
            onChange={(e) => setCritical(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
        <label className="text-xs text-slate-500">
          {t('locations.soonDays')}
          <input
            type="number"
            min={0}
            className={numCls}
            value={soon}
            onChange={(e) => setSoon(Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
      </div>

      <p className="mt-1 text-[11px] text-slate-400">
        {t('locations.thresholdsHelp')}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {t('common.save')}
        </button>
        <button
          type="button"
          onClick={del}
          disabled={!canDelete}
          className="ml-auto flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          {t('common.delete')}
        </button>
      </div>
    </div>
  )
}
