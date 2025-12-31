package com.hdc.hdc_map_backend.repository.user;

import com.hdc.hdc_map_backend.entity.CalculatorConfiguration;
import com.hdc.hdc_map_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CalculatorConfigurationRepository extends JpaRepository<CalculatorConfiguration, Long> {
    
    List<CalculatorConfiguration> findByUserOrderByCreatedAtDesc(User user);
    
    List<CalculatorConfiguration> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    Optional<CalculatorConfiguration> findByUserAndIsDefaultTrue(User user);
    
    Optional<CalculatorConfiguration> findByIdAndUser(Long id, User user);
    
    @Query("SELECT c FROM CalculatorConfiguration c WHERE c.user = :user AND c.configurationName = :name")
    Optional<CalculatorConfiguration> findByUserAndConfigurationName(@Param("user") User user, @Param("name") String name);
    
    void deleteByIdAndUser(Long id, User user);
    
    @Query("UPDATE CalculatorConfiguration c SET c.isDefault = false WHERE c.user = :user AND c.isDefault = true")
    void clearDefaultForUser(@Param("user") User user);

    // Get all configurations from all users for collaboration
    List<CalculatorConfiguration> findAllByOrderByCreatedAtDesc();
}