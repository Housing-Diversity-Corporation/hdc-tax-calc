package com.hdc.hdc_map_backend.entity.taxBenefits;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pool_memberships", schema = "tax_benefits",
       uniqueConstraints = @UniqueConstraint(columnNames = {"pool_id", "dbp_id"}))
public class PoolMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pool_id", nullable = false)
    private InvestmentPool pool;

    @ManyToOne
    @JoinColumn(name = "dbp_id", nullable = false)
    private DealBenefitProfile dealBenefitProfile;

    @Column(name = "added_at")
    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public InvestmentPool getPool() {
        return pool;
    }

    public void setPool(InvestmentPool pool) {
        this.pool = pool;
    }

    public DealBenefitProfile getDealBenefitProfile() {
        return dealBenefitProfile;
    }

    public void setDealBenefitProfile(DealBenefitProfile dealBenefitProfile) {
        this.dealBenefitProfile = dealBenefitProfile;
    }

    public LocalDateTime getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(LocalDateTime addedAt) {
        this.addedAt = addedAt;
    }
}
