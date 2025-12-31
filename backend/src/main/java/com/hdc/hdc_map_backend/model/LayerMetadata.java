package com.hdc.hdc_map_backend.model;

import lombok.Data;

import java.util.List;

@Data
public class LayerMetadata {
    private String layerId;
    private String displayName;
    private String description;
    private String zoomConstraints;
    private String availableFilters;
    private List<String> commonQueries;
}
