package com.hdc.hdc_map_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Service
public class FeedbackService {

    private static final Logger logger = LoggerFactory.getLogger(FeedbackService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmbeddingService embeddingService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Store user feedback for an interaction
     */
    @Transactional
    public void storeFeedback(Long userId, Integer interactionId, String feedbackType,
                             Map<String, Object> additionalData) {
        try {
            logger.info("Storing feedback for user {} interaction {}: {}",
                       userId, interactionId, feedbackType);

            // Convert feedback type to success rating
            Integer successRating = convertFeedbackToRating(feedbackType);

            // Update user_interactions table
            String updateInteractionSql = """
                    UPDATE rag_schema.user_interactions
                    SET success_rating = ?
                    WHERE id = ? AND user_id = ?
                """;

            int updated = jdbcTemplate.update(updateInteractionSql,
                                            successRating, interactionId, userId.intValue());

            if (updated == 0) {
                logger.warn("No interaction found to update for user {} interaction {}",
                           userId, interactionId);
                return;
            }

            // Get interaction details for analytics
            String getInteractionSql = """
                    SELECT query_text, query_embedding, actions_taken, layers_involved,
                           execution_time_ms, created_at
                    FROM rag_schema.user_interactions
                    WHERE id = ? AND user_id = ?
                """;

            jdbcTemplate.query(getInteractionSql, rs -> {
                if (rs.next()) {
                    try {
                        // Store in rag_analytics for detailed feedback analysis
                        String analyticsQuery = rs.getString("query_text");
                        String actionsJson = rs.getString("actions_taken");
                        Integer executionTime = rs.getInt("execution_time_ms");

                    // Calculate relevance scores based on feedback
                    double[] relevanceScores = calculateRelevanceScores(feedbackType, actionsJson);

                    // Prepare retrieved contexts (simplified for now)
                    Map<String, Object> contexts = new HashMap<>();
                    contexts.put("feedback_type", feedbackType);
                    contexts.put("interaction_id", interactionId);
                    if (additionalData != null) {
                        contexts.put("additional_data", additionalData);
                    }

                    String contextJson = objectMapper.writeValueAsString(contexts);

                    // Insert into rag_analytics
                    String insertAnalyticsSql = """
                            INSERT INTO rag_schema.rag_analytics
                            (user_id, query_id, retrieval_method, retrieved_contexts,
                             relevance_scores, llm_model, response_time_ms, user_feedback)
                            VALUES (?, ?, 'hybrid_rag', ?::jsonb, ?, 'claude-3.5-sonnet', ?, ?)
                        """;

                    jdbcTemplate.update(insertAnalyticsSql,
                                      userId.intValue(),
                                      interactionId,
                                      contextJson,
                                      relevanceScores,
                                      executionTime,
                                      feedbackType);

                        logger.info("Successfully stored feedback analytics for interaction {}", interactionId);

                    } catch (Exception e) {
                        logger.error("Failed to store feedback analytics: {}", e.getMessage());
                    }
                }
                return null;
            }, interactionId, userId.intValue());

        } catch (Exception e) {
            logger.error("Failed to store feedback for user {} interaction {}: {}",
                        userId, interactionId, e.getMessage());
            throw new RuntimeException("Failed to store feedback", e);
        }
    }

    /**
     * Get user feedback statistics
     */
    public Map<String, Object> getUserFeedbackStats(Long userId, int days) {
        try {
            String sql = """
                    SELECT
                        COUNT(*) as total_interactions,
                        COUNT(CASE WHEN success_rating >= 4 THEN 1 END) as positive_feedback,
                        COUNT(CASE WHEN success_rating <= 2 THEN 1 END) as negative_feedback,
                        AVG(success_rating::decimal) as avg_rating,
                        COUNT(CASE WHEN success_rating IS NOT NULL THEN 1 END) as rated_interactions
                    FROM rag_schema.user_interactions
                    WHERE user_id = ?
                        AND created_at >= NOW() - INTERVAL '%d days'
                """.formatted(days);

            return jdbcTemplate.query(sql, rs -> {
                Map<String, Object> stats = new HashMap<>();
                if (rs.next()) {
                    stats.put("totalInteractions", rs.getInt("total_interactions"));
                    stats.put("positiveFeedback", rs.getInt("positive_feedback"));
                    stats.put("negativeFeedback", rs.getInt("negative_feedback"));
                    stats.put("averageRating", rs.getBigDecimal("avg_rating"));
                    stats.put("ratedInteractions", rs.getInt("rated_interactions"));

                    // Calculate satisfaction rate
                    int total = rs.getInt("rated_interactions");
                    int positive = rs.getInt("positive_feedback");
                    double satisfactionRate = total > 0 ? (positive * 100.0 / total) : 0.0;
                    stats.put("satisfactionRate", satisfactionRate);
                }
                return stats;
            }, userId.intValue());

        } catch (Exception e) {
            logger.error("Failed to get user feedback stats: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    /**
     * Get recent feedback trends
     */
    public List<Map<String, Object>> getFeedbackTrends(Long userId, int days) {
        try {
            String sql = """
                    SELECT
                        DATE(created_at) as date,
                        COUNT(*) as interactions,
                        AVG(success_rating::decimal) as avg_rating,
                        COUNT(CASE WHEN success_rating >= 4 THEN 1 END) as positive_count
                    FROM rag_schema.user_interactions
                    WHERE user_id = ?
                        AND created_at >= NOW() - INTERVAL '%d days'
                        AND success_rating IS NOT NULL
                    GROUP BY DATE(created_at)
                    ORDER BY date DESC
                """.formatted(days);

            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> trend = new HashMap<>();
                trend.put("date", rs.getDate("date").toString());
                trend.put("interactions", rs.getInt("interactions"));
                trend.put("averageRating", rs.getBigDecimal("avg_rating"));
                trend.put("positiveCount", rs.getInt("positive_count"));
                return trend;
            }, userId.intValue());

        } catch (Exception e) {
            logger.error("Failed to get feedback trends: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Get analytics for improving RAG performance
     */
    public Map<String, Object> getRAGAnalytics(int days) {
        try {
            String sql = """
                    SELECT
                        ra.user_feedback,
                        COUNT(*) as count,
                        AVG(ra.response_time_ms) as avg_response_time,
                        AVG(array_length(ra.relevance_scores, 1)) as avg_contexts_used
                    FROM rag_schema.rag_analytics ra
                    WHERE ra.created_at >= NOW() - INTERVAL '%d days'
                    GROUP BY ra.user_feedback
                    ORDER BY count DESC
                """.formatted(days);

            List<Map<String, Object>> results = jdbcTemplate.query(sql, (rs, rowNum) -> {
                Map<String, Object> analytics = new HashMap<>();
                analytics.put("feedbackType", rs.getString("user_feedback"));
                analytics.put("count", rs.getInt("count"));
                analytics.put("avgResponseTime", rs.getInt("avg_response_time"));
                analytics.put("avgContextsUsed", rs.getDouble("avg_contexts_used"));
                return analytics;
            });

            // Overall stats
            String overallSql = """
                    SELECT
                        COUNT(*) as total_analytics,
                        COUNT(CASE WHEN user_feedback IN ('dog_treat', 'positive', 'thumbs_up') THEN 1 END) as positive_count,
                        AVG(response_time_ms) as avg_response_time
                    FROM rag_schema.rag_analytics
                    WHERE created_at >= NOW() - INTERVAL '%d days'
                """.formatted(days);

            Map<String, Object> overall = jdbcTemplate.query(overallSql, rs -> {
                Map<String, Object> stats = new HashMap<>();
                if (rs.next()) {
                    stats.put("totalAnalytics", rs.getInt("total_analytics"));
                    stats.put("positiveCount", rs.getInt("positive_count"));
                    stats.put("avgResponseTime", rs.getInt("avg_response_time"));
                }
                return stats;
            });

            Map<String, Object> analytics = new HashMap<>();
            analytics.put("feedbackBreakdown", results);
            analytics.put("overallStats", overall);

            return analytics;

        } catch (Exception e) {
            logger.error("Failed to get RAG analytics: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    /**
     * Convert feedback type to success rating (1-5 scale)
     * Updated for Churro's dog treat system! 🐕
     */
    private Integer convertFeedbackToRating(String feedbackType) {
        return switch (feedbackType.toLowerCase()) {
            case "dog_treat", "thumbs_up", "positive", "excellent" -> 5; // Churro gets a treat!
            case "good", "helpful" -> 4;
            case "neutral", "okay" -> 3;
            case "poor", "unhelpful" -> 2;
            case "no_treat", "thumbs_down", "negative", "terrible" -> 1; // No treat this time
            default -> 3; // Default to neutral
        };
    }

    /**
     * Calculate relevance scores based on feedback and actions
     */
    private double[] calculateRelevanceScores(String feedbackType, String actionsJson) {
        try {
            // Simple relevance scoring based on feedback (updated for dog treats!)
            double baseScore = switch (feedbackType.toLowerCase()) {
                case "dog_treat", "thumbs_up", "positive" -> 0.9; // Churro did great!
                case "good" -> 0.7;
                case "neutral" -> 0.5;
                case "poor" -> 0.3;
                case "no_treat", "thumbs_down", "negative" -> 0.1; // Churro needs more training
                default -> 0.5;
            };

            // For now, return simple scores. This can be enhanced with more sophisticated scoring
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> actions = objectMapper.readValue(
                actionsJson != null ? actionsJson : "[]",
                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            double[] scores = new double[Math.max(1, actions.size())];
            Arrays.fill(scores, baseScore);

            return scores;

        } catch (Exception e) {
            logger.warn("Failed to calculate relevance scores: {}", e.getMessage());
            return new double[]{0.5}; // Default neutral score
        }
    }
}