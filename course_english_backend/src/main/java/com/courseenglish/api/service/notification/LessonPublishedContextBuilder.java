package com.courseenglish.api.service.notification;

import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext;

import java.util.Optional;
import java.util.UUID;

public interface LessonPublishedContextBuilder {

    Optional<LessonPublishedNotifyContext> build(UUID lessonId, UUID actorUserId);
}
