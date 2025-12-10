import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
import en from '../locales/en/translation.json';
import es from '../locales/es/translation.json';

/**
 * PUBLIC_INTERFACE
 * Initialize i18next for the React app.
 * - Default language: en
 * - Supported: en, es (extendable)
 * - Persists user choice in localStorage ("i18nextLng")
 * - Sets document dir="rtl" for RTL languages (ar, he, fa, ur, etc.)
 */
const STORAGE_KEY = 'i18nextLng';

// Define which languages are RTL to set document direction
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);

// Load persisted language if available
function getInitialLang() {
  const persisted = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (persisted) return persisted;
  // use browser setting as a hint
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.split('-')[0];
  }
  return 'en';
}

// Set dir attribute based on language direction
function applyDirection(lang) {
  const isRtl = RTL_LANGS.has(lang);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: getInitialLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    cleanCode: true,
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

// Persist language choice and apply dir whenever language changes
i18n.on('languageChanged', (lng) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore storage failures
  }
  applyDirection(lng);
});

// Apply initial direction
applyDirection(i18n.language || 'en');

export default i18n;
