package com.hdc.hdc_map_backend.entity.taxBenefits;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "input_capital_structure", schema = "tax_benefits")
public class InputCapitalStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long id;

    @OneToOne
    @JoinColumn(name = "deal_conduit_id", nullable = false, unique = true)
    @JsonIgnore
    private DealConduit dealConduit;

    // Equity
    @Column(name = "auto_balance_capital")
    private Boolean autoBalanceCapital;

    @Column(name = "investor_equity_ratio")
    private Double investorEquityRatio;

    @Column(name = "investor_equity_pct")
    private Double investorEquityPct;

    @Column(name = "philanthropic_equity_pct")
    private Double philanthropicEquityPct;

    // Senior Debt
    @Column(name = "senior_debt_pct")
    private Double seniorDebtPct;

    @Column(name = "senior_debt_rate")
    private Double seniorDebtRate;

    @Column(name = "senior_debt_amortization")
    private Double seniorDebtAmortization;

    @Column(name = "senior_debt_io_years")
    @JsonProperty("seniorDebtIOYears")
    private Integer seniorDebtIoYears;

    // Philanthropic Debt
    @Column(name = "phil_debt_pct")
    private Double philDebtPct;

    @Column(name = "phil_debt_rate")
    private Double philDebtRate;

    @Column(name = "phil_debt_amortization")
    private Double philDebtAmortization;

    @Column(name = "phil_current_pay_enabled")
    private Boolean philCurrentPayEnabled;

    @Column(name = "phil_current_pay_pct")
    private Double philCurrentPayPct;

    // HDC Sub Debt
    @Column(name = "hdc_sub_debt_pct")
    private Double hdcSubDebtPct;

    @Column(name = "hdc_sub_debt_pik_rate")
    private Double hdcSubDebtPikRate;

    @Column(name = "pik_current_pay_enabled")
    private Boolean pikCurrentPayEnabled;

    @Column(name = "pik_current_pay_pct")
    private Double pikCurrentPayPct;

    // Investor Sub Debt
    @Column(name = "investor_sub_debt_pct")
    private Double investorSubDebtPct;

    @Column(name = "investor_sub_debt_pik_rate")
    private Double investorSubDebtPikRate;

    @Column(name = "investor_pik_current_pay_enabled")
    private Boolean investorPikCurrentPayEnabled;

    @Column(name = "investor_pik_current_pay_pct")
    private Double investorPikCurrentPayPct;

    // Outside Investor Sub Debt
    @Column(name = "outside_investor_sub_debt_pct")
    private Double outsideInvestorSubDebtPct;

    @Column(name = "outside_investor_sub_debt_rate")
    @JsonProperty("outsideInvestorSubDebtPikRate")
    private Double outsideInvestorSubDebtRate;

    @Column(name = "outside_investor_sub_debt_amortization")
    private Integer outsideInvestorSubDebtAmortization;

    @Column(name = "outside_investor_pik_current_pay_enabled")
    private Boolean outsideInvestorPikCurrentPayEnabled;

    @Column(name = "outside_investor_pik_current_pay_pct")
    private Double outsideInvestorPikCurrentPayPct;

    // HDC Debt Fund
    @Column(name = "hdc_debt_fund_pct")
    private Double hdcDebtFundPct;

    @Column(name = "hdc_debt_fund_pik_rate")
    private Double hdcDebtFundPikRate;

    @Column(name = "hdc_debt_fund_current_pay_enabled")
    private Boolean hdcDebtFundCurrentPayEnabled;

    @Column(name = "hdc_debt_fund_current_pay_pct")
    private Double hdcDebtFundCurrentPayPct;

    // Sub Debt Priority
    @Column(name = "sub_debt_priority", columnDefinition = "TEXT")
    private String subDebtPriority;

    @Column(name = "sub_debt_priority_hdc")
    private Integer subDebtPriorityHdc;

    @Column(name = "sub_debt_priority_investor")
    private Integer subDebtPriorityInvestor;

    @Column(name = "sub_debt_priority_outside_investor")
    private Integer subDebtPriorityOutsideInvestor;

    // Interest Reserve
    @Column(name = "interest_reserve_enabled")
    private Boolean interestReserveEnabled;

    @Column(name = "interest_reserve_months")
    private Integer interestReserveMonths;

    @Column(name = "interest_reserve_amount")
    private Double interestReserveAmount;

    // Private Activity Bonds (PABs)
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
    @JsonProperty("pabIOYears")
    private Integer pabIoYears;

    // HDC Platform Mode
    @Column(name = "hdc_platform_mode")
    private String hdcPlatformMode;

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

    public Integer getSeniorDebtIoYears() {
        return seniorDebtIoYears;
    }

    public void setSeniorDebtIoYears(Integer seniorDebtIoYears) {
        this.seniorDebtIoYears = seniorDebtIoYears;
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

    public String getSubDebtPriority() {
        return subDebtPriority;
    }

    public void setSubDebtPriority(String subDebtPriority) {
        this.subDebtPriority = subDebtPriority;
    }

    public Integer getSubDebtPriorityHdc() {
        return subDebtPriorityHdc;
    }

    public void setSubDebtPriorityHdc(Integer subDebtPriorityHdc) {
        this.subDebtPriorityHdc = subDebtPriorityHdc;
    }

    public Integer getSubDebtPriorityInvestor() {
        return subDebtPriorityInvestor;
    }

    public void setSubDebtPriorityInvestor(Integer subDebtPriorityInvestor) {
        this.subDebtPriorityInvestor = subDebtPriorityInvestor;
    }

    public Integer getSubDebtPriorityOutsideInvestor() {
        return subDebtPriorityOutsideInvestor;
    }

    public void setSubDebtPriorityOutsideInvestor(Integer subDebtPriorityOutsideInvestor) {
        this.subDebtPriorityOutsideInvestor = subDebtPriorityOutsideInvestor;
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

    public Integer getPabIoYears() {
        return pabIoYears;
    }

    public void setPabIoYears(Integer pabIoYears) {
        this.pabIoYears = pabIoYears;
    }

    public String getHdcPlatformMode() {
        return hdcPlatformMode;
    }

    public void setHdcPlatformMode(String hdcPlatformMode) {
        this.hdcPlatformMode = hdcPlatformMode;
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
