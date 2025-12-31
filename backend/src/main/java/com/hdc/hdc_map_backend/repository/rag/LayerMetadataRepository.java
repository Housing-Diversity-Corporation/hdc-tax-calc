package com.hdc.hdc_map_backend.repository.rag;

import com.hdc.hdc_map_backend.entity.rag.LayerMetadataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LayerMetadataRepository extends JpaRepository<LayerMetadataEntity, Integer> {

    Optional<LayerMetadataEntity> findByLayerId(String layerId);

    // Note: pgvector <=> operator and vector type are PostgreSQL-specific
    // IDE may show SQL syntax errors as it defaults to MySQL validation
    @Query(value = "SELECT * FROM rag_schema.layer_metadata " +
            "WHERE description_embedding IS NOT NULL " +
            "AND (" +
            "    1 - (description_embedding <=> cast(:embedding as vector)) > 0.3 " +
            "    OR layer_id ILIKE :queryPattern " +
            "    OR display_name ILIKE :queryPattern " +
            "    OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE :queryPattern) " +
            "    OR EXISTS (SELECT 1 FROM unnest(common_queries) AS cq WHERE cq ILIKE :queryPattern) " +
            ") " +
            "ORDER BY 1 - (description_embedding <=> cast(:embedding as vector)) DESC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<LayerMetadataEntity> findRelevantLayers(@Param("embedding") String embedding,
                                                 @Param("queryPattern") String queryPattern,
                                                 @Param("limit") int limit);

    @Query(value = "SELECT * FROM rag_schema.layer_metadata " +
            "WHERE layer_id ILIKE :queryPattern " +
            "   OR display_name ILIKE :queryPattern " +
            "   OR description ILIKE :queryPattern " +
            "   OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE :queryPattern) " +
            "   OR EXISTS (SELECT 1 FROM unnest(common_queries) AS cq WHERE cq ILIKE :queryPattern) " +
            "LIMIT :limit",
            nativeQuery = true)
    List<LayerMetadataEntity> findByKeywords(@Param("queryPattern") String queryPattern,
                                             @Param("limit") int limit);
}