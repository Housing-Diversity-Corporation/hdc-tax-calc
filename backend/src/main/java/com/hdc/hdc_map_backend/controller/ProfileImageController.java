package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.service.S3Service;
import com.hdc.hdc_map_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user/profile-image")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com", "https://calc.angelfhr.com" })
public class ProfileImageController {

    @Autowired
    private S3Service s3Service;

    @Autowired
    private UserService userService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadProfileImage(@RequestParam("file") MultipartFile file) {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User user = userService.findByUsername(username);

            // Delete old profile image if exists
            if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().isEmpty()) {
                s3Service.deleteProfileImage(user.getProfileImageUrl());
            }

            // Upload new image
            String imageUrl = s3Service.uploadProfileImage(file, user.getId());

            // Update user profile
            user.setProfileImageUrl(imageUrl);
            userService.save(user);

            Map<String, String> response = new HashMap<>();
            response.put("imageUrl", imageUrl);
            response.put("message", "Profile image uploaded successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload profile image: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteProfileImage() {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User user = userService.findByUsername(username);

            // Delete from S3
            if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().isEmpty()) {
                s3Service.deleteProfileImage(user.getProfileImageUrl());
            }

            // Update user profile
            user.setProfileImageUrl(null);
            userService.save(user);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Profile image deleted successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete profile image: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping("/url")
    public ResponseEntity<?> getProfileImageUrl() {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User user = userService.findByUsername(username);

            Map<String, String> response = new HashMap<>();
            response.put("imageUrl", user.getProfileImageUrl() != null ? user.getProfileImageUrl() : "");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to get profile image URL: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
