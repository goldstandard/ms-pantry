import type { I18nText } from './types'

export interface OffProduct {
  barcode: string
  names: I18nText
  brand: string | null
  imageUrl: string | null
  categoryTags: string[]
  quantity: string | null
}

// ─── Open Food Facts ──────────────────────────────────────────────────────────

const OFF_FIELDS = [
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

async function lookupOpenFoodFacts(barcode: string): Promise<OffProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OFF_FIELDS}`
  let data: { status?: number; product?: Record<string, unknown> }
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
  // Generický název jako fallback (předpokládáme CZ pro produkty z regionu).
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

// ─── UPCitemdb (fallback #1) ──────────────────────────────────────────────────
// Free trial: 100 req/den, bez API klíče.
// Docs: https://www.upcitemdb.com/api/explorer#!/lookup/get_trial_lookup

async function lookupUpcitemdb(barcode: string): Promise<OffProduct | null> {
  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`
  let data: { code?: string; items?: Record<string, unknown>[] }
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }
  if (data.code !== 'OK' || !data.items?.length) return null
  const item = data.items[0] as Record<string, unknown>

  const title = typeof item.title === 'string' ? item.title.trim() : ''
  if (!title) return null

  const brand = typeof item.brand === 'string' && item.brand ? item.brand.trim() : null
  const category = typeof item.category === 'string' ? item.category : ''
  const images = Array.isArray(item.images) ? (item.images as string[]) : []

  return {
    barcode,
    // UPCitemdb vrací název typicky v angličtině; DeepL doplní cs a zh.
    names: { en: title },
    brand,
    imageUrl: images[0] ?? null,
    categoryTags: category ? [`en:${category.toLowerCase().replace(/\s+/g, '-')}`] : [],
    quantity: null,
  }
}

// ─── Go-UPC (fallback #2) ─────────────────────────────────────────────────────
// Free: 150 req/měsíc; klíč na vyžádání e-mailem na go-upc.com.
// Klíč uložit jako VITE_GO_UPC_KEY v .env.local a v nastavení Vercelu.
// Bez klíče se tento fallback tiše přeskočí.

async function lookupGoUpc(barcode: string): Promise<OffProduct | null> {
  const key = import.meta.env.VITE_GO_UPC_KEY as string | undefined
  if (!key) return null

  const url = `https://go-upc.com/api/v1/code/${encodeURIComponent(barcode)}`
  let data: { product?: Record<string, unknown> }
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    })
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }
  if (!data.product) return null
  const p = data.product as Record<string, unknown>

  const name = typeof p.name === 'string' ? p.name.trim() : ''
  if (!name) return null

  const brand = typeof p.brand === 'string' && p.brand ? p.brand.trim() : null
  const imageUrl = typeof p.imageUrl === 'string' && p.imageUrl ? p.imageUrl : null
  const category = typeof p.category === 'string' ? p.category : ''

  return {
    barcode,
    names: { en: name },
    brand,
    imageUrl,
    categoryTags: category ? [`en:${category.toLowerCase().replace(/\s+/g, '-')}`] : [],
    quantity: null,
  }
}

// ─── Veřejné API ──────────────────────────────────────────────────────────────

/**
 * Dohledá produkt podle čárového kódu postupně ve třech databázích:
 * 1. Open Food Facts — nejlepší pokrytí potravin, lokalizované názvy
 * 2. UPCitemdb — globální pokrytí, bez API klíče, 100 req/den (free trial)
 * 3. Go-UPC — 150 req/měsíc; vyžaduje VITE_GO_UPC_KEY v .env.local
 *
 * Vrací výsledek prvního úspěšného zdroje, nebo null.
 */
export async function lookupBarcode(barcode: string): Promise<OffProduct | null> {
  return (
    (await lookupOpenFoodFacts(barcode)) ??
    (await lookupUpcitemdb(barcode)) ??
    (await lookupGoUpc(barcode))
  )
}
