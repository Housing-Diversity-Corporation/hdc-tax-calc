package com.hdc.hdc_map_backend.dto.taxBenefits;

import com.hdc.hdc_map_backend.entity.taxBenefits.DealBenefitProfile;
import com.hdc.hdc_map_backend.entity.taxBenefits.InvestmentPool;

import java.util.List;

/**
 * Response wrapper for a pool with its member deals.
 */
public class PoolWithDealsResponse {

    private InvestmentPool pool;
    private List<DealBenefitProfile> deals;

    public PoolWithDealsResponse() {}

    public PoolWithDealsResponse(InvestmentPool pool, List<DealBenefitProfile> deals) {
        this.pool = pool;
        this.deals = deals;
    }

    public InvestmentPool getPool() {
        return pool;
    }

    public void setPool(InvestmentPool pool) {
        this.pool = pool;
    }

    public List<DealBenefitProfile> getDeals() {
        return deals;
    }

    public void setDeals(List<DealBenefitProfile> deals) {
        this.deals = deals;
    }
}
