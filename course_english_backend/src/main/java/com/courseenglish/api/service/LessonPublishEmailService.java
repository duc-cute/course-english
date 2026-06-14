package com.courseenglish.api.service;

import java.util.UUID;

public interface LessonPublishEmailService {

    void sendLessonPublishedEmailsAsync(UUID lessonId, UUID actorUserId);
}
