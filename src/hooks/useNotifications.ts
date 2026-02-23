import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/core/store/auth.store';
import { notificationApi } from '@/core/api';
import { connectNotificationSocket } from '@/core/socket/notification-socket';
import type { Notification } from '@/types';
import type { PaginatedResponse } from '@/types';

const LIMIT = 20;

export function useNotifications() {
  const token = useAuthStore((s) => s.token);
  const [list, setList] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const [res, countRes] = await Promise.all([
        notificationApi.list({ limit: LIMIT }),
        notificationApi.unreadCount(),
      ]);
      setList((res as PaginatedResponse<Notification>).data ?? []);
      setUnreadCount(countRes?.count ?? 0);
    } catch {
      setList([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!token) return;
    const disconnect = connectNotificationSocket(
      token,
      () => refetch(),
      (count) => setUnreadCount(count),
    );
    return disconnect;
  }, [token, refetch]);

  const markAsRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await notificationApi.markAsRead(ids);
      setList((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, lu: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - ids.length));
    } catch {
      refetch();
    }
  }, [refetch]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead();
      setList((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch {
      refetch();
    }
  }, [refetch]);

  return {
    list,
    unreadCount,
    loading,
    refetch,
    markAsRead,
    markAllAsRead,
  };
}
