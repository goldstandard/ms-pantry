import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import cs from '../locales/cs/translation.json'
import en from '../locales/en/translation.json'
import zh from '../locales/zh/translation.json'
import { SUPPORTED_LANGS } from './types'

export const LANG_STORAGE_KEY = 'ms-pantry-lang'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      cs: { translation: cs },
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: 'cs',
    supportedLngs: SUPPORTED_LANGS,
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

export default i18n
