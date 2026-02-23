import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from '@/locales/fr.json';
import en from '@/locales/en.json';

const STORAGE_KEY = 'money-app-language';

function getStoredLocale(): 'fr' | 'en' {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'fr';
    const parsed = JSON.parse(raw);
    const locale = parsed?.state?.locale ?? parsed?.locale;
    return locale === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

const initialLng = getStoredLocale();

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
