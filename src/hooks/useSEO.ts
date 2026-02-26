import { useEffect } from 'react';
import { SeoConfig } from '@/config/seo.config';

export type SEOOptions = {
  title?: string;
  description?: string;
  /** Image pour partage (URL absolue recommandée). */
  image?: string;
  /** URL canonique de la page. */
  canonical?: string;
  /** Type OG (website, article, …). */
  ogType?: string;
  /** Ne pas indexer (noindex). */
  noIndex?: boolean;
};

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let el = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

/**
 * Hook pour définir le titre et les meta SEO (description, Open Graph, Twitter) de la page.
 * À utiliser dans les pages publiques (landing, contact, login, register).
 */
export function useSEO(options: SEOOptions = {}) {
  const {
    title,
    description = SeoConfig.defaultDescription,
    image = SeoConfig.defaultOgImage,
    canonical,
    ogType = 'website',
    noIndex = false,
  } = options;

  const fullTitle = title ? `${title} | ${SeoConfig.siteName}` : SeoConfig.defaultTitle;
  const origin = typeof window !== 'undefined' ? window.location.origin : SeoConfig.baseUrl || '';
  const url = canonical || (typeof window !== 'undefined' ? window.location.href : '');
  const imageUrl = image.startsWith('http') ? image : `${origin}${image.startsWith('/') ? '' : '/'}${image}`;

  useEffect(() => {
    document.title = fullTitle;

    setMeta('description', description);

    // Open Graph
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', imageUrl, 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:type', ogType, 'property');
    setMeta('og:locale', SeoConfig.locale, 'property');
    setMeta('og:site_name', SeoConfig.siteName, 'property');

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', imageUrl);
    if (SeoConfig.twitterHandle) setMeta('twitter:site', SeoConfig.twitterHandle);

    if (noIndex) setMeta('robots', 'noindex, nofollow');
  }, [fullTitle, description, imageUrl, url, ogType, noIndex]);
}
