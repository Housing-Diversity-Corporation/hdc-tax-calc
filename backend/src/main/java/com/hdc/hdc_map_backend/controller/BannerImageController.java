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
@RequestMapping("/api/user/banner-image")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://calc.americanhousing.fund" })
public class BannerImageController {

    @Autowired
    private S3Service s3Service;

    @Autowired
    private UserService userService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadBannerImage(@RequestParam("file") MultipartFile file) {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User user = userService.findByUsername(username);

            // Delete old banner image if exists
            if (user.getBannerImageUrl() != null && !user.getBannerImageUrl().isEmpty()) {
                s3Service.deleteBannerImage(user.getBannerImageUrl());
            }

            // Upload new image
            String imageUrl = s3Service.uploadBannerImage(file, user.getId());

            // Update user profile
            user.setBannerImageUrl(imageUrl);
            userService.save(user);

            Map<String, String> response = new HashMap<>();
            response.put("imageUrl", imageUrl);
            response.put("message", "Banner image uploaded successfully");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload banner image: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteBannerImage() {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User user = userService.findByUsername(username);

            // Delete from S3
            if (user.getBannerImageUrl() != null && !user.getBannerImageUrl().isEmpty()) {
                s3Service.deleteBannerImage(user.getBannerImageUrl());
            }

            // Update user profile
            user.setBannerImageUrl(null);
            userService.save(user);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Banner image deleted successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete banner image: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @GetMapping("/url")
    public ResponseEntity<?> getBannerImageUrl() {
        try {
            // Get current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            User user = userService.findByUsername(username);

            Map<String, String> response = new HashMap<>();
            response.put("imageUrl", user.getBannerImageUrl() != null ? user.getBannerImageUrl() : "");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to get banner image URL: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
