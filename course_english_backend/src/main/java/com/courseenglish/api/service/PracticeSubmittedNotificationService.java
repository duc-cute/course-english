package com.courseenglish.api.service;

import java.util.UUID;

public interface PracticeSubmittedNotificationService {

    void notifyPracticeSubmittedAsync(UUID attemptId);
}
