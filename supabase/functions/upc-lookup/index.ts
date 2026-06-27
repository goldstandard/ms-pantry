// Supabase Edge Function: upc-lookup
// Dohledá produkt podle čárového kódu v Go-UPC API.
// API klíč je uložený jako secret (GO_UPC_KEY) a nikdy se nedostane do prohlížeče.
//
// Nasazení:  supabase functions deploy upc-lookup
// Secret:    supabase secrets set GO_UPC_KEY=tvuj-klic

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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

  const key = Deno.env.get('GO_UPC_KEY')
  if (!key) {
    // Klíč není nastaven — tichý null, appka přeskočí tento fallback
    return json({ product: null })
  }

  let barcode: string
  try {
    const body = await req.json()
    barcode = String(body.barcode ?? '').trim()
  } catch {
    return json({ product: null })
  }
  if (!barcode) return json({ product: null })

  try {
    const res = await fetch(`https://go-upc.com/api/v1/code/${encodeURIComponent(barcode)}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
    })
    if (!res.ok) return json({ product: null })
    const data = await res.json()
    if (!data?.product) return json({ product: null })

    const p = data.product as Record<string, unknown>
    const name = typeof p.name === 'string' ? p.name.trim() : ''
    if (!name) return json({ product: null })

    return json({
      product: {
        name,
        brand: typeof p.brand === 'string' && p.brand ? p.brand.trim() : null,
        imageUrl: typeof p.imageUrl === 'string' && p.imageUrl ? p.imageUrl : null,
        category: typeof p.category === 'string' ? p.category : '',
      },
    })
  } catch {
    return json({ product: null })
  }
})
