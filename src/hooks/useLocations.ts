import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requireSupabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { I18nText, Location } from '../lib/types'

export function useLocations() {
  const { session, configured } = useAuth()
  return useQuery({
    queryKey: ['locations'],
    enabled: configured && !!session,
    queryFn: async (): Promise<Location[]> => {
      const sb = requireSupabase()
      const { data, error } = await sb
        .from('locations')
        .select('*')
        .order('sort_order')
        .order('created_at')
      if (error) throw error
      return data as Location[]
    },
  })
}

export interface LocationInput {
  name_i18n: I18nText
  critical_days: number
  soon_days: number
}

export function useLocationMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['locations'] })

  const create = useMutation({
    mutationFn: async (input: LocationInput) => {
      const sb = requireSupabase()
      const { error } = await sb.from('locations').insert(input)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<LocationInput>) => {
      const sb = requireSupabase()
      const { error } = await sb.from('locations').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const sb = requireSupabase()
      const { error } = await sb.from('locations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
