package com.hdc.hdc_map_backend.controller.taxBenefits;

import com.hdc.hdc_map_backend.entity.taxBenefits.DealConduit;
import com.hdc.hdc_map_backend.service.taxBenefits.DealConduitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/deal-conduits")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com", "https://calc.angelfhr.com" })
public class DealConduitController {

    @Autowired
    private DealConduitService dealConduitService;

    // === User Configurations ===

    // GET /api/deal-conduits/configurations — user's configs
    @GetMapping("/configurations")
    public ResponseEntity<List<DealConduit>> getUserConfigurations(Principal principal) {
        return ResponseEntity.ok(dealConduitService.getUserConfigurations(principal.getName()));
    }

    // GET /api/deal-conduits/configurations/all — all configs (collaboration)
    @GetMapping("/configurations/all")
    public ResponseEntity<List<DealConduit>> getAllConfigurations() {
        return ResponseEntity.ok(dealConduitService.getAllConfigurations());
    }

    // GET /api/deal-conduits/{id} — any conduit by ID (preset or config)
    @GetMapping("/{id}")
    public ResponseEntity<DealConduit> getConduit(@PathVariable Long id) {
        return dealConduitService.getConduitById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/deal-conduits/configurations/default — user's default config
    @GetMapping("/configurations/default")
    public ResponseEntity<DealConduit> getDefaultConfiguration(Principal principal) {
        return dealConduitService.getDefaultConfiguration(principal.getName())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/deal-conduits/configurations — save new user config
    @PostMapping("/configurations")
    public ResponseEntity<DealConduit> saveConfiguration(@RequestBody DealConduit conduit, Principal principal) {
        DealConduit saved = dealConduitService.saveConfiguration(principal.getName(), conduit);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // PUT /api/deal-conduits/configurations/{id} — update user config
    @PutMapping("/configurations/{id}")
    public ResponseEntity<DealConduit> updateConfiguration(@PathVariable Long id, @RequestBody DealConduit conduit, Principal principal) {
        try {
            DealConduit updated = dealConduitService.updateConfiguration(principal.getName(), id, conduit);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // PUT /api/deal-conduits/configurations/{id}/set-default — mark as user's default
    @PutMapping("/configurations/{id}/set-default")
    public ResponseEntity<Void> setAsDefault(@PathVariable Long id, Principal principal) {
        try {
            dealConduitService.setAsDefault(principal.getName(), id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE /api/deal-conduits/configurations/{id} — delete user config
    @DeleteMapping("/configurations/{id}")
    public ResponseEntity<Void> deleteConfiguration(@PathVariable Long id, Principal principal) {
        dealConduitService.deleteConfiguration(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }

    // === Presets ===

    // GET /api/deal-conduits/presets — active presets
    @GetMapping("/presets")
    public ResponseEntity<List<DealConduit>> getActivePresets() {
        return ResponseEntity.ok(dealConduitService.getActivePresets());
    }

    // GET /api/deal-conduits/presets/all — all presets (admin)
    @GetMapping("/presets/all")
    public ResponseEntity<List<DealConduit>> getAllPresets() {
        return ResponseEntity.ok(dealConduitService.getAllPresets());
    }

    // GET /api/deal-conduits/presets/category/{category} — presets by category
    @GetMapping("/presets/category/{category}")
    public ResponseEntity<List<DealConduit>> getPresetsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(dealConduitService.getPresetsByCategory(category));
    }

    // POST /api/deal-conduits/presets — create preset (admin)
    @PostMapping("/presets")
    public ResponseEntity<DealConduit> savePreset(@RequestBody DealConduit conduit) {
        DealConduit saved = dealConduitService.savePreset(conduit);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // PUT /api/deal-conduits/presets/{id} — update preset (admin)
    @PutMapping("/presets/{id}")
    public ResponseEntity<DealConduit> updatePreset(@PathVariable Long id, @RequestBody DealConduit conduit) {
        try {
            DealConduit updated = dealConduitService.updatePreset(id, conduit);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE /api/deal-conduits/presets/{id} — delete preset (admin)
    @DeleteMapping("/presets/{id}")
    public ResponseEntity<Void> deletePreset(@PathVariable Long id) {
        dealConduitService.deletePreset(id);
        return ResponseEntity.noContent().build();
    }
}
