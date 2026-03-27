package com.hdc.hdc_map_backend.entity.taxBenefits;

import jakarta.persistence.*;

@Entity
@Table(name = "input_projections", schema = "tax_benefits")
public class InputProjections {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Long id;

    @OneToOne
    @JoinColumn(name = "deal_conduit_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private DealConduit dealConduit;

    // Hold period & timing
    @Column(name = "hold_period")
    private Integer holdPeriod;

    @Column(name = "year_one_depreciation_pct")
    private Double yearOneDepreciationPct;

    @Column(name = "exit_cap_rate")
    private Double exitCapRate;

    @Column(name = "construction_delay_months")
    private Integer constructionDelayMonths;

    @Column(name = "tax_benefit_delay_months")
    private Integer taxBenefitDelayMonths;

    // IMPL-140: Date-driven timing architecture fields
    @Column(name = "investment_date")
    private String investmentDate;

    @Column(name = "elect_defer_credit_period")
    private Boolean electDeferCreditPeriod;

    @Column(name = "pis_date_override")
    private String pisDateOverride;

    @Column(name = "exit_extension_months")
    private Integer exitExtensionMonths;

    // ISS-068c: Single NOI growth rate (replaces legacy revenue_growth, expense_growth, opex_ratio)
    @Column(name = "noi_growth_rate")
    private Double noiGrowthRate;

    // Legacy growth & operating assumptions
    @Column(name = "revenue_growth")
    private Double revenueGrowth;

    @Column(name = "expense_growth")
    private Double expenseGrowth;

    @Column(name = "opex_ratio")
    private Double opexRatio;

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

    public Integer getHoldPeriod() {
        return holdPeriod;
    }

    public void setHoldPeriod(Integer holdPeriod) {
        this.holdPeriod = holdPeriod;
    }

    public Double getYearOneDepreciationPct() {
        return yearOneDepreciationPct;
    }

    public void setYearOneDepreciationPct(Double yearOneDepreciationPct) {
        this.yearOneDepreciationPct = yearOneDepreciationPct;
    }

    public Double getExitCapRate() {
        return exitCapRate;
    }

    public void setExitCapRate(Double exitCapRate) {
        this.exitCapRate = exitCapRate;
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

    public Double getRevenueGrowth() {
        return revenueGrowth;
    }

    public void setRevenueGrowth(Double revenueGrowth) {
        this.revenueGrowth = revenueGrowth;
    }

    public Double getExpenseGrowth() {
        return expenseGrowth;
    }

    public void setExpenseGrowth(Double expenseGrowth) {
        this.expenseGrowth = expenseGrowth;
    }

    public Double getOpexRatio() {
        return opexRatio;
    }

    public void setOpexRatio(Double opexRatio) {
        this.opexRatio = opexRatio;
    }

    public Double getNoiGrowthRate() {
        return noiGrowthRate;
    }

    public void setNoiGrowthRate(Double noiGrowthRate) {
        this.noiGrowthRate = noiGrowthRate;
    }

    // IMPL-140: Timing architecture getters/setters
    public String getInvestmentDate() {
        return investmentDate;
    }

    public void setInvestmentDate(String investmentDate) {
        this.investmentDate = investmentDate;
    }

    public Boolean getElectDeferCreditPeriod() {
        return electDeferCreditPeriod;
    }

    public void setElectDeferCreditPeriod(Boolean electDeferCreditPeriod) {
        this.electDeferCreditPeriod = electDeferCreditPeriod;
    }

    public String getPisDateOverride() {
        return pisDateOverride;
    }

    public void setPisDateOverride(String pisDateOverride) {
        this.pisDateOverride = pisDateOverride;
    }

    public Integer getExitExtensionMonths() {
        return exitExtensionMonths;
    }

    public void setExitExtensionMonths(Integer exitExtensionMonths) {
        this.exitExtensionMonths = exitExtensionMonths;
    }
}
