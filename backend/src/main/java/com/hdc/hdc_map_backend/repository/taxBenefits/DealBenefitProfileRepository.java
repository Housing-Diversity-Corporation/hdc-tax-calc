package com.hdc.hdc_map_backend.repository.taxBenefits;

import com.hdc.hdc_map_backend.entity.taxBenefits.DealBenefitProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealBenefitProfileRepository extends JpaRepository<DealBenefitProfile, Long> {

    List<DealBenefitProfile> findByDealConduitIdOrderByExtractedAtDesc(Long dealConduitId);
}
