package com.hdc.hdc_map_backend.controller.taxBenefits;

import com.hdc.hdc_map_backend.dto.taxBenefits.PoolWithDealsResponse;
import com.hdc.hdc_map_backend.entity.taxBenefits.InvestmentPool;
import com.hdc.hdc_map_backend.entity.taxBenefits.PoolMembership;
import com.hdc.hdc_map_backend.service.taxBenefits.InvestmentPoolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/investment-pools")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com", "https://calc.angelfhr.com" })
public class InvestmentPoolController {

    @Autowired
    private InvestmentPoolService investmentPoolService;

    @GetMapping
    public ResponseEntity<List<InvestmentPool>> getAllPools() {
        List<InvestmentPool> pools = investmentPoolService.getAllPools();
        return ResponseEntity.ok(pools);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvestmentPool> getPoolById(@PathVariable Long id) {
        Optional<InvestmentPool> pool = investmentPoolService.getPoolById(id);
        return pool.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/deals")
    public ResponseEntity<PoolWithDealsResponse> getPoolWithDeals(@PathVariable Long id) {
        try {
            PoolWithDealsResponse response = investmentPoolService.getPoolWithDeals(id);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<InvestmentPool> createPool(@RequestBody InvestmentPool pool) {
        InvestmentPool saved = investmentPoolService.createPool(pool);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvestmentPool> updatePool(@PathVariable Long id, @RequestBody InvestmentPool incoming) {
        try {
            InvestmentPool updated = investmentPoolService.updatePool(id, incoming);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePool(@PathVariable Long id) {
        investmentPoolService.deletePool(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{poolId}/deals/{dbpId}")
    public ResponseEntity<PoolMembership> addDealToPool(@PathVariable Long poolId, @PathVariable Long dbpId) {
        try {
            PoolMembership membership = investmentPoolService.addDealToPool(poolId, dbpId);
            return ResponseEntity.status(HttpStatus.CREATED).body(membership);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Deal already in pool")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{poolId}/deals/{dbpId}")
    public ResponseEntity<Void> removeDealFromPool(@PathVariable Long poolId, @PathVariable Long dbpId) {
        try {
            investmentPoolService.removeDealFromPool(poolId, dbpId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
