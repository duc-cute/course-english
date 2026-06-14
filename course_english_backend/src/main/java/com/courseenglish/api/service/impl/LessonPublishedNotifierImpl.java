package com.courseenglish.api.service.impl;

import com.courseenglish.api.service.LessonNotificationService;
import com.courseenglish.api.service.LessonPublishEmailService;
import com.courseenglish.api.service.LessonPublishedNotifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class LessonPublishedNotifierImpl implements LessonPublishedNotifier {

    private static final Logger log = LoggerFactory.getLogger(LessonPublishedNotifierImpl.class);

    private final LessonNotificationService lessonNotificationService;
    private final LessonPublishEmailService lessonPublishEmailService;

    public LessonPublishedNotifierImpl(
            LessonNotificationService lessonNotificationService,
            LessonPublishEmailService lessonPublishEmailService) {
        this.lessonNotificationService = lessonNotificationService;
        this.lessonPublishEmailService = lessonPublishEmailService;
    }

    @Override
    public void dispatchLessonPublishedAsync(UUID lessonId, UUID actorUserId) {
        log.debug("Dispatch lesson published notifications: lessonId={}, actorUserId={}", lessonId, actorUserId);
        lessonNotificationService.notifyLessonPublishedAsync(lessonId, actorUserId);
        lessonPublishEmailService.sendLessonPublishedEmailsAsync(lessonId, actorUserId);
    }
}
