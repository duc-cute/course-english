import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  apiGetNotificationUnreadCount,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
  apiSearchNotifications,
  normalizeNotificationWsMessage,
  type NotificationRecord,
  type NotificationWsMessage,
} from "../../shared/api/notification";
import { getAccessToken } from "../../shared/auth/token";
import { connectNotificationSocket } from "../../shared/ws/notificationSocket";

const POLL_MS = 60_000;
const POLL_MS_WS_CONNECTED = 300_000;

export function useNotifications() {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<ReturnType<typeof connectNotificationSocket> | null>(null);

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

  const handleWsMessage = useCallback((rawMessage: NotificationWsMessage) => {
    const message = normalizeNotificationWsMessage(rawMessage);
    const incoming = message.notification;

    setUnreadCount(message.unreadCount);
    setItems((prev) => {
      if (prev.some((item) => item.id === incoming.id)) {
        return prev;
      }
      return [incoming, ...prev];
    });

    toast.info(incoming.title, {
      toastId: `notification-${incoming.id}`,
      autoClose: 4000,
    });
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!getAccessToken()) {
      setWsConnected(false);
      return;
    }

    socketRef.current?.disconnect();
    socketRef.current = connectNotificationSocket({
      onMessage: handleWsMessage,
      onConnect: () => setWsConnected(true),
      onDisconnect: () => setWsConnected(false),
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setWsConnected(false);
    };
  }, [handleWsMessage]);

  useEffect(() => {
    const pollMs = wsConnected ? POLL_MS_WS_CONNECTED : POLL_MS;
    const timer = window.setInterval(() => {
      void refreshUnread();
    }, pollMs);
    return () => window.clearInterval(timer);
  }, [refreshUnread, wsConnected]);

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
    wsConnected,
  };
}
