package com.hdc.hdc_map_backend.model;

import lombok.Data;

import java.util.Map;

@Data
public class LocationContext {
    private Map<String, Object> identifiedLocation;
    private Double currentZoom;
    private Map<String, Object> bounds;
}
