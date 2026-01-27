package com.hdc.hdc_map_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "calculator_configurations", schema = "user_schema")
public class CalculatorConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "configuration_name")
    private String configurationName;

    @Column(name = "project_cost")
    private Double projectCost;

    @Column(name = "year_one_noi")
    private Double yearOneNOI;

    @Column(name = "year_one_depreciation_pct")
    private Double yearOneDepreciationPct;

    @Column(name = "revenue_growth")
    private Double revenueGrowth;

    @Column(name = "opex_ratio")
    private Double opexRatio;

    @Column(name = "exit_cap_rate")
    private Double exitCapRate;

    @Column(name = "investor_equity_pct")
    private Double investorEquityPct;

    @Column(name = "philanthropic_equity_pct")
    private Double philanthropicEquityPct;

    @Column(name = "senior_debt_pct")
    private Double seniorDebtPct;

    @Column(name = "senior_debt_rate")
    private Double seniorDebtRate;

    @Column(name = "senior_debt_amortization")
    private Double seniorDebtAmortization;

    @Column(name = "phil_debt_pct")
    private Double philDebtPct;

    @Column(name = "phil_debt_rate")
    private Double philDebtRate;

    @Column(name = "phil_debt_amortization")
    private Double philDebtAmortization;

    @Column(name = "hdc_sub_debt_pct")
    private Double hdcSubDebtPct;

    @Column(name = "hdc_sub_debt_pik_rate")
    private Double hdcSubDebtPikRate;

    @Column(name = "investor_sub_debt_pct")
    private Double investorSubDebtPct;

    @Column(name = "investor_sub_debt_pik_rate")
    private Double investorSubDebtPikRate;

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

    @Column(name = "hdc_fee_rate")
    private Double hdcFeeRate;

    @Column(name = "hdc_development_fee_pct")
    private Double hdcDevelopmentFeePct;

    @Column(name = "aum_fee_enabled")
    private Boolean aumFeeEnabled;

    @Column(name = "aum_fee_rate")
    private Double aumFeeRate;

    @Column(name = "investor_promote_share")
    private Double investorPromoteShare;

    @Column(name = "oz_enabled")
    private Boolean ozEnabled;

    @Column(name = "oz_type")
    private String ozType;

    @Column(name = "oz_deferred_capital_gains")
    private Double ozDeferredCapitalGains;

    @Column(name = "capital_gains_tax_rate")
    private Double capitalGainsTaxRate;

    @Column(name = "land_value")
    private Double landValue;

    @Column(name = "hold_period")
    private Integer holdPeriod;

    @Column(name = "expense_growth")
    private Double expenseGrowth;

    @Column(name = "construction_delay_months")
    private Integer constructionDelayMonths;

    @Column(name = "tax_benefit_delay_months")
    private Integer taxBenefitDelayMonths;

    @Column(name = "interest_reserve_enabled")
    private Boolean interestReserveEnabled;

    @Column(name = "interest_reserve_months")
    private Integer interestReserveMonths;

    @Column(name = "interest_reserve_amount")
    private Double interestReserveAmount;

    @Column(name = "auto_balance_capital")
    private Boolean autoBalanceCapital;

    @Column(name = "investor_equity_ratio")
    private Double investorEquityRatio;

    @Column(name = "phil_current_pay_enabled")
    private Boolean philCurrentPayEnabled;

    @Column(name = "phil_current_pay_pct")
    private Double philCurrentPayPct;

    @Column(name = "pik_current_pay_enabled")
    private Boolean pikCurrentPayEnabled;

    @Column(name = "pik_current_pay_pct")
    private Double pikCurrentPayPct;

    @Column(name = "investor_pik_current_pay_enabled")
    private Boolean investorPikCurrentPayEnabled;

    @Column(name = "investor_pik_current_pay_pct")
    private Double investorPikCurrentPayPct;

    @Column(name = "outside_investor_sub_debt_pct")
    private Double outsideInvestorSubDebtPct;

    @Column(name = "outside_investor_sub_debt_rate")
    private Double outsideInvestorSubDebtRate;

    @Column(name = "outside_investor_sub_debt_amortization")
    private Integer outsideInvestorSubDebtAmortization;

    @Column(name = "outside_investor_pik_current_pay_enabled")
    private Boolean outsideInvestorPikCurrentPayEnabled;

    @Column(name = "outside_investor_pik_current_pay_pct")
    private Double outsideInvestorPikCurrentPayPct;

    @Column(name = "hdc_advance_financing")
    private Boolean hdcAdvanceFinancing;

    @Column(name = "tax_advance_discount_rate")
    private Double taxAdvanceDiscountRate;

    @Column(name = "advance_financing_rate")
    private Double advanceFinancingRate;

    @Column(name = "tax_delivery_months")
    private Integer taxDeliveryMonths;

    @Column(name = "state_tax_rate")
    private Double stateTaxRate;

    @Column(name = "oz_capital_gains_tax_rate")
    private Double ozCapitalGainsTaxRate;

    // ISS-043: Additional fields for complete save/load support

    // OZ Version (IMPL-017)
    @Column(name = "oz_version")
    private String ozVersion;

    // Senior Debt IO Years
    @Column(name = "senior_debt_io_years")
    private Integer seniorDebtIOYears;

    // HDC Platform Mode
    @Column(name = "hdc_platform_mode")
    private String hdcPlatformMode;

    // Sub-debt payment priority (stored as JSON string)
    @Column(name = "sub_debt_priority", columnDefinition = "TEXT")
    private String subDebtPriority;

    // Private Activity Bonds (PABs) - IMPL-080
    @Column(name = "pab_enabled")
    private Boolean pabEnabled;

    @Column(name = "pab_pct_of_eligible_basis")
    private Double pabPctOfEligibleBasis;

    @Column(name = "pab_rate")
    private Double pabRate;

    @Column(name = "pab_term")
    private Integer pabTerm;

    @Column(name = "pab_amortization")
    private Integer pabAmortization;

    @Column(name = "pab_io_years")
    private Integer pabIOYears;

    // HDC Debt Fund (IMPL-082)
    @Column(name = "hdc_debt_fund_pct")
    private Double hdcDebtFundPct;

    @Column(name = "hdc_debt_fund_pik_rate")
    private Double hdcDebtFundPikRate;

    @Column(name = "hdc_debt_fund_current_pay_enabled")
    private Boolean hdcDebtFundCurrentPayEnabled;

    @Column(name = "hdc_debt_fund_current_pay_pct")
    private Double hdcDebtFundCurrentPayPct;

    // Federal LIHTC (v7.0.11)
    @Column(name = "lihtc_enabled")
    private Boolean lihtcEnabled;

    @Column(name = "applicable_fraction")
    private Double applicableFraction;

    @Column(name = "credit_rate")
    private Double creditRate;

    @Column(name = "placed_in_service_month")
    private Integer placedInServiceMonth;

    @Column(name = "dda_qct_boost")
    private Boolean ddaQctBoost;

    // State LIHTC (v7.0.10)
    @Column(name = "state_lihtc_enabled")
    private Boolean stateLIHTCEnabled;

    @Column(name = "investor_state")
    private String investorState;

    @Column(name = "syndication_rate")
    private Double syndicationRate;

    @Column(name = "investor_has_state_liability")
    private Boolean investorHasStateLiability;

    @Column(name = "state_lihtc_user_percentage")
    private Double stateLIHTCUserPercentage;

    @Column(name = "state_lihtc_user_amount")
    private Double stateLIHTCUserAmount;

    @Column(name = "state_lihtc_syndication_year")
    private Integer stateLIHTCSyndicationYear;

    // Eligible Basis Exclusions (IMPL-083)
    @Column(name = "commercial_space_costs")
    private Double commercialSpaceCosts;

    @Column(name = "syndication_costs")
    private Double syndicationCosts;

    @Column(name = "marketing_costs")
    private Double marketingCosts;

    @Column(name = "financing_fees")
    private Double financingFees;

    @Column(name = "bond_issuance_costs")
    private Double bondIssuanceCosts;

    @Column(name = "operating_deficit_reserve")
    private Double operatingDeficitReserve;

    @Column(name = "replacement_reserve")
    private Double replacementReserve;

    @Column(name = "other_exclusions")
    private Double otherExclusions;

    // Investment Portal Settings
    @Column(name = "is_investor_facing")
    private Boolean isInvestorFacing = false;

    @Column(name = "deal_description", length = 5000)
    private String dealDescription;

    @Column(name = "deal_location")
    private String dealLocation;

    @Column(name = "units")
    private Integer units;

    @Column(name = "affordability_mix")
    private String affordabilityMix;

    @Column(name = "project_status")
    private String projectStatus;

    @Column(name = "minimum_investment")
    private Double minimumInvestment;

    @Column(name = "deal_image_url")
    private String dealImageUrl;

    @Column(name = "deal_latitude")
    private Double dealLatitude;

    @Column(name = "deal_longitude")
    private Double dealLongitude;

    @Column(name = "marker_id")
    private Long markerId;

    // Pre-calculated results from HDC Calculator (for Investment Portal)
    // Stored as JSON to preserve complete analysis including tax details and yearly
    // breakdowns
    @Column(name = "calculated_results_json", columnDefinition = "TEXT")
    private String calculatedResultsJson;

    // Quick-access fields for display/filtering (extracted from JSON)
    @Column(name = "calculated_investor_equity")
    private Double calculatedInvestorEquity;

    @Column(name = "calculated_irr")
    private Double calculatedIRR;

    @Column(name = "calculated_multiple")
    private Double calculatedMultiple;

    @Column(name = "calculated_total_returns")
    private Double calculatedTotalReturns;

    @Column(name = "calculated_exit_proceeds")
    private Double calculatedExitProceeds;

    @Column(name = "calculated_tax_benefits")
    private Double calculatedTaxBenefits;

    @Column(name = "calculated_operating_cash_flows")
    private Double calculatedOperatingCashFlows;

    @Column(name = "completion_status")
    private String completionStatus = "in-progress"; // "in-progress" or "complete"

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

    public String getConfigurationName() {
        return configurationName;
    }

    public void setConfigurationName(String configurationName) {
        this.configurationName = configurationName;
    }

    public Double getProjectCost() {
        return projectCost;
    }

    public void setProjectCost(Double projectCost) {
        this.projectCost = projectCost;
    }

    public Double getYearOneNOI() {
        return yearOneNOI;
    }

    public void setYearOneNOI(Double yearOneNOI) {
        this.yearOneNOI = yearOneNOI;
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

    public Double getSeniorDebtAmortization() {
        return seniorDebtAmortization;
    }

    public void setSeniorDebtAmortization(Double seniorDebtAmortization) {
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

    public Double getPhilDebtAmortization() {
        return philDebtAmortization;
    }

    public void setPhilDebtAmortization(Double philDebtAmortization) {
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

    public Double getHdcDevelopmentFeePct() {
        return hdcDevelopmentFeePct;
    }

    public void setHdcDevelopmentFeePct(Double hdcDevelopmentFeePct) {
        this.hdcDevelopmentFeePct = hdcDevelopmentFeePct;
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

    public Double getOzDeferredCapitalGains() {
        return ozDeferredCapitalGains;
    }

    public void setOzDeferredCapitalGains(Double ozDeferredCapitalGains) {
        this.ozDeferredCapitalGains = ozDeferredCapitalGains;
    }

    public Double getCapitalGainsTaxRate() {
        return capitalGainsTaxRate;
    }

    public void setCapitalGainsTaxRate(Double capitalGainsTaxRate) {
        this.capitalGainsTaxRate = capitalGainsTaxRate;
    }

    public Double getLandValue() {
        return landValue;
    }

    public void setLandValue(Double landValue) {
        this.landValue = landValue;
    }

    public Integer getHoldPeriod() {
        return holdPeriod;
    }

    public void setHoldPeriod(Integer holdPeriod) {
        this.holdPeriod = holdPeriod;
    }

    public Double getExpenseGrowth() {
        return expenseGrowth;
    }

    public void setExpenseGrowth(Double expenseGrowth) {
        this.expenseGrowth = expenseGrowth;
    }

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

    public Double getInterestReserveAmount() {
        return interestReserveAmount;
    }

    public void setInterestReserveAmount(Double interestReserveAmount) {
        this.interestReserveAmount = interestReserveAmount;
    }

    public Boolean getAutoBalanceCapital() {
        return autoBalanceCapital;
    }

    public void setAutoBalanceCapital(Boolean autoBalanceCapital) {
        this.autoBalanceCapital = autoBalanceCapital;
    }

    public Double getInvestorEquityRatio() {
        return investorEquityRatio;
    }

    public void setInvestorEquityRatio(Double investorEquityRatio) {
        this.investorEquityRatio = investorEquityRatio;
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

    public Double getOutsideInvestorSubDebtPct() {
        return outsideInvestorSubDebtPct;
    }

    public void setOutsideInvestorSubDebtPct(Double outsideInvestorSubDebtPct) {
        this.outsideInvestorSubDebtPct = outsideInvestorSubDebtPct;
    }

    public Double getOutsideInvestorSubDebtRate() {
        return outsideInvestorSubDebtRate;
    }

    public void setOutsideInvestorSubDebtRate(Double outsideInvestorSubDebtRate) {
        this.outsideInvestorSubDebtRate = outsideInvestorSubDebtRate;
    }

    public Integer getOutsideInvestorSubDebtAmortization() {
        return outsideInvestorSubDebtAmortization;
    }

    public void setOutsideInvestorSubDebtAmortization(Integer outsideInvestorSubDebtAmortization) {
        this.outsideInvestorSubDebtAmortization = outsideInvestorSubDebtAmortization;
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

    public Double getStateTaxRate() {
        return stateTaxRate;
    }

    public void setStateTaxRate(Double stateTaxRate) {
        this.stateTaxRate = stateTaxRate;
    }

    public Double getOzCapitalGainsTaxRate() {
        return ozCapitalGainsTaxRate;
    }

    public void setOzCapitalGainsTaxRate(Double ozCapitalGainsTaxRate) {
        this.ozCapitalGainsTaxRate = ozCapitalGainsTaxRate;
    }

    public String getCompletionStatus() {
        return completionStatus;
    }

    public void setCompletionStatus(String completionStatus) {
        this.completionStatus = completionStatus;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    // Investment Portal Settings Getters/Setters
    public Boolean getIsInvestorFacing() {
        return isInvestorFacing;
    }

    public void setIsInvestorFacing(Boolean isInvestorFacing) {
        this.isInvestorFacing = isInvestorFacing;
    }

    public String getDealDescription() {
        return dealDescription;
    }

    public void setDealDescription(String dealDescription) {
        this.dealDescription = dealDescription;
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

    public Double getDealLatitude() {
        return dealLatitude;
    }

    public void setDealLatitude(Double dealLatitude) {
        this.dealLatitude = dealLatitude;
    }

    public Double getDealLongitude() {
        return dealLongitude;
    }

    public void setDealLongitude(Double dealLongitude) {
        this.dealLongitude = dealLongitude;
    }

    public Long getMarkerId() {
        return markerId;
    }

    public void setMarkerId(Long markerId) {
        this.markerId = markerId;
    }

    // Pre-calculated Results Getters/Setters
    public String getCalculatedResultsJson() {
        return calculatedResultsJson;
    }

    public void setCalculatedResultsJson(String calculatedResultsJson) {
        this.calculatedResultsJson = calculatedResultsJson;
    }

    public Double getCalculatedInvestorEquity() {
        return calculatedInvestorEquity;
    }

    public void setCalculatedInvestorEquity(Double calculatedInvestorEquity) {
        this.calculatedInvestorEquity = calculatedInvestorEquity;
    }

    public Double getCalculatedIRR() {
        return calculatedIRR;
    }

    public void setCalculatedIRR(Double calculatedIRR) {
        this.calculatedIRR = calculatedIRR;
    }

    public Double getCalculatedMultiple() {
        return calculatedMultiple;
    }

    public void setCalculatedMultiple(Double calculatedMultiple) {
        this.calculatedMultiple = calculatedMultiple;
    }

    public Double getCalculatedTotalReturns() {
        return calculatedTotalReturns;
    }

    public void setCalculatedTotalReturns(Double calculatedTotalReturns) {
        this.calculatedTotalReturns = calculatedTotalReturns;
    }

    public Double getCalculatedExitProceeds() {
        return calculatedExitProceeds;
    }

    public void setCalculatedExitProceeds(Double calculatedExitProceeds) {
        this.calculatedExitProceeds = calculatedExitProceeds;
    }

    public Double getCalculatedTaxBenefits() {
        return calculatedTaxBenefits;
    }

    public void setCalculatedTaxBenefits(Double calculatedTaxBenefits) {
        this.calculatedTaxBenefits = calculatedTaxBenefits;
    }

    public Double getCalculatedOperatingCashFlows() {
        return calculatedOperatingCashFlows;
    }

    public void setCalculatedOperatingCashFlows(Double calculatedOperatingCashFlows) {
        this.calculatedOperatingCashFlows = calculatedOperatingCashFlows;
    }

    // ISS-043: Getters and Setters for new fields

    public String getOzVersion() {
        return ozVersion;
    }

    public void setOzVersion(String ozVersion) {
        this.ozVersion = ozVersion;
    }

    public Integer getSeniorDebtIOYears() {
        return seniorDebtIOYears;
    }

    public void setSeniorDebtIOYears(Integer seniorDebtIOYears) {
        this.seniorDebtIOYears = seniorDebtIOYears;
    }

    public String getHdcPlatformMode() {
        return hdcPlatformMode;
    }

    public void setHdcPlatformMode(String hdcPlatformMode) {
        this.hdcPlatformMode = hdcPlatformMode;
    }

    public String getSubDebtPriority() {
        return subDebtPriority;
    }

    public void setSubDebtPriority(String subDebtPriority) {
        this.subDebtPriority = subDebtPriority;
    }

    // PAB getters/setters
    public Boolean getPabEnabled() {
        return pabEnabled;
    }

    public void setPabEnabled(Boolean pabEnabled) {
        this.pabEnabled = pabEnabled;
    }

    public Double getPabPctOfEligibleBasis() {
        return pabPctOfEligibleBasis;
    }

    public void setPabPctOfEligibleBasis(Double pabPctOfEligibleBasis) {
        this.pabPctOfEligibleBasis = pabPctOfEligibleBasis;
    }

    public Double getPabRate() {
        return pabRate;
    }

    public void setPabRate(Double pabRate) {
        this.pabRate = pabRate;
    }

    public Integer getPabTerm() {
        return pabTerm;
    }

    public void setPabTerm(Integer pabTerm) {
        this.pabTerm = pabTerm;
    }

    public Integer getPabAmortization() {
        return pabAmortization;
    }

    public void setPabAmortization(Integer pabAmortization) {
        this.pabAmortization = pabAmortization;
    }

    public Integer getPabIOYears() {
        return pabIOYears;
    }

    public void setPabIOYears(Integer pabIOYears) {
        this.pabIOYears = pabIOYears;
    }

    // HDC Debt Fund getters/setters
    public Double getHdcDebtFundPct() {
        return hdcDebtFundPct;
    }

    public void setHdcDebtFundPct(Double hdcDebtFundPct) {
        this.hdcDebtFundPct = hdcDebtFundPct;
    }

    public Double getHdcDebtFundPikRate() {
        return hdcDebtFundPikRate;
    }

    public void setHdcDebtFundPikRate(Double hdcDebtFundPikRate) {
        this.hdcDebtFundPikRate = hdcDebtFundPikRate;
    }

    public Boolean getHdcDebtFundCurrentPayEnabled() {
        return hdcDebtFundCurrentPayEnabled;
    }

    public void setHdcDebtFundCurrentPayEnabled(Boolean hdcDebtFundCurrentPayEnabled) {
        this.hdcDebtFundCurrentPayEnabled = hdcDebtFundCurrentPayEnabled;
    }

    public Double getHdcDebtFundCurrentPayPct() {
        return hdcDebtFundCurrentPayPct;
    }

    public void setHdcDebtFundCurrentPayPct(Double hdcDebtFundCurrentPayPct) {
        this.hdcDebtFundCurrentPayPct = hdcDebtFundCurrentPayPct;
    }

    // Federal LIHTC getters/setters
    public Boolean getLihtcEnabled() {
        return lihtcEnabled;
    }

    public void setLihtcEnabled(Boolean lihtcEnabled) {
        this.lihtcEnabled = lihtcEnabled;
    }

    public Double getApplicableFraction() {
        return applicableFraction;
    }

    public void setApplicableFraction(Double applicableFraction) {
        this.applicableFraction = applicableFraction;
    }

    public Double getCreditRate() {
        return creditRate;
    }

    public void setCreditRate(Double creditRate) {
        this.creditRate = creditRate;
    }

    public Integer getPlacedInServiceMonth() {
        return placedInServiceMonth;
    }

    public void setPlacedInServiceMonth(Integer placedInServiceMonth) {
        this.placedInServiceMonth = placedInServiceMonth;
    }

    public Boolean getDdaQctBoost() {
        return ddaQctBoost;
    }

    public void setDdaQctBoost(Boolean ddaQctBoost) {
        this.ddaQctBoost = ddaQctBoost;
    }

    // State LIHTC getters/setters
    public Boolean getStateLIHTCEnabled() {
        return stateLIHTCEnabled;
    }

    public void setStateLIHTCEnabled(Boolean stateLIHTCEnabled) {
        this.stateLIHTCEnabled = stateLIHTCEnabled;
    }

    public String getInvestorState() {
        return investorState;
    }

    public void setInvestorState(String investorState) {
        this.investorState = investorState;
    }

    public Double getSyndicationRate() {
        return syndicationRate;
    }

    public void setSyndicationRate(Double syndicationRate) {
        this.syndicationRate = syndicationRate;
    }

    public Boolean getInvestorHasStateLiability() {
        return investorHasStateLiability;
    }

    public void setInvestorHasStateLiability(Boolean investorHasStateLiability) {
        this.investorHasStateLiability = investorHasStateLiability;
    }

    public Double getStateLIHTCUserPercentage() {
        return stateLIHTCUserPercentage;
    }

    public void setStateLIHTCUserPercentage(Double stateLIHTCUserPercentage) {
        this.stateLIHTCUserPercentage = stateLIHTCUserPercentage;
    }

    public Double getStateLIHTCUserAmount() {
        return stateLIHTCUserAmount;
    }

    public void setStateLIHTCUserAmount(Double stateLIHTCUserAmount) {
        this.stateLIHTCUserAmount = stateLIHTCUserAmount;
    }

    public Integer getStateLIHTCSyndicationYear() {
        return stateLIHTCSyndicationYear;
    }

    public void setStateLIHTCSyndicationYear(Integer stateLIHTCSyndicationYear) {
        this.stateLIHTCSyndicationYear = stateLIHTCSyndicationYear;
    }

    // Eligible Basis Exclusions getters/setters
    public Double getCommercialSpaceCosts() {
        return commercialSpaceCosts;
    }

    public void setCommercialSpaceCosts(Double commercialSpaceCosts) {
        this.commercialSpaceCosts = commercialSpaceCosts;
    }

    public Double getSyndicationCosts() {
        return syndicationCosts;
    }

    public void setSyndicationCosts(Double syndicationCosts) {
        this.syndicationCosts = syndicationCosts;
    }

    public Double getMarketingCosts() {
        return marketingCosts;
    }

    public void setMarketingCosts(Double marketingCosts) {
        this.marketingCosts = marketingCosts;
    }

    public Double getFinancingFees() {
        return financingFees;
    }

    public void setFinancingFees(Double financingFees) {
        this.financingFees = financingFees;
    }

    public Double getBondIssuanceCosts() {
        return bondIssuanceCosts;
    }

    public void setBondIssuanceCosts(Double bondIssuanceCosts) {
        this.bondIssuanceCosts = bondIssuanceCosts;
    }

    public Double getOperatingDeficitReserve() {
        return operatingDeficitReserve;
    }

    public void setOperatingDeficitReserve(Double operatingDeficitReserve) {
        this.operatingDeficitReserve = operatingDeficitReserve;
    }

    public Double getReplacementReserve() {
        return replacementReserve;
    }

    public void setReplacementReserve(Double replacementReserve) {
        this.replacementReserve = replacementReserve;
    }

    public Double getOtherExclusions() {
        return otherExclusions;
    }

    public void setOtherExclusions(Double otherExclusions) {
        this.otherExclusions = otherExclusions;
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