package com.hdc.hdc_map_backend.entity.taxBenefits;

import jakarta.persistence.*;

@Entity
@Table(name = "input_investor_profile", schema = "tax_benefits")
public class InputInvestorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Long id;

    @OneToOne
    @JoinColumn(name = "deal_conduit_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private DealConduit dealConduit;

    // State / Location
    @Column(name = "investor_state")
    private String investorState;

    @Column(name = "project_location")
    private String projectLocation;

    // Federal & State base rates
    @Column(name = "federal_ordinary_rate")
    private Double federalOrdinaryRate;

    @Column(name = "federal_capital_gains_rate")
    private Double federalCapitalGainsRate;

    @Column(name = "state_ordinary_rate")
    private Double stateOrdinaryRate;

    @Column(name = "state_capital_gains_rate")
    private Double stateCapitalGainsRate;

    // Composite / derived rates
    @Column(name = "federal_tax_rate")
    private Double federalTaxRate;

    @Column(name = "state_tax_rate")
    private Double stateTaxRate;

    @Column(name = "lt_capital_gains_rate")
    private Double ltCapitalGainsRate;

    @Column(name = "niit_rate")
    private Double niitRate;

    @Column(name = "capital_gains_tax_rate")
    private Double capitalGainsTaxRate;

    // Investor classification
    @Column(name = "investor_track")
    private String investorTrack;

    @Column(name = "passive_gain_type")
    private String passiveGainType;

    @Column(name = "investor_type")
    private String investorType;

    // Income composition
    @Column(name = "annual_ordinary_income")
    private Double annualOrdinaryIncome;

    @Column(name = "annual_passive_income")
    private Double annualPassiveIncome;

    @Column(name = "annual_portfolio_income")
    private Double annualPortfolioIncome;

    @Column(name = "grouping_election")
    private Boolean groupingElection;

    @Column(name = "filing_status")
    private String filingStatus;

    // ISS-057: Annual income
    @Column(name = "annual_income")
    private Double annualIncome;

    // Tax Planning Analysis fields
    @Column(name = "include_depreciation_schedule")
    private Boolean includeDepreciationSchedule;

    @Column(name = "w2_income")
    private Double w2Income;

    @Column(name = "business_income")
    private Double businessIncome;

    @Column(name = "ira_balance")
    private Double iraBalance;

    @Column(name = "passive_income")
    private Double passiveIncome;

    @Column(name = "asset_sale_gain")
    private Double assetSaleGain;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public DealConduit getDealConduit() {
        return dealConduit;
    }

    public void setDealConduit(DealConduit dealConduit) {
        this.dealConduit = dealConduit;
    }

    public String getInvestorState() {
        return investorState;
    }

    public void setInvestorState(String investorState) {
        this.investorState = investorState;
    }

    public String getProjectLocation() {
        return projectLocation;
    }

    public void setProjectLocation(String projectLocation) {
        this.projectLocation = projectLocation;
    }

    public Double getFederalOrdinaryRate() {
        return federalOrdinaryRate;
    }

    public void setFederalOrdinaryRate(Double federalOrdinaryRate) {
        this.federalOrdinaryRate = federalOrdinaryRate;
    }

    public Double getFederalCapitalGainsRate() {
        return federalCapitalGainsRate;
    }

    public void setFederalCapitalGainsRate(Double federalCapitalGainsRate) {
        this.federalCapitalGainsRate = federalCapitalGainsRate;
    }

    public Double getStateOrdinaryRate() {
        return stateOrdinaryRate;
    }

    public void setStateOrdinaryRate(Double stateOrdinaryRate) {
        this.stateOrdinaryRate = stateOrdinaryRate;
    }

    public Double getStateCapitalGainsRate() {
        return stateCapitalGainsRate;
    }

    public void setStateCapitalGainsRate(Double stateCapitalGainsRate) {
        this.stateCapitalGainsRate = stateCapitalGainsRate;
    }

    public Double getFederalTaxRate() {
        return federalTaxRate;
    }

    public void setFederalTaxRate(Double federalTaxRate) {
        this.federalTaxRate = federalTaxRate;
    }

    public Double getStateTaxRate() {
        return stateTaxRate;
    }

    public void setStateTaxRate(Double stateTaxRate) {
        this.stateTaxRate = stateTaxRate;
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

    public Double getCapitalGainsTaxRate() {
        return capitalGainsTaxRate;
    }

    public void setCapitalGainsTaxRate(Double capitalGainsTaxRate) {
        this.capitalGainsTaxRate = capitalGainsTaxRate;
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

    public String getInvestorType() {
        return investorType;
    }

    public void setInvestorType(String investorType) {
        this.investorType = investorType;
    }

    public Double getAnnualOrdinaryIncome() {
        return annualOrdinaryIncome;
    }

    public void setAnnualOrdinaryIncome(Double annualOrdinaryIncome) {
        this.annualOrdinaryIncome = annualOrdinaryIncome;
    }

    public Double getAnnualPassiveIncome() {
        return annualPassiveIncome;
    }

    public void setAnnualPassiveIncome(Double annualPassiveIncome) {
        this.annualPassiveIncome = annualPassiveIncome;
    }

    public Double getAnnualPortfolioIncome() {
        return annualPortfolioIncome;
    }

    public void setAnnualPortfolioIncome(Double annualPortfolioIncome) {
        this.annualPortfolioIncome = annualPortfolioIncome;
    }

    public Boolean getGroupingElection() {
        return groupingElection;
    }

    public void setGroupingElection(Boolean groupingElection) {
        this.groupingElection = groupingElection;
    }

    public String getFilingStatus() {
        return filingStatus;
    }

    public void setFilingStatus(String filingStatus) {
        this.filingStatus = filingStatus;
    }

    public Double getAnnualIncome() {
        return annualIncome;
    }

    public void setAnnualIncome(Double annualIncome) {
        this.annualIncome = annualIncome;
    }

    public Boolean getIncludeDepreciationSchedule() {
        return includeDepreciationSchedule;
    }

    public void setIncludeDepreciationSchedule(Boolean includeDepreciationSchedule) {
        this.includeDepreciationSchedule = includeDepreciationSchedule;
    }

    public Double getW2Income() {
        return w2Income;
    }

    public void setW2Income(Double w2Income) {
        this.w2Income = w2Income;
    }

    public Double getBusinessIncome() {
        return businessIncome;
    }

    public void setBusinessIncome(Double businessIncome) {
        this.businessIncome = businessIncome;
    }

    public Double getIraBalance() {
        return iraBalance;
    }

    public void setIraBalance(Double iraBalance) {
        this.iraBalance = iraBalance;
    }

    public Double getPassiveIncome() {
        return passiveIncome;
    }

    public void setPassiveIncome(Double passiveIncome) {
        this.passiveIncome = passiveIncome;
    }

    public Double getAssetSaleGain() {
        return assetSaleGain;
    }

    public void setAssetSaleGain(Double assetSaleGain) {
        this.assetSaleGain = assetSaleGain;
    }
}
