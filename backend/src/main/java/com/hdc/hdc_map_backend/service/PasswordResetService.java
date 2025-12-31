package com.hdc.hdc_map_backend.service;

import com.hdc.hdc_map_backend.entity.PasswordResetToken;
import com.hdc.hdc_map_backend.repository.user.PasswordResetTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
public class PasswordResetService {

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    public String generateResetToken(String email) {
        // Delete any existing tokens for this email
        tokenRepository.deleteByEmail(email);
        
        // Generate a secure random token
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        
        // Save token to database
        PasswordResetToken resetToken = new PasswordResetToken(token, email);
        tokenRepository.save(resetToken);
        
        return token;
    }

    public boolean validateResetToken(String token) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        return tokenOpt.isPresent() && tokenOpt.get().isValid();
    }

    public String getEmailFromToken(String token) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isPresent() && tokenOpt.get().isValid()) {
            return tokenOpt.get().getEmail();
        }
        return null;
    }

    public void markTokenAsUsed(String token) {
        Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isPresent()) {
            PasswordResetToken resetToken = tokenOpt.get();
            resetToken.setUsed(true);
            tokenRepository.save(resetToken);
        }
    }

    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }
}