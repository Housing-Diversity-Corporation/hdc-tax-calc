package com.hdc.hdc_map_backend.service;

import com.hdc.hdc_map_backend.entity.PropertyPreset;
import com.hdc.hdc_map_backend.repository.user.PropertyPresetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PropertyPresetService {

    @Autowired
    private PropertyPresetRepository propertyPresetRepository;

    /**
     * Get all active property presets
     */
    public List<PropertyPreset> getAllActivePresets() {
        return propertyPresetRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }

    /**
     * Get all presets (including inactive)
     */
    public List<PropertyPreset> getAllPresets() {
        return propertyPresetRepository.findAll();
    }

    /**
     * Get property presets by category (only active)
     */
    public List<PropertyPreset> getPresetsByCategory(String category) {
        return propertyPresetRepository.findByCategoryAndIsActiveTrueOrderByCreatedAtDesc(category);
    }

    /**
     * Get a specific preset by its preset_id
     */
    public Optional<PropertyPreset> getPresetByPresetId(String presetId) {
        return propertyPresetRepository.findByPresetId(presetId);
    }

    /**
     * Get a specific preset by database ID
     */
    public Optional<PropertyPreset> getPresetById(Long id) {
        return propertyPresetRepository.findById(id);
    }

    /**
     * Save or update a property preset (admin function)
     */
    @Transactional
    public PropertyPreset savePreset(PropertyPreset preset) {
        return propertyPresetRepository.save(preset);
    }

    /**
     * Update an existing preset (admin function)
     */
    @Transactional
    public PropertyPreset updatePreset(Long id, PropertyPreset updatedPreset) {
        Optional<PropertyPreset> existingPreset = propertyPresetRepository.findById(id);

        if (existingPreset.isPresent()) {
            PropertyPreset preset = existingPreset.get();

            // Update all fields
            preset.setPresetId(updatedPreset.getPresetId());
            preset.setName(updatedPreset.getName());
            preset.setCategory(updatedPreset.getCategory());
            preset.setDescription(updatedPreset.getDescription());
            preset.setIsActive(updatedPreset.getIsActive());

            // Project fundamentals
            preset.setProjectCost(updatedPreset.getProjectCost());
            preset.setLandValue(updatedPreset.getLandValue());
            preset.setYearOneNoi(updatedPreset.getYearOneNoi());
            preset.setYearOneDepreciationPct(updatedPreset.getYearOneDepreciationPct());
            preset.setRevenueGrowth(updatedPreset.getRevenueGrowth());
            preset.setOpexRatio(updatedPreset.getOpexRatio());
            preset.setExitCapRate(updatedPreset.getExitCapRate());

            // Capital structure
            preset.setInvestorEquityPct(updatedPreset.getInvestorEquityPct());
            preset.setPhilanthropicEquityPct(updatedPreset.getPhilanthropicEquityPct());
            preset.setSeniorDebtPct(updatedPreset.getSeniorDebtPct());
            preset.setSeniorDebtRate(updatedPreset.getSeniorDebtRate());
            preset.setSeniorDebtAmortization(updatedPreset.getSeniorDebtAmortization());
            preset.setPhilDebtPct(updatedPreset.getPhilDebtPct());
            preset.setPhilDebtRate(updatedPreset.getPhilDebtRate());
            preset.setPhilDebtAmortization(updatedPreset.getPhilDebtAmortization());
            preset.setHdcSubDebtPct(updatedPreset.getHdcSubDebtPct());
            preset.setHdcSubDebtPikRate(updatedPreset.getHdcSubDebtPikRate());
            preset.setInvestorSubDebtPct(updatedPreset.getInvestorSubDebtPct());
            preset.setInvestorSubDebtPikRate(updatedPreset.getInvestorSubDebtPikRate());
            preset.setOutsideInvestorSubDebtPct(updatedPreset.getOutsideInvestorSubDebtPct());
            preset.setOutsideInvestorSubDebtPikRate(updatedPreset.getOutsideInvestorSubDebtPikRate());

            // Tax parameters
            preset.setFederalTaxRate(updatedPreset.getFederalTaxRate());
            preset.setSelectedState(updatedPreset.getSelectedState());
            preset.setStateCapitalGainsRate(updatedPreset.getStateCapitalGainsRate());
            preset.setLtCapitalGainsRate(updatedPreset.getLtCapitalGainsRate());
            preset.setNiitRate(updatedPreset.getNiitRate());
            preset.setDepreciationRecaptureRate(updatedPreset.getDepreciationRecaptureRate());
            preset.setDeferredGains(updatedPreset.getDeferredGains());

            // HDC fees
            preset.setHdcFeeRate(updatedPreset.getHdcFeeRate());
            preset.setAumFeeEnabled(updatedPreset.getAumFeeEnabled());
            preset.setAumFeeRate(updatedPreset.getAumFeeRate());

            // Exit & Promote
            preset.setInvestorPromoteShare(updatedPreset.getInvestorPromoteShare());

            // Investment Portal fields
            preset.setDealLocation(updatedPreset.getDealLocation());
            preset.setUnits(updatedPreset.getUnits());
            preset.setAffordabilityMix(updatedPreset.getAffordabilityMix());
            preset.setProjectStatus(updatedPreset.getProjectStatus());
            preset.setMinimumInvestment(updatedPreset.getMinimumInvestment());
            preset.setDealImageUrl(updatedPreset.getDealImageUrl());

            return propertyPresetRepository.save(preset);
        }

        throw new RuntimeException("Property preset not found");
    }

    /**
     * Deactivate a preset (soft delete)
     */
    @Transactional
    public void deactivatePreset(Long id) {
        Optional<PropertyPreset> preset = propertyPresetRepository.findById(id);
        if (preset.isPresent()) {
            preset.get().setIsActive(false);
            propertyPresetRepository.save(preset.get());
        } else {
            throw new RuntimeException("Property preset not found");
        }
    }

    /**
     * Hard delete a preset (admin function)
     */
    @Transactional
    public void deletePreset(Long id) {
        propertyPresetRepository.deleteById(id);
    }

    /**
     * Get investment opportunities (Specific Properties category)
     */
    public List<PropertyPreset> getInvestmentOpportunities() {
        return propertyPresetRepository.findByCategoryAndIsActiveTrueOrderByCreatedAtDesc("Specific Properties");
    }
}
