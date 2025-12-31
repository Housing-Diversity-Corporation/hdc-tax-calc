package com.hdc.hdc_map_backend.model;

import lombok.Data;

import java.util.List;

@Data
public class LLMResponse {
    private List<MapAction> actions;
    private String explanation;
    private float confidence;
    private List<String> suggestedFollowUps;
    private long executionTimeMs;
    private Integer interactionId;
}
