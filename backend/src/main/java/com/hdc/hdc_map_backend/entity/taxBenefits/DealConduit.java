package com.hdc.hdc_map_backend.entity.taxBenefits;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "deal_conduit", schema = "tax_benefits")
public class DealConduit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "is_preset", nullable = false)
    private Boolean isPreset;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // @JsonUnwrapped keeps API response flat — frontend sees same JSON as today
    @OneToOne(mappedBy = "dealConduit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonUnwrapped
    private InputProjectDefinition projectDefinition;

    @OneToOne(mappedBy = "dealConduit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonUnwrapped
    private InputCapitalStructure capitalStructure;

    @OneToOne(mappedBy = "dealConduit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonUnwrapped
    private InputTaxCredits taxCredits;

    @OneToOne(mappedBy = "dealConduit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonUnwrapped
    private InputOpportunityZone opportunityZone;

    @OneToOne(mappedBy = "dealConduit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonUnwrapped
    private InputInvestorProfile investorProfile;

    @OneToOne(mappedBy = "dealConduit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonUnwrapped
    private InputProjections projections;

    @OneToOne(mappedBy = "dealConduit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonUnwrapped
    private InputHdcIncome hdcIncome;

    @OneToOne(mappedBy = "dealConduit", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonUnwrapped
    private InputInvPortalSettings portalSettings;

    @OneToMany(mappedBy = "dealConduit", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<DealBenefitProfile> benefitProfiles;

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

    public Boolean getIsPreset() {
        return isPreset;
    }

    public void setIsPreset(Boolean isPreset) {
        this.isPreset = isPreset;
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

    // Child relationship getters/setters with bidirectional back-reference helpers

    public InputProjectDefinition getProjectDefinition() {
        return projectDefinition;
    }

    public void setProjectDefinition(InputProjectDefinition projectDefinition) {
        this.projectDefinition = projectDefinition;
        if (projectDefinition != null) {
            projectDefinition.setDealConduit(this);
        }
    }

    public InputCapitalStructure getCapitalStructure() {
        return capitalStructure;
    }

    public void setCapitalStructure(InputCapitalStructure capitalStructure) {
        this.capitalStructure = capitalStructure;
        if (capitalStructure != null) {
            capitalStructure.setDealConduit(this);
        }
    }

    public InputTaxCredits getTaxCredits() {
        return taxCredits;
    }

    public void setTaxCredits(InputTaxCredits taxCredits) {
        this.taxCredits = taxCredits;
        if (taxCredits != null) {
            taxCredits.setDealConduit(this);
        }
    }

    public InputOpportunityZone getOpportunityZone() {
        return opportunityZone;
    }

    public void setOpportunityZone(InputOpportunityZone opportunityZone) {
        this.opportunityZone = opportunityZone;
        if (opportunityZone != null) {
            opportunityZone.setDealConduit(this);
        }
    }

    public InputInvestorProfile getInvestorProfile() {
        return investorProfile;
    }

    public void setInvestorProfile(InputInvestorProfile investorProfile) {
        this.investorProfile = investorProfile;
        if (investorProfile != null) {
            investorProfile.setDealConduit(this);
        }
    }

    public InputProjections getProjections() {
        return projections;
    }

    public void setProjections(InputProjections projections) {
        this.projections = projections;
        if (projections != null) {
            projections.setDealConduit(this);
        }
    }

    public InputHdcIncome getHdcIncome() {
        return hdcIncome;
    }

    public void setHdcIncome(InputHdcIncome hdcIncome) {
        this.hdcIncome = hdcIncome;
        if (hdcIncome != null) {
            hdcIncome.setDealConduit(this);
        }
    }

    public InputInvPortalSettings getPortalSettings() {
        return portalSettings;
    }

    public void setPortalSettings(InputInvPortalSettings portalSettings) {
        this.portalSettings = portalSettings;
        if (portalSettings != null) {
            portalSettings.setDealConduit(this);
        }
    }
}
