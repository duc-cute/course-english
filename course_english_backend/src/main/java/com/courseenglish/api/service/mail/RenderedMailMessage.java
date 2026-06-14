package com.courseenglish.api.service.mail;

public record RenderedMailMessage(
        String to,
        String subject,
        String htmlBody,
        String textBody) {}
