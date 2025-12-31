package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.entity.CalculatorConfiguration;
import com.hdc.hdc_map_backend.service.CalculatorConfigurationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/calculator/configurations")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com", "https://calc.angelfhr.com" })
public class CalculatorConfigurationController {

    @Autowired
    private CalculatorConfigurationService calculatorConfigurationService;

    @GetMapping
    public ResponseEntity<List<CalculatorConfiguration>> getUserConfigurations(Principal principal) {
        List<CalculatorConfiguration> configurations = calculatorConfigurationService.getUserConfigurations(principal.getName());
        return ResponseEntity.ok(configurations);
    }

    // New endpoint to get ALL configurations from all users (for collaboration)
    @GetMapping("/all")
    public ResponseEntity<List<CalculatorConfiguration>> getAllConfigurations() {
        List<CalculatorConfiguration> configurations = calculatorConfigurationService.getAllConfigurations();
        return ResponseEntity.ok(configurations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalculatorConfiguration> getConfiguration(@PathVariable Long id, Principal principal) {
        // For collaboration: Allow any authenticated user to get any configuration
        Optional<CalculatorConfiguration> configuration = calculatorConfigurationService.getConfigurationById(id);
        return configuration.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/default")
    public ResponseEntity<CalculatorConfiguration> getDefaultConfiguration(Principal principal) {
        Optional<CalculatorConfiguration> configuration = calculatorConfigurationService.getDefaultConfiguration(principal.getName());
        return configuration.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CalculatorConfiguration> saveConfiguration(@RequestBody CalculatorConfiguration configuration, Principal principal) {
        CalculatorConfiguration saved = calculatorConfigurationService.saveConfiguration(principal.getName(), configuration);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalculatorConfiguration> updateConfiguration(
            @PathVariable Long id, 
            @RequestBody CalculatorConfiguration configuration, 
            Principal principal) {
        try {
            CalculatorConfiguration updated = calculatorConfigurationService.updateConfiguration(principal.getName(), id, configuration);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/set-default")
    public ResponseEntity<Void> setAsDefault(@PathVariable Long id, Principal principal) {
        try {
            calculatorConfigurationService.setAsDefault(principal.getName(), id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConfiguration(@PathVariable Long id, Principal principal) {
        calculatorConfigurationService.deleteConfiguration(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}