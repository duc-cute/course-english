package com.courseenglish.api.service.mail;

import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext;
import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext.Recipient;

public interface MailTemplateService {

    RenderedMailMessage renderLessonPublished(LessonPublishedNotifyContext context, Recipient recipient);
}
