package com.hdc.hdc_map_backend.entity.taxBenefits;

import com.hdc.hdc_map_backend.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for storing investor tax information
 * Used by OZ Calculator and Investment Portal
 */
@Entity
@Table(name = "investor_tax_info", schema = "tax_benefits")
public class InvestorTaxInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "profile_name")
    private String profileName;

    // Basic Tax Information
    @Column(name = "annual_income")
    private Double annualIncome;

    @Column(name = "annual_ordinary_income")
    private Double annualOrdinaryIncome;

    @Column(name = "annual_passive_income")
    private Double annualPassiveIncome;

    @Column(name = "annual_portfolio_income")
    private Double annualPortfolioIncome;

    @Column(name = "grouping_election")
    private Boolean groupingElection;

    @Column(name = "filing_status")
    private String filingStatus; // 'single' or 'married'

    // Tax Rates
    @Column(name = "federal_ordinary_rate")
    private Double federalOrdinaryRate;

    @Column(name = "state_ordinary_rate")
    private Double stateOrdinaryRate;

    @Column(name = "federal_capital_gains_rate")
    private Double federalCapitalGainsRate;

    @Column(name = "state_capital_gains_rate")
    private Double stateCapitalGainsRate;

    // State/Location
    @Column(name = "selected_state")
    private String selectedState;

    @Column(name = "project_location")
    private String projectLocation;

    // Investor Profile
    @Column(name = "investor_track")
    private String investorTrack; // 'rep' or 'non-rep'

    @Column(name = "passive_gain_type")
    private String passiveGainType; // 'short-term' or 'long-term'

    @Column(name = "rep_status")
    private Boolean repStatus;

    // OZ Configuration
    @Column(name = "oz_type")
    private String ozType; // 'standard' or 'rural'

    @Column(name = "deferred_capital_gains")
    private Double deferredCapitalGains;

    @Column(name = "capital_gains_tax_rate")
    private Double capitalGainsTaxRate;

    // Metadata
    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getProfileName() {
        return profileName;
    }

    public void setProfileName(String profileName) {
        this.profileName = profileName;
    }

    public Double getAnnualIncome() {
        return annualIncome;
    }

    public void setAnnualIncome(Double annualIncome) {
        this.annualIncome = annualIncome;
    }

    public Double getAnnualOrdinaryIncome() { return annualOrdinaryIncome; }
    public void setAnnualOrdinaryIncome(Double annualOrdinaryIncome) { this.annualOrdinaryIncome = annualOrdinaryIncome; }

    public Double getAnnualPassiveIncome() { return annualPassiveIncome; }
    public void setAnnualPassiveIncome(Double annualPassiveIncome) { this.annualPassiveIncome = annualPassiveIncome; }

    public Double getAnnualPortfolioIncome() { return annualPortfolioIncome; }
    public void setAnnualPortfolioIncome(Double annualPortfolioIncome) { this.annualPortfolioIncome = annualPortfolioIncome; }

    public Boolean getGroupingElection() { return groupingElection; }
    public void setGroupingElection(Boolean groupingElection) { this.groupingElection = groupingElection; }

    public String getFilingStatus() {
        return filingStatus;
    }

    public void setFilingStatus(String filingStatus) {
        this.filingStatus = filingStatus;
    }

    public Double getFederalOrdinaryRate() {
        return federalOrdinaryRate;
    }

    public void setFederalOrdinaryRate(Double federalOrdinaryRate) {
        this.federalOrdinaryRate = federalOrdinaryRate;
    }

    public Double getStateOrdinaryRate() {
        return stateOrdinaryRate;
    }

    public void setStateOrdinaryRate(Double stateOrdinaryRate) {
        this.stateOrdinaryRate = stateOrdinaryRate;
    }

    public Double getFederalCapitalGainsRate() {
        return federalCapitalGainsRate;
    }

    public void setFederalCapitalGainsRate(Double federalCapitalGainsRate) {
        this.federalCapitalGainsRate = federalCapitalGainsRate;
    }

    public Double getStateCapitalGainsRate() {
        return stateCapitalGainsRate;
    }

    public void setStateCapitalGainsRate(Double stateCapitalGainsRate) {
        this.stateCapitalGainsRate = stateCapitalGainsRate;
    }

    public String getSelectedState() {
        return selectedState;
    }

    public void setSelectedState(String selectedState) {
        this.selectedState = selectedState;
    }

    public String getProjectLocation() {
        return projectLocation;
    }

    public void setProjectLocation(String projectLocation) {
        this.projectLocation = projectLocation;
    }

    public String getInvestorTrack() {
        return investorTrack;
    }

    public void setInvestorTrack(String investorTrack) {
        this.investorTrack = investorTrack;
    }

    public String getPassiveGainType() {
        return passiveGainType;
    }

    public void setPassiveGainType(String passiveGainType) {
        this.passiveGainType = passiveGainType;
    }

    public Boolean getRepStatus() {
        return repStatus;
    }

    public void setRepStatus(Boolean repStatus) {
        this.repStatus = repStatus;
    }

    public String getOzType() {
        return ozType;
    }

    public void setOzType(String ozType) {
        this.ozType = ozType;
    }

    public Double getDeferredCapitalGains() {
        return deferredCapitalGains;
    }

    public void setDeferredCapitalGains(Double deferredCapitalGains) {
        this.deferredCapitalGains = deferredCapitalGains;
    }

    public Double getCapitalGainsTaxRate() {
        return capitalGainsTaxRate;
    }

    public void setCapitalGainsTaxRate(Double capitalGainsTaxRate) {
        this.capitalGainsTaxRate = capitalGainsTaxRate;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
