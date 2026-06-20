import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useCategories, useCategoryMutations } from '../hooks/useCategories'
import { translateMissing } from '../lib/translate'
import { displayName } from '../lib/displayName'
import type { Lang } from '../lib/types'

export function Categories() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.resolvedLanguage ?? 'cs') as Lang
  const { data: categories = [] } = useCategories()
  const { create, update, remove } = useCategoryMutations()

  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    try {
      const names = await translateMissing({ [lang]: name }, lang)
      await create.mutateAsync(names)
      setNewName('')
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async (id: string) => {
    const name = editName.trim()
    if (!name) {
      setEditingId(null)
      return
    }
    setBusy(true)
    try {
      const names = await translateMissing({ [lang]: name }, lang)
      await update.mutateAsync({ id, name_i18n: names })
      setEditingId(null)
    } finally {
      setBusy(false)
    }
  }

  const del = async (id: string) => {
    if (!confirm(t('categories.deleteConfirm'))) return
    await remove.mutateAsync(id)
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand'

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">{t('categories.title')}</h1>

      <div className="flex gap-2">
        <input
          className={inputCls}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={t('categories.namePlaceholder')}
        />
        <button
          type="button"
          onClick={add}
          disabled={busy || !newName.trim()}
          className="flex items-center gap-1 rounded-lg bg-brand px-3 font-medium text-white disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {t('common.add')}
        </button>
      </div>

      <ul className="space-y-2">
        {categories.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"
          >
            {editingId === c.id ? (
              <>
                <input
                  autoFocus
                  className={inputCls}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)}
                />
                <button
                  type="button"
                  onClick={() => saveEdit(c.id)}
                  className="rounded-lg p-2 text-brand"
                  aria-label={t('common.save')}
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg p-2 text-slate-400"
                  aria-label={t('common.cancel')}
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 truncate">
                  {displayName(c.name_i18n, lang)}
                  {c.is_default && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                      {t('categories.default')}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(c.id)
                    setEditName(displayName(c.name_i18n, lang))
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:text-slate-600"
                  aria-label={t('common.edit')}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => del(c.id)}
                  className="rounded-lg p-2 text-slate-400 hover:text-red-600"
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </li>
        ))}
        {categories.length === 0 && (
          <li className="py-8 text-center text-slate-400">
            {t('categories.empty')}
          </li>
        )}
      </ul>
    </div>
  )
}
