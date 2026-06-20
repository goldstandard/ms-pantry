import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requireSupabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Category, I18nText } from '../lib/types'

export function useCategories() {
  const { session, configured } = useAuth()
  return useQuery({
    queryKey: ['categories'],
    enabled: configured && !!session,
    queryFn: async (): Promise<Category[]> => {
      const sb = requireSupabase()
      const { data, error } = await sb
        .from('categories')
        .select('*')
        .order('sort_order')
        .order('created_at')
      if (error) throw error
      return data as Category[]
    },
  })
}

export function useCategoryMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] })

  const create = useMutation({
    mutationFn: async (name_i18n: I18nText) => {
      const sb = requireSupabase()
      const { data, error } = await sb
        .from('categories')
        .insert({ name_i18n })
        .select()
        .single()
      if (error) throw error
      return data as Category
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, name_i18n }: { id: string; name_i18n: I18nText }) => {
      const sb = requireSupabase()
      const { error } = await sb.from('categories').update({ name_i18n }).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const sb = requireSupabase()
      const { error } = await sb.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
