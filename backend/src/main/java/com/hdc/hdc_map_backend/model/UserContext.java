package com.hdc.hdc_map_backend.model;

import lombok.Data;

import java.util.List;

@Data
public class UserContext {
    private String expertiseLevel;
    private String industryContext;
    private String interactionStyle;
    private int totalInteractions;
    private List<String> preferredLayers;
    private String customTerminology;
}
