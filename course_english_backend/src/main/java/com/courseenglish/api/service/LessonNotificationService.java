package com.courseenglish.api.service;

import java.util.UUID;

public interface LessonNotificationService {
    void notifyLessonPublishedAsync(UUID lessonId, UUID actorUserId);
}
