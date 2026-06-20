import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash2, Check, PackageOpen, Package } from 'lucide-react'
import {
  ItemForm,
  emptyItemForm,
  type ItemFormState,
} from '../components/ItemForm'
import { useCategories } from '../hooks/useCategories'
import { useLocations } from '../hooks/useLocations'
import { useItem, useItemMutations } from '../hooks/useItems'
import { translateMissing } from '../lib/translate'
import { missingLangs } from '../lib/displayName'
import { displayName } from '../lib/displayName'
import type { Item, Lang } from '../lib/types'

function itemToForm(item: Item): ItemFormState {
  return {
    name_i18n: item.name_i18n ?? {},
    original_lang: item.original_lang,
    brand: item.brand ?? '',
    barcode: item.barcode ?? '',
    category_id: item.category_id,
    quantity: item.quantity,
    servings_per_unit: item.servings_per_unit,
    unit: item.unit ?? '',
    expiration_date: item.expiration_date ?? '',
    image_url: item.image_url ?? '',
    note: item.note ?? '',
  }
}

export function EditItem() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'cs') as Lang
  const navigate = useNavigate()
  const { data: item, isLoading } = useItem(id)
  const { data: categories = [] } = useCategories()
  const { data: locations = [] } = useLocations()
  const { update, remove } = useItemMutations()

  const [form, setForm] = useState<ItemFormState>(() => emptyItemForm(lang))
  const [locationId, setLocationId] = useState<string>('')
  const [isOpened, setIsOpened] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setForm(itemToForm(item))
      setLocationId(item.location_id)
      setIsOpened(item.is_opened)
    }
  }, [item])

  if (isLoading) {
    return <p className="py-10 text-center text-slate-400">{t('common.loading')}</p>
  }
  if (!item) {
    return <p className="py-10 text-center text-slate-400">{t('common.none')}</p>
  }

  const toggleOpened = async () => {
    const next = !isOpened
    setIsOpened(next)
    await update.mutateAsync({ id: item.id, is_opened: next })
  }

  const save = async () => {
    setError(null)
    if (!Object.values(form.name_i18n).some((v) => v?.trim())) {
      setError(t('item.nameRequired'))
      return
    }
    setSaving(true)
    try {
      let names = form.name_i18n
      if (missingLangs(names).length > 0) {
        names = await translateMissing(names, form.original_lang ?? lang)
      }
      await update.mutateAsync({
        id: item.id,
        location_id: locationId,
        name_i18n: names,
        original_lang: form.original_lang ?? lang,
        brand: form.brand || null,
        barcode: form.barcode || null,
        category_id: form.category_id,
        quantity: form.quantity,
        servings_per_unit: form.servings_per_unit,
        unit: form.unit || null,
        expiration_date: form.expiration_date || null,
        image_url: form.image_url || null,
        note: form.note || null,
        is_opened: isOpened,
      })
      navigate('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const consume = async () => {
    if (form.quantity > 1) {
      await update.mutateAsync({ id: item.id, quantity: form.quantity - 1 })
    } else {
      await remove.mutateAsync(item.id)
    }
    navigate('/')
  }

  const del = async () => {
    if (!confirm(t('item.deleteConfirm'))) return
    await remove.mutateAsync(item.id)
    navigate('/')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">{t('item.editTitle')}</h1>

      {/* Přepínač otevřeného balení */}
      <button
        type="button"
        onClick={toggleOpened}
        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition active:scale-[0.99] ${
          isOpened
            ? 'border-orange-300 bg-orange-50 text-orange-700'
            : 'border-slate-200 bg-white text-slate-600'
        }`}
      >
        {isOpened ? (
          <PackageOpen className="h-5 w-5 flex-shrink-0 text-orange-500" />
        ) : (
          <Package className="h-5 w-5 flex-shrink-0 text-slate-400" />
        )}
        <span className="font-medium">
          {isOpened ? t('item.opened') : t('item.notOpened')}
        </span>
        <span className="ml-auto text-xs text-slate-400">
          {isOpened ? t('item.toggleClosed') : t('item.toggleOpened')}
        </span>
      </button>

      {/* Přesun do jiného skladu */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t('item.moveTo')}
        </label>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {displayName(loc.name_i18n, lang)}
            </option>
          ))}
        </select>
      </div>

      <ItemForm value={form} onChange={setForm} categories={categories} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={consume}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-green-300 bg-green-50 py-2.5 font-medium text-green-700"
        >
          <Check className="h-4 w-4" />
          {t('item.markConsumed')}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>

      <button
        type="button"
        onClick={del}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-red-600"
      >
        <Trash2 className="h-4 w-4" />
        {t('common.delete')}
      </button>
    </div>
  )
}
