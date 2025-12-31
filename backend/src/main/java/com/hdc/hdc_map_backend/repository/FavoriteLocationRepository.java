package com.hdc.hdc_map_backend.repository;

import com.hdc.hdc_map_backend.entity.FavoriteLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FavoriteLocationRepository extends JpaRepository<FavoriteLocation, Long> {
    List<FavoriteLocation> findByUserId(Long userId);
}
