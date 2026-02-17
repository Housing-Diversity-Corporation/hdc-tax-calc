package com.hdc.hdc_map_backend.service.taxBenefits;

import com.hdc.hdc_map_backend.dto.taxBenefits.ConfigurationWithOwnerDTO;
import com.hdc.hdc_map_backend.entity.User;
import com.hdc.hdc_map_backend.entity.taxBenefits.DealConduit;
import com.hdc.hdc_map_backend.entity.taxBenefits.InputInvPortalSettings;
import com.hdc.hdc_map_backend.repository.taxBenefits.DealConduitRepository;
import com.hdc.hdc_map_backend.repository.user.UserRepo;
import com.hdc.hdc_map_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DealConduitService {

    @Autowired
    private DealConduitRepository dealConduitRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepo userRepo;

    // === User Configurations ===

    // Get configs for a specific user
    public List<DealConduit> getUserConfigurations(String username) {
        User user = userService.findByUsername(username);
        return dealConduitRepository.findUserConfigurations(user.getId());
    }

    // Get ALL configs (for HDC collaboration)
    public List<DealConduit> getAllConfigurations() {
        return dealConduitRepository.findAllConfigurations();
    }

    // Get ALL configs enriched with owner + collaborator profile info (for PresetSelector)
    public List<ConfigurationWithOwnerDTO> getAllConfigurationsWithOwners() {
        List<DealConduit> configs = dealConduitRepository.findAllConfigurations();
        // Collect unique userIds (owners + collaborators)
        Set<Long> userIds = new HashSet<>();
        configs.forEach(dc -> {
            if (dc.getPortalSettings() != null) {
                if (dc.getPortalSettings().getUserId() != null)
                    userIds.add(dc.getPortalSettings().getUserId());
                String collabIds = dc.getPortalSettings().getCollaboratorIds();
                if (collabIds != null && !collabIds.isBlank()) {
                    Arrays.stream(collabIds.split(",")).map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .forEach(s -> { try { userIds.add(Long.parseLong(s)); } catch (NumberFormatException ignored) {} });
                }
            }
        });
        // Batch fetch users
        Map<Long, User> userMap = userRepo.findAllById(userIds).stream()
            .collect(Collectors.toMap(User::getId, u -> u));
        // Map to DTOs
        return configs.stream().map(dc -> {
            Long uid = dc.getPortalSettings() != null ? dc.getPortalSettings().getUserId() : null;
            User owner = uid != null ? userMap.get(uid) : null;
            // Parse collaborator profiles
            List<ConfigurationWithOwnerDTO.CollaboratorInfo> collaborators = new ArrayList<>();
            if (dc.getPortalSettings() != null && dc.getPortalSettings().getCollaboratorIds() != null
                    && !dc.getPortalSettings().getCollaboratorIds().isBlank()) {
                for (String s : dc.getPortalSettings().getCollaboratorIds().split(",")) {
                    try {
                        Long cId = Long.parseLong(s.trim());
                        User cUser = userMap.get(cId);
                        if (cUser != null) {
                            collaborators.add(new ConfigurationWithOwnerDTO.CollaboratorInfo(
                                cId, cUser.getFullName(), cUser.getProfileImageUrl()));
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
            return new ConfigurationWithOwnerDTO(
                dc, uid,
                owner != null ? owner.getFullName() : null,
                owner != null ? owner.getProfileImageUrl() : null,
                collaborators
            );
        }).collect(Collectors.toList());
    }

    // Get IDs of shared configs updated since a given timestamp (for update badge)
    public List<Long> getSharedUpdatedSince(LocalDateTime since) {
        List<DealConduit> updated = dealConduitRepository.findSharedUpdatedSince(since);
        return updated.stream().map(DealConduit::getId).collect(Collectors.toList());
    }

    // Get config by ID (for any authenticated user — collaboration)
    public Optional<DealConduit> getConduitById(Long id) {
        return dealConduitRepository.findById(id);
    }

    // Get user's default config
    public Optional<DealConduit> getDefaultConfiguration(String username) {
        User user = userService.findByUsername(username);
        return dealConduitRepository.findUserDefault(user.getId());
    }

    // Save new user config
    @Transactional
    public DealConduit saveConfiguration(String username, DealConduit conduit) {
        User user = userService.findByUsername(username);
        conduit.setIsPreset(false);
        ensureBackReferences(conduit);
        // Set user ownership in portal settings
        if (conduit.getPortalSettings() == null) {
            conduit.setPortalSettings(new InputInvPortalSettings());
        }
        conduit.getPortalSettings().setUserId(user.getId());
        // Handle default flag
        if (conduit.getPortalSettings().getIsDefault() != null && conduit.getPortalSettings().getIsDefault()) {
            clearUserDefaults(user.getId());
        }
        return dealConduitRepository.save(conduit);
    }

    // Update existing config
    @Transactional
    public DealConduit updateConfiguration(String username, Long id, DealConduit incoming) {
        User user = userService.findByUsername(username);
        boolean isHDCUser = user.getUsername() != null && user.getUsername().toLowerCase().endsWith("@housingdiversity.com");

        DealConduit existing = dealConduitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Configuration not found"));

        // Authorization: HDC users can edit any config; others can edit their own or shared configs
        if (!isHDCUser) {
            boolean isOwner = existing.getPortalSettings() != null && user.getId().equals(existing.getPortalSettings().getUserId());
            boolean isShared = existing.getPortalSettings() != null && Boolean.TRUE.equals(existing.getPortalSettings().getIsShared());
            if (!isOwner && !isShared) {
                throw new RuntimeException("Configuration not found or unauthorized");
            }
        }

        // Preserve child entity IDs so JPA merges instead of re-creating
        preserveChildIds(existing, incoming);
        incoming.setId(existing.getId());
        incoming.setIsPreset(false);
        // Ensure portal settings exists (Jackson @JsonUnwrapped may not create it)
        if (incoming.getPortalSettings() == null) {
            incoming.setPortalSettings(new InputInvPortalSettings());
        }
        ensureBackReferences(incoming);

        Long originalOwnerId = existing.getPortalSettings() != null ? existing.getPortalSettings().getUserId() : user.getId();
        incoming.getPortalSettings().setUserId(originalOwnerId);

        // Track collaborator: if the editor is not the original owner, add them
        if (!user.getId().equals(originalOwnerId)) {
            String existingCollabs = existing.getPortalSettings() != null
                ? existing.getPortalSettings().getCollaboratorIds() : null;
            Set<String> collabSet = new LinkedHashSet<>();
            if (existingCollabs != null && !existingCollabs.isBlank()) {
                Arrays.stream(existingCollabs.split(",")).map(String::trim)
                    .filter(s -> !s.isEmpty()).forEach(collabSet::add);
            }
            collabSet.add(String.valueOf(user.getId()));
            incoming.getPortalSettings().setCollaboratorIds(String.join(",", collabSet));
        } else {
            // Preserve existing collaborator list
            incoming.getPortalSettings().setCollaboratorIds(
                existing.getPortalSettings() != null ? existing.getPortalSettings().getCollaboratorIds() : null
            );
        }

        // Handle default flag
        if (incoming.getPortalSettings().getIsDefault() != null && incoming.getPortalSettings().getIsDefault()) {
            clearUserDefaults(user.getId());
        }

        return dealConduitRepository.save(incoming);
    }

    // Delete config
    @Transactional
    public void deleteConfiguration(String username, Long id) {
        User user = userService.findByUsername(username);
        boolean isHDCUser = user.getUsername() != null && user.getUsername().toLowerCase().endsWith("@housingdiversity.com");

        if (isHDCUser) {
            dealConduitRepository.deleteById(id);
        } else {
            DealConduit existing = dealConduitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Configuration not found"));
            if (existing.getPortalSettings() == null || !user.getId().equals(existing.getPortalSettings().getUserId())) {
                throw new RuntimeException("Unauthorized");
            }
            dealConduitRepository.deleteById(id);
        }
    }

    // Set a config as user's default
    @Transactional
    public void setAsDefault(String username, Long id) {
        User user = userService.findByUsername(username);
        DealConduit conduit = dealConduitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Configuration not found"));
        if (conduit.getPortalSettings() == null || !user.getId().equals(conduit.getPortalSettings().getUserId())) {
            throw new RuntimeException("Configuration not found or unauthorized");
        }
        clearUserDefaults(user.getId());
        conduit.getPortalSettings().setIsDefault(true);
        dealConduitRepository.save(conduit);
    }

    // === Presets ===

    public List<DealConduit> getActivePresets() {
        return dealConduitRepository.findActivePresets();
    }

    public List<DealConduit> getAllPresets() {
        return dealConduitRepository.findByIsPresetTrueOrderByCreatedAtDesc();
    }

    public List<DealConduit> getPresetsByCategory(String category) {
        return dealConduitRepository.findActivePresetsByCategory(category);
    }

    @Transactional
    public DealConduit savePreset(DealConduit conduit) {
        conduit.setIsPreset(true);
        ensureBackReferences(conduit);
        return dealConduitRepository.save(conduit);
    }

    @Transactional
    public DealConduit updatePreset(Long id, DealConduit incoming) {
        DealConduit existing = dealConduitRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Preset not found"));
        preserveChildIds(existing, incoming);
        incoming.setId(existing.getId());
        incoming.setIsPreset(true);
        ensureBackReferences(incoming);
        return dealConduitRepository.save(incoming);
    }

    @Transactional
    public void deletePreset(Long id) {
        dealConduitRepository.deleteById(id);
    }

    // === Helpers ===

    // Ensure all child entities have their dealConduit back-reference set
    private void ensureBackReferences(DealConduit conduit) {
        // Re-invoke setters to trigger bidirectional wiring
        if (conduit.getProjectDefinition() != null) conduit.setProjectDefinition(conduit.getProjectDefinition());
        if (conduit.getCapitalStructure() != null) conduit.setCapitalStructure(conduit.getCapitalStructure());
        if (conduit.getTaxCredits() != null) conduit.setTaxCredits(conduit.getTaxCredits());
        if (conduit.getOpportunityZone() != null) conduit.setOpportunityZone(conduit.getOpportunityZone());
        if (conduit.getInvestorProfile() != null) conduit.setInvestorProfile(conduit.getInvestorProfile());
        if (conduit.getProjections() != null) conduit.setProjections(conduit.getProjections());
        if (conduit.getHdcIncome() != null) conduit.setHdcIncome(conduit.getHdcIncome());
        if (conduit.getPortalSettings() != null) conduit.setPortalSettings(conduit.getPortalSettings());
    }

    // Copy existing child entity IDs to incoming so JPA does merge (update) instead of insert
    private void preserveChildIds(DealConduit existing, DealConduit incoming) {
        if (existing.getProjectDefinition() != null && incoming.getProjectDefinition() != null)
            incoming.getProjectDefinition().setId(existing.getProjectDefinition().getId());
        if (existing.getCapitalStructure() != null && incoming.getCapitalStructure() != null)
            incoming.getCapitalStructure().setId(existing.getCapitalStructure().getId());
        if (existing.getTaxCredits() != null && incoming.getTaxCredits() != null)
            incoming.getTaxCredits().setId(existing.getTaxCredits().getId());
        if (existing.getOpportunityZone() != null && incoming.getOpportunityZone() != null)
            incoming.getOpportunityZone().setId(existing.getOpportunityZone().getId());
        if (existing.getInvestorProfile() != null && incoming.getInvestorProfile() != null)
            incoming.getInvestorProfile().setId(existing.getInvestorProfile().getId());
        if (existing.getProjections() != null && incoming.getProjections() != null)
            incoming.getProjections().setId(existing.getProjections().getId());
        if (existing.getHdcIncome() != null && incoming.getHdcIncome() != null)
            incoming.getHdcIncome().setId(existing.getHdcIncome().getId());
        if (existing.getPortalSettings() != null && incoming.getPortalSettings() != null)
            incoming.getPortalSettings().setId(existing.getPortalSettings().getId());
    }

    private void clearUserDefaults(Long userId) {
        List<DealConduit> configs = dealConduitRepository.findUserConfigurations(userId);
        for (DealConduit config : configs) {
            if (config.getPortalSettings() != null &&
                config.getPortalSettings().getIsDefault() != null &&
                config.getPortalSettings().getIsDefault()) {
                config.getPortalSettings().setIsDefault(false);
                dealConduitRepository.save(config);
            }
        }
    }
}
