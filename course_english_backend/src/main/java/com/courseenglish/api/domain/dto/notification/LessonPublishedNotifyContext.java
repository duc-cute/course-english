package com.courseenglish.api.domain.dto.notification;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.Lesson;
import com.courseenglish.api.domain.Subject;
import com.courseenglish.api.domain.User;

import java.util.List;
import java.util.UUID;

public record LessonPublishedNotifyContext(
        Lesson lesson,
        Subject subject,
        Classroom classroom,
        User actor,
        String title,
        String body,
        String linkPath,
        String payloadJson,
        List<Recipient> recipients) {

    public record Recipient(UUID userId, String email, String name) {}
}
