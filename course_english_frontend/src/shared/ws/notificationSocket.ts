import { refreshAccessToken } from "../auth/authSession";
import { getAccessToken } from "../auth/token";
import { isAccessTokenExpired } from "../auth/jwtUtils";
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

function buildNotificationSocketUrl(token: string): string {
  const base = getApiOrigin();
  return `${base}/ws/notifications?token=${encodeURIComponent(token)}`;
}

async function resolveConnectToken(): Promise<string | null> {
  let token = getAccessToken();
  if (!token) {
    return null;
  }

  if (isAccessTokenExpired(token)) {
    token = await refreshAccessToken();
  }

  if (!token || isAccessTokenExpired(token)) {
    return null;
  }

  return token;
}

export type NotificationSocketOptions = {
  onMessage: (message: NotificationWsMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onAuthFailed?: () => void;
};

export type NotificationSocketHandle = {
  disconnect: () => void;
};

export function connectNotificationSocket(options: NotificationSocketOptions): NotificationSocketHandle | null {
  const initialToken = getAccessToken();
  if (!initialToken || isAccessTokenExpired(initialToken)) {
    return null;
  }

  let subscription: StompSubscription | null = null;
  let authFailed = false;
  let currentToken = initialToken;

  const client = new Client({
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    beforeConnect: async () => {
      if (authFailed) {
        throw new Error("WS auth previously failed");
      }

      const token = await resolveConnectToken();
      if (!token) {
        authFailed = true;
        options.onAuthFailed?.();
        throw new Error("WS token unavailable");
      }

      currentToken = token;
      client.connectHeaders = {
        Authorization: `Bearer ${token}`,
      };
    },
    webSocketFactory: () => new SockJS(buildNotificationSocketUrl(currentToken)),
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
      authFailed = true;
      subscription = null;
      options.onAuthFailed?.();
      options.onDisconnect?.();
      client.deactivate();
    },
    onWebSocketError: () => {
      if (authFailed) {
        client.deactivate();
      }
    },
  });

  client.activate();

  return {
    disconnect: () => {
      authFailed = true;
      try {
        subscription?.unsubscribe();
      } catch {
        /* ignore */
      }
      client.deactivate();
    },
  };
}
