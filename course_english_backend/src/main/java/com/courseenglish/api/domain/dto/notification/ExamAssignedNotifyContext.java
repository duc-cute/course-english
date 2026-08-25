package com.courseenglish.api.domain.dto.notification;

import com.courseenglish.api.domain.Classroom;
import com.courseenglish.api.domain.ExamAssignment;
import com.courseenglish.api.domain.ExamPaper;
import com.courseenglish.api.domain.User;

import java.util.List;
import java.util.UUID;

public record ExamAssignedNotifyContext(
        ExamAssignment assignment,
        ExamPaper examPaper,
        Classroom classroom,
        User actor,
        String title,
        String body,
        String linkPath,
        String payloadJson,
        List<Recipient> recipients) {

    public record Recipient(UUID userId, String email, String name) {}
}
