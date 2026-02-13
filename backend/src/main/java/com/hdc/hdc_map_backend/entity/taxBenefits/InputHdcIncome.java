package com.hdc.hdc_map_backend.entity.taxBenefits;

import jakarta.persistence.*;

@Entity
@Table(name = "input_hdc_income", schema = "tax_benefits")
public class InputHdcIncome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Long id;

    @OneToOne
    @JoinColumn(name = "deal_conduit_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private DealConduit dealConduit;

    // HDC fee structure
    @Column(name = "hdc_fee_rate")
    private Double hdcFeeRate;

    @Column(name = "hdc_development_fee_pct")
    private Double hdcDevelopmentFeePct;

    @Column(name = "hdc_deferred_interest_rate")
    private Double hdcDeferredInterestRate;

    @Column(name = "investor_promote_share")
    private Double investorPromoteShare;

    // AUM fee settings
    @Column(name = "aum_fee_enabled")
    private Boolean aumFeeEnabled;

    @Column(name = "aum_fee_rate")
    private Double aumFeeRate;

    @Column(name = "aum_current_pay_enabled")
    private Boolean aumCurrentPayEnabled;

    @Column(name = "aum_current_pay_pct")
    private Double aumCurrentPayPct;

    // Advance financing
    @Column(name = "hdc_advance_financing")
    private Boolean hdcAdvanceFinancing;

    @Column(name = "tax_advance_discount_rate")
    private Double taxAdvanceDiscountRate;

    @Column(name = "advance_financing_rate")
    private Double advanceFinancingRate;

    @Column(name = "tax_delivery_months")
    private Integer taxDeliveryMonths;

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

    public Double getHdcDeferredInterestRate() {
        return hdcDeferredInterestRate;
    }

    public void setHdcDeferredInterestRate(Double hdcDeferredInterestRate) {
        this.hdcDeferredInterestRate = hdcDeferredInterestRate;
    }

    public Double getInvestorPromoteShare() {
        return investorPromoteShare;
    }

    public void setInvestorPromoteShare(Double investorPromoteShare) {
        this.investorPromoteShare = investorPromoteShare;
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
}
