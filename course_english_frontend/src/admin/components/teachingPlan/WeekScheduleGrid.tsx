import { Box, Typography } from "@mui/material";
import type { MouseEvent } from "react";
import type { ClassSessionRecord } from "../../../shared/api/classSession";
import { formatSessionTimeRange } from "./teachingPlanUtils";
import type { DayScheduleGroup } from "./weekScheduleUtils";
import { isTodayIso } from "./weekScheduleUtils";
import {
  GRID_HOUR_HEIGHT_PX,
  buildGridHours,
  computeGridHourRange,
  formatGridDayHeader,
  formatGridHourLabel,
  layoutSessionOnGrid,
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
  return "is-upcoming";
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

  return (
    <button
      type="button"
      className={`schedule-week-grid-event ${sessionTypeClass(session.sessionType)} ${uiStateClass(session.uiState)}`}
      style={{ top: layout.topPx, height: layout.heightPx }}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(session);
      }}
      title={`${classLabel}: ${session.title}`}
    >
      <span className="schedule-week-grid-event-time">{formatSessionTimeRange(session.startAt, session.endAt)}</span>
      <span className="schedule-week-grid-event-title">
        {classLabel}: {session.title}
      </span>
      {session.lessonTitle ? (
        <span className="schedule-week-grid-event-lesson">{session.lessonTitle}</span>
      ) : null}
      {session.recurring ? <span className="schedule-week-grid-event-badge">Lặp</span> : null}
    </button>
  );
}

export function WeekScheduleGrid({ dayGroups, onCreateSlot, onEditSession }: WeekScheduleGridProps) {
  const allSessions = dayGroups.flatMap((g) => g.sessions);
  const { startHour, endHour } = computeGridHourRange(allSessions);
  const hours = buildGridHours(startHour, endHour);
  const gridHeightPx = hours.length * GRID_HOUR_HEIGHT_PX;

  const handleColumnClick = (day: string, event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    const { hour, minute } = snapSlotFromGridClick(offsetY, startHour, GRID_HOUR_HEIGHT_PX);
    onCreateSlot(day, hour, minute);
  };

  return (
    <Box className="schedule-week-grid-wrap admin-panel-card">
      <Box className="schedule-week-grid-scroll">
        <Box className="schedule-week-grid" sx={{ minWidth: 720 }}>
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
            <Box className="schedule-week-grid-gutter schedule-week-grid-times" style={{ height: gridHeightPx }}>
              {hours.map((hour) => (
                <Box key={hour} className="schedule-week-grid-time-label" style={{ height: GRID_HOUR_HEIGHT_PX }}>
                  {formatGridHourLabel(hour)}
                </Box>
              ))}
            </Box>

            <Box className="schedule-week-grid-columns" style={{ height: gridHeightPx }}>
              {dayGroups.map(({ date, sessions }) => (
                <Box
                  key={date}
                  className={`schedule-week-grid-col${isTodayIso(date) ? " is-today" : ""}`}
                  style={{ height: gridHeightPx }}
                  onClick={(e) => handleColumnClick(date, e)}
                  role="presentation"
                >
                  {hours.map((hour) => (
                    <Box
                      key={hour}
                      className="schedule-week-grid-hour-line"
                      style={{ top: (hour - startHour) * GRID_HOUR_HEIGHT_PX }}
                      aria-hidden
                    />
                  ))}
                  {sessions.map((session) => (
                    <GridSessionEvent
                      key={session.id}
                      session={session}
                      layout={layoutSessionOnGrid(session, startHour, endHour, GRID_HOUR_HEIGHT_PX)}
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
