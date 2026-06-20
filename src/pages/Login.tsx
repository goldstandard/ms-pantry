import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { MailCheck, Boxes } from 'lucide-react'
import { requireSupabase } from '../lib/supabase'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    try {
      const sb = requireSupabase()
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) throw error
      setSent(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white">
            <Boxes className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t('app.title')}</h1>
          <p className="text-sm text-slate-500">{t('app.tagline')}</p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm text-green-800">
            <MailCheck className="mx-auto mb-2 h-8 w-8 text-green-600" />
            {t('auth.checkEmail', { email })}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="text-center text-lg font-semibold text-slate-800">
              {t('auth.loginTitle')}
            </h2>
            <p className="text-center text-sm text-slate-500">
              {t('auth.loginSubtitle')}
            </p>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailLabel')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand"
            />
            {error && (
              <p className="text-center text-sm text-red-600">{t('auth.error')}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60"
            >
              {loading ? t('auth.sending') : t('auth.sendLink')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
