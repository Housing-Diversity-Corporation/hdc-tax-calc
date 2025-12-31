package com.hdc.hdc_map_backend.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class QueryTemplate {
    private Integer id;
    private String templateText;
    private List<MapAction> actionSequence;
    private List<String> requiredLayers;
    private List<String> optionalLayers;
    private Map<String, Object> parameterSlots;
    private Integer usageCount;
    private Double successRate;
    private Integer createdBy;
    private Boolean isPublic;
    private List<String> tags;

    // Legacy fields for backward compatibility
    private String name;
    private String template;

    public String getName() {
        return name != null ? name : templateText;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTemplate() {
        return template != null ? template : templateText;
    }

    public void setTemplate(String template) {
        this.template = template;
    }
}
