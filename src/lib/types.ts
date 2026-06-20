export type Lang = 'cs' | 'en' | 'zh'

export const SUPPORTED_LANGS: Lang[] = ['cs', 'en', 'zh']

/** Název ve více jazycích, např. { cs: "Rajčata", en: "Tomatoes", zh: "番茄" } */
export type I18nText = Partial<Record<Lang, string>>

export interface Location {
  id: string
  user_id: string
  name_i18n: I18nText
  critical_days: number
  soon_days: number
  is_default: boolean
  sort_order: number
}

export interface Category {
  id: string
  user_id: string
  name_i18n: I18nText
  slug: string | null
  is_default: boolean
  sort_order: number
}

export interface Item {
  id: string
  user_id: string
  location_id: string
  name_i18n: I18nText
  original_lang: Lang | null
  brand: string | null
  barcode: string | null
  category_id: string | null
  quantity: number
  servings_per_unit: number | null
  unit: string | null
  expiration_date: string | null
  image_url: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface ProductProfile {
  user_id: string
  barcode: string
  name_i18n: I18nText
  brand: string | null
  default_category_id: string | null
  default_servings: number | null
  default_unit: string | null
  times_seen: number
  updated_at: string
}

/** Data pro vytvoření/úpravu položky (bez serverem generovaných polí). */
export type ItemInput = Omit<
  Item,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>
