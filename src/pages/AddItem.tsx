import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import {
  ItemForm,
  emptyItemForm,
  type ItemFormState,
} from '../components/ItemForm'

// Skener (ZXing) je velký — načítáme ho líně až při prvním skenování.
const BarcodeScanner = lazy(() =>
  import('../components/BarcodeScanner').then((m) => ({
    default: m.BarcodeScanner,
  })),
)
import { useCategories } from '../hooks/useCategories'
import {
  useItemMutations,
  fetchProductProfile,
  upsertProductProfile,
} from '../hooks/useItems'
import { useActiveLocation } from '../hooks/useActiveLocation'
import { lookupBarcode } from '../lib/openfoodfacts'
import { mapOffCategory } from '../lib/categories'
import { translateMissing } from '../lib/translate'
import { mergeNames, missingLangs } from '../lib/displayName'
import type { Category, Lang } from '../lib/types'

export function AddItem() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'cs') as Lang
  const navigate = useNavigate()
  const { data: categories = [] } = useCategories()
  const { activeLocationId } = useActiveLocation()
  const { create } = useItemMutations()

  const [form, setForm] = useState<ItemFormState>(() => emptyItemForm(lang))
  const [scanning, setScanning] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categoryIdForSlug = (cats: Category[], slug: string | null) => {
    if (!slug) return null
    return cats.find((c) => c.slug === slug)?.id ?? null
  }

  const handleDetected = async (code: string) => {
    setScanning(false)
    setError(null)
    setBanner(t('item.lookupLoading'))

    let next: ItemFormState = { ...form, barcode: code }

    // 1) Naučený profil podle čárového kódu
    const profile = await fetchProductProfile(code).catch(() => null)
    if (profile) {
      next = {
        ...next,
        name_i18n: mergeNames(next.name_i18n, profile.name_i18n ?? {}),
        brand: next.brand || profile.brand || '',
        category_id: next.category_id ?? profile.default_category_id ?? null,
        servings_per_unit: next.servings_per_unit ?? profile.default_servings ?? null,
        unit: next.unit || profile.default_unit || '',
      }
    }

    // 2) Open Food Facts
    const off = await lookupBarcode(code)
    if (off) {
      next = {
        ...next,
        name_i18n: mergeNames(next.name_i18n, off.names),
        brand: next.brand || off.brand || '',
        category_id:
          next.category_id ?? categoryIdForSlug(categories, mapOffCategory(off.categoryTags)),
        image_url: next.image_url || off.imageUrl || '',
        original_lang: next.original_lang ?? (off.names.cs ? 'cs' : lang),
      }
    }

    setForm(next)

    // 3) Doplnění chybějících překladů názvu
    const hasAnyName = Object.values(next.name_i18n).some(Boolean)
    if (hasAnyName && missingLangs(next.name_i18n).length > 0) {
      setBanner(t('item.translating'))
      const names = await translateMissing(next.name_i18n, next.original_lang ?? lang)
      next = { ...next, name_i18n: names }
      setForm(next)
    }

    if (off) setBanner(t('item.lookupFound'))
    else if (profile) setBanner(t('item.learnedFromProfile'))
    else setBanner(t('item.lookupNotFound'))
  }

  const save = async () => {
    setError(null)
    if (!activeLocationId) return
    if (!Object.values(form.name_i18n).some((v) => v?.trim())) {
      setError(t('item.nameRequired'))
      return
    }
    setSaving(true)
    try {
      // Před uložením doplň překlady (pro ručně zadané názvy).
      let names = form.name_i18n
      if (missingLangs(names).length > 0) {
        names = await translateMissing(names, form.original_lang ?? lang)
      }

      await create.mutateAsync({
        location_id: activeLocationId,
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
      })

      // Učení: zapamatuj profil podle čárového kódu.
      if (form.barcode) {
        await upsertProductProfile({
          barcode: form.barcode,
          name_i18n: names,
          brand: form.brand || null,
          default_category_id: form.category_id,
          default_servings: form.servings_per_unit,
          default_unit: form.unit || null,
        }).catch(() => undefined)
      }

      navigate('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">{t('item.newTitle')}</h1>

      <ItemForm
        value={form}
        onChange={setForm}
        categories={categories}
        onScan={() => setScanning(true)}
        banner={
          banner ? (
            <div className="flex items-center gap-2 rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">
              <Info className="h-4 w-4 flex-shrink-0" />
              {banner}
            </div>
          ) : null
        }
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex-1 rounded-lg border border-slate-300 py-2.5 font-medium text-slate-600"
        >
          {t('common.cancel')}
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

      {scanning && (
        <Suspense fallback={null}>
          <BarcodeScanner
            onDetected={handleDetected}
            onClose={() => setScanning(false)}
          />
        </Suspense>
      )}
    </div>
  )
}
