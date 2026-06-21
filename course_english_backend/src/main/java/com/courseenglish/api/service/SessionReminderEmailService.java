package com.courseenglish.api.service;

import java.util.UUID;

public interface SessionReminderEmailService {

    void dispatchReminderAsync(UUID reminderId);

    void processReminder(UUID reminderId);
}
