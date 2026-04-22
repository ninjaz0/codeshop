import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.js'
import zhTW from './locales/zh-TW.js'
import en from './locales/en.js'
import ja from './locales/ja.js'
import ru from './locales/ru.js'

const savedLocale = localStorage.getItem('locale') || 'zh-CN'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'zh-CN',
  messages: { 'zh-CN': zhCN, 'zh-TW': zhTW, en, ja, ru },
})

export default i18n

export const availableLocales = [
  { code: 'zh-CN', flag: '🇨🇳' },
  { code: 'zh-TW', flag: '🇹🇼' },
  { code: 'en', flag: '🇺🇸' },
  { code: 'ja', flag: '🇯🇵' },
  { code: 'ru', flag: '🇷🇺' },
]

export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  document.documentElement.lang = locale
}
