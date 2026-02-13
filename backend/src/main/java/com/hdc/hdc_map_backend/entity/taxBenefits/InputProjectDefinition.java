package com.hdc.hdc_map_backend.entity.taxBenefits;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "input_project_definition", schema = "tax_benefits")
public class InputProjectDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long id;

    @OneToOne
    @JoinColumn(name = "deal_conduit_id", nullable = false, unique = true)
    @JsonIgnore
    private DealConduit dealConduit;

    @Column(name = "project_cost")
    private Double projectCost;

    @Column(name = "predevelopment_costs")
    private Double predevelopmentCosts;

    @Column(name = "land_value")
    private Double landValue;

    @Column(name = "selected_state")
    private String selectedState;

    @Column(name = "year_one_noi")
    @JsonProperty("yearOneNOI")
    private Double yearOneNoi;

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

    public Double getProjectCost() {
        return projectCost;
    }

    public void setProjectCost(Double projectCost) {
        this.projectCost = projectCost;
    }

    public Double getPredevelopmentCosts() {
        return predevelopmentCosts;
    }

    public void setPredevelopmentCosts(Double predevelopmentCosts) {
        this.predevelopmentCosts = predevelopmentCosts;
    }

    public Double getLandValue() {
        return landValue;
    }

    public void setLandValue(Double landValue) {
        this.landValue = landValue;
    }

    public String getSelectedState() {
        return selectedState;
    }

    public void setSelectedState(String selectedState) {
        this.selectedState = selectedState;
    }

    public Double getYearOneNoi() {
        return yearOneNoi;
    }

    public void setYearOneNoi(Double yearOneNoi) {
        this.yearOneNoi = yearOneNoi;
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
