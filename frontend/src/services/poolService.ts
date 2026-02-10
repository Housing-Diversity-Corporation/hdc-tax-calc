/**
 * Investment Pool Service
 *
 * HTTP service for managing investment pools and their associated deals.
 * Backend endpoints will be implemented by Angel.
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

  getWithDeals: async (id: number): Promise<{ pool: InvestmentPool; deals: DealBenefitProfile[] }> => {
    const response = await api.get<{ pool: InvestmentPool; deals: DealBenefitProfile[] }>(`/investment-pools/${id}`);
    return response.data;
  },

  update: async (id: number, updates: Partial<InvestmentPool>): Promise<InvestmentPool> => {
    const response = await api.put<InvestmentPool>(`/investment-pools/${id}`, updates);
    return response.data;
  },

  addDeal: async (poolId: number, dbpId: number): Promise<void> => {
    await api.post(`/investment-pools/${poolId}/deals`, { dbpId });
  },

  removeDeal: async (poolId: number, dbpId: number): Promise<void> => {
    await api.delete(`/investment-pools/${poolId}/deals/${dbpId}`);
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/investment-pools/${id}`);
  },
};
