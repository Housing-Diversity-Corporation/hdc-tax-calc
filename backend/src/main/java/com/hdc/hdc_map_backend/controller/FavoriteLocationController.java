package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.entity.FavoriteLocation;
import com.hdc.hdc_map_backend.service.FavoriteLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorite-locations")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class FavoriteLocationController {

    @Autowired
    private FavoriteLocationService favoriteLocationService;

    @PostMapping("/save")
    public ResponseEntity<FavoriteLocation> saveFavoriteLocation(@RequestBody FavoriteLocation location,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(favoriteLocationService.saveFavoriteLocation(location, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<FavoriteLocation>> getFavoriteLocations(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(favoriteLocationService.getFavoriteLocationsByUsername(userDetails.getUsername()));
    }

    @DeleteMapping("/{locationId}")
    public ResponseEntity<Void> deleteFavoriteLocation(@PathVariable Long locationId,
            @AuthenticationPrincipal UserDetails userDetails) {
        favoriteLocationService.deleteFavoriteLocation(locationId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
