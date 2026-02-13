package com.hdc.hdc_map_backend.entity.taxBenefits;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "input_opportunity_zone", schema = "tax_benefits")
public class InputOpportunityZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long id;

    @OneToOne
    @JoinColumn(name = "deal_conduit_id", nullable = false, unique = true)
    @JsonIgnore
    private DealConduit dealConduit;

    @Column(name = "oz_enabled")
    private Boolean ozEnabled;

    @Column(name = "oz_type")
    private String ozType;

    @Column(name = "oz_version")
    private String ozVersion;

    @Column(name = "oz_deferred_capital_gains")
    @JsonProperty("deferredCapitalGains")
    private Double ozDeferredCapitalGains;

    @Column(name = "oz_capital_gains_tax_rate")
    private Double ozCapitalGainsTaxRate;

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

    public String getOzVersion() {
        return ozVersion;
    }

    public void setOzVersion(String ozVersion) {
        this.ozVersion = ozVersion;
    }

    public Double getOzDeferredCapitalGains() {
        return ozDeferredCapitalGains;
    }

    public void setOzDeferredCapitalGains(Double ozDeferredCapitalGains) {
        this.ozDeferredCapitalGains = ozDeferredCapitalGains;
    }

    public Double getOzCapitalGainsTaxRate() {
        return ozCapitalGainsTaxRate;
    }

    public void setOzCapitalGainsTaxRate(Double ozCapitalGainsTaxRate) {
        this.ozCapitalGainsTaxRate = ozCapitalGainsTaxRate;
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
