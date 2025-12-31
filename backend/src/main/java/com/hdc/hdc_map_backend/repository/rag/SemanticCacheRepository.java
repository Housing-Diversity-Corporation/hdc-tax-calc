package com.hdc.hdc_map_backend.repository.rag;

import com.hdc.hdc_map_backend.entity.rag.SemanticCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SemanticCacheRepository extends JpaRepository<SemanticCache, Integer> {

    Optional<SemanticCache> findByQueryHash(String queryHash);

    // Note: pgvector <=> operator is PostgreSQL-specific for cosine distance
    // IDE may show SQL syntax errors as it defaults to MySQL validation
    @Query(value = "SELECT * FROM rag_schema.semantic_cache " +
            "WHERE query_embedding <=> cast(:embedding as vector) < 0.1 " +
            "ORDER BY query_embedding <=> cast(:embedding as vector) " +
            "LIMIT 1",
            nativeQuery = true)
    Optional<SemanticCache> findBySimilarEmbedding(@Param("embedding") String embedding);
}