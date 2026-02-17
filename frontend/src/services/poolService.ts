/**
 * Investment Pool Service
 *
 * HTTP service for managing investment pools and their associated deals.
 * Wired to backend InvestmentPoolController endpoints.
 */

import api from './api';
import type { DealBenefitProfile, InvestmentPool } from '../types/dealBenefitProfile';

export const poolService = {
  create: async (poolName: string, description?: string): Promise<InvestmentPool> => {
    const response = await api.post<InvestmentPool>('/investment-pools', {
      poolName,
      description,
      status: 'modeling',
    });
    return response.data;
  },

  getAll: async (): Promise<InvestmentPool[]> => {
    const response = await api.get<InvestmentPool[]>('/investment-pools');
    return response.data;
  },

  /**
   * Get a pool with all its member deals.
   * Uses the /deals sub-resource endpoint that returns PoolWithDealsResponse.
   */
  getWithDeals: async (id: number): Promise<{ pool: InvestmentPool; deals: DealBenefitProfile[] }> => {
    const response = await api.get<{ pool: InvestmentPool; deals: DealBenefitProfile[] }>(
      `/investment-pools/${id}/deals`
    );
    return response.data;
  },

  update: async (id: number, updates: Partial<InvestmentPool>): Promise<InvestmentPool> => {
    const response = await api.put<InvestmentPool>(`/investment-pools/${id}`, updates);
    return response.data;
  },

  /**
   * Add a deal to a pool. Both IDs are path params (no request body).
   * Returns 409 CONFLICT if the deal is already in the pool.
   */
  addDeal: async (poolId: number, dbpId: number): Promise<void> => {
    await api.post(`/investment-pools/${poolId}/deals/${dbpId}`);
  },

  removeDeal: async (poolId: number, dbpId: number): Promise<void> => {
    await api.delete(`/investment-pools/${poolId}/deals/${dbpId}`);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/investment-pools/${id}`);
  },
};
