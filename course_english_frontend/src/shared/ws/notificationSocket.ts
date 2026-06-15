import { getAccessToken } from "../auth/token";
import type { NotificationWsMessage } from "../api/notification";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function getApiOrigin(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (!apiUrl) {
    return "http://localhost:7070";
  }
  return apiUrl.replace(/\/api\/v1\/?$/i, "");
}

export type NotificationSocketOptions = {
  onMessage: (message: NotificationWsMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export type NotificationSocketHandle = {
  disconnect: () => void;
};

export function connectNotificationSocket(options: NotificationSocketOptions): NotificationSocketHandle | null {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const base = getApiOrigin();
  const url = `${base}/ws/notifications?token=${encodeURIComponent(token)}`;
  let subscription: StompSubscription | null = null;

  const client = new Client({
    webSocketFactory: () => new SockJS(url),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      subscription = client.subscribe("/user/queue/notifications", (message: IMessage) => {
        try {
          const parsed = JSON.parse(message.body) as NotificationWsMessage;
          if (parsed?.type === "NOTIFICATION_CREATED" && parsed.notification) {
            options.onMessage(parsed);
          }
        } catch {
          /* ignore malformed payload */
        }
      });
      options.onConnect?.();
    },
    onDisconnect: () => {
      subscription = null;
      options.onDisconnect?.();
    },
    onWebSocketClose: () => {
      subscription = null;
      options.onDisconnect?.();
    },
    onStompError: () => {
      options.onDisconnect?.();
    },
  });

  client.activate();

  return {
    disconnect: () => {
      try {
        subscription?.unsubscribe();
      } catch {
        /* ignore */
      }
      client.deactivate();
    },
  };
}
