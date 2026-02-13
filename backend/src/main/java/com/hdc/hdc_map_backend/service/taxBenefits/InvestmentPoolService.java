package com.hdc.hdc_map_backend.service.taxBenefits;

import com.hdc.hdc_map_backend.dto.taxBenefits.PoolWithDealsResponse;
import com.hdc.hdc_map_backend.entity.taxBenefits.DealBenefitProfile;
import com.hdc.hdc_map_backend.entity.taxBenefits.InvestmentPool;
import com.hdc.hdc_map_backend.entity.taxBenefits.PoolMembership;
import com.hdc.hdc_map_backend.repository.taxBenefits.DealBenefitProfileRepository;
import com.hdc.hdc_map_backend.repository.taxBenefits.InvestmentPoolRepository;
import com.hdc.hdc_map_backend.repository.taxBenefits.PoolMembershipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InvestmentPoolService {

    @Autowired
    private InvestmentPoolRepository investmentPoolRepository;

    @Autowired
    private PoolMembershipRepository poolMembershipRepository;

    @Autowired
    private DealBenefitProfileRepository dealBenefitProfileRepository;

    public List<InvestmentPool> getAllPools() {
        return investmentPoolRepository.findAll();
    }

    public Optional<InvestmentPool> getPoolById(Long id) {
        return investmentPoolRepository.findById(id);
    }

    public PoolWithDealsResponse getPoolWithDeals(Long poolId) {
        InvestmentPool pool = investmentPoolRepository.findById(poolId)
            .orElseThrow(() -> new RuntimeException("InvestmentPool not found with id: " + poolId));

        List<PoolMembership> memberships = poolMembershipRepository.findByPoolId(poolId);
        List<DealBenefitProfile> deals = memberships.stream()
            .map(PoolMembership::getDealBenefitProfile)
            .collect(Collectors.toList());

        return new PoolWithDealsResponse(pool, deals);
    }

    @Transactional
    public InvestmentPool createPool(InvestmentPool pool) {
        return investmentPoolRepository.save(pool);
    }

    @Transactional
    public InvestmentPool updatePool(Long id, InvestmentPool incoming) {
        InvestmentPool existing = investmentPoolRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("InvestmentPool not found with id: " + id));

        existing.setPoolName(incoming.getPoolName());
        existing.setDescription(incoming.getDescription());
        existing.setStatus(incoming.getStatus());
        existing.setStartYear(incoming.getStartYear());

        return investmentPoolRepository.save(existing);
    }

    @Transactional
    public void deletePool(Long id) {
        investmentPoolRepository.deleteById(id);
    }

    @Transactional
    public PoolMembership addDealToPool(Long poolId, Long dbpId) {
        if (poolMembershipRepository.existsByPoolIdAndDealBenefitProfileId(poolId, dbpId)) {
            throw new RuntimeException("Deal already in pool");
        }

        InvestmentPool pool = investmentPoolRepository.findById(poolId)
            .orElseThrow(() -> new RuntimeException("InvestmentPool not found with id: " + poolId));

        DealBenefitProfile dbp = dealBenefitProfileRepository.findById(dbpId)
            .orElseThrow(() -> new RuntimeException("DealBenefitProfile not found with id: " + dbpId));

        PoolMembership membership = new PoolMembership();
        membership.setPool(pool);
        membership.setDealBenefitProfile(dbp);

        return poolMembershipRepository.save(membership);
    }

    @Transactional
    public void removeDealFromPool(Long poolId, Long dbpId) {
        PoolMembership membership = poolMembershipRepository.findByPoolIdAndDealBenefitProfileId(poolId, dbpId)
            .orElseThrow(() -> new RuntimeException("Membership not found for pool " + poolId + " and deal " + dbpId));

        poolMembershipRepository.delete(membership);
    }
}
