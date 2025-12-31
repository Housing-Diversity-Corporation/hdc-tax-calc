package com.hdc.hdc_map_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmbeddingService {
    @Value("${bedrock.embedding.model:amazon.titan-embed-text-v2:0}")
    private String bedrockEmbeddingModel;

    @Value("${bedrock.region:us-east-2}")
    private String bedrockRegion;

    @Autowired(required = false)
    private BedrockRuntimeClient bedrockClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Cache for frequently used embeddings
    private final Map<String, float[]> embeddingCache = new ConcurrentHashMap<>();

    // Get embedding dimension based on model
    private int getEmbeddingDimension() {
        if (bedrockEmbeddingModel.contains("v2")) {
            return 1024; // Titan V2 uses 1024 dimensions
        } else if (bedrockEmbeddingModel.contains("v1")) {
            return 1536; // Titan V1 uses 1536 dimensions
        } else {
            return 1536; // Default OpenAI dimension
        }
    }

    /* Create embedding using AWS Bedrock Titan */
    public float[] createEmbedding(String text) {
        // Check cache first
        String cacheKey = text.toLowerCase().trim();
        if (embeddingCache.containsKey(cacheKey)) {
            return embeddingCache.get(cacheKey);
        }

        float[] embedding = null;

        if (bedrockClient != null) {
            embedding = createBedrockEmbedding(text);
        } else {
            System.err.println("Bedrock client not configured. Please set AWS credentials.");
            return new float[getEmbeddingDimension()];
        }

        // Cache the result
        if (embeddingCache.size() < 1000 && !isZeroVector(embedding)) {
            embeddingCache.put(cacheKey, embedding);
        }

        return embedding;
    }

    private boolean isZeroVector(float[] vector) {
        if (vector == null || vector.length == 0)
            return true;
        for (float v : vector) {
            if (v != 0.0f)
                return false;
        }
        return true;
    }

    /* Batch create embeddings for multiple texts using Bedrock */
    public Map<String, float[]> createBatchEmbeddings(List<String> texts) {
        Map<String, float[]> results = new HashMap<>();
        List<String> uncachedTexts = new ArrayList<>();

        // Check cache for existing embeddings
        for (String text : texts) {
            String cacheKey = text.toLowerCase().trim();
            if (embeddingCache.containsKey(cacheKey)) {
                results.put(text, embeddingCache.get(cacheKey));
            } else {
                uncachedTexts.add(text);
            }
        }

        // Process uncached texts in parallel using Bedrock
        if (!uncachedTexts.isEmpty()) {
            List<CompletableFuture<Map.Entry<String, float[]>>> futures = uncachedTexts.stream()
                    .map(text -> CompletableFuture.supplyAsync(() -> Map.entry(text, createBedrockEmbedding(text))))
                    .toList();

            futures.forEach(future -> {
                try {
                    Map.Entry<String, float[]> entry = future.get();
                    results.put(entry.getKey(), entry.getValue());
                    if (embeddingCache.size() < 1000) {
                        embeddingCache.put(entry.getKey().toLowerCase().trim(), entry.getValue());
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        return results;
    }

    /* Create embedding using AWS Bedrock (Titan Embeddings) */
    private float[] createBedrockEmbedding(String text) {
        if (bedrockClient == null) {
            System.err.println("Bedrock client not configured. Please set AWS credentials.");
            return new float[getEmbeddingDimension()];
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();

            // Titan V2 requires different request format
            if (bedrockEmbeddingModel.contains("v2")) {
                requestBody.put("inputText", text);
                requestBody.put("dimensions", 1024);
                requestBody.put("normalize", true);
            } else {
                requestBody.put("inputText", text);
            }

            String requestJson = objectMapper.writeValueAsString(requestBody);

            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId(bedrockEmbeddingModel)
                    .contentType("application/json")
                    .accept("application/json")
                    .body(SdkBytes.fromUtf8String(requestJson))
                    .build();

            InvokeModelResponse response = bedrockClient.invokeModel(request);

            String responseBody = response.body().asUtf8String();
            Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
            List<Double> embedding = (List<Double>) responseMap.get("embedding");

            if (embedding == null || embedding.isEmpty()) {
                System.err.println("Bedrock returned empty embedding");
                return new float[getEmbeddingDimension()];
            }

            float[] result = new float[embedding.size()];
            for (int i = 0; i < embedding.size(); i++) {
                result[i] = embedding.get(i).floatValue();
            }

            System.out.println("Successfully generated Bedrock embedding (size: " + result.length + ")");
            return result;

        } catch (Exception e) {
            System.err.println("Bedrock embedding error: " + e.getMessage());
            e.printStackTrace();
            return new float[getEmbeddingDimension()];
        }
    }

    /* Calculate cosine similarity between two embeddings */
    public float cosineSimilarity(float[] embedding1, float[] embedding2) {
        if (embedding1.length != embedding2.length) {
            throw new IllegalArgumentException("Embeddings must have the same dimension");
        }

        float dotProduct = 0.0f;
        float norm1 = 0.0f;
        float norm2 = 0.0f;

        for (int i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        return dotProduct / (float) (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Find k nearest neighbors from a set of embeddings
     */
    public List<Integer> findKNearestNeighbors(float[] queryEmbedding,
            List<float[]> embeddings,
            int k) {
        // Calculate similarities
        List<Map.Entry<Integer, Float>> similarities = new ArrayList<>();
        for (int i = 0; i < embeddings.size(); i++) {
            float similarity = cosineSimilarity(queryEmbedding, embeddings.get(i));
            similarities.add(Map.entry(i, similarity));
        }

        // Sort by similarity (descending)
        similarities.sort((a, b) -> Float.compare(b.getValue(), a.getValue()));

        // Return top k indices
        return similarities.stream()
                .limit(k)
                .map(Map.Entry::getKey)
                .toList();
    }
}