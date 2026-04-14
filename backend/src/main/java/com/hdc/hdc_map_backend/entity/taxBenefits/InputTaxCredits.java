package com.hdc.hdc_map_backend.entity.taxBenefits;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "input_tax_credits", schema = "tax_benefits")
public class InputTaxCredits {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long id;

    @OneToOne
    @JoinColumn(name = "deal_conduit_id", nullable = false, unique = true)
    @JsonIgnore
    private DealConduit dealConduit;

    // Federal LIHTC
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

    // Eligible Basis Exclusions
    @Column(name = "commercial_basis_pct")
    private Double commercialBasisPct;

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

    // State LIHTC
    @Column(name = "state_lihtc_enabled")
    @JsonProperty("stateLIHTCEnabled")
    private Boolean stateLihtcEnabled;

    @Column(name = "syndication_rate")
    private Double syndicationRate;

    @Column(name = "investor_has_state_liability")
    private Boolean investorHasStateLiability;

    @Column(name = "state_lihtc_user_percentage")
    @JsonProperty("stateLIHTCUserPercentage")
    private Double stateLihtcUserPercentage;

    @Column(name = "state_lihtc_user_amount")
    @JsonProperty("stateLIHTCUserAmount")
    private Double stateLihtcUserAmount;

    @Column(name = "state_lihtc_syndication_year")
    @JsonProperty("stateLIHTCSyndicationYear")
    private Integer stateLihtcSyndicationYear;

    @Column(name = "created_at")
    @JsonIgnore
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @JsonIgnore
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

    public DealConduit getDealConduit() {
        return dealConduit;
    }

    public void setDealConduit(DealConduit dealConduit) {
        this.dealConduit = dealConduit;
    }

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

    public Double getCommercialBasisPct() {
        return commercialBasisPct;
    }

    public void setCommercialBasisPct(Double commercialBasisPct) {
        this.commercialBasisPct = commercialBasisPct;
    }

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

    public Boolean getStateLihtcEnabled() {
        return stateLihtcEnabled;
    }

    public void setStateLihtcEnabled(Boolean stateLihtcEnabled) {
        this.stateLihtcEnabled = stateLihtcEnabled;
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

    public Double getStateLihtcUserPercentage() {
        return stateLihtcUserPercentage;
    }

    public void setStateLihtcUserPercentage(Double stateLihtcUserPercentage) {
        this.stateLihtcUserPercentage = stateLihtcUserPercentage;
    }

    public Double getStateLihtcUserAmount() {
        return stateLihtcUserAmount;
    }

    public void setStateLihtcUserAmount(Double stateLihtcUserAmount) {
        this.stateLihtcUserAmount = stateLihtcUserAmount;
    }

    public Integer getStateLihtcSyndicationYear() {
        return stateLihtcSyndicationYear;
    }

    public void setStateLihtcSyndicationYear(Integer stateLihtcSyndicationYear) {
        this.stateLihtcSyndicationYear = stateLihtcSyndicationYear;
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
