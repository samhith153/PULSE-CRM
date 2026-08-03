'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Notification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from '@/utils/api';
import { toast } from '@/lib/toast';

const POLL_INTERVAL_MS = 20000;

export function useNotifications(pageSize = 20) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const result = await getNotifications({ page: 1, pageSize });
      if (!mounted.current) return;
      setNotifications(result.items);
      setUnreadCount(result.unread_count);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [pageSize]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      if (mounted.current) setUnreadCount(count);
    } catch {
      toast.error('Failed to load unread count');
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(id);
    } catch {
      toast.error('Failed to mark notification as read');
      await refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      toast.error('Failed to mark all notifications as read');
      await refresh();
    }
  }, [refresh]);

  const dismiss = useCallback(async (id: string) => {
    const wasUnread = notifications.find((n) => n.id === id)?.is_read === false;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await dismissNotification(id);
    } catch {
      toast.error('Failed to dismiss notification');
      await refresh();
    }
  }, [notifications, refresh]);

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead, dismiss };
}
