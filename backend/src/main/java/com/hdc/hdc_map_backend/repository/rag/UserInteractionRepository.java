package com.hdc.hdc_map_backend.repository.rag;

import com.hdc.hdc_map_backend.entity.rag.UserInteraction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction, Integer> {

    // Note: The <=> operator is PostgreSQL pgvector-specific for cosine distance
    // IDE may show SQL syntax errors as it defaults to MySQL validation
    @Query(value = "SELECT * FROM rag_schema.user_interactions " +
            "WHERE user_id = :userId " +
            "AND success_rating >= 4 " +
            "ORDER BY query_embedding <=> cast(:embedding as vector) " +
            "LIMIT :limit",
            nativeQuery = true)
    List<UserInteraction> findSimilarUserInteractions(@Param("userId") Integer userId,
                                                      @Param("embedding") String embedding,
                                                      @Param("limit") int limit);

    @Query(value = "SELECT * FROM rag_schema.user_interactions " +
            "WHERE success_rating >= 4 " +
            "ORDER BY query_embedding <=> cast(:embedding as vector) " +
            "LIMIT :limit",
            nativeQuery = true)
    List<UserInteraction> findSimilarGlobalInteractions(@Param("embedding") String embedding,
                                                        @Param("limit") int limit);

    List<UserInteraction> findByUserIdAndSessionIdOrderByCreatedAtDesc(Integer userId, UUID sessionId);
}