package com.hdc.hdc_map_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${email.from.address}")
    private String fromEmail;

    @Value("${email.from.name}")
    private String fromName;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String subject = "Reset Your Password - HDC Housing Diversity Corporation";
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            String htmlContent = buildPasswordResetEmailHtml(resetLink);
            
            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(buildPasswordResetEmailText(resetLink), htmlContent);
            
            mailSender.send(message);
            logger.info("Password reset email sent successfully to: {}", toEmail);
            
        } catch (MessagingException e) {
            logger.error("Error sending password reset email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send password reset email", e);
        } catch (Exception e) {
            logger.error("Error preparing password reset email for {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to prepare password reset email", e);
        }
    }

    private String buildPasswordResetEmailHtml(String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Password Reset</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .logo { font-size: 24px; font-weight: bold; color: #2c3e50; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
                    .button { display: inline-block; background: #3498db; color: white; 
                             padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                             margin: 20px 0; }
                    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">HDC Housing Diversity Corporation</div>
                    </div>
                    <div class="content">
                        <h2>Reset Your Password</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset your password for your HDC account. 
                           Click the button below to create a new password:</p>
                        <p style="text-align: center;">
                            <a href="%s" class="button">Reset Password</a>
                        </p>
                        <p>If you didn't request this password reset, you can safely ignore this email. 
                           Your password will remain unchanged.</p>
                        <p>This link will expire in 24 hours for security reasons.</p>
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <p><a href="%s">%s</a></p>
                    </div>
                    <div class="footer">
                        <p>© 2025 HDC Housing Diversity Corporation. All rights reserved.</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetLink, resetLink, resetLink);
    }

    private String buildPasswordResetEmailText(String resetLink) {
        return """
            HDC Housing Diversity Corporation
            
            Reset Your Password
            
            Hello,
            
            We received a request to reset your password for your HDC account. 
            Click the link below to create a new password:
            
            %s
            
            If you didn't request this password reset, you can safely ignore this email. 
            Your password will remain unchanged.
            
            This link will expire in 24 hours for security reasons.
            
            © 2025 HDC Housing Diversity Corporation. All rights reserved.
            This is an automated message, please do not reply to this email.
            """.formatted(resetLink);
    }
}