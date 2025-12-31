package com.hdc.hdc_map_backend.repository;

import com.hdc.hdc_map_backend.entity.SavedKeywordSearch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedKeywordSearchRepository extends JpaRepository<SavedKeywordSearch, Long> {
    List<SavedKeywordSearch> findByUserId(Long userId);
}
