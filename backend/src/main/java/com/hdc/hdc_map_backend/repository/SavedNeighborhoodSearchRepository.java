package com.hdc.hdc_map_backend.repository;

import com.hdc.hdc_map_backend.entity.SavedNeighborhoodSearch;
import com.hdc.hdc_map_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedNeighborhoodSearchRepository extends JpaRepository<SavedNeighborhoodSearch, Long> {

    /**
     * Find all saved neighborhood searches for a user, ordered by creation date (newest first)
     */
    List<SavedNeighborhoodSearch> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Find a specific saved search by ID and user (for security - ensures user owns the search)
     */
    Optional<SavedNeighborhoodSearch> findByIdAndUser(Long id, User user);

    /**
     * Find saved searches by user ID
     */
    List<SavedNeighborhoodSearch> findByUserId(Long userId);

    /**
     * Count saved searches for a user
     */
    long countByUser(User user);
}
