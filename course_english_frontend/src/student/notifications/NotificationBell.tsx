import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import { CircularProgress } from "@mui/material";
import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { groupNotificationsByDay } from "./groupNotificationsByDay";
import { NotificationPanelItem } from "./NotificationPanelItem";
import { useNotifications } from "./useNotifications";

export function NotificationBell() {
  const navigate = useNavigate();
  const { items, unreadCount, loading, open, setOpen, markRead, markAllRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const groups = groupNotificationsByDay(items);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setOpen(false);
  };

  const handleOpenItem = async (item: { id: string; linkPath: string; read: boolean }) => {
    if (!item.read) {
      try {
        await markRead(item.id);
      } catch {
        /* still navigate */
      }
    }
    handleClose();
    navigate(item.linkPath);
  };

  const hasUnread = unreadCount > 0;

  return (
    <div className="student-notification-bell-wrap">
      <button
        type="button"
        className="student-notification-bell"
        aria-label="Thông báo"
        aria-expanded={open}
        onClick={handleOpen}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {hasUnread ? (
          <span className="student-notification-bell__badge" aria-hidden>
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open && anchorEl ? (
        <>
          <button type="button" className="student-notification-backdrop" aria-label="Đóng thông báo" onClick={handleClose} />
          <div
            className="student-notification-panel"
            role="dialog"
            aria-label="Thông báo"
            style={{
              top: anchorEl.getBoundingClientRect().bottom + 8,
              right: Math.max(16, window.innerWidth - anchorEl.getBoundingClientRect().right),
            }}
          >
            <header className="student-notification-panel__head">
              <div className="student-notification-panel__head-left">
                <h2 className="student-notification-panel__title">Thông báo</h2>
                {hasUnread ? (
                  <span className="student-notification-panel__unread-pill">{unreadCount} mới</span>
                ) : null}
              </div>
              {hasUnread ? (
                <button type="button" className="student-notification-panel__mark-all" onClick={() => void markAllRead()}>
                  Đánh dấu đã đọc
                </button>
              ) : null}
            </header>

            <div className="student-notification-panel__list">
              {loading ? (
                <div className="student-notification-panel__loading">
                  <CircularProgress size={24} />
                </div>
              ) : items.length === 0 ? (
                <p className="student-notification-panel__empty">Chưa có thông báo</p>
              ) : (
                groups.map((group) => (
                  <section key={group.label} className="student-notification-group">
                    <h3 className="student-notification-group__label">{group.label}</h3>
                    <div className="student-notification-group__cards">
                      {group.items.map((item) => (
                        <NotificationPanelItem key={item.id} item={item} onOpen={handleOpenItem} />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>

            {items.length > 0 ? (
              <footer className="student-notification-panel__foot">
                <span className="student-notification-panel__foot-link">
                  Xem tất cả thông báo
                  <ChevronRightOutlinedIcon sx={{ fontSize: 18 }} />
                </span>
              </footer>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
