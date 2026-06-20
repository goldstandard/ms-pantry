import { supabase } from './supabase'
import { mergeNames, missingLangs } from './displayName'
import { SUPPORTED_LANGS, type I18nText, type Lang } from './types'

/**
 * Doplní chybějící jazyky v názvu strojovým překladem (Edge Function `translate`
 * → DeepL). Když překlad selže nebo není nakonfigurovaný, vrátí původní název
 * beze změny — appka tím pádem funguje i bez překladače.
 */
export async function translateMissing(
  name: I18nText,
  sourceLang?: Lang,
): Promise<I18nText> {
  const targets = missingLangs(name)
  if (targets.length === 0) return name

  const source =
    sourceLang && name[sourceLang]
      ? sourceLang
      : SUPPORTED_LANGS.find((l) => name[l]?.trim())
  if (!source || !name[source]) return name
  if (!supabase) return name

  try {
    const { data, error } = await supabase.functions.invoke<{
      translations: I18nText
    }>('translate', {
      body: { text: name[source], source, targets },
    })
    if (error || !data?.translations) return name
    return mergeNames(name, data.translations)
  } catch {
    return name
  }
}
