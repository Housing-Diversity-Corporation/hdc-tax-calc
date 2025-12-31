package com.hdc.hdc_map_backend.entity.rag;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "rag_analytics", schema = "rag_schema")
public class RagAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "query_id")
    private Integer queryId;

    @Column(name = "retrieval_method", length = 100)
    private String retrievalMethod;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "retrieved_contexts", columnDefinition = "jsonb")
    private String retrievedContexts;

    @Column(name = "relevance_scores", columnDefinition = "float[]")
    private Float[] relevanceScores;

    @Column(name = "llm_model", length = 100)
    private String llmModel;

    @Column(name = "response_time_ms")
    private Integer responseTimeMs;

    @Column(name = "user_feedback", length = 50)
    private String userFeedback;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}