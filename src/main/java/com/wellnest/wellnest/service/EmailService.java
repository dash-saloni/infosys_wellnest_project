package com.wellnest.wellnest.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @org.springframework.scheduling.annotation.Async
    public void sendOtpEmail(String toEmail, String subject, String body) {
        // Log to console for debugging/dev mode (in case SMTP fails)
        System.out.println("========== EMAIL SIMULATION ==========");
        System.out.println("To: " + toEmail);
        System.out.println("Subject: " + subject);
        System.out.println("Body: " + body);
        System.out.println("======================================");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            // In production, use a Logger instead of System.err
        }
    }
}
