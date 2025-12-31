package com.hdc.hdc_map_backend.entity.rag;

import com.pgvector.PGvector;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Geometry;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "location_knowledge", schema = "rag_schema")
public class LocationKnowledge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "location_name", length = 255)
    private String locationName;

    @Column(name = "aliases", columnDefinition = "text[]")
    private String[] aliases;

    @Column(name = "location_embedding", columnDefinition = "vector(1024)")
    private PGvector locationEmbedding;

    @Column(name = "geometry", columnDefinition = "geometry")
    private Geometry geometry;

    @Column(name = "bounds", columnDefinition = "geometry")
    private Geometry bounds;

    @Column(name = "location_type", length = 100)
    private String locationType;

    @Column(name = "relevant_layers", columnDefinition = "text[]")
    private String[] relevantLayers;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "common_analyses", columnDefinition = "jsonb")
    private String commonAnalyses;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}