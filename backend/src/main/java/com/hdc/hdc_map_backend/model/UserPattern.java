package com.hdc.hdc_map_backend.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class UserPattern {
    private Integer id;
    private Integer userId;
    private String patternType;
    private Map<String, Object> patternData;
    private Integer frequency;
    private LocalDateTime lastUsed;
    private Double confidenceScore;

    // Legacy method for backward compatibility
    public String getPatternDataAsString() {
        return patternData != null ? patternData.toString() : null;
    }
}
