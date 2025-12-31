import api from '../api';
import type { IntersectionPayload, IntersectionResponse } from '../../types/map/intersection';

/**
 * Intersection Service
 * Handles all intersection-related API calls
 */
export class IntersectionService {
  private static readonly TIMEOUT_MS = 120000; // 2 minutes
  private static readonly ENDPOINT = '/geodata/intersection';

  /**
   * Perform spatial intersection on multiple layers
   */
  static async performIntersection(payload: IntersectionPayload): Promise<IntersectionResponse> {
    try {
      console.log('🚀 Sending intersection request with payload:', payload);

      const response = await api.post<IntersectionResponse>(
        this.ENDPOINT,
        payload,
        { timeout: this.TIMEOUT_MS }
      );

      console.log('✅ Intersection response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Intersection API error:', error);
      throw error;
    }
  }

  /**
   * Save intersection result to backend
   */
  static async saveIntersection(name: string, intersectionData: unknown): Promise<void> {
    try {
      await api.post('/intersections/save', {
        name,
        intersectionResult: JSON.stringify(intersectionData),
      });
      console.log('✅ Intersection saved successfully');
    } catch (error) {
      console.error('❌ Failed to save intersection:', error);
      throw error;
    }
  }

  /**
   * Export intersection data to CSV with table-prefixed columns
   * Excludes geometry data, focuses on property attributes
   */
  static async exportToCSV(intersectionData: import('geojson').FeatureCollection, filename: string): Promise<void> {
    try {
      const { exportIntersectionToCsv } = await import('../../utils/map/intersectionCsv');
      exportIntersectionToCsv(intersectionData as any, filename);
      console.log(`✅ CSV exported as ${filename}`);
    } catch (error) {
      console.error('❌ Failed to export CSV:', error);
      throw error;
    }
  }
}