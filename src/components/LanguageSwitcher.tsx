import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { SUPPORTED_LANGS } from '../lib/types'

const SHORT: Record<string, string> = { cs: 'CS', en: 'EN', zh: '中' }

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? 'cs'

  return (
    <label className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700">
      <Languages className="h-4 w-4 text-slate-400" />
      <select
        aria-label="Language"
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="bg-transparent pr-1 font-medium outline-none"
      >
        {SUPPORTED_LANGS.map((l) => (
          <option key={l} value={l}>
            {SHORT[l]}
          </option>
        ))}
      </select>
    </label>
  )
}
