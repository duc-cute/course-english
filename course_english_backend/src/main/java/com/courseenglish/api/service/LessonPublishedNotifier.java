package com.courseenglish.api.service;

import java.util.UUID;

public interface LessonPublishedNotifier {

    void dispatchLessonPublishedAsync(UUID lessonId, UUID actorUserId);
}
