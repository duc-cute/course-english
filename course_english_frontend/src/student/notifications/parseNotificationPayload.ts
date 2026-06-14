export type NotificationPayload = {
  actorName?: string;
  actorAvatarUrl?: string;
  coverImageUrl?: string;
  lessonTitle?: string;
};

function readString(payload: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = payload?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function parseNotificationPayload(payload?: Record<string, unknown>): NotificationPayload {
  if (!payload) {
    return {};
  }
  return {
    actorName: readString(payload, "actorName"),
    actorAvatarUrl: readString(payload, "actorAvatarUrl"),
    coverImageUrl: readString(payload, "coverImageUrl"),
    lessonTitle: readString(payload, "lessonTitle"),
  };
}

export function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
