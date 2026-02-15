/**
 * Deal Benefit Profile Service
 *
 * HTTP service for persisting and retrieving deal benefit profiles.
 * Wired to backend DealBenefitProfileController endpoints.
 */

import api from './api';
import type { DealBenefitProfile, DealBenefitProfileView } from '../types/dealBenefitProfile';

export const dbpService = {
  /**
   * Extract and save a DBP for a given conduit.
   * Backend copies frozen snapshot columns from the conduit's input tables,
   * then persists the profile with an extraction timestamp.
   */
  save: async (conduitId: number, dbp: DealBenefitProfile): Promise<DealBenefitProfile> => {
    const response = await api.post<DealBenefitProfile>(
      `/deal-benefit-profiles/extract/${conduitId}`,
      dbp
    );
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

  /**
   * Get the enriched view (profile + source conduit context).
   */
  getView: async (id: number): Promise<DealBenefitProfileView> => {
    const response = await api.get<DealBenefitProfileView>(`/deal-benefit-profiles/${id}/view`);
    return response.data;
  },

  getByConduitId: async (conduitId: number): Promise<DealBenefitProfile[]> => {
    const response = await api.get<DealBenefitProfile[]>(
      `/deal-benefit-profiles/conduit/${conduitId}`
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/deal-benefit-profiles/${id}`);
  },
};
