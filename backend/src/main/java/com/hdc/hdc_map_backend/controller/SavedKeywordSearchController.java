package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.entity.SavedKeywordSearch;
import com.hdc.hdc_map_backend.service.SavedKeywordSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/keyword-searches")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class SavedKeywordSearchController {

    @Autowired
    private SavedKeywordSearchService savedKeywordSearchService;

    @PostMapping("/save")
    public ResponseEntity<SavedKeywordSearch> saveSearch(@RequestBody SavedKeywordSearch search,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(savedKeywordSearchService.saveKeywordSearch(search, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<SavedKeywordSearch>> getSavedSearches(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(savedKeywordSearchService.getSavedSearchesByUsername(userDetails.getUsername()));
    }

    @DeleteMapping("/{searchId}")
    public ResponseEntity<Void> deleteSearch(@PathVariable Long searchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        savedKeywordSearchService.deleteSavedSearch(searchId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
