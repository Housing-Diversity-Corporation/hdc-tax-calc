package com.hdc.hdc_map_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.sql.Array;
import java.time.LocalDateTime;
// import org.springframework.ai.embedding.EmbeddingClient;
// import org.springframework.ai.openai.OpenAiEmbeddingClient;
// import org.springframework.ai.openai.api.OpenAiApi;
import com.hdc.hdc_map_backend.model.*;
import com.hdc.hdc_map_backend.entity.rag.ConversationMemory;
import com.hdc.hdc_map_backend.repository.rag.ConversationMemoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class RAGService {

    private static final Logger logger = LoggerFactory.getLogger(RAGService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmbeddingService embeddingService;

    @Autowired
    private UserService userService;

    @Autowired
    private ConversationMemoryRepository conversationMemoryRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Build comprehensive context for LLM based on user query
     */
    public RAGContext buildContextForQuery(Long userId, String query, Map<String, Object> mapState) {
        logger.info("Building RAG context for query: '{}' from user: {}", query, userId);
        RAGContext context = new RAGContext();

        // 1. Get query embedding
        logger.debug("Creating embedding for query: '{}'", query);
        float[] queryEmbedding = embeddingService.createEmbedding(query);
        logger.info("Generated embedding with {} dimensions, non-zero values: {}",
                queryEmbedding.length, countNonZeroValues(queryEmbedding));

        // 2. Search similar past interactions (user-specific and global)
        logger.debug("Searching for similar user interactions...");
        List<SimilarInteraction> userInteractions = findSimilarUserInteractions(userId, queryEmbedding, 3);
        logger.info("Found {} similar user interactions", userInteractions.size());

        List<SimilarInteraction> globalInteractions = findSimilarGlobalInteractions(queryEmbedding, 2);
        logger.info("Found {} similar global interactions", globalInteractions.size());

        // 3. Check semantic cache
        CachedResponse cachedResponse = checkSemanticCache(queryEmbedding);
        if (cachedResponse != null && cachedResponse.isValid()) {
            context.setCachedResponse(cachedResponse);
        }

        // 4. Get user context and preferences
        UserContext userContext = getUserContext(userId);
        context.setUserContext(userContext);

        // 5. Search relevant layers based on query
        logger.debug("Searching for relevant layers...");
        List<LayerMetadata> relevantLayers = findRelevantLayers(queryEmbedding, query);
        logger.info("Found {} relevant layers for query", relevantLayers.size());
        if (!relevantLayers.isEmpty()) {
            logger.debug("Top relevant layers: {}",
                    relevantLayers.stream()
                            .limit(3)
                            .map(LayerMetadata::getDisplayName)
                            .toList());
        }
        context.setRelevantLayers(relevantLayers);

        // 6. Extract location context
        LocationContext locationContext = extractLocationContext(query, mapState);
        context.setLocationContext(locationContext);

        // 7. Get conversation memory (last 5 turns from current session)
        List<ConversationTurn> conversationHistory = getConversationHistory(userId,
                (String) mapState.get("sessionId"), 5);
        context.setConversationHistory(conversationHistory);

        // 8. Find similar conversations from past sessions
        List<SimilarInteraction> similarConversations = findSimilarConversations(userId, queryEmbedding,
                (String) mapState.get("sessionId"), 3);

        // 9. Combine all interactions: user-specific + global + similar conversations
        List<SimilarInteraction> allInteractions = new ArrayList<>(userInteractions);
        allInteractions.addAll(globalInteractions); // Add global interactions!

        if (!similarConversations.isEmpty()) {
            logger.info("Found {} similar past conversations", similarConversations.size());
            allInteractions.addAll(similarConversations);
        }

        // Set all interactions in context
        context.setUserInteractions(allInteractions);
        logger.info("Combined interactions: {} user-specific + {} global + {} similar conversations = {} total",
                userInteractions.size(), globalInteractions.size(), similarConversations.size(), allInteractions.size());

        // 9. Find relevant query templates
        List<QueryTemplate> templates = findMatchingTemplates(queryEmbedding, userContext);
        context.setTemplates(templates);

        // 9. Get user patterns
        List<UserPattern> patterns = getUserPatterns(userId);
        context.setUserPatterns(patterns);

        // 10. Add current map state to the context
        context.setCurrentMapState(mapState);

        // Build the final context string for LLM
        String contextString = buildContextString(context);
        context.setContextString(contextString);
        logger.info("Built RAG context with {} characters", contextString.length());

        return context;
    }

    /**
     * Store interaction for future RAG retrieval
     */
    @Transactional
    public Integer storeInteraction(Long userId, String query, List<MapAction> actions,
            Map<String, Object> mapState, Integer successRating) {
        logger.info("Storing interaction for user {} with query: '{}'", userId, query);

        float[] queryEmbedding = embeddingService.createEmbedding(query);
        logger.debug("Created embedding for storage with {} dimensions", queryEmbedding.length);

        // Extract layers from actions
        Set<String> layersInvolved = new HashSet<>();
        for (MapAction action : actions) {
            if (action.getType().equals("TOGGLE_LAYER")) {
                Map<String, Object> payload = (Map<String, Object>) action.getPayload();
                layersInvolved.add((String) payload.get("layerId"));
            }
        }

        // Note: Your schema has execution_time_ms as INTEGER, not BIGINT
        String sql = """
                    INSERT INTO rag_schema.user_interactions
                    (user_id, query_text, query_embedding, actions_taken, layers_involved,
                     location_context, success_rating, session_id, execution_time_ms, created_at)
                    VALUES (?, ?, ?::vector, ?::jsonb, ?, ?::jsonb, ?, ?::uuid, ?, CURRENT_TIMESTAMP)
                    RETURNING id
                """;

        try {
            String actionsJson = objectMapper.writeValueAsString(actions);
            String mapStateJson = objectMapper.writeValueAsString(mapState);

            // Convert to match your schema types
            Integer executionTime = mapState.get("executionTime") != null
                    ? ((Number) mapState.get("executionTime")).intValue()
                    : 0;

            Integer interactionId = jdbcTemplate.queryForObject(sql, Integer.class,
                    userId.intValue(), // Your schema uses INTEGER for user_id
                    query,
                    formatEmbeddingForDatabase(queryEmbedding),
                    actionsJson,
                    layersInvolved.toArray(new String[0]),
                    mapStateJson,
                    successRating,
                    mapState.get("sessionId"),
                    executionTime);

            logger.info("Successfully stored interaction in database with ID: {}", interactionId);

            // Update user patterns asynchronously
            updateUserPatterns(userId, layersInvolved, actions);

            // Update semantic cache if successful
            if (successRating != null && successRating >= 4) {
                updateSemanticCache(queryEmbedding, actions, mapState);
            }

            return interactionId;

        } catch (Exception e) {
            logger.error("Failed to store interaction in database: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to store RAG interaction", e);
        }
    }

    /**
     * Find similar interactions from the user's history
     */
    private List<SimilarInteraction> findSimilarUserInteractions(Long userId, float[] embedding, int limit) {
        String sql = """
                    SELECT id, query_text, actions_taken, layers_involved,
                           1 - (query_embedding <=> ?::vector) as similarity
                    FROM rag_schema.user_interactions
                    WHERE user_id = ?
                        AND success_rating >= 4
                    ORDER BY query_embedding <=> ?::vector
                    LIMIT ?
                """;

        String embeddingStr = formatEmbeddingForDatabase(embedding);

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> {
                    SimilarInteraction interaction = new SimilarInteraction();
                    interaction.setId(rs.getLong("id"));
                    interaction.setQueryText(rs.getString("query_text"));
                    interaction.setActionsTaken(rs.getString("actions_taken"));
                    interaction.setLayersInvolved(Arrays.asList((String[]) rs.getArray("layers_involved").getArray()));
                    interaction.setSimilarity(rs.getFloat("similarity"));
                    return interaction;
                },
                embeddingStr, userId.intValue(), embeddingStr, limit);
    }

    /**
     * Find similar interactions from all users (anonymized)
     */
    private List<SimilarInteraction> findSimilarGlobalInteractions(float[] embedding, int limit) {
        String sql = """
                    SELECT query_text, actions_taken, layers_involved,
                           1 - (query_embedding <=> ?::vector) as similarity
                    FROM rag_schema.user_interactions
                    WHERE success_rating >= 4
                    ORDER BY query_embedding <=> ?::vector
                    LIMIT ?
                """;

        String embeddingStr = formatEmbeddingForDatabase(embedding);

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> {
                    SimilarInteraction interaction = new SimilarInteraction();
                    interaction.setQueryText(rs.getString("query_text"));
                    interaction.setActionsTaken(rs.getString("actions_taken"));
                    interaction.setLayersInvolved(Arrays.asList((String[]) rs.getArray("layers_involved").getArray()));
                    interaction.setSimilarity(rs.getFloat("similarity"));
                    return interaction;
                },
                embeddingStr, embeddingStr, limit);
    }

    /**
     * Get user's personalized context
     */
    private UserContext getUserContext(Long userId) {
        UserContext userContext = new UserContext();

        try {
            // First, try to load from user_context table
            String contextSql = """
                SELECT uc.*, ui_count.interaction_count
                FROM rag_schema.user_context uc
                LEFT JOIN (
                    SELECT user_id, COUNT(*) as interaction_count
                    FROM rag_schema.user_interactions
                    WHERE user_id = ?
                    GROUP BY user_id
                ) ui_count ON uc.user_id = ui_count.user_id
                WHERE uc.user_id = ?
            """;

            List<UserContext> contexts = jdbcTemplate.query(contextSql,
                (rs, rowNum) -> {
                    UserContext ctx = new UserContext();
                    ctx.setIndustryContext(rs.getString("industry_context"));
                    ctx.setExpertiseLevel(rs.getString("expertise_level"));
                    ctx.setInteractionStyle(rs.getString("interaction_style"));
                    ctx.setCustomTerminology(rs.getString("custom_terminology"));
                    ctx.setTotalInteractions(rs.getInt("interaction_count"));

                    // Parse preferred layers array
                    Array layersArray = rs.getArray("preferred_layers");
                    if (layersArray != null) {
                        String[] layers = (String[]) layersArray.getArray();
                        ctx.setPreferredLayers(Arrays.asList(layers));
                    } else {
                        ctx.setPreferredLayers(new ArrayList<>());
                    }

                    return ctx;
                },
                userId.intValue(), userId.intValue());

            if (!contexts.isEmpty()) {
                userContext = contexts.get(0);
                logger.debug("Loaded user context from database for user: {}", userId);
            } else {
                // Create new user context with defaults
                userContext = createDefaultUserContext(userId);
                logger.debug("Created new user context for user: {}", userId);
            }

            // Update preferred layers based on recent interactions if context is stale
            updatePreferredLayersFromInteractions(userContext, userId);

        } catch (Exception e) {
            logger.warn("Could not load user context for user {}: {}", userId, e.getMessage());
            userContext = createDefaultUserContext(userId);
        }

        return userContext;
    }

    private UserContext createDefaultUserContext(Long userId) {
        UserContext userContext = new UserContext();
        userContext.setExpertiseLevel("intermediate");
        userContext.setIndustryContext("urban_planning");
        userContext.setInteractionStyle("detailed");
        userContext.setCustomTerminology("");
        userContext.setPreferredLayers(new ArrayList<>());

        // Get current interaction count
        try {
            String countSql = "SELECT COUNT(*) FROM rag_schema.user_interactions WHERE user_id = ?";
            Integer interactionCount = jdbcTemplate.queryForObject(countSql, Integer.class, userId.intValue());
            userContext.setTotalInteractions(interactionCount != null ? interactionCount : 0);
        } catch (Exception e) {
            userContext.setTotalInteractions(0);
        }

        // Insert into user_context table
        try {
            String insertSql = """
                INSERT INTO rag_schema.user_context
                (user_id, industry_context, expertise_level, interaction_style,
                 custom_terminology, total_interactions, preferred_layers)
                VALUES (?, ?, ?, ?, ?::jsonb, ?, ?::text[])
                ON CONFLICT (user_id) DO UPDATE SET
                    total_interactions = EXCLUDED.total_interactions,
                    updated_at = CURRENT_TIMESTAMP
            """;

            // Handle empty custom terminology properly for JSON
            String customTerminology = userContext.getCustomTerminology();
            if (customTerminology == null || customTerminology.trim().isEmpty()) {
                customTerminology = "{}"; // Empty JSON object
            }

            jdbcTemplate.update(insertSql,
                userId.intValue(),
                userContext.getIndustryContext(),
                userContext.getExpertiseLevel(),
                userContext.getInteractionStyle(),
                customTerminology,
                userContext.getTotalInteractions(),
                userContext.getPreferredLayers().toArray(new String[0]));

            logger.info("Created user context record for user: {}", userId);
        } catch (Exception e) {
            logger.warn("Failed to persist user context: {}", e.getMessage());
        }

        return userContext;
    }

    private void updatePreferredLayersFromInteractions(UserContext userContext, Long userId) {
        try {
            // Get frequently used layers from recent interactions
            String layerSql = """
                SELECT unnest(layers_involved) as layer_id, COUNT(*) as usage_count
                FROM rag_schema.user_interactions
                WHERE user_id = ? AND layers_involved IS NOT NULL
                    AND created_at >= NOW() - INTERVAL '30 days'
                GROUP BY layer_id
                ORDER BY usage_count DESC
                LIMIT 8
            """;

            List<String> recentLayers = jdbcTemplate.query(layerSql,
                (rs, rowNum) -> rs.getString("layer_id"),
                userId.intValue());

            if (!recentLayers.isEmpty()) {
                // Merge with existing preferences (avoid duplicates)
                List<String> currentPreferred = userContext.getPreferredLayers();
                Set<String> allLayers = new HashSet<>(recentLayers);
                if (currentPreferred != null) {
                    allLayers.addAll(currentPreferred);
                }

                List<String> updatedLayers = new ArrayList<>(allLayers).subList(0, Math.min(8, allLayers.size()));
                userContext.setPreferredLayers(updatedLayers);

                // Update in database
                String updateSql = """
                    UPDATE rag_schema.user_context
                    SET preferred_layers = ?::text[],
                        total_interactions = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                """;

                jdbcTemplate.update(updateSql,
                    updatedLayers.toArray(new String[0]),
                    userContext.getTotalInteractions(),
                    userId.intValue());

                logger.debug("Updated preferred layers for user {}: {}", userId, updatedLayers);
            }
        } catch (Exception e) {
            logger.warn("Failed to update preferred layers from interactions: {}", e.getMessage());
        }
    }

    /**
     * Backfill semantic cache with existing positive feedback interactions
     * This method should be called once to populate the cache with historical data
     */
    public void backfillSemanticCache() {
        try {
            logger.info("Starting semantic cache backfill process...");

            // First check if we have any interactions to process
            String countSql = """
                SELECT COUNT(*) FROM rag_schema.user_interactions ui
                WHERE ui.success_rating >= 4
                    AND ui.query_embedding IS NOT NULL
                    AND ui.actions_taken IS NOT NULL
            """;

            Integer availableInteractions = jdbcTemplate.queryForObject(countSql, Integer.class);
            logger.info("Found {} interactions available for caching", availableInteractions);

            if (availableInteractions == null || availableInteractions == 0) {
                logger.info("No interactions available for semantic cache backfill");
                return;
            }

            String sql = """
                SELECT ui.id, ui.query_text, ui.query_embedding::text as query_embedding, ui.actions_taken, ui.created_at,
                       ui.user_id, ui.success_rating
                FROM rag_schema.user_interactions ui
                WHERE ui.success_rating >= 4
                    AND ui.query_embedding IS NOT NULL
                    AND ui.actions_taken IS NOT NULL
                ORDER BY ui.success_rating DESC, ui.created_at DESC
                LIMIT 50
            """;

            List<Map<String, Object>> positiveInteractions = jdbcTemplate.query(sql,
                (rs, rowNum) -> {
                    Map<String, Object> interaction = new HashMap<>();
                    interaction.put("id", rs.getInt("id"));
                    interaction.put("query_text", rs.getString("query_text"));
                    interaction.put("query_embedding", rs.getString("query_embedding"));
                    interaction.put("actions_taken", rs.getString("actions_taken"));
                    interaction.put("user_id", rs.getInt("user_id"));
                    interaction.put("success_rating", rs.getInt("success_rating"));
                    return interaction;
                });

            int cached = 0;
            int skipped = 0;
            int parseErrors = 0;
            int actionErrors = 0;

            logger.info("Processing {} interactions for semantic cache", positiveInteractions.size());

            for (Map<String, Object> interaction : positiveInteractions) {
                try {
                    // Parse the query embedding
                    String embeddingStr = (String) interaction.get("query_embedding");
                    if (embeddingStr != null && !embeddingStr.trim().isEmpty()) {
                        float[] embedding = parseEmbeddingVector(embeddingStr, (Integer) interaction.get("id"));

                        // Skip if embedding parsing failed completely
                        if (embedding == null || embedding.length == 0) {
                            logger.warn("Skipping interaction {} due to embedding parsing failure", interaction.get("id"));
                            parseErrors++;
                            continue;
                        }

                        // Parse actions
                        String actionsJson = (String) interaction.get("actions_taken");
                        if (actionsJson != null && !actionsJson.trim().isEmpty()) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> actionMaps = objectMapper.readValue(
                                actionsJson,
                                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

                            List<MapAction> actions = new ArrayList<>();
                            for (Map<String, Object> actionMap : actionMaps) {
                                MapAction action = new MapAction(
                                    (String) actionMap.get("type"),
                                    actionMap.get("payload"));
                                if (actionMap.containsKey("sequenceId")) {
                                    action.setSequenceId((Integer) actionMap.get("sequenceId"));
                                }
                                if (actionMap.containsKey("explanation")) {
                                    action.setExplanation((String) actionMap.get("explanation"));
                                }
                                actions.add(action);
                            }

                            // Create metadata
                            Map<String, Object> metadata = new HashMap<>();
                            metadata.put("original_interaction_id", interaction.get("id"));
                            metadata.put("success_rating", interaction.get("success_rating"));
                            metadata.put("query_text", interaction.get("query_text"));
                            metadata.put("backfilled", true);

                            // Add to semantic cache
                            updateSemanticCache(embedding, actions, metadata);
                            cached++;
                            logger.debug("Cached interaction {} with rating {}",
                                interaction.get("id"), interaction.get("success_rating"));
                        } else {
                            logger.warn("Skipping interaction {} - no actions to cache", interaction.get("id"));
                            actionErrors++;
                        }
                    } else {
                        logger.warn("Skipping interaction {} - empty embedding", interaction.get("id"));
                        skipped++;
                    }
                } catch (NumberFormatException e) {
                    logger.error("NumberFormatException caching interaction {}: {}",
                                interaction.get("id"), e.getMessage());
                    parseErrors++;
                } catch (Exception e) {
                    logger.warn("Failed to cache interaction {}: {}", interaction.get("id"), e.getMessage());
                    actionErrors++;
                }
            }

            logger.info("Semantic cache backfill completed. Results: {} cached, {} parse errors, {} action errors, {} skipped",
                       cached, parseErrors, actionErrors, skipped);

        } catch (Exception e) {
            logger.error("Failed to backfill semantic cache: {}", e.getMessage());
        }
    }

    /**
     * Find relevant layers based on semantic search
     */
    private int countNonZeroValues(float[] array) {
        int count = 0;
        for (float v : array) {
            if (v != 0.0f)
                count++;
        }
        return count;
    }

    private List<LayerMetadata> findRelevantLayers(float[] embedding, String query) {
        logger.debug("Finding relevant layers for query: '{}'", query);
        String sql = """
                    SELECT layer_id, display_name, description, tags,
                           zoom_constraints, available_filters, common_queries,
                           1 - (description_embedding <=> ?::vector) as similarity
                    FROM rag_schema.layer_metadata
                    WHERE description_embedding IS NOT NULL
                        AND (
                            -- Semantic similarity
                            1 - (description_embedding <=> ?::vector) > 0.3
                            -- Or keyword match
                            OR layer_id ILIKE ?
                            OR display_name ILIKE ?
                            OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE ?)
                            OR EXISTS (SELECT 1 FROM unnest(common_queries) AS cq WHERE cq ILIKE ?)
                        )
                    ORDER BY similarity DESC
                    LIMIT 5
                """;

        String embeddingStr = formatEmbeddingForDatabase(embedding);
        String queryPattern = "%" + query + "%";

        try {
            return jdbcTemplate.query(sql,
                    (rs, rowNum) -> {
                        LayerMetadata layer = new LayerMetadata();
                        layer.setLayerId(rs.getString("layer_id"));
                        layer.setDisplayName(rs.getString("display_name"));
                        layer.setDescription(rs.getString("description"));
                        layer.setZoomConstraints(rs.getString("zoom_constraints"));
                        layer.setAvailableFilters(rs.getString("available_filters"));
                        layer.setCommonQueries(Arrays.asList((String[]) rs.getArray("common_queries").getArray()));
                        return layer;
                    },
                    embeddingStr, embeddingStr, queryPattern, queryPattern, queryPattern, queryPattern);
        } catch (Exception e) {
            logger.warn("Vector search failed, falling back to keyword search: {}", e.getMessage());
            // Fallback to simple keyword search if vector search fails
            return findLayersByKeywords(query);
        }
    }

    private List<LayerMetadata> findLayersByKeywords(String query) {
        String sql = """
                    SELECT layer_id, display_name, description,
                           zoom_constraints, available_filters, common_queries
                    FROM rag_schema.layer_metadata
                    WHERE layer_id ILIKE ?
                       OR display_name ILIKE ?
                       OR description ILIKE ?
                       OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE ?)
                       OR EXISTS (SELECT 1 FROM unnest(common_queries) AS cq WHERE cq ILIKE ?)
                    LIMIT 5
                """;

        String queryPattern = "%" + query + "%";

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> {
                    LayerMetadata layer = new LayerMetadata();
                    layer.setLayerId(rs.getString("layer_id"));
                    layer.setDisplayName(rs.getString("display_name"));
                    layer.setDescription(rs.getString("description"));
                    layer.setZoomConstraints(rs.getString("zoom_constraints"));
                    layer.setAvailableFilters(rs.getString("available_filters"));
                    layer.setCommonQueries(Arrays.asList((String[]) rs.getArray("common_queries").getArray()));
                    return layer;
                },
                queryPattern, queryPattern, queryPattern, queryPattern, queryPattern);
    }

    /**
     * Extract location context from query and map state
     */
    private LocationContext extractLocationContext(String query, Map<String, Object> mapState) {
        try {
            logger.debug("Extracting location context from query: '{}'", query);

            LocationContext context = new LocationContext();

            // Extract current zoom level from map state
            if (mapState != null && mapState.get("currentZoom") != null) {
                context.setCurrentZoom(((Number) mapState.get("currentZoom")).doubleValue());
            }

            // Extract current bounds from map state
            if (mapState != null && mapState.get("bounds") != null) {
                Object boundsObj = mapState.get("bounds");
                if (boundsObj instanceof Map) {
                    context.setBounds((Map<String, Object>) boundsObj);
                } else {
                    // If it's a MapBounds object or other type, convert to Map
                    Map<String, Object> boundsMap = new HashMap<>();
                    try {
                        // Use Jackson to convert object to Map
                        String boundsJson = objectMapper.writeValueAsString(boundsObj);
                        @SuppressWarnings("unchecked")
                        Map<String, Object> convertedBounds = objectMapper.readValue(boundsJson, Map.class);
                        context.setBounds(convertedBounds);
                    } catch (Exception e) {
                        logger.warn("Failed to convert bounds object to map: {}", e.getMessage());
                        context.setBounds(boundsMap); // Set empty map as fallback
                    }
                }
            }

            // Search for location mentions in the query using location_knowledge table
            String locationSql = """
                    SELECT lk.id, lk.location_name, lk.location_type, lk.relevant_layers,
                           lk.common_analyses, lk.metadata
                    FROM rag_schema.location_knowledge lk
                    WHERE ? ILIKE '%' || lk.location_name || '%'
                        OR EXISTS (SELECT 1 FROM unnest(lk.aliases) AS alias WHERE ? ILIKE '%' || alias || '%')
                    ORDER BY
                        CASE
                            WHEN ? ILIKE '%' || lk.location_name || '%' THEN 1
                            ELSE 2
                        END,
                        char_length(lk.location_name) DESC
                    LIMIT 3
                """;

            List<Map<String, Object>> locations = jdbcTemplate.query(locationSql,
                    (rs, rowNum) -> {
                        Map<String, Object> location = new HashMap<>();
                        location.put("id", rs.getInt("id"));
                        location.put("location_name", rs.getString("location_name"));
                        location.put("location_type", rs.getString("location_type"));

                        // Parse relevant layers
                        Array layersArray = rs.getArray("relevant_layers");
                        if (layersArray != null) {
                            location.put("relevant_layers", Arrays.asList((String[]) layersArray.getArray()));
                        }

                        // Parse common analyses
                        try {
                            String analysesJson = rs.getString("common_analyses");
                            if (analysesJson != null) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> analyses = objectMapper.readValue(analysesJson, Map.class);
                                location.put("common_analyses", analyses);
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse common analyses: {}", e.getMessage());
                        }

                        // Parse metadata
                        try {
                            String metadataJson = rs.getString("metadata");
                            if (metadataJson != null) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> metadata = objectMapper.readValue(metadataJson, Map.class);
                                location.put("metadata", metadata);
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse location metadata: {}", e.getMessage());
                        }

                        return location;
                    },
                    query, query, query);

            if (!locations.isEmpty()) {
                context.setIdentifiedLocation(locations.get(0));
                logger.info("Identified location context: {}", locations.get(0).get("location_name"));
            }

            // Use embedding-based location search if no direct match found
            if (locations.isEmpty() && query.length() > 10) {
                try {
                    float[] queryEmbedding = embeddingService.createEmbedding(query);
                    String embeddingStr = formatEmbeddingForDatabase(queryEmbedding);

                    String vectorSql = """
                            SELECT lk.location_name, lk.location_type, lk.relevant_layers,
                                   1 - (lk.location_embedding <=> ?::vector) as similarity
                            FROM rag_schema.location_knowledge lk
                            WHERE lk.location_embedding IS NOT NULL
                                AND 1 - (lk.location_embedding <=> ?::vector) > 0.4
                            ORDER BY similarity DESC
                            LIMIT 1
                        """;

                    List<Map<String, Object>> vectorLocations = jdbcTemplate.query(vectorSql,
                            (rs, rowNum) -> {
                                Map<String, Object> location = new HashMap<>();
                                location.put("location_name", rs.getString("location_name"));
                                location.put("location_type", rs.getString("location_type"));
                                location.put("similarity", rs.getFloat("similarity"));

                                Array layersArray = rs.getArray("relevant_layers");
                                if (layersArray != null) {
                                    location.put("relevant_layers", Arrays.asList((String[]) layersArray.getArray()));
                                }

                                return location;
                            },
                            embeddingStr, embeddingStr);

                    if (!vectorLocations.isEmpty()) {
                        context.setIdentifiedLocation(vectorLocations.get(0));
                        logger.info("Found semantic location match: {} (similarity: {})",
                                   vectorLocations.get(0).get("location_name"),
                                   vectorLocations.get(0).get("similarity"));
                    }
                } catch (Exception e) {
                    logger.warn("Failed to perform semantic location search: {}", e.getMessage());
                }
            }

            return context;

        } catch (Exception e) {
            logger.warn("Error extracting location context: {}", e.getMessage());
            return new LocationContext();
        }
    }

    /**
     * Build the final context string for the LLM
     */
    private String buildContextString(RAGContext context) {
        StringBuilder sb = new StringBuilder();

        // Add relevant layers information
        if (context.getRelevantLayers() != null && !context.getRelevantLayers().isEmpty()) {
            sb.append("RELEVANT LAYERS:\n");
            for (LayerMetadata layer : context.getRelevantLayers()) {
                sb.append("- ").append(layer.getDisplayName())
                        .append(": ").append(layer.getDescription()).append("\n");
                if (layer.getZoomConstraints() != null) {
                    sb.append("  Zoom constraints: ").append(layer.getZoomConstraints()).append("\n");
                }
            }
            sb.append("\n");
        }

        // Add user context if available
        if (context.getUserContext() != null) {
            UserContext userCtx = context.getUserContext();
            if (userCtx.getPreferredLayers() != null && !userCtx.getPreferredLayers().isEmpty()) {
                sb.append("USER PREFERENCES:\n");
                sb.append("Frequently used layers: ").append(String.join(", ", userCtx.getPreferredLayers()))
                        .append("\n\n");
            }
        }

        // Add conversation history
        if (context.getConversationHistory() != null && !context.getConversationHistory().isEmpty()) {
            sb.append("RECENT CONVERSATION:\n");
            for (ConversationTurn turn : context.getConversationHistory()) {
                sb.append(turn.getRole()).append(": ").append(turn.getContent()).append("\n");
            }
            sb.append("\n");
        }

        // Add conversation summary information for history queries
        if (context.getUserContext() != null && context.getUserContext().getTotalInteractions() > 0) {
            sb.append("USER INTERACTION SUMMARY:\n");
            sb.append("- Total previous interactions: ").append(context.getUserContext().getTotalInteractions()).append("\n");
            if (context.getUserContext().getPreferredLayers() != null && !context.getUserContext().getPreferredLayers().isEmpty()) {
                sb.append("- Frequently discussed layers: ").append(String.join(", ", context.getUserContext().getPreferredLayers())).append("\n");
            }
            sb.append("- Available conversation history for detailed queries\n\n");
        }

        return sb.toString();
    }

    /**
     * Update user patterns based on new interaction
     */
    private void updateUserPatterns(Long userId, Set<String> layers, List<MapAction> actions) {
        // This runs asynchronously to not block the main request
        // Patterns are automatically updated via the database trigger

        // Additional pattern analysis can be done here
        // For example, identifying workflow patterns
        if (actions.size() > 3) {
            String workflow = extractWorkflowPattern(actions);
            String sql = """
                        INSERT INTO rag_schema.user_patterns (user_id, pattern_type, pattern_data, frequency)
                        VALUES (?, 'workflow', ?::jsonb, 1)
                        ON CONFLICT (user_id, pattern_type, pattern_data)
                        DO UPDATE SET frequency = rag_schema.user_patterns.frequency + 1,
                                     last_used = NOW()
                    """;

            try {
                jdbcTemplate.update(sql, userId, workflow);
            } catch (Exception e) {
                // Log but don't fail the main operation
                e.printStackTrace();
            }
        }
    }

    private String extractWorkflowPattern(List<MapAction> actions) {
        // Extract high-level workflow pattern
        List<String> actionTypes = actions.stream()
                .map(MapAction::getType)
                .toList();

        Map<String, Object> pattern = new HashMap<>();
        pattern.put("action_sequence", actionTypes);
        pattern.put("action_count", actions.size());

        try {
            return objectMapper.writeValueAsString(pattern);
        } catch (Exception e) {
            return "{}";
        }
    }

    private CachedResponse checkSemanticCache(float[] embedding) {
        try {
            logger.debug("Checking semantic cache for similar queries");

            String sql = """
                    SELECT id, query_hash, response_actions, metadata, hit_count,
                           last_accessed, ttl_hours, created_at,
                           1 - (query_embedding <=> ?::vector) as similarity
                    FROM rag_schema.semantic_cache
                    WHERE 1 - (query_embedding <=> ?::vector) > 0.95
                        AND (ttl_hours = 0 OR created_at + INTERVAL '1 hour' * ttl_hours > NOW())
                    ORDER BY similarity DESC
                    LIMIT 1
                """;

            String embeddingStr = formatEmbeddingForDatabase(embedding);

            List<CachedResponse> results = jdbcTemplate.query(sql,
                    (rs, rowNum) -> {
                        CachedResponse response = new CachedResponse();
                        response.setId(rs.getInt("id"));
                        response.setQueryHash(rs.getString("query_hash"));
                        response.setHitCount(rs.getInt("hit_count"));
                        response.setTtlHours(rs.getInt("ttl_hours"));
                        response.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
                        response.setLastAccessed(rs.getTimestamp("last_accessed").toLocalDateTime());

                        // Parse response_actions JSON to MapAction list
                        try {
                            String actionsJson = rs.getString("response_actions");
                            if (actionsJson != null) {
                                @SuppressWarnings("unchecked")
                                List<Map<String, Object>> actionMaps = objectMapper.readValue(
                                        actionsJson,
                                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

                                List<MapAction> actions = new ArrayList<>();
                                for (Map<String, Object> actionMap : actionMaps) {
                                    MapAction action = new MapAction(
                                            (String) actionMap.get("type"),
                                            actionMap.get("payload"));
                                    action.setSequenceId((Integer) actionMap.get("sequenceId"));
                                    action.setExplanation((String) actionMap.get("explanation"));
                                    actions.add(action);
                                }
                                response.setActions(actions);
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse cached actions: {}", e.getMessage());
                        }

                        // Parse metadata JSON
                        try {
                            String metadataJson = rs.getString("metadata");
                            if (metadataJson != null) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> metadata = objectMapper.readValue(metadataJson, Map.class);
                                response.setMetadata(metadata);
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse cached metadata: {}", e.getMessage());
                        }

                        return response;
                    },
                    embeddingStr, embeddingStr);

            if (!results.isEmpty()) {
                CachedResponse cachedResponse = results.get(0);
                logger.info("Found cached response (ID: {}, age: {} hours)",
                           cachedResponse.getId(), cachedResponse.getAgeHours());

                // Update hit count and last accessed time
                updateCacheHitStats(cachedResponse.getId());

                return cachedResponse;
            }

            logger.debug("No suitable cached response found");
            return null;

        } catch (Exception e) {
            logger.warn("Error checking semantic cache: {}", e.getMessage());
            return null;
        }
    }

    private void updateSemanticCache(float[] queryEmbedding, List<MapAction> actions, Map<String, Object> mapState) {
        try {
            logger.debug("Updating semantic cache with successful response");

            // Create query hash for duplicate detection
            String queryHash = java.util.Base64.getEncoder().encodeToString(
                    java.security.MessageDigest.getInstance("SHA-256")
                            .digest(Arrays.toString(queryEmbedding).getBytes()));

            // Check if already cached
            String checkSql = "SELECT id FROM rag_schema.semantic_cache WHERE query_hash = ?";
            List<Integer> existing = jdbcTemplate.queryForList(checkSql, Integer.class, queryHash);

            if (!existing.isEmpty()) {
                // Update existing cache entry
                String updateSql = """
                        UPDATE rag_schema.semantic_cache
                        SET hit_count = hit_count + 1,
                            last_accessed = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """;
                jdbcTemplate.update(updateSql, existing.get(0));
                logger.debug("Updated existing cache entry ID: {}", existing.get(0));
                return;
            }

            // Insert new cache entry
            String insertSql = """
                    INSERT INTO rag_schema.semantic_cache
                    (query_embedding, query_hash, response_actions, metadata, hit_count, ttl_hours)
                    VALUES (?::vector, ?, ?::jsonb, ?::jsonb, 1, 168)
                """;

            String embeddingStr = formatEmbeddingForDatabase(queryEmbedding);
            String actionsJson = objectMapper.writeValueAsString(actions);
            String metadataJson = objectMapper.writeValueAsString(mapState);

            jdbcTemplate.update(insertSql, embeddingStr, queryHash, actionsJson, metadataJson);
            logger.info("Added new entry to semantic cache (TTL: 168 hours)");

        } catch (Exception e) {
            logger.warn("Failed to update semantic cache: {}", e.getMessage());
            // Don't fail the main operation if caching fails
        }
    }

    /**
     * Update cache hit statistics
     */
    private void updateCacheHitStats(Integer cacheId) {
        try {
            String sql = """
                    UPDATE rag_schema.semantic_cache
                    SET hit_count = hit_count + 1,
                        last_accessed = CURRENT_TIMESTAMP
                    WHERE id = ?
                """;
            jdbcTemplate.update(sql, cacheId);
        } catch (Exception e) {
            logger.warn("Failed to update cache hit stats: {}", e.getMessage());
        }
    }

    private List<ConversationTurn> getConversationHistory(Long userId, String sessionId, int limit) {
        if (sessionId == null) {
            return new ArrayList<>();
        }

        String sql = """
                    SELECT role, content, turn_number
                    FROM rag_schema.conversation_memory
                    WHERE user_id = ? AND session_id = ?::uuid
                    ORDER BY turn_number DESC
                    LIMIT ?
                """;

        try {
            List<ConversationTurn> turns = jdbcTemplate.query(sql,
                    (rs, rowNum) -> {
                        ConversationTurn turn = new ConversationTurn();
                        turn.setRole(rs.getString("role"));
                        turn.setContent(rs.getString("content"));
                        turn.setTurnNumber(rs.getInt("turn_number"));
                        return turn;
                    },
                    userId.intValue(), sessionId, limit);

            // Reverse to get chronological order
            Collections.reverse(turns);
            return turns;
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private List<QueryTemplate> findMatchingTemplates(float[] queryEmbedding, UserContext userContext) {
        try {
            logger.debug("Finding matching query templates");

            String sql = """
                    SELECT id, template_text, action_sequence, required_layers, optional_layers,
                           parameter_slots, usage_count, success_rate, tags,
                           1 - (template_embedding <=> ?::vector) as similarity
                    FROM rag_schema.query_templates
                    WHERE template_embedding IS NOT NULL
                        AND is_public = true
                        AND success_rate >= 0.7
                        AND 1 - (template_embedding <=> ?::vector) > 0.4
                    ORDER BY similarity DESC, success_rate DESC, usage_count DESC
                    LIMIT 5
                """;

            String embeddingStr = formatEmbeddingForDatabase(queryEmbedding);

            return jdbcTemplate.query(sql,
                    (rs, rowNum) -> {
                        QueryTemplate template = new QueryTemplate();
                        template.setId(rs.getInt("id"));
                        template.setTemplateText(rs.getString("template_text"));
                        template.setUsageCount(rs.getInt("usage_count"));
                        template.setSuccessRate(rs.getDouble("success_rate"));

                        // Parse action sequence
                        try {
                            String actionsJson = rs.getString("action_sequence");
                            if (actionsJson != null) {
                                @SuppressWarnings("unchecked")
                                List<Map<String, Object>> actionMaps = objectMapper.readValue(
                                        actionsJson,
                                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

                                List<MapAction> actions = new ArrayList<>();
                                for (Map<String, Object> actionMap : actionMaps) {
                                    MapAction action = new MapAction(
                                            (String) actionMap.get("type"),
                                            actionMap.get("payload"));
                                    action.setSequenceId((Integer) actionMap.get("sequenceId"));
                                    action.setExplanation((String) actionMap.get("explanation"));
                                    actions.add(action);
                                }
                                template.setActionSequence(actions);
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse template actions: {}", e.getMessage());
                        }

                        // Parse required and optional layers
                        Array requiredArray = rs.getArray("required_layers");
                        if (requiredArray != null) {
                            template.setRequiredLayers(Arrays.asList((String[]) requiredArray.getArray()));
                        }

                        Array optionalArray = rs.getArray("optional_layers");
                        if (optionalArray != null) {
                            template.setOptionalLayers(Arrays.asList((String[]) optionalArray.getArray()));
                        }

                        Array tagsArray = rs.getArray("tags");
                        if (tagsArray != null) {
                            template.setTags(Arrays.asList((String[]) tagsArray.getArray()));
                        }

                        // Parse parameter slots
                        try {
                            String paramJson = rs.getString("parameter_slots");
                            if (paramJson != null) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> params = objectMapper.readValue(paramJson, Map.class);
                                template.setParameterSlots(params);
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse template parameters: {}", e.getMessage());
                        }

                        return template;
                    },
                    embeddingStr, embeddingStr);

        } catch (Exception e) {
            logger.warn("Error finding matching templates: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<UserPattern> getUserPatterns(Long userId) {
        try {
            logger.debug("Retrieving user patterns for user: {}", userId);

            String sql = """
                    SELECT id, pattern_type, pattern_data, frequency, last_used,
                           confidence_score
                    FROM rag_schema.user_patterns
                    WHERE user_id = ?
                        AND frequency >= 2
                        AND confidence_score >= 0.3
                    ORDER BY frequency DESC, confidence_score DESC, last_used DESC
                    LIMIT 10
                """;

            return jdbcTemplate.query(sql,
                    (rs, rowNum) -> {
                        UserPattern pattern = new UserPattern();
                        pattern.setId(rs.getInt("id"));
                        pattern.setUserId(userId.intValue());
                        pattern.setPatternType(rs.getString("pattern_type"));
                        pattern.setFrequency(rs.getInt("frequency"));
                        pattern.setConfidenceScore(rs.getDouble("confidence_score"));
                        pattern.setLastUsed(rs.getTimestamp("last_used").toLocalDateTime());

                        // Parse pattern data JSON
                        try {
                            String patternJson = rs.getString("pattern_data");
                            if (patternJson != null) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> patternData = objectMapper.readValue(patternJson, Map.class);
                                pattern.setPatternData(patternData);
                            }
                        } catch (Exception e) {
                            logger.warn("Failed to parse pattern data: {}", e.getMessage());
                        }

                        return pattern;
                    },
                    userId.intValue());

        } catch (Exception e) {
            logger.warn("Error retrieving user patterns: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Get conversation history summary for user queries about past conversations
     */
    public String getConversationHistorySummary(Long userId, int limit) {
        logger.info("Getting conversation history summary for user: {}", userId);

        try {
            String sql = """
                WITH conversation_sessions AS (
                    SELECT
                        session_id,
                        MIN(created_at) as session_start,
                        MAX(created_at) as session_end,
                        COUNT(*) as turn_count,
                        STRING_AGG(
                            CASE WHEN role = 'user' THEN content END,
                            ' | ' ORDER BY turn_number
                        ) as user_queries,
                        STRING_AGG(
                            CASE WHEN role = 'assistant' THEN content END,
                            ' | ' ORDER BY turn_number
                        ) as assistant_responses
                    FROM rag_schema.conversation_memory
                    WHERE user_id = ?
                    GROUP BY session_id
                    ORDER BY session_start DESC
                    LIMIT ?
                )
                SELECT
                    session_id,
                    session_start,
                    turn_count,
                    LEFT(user_queries, 200) as sample_queries,
                    LEFT(assistant_responses, 200) as sample_responses
                FROM conversation_sessions
            """;

            List<Map<String, Object>> sessions = jdbcTemplate.queryForList(sql, userId.intValue(), limit);

            StringBuilder summary = new StringBuilder();
            summary.append("Here's a summary of your recent conversations:\n\n");

            for (int i = 0; i < sessions.size(); i++) {
                Map<String, Object> session = sessions.get(i);
                summary.append(String.format("**Session %d** (%s)\n", i + 1, session.get("session_start")));
                summary.append(String.format("- %s conversation turns\n", session.get("turn_count")));

                String queries = (String) session.get("sample_queries");
                if (queries != null && !queries.trim().isEmpty()) {
                    summary.append("- Sample questions: ").append(queries).append("\n");
                }

                String responses = (String) session.get("sample_responses");
                if (responses != null && !responses.trim().isEmpty()) {
                    summary.append("- Topics covered: ").append(responses).append("\n");
                }
                summary.append("\n");
            }

            // Add statistics
            String statsSql = """
                SELECT
                    COUNT(DISTINCT session_id) as total_sessions,
                    COUNT(*) as total_turns,
                    COUNT(CASE WHEN role = 'user' THEN 1 END) as user_messages,
                    MIN(created_at) as first_conversation,
                    MAX(created_at) as latest_conversation
                FROM rag_schema.conversation_memory
                WHERE user_id = ?
            """;

            Map<String, Object> stats = jdbcTemplate.queryForMap(statsSql, userId.intValue());
            summary.append("**Overall Statistics:**\n");
            summary.append(String.format("- Total sessions: %s\n", stats.get("total_sessions")));
            summary.append(String.format("- Total messages: %s\n", stats.get("user_messages")));
            summary.append(String.format("- First conversation: %s\n", stats.get("first_conversation")));
            summary.append(String.format("- Latest conversation: %s\n", stats.get("latest_conversation")));

            return summary.toString();

        } catch (Exception e) {
            logger.error("Error getting conversation history summary: {}", e.getMessage(), e);
            return "I found that you have previous conversations stored, but I'm having trouble retrieving the details right now. You have engaged in conversations across multiple sessions.";
        }
    }

    /**
     * Search conversations by content for specific topics
     */
    public String searchConversationsByTopic(Long userId, String topic, int limit) {
        logger.info("Searching conversations for topic: '{}' for user: {}", topic, userId);

        try {
            // First try semantic search if we have embeddings
            float[] topicEmbedding = embeddingService.createEmbedding(topic);
            String embeddingStr = formatEmbeddingForDatabase(topicEmbedding);

            String sql = """
                SELECT
                    cm.session_id,
                    cm.role,
                    cm.content,
                    cm.created_at,
                    1 - (cm.content_embedding <=> ?::vector) as similarity
                FROM rag_schema.conversation_memory cm
                WHERE cm.user_id = ?
                    AND cm.content_embedding IS NOT NULL
                    AND (
                        cm.content ILIKE ?
                        OR 1 - (cm.content_embedding <=> ?::vector) > 0.3
                    )
                ORDER BY similarity DESC, cm.created_at DESC
                LIMIT ?
            """;

            String topicPattern = "%" + topic + "%";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql,
                embeddingStr, userId.intValue(), topicPattern, embeddingStr, limit);

            if (results.isEmpty()) {
                return String.format("I couldn't find any previous conversations about '%s'. You might want to try different keywords.", topic);
            }

            StringBuilder response = new StringBuilder();
            response.append(String.format("I found %d conversations related to '%s':\n\n", results.size(), topic));

            String currentSession = null;
            int sessionNum = 1;

            for (Map<String, Object> result : results) {
                String sessionId = result.get("session_id").toString(); // Handle UUID properly

                if (!sessionId.equals(currentSession)) {
                    if (currentSession != null) response.append("\n");
                    response.append(String.format("**Session %d** (%s):\n", sessionNum++, result.get("created_at")));
                    currentSession = sessionId;
                }

                String role = (String) result.get("role");
                String content = (String) result.get("content");
                Float similarity = ((Number) result.get("similarity")).floatValue();

                response.append(String.format("- %s: %s (%.1f%% match)\n",
                    role.equals("user") ? "You asked" : "I responded",
                    content.length() > 150 ? content.substring(0, 150) + "..." : content,
                    similarity * 100));
            }

            return response.toString();

        } catch (Exception e) {
            logger.error("Error searching conversations by topic: {}", e.getMessage(), e);
            // Fallback to simple text search
            return searchConversationsByKeyword(userId, topic, limit);
        }
    }

    /**
     * Fallback method for keyword-based conversation search
     */
    private String searchConversationsByKeyword(Long userId, String keyword, int limit) {
        try {
            String sql = """
                SELECT session_id, role, content, created_at
                FROM rag_schema.conversation_memory
                WHERE user_id = ? AND content ILIKE ?
                ORDER BY created_at DESC
                LIMIT ?
            """;

            String keywordPattern = "%" + keyword + "%";
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql,
                userId.intValue(), keywordPattern, limit);

            if (results.isEmpty()) {
                return String.format("I couldn't find any conversations containing '%s'.", keyword);
            }

            StringBuilder response = new StringBuilder();
            response.append(String.format("Found %d messages containing '%s':\n\n", results.size(), keyword));

            for (Map<String, Object> result : results) {
                String role = (String) result.get("role");
                String content = (String) result.get("content");
                response.append(String.format("- %s (%s): %s\n",
                    role.equals("user") ? "You" : "Assistant",
                    result.get("created_at"),
                    content.length() > 100 ? content.substring(0, 100) + "..." : content));
            }

            return response.toString();

        } catch (Exception e) {
            logger.error("Error in keyword search: {}", e.getMessage());
            return "I'm having trouble searching your conversation history right now.";
        }
    }

    /**
     * Find similar conversations from past sessions using vector similarity
     */
    private List<SimilarInteraction> findSimilarConversations(Long userId, float[] queryEmbedding,
            String currentSessionId, int limit) {
        try {
            String embeddingStr = formatEmbeddingForDatabase(queryEmbedding);
            List<ConversationMemory> similarConversations = conversationMemoryRepository.findSimilarConversations(
                    userId.intValue(), embeddingStr, currentSessionId, limit);

            return similarConversations.stream()
                    .map(conv -> {
                        SimilarInteraction interaction = new SimilarInteraction();
                        interaction.setId(conv.getId());
                        interaction.setQueryText(conv.getContent());
                        interaction.setSimilarity(0.8f); // Default similarity, could be calculated from query
                        interaction.setActionsTaken("Previous conversation: " + conv.getRole());
                        interaction.setLayersInvolved(new ArrayList<>()); // Empty for now
                        return interaction;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error finding similar conversations: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Helper method to parse embedding vectors from string format
     * Handles comma-separated format stored in database
     */
    private float[] parseEmbeddingVector(String embeddingStr, Integer interactionId) {
        if (embeddingStr == null || embeddingStr.trim().isEmpty()) {
            logger.warn("Empty embedding string for interaction {}", interactionId);
            return null;
        }

        try {
            logger.debug("Parsing embedding for interaction {}, length: {}",
                        interactionId, embeddingStr.length());

            String[] parts;

            // Handle both formats: "[0.1,0.2,0.3]" (PostgreSQL vector) and "0.1,0.2,0.3" (legacy)
            if (embeddingStr.startsWith("[") && embeddingStr.endsWith("]")) {
                // PostgreSQL vector format: [0.1,0.2,0.3]
                String innerContent = embeddingStr.substring(1, embeddingStr.length() - 1);
                parts = innerContent.split(",");
                logger.debug("Parsing PostgreSQL vector format with {} parts", parts.length);
            } else {
                // Legacy comma-separated format: "0.1,0.2,0.3,..."
                parts = embeddingStr.split(",");
                logger.debug("Parsing legacy comma-separated format with {} parts", parts.length);
            }

            if (parts.length == 0) {
                logger.warn("No embedding parts found for interaction {}", interactionId);
                return null;
            }

            float[] embedding = new float[parts.length];
            int validValues = 0;
            int invalidValues = 0;

            for (int i = 0; i < parts.length; i++) {
                try {
                    String part = parts[i].trim();
                    if (part.isEmpty()) {
                        logger.warn("Empty embedding value at index {} for interaction {}", i, interactionId);
                        embedding[i] = 0.0f;
                        invalidValues++;
                        continue;
                    }

                    embedding[i] = Float.parseFloat(part);
                    validValues++;
                } catch (NumberFormatException e) {
                    logger.warn("Failed to parse embedding value at index {} for interaction {}: '{}', using 0.0",
                               i, interactionId, parts[i].trim());
                    embedding[i] = 0.0f;
                    invalidValues++;
                }
            }

            // Check if we have a reasonable number of valid values
            double validRatio = (double) validValues / parts.length;
            if (validRatio < 0.8) { // Less than 80% valid values
                logger.error("Too many invalid embedding values for interaction {} ({}/{} valid), skipping",
                            interactionId, validValues, parts.length);
                return null;
            }

            logger.debug("Successfully parsed embedding for interaction {} with {}/{} valid values ({}% success)",
                        interactionId, validValues, parts.length, Math.round(validRatio * 100));
            return embedding;

        } catch (Exception e) {
            logger.error("Failed to parse embedding for interaction {}: {}", interactionId, e.getMessage());
            return null;
        }
    }

    /**
     * Convert float array to PostgreSQL vector format for database storage
     * PostgreSQL vector format requires [value1,value2,value3,...]
     */
    private String formatEmbeddingForDatabase(float[] embedding) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(embedding[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}
