package com.hdc.hdc_map_backend.entity.rag;

import com.pgvector.PGvector;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_patterns", schema = "rag_schema")
public class UserPattern {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "pattern_type", length = 50)
    private String patternType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "pattern_data", columnDefinition = "jsonb")
    private String patternData;

    @Column(name = "frequency")
    private Integer frequency;

    @Column(name = "last_used")
    private LocalDateTime lastUsed;

    @Column(name = "context_embedding", columnDefinition = "vector(1024)")
    private PGvector contextEmbedding;

    @Column(name = "confidence_score")
    private Double confidenceScore;
}