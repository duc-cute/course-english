import { useState } from "react";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import type { NotificationRecord } from "../../shared/api/notification";
import { AvatarImage } from "../../shared/ui/ProfileAvatar";
import { formatNotificationTime } from "./formatNotificationTime";
import { getNameInitials, parseNotificationPayload } from "./parseNotificationPayload";

type NotificationPanelItemProps = {
  item: NotificationRecord;
  onOpen: (item: NotificationRecord) => void;
};

function formatSubtitle(body: string | null | undefined): string | null {
  const text = body?.trim();
  if (!text) return null;
  return text.replace(/\s·\s/g, " • ");
}

export function NotificationPanelItem({ item, onOpen }: NotificationPanelItemProps) {
  const subtitle = formatSubtitle(item.body);
  const { actorName, actorAvatarUrl, coverImageUrl, lessonTitle } = parseNotificationPayload(item.payload);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showActorAvatar = Boolean(actorAvatarUrl) && !avatarFailed;

  return (
    <button
      type="button"
      className={`student-notification-item${item.read ? " student-notification-item--read" : " student-notification-item--unread"}`}
      onClick={() => onOpen(item)}
    >
      {!item.read ? <span className="student-notification-item__dot" aria-hidden /> : null}

      <div className="student-notification-item__row">
        <div className="student-notification-item__avatar" aria-hidden>
          {showActorAvatar ? (
            <AvatarImage
              src={actorAvatarUrl!}
              className="student-notification-item__avatar-img"
              onError={() => setAvatarFailed(true)}
            />
          ) : actorName ? (
            <span className="student-notification-item__avatar-initials">{getNameInitials(actorName)}</span>
          ) : (
            <PersonOutlineOutlinedIcon sx={{ fontSize: 22 }} />
          )}
        </div>

        <div className="student-notification-item__body">
          <p className="student-notification-item__title">{item.title}</p>
          <div className="student-notification-item__meta">
            {subtitle ? <span className="student-notification-item__subtitle">{subtitle}</span> : null}
            <time className="student-notification-item__time" dateTime={item.createdAt}>
              {formatNotificationTime(item.createdAt)}
            </time>
          </div>
        </div>

        <div
          className={`student-notification-item__lesson-thumb${coverImageUrl ? " has-cover" : ""}`}
          aria-hidden
          title={lessonTitle ?? item.title}
        >
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="" className="student-notification-item__lesson-cover" />
          ) : (
            <MenuBookOutlinedIcon sx={{ fontSize: 26, color: "var(--vq-primary, #0040df)" }} />
          )}
        </div>
      </div>
    </button>
  );
}
