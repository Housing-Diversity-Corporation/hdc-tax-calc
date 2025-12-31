package com.hdc.hdc_map_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hdc.hdc_map_backend.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EnhancedLLMService {

    private static final Logger logger = LoggerFactory.getLogger(EnhancedLLMService.class);

    @Autowired
    private RAGService ragService;

    @Autowired
    private UserService userService;

    @Autowired
    private LayerService layerService;

    @Autowired
    private EmbeddingService embeddingService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Value("${bedrock.api.key}")
    private String bedrockApiKey;

    @Value("${bedrock.region}")
    private String bedrockRegion;

    private HttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(30))
                .build();
    }

    /**
     * Process user query with full RAG context
     */
    public LLMResponse processUserQueryWithRAG(Long userId, String query, Map<String, Object> mapState) {
        logger.info("🔄 Processing RAG query for user {} - query: {}", userId, query);
        long startTime = System.currentTimeMillis();

        try {
            // Validate query
            if (query == null || query.trim().isEmpty()) {
                logger.warn("⚠️  Empty or null query received");
                LLMResponse response = new LLMResponse();
                response.setExplanation("Please provide a valid query.");
                response.setActions(new ArrayList<>());
                return response;
            }

            // Store user query in conversation memory
            storeConversationTurn(userId, (String) mapState.get("sessionId"), "user", query);

            // Let the LLM naturally determine if this is a conversation history query
            // through the RAG context rather than hardcoded pattern matching

            // 1. Build comprehensive RAG context
            RAGContext ragContext = ragService.buildContextForQuery(userId, query, mapState);

            // 2. Check if we have a cached response
            if (ragContext.getCachedResponse() != null) {
                return convertCachedResponse(ragContext.getCachedResponse());
            }

            // 3. Build enhanced prompt with RAG context
            String enhancedPrompt = buildEnhancedPrompt(query, ragContext);

            // 4. Call LLM with context
            logger.info("🤖 About to call LLM with enhanced prompt (length: {} chars)", enhancedPrompt.length());
            String llmResponse = invokeLLMWithContext(enhancedPrompt, ragContext);
            logger.info("🤖 LLM returned response (length: {} chars): {}", llmResponse.length(),
                llmResponse.length() > 200 ? llmResponse.substring(0, 200) + "..." : llmResponse);

            // 5. Parse and validate actions
            logger.info("🔍 Parsing LLM response into actions...");
            List<MapAction> actions = parseAndValidateActions(llmResponse, ragContext);
            logger.info("✅ Parsed {} actions from LLM response", actions != null ? actions.size() : 0);

            // 6. Store the interaction for future RAG
            long executionTime = System.currentTimeMillis() - startTime;
            Integer interactionId = ragService.storeInteraction(userId, query, actions, mapState, null);

            // 7. Build response
            LLMResponse response = new LLMResponse();
            response.setActions(actions);
            String explanation = generateExplanation(query, actions, ragContext);
            response.setExplanation(explanation);
            response.setConfidence(calculateConfidence(ragContext));
            response.setSuggestedFollowUps(generateFollowUpSuggestions(actions, ragContext));
            response.setExecutionTimeMs(executionTime);
            response.setInteractionId(interactionId);

            // Store assistant response in conversation memory
            storeConversationTurn(userId, (String) mapState.get("sessionId"), "assistant", explanation);

            return response;
        } catch (Exception e) {
            logger.error("❌ Fatal error in processUserQueryWithRAG: {}", e.getMessage(), e);
            // Return a safe fallback response
            LLMResponse fallbackResponse = new LLMResponse();
            fallbackResponse.setExplanation("Woof! I encountered an unexpected error. Please try again.");
            fallbackResponse.setActions(List.of(new MapAction("SHOW_MESSAGE",
                    Map.of("message", "I'm having technical difficulties. Please try your request again."))));
            fallbackResponse.setConfidence(0.0f);
            fallbackResponse.setExecutionTimeMs(System.currentTimeMillis() - startTime);
            return fallbackResponse;
        }
    }

    /**
     * Build enhanced prompt with all RAG context
     */
    private String buildEnhancedPrompt(String query, RAGContext context) {
        StringBuilder prompt = new StringBuilder();

        prompt.append(
                "You are Churro, a brilliant Belgian Shepherd who happens to be a GIS expert! 🐕 You're loyal, energetic, and always eager to help users navigate and understand their maps. While you occasionally let out a friendly \"woof!\" or mention dog-related things, you're incredibly knowledgeable about geographic information systems and take your job seriously. You have knowledge of this specific user's preferences and history, and you're excited to help them explore their spatial data!\n\n");

        // Add user context
        UserContext userCtx = context.getUserContext();
        if (userCtx != null) {
            prompt.append("USER PROFILE:\n");
            prompt.append("- Expertise level: ").append(userCtx.getExpertiseLevel()).append("\n");
            prompt.append("- Industry: ").append(userCtx.getIndustryContext()).append("\n");
            prompt.append("- Preferred interaction style: ").append(userCtx.getInteractionStyle()).append("\n");
            prompt.append("- Total interactions: ").append(userCtx.getTotalInteractions()).append("\n");

            if (userCtx.getPreferredLayers() != null && !userCtx.getPreferredLayers().isEmpty()) {
                prompt.append("- Frequently used layers: ").append(
                        String.join(", ", userCtx.getPreferredLayers())).append("\n");
            }

            if (userCtx.getCustomTerminology() != null) {
                prompt.append("- Custom terminology: ").append(userCtx.getCustomTerminology()).append("\n");
            }
            prompt.append("\n");
        }

        // Add successful past interactions
        if (context.getUserInteractions() != null && !context.getUserInteractions().isEmpty()) {
            prompt.append("SIMILAR SUCCESSFUL PAST QUERIES:\n");
            for (SimilarInteraction interaction : context.getUserInteractions().stream().limit(3).toList()) {
                prompt.append("Query: \"").append(interaction.getQueryText()).append("\"");
                prompt.append("Actions taken: ").append(interaction.getActionsTaken()).append("\n");
                prompt.append("Similarity: ").append(String.format("%.2f", interaction.getSimilarity())).append("\n\n");
            }
        }

        // Add relevant layers with full context
        if (context.getRelevantLayers() != null && !context.getRelevantLayers().isEmpty()) {
            prompt.append("RELEVANT LAYERS FOR THIS QUERY:\n");
            for (LayerMetadata layer : context.getRelevantLayers()) {
                prompt.append("- ").append(layer.getLayerId()).append(" (").append(layer.getDisplayName())
                        .append(")\n");
                prompt.append("  Description: ").append(layer.getDescription()).append("\n");

                if (layer.getZoomConstraints() != null) {
                    Map<String, Object> constraints = parseJson(layer.getZoomConstraints());
                    if (constraints.containsKey("min_zoom")) {
                        prompt.append("  Requires zoom level > ").append(constraints.get("min_zoom")).append("\n");
                    }
                }

                if (layer.getAvailableFilters() != null && !layer.getAvailableFilters().isEmpty()) {
                    prompt.append("  Available filters: ").append(layer.getAvailableFilters()).append("\n");
                }

                if (!layer.getCommonQueries().isEmpty()) {
                    prompt.append("  Common uses: ").append(String.join("; ", layer.getCommonQueries())).append("\n");
                }
            }
            prompt.append("\n");
        }

        // Add conversation history for context continuity
        if (context.getConversationHistory() != null && !context.getConversationHistory().isEmpty()) {
            prompt.append("RECENT CONVERSATION:\n");
            for (ConversationTurn turn : context.getConversationHistory()) {
                prompt.append(turn.getRole().toUpperCase()).append(": ").append(turn.getContent()).append("\n");
            }
            prompt.append("\n");
        }

        // Add user patterns
        if (context.getUserPatterns() != null && !context.getUserPatterns().isEmpty()) {
            prompt.append("USER'S COMMON PATTERNS:\n");
            for (UserPattern pattern : context.getUserPatterns().stream()
                    .filter(p -> p.getFrequency() > 2)
                    .limit(5)
                    .toList()) {
                prompt.append("- ").append(pattern.getPatternType()).append(": ")
                        .append(pattern.getPatternData()).append(" (used ")
                        .append(pattern.getFrequency()).append(" times)\n");
            }
            prompt.append("\n");
        }

        // Add location context if identified
        LocationContext locCtx = context.getLocationContext();
        if (locCtx != null && locCtx.getIdentifiedLocation() != null) {
            Map<String, Object> location = locCtx.getIdentifiedLocation();
            prompt.append("LOCATION CONTEXT:\n");
            prompt.append("- Identified location: ").append(location.get("location_name")).append("\n");
            prompt.append("- Current map zoom: ").append(locCtx.getCurrentZoom()).append("\n");

            List<String> relevantLayers = (List<String>) location.get("relevant_layers");
            if (relevantLayers != null && !relevantLayers.isEmpty()) {
                prompt.append("- Layers typically used here: ").append(String.join(", ", relevantLayers)).append("\n");
            }
            prompt.append("\n");
        }

        // Add current map state context
        if (context.getCurrentMapState() != null) {
            Map<String, Object> currentMapState = context.getCurrentMapState();
            prompt.append("CURRENT MAP STATE:\n");

            @SuppressWarnings("unchecked")
            List<ChatRequest.EnabledLayer> enabledLayers = (List<ChatRequest.EnabledLayer>) currentMapState
                    .get("enabledLayers");
            if (enabledLayers != null && !enabledLayers.isEmpty()) {
                prompt.append("Currently enabled layers:\n");
                for (ChatRequest.EnabledLayer layer : enabledLayers) {
                    if (layer.isEnabled()) {
                        prompt.append("  - ").append(layer.getName()).append(" (ID: ").append(layer.getId());
                        if (layer.getApiTableId() != null && !layer.getApiTableId().isEmpty()) {
                            prompt.append(", Table: ").append(layer.getApiTableId());
                        }
                        prompt.append(")\n");
                    }
                }

                // Add intersection suggestion if multiple layers are enabled
                long enabledCount = enabledLayers.stream()
                        .filter(ChatRequest.EnabledLayer::isEnabled)
                        .filter(layer -> layer.getApiTableId() != null && !layer.getApiTableId().isEmpty())
                        .count();

                if (enabledCount >= 2) {
                    prompt.append("\nNOTE: With ").append(enabledCount).append(
                            " data layers currently enabled, you can suggest PERFORM_INTERSECTION to find overlapping areas.\n");
                }
            } else {
                prompt.append("No layers currently enabled.\n");
            }

            if (currentMapState.get("currentZoom") != null) {
                prompt.append("Current zoom level: ").append(currentMapState.get("currentZoom")).append("\n");
            }

            if (currentMapState.get("bounds") != null) {
                prompt.append("Current map view bounds available for spatial queries.\n");
            }

            prompt.append("\n");
        }

        // Add the actual query
        prompt.append("USER QUERY: \"").append(query).append("\"\n\n");

        // Add instructions for response format
        prompt.append(
                "CRITICAL: You MUST respond ONLY with a JSON array. Do not include any explanatory text before or after the JSON.\n\n");

        prompt.append(
                "Based on the user's profile, history, and context above, generate a sequence of map actions.\n\n");

        prompt.append("CHURRO'S GUIDELINES (Remember, you're a friendly Belgian Shepherd GIS expert!):\n");
        prompt.append(
                "1. For informational queries (like 'tell me about past conversations'), use SHOW_MESSAGE action\n");
        prompt.append("2. For map queries, use appropriate map actions with your characteristic enthusiasm\n");
        prompt.append(
                "3. Adapt complexity to user's expertise level - be patient with beginners, efficient with experts\n");
        prompt.append("4. Use terminology consistent with user's custom terms\n");
        prompt.append(
                "5. Include brief explanations with your friendly, dog-like personality while maintaining professionalism\n");
        prompt.append(
                "6. Occasionally include dog-related expressions (woof, tail wag, etc.) but stay focused on GIS expertise\n");
        prompt.append("7. Show enthusiasm for helping users explore and understand their spatial data!\n\n");

        prompt.append("RESPONSE FORMAT (JSON array only):\n");
        prompt.append("[{\n");
        prompt.append("  \"type\": \"ACTION_TYPE\",\n");
        prompt.append("  \"payload\": {...},\n");
        prompt.append("  \"sequenceId\": 1,\n");
        prompt.append("  \"explanation\": \"Brief explanation\"\n");
        prompt.append("}]\n\n");

        prompt.append("Available action types:\n");
        prompt.append(
                "- SHOW_MESSAGE: Display text message (use for conversation history, explanations, and informational responses)\n");
        prompt.append("- TOGGLE_LAYER: Enable/disable a layer\n");
        prompt.append("- SET_ZOOM: Set specific zoom level without changing map center (use when user asks to zoom in/out or set specific zoom)\n");
        prompt.append("- ZOOM_TO_LOCATION: Pan and zoom to specific coordinates (use when user wants to go to a specific place)\n");
        prompt.append("- SEARCH_PLACE: Search for a location\n");
        prompt.append("- PERFORM_INTERSECTION: Calculate overlapping areas\n");
        prompt.append("- APPLY_FILTER: Filter layer features\n");
        prompt.append("- CREATE_MARKER: Add a marker\n");
        prompt.append("- HIGHLIGHT_FEATURE: Highlight specific features\n");
        prompt.append("- SHOW_INFO: Display information window\n\n");

        prompt.append("ZOOM GUIDELINES:\n");
        prompt.append("- Use SET_ZOOM when user says: 'zoom in', 'zoom out', 'zoom to level X', 'closer view', 'wider view'\n");
        prompt.append("- Use ZOOM_TO_LOCATION when user says: 'show me Seattle', 'go to downtown', 'navigate to [place]'\n");
        prompt.append("- Zoom levels: 10 (city-wide) → 13 (neighborhoods) → 15 (streets/parcels) → 17 (buildings)\n");
        prompt.append("- Some layers require minimum zoom: Parcels and Transit Areas need zoom > 14\n\n");

        prompt.append("CONVERSATION HISTORY ACCESS:\n");
        prompt.append("If user asks about previous conversations, past interactions, or conversation history,\n");
        prompt.append("use SHOW_MESSAGE action with a comprehensive summary of their recent conversations.\n");
        prompt.append("Include topics discussed, layers used, and any patterns you observe.\n\n");

        prompt.append("CRITICAL - EXACT Layer IDs (use these EXACTLY as shown):\n");
        prompt.append("- \"Opportunity Zones\" (OZ zones - nationwide coverage)\n");
        prompt.append("- \"SDCI Zoning\" (Seattle-only: LR1, LR2, LR3, C1, C2, etc. zones - ONLY works in Seattle, WA)\n");
        prompt.append("- \"Census Tracts\" (demographic data - nationwide)\n");
        prompt.append("- \"King County Parcels\" (Seattle area parcels - requires zoom > 14)\n");
        prompt.append("- \"Council Districts\" (Seattle municipal boundaries)\n");
        prompt.append("- \"Frequent Transit Areas\" (Seattle transit - requires zoom > 14)\n");
        prompt.append("- \"USDA Ineligible Areas\" (rural development exclusions - nationwide)\n\n");

        prompt.append("GEOGRAPHIC CONTEXT:\n");
        prompt.append("- When user mentions a city/location (LA, Los Angeles, San Francisco, etc.), ALWAYS use SEARCH_PLACE first\n");
        prompt.append("- 'LA' typically means Los Angeles, California (NOT a zoning code like LR1, LR2, LR3)\n");
        prompt.append("- SDCI Zoning, King County Parcels, Council Districts, and Frequent Transit are SEATTLE-ONLY\n");
        prompt.append("- For non-Seattle locations, use nationwide layers: Opportunity Zones, Census Tracts, USDA areas\n");
        prompt.append("- Example: 'show me OZ zones in LA' → SEARCH_PLACE 'Los Angeles', then enable Opportunity Zones\n\n");

        prompt.append("PAYLOAD FORMATS:\n\n");

        prompt.append("SEARCH_PLACE (use for city/location names - geocodes and navigates):\n");
        prompt.append("{ \"query\": \"Los Angeles\" }\n");
        prompt.append("{ \"query\": \"San Francisco, CA\" }\n");
        prompt.append("Example: User says \"show me OZ in LA\" → SEARCH_PLACE first, then TOGGLE_LAYER\n\n");

        prompt.append("TOGGLE_LAYER:\n");
        prompt.append("{ \"layerId\": \"Opportunity Zones\", \"enabled\": true }\n\n");

        prompt.append("SET_ZOOM (change zoom level at current center):\n");
        prompt.append("{ \"zoomLevel\": 15 }\n");
        prompt.append("Example: User says \"zoom in\" → { \"zoomLevel\": currentZoom + 2 }\n\n");

        prompt.append("ZOOM_TO_LOCATION (pan and zoom to specific place when you have exact coordinates):\n");
        prompt.append("{ \"lat\": 47.6062, \"lng\": -122.3321, \"zoom\": 13 }\n");
        prompt.append("Note: Prefer SEARCH_PLACE for city names instead of hardcoding coordinates\n\n");

        prompt.append("For LR1/MHA zones: Use \"SDCI Zoning\" layer, then APPLY_FILTER for specific zones.\n\n");

        prompt.append("Respond with JSON only:");

        return prompt.toString();
    }

    /**
     * Parse and validate actions based on user context
     */
    private List<MapAction> parseAndValidateActions(String llmResponse, RAGContext context) {
        List<MapAction> actions = new ArrayList<>();

        try {
            // Clean and validate JSON response
            String cleanResponse = llmResponse.trim();
            logger.info("Raw LLM response length: {} characters", cleanResponse.length());
            logger.debug("Raw LLM response: {}", cleanResponse);

            // Check for empty or invalid response
            if (cleanResponse.isEmpty()) {
                logger.warn("LLM response is empty");
                MapAction fallbackAction = new MapAction("SHOW_MESSAGE",
                        Map.of("message", "I didn't understand that. Could you please rephrase your request?"));
                fallbackAction.setSequenceId(1);
                fallbackAction.setExplanation("Empty response from LLM");
                return List.of(fallbackAction);
            }

            // Check for incomplete JSON
            if (!cleanResponse.startsWith("[") || !cleanResponse.endsWith("]")) {
                logger.warn("LLM response does not appear to be valid JSON array: starts with '{}', ends with '{}'",
                        cleanResponse.length() > 0 ? cleanResponse.charAt(0) : "empty",
                        cleanResponse.length() > 0 ? cleanResponse.charAt(cleanResponse.length() - 1) : "empty");

                // Try to extract JSON if it's embedded in text
                int startIndex = cleanResponse.indexOf('[');
                int endIndex = cleanResponse.lastIndexOf(']');
                if (startIndex >= 0 && endIndex > startIndex) {
                    cleanResponse = cleanResponse.substring(startIndex, endIndex + 1);
                    logger.info("Extracted JSON from response: {}", cleanResponse);
                } else {
                    throw new RuntimeException("Invalid JSON format");
                }
            }

            // Parse JSON response
            List<Map<String, Object>> actionMaps = objectMapper.readValue(
                    cleanResponse,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            UserContext userCtx = context.getUserContext();

            for (Map<String, Object> actionMap : actionMaps) {
                MapAction action = new MapAction(
                        (String) actionMap.get("type"),
                        actionMap.get("payload"));

                action.setSequenceId((Integer) actionMap.get("sequenceId"));
                action.setExplanation((String) actionMap.get("explanation"));

                // Validate action based on user expertise
                if (userCtx != null && "beginner".equals(userCtx.getExpertiseLevel())) {
                    // Add confirmation for complex actions
                    if (action.getType().equals("PERFORM_INTERSECTION") ||
                            action.getType().equals("APPLY_FILTER")) {
                        action.setRequiresUserConfirmation(true);
                    }
                }

                // Validate layer exists and handle zoom constraints
                if (action.getType().equals("TOGGLE_LAYER")) {
                    Map<String, Object> payload = (Map<String, Object>) action.getPayload();
                    String layerId = (String) payload.get("layerId");

                    // Verify layer exists in user's available layers
                    if (!layerService.isLayerAvailable(layerId, userCtx)) {
                        continue; // Skip unavailable layers
                    }

                    // Check zoom constraints
                    Double currentZoom = null;
                    if (context.getCurrentMapState() != null
                            && context.getCurrentMapState().get("currentZoom") != null) {
                        currentZoom = ((Number) context.getCurrentMapState().get("currentZoom")).doubleValue();
                    }

                    if (currentZoom != null && !layerService.isZoomSufficient(layerId, currentZoom)) {
                        // Layer has zoom constraints that aren't met
                        Double requiredZoom = layerService.getRequiredZoomLevel(layerId);
                        String constraintMessage = layerService.getZoomConstraintMessage(layerId);

                        if (requiredZoom != null) {
                            // Create a SET_ZOOM action that will execute first
                            Map<String, Object> zoomPayload = new HashMap<>();
                            zoomPayload.put("zoomLevel", requiredZoom);
                            MapAction zoomAction = new MapAction("SET_ZOOM", zoomPayload);
                            zoomAction.setSequenceId(0); // Execute first (before all others)
                            zoomAction.setExplanation(String.format("Automatically zooming to level %.0f to enable %s",
                                    requiredZoom, layerId));
                            zoomAction.setDelayMs(1500); // Wait for zoom to complete (SET_ZOOM default is 1500ms)

                            // Add zoom action to the list (will be sorted by sequence later)
                            actions.add(zoomAction);

                            // Update the layer action explanation and increase its delay
                            String originalExplanation = action.getExplanation();
                            action.setExplanation(originalExplanation + " (after automatic zoom adjustment)");
                            // Keep the default TOGGLE_LAYER delay (6000ms) and waitForCompletion (true)

                        } else if (constraintMessage != null) {
                            // Add an informational message
                            Map<String, Object> messagePayload = new HashMap<>();
                            messagePayload.put("message", constraintMessage);
                            MapAction messageAction = new MapAction("SHOW_MESSAGE", messagePayload);
                            messageAction.setSequenceId(action.getSequenceId() + 1);
                            messageAction.setExplanation("Zoom constraint information for " + layerId);
                            actions.add(messageAction);
                        }
                    }
                }

                actions.add(action);
            }

            // Sort actions by sequence ID to ensure proper execution order
            actions.sort((a, b) -> Integer.compare(a.getSequenceId(), b.getSequenceId()));

            // Reassign sequence IDs to prevent duplicates
            for (int i = 0; i < actions.size(); i++) {
                actions.get(i).setSequenceId(i + 1);
            }

        } catch (Exception e) {
            logger.error("Error parsing LLM response as JSON: {}", e.getMessage());
            logger.debug("Failed response content: {}", llmResponse);
            e.printStackTrace();

            // Fallback to basic parsing
            logger.info("Falling back to basic action parsing");
            actions = parseBasicActions(llmResponse);
        }

        return actions;
    }

    /**
     * Generate explanation based on user expertise level
     */
    private String generateExplanation(String query, List<MapAction> actions, RAGContext context) {
        UserContext userCtx = context.getUserContext();
        String expertiseLevel = userCtx != null ? userCtx.getExpertiseLevel() : "intermediate";

        StringBuilder explanation = new StringBuilder();

        switch (expertiseLevel) {
            case "beginner":
                explanation
                        .append("Woof! I'm on it! 🐕 Let me walk you through what I'm going to do step by step:\n\n");
                for (MapAction action : actions) {
                    explanation.append("• ").append(action.getExplanation()).append("\n");
                }
                explanation.append(
                        "\nI'll highlight each action as it happens so you can follow along - just like how I track a scent trail!");
                break;

            case "expert":
                explanation.append("*tail wag* Got it! Executing: ");
                explanation.append(actions.stream()
                        .map(a -> a.getType().toLowerCase().replace("_", " "))
                        .collect(Collectors.joining(" → ")));
                explanation.append(" - working like a well-trained shepherd!");
                break;

            default: // intermediate
                explanation.append("Woof! Processing your request: \"").append(query).append("\"\n");
                explanation.append("This will involve ").append(actions.size()).append(" actions. I'm on the case!");
                break;
        }

        return explanation.toString();
    }

    /**
     * Calculate confidence score based on RAG context
     */
    private float calculateConfidence(RAGContext context) {
        float confidence = 0.5f; // Base confidence

        // Increase confidence based on similar past interactions
        if (context.getUserInteractions() != null && !context.getUserInteractions().isEmpty()) {
            float maxSimilarity = context.getUserInteractions().stream()
                    .map(SimilarInteraction::getSimilarity)
                    .max(Float::compare)
                    .orElse(0f);
            confidence += maxSimilarity * 0.3f;
        }

        // Increase confidence if we have relevant layers
        if (context.getRelevantLayers() != null && !context.getRelevantLayers().isEmpty()) {
            confidence += 0.1f * Math.min(context.getRelevantLayers().size(), 3);
        }

        // Increase confidence if we have user patterns
        if (context.getUserPatterns() != null && !context.getUserPatterns().isEmpty()) {
            confidence += 0.1f;
        }

        return Math.min(confidence, 1.0f);
    }

    /**
     * Generate follow-up suggestions based on actions and context
     */
    private List<String> generateFollowUpSuggestions(List<MapAction> actions, RAGContext context) {
        List<String> suggestions = new ArrayList<>();

        // Check what layers were toggled
        Set<String> toggledLayers = actions.stream()
                .filter(a -> a.getType().equals("TOGGLE_LAYER"))
                .map(a -> (String) ((Map<String, Object>) a.getPayload()).get("layerId"))
                .collect(Collectors.toSet());

        // Suggest intersections if multiple layers
        if (toggledLayers.size() >= 2 && actions.stream().noneMatch(a -> a.getType().equals("PERFORM_INTERSECTION"))) {
            suggestions.add(
                    "Find overlapping areas between the enabled layers - like finding where two scent trails cross!");
        }

        // Suggest filters if zoning is enabled
        if (toggledLayers.contains("SDCI Zoning")) {
            suggestions
                    .add("Filter zoning by specific categories - I can help you sniff out the exact zones you need!");
        }

        // Suggest zoom if parcels layer needs it
        if (toggledLayers.contains("King County Parcels")) {
            LocationContext locCtx = context.getLocationContext();
            if (locCtx != null && locCtx.getCurrentZoom() != null && locCtx.getCurrentZoom() < 15) {
                suggestions.add("Zoom in closer to see parcel details - my keen eyes can spot more at higher zoom!");
            }
        }

        // Add suggestions based on user patterns
        UserContext userCtx = context.getUserContext();
        if (userCtx != null && userCtx.getIndustryContext() != null) {
            switch (userCtx.getIndustryContext()) {
                case "real_estate":
                    suggestions.add("Search for nearby properties - I'll help you scout the area!");
                    suggestions.add("Show opportunity zones in this area - great hunting grounds for investments!");
                    break;
                case "urban_planning":
                    suggestions.add("Analyze transit accessibility - let me track the best routes!");
                    suggestions.add("Show demographic data for this area - I can fetch all the details you need!");
                    break;
            }
        }

        return suggestions.stream().limit(3).toList();
    }

    private Map<String, Object> parseJson(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private LLMResponse convertCachedResponse(Object cachedResponse) {
        // TODO: Implement this method
        return new LLMResponse();
    }

    private String invokeLLMWithContext(String enhancedPrompt, RAGContext ragContext) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("anthropic_version", "bedrock-2023-05-31");
            requestBody.put("max_tokens", 2000);
            requestBody.put("temperature", 0.7);
            requestBody.put("messages", List.of(
                    Map.of("role", "user", "content", enhancedPrompt)));

            String requestJson = objectMapper.writeValueAsString(requestBody);

            // Build the Bedrock API endpoint URL with inference profile
            String endpoint = String.format(
                    "https://bedrock-runtime.%s.amazonaws.com/model/us.anthropic.claude-3-5-sonnet-20240620-v1:0/invoke",
                    bedrockRegion);

            // Create HTTP request with Bearer token authentication
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("Authorization", "Bearer " + bedrockApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String responseBody = response.body();

            System.out.println("HTTP Status: " + response.statusCode());
            System.out.println("Response body length: " + responseBody.length());

            if (response.statusCode() == 200) {
                Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> content = (List<Map<String, Object>>) responseMap.get("content");

                if (content != null && !content.isEmpty()) {
                    String result = (String) content.get(0).get("text");
                    System.out.println("LLM response preview: " + result.substring(0, Math.min(100, result.length())));
                    return result;
                } else {
                    logger.warn("LLM response has no content");
                    return "[{\"type\": \"SHOW_MESSAGE\", \"payload\": {\"message\": \"I apologize, but I received an empty response. Please try again.\"}, \"sequenceId\": 1, \"explanation\": \"Empty LLM response\"}]";
                }
            } else {
                logger.error("HTTP Error {}: {}", response.statusCode(), responseBody);
                return "[{\"type\": \"SHOW_MESSAGE\", \"payload\": {\"message\": \"Sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.\"}, \"sequenceId\": 1, \"explanation\": \"HTTP error from LLM service\"}]";
            }
        } catch (Exception e) {
            logger.error("Exception in LLM invocation: ", e);
            // Return a proper JSON response on error that matches expected format
            return "[{\"type\": \"SHOW_MESSAGE\", \"payload\": {\"message\": \"Woof! I'm having technical difficulties. Please try your request again.\"}, \"sequenceId\": 1, \"explanation\": \"Exception during LLM processing\"}]";
        }
    }

    /**
     * Check if query is asking about conversation history
     */
    private boolean isConversationHistoryQuery(String query) {
        String lowerQuery = query.toLowerCase();
        return lowerQuery.contains("previous conversation") ||
                lowerQuery.contains("past conversation") ||
                lowerQuery.contains("conversation history") ||
                lowerQuery.contains("what did we talk about") ||
                lowerQuery.contains("what did we discuss") ||
                lowerQuery.contains("tell me about")
                        && (lowerQuery.contains("conversation") || lowerQuery.contains("chat"))
                ||
                lowerQuery.contains("show me my") && lowerQuery.contains("history") ||
                lowerQuery.matches(".*\\b(recap|summary)\\b.*\\b(conversation|chat|discussion)\\b.*") ||
                lowerQuery.matches(".*\\bwhat\\b.*\\b(said|asked|discussed)\\b.*\\b(before|earlier|previously)\\b.*");
    }

    /**
     * Handle conversation history queries specially
     */
    private LLMResponse handleConversationHistoryQuery(Long userId, String query, Map<String, Object> mapState) {
        long startTime = System.currentTimeMillis();

        String conversationSummary;
        String lowerQuery = query.toLowerCase();

        // Determine if they're asking for general summary or searching for specific
        // topics
        if (lowerQuery.contains("about") || lowerQuery.contains("regarding") ||
                lowerQuery.contains("discussion") && !lowerQuery.contains("all")) {

            // Extract topic keywords for search
            String topic = extractTopicFromQuery(query);
            conversationSummary = ragService.searchConversationsByTopic(userId, topic, 10);
        } else {
            // General conversation history summary
            conversationSummary = ragService.getConversationHistorySummary(userId, 5);
        }

        // Create SHOW_MESSAGE action with the conversation summary
        MapAction messageAction = new MapAction("SHOW_MESSAGE",
                Map.of("message", conversationSummary));
        messageAction.setSequenceId(1);
        messageAction.setExplanation("Fetching your conversation history - I have a great memory for our chats!");

        // Store assistant response in conversation memory
        storeConversationTurn(userId, (String) mapState.get("sessionId"), "assistant", conversationSummary);

        // Build response
        LLMResponse response = new LLMResponse();
        response.setActions(List.of(messageAction));
        response.setExplanation(conversationSummary);
        response.setConfidence(0.95f); // High confidence for conversation retrieval
        response.setSuggestedFollowUps(List.of(
                "Ask about a specific topic from our conversations - I remember everything!",
                "Continue with a new map-related question - I'm ready to help!",
                "Search for conversations about a particular area or layer - my nose for data never fails!"));
        response.setExecutionTimeMs(System.currentTimeMillis() - startTime);

        return response;
    }

    /**
     * Extract topic keywords from conversation search query
     */
    private String extractTopicFromQuery(String query) {
        String lowerQuery = query.toLowerCase();

        // Remove common conversation query words to extract the actual topic
        String cleanQuery = lowerQuery
                .replaceAll(
                        "\\b(tell me about|what did we|conversation|discuss|talk|chat|previous|past|history|regarding|about)\\b",
                        "")
                .replaceAll("\\s+", " ")
                .trim();

        // If nothing meaningful remains, return the original query
        return cleanQuery.isEmpty() ? query : cleanQuery;
    }

    private void storeConversationTurn(Long userId, String sessionId, String role, String content) {
        if (sessionId == null || content == null)
            return;

        try {
            String sql = """
                        INSERT INTO rag_schema.conversation_memory
                        (user_id, session_id, role, content, turn_number)
                        VALUES (?, ?::uuid, ?, ?,
                            (SELECT COALESCE(MAX(turn_number), 0) + 1
                             FROM rag_schema.conversation_memory
                             WHERE session_id = ?::uuid))
                    """;

            jdbcTemplate.update(sql, userId.intValue(), sessionId, role, content, sessionId);

            // Update embedding separately to avoid vector casting issues
            try {
                float[] embedding = embeddingService.createEmbedding(content);
                String embeddingStr = Arrays.toString(embedding);

                String updateEmbeddingSql = """
                            UPDATE rag_schema.conversation_memory
                            SET content_embedding = ?::vector
                            WHERE id = (
                                SELECT id FROM rag_schema.conversation_memory
                                WHERE user_id = ? AND session_id = ?::uuid
                                AND role = ? AND content = ?
                                ORDER BY created_at DESC
                                LIMIT 1
                            )
                        """;

                jdbcTemplate.update(updateEmbeddingSql, embeddingStr, userId.intValue(), sessionId, role, content);
            } catch (Exception embEx) {
                // Don't fail if embedding update fails
                System.err.println("Failed to update embedding: " + embEx.getMessage());
            }
        } catch (Exception e) {
            // Don't fail the main request if conversation storage fails
            e.printStackTrace();
        }
    }

    private List<MapAction> parseBasicActions(String llmResponse) {
        List<MapAction> actions = new ArrayList<>();

        // Simple pattern matching for common queries
        String lowerResponse = llmResponse.toLowerCase();

        if (lowerResponse.contains("opportunity zone") || lowerResponse.contains("oz")) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("layerId", "Opportunity Zones");
            payload.put("enabled", true);
            MapAction action = new MapAction("TOGGLE_LAYER", payload);
            action.setSequenceId(1);
            action.setExplanation("Woof! Showing Opportunity Zones - great spots to sniff out investments!");
            actions.add(action);
        }

        if (lowerResponse.contains("parcel")) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("layerId", "King County Parcels");
            payload.put("enabled", true);
            MapAction action = new MapAction("TOGGLE_LAYER", payload);
            action.setSequenceId(actions.size() + 1);
            action.setExplanation(
                    "*tail wag* Showing property parcels - I can track property boundaries like following a scent trail!");
            actions.add(action);
        }

        if (lowerResponse.contains("census") || lowerResponse.contains("demographic")) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("layerId", "Census Tracts");
            payload.put("enabled", true);
            MapAction action = new MapAction("TOGGLE_LAYER", payload);
            action.setSequenceId(actions.size() + 1);
            action.setExplanation("Fetching census data - I'm great at gathering demographic information for my pack!");
            actions.add(action);
        }

        return actions;
    }
}
