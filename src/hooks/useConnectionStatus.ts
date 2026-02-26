import { useState, useEffect, useRef, useCallback } from 'react';
import { ApiConfig } from '@/config/api.config';

export type ConnectionState = 'online' | 'offline' | 'server-unreachable';

/** Délai avant de considérer le serveur comme injoignable (ms). */
const PING_TIMEOUT = 8000;
/** Intervalle entre deux vérifications du serveur quand le navigateur est "online" (ms). */
const PING_INTERVAL = 30000;

/**
 * Hook de détection de la connexion internet (style Gmail).
 * - Utilise navigator.onLine pour l'état "offline" du navigateur.
 * - Optionnellement vérifie périodiquement que le serveur API répond (connexion WiFi sans internet).
 */
export function useConnectionStatus() {
  const [online, setOnline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine);
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOfflineRef = useRef(false);
  const backOnlineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pingServer = useCallback(async (): Promise<boolean> => {
    try {
      const base = ApiConfig.baseUrl.replace(/\/$/, '');
      const healthUrl = `${base}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);
      await fetch(healthUrl, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Écouter les événements online/offline du navigateur
  useEffect(() => {
    const handleOnline = () => {
      if (wasOfflineRef.current) {
        setShowBackOnline(true);
        backOnlineTimeoutRef.current = setTimeout(() => {
          setShowBackOnline(false);
          wasOfflineRef.current = false;
        }, 4000);
      }
      setOnline(true);
      setServerReachable(null);
    };

    const handleOffline = () => {
      wasOfflineRef.current = true;
      setOnline(false);
      setServerReachable(false);
      setShowBackOnline(false);
      if (backOnlineTimeoutRef.current) {
        clearTimeout(backOnlineTimeoutRef.current);
        backOnlineTimeoutRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (backOnlineTimeoutRef.current) clearTimeout(backOnlineTimeoutRef.current);
    };
  }, []);

  // Vérification périodique du serveur quand le navigateur est "online"
  useEffect(() => {
    if (!online) return;

    let cancelled = false;
    const check = async () => {
      const ok = await pingServer();
      if (!cancelled) setServerReachable(ok);
    };

    check();
    const intervalId = setInterval(check, PING_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [online, pingServer]);

  const state: ConnectionState = !online
    ? 'offline'
    : serverReachable === false
      ? 'server-unreachable'
      : 'online';

  return {
    online,
    serverReachable: serverReachable ?? true,
    state,
    showBackOnline,
  };
}
