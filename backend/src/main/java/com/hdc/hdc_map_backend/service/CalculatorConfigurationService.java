package com.hdc.hdc_map_backend.service;

import com.hdc.hdc_map_backend.entity.CalculatorConfiguration;
import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.repository.user.CalculatorConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CalculatorConfigurationService {

    @Autowired
    private CalculatorConfigurationRepository calculatorConfigurationRepository;

    @Autowired
    private UserService userService;

    public List<CalculatorConfiguration> getUserConfigurations(String username) {
        User user = userService.findByUsername(username);
        return calculatorConfigurationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // Get all configurations from all users (for collaboration)
    public List<CalculatorConfiguration> getAllConfigurations() {
        return calculatorConfigurationRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public CalculatorConfiguration saveConfiguration(String username, CalculatorConfiguration configuration) {
        User user = userService.findByUsername(username);
        configuration.setUser(user);

        // If this is set as default, clear other defaults for this user
        if (configuration.getIsDefault() != null && configuration.getIsDefault()) {
            clearUserDefaults(user);
        }

        return calculatorConfigurationRepository.save(configuration);
    }

    @Transactional
    public CalculatorConfiguration updateConfiguration(String username, Long id, CalculatorConfiguration updatedConfiguration) {
        User user = userService.findByUsername(username);

        // Check if user has @housingdiversity.com email (can edit any config) or is the owner
        // Username is the email address in this system
        boolean isHDCUser = user.getUsername() != null && user.getUsername().toLowerCase().endsWith("@housingdiversity.com");

        Optional<CalculatorConfiguration> existingConfig;
        if (isHDCUser) {
            // HDC users can update any configuration
            existingConfig = calculatorConfigurationRepository.findById(id);
        } else {
            // Other users can only update their own configurations
            existingConfig = calculatorConfigurationRepository.findByIdAndUser(id, user);
        }

        if (existingConfig.isPresent()) {
            CalculatorConfiguration config = existingConfig.get();
            
            // Update fields
            config.setConfigurationName(updatedConfiguration.getConfigurationName());
            config.setProjectCost(updatedConfiguration.getProjectCost());
            config.setYearOneNOI(updatedConfiguration.getYearOneNOI());
            config.setYearOneDepreciationPct(updatedConfiguration.getYearOneDepreciationPct());
            config.setRevenueGrowth(updatedConfiguration.getRevenueGrowth());
            config.setOpexRatio(updatedConfiguration.getOpexRatio());
            config.setExitCapRate(updatedConfiguration.getExitCapRate());
            config.setInvestorEquityPct(updatedConfiguration.getInvestorEquityPct());
            config.setPhilanthropicEquityPct(updatedConfiguration.getPhilanthropicEquityPct());
            config.setSeniorDebtPct(updatedConfiguration.getSeniorDebtPct());
            config.setSeniorDebtRate(updatedConfiguration.getSeniorDebtRate());
            config.setSeniorDebtAmortization(updatedConfiguration.getSeniorDebtAmortization());
            config.setPhilDebtPct(updatedConfiguration.getPhilDebtPct());
            config.setPhilDebtRate(updatedConfiguration.getPhilDebtRate());
            config.setPhilDebtAmortization(updatedConfiguration.getPhilDebtAmortization());
            config.setHdcSubDebtPct(updatedConfiguration.getHdcSubDebtPct());
            config.setHdcSubDebtPikRate(updatedConfiguration.getHdcSubDebtPikRate());
            config.setInvestorSubDebtPct(updatedConfiguration.getInvestorSubDebtPct());
            config.setInvestorSubDebtPikRate(updatedConfiguration.getInvestorSubDebtPikRate());
            config.setFederalTaxRate(updatedConfiguration.getFederalTaxRate());
            config.setSelectedState(updatedConfiguration.getSelectedState());
            config.setStateCapitalGainsRate(updatedConfiguration.getStateCapitalGainsRate());
            config.setLtCapitalGainsRate(updatedConfiguration.getLtCapitalGainsRate());
            config.setNiitRate(updatedConfiguration.getNiitRate());
            config.setDepreciationRecaptureRate(updatedConfiguration.getDepreciationRecaptureRate());
            config.setDeferredGains(updatedConfiguration.getDeferredGains());
            config.setHdcFeeRate(updatedConfiguration.getHdcFeeRate());
            config.setHdcDevelopmentFeePct(updatedConfiguration.getHdcDevelopmentFeePct());
            config.setAumFeeEnabled(updatedConfiguration.getAumFeeEnabled());
            config.setAumFeeRate(updatedConfiguration.getAumFeeRate());
            config.setInvestorPromoteShare(updatedConfiguration.getInvestorPromoteShare());
            
            // Handle default flag
            if (updatedConfiguration.getIsDefault() != null && updatedConfiguration.getIsDefault()) {
                clearUserDefaults(user);
                config.setIsDefault(true);
            } else {
                config.setIsDefault(updatedConfiguration.getIsDefault());
            }

            // Investment Portal Settings
            config.setIsInvestorFacing(updatedConfiguration.getIsInvestorFacing());
            config.setDealDescription(updatedConfiguration.getDealDescription());
            config.setDealLocation(updatedConfiguration.getDealLocation());
            config.setDealLatitude(updatedConfiguration.getDealLatitude());
            config.setDealLongitude(updatedConfiguration.getDealLongitude());
            config.setUnits(updatedConfiguration.getUnits());
            config.setAffordabilityMix(updatedConfiguration.getAffordabilityMix());
            config.setProjectStatus(updatedConfiguration.getProjectStatus());
            config.setMinimumInvestment(updatedConfiguration.getMinimumInvestment());
            config.setDealImageUrl(updatedConfiguration.getDealImageUrl());

            return calculatorConfigurationRepository.save(config);
        }
        
        throw new RuntimeException("Configuration not found or unauthorized");
    }

    public Optional<CalculatorConfiguration> getConfiguration(String username, Long id) {
        User user = userService.findByUsername(username);
        return calculatorConfigurationRepository.findByIdAndUser(id, user);
    }

    // Get configuration by ID regardless of user (for collaboration)
    public Optional<CalculatorConfiguration> getConfigurationById(Long id) {
        return calculatorConfigurationRepository.findById(id);
    }

    public Optional<CalculatorConfiguration> getDefaultConfiguration(String username) {
        User user = userService.findByUsername(username);
        return calculatorConfigurationRepository.findByUserAndIsDefaultTrue(user);
    }

    @Transactional
    public void deleteConfiguration(String username, Long id) {
        User user = userService.findByUsername(username);

        // Check if user has @housingdiversity.com email (can delete any config) or is the owner
        // Username is the email address in this system
        boolean isHDCUser = user.getUsername() != null && user.getUsername().toLowerCase().endsWith("@housingdiversity.com");

        if (isHDCUser) {
            // HDC users can delete any configuration
            calculatorConfigurationRepository.deleteById(id);
        } else {
            // Other users can only delete their own configurations
            calculatorConfigurationRepository.deleteByIdAndUser(id, user);
        }
    }

    @Transactional
    public void setAsDefault(String username, Long id) {
        User user = userService.findByUsername(username);
        Optional<CalculatorConfiguration> config = calculatorConfigurationRepository.findByIdAndUser(id, user);
        
        if (config.isPresent()) {
            clearUserDefaults(user);
            config.get().setIsDefault(true);
            calculatorConfigurationRepository.save(config.get());
        } else {
            throw new RuntimeException("Configuration not found or unauthorized");
        }
    }

    private void clearUserDefaults(User user) {
        List<CalculatorConfiguration> configs = calculatorConfigurationRepository.findByUserOrderByCreatedAtDesc(user);
        for (CalculatorConfiguration config : configs) {
            if (config.getIsDefault() != null && config.getIsDefault()) {
                config.setIsDefault(false);
                calculatorConfigurationRepository.save(config);
            }
        }
    }
}