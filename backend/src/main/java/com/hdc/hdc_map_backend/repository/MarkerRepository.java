package com.hdc.hdc_map_backend.repository;

import com.hdc.hdc_map_backend.entity.Marker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarkerRepository extends JpaRepository<Marker, Long> {
    List<Marker> findByUserId(Long userId);
}
