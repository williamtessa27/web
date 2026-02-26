/**
 * Configuration SEO centralisée.
 * VITE_APP_URL : URL canonique du site (ex. https://kimifinance.com)
 */

const baseUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');

export const SeoConfig = {
  siteName: 'Kimifinance',
  defaultTitle: 'Kimifinance — Collecte de paiements simplifiée',
  defaultDescription:
    'Application de collecte de paiements journaliers. Gérez vos collecteurs, suivez les paiements en temps réel, même sans connexion. Offline, tableaux de bord, commissions.',
  baseUrl,
  /** Image par défaut pour partage (Open Graph / Twitter). Mettre une URL absolue en prod. */
  defaultOgImage: `${baseUrl}/logo_collect.png`,
  locale: 'fr_FR',
  twitterHandle: '',
} as const;
