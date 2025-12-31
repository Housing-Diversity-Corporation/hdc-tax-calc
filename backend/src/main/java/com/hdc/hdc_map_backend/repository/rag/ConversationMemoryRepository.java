package com.hdc.hdc_map_backend.repository.rag;

import com.hdc.hdc_map_backend.entity.rag.ConversationMemory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationMemoryRepository extends JpaRepository<ConversationMemory, Integer> {

    List<ConversationMemory> findByUserIdAndSessionIdOrderByTurnNumberDesc(Integer userId, UUID sessionId, Pageable pageable);

    @Query("SELECT COALESCE(MAX(cm.turnNumber), 0) FROM ConversationMemory cm WHERE cm.sessionId = :sessionId")
    Integer findMaxTurnNumberBySessionId(@Param("sessionId") UUID sessionId);

    List<ConversationMemory> findByUserIdAndSessionIdOrderByTurnNumberAsc(Integer userId, UUID sessionId);

    @Query(value = """
        SELECT cm.*, (1 - (cm.content_embedding <=> CAST(:queryEmbedding AS vector))) as similarity
        FROM rag_schema.conversation_memory cm
        WHERE cm.user_id = :userId
        AND cm.content_embedding IS NOT NULL
        AND cm.session_id != CAST(:excludeSessionId AS uuid)
        ORDER BY cm.content_embedding <=> CAST(:queryEmbedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<ConversationMemory> findSimilarConversations(
        @Param("userId") Integer userId,
        @Param("queryEmbedding") String queryEmbedding,
        @Param("excludeSessionId") String excludeSessionId,
        @Param("limit") int limit
    );
}