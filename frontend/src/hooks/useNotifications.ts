'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/toast';
import {
  NotificationData,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from '@/utils/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
}

const POLL_INTERVAL_MS = 20000;

function toNotification(n: NotificationData): Notification {
  return {
    id: n.id,
    title: n.title,
    message: n.message || '',
    is_read: n.is_read,
    created_at: n.created_at,
    type: n.type,
    entity_type: n.entity_type,
    entity_id: n.entity_id,
  };
}

export function useNotifications(pageSize = 20) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const result = await getNotifications(1, pageSize);
      if (!mounted.current) return;
      setNotifications((result.items || []).map(toNotification));
      setUnreadCount(result.unread_count || 0);
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [pageSize]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      if (mounted.current) setUnreadCount(count);
    } catch {
      // Silently fail
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
      await refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
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
      await refresh();
    }
  }, [notifications, refresh]);

  return { notifications, unreadCount, loading, refresh, refreshUnreadCount, markRead, markAllRead, dismiss };
}
