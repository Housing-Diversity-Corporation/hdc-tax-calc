package com.hdc.hdc_map_backend.service;

import com.hdc.hdc_map_backend.entity.InvestorTaxInfo;
import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.repository.user.InvestorTaxInfoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class InvestorTaxInfoService {

    @Autowired
    private InvestorTaxInfoRepository investorTaxInfoRepository;

    @Autowired
    private UserService userService;

    public List<InvestorTaxInfo> getUserTaxInfo(String username) {
        User user = userService.findByUsername(username);
        return investorTaxInfoRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional
    public InvestorTaxInfo saveTaxInfo(String username, InvestorTaxInfo taxInfo) {
        User user = userService.findByUsername(username);
        taxInfo.setUser(user);

        // If this is set as default, clear other defaults for this user
        if (taxInfo.getIsDefault() != null && taxInfo.getIsDefault()) {
            clearUserDefaults(user);
        }

        return investorTaxInfoRepository.save(taxInfo);
    }

    @Transactional
    public InvestorTaxInfo updateTaxInfo(String username, Long id, InvestorTaxInfo updatedTaxInfo) {
        User user = userService.findByUsername(username);
        Optional<InvestorTaxInfo> existingTaxInfo = investorTaxInfoRepository.findByIdAndUser(id, user);

        if (existingTaxInfo.isPresent()) {
            InvestorTaxInfo taxInfo = existingTaxInfo.get();

            // Update all fields
            taxInfo.setProfileName(updatedTaxInfo.getProfileName());
            taxInfo.setAnnualIncome(updatedTaxInfo.getAnnualIncome());
            taxInfo.setAnnualOrdinaryIncome(updatedTaxInfo.getAnnualOrdinaryIncome());
            taxInfo.setAnnualPassiveIncome(updatedTaxInfo.getAnnualPassiveIncome());
            taxInfo.setAnnualPortfolioIncome(updatedTaxInfo.getAnnualPortfolioIncome());
            taxInfo.setGroupingElection(updatedTaxInfo.getGroupingElection());
            taxInfo.setFilingStatus(updatedTaxInfo.getFilingStatus());
            taxInfo.setFederalOrdinaryRate(updatedTaxInfo.getFederalOrdinaryRate());
            taxInfo.setStateOrdinaryRate(updatedTaxInfo.getStateOrdinaryRate());
            taxInfo.setFederalCapitalGainsRate(updatedTaxInfo.getFederalCapitalGainsRate());
            taxInfo.setStateCapitalGainsRate(updatedTaxInfo.getStateCapitalGainsRate());
            taxInfo.setSelectedState(updatedTaxInfo.getSelectedState());
            taxInfo.setProjectLocation(updatedTaxInfo.getProjectLocation());
            taxInfo.setInvestorTrack(updatedTaxInfo.getInvestorTrack());
            taxInfo.setPassiveGainType(updatedTaxInfo.getPassiveGainType());
            taxInfo.setRepStatus(updatedTaxInfo.getRepStatus());
            taxInfo.setOzType(updatedTaxInfo.getOzType());
            taxInfo.setDeferredCapitalGains(updatedTaxInfo.getDeferredCapitalGains());
            taxInfo.setCapitalGainsTaxRate(updatedTaxInfo.getCapitalGainsTaxRate());

            // Handle default flag
            if (updatedTaxInfo.getIsDefault() != null && updatedTaxInfo.getIsDefault()) {
                clearUserDefaults(user);
                taxInfo.setIsDefault(true);
            } else {
                taxInfo.setIsDefault(updatedTaxInfo.getIsDefault());
            }

            return investorTaxInfoRepository.save(taxInfo);
        }

        throw new RuntimeException("Tax info not found or unauthorized");
    }

    public Optional<InvestorTaxInfo> getTaxInfo(String username, Long id) {
        User user = userService.findByUsername(username);
        return investorTaxInfoRepository.findByIdAndUser(id, user);
    }

    public Optional<InvestorTaxInfo> getDefaultTaxInfo(String username) {
        User user = userService.findByUsername(username);
        return investorTaxInfoRepository.findByUserAndIsDefaultTrue(user);
    }

    @Transactional
    public void deleteTaxInfo(String username, Long id) {
        User user = userService.findByUsername(username);
        investorTaxInfoRepository.deleteByIdAndUser(id, user);
    }

    @Transactional
    public void setAsDefault(String username, Long id) {
        User user = userService.findByUsername(username);
        Optional<InvestorTaxInfo> taxInfo = investorTaxInfoRepository.findByIdAndUser(id, user);

        if (taxInfo.isPresent()) {
            clearUserDefaults(user);
            taxInfo.get().setIsDefault(true);
            investorTaxInfoRepository.save(taxInfo.get());
        } else {
            throw new RuntimeException("Tax info not found or unauthorized");
        }
    }

    private void clearUserDefaults(User user) {
        List<InvestorTaxInfo> taxInfos = investorTaxInfoRepository.findByUserOrderByCreatedAtDesc(user);
        for (InvestorTaxInfo taxInfo : taxInfos) {
            if (taxInfo.getIsDefault() != null && taxInfo.getIsDefault()) {
                taxInfo.setIsDefault(false);
                investorTaxInfoRepository.save(taxInfo);
            }
        }
    }
}
