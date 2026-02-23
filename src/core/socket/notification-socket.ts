import { io, Socket } from 'socket.io-client';
import { ApiConfig } from '@/config/api.config';

let socket: Socket | null = null;

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

  socket.on('connect_error', (err) => {
    console.warn('[NotificationSocket] Connexion échouée:', err.message);
  });

  return () => {
    if (socket) {
      socket.off('notification', onNotification);
      socket.off('notification_count', onCount);
      try {
        socket.disconnect();
      } catch {
        // Ignore si déconnexion pendant la phase de connexion
      }
      socket = null;
    }
  };
}

export function disconnectNotificationSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
