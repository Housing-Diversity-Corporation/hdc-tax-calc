package com.hdc.hdc_map_backend.controller.taxBenefits;

import com.hdc.hdc_map_backend.dto.taxBenefits.DealBenefitProfileView;
import com.hdc.hdc_map_backend.entity.taxBenefits.DealBenefitProfile;
import com.hdc.hdc_map_backend.service.taxBenefits.DealBenefitProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/deal-benefit-profiles")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://calc.americanhousing.fund" })
public class DealBenefitProfileController {

    @Autowired
    private DealBenefitProfileService dealBenefitProfileService;

    @GetMapping
    public ResponseEntity<List<DealBenefitProfile>> getAllProfiles() {
        List<DealBenefitProfile> profiles = dealBenefitProfileService.getAllProfiles();
        return ResponseEntity.ok(profiles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DealBenefitProfile> getProfileById(@PathVariable Long id) {
        Optional<DealBenefitProfile> profile = dealBenefitProfileService.getProfileById(id);
        return profile.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/view")
    public ResponseEntity<DealBenefitProfileView> getProfileView(@PathVariable Long id) {
        Optional<DealBenefitProfileView> view = dealBenefitProfileService.getProfileView(id);
        return view.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/conduit/{conduitId}")
    public ResponseEntity<List<DealBenefitProfile>> getProfilesByConduit(@PathVariable Long conduitId) {
        List<DealBenefitProfile> profiles = dealBenefitProfileService.getProfilesByConduit(conduitId);
        return ResponseEntity.ok(profiles);
    }

    @PostMapping("/extract/{conduitId}")
    public ResponseEntity<DealBenefitProfile> extractProfile(
            @PathVariable Long conduitId,
            @RequestBody DealBenefitProfile incoming) {
        try {
            DealBenefitProfile saved = dealBenefitProfileService.extractProfile(conduitId, incoming);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfile(@PathVariable Long id) {
        dealBenefitProfileService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }
}
