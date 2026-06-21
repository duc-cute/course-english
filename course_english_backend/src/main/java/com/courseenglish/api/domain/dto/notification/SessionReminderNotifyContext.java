package com.courseenglish.api.domain.dto.notification;

import java.time.Instant;

public record SessionReminderNotifyContext(
        String teacherEmail,
        String teacherName,
        String classroomName,
        String sessionTitle,
        String lessonTitle,
        Instant startAt,
        Instant endAt,
        String meetLink,
        String scheduleUrl,
        boolean startingSoon) {
}
