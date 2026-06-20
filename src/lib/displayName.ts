import { SUPPORTED_LANGS, type I18nText, type Lang } from './types'

/**
 * Vybere název ve zvoleném jazyce s fallbackem:
 * zvolený jazyk → cs → en → zh → kterýkoli dostupný.
 */
export function displayName(
  name: I18nText | null | undefined,
  lang: string,
): string {
  if (!name) return ''
  const chosen = name[lang as Lang]
  if (chosen) return chosen
  for (const fb of SUPPORTED_LANGS) {
    const val = name[fb]
    if (val) return val
  }
  const any = Object.values(name).find(Boolean)
  return any ?? ''
}

/** Sloučí zdroj názvů s prioritou existujících hodnot (nepřepisuje vyplněné). */
export function mergeNames(base: I18nText, extra: I18nText): I18nText {
  const out: I18nText = { ...base }
  for (const lang of SUPPORTED_LANGS) {
    if (!out[lang] && extra[lang]) out[lang] = extra[lang]
  }
  return out
}

/** Vrátí jazyky, které v názvu chybí nebo jsou prázdné. */
export function missingLangs(name: I18nText): Lang[] {
  return SUPPORTED_LANGS.filter((l) => !name[l]?.trim())
}
