/**
 * Deal Benefit Profile Service
 *
 * HTTP service for persisting and retrieving deal benefit profiles.
 * Backend endpoints will be implemented by Angel.
 */

import api from './api';
import type { DealBenefitProfile } from '../types/dealBenefitProfile';

export const dbpService = {
  save: async (dbp: DealBenefitProfile): Promise<DealBenefitProfile> => {
    const response = await api.post<DealBenefitProfile>('/deal-benefit-profiles', dbp);
    return response.data;
  },

  getAll: async (): Promise<DealBenefitProfile[]> => {
    const response = await api.get<DealBenefitProfile[]>('/deal-benefit-profiles');
    return response.data;
  },

  getById: async (id: number): Promise<DealBenefitProfile> => {
    const response = await api.get<DealBenefitProfile>(`/deal-benefit-profiles/${id}`);
    return response.data;
  },

  getByConfigId: async (configId: number): Promise<DealBenefitProfile[]> => {
    const response = await api.get<DealBenefitProfile[]>(`/deal-benefit-profiles/config/${configId}`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/deal-benefit-profiles/${id}`);
  },
};
