package com.hdc.hdc_map_backend.repository.taxBenefits;

import com.hdc.hdc_map_backend.entity.taxBenefits.PoolMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PoolMembershipRepository extends JpaRepository<PoolMembership, Long> {

    List<PoolMembership> findByPoolId(Long poolId);

    List<PoolMembership> findByDealBenefitProfileId(Long dbpId);

    Optional<PoolMembership> findByPoolIdAndDealBenefitProfileId(Long poolId, Long dbpId);

    boolean existsByPoolIdAndDealBenefitProfileId(Long poolId, Long dbpId);
}
