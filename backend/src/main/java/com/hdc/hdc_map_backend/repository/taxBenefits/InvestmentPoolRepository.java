package com.hdc.hdc_map_backend.repository.taxBenefits;

import com.hdc.hdc_map_backend.entity.taxBenefits.InvestmentPool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvestmentPoolRepository extends JpaRepository<InvestmentPool, Long> {
}
