package com.hdc.hdc_map_backend.entity.rag;

import com.pgvector.PGvector;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "layer_metadata", schema = "rag_schema")
public class LayerMetadataEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "layer_id", length = 255)
    private String layerId;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "description_embedding", columnDefinition = "vector(1024)")
    private PGvector descriptionEmbedding;

    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @Column(name = "data_source", length = 255)
    private String dataSource;

    @Column(name = "update_frequency", length = 100)
    private String updateFrequency;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "zoom_constraints", columnDefinition = "jsonb")
    private String zoomConstraints;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "available_filters", columnDefinition = "jsonb")
    private String availableFilters;

    @Column(name = "common_queries", columnDefinition = "text[]")
    private String[] commonQueries;

    @Column(name = "api_table_id", length = 255)
    private String apiTableId;

    @Column(name = "geometry_type", length = 50)
    private String geometryType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "feature_properties", columnDefinition = "jsonb")
    private String featureProperties;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}