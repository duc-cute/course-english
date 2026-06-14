package com.courseenglish.api.service.mail.impl;

import com.courseenglish.api.config.MailProperties;
import com.courseenglish.api.service.mail.MailSenderService;
import com.courseenglish.api.service.mail.RenderedMailMessage;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailSenderServiceImpl implements MailSenderService {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    public MailSenderServiceImpl(JavaMailSender mailSender, MailProperties mailProperties) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
    }

    @Override
    public void send(RenderedMailMessage message) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(mailProperties.getFrom());
            helper.setTo(message.to());
            helper.setSubject(message.subject());
            helper.setText(message.textBody(), message.htmlBody());
            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to send email to " + message.to(), ex);
        }
    }
}
