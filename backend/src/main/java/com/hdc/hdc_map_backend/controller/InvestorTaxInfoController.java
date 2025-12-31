package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.entity.InvestorTaxInfo;
import com.hdc.hdc_map_backend.service.InvestorTaxInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/investor/tax-info")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com", "https://calc.angelfhr.com" })
public class InvestorTaxInfoController {

    @Autowired
    private InvestorTaxInfoService investorTaxInfoService;

    @GetMapping
    public ResponseEntity<List<InvestorTaxInfo>> getUserTaxInfo(Principal principal) {
        List<InvestorTaxInfo> taxInfos = investorTaxInfoService.getUserTaxInfo(principal.getName());
        return ResponseEntity.ok(taxInfos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvestorTaxInfo> getTaxInfo(@PathVariable Long id, Principal principal) {
        Optional<InvestorTaxInfo> taxInfo = investorTaxInfoService.getTaxInfo(principal.getName(), id);
        return taxInfo.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/default")
    public ResponseEntity<InvestorTaxInfo> getDefaultTaxInfo(Principal principal) {
        Optional<InvestorTaxInfo> taxInfo = investorTaxInfoService.getDefaultTaxInfo(principal.getName());
        return taxInfo.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<InvestorTaxInfo> saveTaxInfo(@RequestBody InvestorTaxInfo taxInfo, Principal principal) {
        InvestorTaxInfo saved = investorTaxInfoService.saveTaxInfo(principal.getName(), taxInfo);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvestorTaxInfo> updateTaxInfo(
            @PathVariable Long id,
            @RequestBody InvestorTaxInfo taxInfo,
            Principal principal) {
        try {
            InvestorTaxInfo updated = investorTaxInfoService.updateTaxInfo(principal.getName(), id, taxInfo);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/set-default")
    public ResponseEntity<Void> setAsDefault(@PathVariable Long id, Principal principal) {
        try {
            investorTaxInfoService.setAsDefault(principal.getName(), id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTaxInfo(@PathVariable Long id, Principal principal) {
        investorTaxInfoService.deleteTaxInfo(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
