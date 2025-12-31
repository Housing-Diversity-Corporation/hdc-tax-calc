package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.dto.MarkerDTO;
import com.hdc.hdc_map_backend.entity.Marker;
import com.hdc.hdc_map_backend.service.MarkerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/markers")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class MarkerController {

    @Autowired
    private MarkerService markerService;

    @PostMapping("/save")
    public ResponseEntity<Marker> saveMarker(@RequestBody Marker marker,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(markerService.saveMarker(marker, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<Marker>> getMarkers(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(markerService.getMarkersByUsername(userDetails.getUsername()));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Marker>> getMarkersByUserId(@PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        // Any authenticated user can view super user's (id=8) markers
        // This allows sharing template markers across all users
        return ResponseEntity.ok(markerService.getMarkersByUserId(userId));
    }

    @GetMapping("/templates")
    public ResponseEntity<List<MarkerDTO>> getTemplateMarkers(@AuthenticationPrincipal UserDetails userDetails) {
        // Get template markers from super user (ID 8)
        List<Marker> markers = markerService.getMarkersByUserId(8L);
        List<MarkerDTO> markerDTOs = markers.stream()
                .map(MarkerDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(markerDTOs);
    }

    @GetMapping("/{markerId}")
    public ResponseEntity<MarkerDTO> getMarkerById(@PathVariable Long markerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Marker marker = markerService.getMarkerById(markerId);
            return ResponseEntity.ok(MarkerDTO.fromEntity(marker));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{markerId}")
    public ResponseEntity<Void> deleteMarker(@PathVariable Long markerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        markerService.deleteMarker(markerId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
