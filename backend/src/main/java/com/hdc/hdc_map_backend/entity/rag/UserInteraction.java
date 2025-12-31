package com.hdc.hdc_map_backend.entity.rag;

import com.pgvector.PGvector;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "user_interactions", schema = "rag_schema")
public class UserInteraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "query_text", columnDefinition = "text")
    private String queryText;

    @Column(name = "query_embedding", columnDefinition = "vector(1024)")
    private PGvector queryEmbedding;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "actions_taken", columnDefinition = "jsonb")
    private String actionsTaken;

    @Column(name = "layers_involved", columnDefinition = "text[]")
    private String[] layersInvolved;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "location_context", columnDefinition = "jsonb")
    private String locationContext;

    @Column(name = "success_rating")
    private Integer successRating;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "session_id")
    private UUID sessionId;

    @Column(name = "execution_time_ms")
    private Integer executionTimeMs;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}