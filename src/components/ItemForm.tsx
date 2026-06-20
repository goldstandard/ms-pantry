import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScanLine, ChevronDown } from 'lucide-react'
import { SUPPORTED_LANGS, type Category, type I18nText, type Lang } from '../lib/types'
import { displayName } from '../lib/displayName'

export interface ItemFormState {
  name_i18n: I18nText
  original_lang: Lang | null
  brand: string
  barcode: string
  category_id: string | null
  quantity: number
  servings_per_unit: number | null
  unit: string
  expiration_date: string
  image_url: string
  note: string
}

export function emptyItemForm(lang: Lang): ItemFormState {
  return {
    name_i18n: {},
    original_lang: lang,
    brand: '',
    barcode: '',
    category_id: null,
    quantity: 1,
    servings_per_unit: null,
    unit: '',
    expiration_date: '',
    image_url: '',
    note: '',
  }
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand'
const labelCls = 'mb-1 block text-sm font-medium text-slate-700'

export function ItemForm({
  value,
  onChange,
  categories,
  onScan,
  onDetected,
  banner,
}: {
  value: ItemFormState
  onChange: (next: ItemFormState) => void
  categories: Category[]
  onScan?: () => void
  onDetected?: (code: string) => void
  banner?: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'cs') as Lang
  const [showLangs, setShowLangs] = useState(false)

  const set = (patch: Partial<ItemFormState>) => onChange({ ...value, ...patch })
  const setName = (l: Lang, v: string) =>
    set({ name_i18n: { ...value.name_i18n, [l]: v } })

  return (
    <div className="space-y-4">
      {onScan && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onScan}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 font-medium text-white active:scale-[0.99]"
          >
            <ScanLine className="h-5 w-5" /> {t('item.scan')}
          </button>
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder={t('item.barcodeManual')}
              value={value.barcode}
              onChange={(e) => set({ barcode: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && value.barcode.trim() && onDetected) {
                  e.preventDefault()
                  onDetected(value.barcode.trim())
                }
              }}
            />
            {onDetected && (
              <button
                type="button"
                onClick={() => { if (value.barcode.trim()) onDetected(value.barcode.trim()) }}
                disabled={!value.barcode.trim()}
                className="rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 disabled:opacity-40"
              >
                {t('item.barcodeSearch')}
              </button>
            )}
          </div>
        </div>
      )}

      {banner}

      <div>
        <label className={labelCls}>{t('item.name')}</label>
        <div className="flex items-start gap-3">
          {value.image_url && (
            <img
              src={value.image_url}
              alt=""
              className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
            />
          )}
          <input
            className={inputCls}
            value={value.name_i18n[lang] ?? ''}
            onChange={(e) => setName(lang, e.target.value)}
            placeholder={displayName(value.name_i18n, lang)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowLangs((s) => !s)}
          className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500"
        >
          <ChevronDown
            className={`h-3 w-3 transition ${showLangs ? 'rotate-180' : ''}`}
          />
          {t('item.namesByLang')}
        </button>
        {showLangs && (
          <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-2">
            {SUPPORTED_LANGS.map((l) => (
              <div key={l} className="flex items-center gap-2">
                <span className="w-7 text-xs font-semibold uppercase text-slate-400">
                  {l}
                </span>
                <input
                  className={inputCls}
                  value={value.name_i18n[l] ?? ''}
                  onChange={(e) => setName(l, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t('item.quantity')}</label>
          <input
            type="number"
            min={1}
            className={inputCls}
            value={value.quantity}
            onChange={(e) =>
              set({ quantity: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </div>
        <div>
          <label className={labelCls}>
            {t('item.servings')}{' '}
            <span className="font-normal text-slate-400">
              ({t('common.optional')})
            </span>
          </label>
          <input
            type="number"
            min={0}
            step="0.5"
            className={inputCls}
            value={value.servings_per_unit ?? ''}
            onChange={(e) =>
              set({
                servings_per_unit:
                  e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>{t('item.category')}</label>
        <select
          className={inputCls}
          value={value.category_id ?? ''}
          onChange={(e) => set({ category_id: e.target.value || null })}
        >
          <option value="">{t('inventory.uncategorized')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {displayName(c.name_i18n, lang)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>{t('item.expiration')}</label>
        <input
          type="date"
          className={inputCls}
          value={value.expiration_date}
          onChange={(e) => set({ expiration_date: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            {t('item.brand')}{' '}
            <span className="font-normal text-slate-400">
              ({t('common.optional')})
            </span>
          </label>
          <input
            className={inputCls}
            value={value.brand}
            onChange={(e) => set({ brand: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>
            {t('item.unit')}{' '}
            <span className="font-normal text-slate-400">
              ({t('common.optional')})
            </span>
          </label>
          <input
            className={inputCls}
            placeholder={t('item.unitPlaceholder')}
            value={value.unit}
            onChange={(e) => set({ unit: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>
          {t('item.note')}{' '}
          <span className="font-normal text-slate-400">
            ({t('common.optional')})
          </span>
        </label>
        <textarea
          className={inputCls}
          rows={2}
          value={value.note}
          onChange={(e) => set({ note: e.target.value })}
        />
      </div>

      {value.barcode && (
        <p className="text-xs text-slate-400">
          {t('item.barcode')}: {value.barcode}
        </p>
      )}
    </div>
  )
}
