package com.hdc.hdc_map_backend.model;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class RAGContext {
    private Object cachedResponse;
    private UserContext userContext;
    private List<SimilarInteraction> userInteractions;
    private List<LayerMetadata> relevantLayers;
    private List<ConversationTurn> conversationHistory;
    private List<UserPattern> userPatterns;
    private LocationContext locationContext;
    private List<QueryTemplate> templates;
    private String contextString;
    private Map<String, Object> currentMapState;
}
