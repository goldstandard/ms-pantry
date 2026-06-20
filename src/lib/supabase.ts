import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True, pokud jsou vyplněné env proměnné a můžeme se připojit k databázi. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Klient se vytvoří jen když je nakonfigurovaný; jinak je null a appka
 * zobrazí setup obrazovku (aby šlo UI prohlédnout i bez backendu).
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Pohodlný getter, který hodí srozumitelnou chybu, když klient chybí. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase není nakonfigurovaný. Vyplň VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY v .env.local.',
    )
  }
  return supabase
}
