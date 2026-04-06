package com.hdc.hdc_map_backend.entity.taxBenefits;

import com.hdc.hdc_map_backend.converter.DoubleListConverter;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "deal_benefit_profiles", schema = "tax_benefits")
public class DealBenefitProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "deal_conduit_id")
    private DealConduit dealConduit;

    @OneToMany(mappedBy = "dealBenefitProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PoolMembership> poolMemberships;

    // Unique extraction data

    @Column(name = "deal_name")
    private String dealName;

    @Column(name = "fund_year")
    private Integer fundYear;

    @Column(name = "gross_equity")
    private Double grossEquity;

    @Column(name = "net_equity")
    private Double netEquity;

    @Column(name = "syndication_proceeds")
    private Double syndicationProceeds;

    @Column(name = "pis_year")
    private Integer pisYear;

    @Column(name = "projected_exit_year")
    private Integer projectedExitYear;

    @Column(name = "state_lihtc_path", length = 20)
    private String stateLihtcPath;

    // Frozen snapshot columns (copied from conduit inputs at extraction time)

    @Column(name = "property_state", length = 10)
    private String propertyState;

    @Column(name = "project_cost")
    private Double projectCost;

    @Column(name = "oz_enabled")
    private Boolean ozEnabled;

    @Column(name = "hold_period")
    private Integer holdPeriod;

    @Column(name = "pis_month")
    private Integer pisMonth;

    // IMPL-154: Timeline config fields — captured at extraction for Timeline Audit Panel
    @Column(name = "investment_date")
    private String investmentDate;

    @Column(name = "construction_delay_months")
    private Integer constructionDelayMonths;

    @Column(name = "pis_date_override")
    private String pisDateOverride;

    @Column(name = "elect_defer_credit_period")
    private Boolean electDeferCreditPeriod;

    @Column(name = "senior_debt_pct")
    private Double seniorDebtPct;

    @Column(name = "phil_debt_pct")
    private Double philDebtPct;

    @Column(name = "equity_pct")
    private Double equityPct;

    @Column(name = "syndication_rate")
    private Double syndicationRate;

    @Column(name = "cost_segregation_percent")
    private Double costSegregationPercent;

    @Column(name = "depreciable_basis")
    private Double depreciableBasis;

    // JSONB schedules

    @Column(name = "depreciation_schedule", columnDefinition = "jsonb")
    @Convert(converter = DoubleListConverter.class)
    private List<Double> depreciationSchedule;

    @Column(name = "lihtc_schedule", columnDefinition = "jsonb")
    @Convert(converter = DoubleListConverter.class)
    private List<Double> lihtcSchedule;

    @Column(name = "state_lihtc_schedule", columnDefinition = "jsonb")
    @Convert(converter = DoubleListConverter.class)
    private List<Double> stateLihtcSchedule;

    @Column(name = "operating_cash_flow", columnDefinition = "jsonb")
    @Convert(converter = DoubleListConverter.class)
    private List<Double> operatingCashFlow;

    // Computed exit/recapture

    @Column(name = "exit_proceeds")
    private Double exitProceeds;

    @Column(name = "cumulative_depreciation")
    private Double cumulativeDepreciation;

    @Column(name = "recapture_exposure")
    private Double recaptureExposure;

    @Column(name = "projected_appreciation")
    private Double projectedAppreciation;

    @Column(name = "capital_gains_tax")
    private Double capitalGainsTax;

    // Metadata

    @Column(name = "extracted_at")
    private LocalDateTime extractedAt;

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

    public DealConduit getDealConduit() {
        return dealConduit;
    }

    public void setDealConduit(DealConduit dealConduit) {
        this.dealConduit = dealConduit;
    }

    public String getDealName() {
        return dealName;
    }

    public void setDealName(String dealName) {
        this.dealName = dealName;
    }

    public Integer getFundYear() {
        return fundYear;
    }

    public void setFundYear(Integer fundYear) {
        this.fundYear = fundYear;
    }

    public Double getGrossEquity() {
        return grossEquity;
    }

    public void setGrossEquity(Double grossEquity) {
        this.grossEquity = grossEquity;
    }

    public Double getNetEquity() {
        return netEquity;
    }

    public void setNetEquity(Double netEquity) {
        this.netEquity = netEquity;
    }

    public Double getSyndicationProceeds() {
        return syndicationProceeds;
    }

    public void setSyndicationProceeds(Double syndicationProceeds) {
        this.syndicationProceeds = syndicationProceeds;
    }

    public Integer getPisYear() {
        return pisYear;
    }

    public void setPisYear(Integer pisYear) {
        this.pisYear = pisYear;
    }

    public Integer getProjectedExitYear() {
        return projectedExitYear;
    }

    public void setProjectedExitYear(Integer projectedExitYear) {
        this.projectedExitYear = projectedExitYear;
    }

    public String getStateLihtcPath() {
        return stateLihtcPath;
    }

    public void setStateLihtcPath(String stateLihtcPath) {
        this.stateLihtcPath = stateLihtcPath;
    }

    public String getPropertyState() {
        return propertyState;
    }

    public void setPropertyState(String propertyState) {
        this.propertyState = propertyState;
    }

    public Double getProjectCost() {
        return projectCost;
    }

    public void setProjectCost(Double projectCost) {
        this.projectCost = projectCost;
    }

    public Boolean getOzEnabled() {
        return ozEnabled;
    }

    public void setOzEnabled(Boolean ozEnabled) {
        this.ozEnabled = ozEnabled;
    }

    public Integer getHoldPeriod() {
        return holdPeriod;
    }

    public void setHoldPeriod(Integer holdPeriod) {
        this.holdPeriod = holdPeriod;
    }

    public Integer getPisMonth() {
        return pisMonth;
    }

    public void setPisMonth(Integer pisMonth) {
        this.pisMonth = pisMonth;
    }

    public String getInvestmentDate() {
        return investmentDate;
    }

    public void setInvestmentDate(String investmentDate) {
        this.investmentDate = investmentDate;
    }

    public Integer getConstructionDelayMonths() {
        return constructionDelayMonths;
    }

    public void setConstructionDelayMonths(Integer constructionDelayMonths) {
        this.constructionDelayMonths = constructionDelayMonths;
    }

    public String getPisDateOverride() {
        return pisDateOverride;
    }

    public void setPisDateOverride(String pisDateOverride) {
        this.pisDateOverride = pisDateOverride;
    }

    public Boolean getElectDeferCreditPeriod() {
        return electDeferCreditPeriod;
    }

    public void setElectDeferCreditPeriod(Boolean electDeferCreditPeriod) {
        this.electDeferCreditPeriod = electDeferCreditPeriod;
    }

    public Double getSeniorDebtPct() {
        return seniorDebtPct;
    }

    public void setSeniorDebtPct(Double seniorDebtPct) {
        this.seniorDebtPct = seniorDebtPct;
    }

    public Double getPhilDebtPct() {
        return philDebtPct;
    }

    public void setPhilDebtPct(Double philDebtPct) {
        this.philDebtPct = philDebtPct;
    }

    public Double getEquityPct() {
        return equityPct;
    }

    public void setEquityPct(Double equityPct) {
        this.equityPct = equityPct;
    }

    public Double getSyndicationRate() {
        return syndicationRate;
    }

    public void setSyndicationRate(Double syndicationRate) {
        this.syndicationRate = syndicationRate;
    }

    public Double getCostSegregationPercent() {
        return costSegregationPercent;
    }

    public void setCostSegregationPercent(Double costSegregationPercent) {
        this.costSegregationPercent = costSegregationPercent;
    }

    public Double getDepreciableBasis() {
        return depreciableBasis;
    }

    public void setDepreciableBasis(Double depreciableBasis) {
        this.depreciableBasis = depreciableBasis;
    }

    public List<Double> getDepreciationSchedule() {
        return depreciationSchedule;
    }

    public void setDepreciationSchedule(List<Double> depreciationSchedule) {
        this.depreciationSchedule = depreciationSchedule;
    }

    public List<Double> getLihtcSchedule() {
        return lihtcSchedule;
    }

    public void setLihtcSchedule(List<Double> lihtcSchedule) {
        this.lihtcSchedule = lihtcSchedule;
    }

    public List<Double> getStateLihtcSchedule() {
        return stateLihtcSchedule;
    }

    public void setStateLihtcSchedule(List<Double> stateLihtcSchedule) {
        this.stateLihtcSchedule = stateLihtcSchedule;
    }

    public List<Double> getOperatingCashFlow() {
        return operatingCashFlow;
    }

    public void setOperatingCashFlow(List<Double> operatingCashFlow) {
        this.operatingCashFlow = operatingCashFlow;
    }

    public Double getExitProceeds() {
        return exitProceeds;
    }

    public void setExitProceeds(Double exitProceeds) {
        this.exitProceeds = exitProceeds;
    }

    public Double getCumulativeDepreciation() {
        return cumulativeDepreciation;
    }

    public void setCumulativeDepreciation(Double cumulativeDepreciation) {
        this.cumulativeDepreciation = cumulativeDepreciation;
    }

    public Double getRecaptureExposure() {
        return recaptureExposure;
    }

    public void setRecaptureExposure(Double recaptureExposure) {
        this.recaptureExposure = recaptureExposure;
    }

    public Double getProjectedAppreciation() {
        return projectedAppreciation;
    }

    public void setProjectedAppreciation(Double projectedAppreciation) {
        this.projectedAppreciation = projectedAppreciation;
    }

    public Double getCapitalGainsTax() {
        return capitalGainsTax;
    }

    public void setCapitalGainsTax(Double capitalGainsTax) {
        this.capitalGainsTax = capitalGainsTax;
    }

    public LocalDateTime getExtractedAt() {
        return extractedAt;
    }

    public void setExtractedAt(LocalDateTime extractedAt) {
        this.extractedAt = extractedAt;
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
