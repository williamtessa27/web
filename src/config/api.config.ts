export const ApiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  /** URL du serveur WebSocket (collect-app/socket). Ex: http://localhost:3007 */
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3007',
  /** Documentation (sidebar) : en dev localhost:3009, en prod https://docs.kimifinance.com */
  docsUrl: import.meta.env.VITE_DOCS_URL || (import.meta.env.DEV ? 'http://localhost:3009/' : 'https://docs.kimifinance.com'),
  /** Clé site Google reCAPTCHA v2 (page Contact). À créer sur https://www.google.com/recaptcha/admin */
  recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
  storageKeys: {
    token: 'collect_auth_token',
    user: 'collect_user_data',
    theme: 'collect_theme',
  },
};
