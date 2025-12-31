package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.service.LLMService;
import com.hdc.hdc_map_backend.service.EnhancedLLMService;
import com.hdc.hdc_map_backend.service.UserService;
import com.hdc.hdc_map_backend.model.ChatRequest;
import com.hdc.hdc_map_backend.model.LLMResponse;
import com.hdc.hdc_map_backend.model.MapAction;
import com.hdc.hdc_map_backend.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import reactor.core.publisher.Flux;
import org.springframework.http.codec.ServerSentEvent;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private LLMService llmService;

    @Autowired
    private EnhancedLLMService enhancedLLMService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.hdc.hdc_map_backend.service.EmbeddingService embeddingService;

    @Autowired
    private UserService userService;

    @Autowired
    private com.hdc.hdc_map_backend.service.ActionQueueService actionQueueService;

    @Autowired
    private com.hdc.hdc_map_backend.service.FeedbackService feedbackService;

    @Autowired
    private com.hdc.hdc_map_backend.service.RAGService ragService;

    /**
     * Stream map actions to the frontend with real-time updates
     */
    @PostMapping(value = "/stream-actions", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<MapAction>> streamActions(@RequestBody ChatRequest request) {
        // Parse user intent and generate actions
        List<MapAction> actions = llmService.processUserQuery(request.getMessage());

        // Stream actions with delays for visual effect
        return Flux.fromIterable(actions)
                .delayElements(Duration.ofMillis(500)) // Delay between actions
                .map(action -> ServerSentEvent.<MapAction>builder()
                        .id(String.valueOf(action.getSequenceId()))
                        .event("map-action")
                        .data(action)
                        .build())
                .concatWith(
                        Flux.just(ServerSentEvent.<MapAction>builder()
                                .event("complete")
                                .data(new MapAction("COMPLETE", null))
                                .build()));
    }

    /**
     * Get action explanation for user understanding
     */
    @PostMapping("/explain-action")
    public String explainAction(@RequestBody MapAction action) {
        return llmService.generateExplanation(action);
    }

    /**
     * Smart endpoint that handles both conversational queries and map actions
     */
    @PostMapping(value = "/smart-query", produces = MediaType.APPLICATION_JSON_VALUE)
    public Object smartQuery(@RequestBody ChatRequest request,
                           @AuthenticationPrincipal UserDetails userDetails) {
        logger.info("📥 Smart query received: {}", request != null ? request.getMessage() : "null request");
        try {
            // Validate request
            if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                return Map.of(
                    "error", "Invalid request",
                    "message", "Query cannot be empty"
                );
            }

            // Get user ID from authenticated user
            Long userId = getUserIdFromUsername(userDetails != null ? userDetails.getUsername() : null);

            // Create map state with session information and current map context
            Map<String, Object> mapState = new HashMap<>();
            String sessionId = request.getSessionId() != null ? request.getSessionId() : java.util.UUID.randomUUID().toString();
            mapState.put("sessionId", sessionId);
            mapState.put("timestamp", System.currentTimeMillis());

            // Add current map state if provided
            if (request.getMapState() != null) {
                ChatRequest.MapState currentMapState = request.getMapState();
                mapState.put("enabledLayers", currentMapState.getEnabledLayers());
                mapState.put("currentZoom", currentMapState.getCurrentZoom());
                mapState.put("bounds", currentMapState.getBounds());
                mapState.put("activeFilters", currentMapState.getActiveFilters());
            }

            // Use enhanced LLM service with RAG
            logger.info("🤖 Calling enhanced LLM service for user {} with message: {}", userId, request.getMessage());
            LLMResponse llmResponse = enhancedLLMService.processUserQueryWithRAG(userId, request.getMessage(), mapState);
            logger.info("🤖 LLM service returned {} actions", llmResponse.getActions() != null ? llmResponse.getActions().size() : 0);

            // Check if this is a conversational response (SHOW_MESSAGE action) or map actions
            if (llmResponse.getActions() != null && llmResponse.getActions().size() == 1
                && "SHOW_MESSAGE".equals(llmResponse.getActions().get(0).getType())) {
                // Return conversational format for SHOW_MESSAGE actions
                Map<String, Object> payload = (Map<String, Object>) llmResponse.getActions().get(0).getPayload();
                Map<String, Object> conversationalResponse = new HashMap<>();
                conversationalResponse.put("response", payload.get("message"));
                conversationalResponse.put("timestamp", System.currentTimeMillis());
                conversationalResponse.put("sessionId", sessionId);
                conversationalResponse.put("interactionId", llmResponse.getInteractionId());
                logger.info("📤 Returning conversational response with message: {}", payload.get("message"));
                return conversationalResponse;
            } else if (llmResponse.getActions() != null && llmResponse.getActions().size() > 1) {
                // Multiple actions - use step-by-step execution
                actionQueueService.createActionQueue(sessionId, llmResponse.getActions());

                // Return only the first action
                MapAction firstAction = actionQueueService.getFirstAction(sessionId);
                if (firstAction != null) {
                    logger.info("🔍 First action details - Type: {}, Payload: {}", firstAction.getType(), firstAction.getPayload());
                    Map<String, Object> stepResponse = new HashMap<>();
                    stepResponse.put("action", firstAction);
                    stepResponse.put("isStepByStep", true);
                    stepResponse.put("totalSteps", llmResponse.getActions().size());
                    stepResponse.put("currentStep", 1);
                    stepResponse.put("sessionId", sessionId);
                    stepResponse.put("interactionId", llmResponse.getInteractionId());
                    logger.info("📤 Returning step-by-step response: step {}/{}", 1, llmResponse.getActions().size());
                    logger.info("🔍 Response object: {}", stepResponse);
                    return stepResponse;
                } else {
                    return llmResponse.getActions(); // Fallback
                }
            } else {
                // Single action or empty - return as before
                logger.info("📤 Returning single action or empty response: {} actions", llmResponse.getActions() != null ? llmResponse.getActions().size() : 0);

                // Ensure we never return null - return empty array if actions is null
                if (llmResponse.getActions() == null) {
                    logger.warn("⚠️  LLM response actions is null, returning empty array");
                    return List.of();
                }
                return llmResponse.getActions();
            }
        } catch (Exception e) {
            logger.error("Error in smart-query endpoint: {}", e.getMessage(), e);

            // Return a proper error response instead of falling back
            Map<String, Object> errorMap = new HashMap<>();
            errorMap.put("error", "An internal error occurred while processing your request");
            errorMap.put("message", "Please try again. If the problem persists, contact support.");
            errorMap.put("timestamp", System.currentTimeMillis());
            return errorMap;
        }
    }

    private Long getUserIdFromUsername(String username) {
        if (username == null) {
            // Return a default user ID for anonymous requests
            // You may want to handle this differently based on your requirements
            return 7L; // Using your test user ID as default
        }

        try {
            User user = userService.findByUsername(username);
            return user != null ? user.getId() : 7L;
        } catch (Exception e) {
            // Log error and return default
            e.printStackTrace();
            return 7L;
        }
    }

    /**
     * Chat endpoint for conversational responses and Q&A
     */
    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody ChatRequest request) {
        try {
            String response = llmService.processConversationalQuery(request.getMessage());
            
            Map<String, Object> result = new HashMap<>();
            result.put("response", response);
            result.put("type", "conversational");
            result.put("timestamp", System.currentTimeMillis());
            
            return result;
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("error", "Failed to process chat: " + e.getMessage());
        }
    }

    /**
     * Test RAG-enhanced LLM processing
     */
    @PostMapping("/enhanced-query")
    public Object processEnhancedQuery(@RequestBody ChatRequest request,
                                      @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Get user ID from authenticated user
            Long userId = getUserIdFromUsername(userDetails != null ? userDetails.getUsername() : null);
            Map<String, Object> mapState = new HashMap<>();
            mapState.put("sessionId", java.util.UUID.randomUUID().toString());

            return enhancedLLMService.processUserQueryWithRAG(userId, request.getMessage(), mapState);
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("error", "Failed to process query: " + e.getMessage());
        }
    }

    /**
     * Confirm action completion from frontend
     */
    @PostMapping("/confirm-action")
    public Map<String, Object> confirmActionCompletion(@RequestBody Map<String, Object> request) {
        try {
            Integer sequenceId = (Integer) request.get("sequenceId");
            String actionType = (String) request.get("actionType");
            String status = (String) request.get("status"); // "completed" or "failed"

            // Log the completion
            System.out.println("Action confirmed - Sequence ID: " + sequenceId +
                             ", Type: " + actionType + ", Status: " + status);

            return Map.of(
                "success", true,
                "message", "Action completion confirmed",
                "sequenceId", sequenceId
            );
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                "success", false,
                "error", "Failed to confirm action completion: " + e.getMessage()
            );
        }
    }

    /**
     * Get next action in sequence (for step-by-step execution)
     */
    @PostMapping(value = "/next-action", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> getNextAction(@RequestBody Map<String, Object> request) {
        try {
            Integer completedSequenceId = (Integer) request.get("completedSequenceId");
            String sessionId = (String) request.get("sessionId");

            // Extract mapState if provided
            Map<String, Object> mapState = new HashMap<>();
            mapState.put("sessionId", sessionId);
            mapState.put("timestamp", System.currentTimeMillis());

            @SuppressWarnings("unchecked")
            Map<String, Object> frontendMapState = (Map<String, Object>) request.get("mapState");
            if (frontendMapState != null) {
                mapState.putAll(frontendMapState);
            }

            if (sessionId == null) {
                return Map.of(
                    "success", false,
                    "error", "Session ID is required"
                );
            }

            // Get next action from queue
            MapAction nextAction = actionQueueService.completeCurrentAndGetNext(sessionId, completedSequenceId);

            // If this is a PERFORM_INTERSECTION action, update it with current map state
            if (nextAction != null && "PERFORM_INTERSECTION".equals(nextAction.getType()) && frontendMapState != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> enabledLayers = (List<Map<String, Object>>) frontendMapState.get("enabledLayers");
                if (enabledLayers != null) {
                    long enabledLayerCount = enabledLayers.stream()
                        .filter(layer -> Boolean.TRUE.equals(layer.get("enabled")))
                        .filter(layer -> layer.get("apiTableId") != null && !((String)layer.get("apiTableId")).isEmpty())
                        .count();

                    System.out.println("🔍 PERFORM_INTERSECTION - Found " + enabledLayerCount + " enabled layers with apiTableId");

                    if (enabledLayerCount < 2) {
                        System.out.println("❌ Skipping PERFORM_INTERSECTION - not enough enabled layers");
                        nextAction = actionQueueService.completeCurrentAndGetNext(sessionId, nextAction.getSequenceId());
                    }
                }
            }

            if (nextAction != null) {
                // Get progress info
                Map<String, Object> progress = actionQueueService.getProgress(sessionId);

                return Map.of(
                    "success", true,
                    "action", nextAction,
                    "currentStep", (Integer) progress.get("currentIndex") + 1,
                    "totalSteps", progress.get("totalActions"),
                    "hasNext", progress.get("hasNext"),
                    "sessionId", sessionId
                );
            } else {
                // No more actions - sequence complete
                return Map.of(
                    "success", true,
                    "completed", true,
                    "message", "All actions completed successfully",
                    "sessionId", sessionId
                );
            }
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                "success", false,
                "error", "Failed to get next action: " + e.getMessage()
            );
        }
    }

    /**
     * Test RAG layer search and embeddings
     */
    @GetMapping("/test-rag")
    public Map<String, Object> testRAG(@RequestParam(defaultValue = "opportunity zones") String query) {
        try {
            // Test embedding generation
            System.out.println("\n=== Testing Embedding Generation ===");
            System.out.println("Query: " + query);

            float[] embedding = embeddingService.createEmbedding(query);
            System.out.println("Embedding dimensions: " + embedding.length);

            // Count non-zero values
            int nonZeroCount = 0;
            float min = Float.MAX_VALUE, max = Float.MIN_VALUE;
            for (float v : embedding) {
                if (v != 0) nonZeroCount++;
                if (v < min) min = v;
                if (v > max) max = v;
            }
            System.out.println("Non-zero values: " + nonZeroCount);
            System.out.println("Value range: [" + min + ", " + max + "]");

            // Print first 10 values
            System.out.print("First 10 values: [");
            for (int i = 0; i < Math.min(10, embedding.length); i++) {
                System.out.printf("%.4f", embedding[i]);
                if (i < 9) System.out.print(", ");
            }
            System.out.println("]\n");

            // Test database connection - set search path
            jdbcTemplate.execute("SET search_path TO rag_schema, user_schema, public");

            // Query layers with schema prefix
            String sql = "SELECT layer_id, display_name, description FROM rag_schema.layer_metadata LIMIT 5";
            var layers = jdbcTemplate.queryForList(sql);

            System.out.println("Found " + layers.size() + " layers in database");
            for (var layer : layers) {
                System.out.println("  - " + layer.get("display_name") + ": " + layer.get("layer_id"));
            }

            return Map.of(
                "query", query,
                "embeddingInfo", Map.of(
                    "dimensions", embedding.length,
                    "nonZeroValues", nonZeroCount,
                    "minValue", min,
                    "maxValue", max,
                    "first10Values", java.util.Arrays.copyOf(embedding, Math.min(10, embedding.length))
                ),
                "foundLayers", layers,
                "count", layers.size(),
                "ragStatus", "connected"
            );
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                "error", e.getMessage(),
                "ragStatus", "error"
            );
        }
    }

    /**
     * Submit user feedback for an interaction
     */
    @PostMapping(value = "/feedback", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> submitFeedback(@RequestBody Map<String, Object> request,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Integer interactionId = (Integer) request.get("interactionId");
            String feedbackType = (String) request.get("feedbackType");
            @SuppressWarnings("unchecked")
            Map<String, Object> additionalData = (Map<String, Object>) request.get("additionalData");

            if (interactionId == null || feedbackType == null) {
                return Map.of(
                    "success", false,
                    "error", "Missing required fields: interactionId and feedbackType"
                );
            }

            Long userId = getUserIdFromUsername(userDetails != null ? userDetails.getUsername() : null);

            feedbackService.storeFeedback(userId, interactionId, feedbackType, additionalData);

            return Map.of(
                "success", true,
                "message", "Feedback submitted successfully",
                "interactionId", interactionId,
                "feedbackType", feedbackType
            );

        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                "success", false,
                "error", "Failed to submit feedback: " + e.getMessage()
            );
        }
    }

    /**
     * Get user's feedback statistics
     */
    @GetMapping("/feedback/stats")
    public Map<String, Object> getFeedbackStats(@RequestParam(defaultValue = "30") int days,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = getUserIdFromUsername(userDetails != null ? userDetails.getUsername() : null);
            Map<String, Object> stats = feedbackService.getUserFeedbackStats(userId, days);

            return Map.of(
                "success", true,
                "stats", stats,
                "userId", userId,
                "days", days
            );

        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                "success", false,
                "error", "Failed to get feedback stats: " + e.getMessage()
            );
        }
    }

    /**
     * Get feedback trends over time
     */
    @GetMapping("/feedback/trends")
    public Map<String, Object> getFeedbackTrends(@RequestParam(defaultValue = "7") int days,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long userId = getUserIdFromUsername(userDetails != null ? userDetails.getUsername() : null);
            List<Map<String, Object>> trends = feedbackService.getFeedbackTrends(userId, days);

            return Map.of(
                "success", true,
                "trends", trends,
                "userId", userId,
                "days", days
            );

        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                "success", false,
                "error", "Failed to get feedback trends: " + e.getMessage()
            );
        }
    }

    /**
     * Get RAG performance analytics (admin endpoint)
     */
    @GetMapping("/analytics/rag")
    public Map<String, Object> getRAGAnalytics(@RequestParam(defaultValue = "30") int days) {
        try {
            Map<String, Object> analytics = feedbackService.getRAGAnalytics(days);

            return Map.of(
                "success", true,
                "analytics", analytics,
                "days", days
            );

        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                "success", false,
                "error", "Failed to get RAG analytics: " + e.getMessage()
            );
        }
    }

    /**
     * Backfill semantic cache with existing positive feedback
     * This is an admin endpoint to populate the cache with historical data
     */
    @PostMapping("/admin/backfill-cache")
    public Map<String, Object> backfillSemanticCache() {
        try {
            ragService.backfillSemanticCache();

            return Map.of(
                "success", true,
                "message", "Semantic cache backfill completed successfully"
            );

        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                "success", false,
                "error", "Failed to backfill semantic cache: " + e.getMessage()
            );
        }
    }
}
