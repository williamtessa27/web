export const ApiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  /** URL du serveur WebSocket (collect-app/socket). Ex: http://localhost:3002 */
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3002',
  storageKeys: {
    token: 'collect_auth_token',
    user: 'collect_user_data',
    theme: 'collect_theme',
  },
};
