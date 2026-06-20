// Supabase Edge Function: translate
// Přeloží text do zvolených cílových jazyků přes DeepL.
// API klíč je uložený jako secret (DEEPL_API_KEY) a nikdy se nedostane do prohlížeče.
//
// Nasazení:  supabase functions deploy translate
// Secret:    supabase secrets set DEEPL_API_KEY=xxxxxxxx
//
// Když klíč chybí nebo překlad selže, vrací prázdné translations — appka pak
// jednoduše zobrazí původní název.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Naše kódy jazyků → DeepL kódy
const SOURCE_LANG: Record<string, string> = { cs: 'CS', en: 'EN', zh: 'ZH' }
const TARGET_LANG: Record<string, string> = { cs: 'CS', en: 'EN-US', zh: 'ZH' }

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, source, targets } = await req.json()
    const key = Deno.env.get('DEEPL_API_KEY')

    if (!key || !text || !Array.isArray(targets)) {
      return json({ translations: {} })
    }

    // Free-tier klíče končí na ":fx" a používají jiný endpoint.
    const endpoint = key.endsWith(':fx')
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate'

    const translations: Record<string, string> = {}

    for (const target of targets) {
      const targetLang = TARGET_LANG[target as string]
      if (!targetLang) continue

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          target_lang: targetLang,
          source_lang: SOURCE_LANG[source as string],
        }),
      })

      if (!res.ok) continue
      const data = await res.json()
      const translated = data?.translations?.[0]?.text
      if (translated) translations[target] = translated
    }

    return json({ translations })
  } catch (e) {
    return json({ translations: {}, error: String(e) })
  }
})
