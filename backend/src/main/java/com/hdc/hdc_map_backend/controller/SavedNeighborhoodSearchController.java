package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.entity.SavedNeighborhoodSearch;
import com.hdc.hdc_map_backend.service.SavedNeighborhoodSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/neighborhood-searches")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class SavedNeighborhoodSearchController {

    @Autowired
    private SavedNeighborhoodSearchService neighborhoodSearchService;

    /**
     * Save a new neighborhood search configuration
     */
    @PostMapping("/save")
    public ResponseEntity<SavedNeighborhoodSearch> saveNeighborhoodSearch(
            @RequestBody SavedNeighborhoodSearch search,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(neighborhoodSearchService.saveNeighborhoodSearch(search, userDetails.getUsername()));
    }

    /**
     * Get all saved neighborhood searches for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<SavedNeighborhoodSearch>> getNeighborhoodSearches(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(neighborhoodSearchService.getNeighborhoodSearchesByUsername(userDetails.getUsername()));
    }

    /**
     * Get a specific saved neighborhood search by ID
     */
    @GetMapping("/{searchId}")
    public ResponseEntity<SavedNeighborhoodSearch> getNeighborhoodSearch(
            @PathVariable Long searchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(neighborhoodSearchService.getNeighborhoodSearchById(searchId, userDetails.getUsername()));
    }

    /**
     * Delete a saved neighborhood search
     */
    @DeleteMapping("/{searchId}")
    public ResponseEntity<Void> deleteNeighborhoodSearch(
            @PathVariable Long searchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        neighborhoodSearchService.deleteNeighborhoodSearch(searchId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    /**
     * Update an existing saved neighborhood search
     */
    @PutMapping("/{searchId}")
    public ResponseEntity<SavedNeighborhoodSearch> updateNeighborhoodSearch(
            @PathVariable Long searchId,
            @RequestBody SavedNeighborhoodSearch search,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(neighborhoodSearchService.updateNeighborhoodSearch(searchId, search, userDetails.getUsername()));
    }
}
