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
  dismissAllNotifications,
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

const POLL_INTERVAL_MS = 10_000;

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

let audioCtx: AudioContext | null = null;

function playNotificationSound() {
  try {
    if (typeof window === 'undefined') return;
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Browsers require the context to be resumed after a user gesture.
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const now = audioCtx.currentTime;

    // Two-tone chime: high then low
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);       // A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.15); // D6
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch {
    // Audio not available ΓÇö silently ignore
  }
}

export function useNotifications(pageSize = 20) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);
  const prevUnreadRef = useRef(0);
  const initialLoadDone = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const result = await getNotifications(1, pageSize);
      if (!mounted.current) return;
      setNotifications((result.items || []).map(toNotification));
      const newCount = result.unread_count || 0;
      setUnreadCount(newCount);

      // Play sound + show toast when unread count increases (but not on initial load)
      if (initialLoadDone.current && newCount > prevUnreadRef.current) {
        playNotificationSound();
        const newest = result.items?.[0];
        if (newest) {
          toast.info(`${newest.title || 'New notification'}${newest.message ? `: ${newest.message}` : ''}`);
        }
      }
      prevUnreadRef.current = newCount;
      initialLoadDone.current = true;
    } catch (err: any) {
      // Notifications are non-critical — log but don't flood toasts.
      if (!initialLoadDone.current) {
        console.warn('[notifications] Failed to load:', err?.message || err);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [pageSize]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      if (mounted.current) {
        if (initialLoadDone.current && count > prevUnreadRef.current) {
          playNotificationSound();
        }
        prevUnreadRef.current = count;
        setUnreadCount(count);
      }
    } catch (err: any) {
      console.warn('[notifications] Failed to refresh unread count:', err?.message || err);
    }
  }, []);

  // Listen for real-time NOTIFICATION_CREATED events via the SSE stream
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function handleSseNotification() {
      // Refresh immediately when the SSE stream pushes a notification event
      refresh();
    }

    window.addEventListener('pulse-notification-created', handleSseNotification);
    return () => window.removeEventListener('pulse-notification-created', handleSseNotification);
  }, [refresh]);

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
    } catch (err: any) {
      console.warn('[notifications] Failed to mark as read:', err?.message || err);
      await refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch (err: any) {
      console.warn('[notifications] Failed to mark all as read:', err?.message || err);
      await refresh();
    }
  }, [refresh]);

  const dismiss = useCallback(async (id: string) => {
    const wasUnread = notifications.find((n) => n.id === id)?.is_read === false;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await dismissNotification(id);
    } catch (err: any) {
      console.warn('[notifications] Failed to dismiss:', err?.message || err);
      await refresh();
    }
  }, [notifications, refresh]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await dismissAllNotifications();
    } catch (err: any) {
      console.warn('[notifications] Failed to clear all:', err?.message || err);
      await refresh();
    }
  }, [refresh]);

  return { notifications, unreadCount, loading, refresh, refreshUnreadCount, markRead, markAllRead, dismiss, clearAll };
}
