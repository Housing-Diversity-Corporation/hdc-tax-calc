package com.hdc.hdc_map_backend.dto.taxBenefits;

import com.hdc.hdc_map_backend.entity.taxBenefits.DealBenefitProfile;

/**
 * Composite view for a DealBenefitProfile that includes the source conduit's deal name.
 */
public class DealBenefitProfileView {

    private DealBenefitProfile profile;
    private String sourceDealName;
    private Long sourceConduitId;

    public DealBenefitProfileView() {}

    public DealBenefitProfileView(DealBenefitProfile profile, String sourceDealName, Long sourceConduitId) {
        this.profile = profile;
        this.sourceDealName = sourceDealName;
        this.sourceConduitId = sourceConduitId;
    }

    public DealBenefitProfile getProfile() {
        return profile;
    }

    public void setProfile(DealBenefitProfile profile) {
        this.profile = profile;
    }

    public String getSourceDealName() {
        return sourceDealName;
    }

    public void setSourceDealName(String sourceDealName) {
        this.sourceDealName = sourceDealName;
    }

    public Long getSourceConduitId() {
        return sourceConduitId;
    }

    public void setSourceConduitId(Long sourceConduitId) {
        this.sourceConduitId = sourceConduitId;
    }
}
