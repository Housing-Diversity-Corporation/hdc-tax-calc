package com.hdc.hdc_map_backend.entity.taxBenefits;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "input_inv_portal_settings", schema = "tax_benefits")
public class InputInvPortalSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Long id;

    @OneToOne
    @JoinColumn(name = "deal_conduit_id", nullable = false, unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private DealConduit dealConduit;

    // Deal identity
    @Column(name = "deal_name")
    private String dealName;

    @Column(name = "category")
    private String category;

    @Column(name = "is_active")
    private Boolean isActive;

    // Configuration metadata
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "configuration_name")
    private String configurationName;

    @Column(name = "completion_status")
    private String completionStatus;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column(name = "is_investor_facing")
    private Boolean isInvestorFacing;

    // Sharing & classification
    @Column(name = "is_shared")
    private Boolean isShared;

    @Column(name = "tags", length = 1000)
    private String tags;  // Comma-separated: "OZ,LIHTC,PAB,Custom Tag"

    @Column(name = "status_category")
    private String statusCategory;  // User-defined: "In Progress", "Completed", etc.

    @Column(name = "collaborator_ids", length = 1000)
    private String collaboratorIds;  // Comma-separated user IDs of editors: "7,12,3"

    // Portal display settings
    @Column(name = "deal_description", length = 5000)
    private String dealDescription;

    @Column(name = "deal_location")
    private String dealLocation;

    @Column(name = "deal_latitude")
    private Double dealLatitude;

    @Column(name = "deal_longitude")
    private Double dealLongitude;

    @Column(name = "deal_image_url")
    private String dealImageUrl;

    @Column(name = "units")
    private Integer units;

    @Column(name = "affordability_mix")
    private String affordabilityMix;

    @Column(name = "project_status")
    private String projectStatus;

    @Column(name = "minimum_investment")
    private Double minimumInvestment;

    @Column(name = "available_equity")
    private Double availableEquity;

    // Timestamps
    @Column(name = "created_at")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @com.fasterxml.jackson.annotation.JsonIgnore
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getConfigurationName() {
        return configurationName;
    }

    public void setConfigurationName(String configurationName) {
        this.configurationName = configurationName;
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

    public String getDealImageUrl() {
        return dealImageUrl;
    }

    public void setDealImageUrl(String dealImageUrl) {
        this.dealImageUrl = dealImageUrl;
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

    public Double getAvailableEquity() {
        return availableEquity;
    }

    public void setAvailableEquity(Double availableEquity) {
        this.availableEquity = availableEquity;
    }

    public Boolean getIsShared() {
        return isShared;
    }

    public void setIsShared(Boolean isShared) {
        this.isShared = isShared;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getStatusCategory() {
        return statusCategory;
    }

    public void setStatusCategory(String statusCategory) {
        this.statusCategory = statusCategory;
    }

    public String getCollaboratorIds() {
        return collaboratorIds;
    }

    public void setCollaboratorIds(String collaboratorIds) {
        this.collaboratorIds = collaboratorIds;
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
