package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.repository.user.UserRepo;
import com.hdc.hdc_map_backend.service.EmailService;
import com.hdc.hdc_map_backend.service.GoogleOAuthService;
import com.hdc.hdc_map_backend.service.PasswordResetService;
import com.hdc.hdc_map_backend.service.UserService;
import com.hdc.hdc_map_backend.util.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://calc.americanhousing.fund" })
public class UserController {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private GoogleOAuthService googleOAuthService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        // Validate email domain
        // String email = registerRequest.getUsername();
        // if (!email.toLowerCase().endsWith("@housingdiversity.com")) {
        // return ResponseEntity.badRequest()
        // .body(new MessageResponse("Registration is restricted to
        // @housingdiversity.com email addresses"));
        // }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(registerRequest.getRole() != null ? registerRequest.getRole() : "USER");
        user.setFullName(registerRequest.getFullName());
        return ResponseEntity.ok(userRepo.save(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthenticationRequest authenticationRequest)
            throws Exception {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authenticationRequest.getUsername(),
                            authenticationRequest.getPassword()));
        } catch (Exception e) {
            throw new Exception("Incorrect username or password", e);
        }

        final UserDetails userDetails = userService.loadUserByUsername(authenticationRequest.getUsername());
        final String jwt = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthenticationResponse(jwt));
    }

    @PostMapping("/google-auth")
    public ResponseEntity<?> googleAuth(@RequestBody GoogleAuthRequest googleAuthRequest) throws Exception {
        try {
            GoogleIdToken.Payload payload = googleOAuthService.verifyToken(googleAuthRequest.getToken());
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            // Check if user exists
            Optional<User> existingUserOpt = userRepo.findByUsername(email);
            User user;

            if (existingUserOpt.isEmpty()) {
                // Validate email domain for NEW users only
                // if (!email.toLowerCase().endsWith("@housingdiversity.com")) {
                // return ResponseEntity.badRequest()
                // .body(new MessageResponse(
                // "New registrations are restricted to @housingdiversity.com email
                // addresses"));
                // }

                // Create new user from Google OAuth
                user = new User();
                user.setUsername(email);
                user.setPassword(passwordEncoder.encode("google-oauth-" + System.currentTimeMillis()));
                user.setRole("USER");
                user.setFullName(name); // Store Google name
                user = userRepo.save(user);
            } else {
                // Existing users can sign in regardless of email domain
                user = existingUserOpt.get();
                // Update name if it's empty and we have one from Google
                if ((user.getFullName() == null || user.getFullName().trim().isEmpty()) && name != null) {
                    user.setFullName(name);
                    userRepo.save(user);
                }
            }

            final UserDetails userDetails = userService.loadUserByUsername(email);
            final String jwt = jwtUtil.generateToken(userDetails);

            return ResponseEntity.ok(new GoogleAuthResponse(jwt, email, name));
        } catch (Exception e) {
            throw new Exception("Google authentication failed: " + e.getMessage(), e);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        try {
            String email = forgotPasswordRequest.getEmail();
            Optional<User> userOpt = userRepo.findByUsername(email);

            // Always return the same message for security (don't reveal if email exists)
            String responseMessage = "If the email exists in our system, a password reset link will be sent.";

            if (userOpt.isPresent()) {
                // User exists - generate token and send email
                try {
                    String resetToken = passwordResetService.generateResetToken(email);
                    emailService.sendPasswordResetEmail(email, resetToken);
                } catch (Exception emailException) {
                    // Log the error but don't expose it to prevent information leakage
                    System.err.println(
                            "Failed to send password reset email to " + email + ": " + emailException.getMessage());
                    // Still return success message to user for security
                }
            }

            return ResponseEntity.ok(new MessageResponse(responseMessage));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Password reset request failed"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest resetPasswordRequest) {
        try {
            String token = resetPasswordRequest.getToken();
            String newPassword = resetPasswordRequest.getNewPassword();

            // Validate token
            if (!passwordResetService.validateResetToken(token)) {
                return ResponseEntity.badRequest().body(new MessageResponse("Invalid or expired reset token"));
            }

            // Get email from token
            String email = passwordResetService.getEmailFromToken(token);
            if (email == null) {
                return ResponseEntity.badRequest().body(new MessageResponse("Invalid reset token"));
            }

            // Find user and update password
            Optional<User> userOpt = userRepo.findByUsername(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
            }

            User user = userOpt.get();
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepo.save(user);

            // Mark token as used
            passwordResetService.markTokenAsUsed(token);

            return ResponseEntity.ok(new MessageResponse("Password reset successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Password reset failed"));
        }
    }
}

class RegisterRequest {
    private String username;
    private String password;
    private String role;
    private String fullName;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}

class AuthenticationRequest {
    private String username;
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

class GoogleAuthRequest {
    private String token;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}

class ForgotPasswordRequest {
    private String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

class ResetPasswordRequest {
    private String token;
    private String newPassword;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}

class MessageResponse {
    private final String message;

    public MessageResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}

class AuthenticationResponse {
    private final String jwt;

    public AuthenticationResponse(String jwt) {
        this.jwt = jwt;
    }

    public String getJwt() {
        return jwt;
    }
}

class GoogleAuthResponse {
    private final String jwt;
    private final String email;
    private final String name;

    public GoogleAuthResponse(String jwt, String email, String name) {
        this.jwt = jwt;
        this.email = email;
        this.name = name;
    }

    public String getJwt() {
        return jwt;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }
}
