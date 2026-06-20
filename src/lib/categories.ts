import type { I18nText } from './types'

export interface DefaultCategory {
  slug: string
  name_i18n: I18nText
}

/**
 * Výchozí kategorie ve třech jazycích. Tento seznam je zrcadlem seedu
 * v `supabase/schema.sql` — slug slouží jako stabilní klíč pro mapování
 * z Open Food Facts.
 */
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { slug: 'canned', name_i18n: { cs: 'Konzervy', en: 'Canned goods', zh: '罐头' } },
  { slug: 'pasta_rice', name_i18n: { cs: 'Těstoviny a rýže', en: 'Pasta & rice', zh: '意面与米饭' } },
  { slug: 'legumes', name_i18n: { cs: 'Luštěniny', en: 'Legumes', zh: '豆类' } },
  { slug: 'drinks', name_i18n: { cs: 'Nápoje', en: 'Drinks', zh: '饮料' } },
  { slug: 'spices_sauces', name_i18n: { cs: 'Koření a omáčky', en: 'Spices & sauces', zh: '调料与酱汁' } },
  { slug: 'sweets', name_i18n: { cs: 'Sladkosti', en: 'Sweets', zh: '甜食' } },
  { slug: 'bakery', name_i18n: { cs: 'Trvanlivé pečivo', en: 'Bakery (shelf-stable)', zh: '烘焙食品' } },
  { slug: 'dairy', name_i18n: { cs: 'Mléčné výrobky', en: 'Dairy', zh: '乳制品' } },
  { slug: 'frozen', name_i18n: { cs: 'Mražené', en: 'Frozen', zh: '冷冻食品' } },
  { slug: 'oils_fats', name_i18n: { cs: 'Oleje a tuky', en: 'Oils & fats', zh: '油脂' } },
  { slug: 'breakfast', name_i18n: { cs: 'Snídaně', en: 'Breakfast', zh: '早餐' } },
  { slug: 'other', name_i18n: { cs: 'Ostatní', en: 'Other', zh: '其他' } },
]

/** Pořadí pravidel záleží — specifičtější dřív než obecnější. */
const OFF_TAG_RULES: { slug: string; needles: string[] }[] = [
  { slug: 'frozen', needles: ['frozen'] },
  { slug: 'canned', needles: ['canned', 'tinned', 'conserve'] },
  { slug: 'pasta_rice', needles: ['pasta', 'pastas', 'noodle', 'rice', 'rices'] },
  { slug: 'legumes', needles: ['legume', 'beans', 'lentil', 'chickpea', 'pulses'] },
  { slug: 'drinks', needles: ['beverage', 'drink', 'water', 'juice', 'soda', 'tea', 'coffee'] },
  { slug: 'spices_sauces', needles: ['sauce', 'spice', 'condiment', 'seasoning', 'ketchup', 'mustard', 'vinegar'] },
  { slug: 'sweets', needles: ['sweet', 'candy', 'chocolate', 'biscuit', 'cookie', 'snack', 'confection'] },
  { slug: 'bakery', needles: ['bread', 'bakery', 'cracker', 'rusk', 'toast'] },
  { slug: 'dairy', needles: ['dairy', 'dairies', 'milk', 'cheese', 'yogurt', 'yoghurt', 'butter'] },
  { slug: 'oils_fats', needles: ['oil', 'fat', 'margarine', 'lard'] },
  { slug: 'breakfast', needles: ['breakfast', 'cereal', 'muesli', 'granola', 'oat'] },
]

/** Z OFF `categories_tags` (např. `en:canned-foods`) odhadne náš slug. */
export function mapOffCategory(tags: string[]): string | null {
  const haystack = tags.join(' ').toLowerCase()
  for (const rule of OFF_TAG_RULES) {
    if (rule.needles.some((n) => haystack.includes(n))) return rule.slug
  }
  return null
}
