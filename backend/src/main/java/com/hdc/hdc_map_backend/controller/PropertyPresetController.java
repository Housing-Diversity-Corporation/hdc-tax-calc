package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.entity.PropertyPreset;
import com.hdc.hdc_map_backend.service.PropertyPresetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/property-presets")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com", "https://calc.angelfhr.com" })
public class PropertyPresetController {

    @Autowired
    private PropertyPresetService propertyPresetService;

    /**
     * Get all active property presets
     */
    @GetMapping
    public ResponseEntity<List<PropertyPreset>> getAllActivePresets() {
        List<PropertyPreset> presets = propertyPresetService.getAllActivePresets();
        return ResponseEntity.ok(presets);
    }

    /**
     * Get all presets including inactive (admin)
     */
    @GetMapping("/all")
    public ResponseEntity<List<PropertyPreset>> getAllPresets() {
        List<PropertyPreset> presets = propertyPresetService.getAllPresets();
        return ResponseEntity.ok(presets);
    }

    /**
     * Get property presets by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<PropertyPreset>> getPresetsByCategory(@PathVariable String category) {
        List<PropertyPreset> presets = propertyPresetService.getPresetsByCategory(category);
        return ResponseEntity.ok(presets);
    }

    /**
     * Get investment opportunities (Specific Properties)
     */
    @GetMapping("/investment-opportunities")
    public ResponseEntity<List<PropertyPreset>> getInvestmentOpportunities() {
        List<PropertyPreset> opportunities = propertyPresetService.getInvestmentOpportunities();
        return ResponseEntity.ok(opportunities);
    }

    /**
     * Get a specific preset by preset_id
     */
    @GetMapping("/preset/{presetId}")
    public ResponseEntity<PropertyPreset> getPresetByPresetId(@PathVariable String presetId) {
        Optional<PropertyPreset> preset = propertyPresetService.getPresetByPresetId(presetId);
        return preset.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get a specific preset by database ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PropertyPreset> getPresetById(@PathVariable Long id) {
        Optional<PropertyPreset> preset = propertyPresetService.getPresetById(id);
        return preset.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new property preset (admin)
     */
    @PostMapping
    public ResponseEntity<PropertyPreset> createPreset(@RequestBody PropertyPreset preset) {
        PropertyPreset saved = propertyPresetService.savePreset(preset);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Update an existing preset (admin)
     */
    @PutMapping("/{id}")
    public ResponseEntity<PropertyPreset> updatePreset(
            @PathVariable Long id,
            @RequestBody PropertyPreset preset) {
        try {
            PropertyPreset updated = propertyPresetService.updatePreset(id, preset);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Deactivate a preset (soft delete, admin)
     */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivatePreset(@PathVariable Long id) {
        try {
            propertyPresetService.deactivatePreset(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete a preset permanently (admin)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePreset(@PathVariable Long id) {
        propertyPresetService.deletePreset(id);
        return ResponseEntity.noContent().build();
    }
}
