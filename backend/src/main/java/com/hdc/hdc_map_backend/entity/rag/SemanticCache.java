package com.hdc.hdc_map_backend.entity.rag;

import com.pgvector.PGvector;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "semantic_cache", schema = "rag_schema")
public class SemanticCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "query_embedding", columnDefinition = "vector(1024)")
    private PGvector queryEmbedding;

    @Column(name = "query_hash", length = 255)
    private String queryHash;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_actions", columnDefinition = "jsonb")
    private String responseActions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "hit_count")
    private Integer hitCount;

    @Column(name = "last_accessed")
    private LocalDateTime lastAccessed;

    @Column(name = "ttl_hours")
    private Integer ttlHours;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (hitCount == null) {
            hitCount = 0;
        }
    }
}