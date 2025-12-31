package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/account")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com", "https://calc.angelfhr.com" })
public class AccountController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<User> getMyInfo(Principal principal) {
        System.out.println("AccountController: /me endpoint called");
        System.out.println("Principal name: " + (principal != null ? principal.getName() : "null"));

        if (principal == null) {
            System.out.println("Principal is null - authentication failed");
            return ResponseEntity.status(401).build();
        }

        User user = userService.findByUsername(principal.getName());
        System.out.println("Found user: " + (user != null ? user.getUsername() : "null"));
        System.out.println("User full name: " + (user != null ? user.getFullName() : "null"));

        return ResponseEntity.ok(user);
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody User profileUpdate, Principal principal) {
        System.out.println("AccountController: /update endpoint called");

        if (principal == null) {
            System.out.println("Principal is null - authentication failed");
            return ResponseEntity.status(401).build();
        }

        try {
            User existingUser = userService.findByUsername(principal.getName());

            // Update only the profile fields
            if (profileUpdate.getFullName() != null) {
                existingUser.setFullName(profileUpdate.getFullName());
            }
            if (profileUpdate.getJobTitle() != null) {
                existingUser.setJobTitle(profileUpdate.getJobTitle());
            }
            if (profileUpdate.getIndustry() != null) {
                existingUser.setIndustry(profileUpdate.getIndustry());
            }
            if (profileUpdate.getOrganization() != null) {
                existingUser.setOrganization(profileUpdate.getOrganization());
            }
            if (profileUpdate.getLocation() != null) {
                existingUser.setLocation(profileUpdate.getLocation());
            }
            if (profileUpdate.getContactEmail() != null) {
                existingUser.setContactEmail(profileUpdate.getContactEmail());
            }
            if (profileUpdate.getPhone() != null) {
                existingUser.setPhone(profileUpdate.getPhone());
            }
            if (profileUpdate.getBio() != null) {
                existingUser.setBio(profileUpdate.getBio());
            }
            if (profileUpdate.getBannerImageUrl() != null) {
                existingUser.setBannerImageUrl(profileUpdate.getBannerImageUrl());
            }
            if (profileUpdate.getEmailNotify() != null) {
                existingUser.setEmailNotify(profileUpdate.getEmailNotify());
            }

            User updatedUser = userService.save(existingUser);
            System.out.println("Profile updated for user: " + updatedUser.getUsername());

            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            System.err.println("Error updating profile: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update profile");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
