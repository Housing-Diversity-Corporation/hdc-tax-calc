package com.hdc.hdc_map_backend.controller;

import com.hdc.hdc_map_backend.service.EmbeddingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/rag-admin")
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:5173", "https://hdc.angelfhr.com" })
public class RAGAdminController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmbeddingService embeddingService;

    /**
     * Initialize embeddings for all layer metadata
     */
    @PostMapping("/initialize-embeddings")
    public Map<String, Object> initializeEmbeddings() {
        Map<String, Object> result = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new ArrayList<>();

        try {
            // Get all layers that need embeddings
            String selectSql = """
                SELECT layer_id, display_name, description
                FROM rag_schema.layer_metadata
                WHERE description IS NOT NULL
            """;

            List<Map<String, Object>> layers = jdbcTemplate.queryForList(selectSql);

            for (Map<String, Object> layer : layers) {
                String layerId = (String) layer.get("layer_id");
                String description = (String) layer.get("description");
                String displayName = (String) layer.get("display_name");

                try {
                    // Combine display name and description for richer embedding
                    String textToEmbed = displayName + ". " + description;

                    // Generate embedding
                    float[] embedding = embeddingService.createEmbedding(textToEmbed);

                    // Check if we got a valid embedding
                    boolean isValid = false;
                    for (float v : embedding) {
                        if (v != 0.0f) {
                            isValid = true;
                            break;
                        }
                    }

                    if (isValid) {
                        // Update the database
                        String updateSql = """
                            UPDATE rag_schema.layer_metadata
                            SET description_embedding = ?::vector,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE layer_id = ?
                        """;

                        String embeddingStr = Arrays.toString(embedding);
                        jdbcTemplate.update(updateSql, embeddingStr, layerId);
                        successCount++;
                        System.out.println("✓ Updated embedding for: " + layerId);
                    } else {
                        failureCount++;
                        errors.add("Zero vector for layer: " + layerId);
                    }

                } catch (Exception e) {
                    failureCount++;
                    errors.add("Error for " + layerId + ": " + e.getMessage());
                    System.err.println("✗ Failed to update embedding for: " + layerId);
                }
            }

            result.put("status", "completed");
            result.put("totalLayers", layers.size());
            result.put("successCount", successCount);
            result.put("failureCount", failureCount);
            if (!errors.isEmpty()) {
                result.put("errors", errors);
            }

        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * Check embedding status for all layers
     */
    @GetMapping("/embedding-status")
    public Map<String, Object> checkEmbeddingStatus() {
        String sql = """
            SELECT
                layer_id,
                display_name,
                CASE
                    WHEN description_embedding IS NULL THEN 'No embedding'
                    WHEN description_embedding = ARRAY_FILL(0.0::float, ARRAY[1536])::vector THEN 'Placeholder (zeros)'
                    ELSE 'Valid embedding'
                END as embedding_status,
                updated_at
            FROM rag_schema.layer_metadata
            ORDER BY layer_id
        """;

        List<Map<String, Object>> status = jdbcTemplate.queryForList(sql);

        int validCount = 0;
        int placeholderCount = 0;
        int missingCount = 0;

        for (Map<String, Object> layer : status) {
            String embeddingStatus = (String) layer.get("embedding_status");
            switch (embeddingStatus) {
                case "Valid embedding" -> validCount++;
                case "Placeholder (zeros)" -> placeholderCount++;
                case "No embedding" -> missingCount++;
            }
        }

        return Map.of(
            "layers", status,
            "summary", Map.of(
                "total", status.size(),
                "valid", validCount,
                "placeholder", placeholderCount,
                "missing", missingCount
            )
        );
    }

    /**
     * Test embedding generation
     */
    @PostMapping("/test-embedding")
    public Map<String, Object> testEmbedding(@RequestBody Map<String, String> request) {
        String text = request.getOrDefault("text", "Test embedding for opportunity zones");

        try {
            float[] embedding = embeddingService.createEmbedding(text);

            // Calculate some statistics
            float min = Float.MAX_VALUE, max = Float.MIN_VALUE, sum = 0;
            int nonZeroCount = 0;

            for (float v : embedding) {
                if (v != 0) nonZeroCount++;
                min = Math.min(min, v);
                max = Math.max(max, v);
                sum += Math.abs(v);
            }

            return Map.of(
                "text", text,
                "embeddingSize", embedding.length,
                "nonZeroValues", nonZeroCount,
                "minValue", min,
                "maxValue", max,
                "l1Norm", sum,
                "first10Values", Arrays.copyOf(embedding, 10),
                "status", nonZeroCount > 0 ? "success" : "failed"
            );
        } catch (Exception e) {
            return Map.of(
                "error", e.getMessage(),
                "status", "error"
            );
        }
    }
}