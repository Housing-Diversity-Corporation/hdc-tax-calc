package com.hdc.hdc_map_backend.service.taxBenefits;

import com.hdc.hdc_map_backend.dto.taxBenefits.DealBenefitProfileView;
import com.hdc.hdc_map_backend.entity.taxBenefits.DealBenefitProfile;
import com.hdc.hdc_map_backend.entity.taxBenefits.DealConduit;
import com.hdc.hdc_map_backend.repository.taxBenefits.DealBenefitProfileRepository;
import com.hdc.hdc_map_backend.repository.taxBenefits.DealConduitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DealBenefitProfileService {

    @Autowired
    private DealBenefitProfileRepository dealBenefitProfileRepository;

    @Autowired
    private DealConduitRepository dealConduitRepository;

    public List<DealBenefitProfile> getAllProfiles() {
        return dealBenefitProfileRepository.findAll();
    }

    public Optional<DealBenefitProfile> getProfileById(Long id) {
        return dealBenefitProfileRepository.findById(id);
    }

    public List<DealBenefitProfile> getProfilesByConduit(Long conduitId) {
        return dealBenefitProfileRepository.findByDealConduitIdOrderByExtractedAtDesc(conduitId);
    }

    public Optional<DealBenefitProfileView> getProfileView(Long id) {
        Optional<DealBenefitProfile> profileOpt = dealBenefitProfileRepository.findById(id);
        if (profileOpt.isEmpty()) {
            return Optional.empty();
        }

        DealBenefitProfile profile = profileOpt.get();
        DealConduit conduit = profile.getDealConduit();

        String sourceDealName = null;
        Long sourceConduitId = null;

        if (conduit != null) {
            sourceConduitId = conduit.getId();
            if (conduit.getPortalSettings() != null) {
                sourceDealName = conduit.getPortalSettings().getDealName();
            }
        }

        return Optional.of(new DealBenefitProfileView(profile, sourceDealName, sourceConduitId));
    }

    @Transactional
    public DealBenefitProfile extractProfile(Long conduitId, DealBenefitProfile incoming) {
        DealConduit conduit = dealConduitRepository.findById(conduitId)
            .orElseThrow(() -> new RuntimeException("DealConduit not found with id: " + conduitId));

        // Copy frozen snapshot columns from conduit child tables
        if (conduit.getProjectDefinition() != null) {
            incoming.setPropertyState(conduit.getProjectDefinition().getSelectedState());
            incoming.setProjectCost(conduit.getProjectDefinition().getProjectCost());
        }

        if (conduit.getOpportunityZone() != null) {
            incoming.setOzEnabled(conduit.getOpportunityZone().getOzEnabled());
        }

        if (conduit.getProjections() != null) {
            incoming.setHoldPeriod(conduit.getProjections().getHoldPeriod());
        }

        if (conduit.getTaxCredits() != null) {
            incoming.setPisMonth(conduit.getTaxCredits().getPlacedInServiceMonth());
            incoming.setSyndicationRate(conduit.getTaxCredits().getSyndicationRate());
        }

        if (conduit.getCapitalStructure() != null) {
            incoming.setSeniorDebtPct(conduit.getCapitalStructure().getSeniorDebtPct());
            incoming.setPhilDebtPct(conduit.getCapitalStructure().getPhilDebtPct());
            incoming.setEquityPct(conduit.getCapitalStructure().getInvestorEquityPct());
        }

        // costSegregationPercent and depreciableBasis are left as-is from incoming

        // Set FK and extraction timestamp
        incoming.setDealConduit(conduit);
        incoming.setExtractedAt(LocalDateTime.now());

        return dealBenefitProfileRepository.save(incoming);
    }

    @Transactional
    public void deleteProfile(Long id) {
        dealBenefitProfileRepository.deleteById(id);
    }
}
