import { io, Socket } from 'socket.io-client';
import { ApiConfig } from '@/config/api.config';

let socket: Socket | null = null;
let socketConnectErrorLogged = false;

export type NotificationPayload = {
  id: string;
  type: string;
  titre: string;
  message: string;
  idEntite?: string | null;
  typeEntite?: string | null;
  lu: boolean;
  createdAt: string;
};

/**
 * Connecte au serveur WebSocket et écoute les événements notification / notification_count.
 * À appeler avec le token JWT (ex: depuis le store auth).
 * Si le serveur socket n'est pas démarré (ex: port 3007), la connexion échoue sans bloquer l'app.
 */
export function connectNotificationSocket(
  token: string | null,
  onNotification: (data: NotificationPayload) => void,
  onCount: (count: number) => void,
): () => void {
  if (!token || !ApiConfig.socketUrl) {
    return () => {};
  }

  if (socket?.connected) {
    return () => {};
  }

  socket = io(ApiConfig.socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('notification', onNotification);
  socket.on('notification_count', onCount);

  socket.on('connect_error', () => {
    if (!socketConnectErrorLogged) {
      socketConnectErrorLogged = true;
      if (import.meta.env.DEV) {
        console.warn(
          '[NotificationSocket] Connexion impossible (serveur socket non démarré ?). Les notifications en temps réel sont désactivées.',
        );
      }
    }
  });

  return () => {
    if (socket) {
      socket.off('notification', onNotification);
      socket.off('notification_count', onCount);
      // Ne pas appeler disconnect() si la connexion n'est pas encore établie
      // (évite "WebSocket is closed before the connection is established" en React Strict Mode)
      if (socket.connected) {
        socket.disconnect();
      }
      socket = null;
    }
  };
}

export function disconnectNotificationSocket(): void {
  if (socket) {
    if (socket.connected) socket.disconnect();
    socket = null;
  }
}
