package com.hdc.hdc_map_backend.dto.taxBenefits;

import com.hdc.hdc_map_backend.entity.taxBenefits.DealConduit;

import java.util.ArrayList;
import java.util.List;

/**
 * Wraps a DealConduit with its owner's + collaborators' profile info for the PresetSelector UI.
 */
public class ConfigurationWithOwnerDTO {

    private DealConduit configuration;
    private Long ownerUserId;
    private String ownerFullName;
    private String ownerProfileImageUrl;
    private List<CollaboratorInfo> collaborators;

    public ConfigurationWithOwnerDTO() {}

    public ConfigurationWithOwnerDTO(DealConduit configuration, Long ownerUserId,
                                      String ownerFullName, String ownerProfileImageUrl) {
        this(configuration, ownerUserId, ownerFullName, ownerProfileImageUrl, new ArrayList<>());
    }

    public ConfigurationWithOwnerDTO(DealConduit configuration, Long ownerUserId,
                                      String ownerFullName, String ownerProfileImageUrl,
                                      List<CollaboratorInfo> collaborators) {
        this.configuration = configuration;
        this.ownerUserId = ownerUserId;
        this.ownerFullName = ownerFullName;
        this.ownerProfileImageUrl = ownerProfileImageUrl;
        this.collaborators = collaborators;
    }

    public DealConduit getConfiguration() {
        return configuration;
    }

    public void setConfiguration(DealConduit configuration) {
        this.configuration = configuration;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public void setOwnerUserId(Long ownerUserId) {
        this.ownerUserId = ownerUserId;
    }

    public String getOwnerFullName() {
        return ownerFullName;
    }

    public void setOwnerFullName(String ownerFullName) {
        this.ownerFullName = ownerFullName;
    }

    public String getOwnerProfileImageUrl() {
        return ownerProfileImageUrl;
    }

    public void setOwnerProfileImageUrl(String ownerProfileImageUrl) {
        this.ownerProfileImageUrl = ownerProfileImageUrl;
    }

    public List<CollaboratorInfo> getCollaborators() {
        return collaborators;
    }

    public void setCollaborators(List<CollaboratorInfo> collaborators) {
        this.collaborators = collaborators;
    }

    /**
     * Profile info for a single collaborator (someone who edited a config they don't own).
     */
    public static class CollaboratorInfo {
        private Long userId;
        private String fullName;
        private String profileImageUrl;

        public CollaboratorInfo() {}

        public CollaboratorInfo(Long userId, String fullName, String profileImageUrl) {
            this.userId = userId;
            this.fullName = fullName;
            this.profileImageUrl = profileImageUrl;
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getProfileImageUrl() { return profileImageUrl; }
        public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    }
}
