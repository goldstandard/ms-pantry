import type { I18nText } from './types'

export interface OffProduct {
  barcode: string
  names: I18nText
  brand: string | null
  imageUrl: string | null
  categoryTags: string[]
  quantity: string | null
}

const FIELDS = [
  'product_name',
  'product_name_cs',
  'product_name_en',
  'product_name_zh',
  'brands',
  'image_front_small_url',
  'image_url',
  'categories_tags',
  'quantity',
].join(',')

/**
 * Dohledá produkt podle čárového kódu v Open Food Facts.
 * Vrací null, pokud produkt neexistuje nebo se dotaz nepovede.
 */
export async function lookupBarcode(barcode: string): Promise<OffProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode,
  )}.json?fields=${FIELDS}`
  let data: {
    status?: number
    product?: Record<string, unknown>
  }
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }
  if (data.status !== 1 || !data.product) return null
  const p = data.product as Record<string, string | string[]>

  const names: I18nText = {}
  if (typeof p.product_name_cs === 'string' && p.product_name_cs) names.cs = p.product_name_cs
  if (typeof p.product_name_en === 'string' && p.product_name_en) names.en = p.product_name_en
  if (typeof p.product_name_zh === 'string' && p.product_name_zh) names.zh = p.product_name_zh
  // Generický název jako fallback (typicky v jazyce země nákupu — předpokládáme CZ).
  if (Object.keys(names).length === 0 && typeof p.product_name === 'string' && p.product_name) {
    names.cs = p.product_name
  }

  const brandsRaw = typeof p.brands === 'string' ? p.brands : ''
  const brand = brandsRaw ? brandsRaw.split(',')[0].trim() : null

  const imageUrl =
    (typeof p.image_front_small_url === 'string' && p.image_front_small_url) ||
    (typeof p.image_url === 'string' && p.image_url) ||
    null

  return {
    barcode,
    names,
    brand,
    imageUrl,
    categoryTags: Array.isArray(p.categories_tags) ? (p.categories_tags as string[]) : [],
    quantity: typeof p.quantity === 'string' ? p.quantity : null,
  }
}
