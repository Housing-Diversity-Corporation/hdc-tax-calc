package com.hdc.hdc_map_backend.repository.user;

import com.hdc.hdc_map_backend.entity.PropertyPreset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyPresetRepository extends JpaRepository<PropertyPreset, Long> {

    Optional<PropertyPreset> findByPresetId(String presetId);

    List<PropertyPreset> findByIsActiveTrueOrderByCreatedAtDesc();

    List<PropertyPreset> findByCategoryAndIsActiveTrueOrderByCreatedAtDesc(String category);

    List<PropertyPreset> findByIsActiveTrue();
}
