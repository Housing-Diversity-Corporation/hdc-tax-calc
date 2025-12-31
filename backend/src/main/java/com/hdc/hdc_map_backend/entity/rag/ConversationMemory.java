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
@Table(name = "conversation_memory", schema = "rag_schema")
public class ConversationMemory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "session_id")
    private UUID sessionId;

    @Column(name = "turn_number")
    private Integer turnNumber;

    @Column(name = "role", length = 50)
    private String role;

    @Column(name = "content", columnDefinition = "text")
    private String content;

    @Column(name = "content_embedding", columnDefinition = "vector(1024)")
    private PGvector contentEmbedding;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extracted_entities", columnDefinition = "jsonb")
    private String extractedEntities;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "map_state", columnDefinition = "jsonb")
    private String mapState;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}