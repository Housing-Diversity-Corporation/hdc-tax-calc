package com.hdc.hdc_map_backend.repository.taxBenefits;

import com.hdc.hdc_map_backend.entity.taxBenefits.DealConduit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DealConduitRepository extends JpaRepository<DealConduit, Long> {

    List<DealConduit> findByIsPresetTrueOrderByCreatedAtDesc();

    List<DealConduit> findByIsPresetFalseOrderByCreatedAtDesc();

    @Query("SELECT dc FROM DealConduit dc JOIN dc.portalSettings ps WHERE ps.userId = :userId AND dc.isPreset = false ORDER BY dc.createdAt DESC")
    List<DealConduit> findUserConfigurations(@Param("userId") Long userId);

    @Query("SELECT dc FROM DealConduit dc JOIN dc.portalSettings ps WHERE dc.isPreset = false ORDER BY dc.createdAt DESC")
    List<DealConduit> findAllConfigurations();

    @Query("SELECT dc FROM DealConduit dc JOIN dc.portalSettings ps WHERE ps.userId = :userId AND ps.isDefault = true AND dc.isPreset = false")
    Optional<DealConduit> findUserDefault(@Param("userId") Long userId);

    @Query("SELECT dc FROM DealConduit dc JOIN dc.portalSettings ps WHERE ps.isActive = true AND dc.isPreset = true ORDER BY dc.createdAt DESC")
    List<DealConduit> findActivePresets();

    @Query("SELECT dc FROM DealConduit dc JOIN dc.portalSettings ps WHERE ps.category = :category AND ps.isActive = true AND dc.isPreset = true ORDER BY dc.createdAt DESC")
    List<DealConduit> findActivePresetsByCategory(@Param("category") String category);
}
