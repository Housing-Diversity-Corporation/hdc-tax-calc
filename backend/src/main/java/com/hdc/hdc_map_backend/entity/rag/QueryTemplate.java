package com.hdc.hdc_map_backend.entity.rag;

import com.pgvector.PGvector;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Data
@Entity
@Table(name = "query_templates", schema = "rag_schema")
public class QueryTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "template_text", columnDefinition = "text")
    private String templateText;

    @Column(name = "template_embedding", columnDefinition = "vector(1024)")
    private PGvector templateEmbedding;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "action_sequence", columnDefinition = "jsonb")
    private String actionSequence;

    @Column(name = "required_layers", columnDefinition = "text[]")
    private String[] requiredLayers;

    @Column(name = "optional_layers", columnDefinition = "text[]")
    private String[] optionalLayers;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parameter_slots", columnDefinition = "jsonb")
    private String parameterSlots;

    @Column(name = "usage_count")
    private Integer usageCount;

    @Column(name = "success_rate")
    private Double successRate;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "is_public")
    private Boolean isPublic;

    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @PrePersist
    protected void onCreate() {
        if (usageCount == null) {
            usageCount = 0;
        }
        if (isPublic == null) {
            isPublic = false;
        }
    }
}