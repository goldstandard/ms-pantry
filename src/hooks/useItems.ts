import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requireSupabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useActiveLocation } from './useActiveLocation'
import type { Item, ItemInput, ProductProfile } from '../lib/types'

export function useItems() {
  const { session, configured } = useAuth()
  const { activeLocationId } = useActiveLocation()
  return useQuery({
    queryKey: ['items', activeLocationId],
    enabled: configured && !!session && !!activeLocationId,
    queryFn: async (): Promise<Item[]> => {
      const sb = requireSupabase()
      const { data, error } = await sb
        .from('items')
        .select('*')
        .eq('location_id', activeLocationId)
      if (error) throw error
      return data as Item[]
    },
  })
}

export function useItem(id: string | undefined) {
  const { session, configured } = useAuth()
  return useQuery({
    queryKey: ['item', id],
    enabled: configured && !!session && !!id,
    queryFn: async (): Promise<Item | null> => {
      if (!id) return null
      const sb = requireSupabase()
      const { data, error } = await sb.from('items').select('*').eq('id', id).maybeSingle()
      if (error) throw error
      return (data as Item) ?? null
    },
  })
}

export function useItemMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['items'] })
    qc.invalidateQueries({ queryKey: ['item'] })
  }

  const create = useMutation({
    mutationFn: async (input: ItemInput) => {
      const sb = requireSupabase()
      const { error } = await sb.from('items').insert(input)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<ItemInput>) => {
      const sb = requireSupabase()
      const { error } = await sb
        .from('items')
        .update(patch)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const sb = requireSupabase()
      const { error } = await sb.from('items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

/** Naučený profil produktu podle čárového kódu (nebo null). */
export async function fetchProductProfile(
  barcode: string,
): Promise<ProductProfile | null> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('product_profiles')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle()
  if (error) return null
  return (data as ProductProfile) ?? null
}

export type ProductProfileInput = Pick<
  ProductProfile,
  'barcode' | 'name_i18n' | 'brand' | 'default_category_id' | 'default_servings' | 'default_unit'
>

/** Uloží/aktualizuje naučený profil a navýší times_seen (1 DB roundtrip, atomicky). */
export async function upsertProductProfile(
  profile: ProductProfileInput,
): Promise<void> {
  const sb = requireSupabase()
  const { error } = await sb.rpc('upsert_product_profile', {
    p_barcode:             profile.barcode,
    p_name_i18n:           profile.name_i18n,
    p_brand:               profile.brand ?? null,
    p_default_category_id: profile.default_category_id ?? null,
    p_default_servings:    profile.default_servings ?? null,
    p_default_unit:        profile.default_unit ?? null,
  })
  if (error) throw error
}
