package com.hdc.hdc_map_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for storing property presets/templates
 * Used as investment opportunities in Investment Portal
 */
@Entity
@Table(name = "property_presets", schema = "user_schema")
public class PropertyPreset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "preset_id", unique = true, nullable = false)
    private String presetId; // e.g., '7324-mlk', 'default-standard'

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "category")
    private String category; // e.g., 'Specific Properties', 'Property Types'

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // Project Fundamentals (stored in millions)
    @Column(name = "project_cost")
    private Double projectCost;

    @Column(name = "land_value")
    private Double landValue;

    @Column(name = "year_one_noi")
    private Double yearOneNoi;

    @Column(name = "year_one_depreciation_pct")
    private Double yearOneDepreciationPct;

    @Column(name = "revenue_growth")
    private Double revenueGrowth;

    @Column(name = "opex_ratio")
    private Double opexRatio;

    @Column(name = "exit_cap_rate")
    private Double exitCapRate;

    // Capital Structure (percentages)
    @Column(name = "investor_equity_pct")
    private Double investorEquityPct;

    @Column(name = "philanthropic_equity_pct")
    private Double philanthropicEquityPct;

    @Column(name = "senior_debt_pct")
    private Double seniorDebtPct;

    @Column(name = "senior_debt_rate")
    private Double seniorDebtRate;

    @Column(name = "senior_debt_amortization")
    private Integer seniorDebtAmortization;

    @Column(name = "phil_debt_pct")
    private Double philDebtPct;

    @Column(name = "phil_debt_rate")
    private Double philDebtRate;

    @Column(name = "phil_debt_amortization")
    private Integer philDebtAmortization;

    @Column(name = "hdc_sub_debt_pct")
    private Double hdcSubDebtPct;

    @Column(name = "hdc_sub_debt_pik_rate")
    private Double hdcSubDebtPikRate;

    @Column(name = "investor_sub_debt_pct")
    private Double investorSubDebtPct;

    @Column(name = "investor_sub_debt_pik_rate")
    private Double investorSubDebtPikRate;

    @Column(name = "outside_investor_sub_debt_pct")
    private Double outsideInvestorSubDebtPct;

    @Column(name = "outside_investor_sub_debt_pik_rate")
    private Double outsideInvestorSubDebtPikRate;

    // Tax Parameters
    @Column(name = "federal_tax_rate")
    private Double federalTaxRate;

    @Column(name = "selected_state")
    private String selectedState;

    @Column(name = "state_capital_gains_rate")
    private Double stateCapitalGainsRate;

    @Column(name = "lt_capital_gains_rate")
    private Double ltCapitalGainsRate;

    @Column(name = "niit_rate")
    private Double niitRate;

    @Column(name = "depreciation_recapture_rate")
    private Double depreciationRecaptureRate;

    @Column(name = "deferred_gains")
    private Double deferredGains;

    // HDC Fees
    @Column(name = "hdc_fee_rate")
    private Double hdcFeeRate;

    @Column(name = "aum_fee_enabled")
    private Boolean aumFeeEnabled;

    @Column(name = "aum_fee_rate")
    private Double aumFeeRate;

    // Exit & Promote
    @Column(name = "investor_promote_share")
    private Double investorPromoteShare;

    // Investment Portal Display Fields
    @Column(name = "deal_location")
    private String dealLocation;

    @Column(name = "units")
    private Integer units;

    @Column(name = "affordability_mix")
    private String affordabilityMix;

    @Column(name = "project_status")
    private String projectStatus; // e.g., 'Development', 'Pre-TCO', 'Operating'

    @Column(name = "minimum_investment")
    private Double minimumInvestment;

    @Column(name = "deal_image_url")
    private String dealImageUrl;

    // Interest Reserve Settings
    @Column(name = "interest_reserve_enabled")
    private Boolean interestReserveEnabled = false;

    @Column(name = "interest_reserve_months")
    private Integer interestReserveMonths = 12;

    // Predevelopment Costs
    @Column(name = "predevelopment_costs")
    private Double predevelopmentCosts = 0.0;

    // PIK Current Pay Settings
    @Column(name = "pik_current_pay_enabled")
    private Boolean pikCurrentPayEnabled = false;

    @Column(name = "pik_current_pay_pct")
    private Double pikCurrentPayPct = 50.0;

    @Column(name = "investor_pik_current_pay_enabled")
    private Boolean investorPikCurrentPayEnabled = false;

    @Column(name = "investor_pik_current_pay_pct")
    private Double investorPikCurrentPayPct = 50.0;

    @Column(name = "outside_investor_pik_current_pay_enabled")
    private Boolean outsideInvestorPikCurrentPayEnabled = false;

    @Column(name = "outside_investor_pik_current_pay_pct")
    private Double outsideInvestorPikCurrentPayPct = 50.0;

    @Column(name = "phil_current_pay_enabled")
    private Boolean philCurrentPayEnabled = false;

    @Column(name = "phil_current_pay_pct")
    private Double philCurrentPayPct = 50.0;

    // AUM Fee Current Pay Settings
    @Column(name = "aum_current_pay_enabled")
    private Boolean aumCurrentPayEnabled = false;

    @Column(name = "aum_current_pay_pct")
    private Double aumCurrentPayPct = 50.0;

    // Timing Parameters
    @Column(name = "construction_delay_months")
    private Integer constructionDelayMonths = 0;

    @Column(name = "tax_benefit_delay_months")
    private Integer taxBenefitDelayMonths = 0;

    @Column(name = "hold_period")
    private Integer holdPeriod = 10;

    // HDC Advance Financing
    @Column(name = "hdc_advance_financing")
    private Boolean hdcAdvanceFinancing = false;

    @Column(name = "tax_advance_discount_rate")
    private Double taxAdvanceDiscountRate = 10.0;

    @Column(name = "advance_financing_rate")
    private Double advanceFinancingRate = 8.0;

    @Column(name = "tax_delivery_months")
    private Integer taxDeliveryMonths = 18;

    // Opportunity Zone
    @Column(name = "oz_enabled")
    private Boolean ozEnabled = false;

    @Column(name = "oz_type")
    private String ozType = "standard";

    @Column(name = "deferred_capital_gains")
    private Double deferredCapitalGains = 0.0;

    @Column(name = "capital_gains_tax_rate")
    private Double capitalGainsTaxRate = 23.8;

    // Metadata
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

    public String getPresetId() {
        return presetId;
    }

    public void setPresetId(String presetId) {
        this.presetId = presetId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Double getProjectCost() {
        return projectCost;
    }

    public void setProjectCost(Double projectCost) {
        this.projectCost = projectCost;
    }

    public Double getLandValue() {
        return landValue;
    }

    public void setLandValue(Double landValue) {
        this.landValue = landValue;
    }

    public Double getYearOneNoi() {
        return yearOneNoi;
    }

    public void setYearOneNoi(Double yearOneNoi) {
        this.yearOneNoi = yearOneNoi;
    }

    public Double getYearOneDepreciationPct() {
        return yearOneDepreciationPct;
    }

    public void setYearOneDepreciationPct(Double yearOneDepreciationPct) {
        this.yearOneDepreciationPct = yearOneDepreciationPct;
    }

    public Double getRevenueGrowth() {
        return revenueGrowth;
    }

    public void setRevenueGrowth(Double revenueGrowth) {
        this.revenueGrowth = revenueGrowth;
    }

    public Double getOpexRatio() {
        return opexRatio;
    }

    public void setOpexRatio(Double opexRatio) {
        this.opexRatio = opexRatio;
    }

    public Double getExitCapRate() {
        return exitCapRate;
    }

    public void setExitCapRate(Double exitCapRate) {
        this.exitCapRate = exitCapRate;
    }

    public Double getInvestorEquityPct() {
        return investorEquityPct;
    }

    public void setInvestorEquityPct(Double investorEquityPct) {
        this.investorEquityPct = investorEquityPct;
    }

    public Double getPhilanthropicEquityPct() {
        return philanthropicEquityPct;
    }

    public void setPhilanthropicEquityPct(Double philanthropicEquityPct) {
        this.philanthropicEquityPct = philanthropicEquityPct;
    }

    public Double getSeniorDebtPct() {
        return seniorDebtPct;
    }

    public void setSeniorDebtPct(Double seniorDebtPct) {
        this.seniorDebtPct = seniorDebtPct;
    }

    public Double getSeniorDebtRate() {
        return seniorDebtRate;
    }

    public void setSeniorDebtRate(Double seniorDebtRate) {
        this.seniorDebtRate = seniorDebtRate;
    }

    public Integer getSeniorDebtAmortization() {
        return seniorDebtAmortization;
    }

    public void setSeniorDebtAmortization(Integer seniorDebtAmortization) {
        this.seniorDebtAmortization = seniorDebtAmortization;
    }

    public Double getPhilDebtPct() {
        return philDebtPct;
    }

    public void setPhilDebtPct(Double philDebtPct) {
        this.philDebtPct = philDebtPct;
    }

    public Double getPhilDebtRate() {
        return philDebtRate;
    }

    public void setPhilDebtRate(Double philDebtRate) {
        this.philDebtRate = philDebtRate;
    }

    public Integer getPhilDebtAmortization() {
        return philDebtAmortization;
    }

    public void setPhilDebtAmortization(Integer philDebtAmortization) {
        this.philDebtAmortization = philDebtAmortization;
    }

    public Double getHdcSubDebtPct() {
        return hdcSubDebtPct;
    }

    public void setHdcSubDebtPct(Double hdcSubDebtPct) {
        this.hdcSubDebtPct = hdcSubDebtPct;
    }

    public Double getHdcSubDebtPikRate() {
        return hdcSubDebtPikRate;
    }

    public void setHdcSubDebtPikRate(Double hdcSubDebtPikRate) {
        this.hdcSubDebtPikRate = hdcSubDebtPikRate;
    }

    public Double getInvestorSubDebtPct() {
        return investorSubDebtPct;
    }

    public void setInvestorSubDebtPct(Double investorSubDebtPct) {
        this.investorSubDebtPct = investorSubDebtPct;
    }

    public Double getInvestorSubDebtPikRate() {
        return investorSubDebtPikRate;
    }

    public void setInvestorSubDebtPikRate(Double investorSubDebtPikRate) {
        this.investorSubDebtPikRate = investorSubDebtPikRate;
    }

    public Double getOutsideInvestorSubDebtPct() {
        return outsideInvestorSubDebtPct;
    }

    public void setOutsideInvestorSubDebtPct(Double outsideInvestorSubDebtPct) {
        this.outsideInvestorSubDebtPct = outsideInvestorSubDebtPct;
    }

    public Double getOutsideInvestorSubDebtPikRate() {
        return outsideInvestorSubDebtPikRate;
    }

    public void setOutsideInvestorSubDebtPikRate(Double outsideInvestorSubDebtPikRate) {
        this.outsideInvestorSubDebtPikRate = outsideInvestorSubDebtPikRate;
    }

    public Double getFederalTaxRate() {
        return federalTaxRate;
    }

    public void setFederalTaxRate(Double federalTaxRate) {
        this.federalTaxRate = federalTaxRate;
    }

    public String getSelectedState() {
        return selectedState;
    }

    public void setSelectedState(String selectedState) {
        this.selectedState = selectedState;
    }

    public Double getStateCapitalGainsRate() {
        return stateCapitalGainsRate;
    }

    public void setStateCapitalGainsRate(Double stateCapitalGainsRate) {
        this.stateCapitalGainsRate = stateCapitalGainsRate;
    }

    public Double getLtCapitalGainsRate() {
        return ltCapitalGainsRate;
    }

    public void setLtCapitalGainsRate(Double ltCapitalGainsRate) {
        this.ltCapitalGainsRate = ltCapitalGainsRate;
    }

    public Double getNiitRate() {
        return niitRate;
    }

    public void setNiitRate(Double niitRate) {
        this.niitRate = niitRate;
    }

    public Double getDepreciationRecaptureRate() {
        return depreciationRecaptureRate;
    }

    public void setDepreciationRecaptureRate(Double depreciationRecaptureRate) {
        this.depreciationRecaptureRate = depreciationRecaptureRate;
    }

    public Double getDeferredGains() {
        return deferredGains;
    }

    public void setDeferredGains(Double deferredGains) {
        this.deferredGains = deferredGains;
    }

    public Double getHdcFeeRate() {
        return hdcFeeRate;
    }

    public void setHdcFeeRate(Double hdcFeeRate) {
        this.hdcFeeRate = hdcFeeRate;
    }

    public Boolean getAumFeeEnabled() {
        return aumFeeEnabled;
    }

    public void setAumFeeEnabled(Boolean aumFeeEnabled) {
        this.aumFeeEnabled = aumFeeEnabled;
    }

    public Double getAumFeeRate() {
        return aumFeeRate;
    }

    public void setAumFeeRate(Double aumFeeRate) {
        this.aumFeeRate = aumFeeRate;
    }

    public Double getInvestorPromoteShare() {
        return investorPromoteShare;
    }

    public void setInvestorPromoteShare(Double investorPromoteShare) {
        this.investorPromoteShare = investorPromoteShare;
    }

    public String getDealLocation() {
        return dealLocation;
    }

    public void setDealLocation(String dealLocation) {
        this.dealLocation = dealLocation;
    }

    public Integer getUnits() {
        return units;
    }

    public void setUnits(Integer units) {
        this.units = units;
    }

    public String getAffordabilityMix() {
        return affordabilityMix;
    }

    public void setAffordabilityMix(String affordabilityMix) {
        this.affordabilityMix = affordabilityMix;
    }

    public String getProjectStatus() {
        return projectStatus;
    }

    public void setProjectStatus(String projectStatus) {
        this.projectStatus = projectStatus;
    }

    public Double getMinimumInvestment() {
        return minimumInvestment;
    }

    public void setMinimumInvestment(Double minimumInvestment) {
        this.minimumInvestment = minimumInvestment;
    }

    public String getDealImageUrl() {
        return dealImageUrl;
    }

    public void setDealImageUrl(String dealImageUrl) {
        this.dealImageUrl = dealImageUrl;
    }

    // Interest Reserve getters and setters
    public Boolean getInterestReserveEnabled() {
        return interestReserveEnabled;
    }

    public void setInterestReserveEnabled(Boolean interestReserveEnabled) {
        this.interestReserveEnabled = interestReserveEnabled;
    }

    public Integer getInterestReserveMonths() {
        return interestReserveMonths;
    }

    public void setInterestReserveMonths(Integer interestReserveMonths) {
        this.interestReserveMonths = interestReserveMonths;
    }

    // Predevelopment Costs
    public Double getPredevelopmentCosts() {
        return predevelopmentCosts;
    }

    public void setPredevelopmentCosts(Double predevelopmentCosts) {
        this.predevelopmentCosts = predevelopmentCosts;
    }

    // PIK Current Pay getters and setters
    public Boolean getPikCurrentPayEnabled() {
        return pikCurrentPayEnabled;
    }

    public void setPikCurrentPayEnabled(Boolean pikCurrentPayEnabled) {
        this.pikCurrentPayEnabled = pikCurrentPayEnabled;
    }

    public Double getPikCurrentPayPct() {
        return pikCurrentPayPct;
    }

    public void setPikCurrentPayPct(Double pikCurrentPayPct) {
        this.pikCurrentPayPct = pikCurrentPayPct;
    }

    public Boolean getInvestorPikCurrentPayEnabled() {
        return investorPikCurrentPayEnabled;
    }

    public void setInvestorPikCurrentPayEnabled(Boolean investorPikCurrentPayEnabled) {
        this.investorPikCurrentPayEnabled = investorPikCurrentPayEnabled;
    }

    public Double getInvestorPikCurrentPayPct() {
        return investorPikCurrentPayPct;
    }

    public void setInvestorPikCurrentPayPct(Double investorPikCurrentPayPct) {
        this.investorPikCurrentPayPct = investorPikCurrentPayPct;
    }

    public Boolean getOutsideInvestorPikCurrentPayEnabled() {
        return outsideInvestorPikCurrentPayEnabled;
    }

    public void setOutsideInvestorPikCurrentPayEnabled(Boolean outsideInvestorPikCurrentPayEnabled) {
        this.outsideInvestorPikCurrentPayEnabled = outsideInvestorPikCurrentPayEnabled;
    }

    public Double getOutsideInvestorPikCurrentPayPct() {
        return outsideInvestorPikCurrentPayPct;
    }

    public void setOutsideInvestorPikCurrentPayPct(Double outsideInvestorPikCurrentPayPct) {
        this.outsideInvestorPikCurrentPayPct = outsideInvestorPikCurrentPayPct;
    }

    public Boolean getPhilCurrentPayEnabled() {
        return philCurrentPayEnabled;
    }

    public void setPhilCurrentPayEnabled(Boolean philCurrentPayEnabled) {
        this.philCurrentPayEnabled = philCurrentPayEnabled;
    }

    public Double getPhilCurrentPayPct() {
        return philCurrentPayPct;
    }

    public void setPhilCurrentPayPct(Double philCurrentPayPct) {
        this.philCurrentPayPct = philCurrentPayPct;
    }

    // AUM Fee Current Pay
    public Boolean getAumCurrentPayEnabled() {
        return aumCurrentPayEnabled;
    }

    public void setAumCurrentPayEnabled(Boolean aumCurrentPayEnabled) {
        this.aumCurrentPayEnabled = aumCurrentPayEnabled;
    }

    public Double getAumCurrentPayPct() {
        return aumCurrentPayPct;
    }

    public void setAumCurrentPayPct(Double aumCurrentPayPct) {
        this.aumCurrentPayPct = aumCurrentPayPct;
    }

    // Timing Parameters
    public Integer getConstructionDelayMonths() {
        return constructionDelayMonths;
    }

    public void setConstructionDelayMonths(Integer constructionDelayMonths) {
        this.constructionDelayMonths = constructionDelayMonths;
    }

    public Integer getTaxBenefitDelayMonths() {
        return taxBenefitDelayMonths;
    }

    public void setTaxBenefitDelayMonths(Integer taxBenefitDelayMonths) {
        this.taxBenefitDelayMonths = taxBenefitDelayMonths;
    }

    public Integer getHoldPeriod() {
        return holdPeriod;
    }

    public void setHoldPeriod(Integer holdPeriod) {
        this.holdPeriod = holdPeriod;
    }

    // HDC Advance Financing
    public Boolean getHdcAdvanceFinancing() {
        return hdcAdvanceFinancing;
    }

    public void setHdcAdvanceFinancing(Boolean hdcAdvanceFinancing) {
        this.hdcAdvanceFinancing = hdcAdvanceFinancing;
    }

    public Double getTaxAdvanceDiscountRate() {
        return taxAdvanceDiscountRate;
    }

    public void setTaxAdvanceDiscountRate(Double taxAdvanceDiscountRate) {
        this.taxAdvanceDiscountRate = taxAdvanceDiscountRate;
    }

    public Double getAdvanceFinancingRate() {
        return advanceFinancingRate;
    }

    public void setAdvanceFinancingRate(Double advanceFinancingRate) {
        this.advanceFinancingRate = advanceFinancingRate;
    }

    public Integer getTaxDeliveryMonths() {
        return taxDeliveryMonths;
    }

    public void setTaxDeliveryMonths(Integer taxDeliveryMonths) {
        this.taxDeliveryMonths = taxDeliveryMonths;
    }

    // Opportunity Zone
    public Boolean getOzEnabled() {
        return ozEnabled;
    }

    public void setOzEnabled(Boolean ozEnabled) {
        this.ozEnabled = ozEnabled;
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
