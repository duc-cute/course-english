import { useCallback, useEffect, useState } from "react";
import {
  apiGetNotificationUnreadCount,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiSearchNotifications,
  type NotificationRecord,
} from "../../shared/api/notification";

const POLL_MS = 60_000;

export function useNotifications() {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const refreshUnread = useCallback(async () => {
    try {
      const count = await apiGetNotificationUnreadCount();
      setUnreadCount(count);
    } catch {
      /* ignore poll errors */
    }
  }, []);

  const refreshList = useCallback(async () => {
    try {
      const page = await apiSearchNotifications({ page: 0, size: 20, sort: "createdAt,desc" });
      setItems(Array.isArray(page?.result) ? page.result : []);
    } catch {
      setItems([]);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshUnread(), refreshList()]);
    } finally {
      setLoading(false);
    }
  }, [refreshList, refreshUnread]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshUnread();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [refreshUnread]);

  useEffect(() => {
    if (!open) return;
    void refreshList();
  }, [open, refreshList]);

  const markRead = useCallback(
    async (id: string) => {
      await apiMarkNotificationRead(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true, readAt: new Date().toISOString() } : item)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    await apiMarkAllNotificationsRead();
    setItems((prev) => prev.map((item) => ({ ...item, read: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  }, []);

  return {
    items,
    unreadCount,
    loading,
    open,
    setOpen,
    markRead,
    markAllRead,
    refreshAll,
  };
}
