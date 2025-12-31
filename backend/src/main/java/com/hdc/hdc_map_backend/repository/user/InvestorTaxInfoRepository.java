package com.hdc.hdc_map_backend.repository.user;

import com.hdc.hdc_map_backend.entity.InvestorTaxInfo;
import com.hdc.hdc_map_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestorTaxInfoRepository extends JpaRepository<InvestorTaxInfo, Long> {

    List<InvestorTaxInfo> findByUserOrderByCreatedAtDesc(User user);

    List<InvestorTaxInfo> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<InvestorTaxInfo> findByUserAndIsDefaultTrue(User user);

    Optional<InvestorTaxInfo> findByIdAndUser(Long id, User user);

    void deleteByIdAndUser(Long id, User user);

    @Query("UPDATE InvestorTaxInfo t SET t.isDefault = false WHERE t.user = :user AND t.isDefault = true")
    void clearDefaultForUser(@Param("user") User user);
}
