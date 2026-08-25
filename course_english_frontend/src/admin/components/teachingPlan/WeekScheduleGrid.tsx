import { Box, Typography } from "@mui/material";
import type { MouseEvent } from "react";
import type { ClassSessionRecord, SessionType } from "../../../shared/api/classSession";
import { formatSessionTimeRange, sessionMeetStatusLabel } from "./teachingPlanUtils";
import type { DayScheduleGroup } from "./weekScheduleUtils";
import { isTodayIso } from "./weekScheduleUtils";
import {
  GRID_SLOT_HEIGHT_PX,
  buildGridHours,
  computeGridHourRange,
  formatGridDayHeader,
  formatGridHourLabel,
  gridHeightPx,
  layoutSessionOnGrid,
  slotTopPx,
  snapSlotFromGridClick,
} from "./weekScheduleGridUtils";

type WeekScheduleGridProps = {
  dayGroups: DayScheduleGroup[];
  onCreateSlot: (day: string, hour: number, minute: number) => void;
  onEditSession: (session: ClassSessionRecord) => void;
};

function sessionTypeClass(sessionType: ClassSessionRecord["sessionType"]): string {
  switch (sessionType) {
    case "LIVE_CLASS":
      return "is-live-class";
    case "OFFICE_HOURS":
      return "is-office-hours";
    case "EXAM":
      return "is-exam";
    default:
      return "is-other";
  }
}

function uiStateClass(uiState: ClassSessionRecord["uiState"]): string {
  if (uiState === "LIVE") return "is-live";
  if (uiState === "PAST") return "is-past";
  if (uiState === "WAITING_TEACHER") return "is-waiting";
  if (uiState === "NEEDS_START" || uiState === "NEEDS_SETUP") return "is-needs-start";
  return "is-upcoming";
}

function sessionTypeLabel(sessionType: SessionType): string | null {
  switch (sessionType) {
    case "LIVE_CLASS":
      return null;
    case "OFFICE_HOURS":
      return "Office";
    case "EXAM":
      return "Kiểm tra";
    case "OTHER":
      return "Khác";
    default:
      return null;
  }
}

function GridSessionEvent({
  session,
  layout,
  onEdit,
}: {
  session: ClassSessionRecord;
  layout: { topPx: number; heightPx: number };
  onEdit: (session: ClassSessionRecord) => void;
}) {
  const classLabel = session.classroomName || session.classroomCode || "Lớp";
  const lessonLabel = session.lessonTitle || (session.lessonId ? "Đã gán bài" : "Chưa gán bài");
  const locationLabel = sessionMeetStatusLabel(session);
  const studentCount = session.activeStudentCount ?? 0;
  const typeLabel = sessionTypeLabel(session.sessionType);
  const tooltip = [
    `${classLabel}: ${session.title}`,
    formatSessionTimeRange(session.startAt, session.endAt),
    `Bài: ${lessonLabel}`,
    `${studentCount} HS active · ${locationLabel}`,
  ].join("\n");

  return (
    <button
      type="button"
      className={`schedule-week-grid-event ${sessionTypeClass(session.sessionType)} ${uiStateClass(session.uiState)}`}
      // style={{ top: layout.topPx, height: layout.heightPx }}
      // Đặt cả `height` để event khớp chiều cao slot, tránh lệch/nhảy layout khi nội dung thay đổi.
      style={{ top: layout.topPx, height: layout.heightPx }}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(session);
      }}
      title={tooltip}
    >
      <span className="schedule-week-grid-event-head">
        <span className="schedule-week-grid-event-time">{formatSessionTimeRange(session.startAt, session.endAt)}</span>
        <span className="schedule-week-grid-event-badges">
          {session.uiState === "LIVE" ? (
            <span className="schedule-week-grid-event-badge is-live">Live</span>
          ) : null}
          {session.uiState === "WAITING_TEACHER" ? (
            <span className="schedule-week-grid-event-badge is-waiting">Chờ link</span>
          ) : null}
          {session.canStartOnlineClass || session.needsSetup ? (
            <span className="schedule-week-grid-event-badge is-setup">Chưa start</span>
          ) : null}
          {session.recurring ? <span className="schedule-week-grid-event-badge">Lặp</span> : null}
          {typeLabel ? <span className="schedule-week-grid-event-badge is-type">{typeLabel}</span> : null}
        </span>
      </span>
      <span className="schedule-week-grid-event-class">{classLabel}</span>
      <span className="schedule-week-grid-event-title">{session.title}</span>
      <span className="schedule-week-grid-event-lesson">Bài: {lessonLabel}</span>
      <span className="schedule-week-grid-event-meta">
        {studentCount} HS · {locationLabel}
      </span>
    </button>
  );
}

export function WeekScheduleGrid({ dayGroups, onCreateSlot, onEditSession }: WeekScheduleGridProps) {
  const allSessions = dayGroups.flatMap((g) => g.sessions);
  const { startHour, endHour } = computeGridHourRange(allSessions);
  const hours = buildGridHours(startHour, endHour);
  const totalGridHeightPx = gridHeightPx(startHour, endHour, GRID_SLOT_HEIGHT_PX);

  const handleColumnClick = (day: string, event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const { hour, minute } = snapSlotFromGridClick(offsetY, startHour, endHour, GRID_SLOT_HEIGHT_PX);
    onCreateSlot(day, hour, minute);
  };

  return (
    <Box className="schedule-week-grid-wrap admin-panel-card">
      <Box className="schedule-week-grid-scroll">
        <Box className="schedule-week-grid" sx={{ minWidth: 840 }}>
          <Box className="schedule-week-grid-header">
            <Box className="schedule-week-grid-gutter schedule-week-grid-gutter--header" aria-hidden />
            {dayGroups.map(({ date }) => {
              const { weekday, dayMonth } = formatGridDayHeader(date);
              const today = isTodayIso(date);
              return (
                <Box
                  key={date}
                  className={`schedule-week-grid-day-header${today ? " is-today" : ""}`}
                >
                  <Typography component="span" className="schedule-week-grid-day-weekday" variant="caption">
                    {weekday}
                  </Typography>
                  <Typography component="span" className="schedule-week-grid-day-date" variant="body2">
                    {dayMonth}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box className="schedule-week-grid-body">
            <Box className="schedule-week-grid-gutter schedule-week-grid-times" style={{ height: totalGridHeightPx }}>
              {hours.map((hour) => (
                <Box key={hour} className="schedule-week-grid-time-label" style={{ height: GRID_SLOT_HEIGHT_PX }}>
                  {formatGridHourLabel(hour)}
                </Box>
              ))}
            </Box>

            <Box className="schedule-week-grid-columns" style={{ height: totalGridHeightPx }}>
              {dayGroups.map(({ date, sessions }) => (
                <Box
                  key={date}
                  className={`schedule-week-grid-col${isTodayIso(date) ? " is-today" : ""}`}
                  style={{ height: totalGridHeightPx }}
                  onClick={(e) => handleColumnClick(date, e)}
                  role="presentation"
                >
                  {hours.map((hour) => (
                    <Box
                      key={hour}
                      className="schedule-week-grid-hour-line"
                      style={{ top: slotTopPx(hour, startHour, GRID_SLOT_HEIGHT_PX) }}
                      aria-hidden
                    />
                  ))}
                  {sessions.map((session) => (
                    <GridSessionEvent
                      key={session.id}
                      session={session}
                      layout={layoutSessionOnGrid(session, startHour, endHour, GRID_SLOT_HEIGHT_PX)}
                      onEdit={onEditSession}
                    />
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
