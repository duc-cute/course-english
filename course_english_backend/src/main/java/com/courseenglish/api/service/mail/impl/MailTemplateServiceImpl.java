package com.courseenglish.api.service.mail.impl;

import com.courseenglish.api.config.MailProperties;
import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext;
import com.courseenglish.api.domain.dto.notification.LessonPublishedNotifyContext.Recipient;
import com.courseenglish.api.service.mail.MailTemplateService;
import com.courseenglish.api.service.mail.RenderedMailMessage;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.time.Year;

@Service
public class MailTemplateServiceImpl implements MailTemplateService {

    private final SpringTemplateEngine templateEngine;
    private final MailProperties mailProperties;

    public MailTemplateServiceImpl(SpringTemplateEngine templateEngine, MailProperties mailProperties) {
        this.templateEngine = templateEngine;
        this.mailProperties = mailProperties;
    }

    @Override
    public RenderedMailMessage renderLessonPublished(LessonPublishedNotifyContext context, Recipient recipient) {
        String lessonTitle = safeTrim(context.lesson().getTitle());
        String subjectLine = "Bài mới: " + lessonTitle;
        String actorName = context.actor() != null && context.actor().getName() != null
                ? context.actor().getName().trim()
                : "Giáo viên";
        String lessonUrl = buildLessonUrl(context.linkPath());
        String studentName = recipient.name() != null && !recipient.name().isBlank()
                ? recipient.name().trim()
                : "bạn";
        String subjectName = context.subject() != null ? safeTrim(context.subject().getName()) : "";
        String classroomName = context.classroom() != null ? safeTrim(context.classroom().getName()) : "";
        String actorAvatarUrl = resolvePublicMediaUrl(
                context.actor() != null ? context.actor().getAvatarUrl() : "");
        String coverImageUrl = resolvePublicMediaUrl(context.lesson().getCoverImageUrl());

        Context ctx = new Context();
        ctx.setVariable("studentName", studentName);
        ctx.setVariable("actorName", actorName);
        ctx.setVariable("actorAvatarUrl", actorAvatarUrl);
        ctx.setVariable("lessonTitle", lessonTitle);
        ctx.setVariable("subjectName", subjectName);
        ctx.setVariable("classroomName", classroomName);
        ctx.setVariable("subjectLine", context.body() != null ? context.body().replace(" · ", " • ") : "");
        ctx.setVariable("lessonUrl", lessonUrl);
        ctx.setVariable("coverImageUrl", coverImageUrl);
        ctx.setVariable("currentYear", Year.now().getValue());

        String htmlBody = templateEngine.process("mail/lesson-published", ctx);
        String textBody = templateEngine.process("mail/lesson-published.txt", ctx);

        return new RenderedMailMessage(recipient.email(), subjectLine, htmlBody, textBody);
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private String buildLessonUrl(String linkPath) {
        String base = normalizeBase(mailProperties.getFrontendBaseUrl());
        String path = linkPath != null && linkPath.startsWith("/") ? linkPath : "/" + linkPath;
        return base + path;
    }

    /** Rewrite /storage paths and localhost host to {@code app.mail.api-base-url}. */
    private String resolvePublicMediaUrl(String rawUrl) {
        String trimmed = safeTrim(rawUrl);
        if (trimmed.isEmpty()) {
            return "";
        }

        String apiBase = normalizeBase(mailProperties.getApiBaseUrl());

        if (trimmed.startsWith("/storage/")) {
            return apiBase + trimmed;
        }
        if (trimmed.startsWith("storage/")) {
            return apiBase + "/" + trimmed;
        }

        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed
                    .replace("http://localhost:7070", apiBase)
                    .replace("http://127.0.0.1:7070", apiBase)
                    .replace("https://localhost:7070", apiBase)
                    .replace("https://127.0.0.1:7070", apiBase);
        }

        return trimmed;
    }

    private String normalizeBase(String base) {
        if (base == null || base.isBlank()) {
            return "http://localhost:7070";
        }
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }
}
