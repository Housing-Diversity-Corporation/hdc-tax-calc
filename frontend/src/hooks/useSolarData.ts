import { useState, useCallback } from 'react';
import { getSolarAnalysis, formatSolarDataHtml } from '../services/solarService';
import type { SolarAnalysis } from '../types/solar';

/**
 * Hook to manage solar data fetching and caching
 */
export const useSolarData = (apiKey: string) => {
  const [cache, setCache] = useState<Map<string, SolarAnalysis>>(new Map());
  const [loading, setLoading] = useState<Map<string, boolean>>(new Map());

  /**
   * Fetch solar data for a location (with caching)
   */
  const fetchSolarData = useCallback(
    async (lat: number, lng: number): Promise<SolarAnalysis | null> => {
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;

      // Check cache first
      if (cache.has(key)) {
        return cache.get(key)!;
      }

      // Check if already loading
      if (loading.get(key)) {
        return null;
      }

      try {
        setLoading(prev => new Map(prev).set(key, true));
        const analysis = await getSolarAnalysis(lat, lng, apiKey);

        // Cache the result
        setCache(prev => new Map(prev).set(key, analysis));

        return analysis;
      } catch (error) {
        console.error('Error fetching solar data:', error);
        return null;
      } finally {
        setLoading(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      }
    },
    [apiKey, cache, loading]
  );

  /**
   * Get formatted HTML for solar data (for info windows)
   */
  const getSolarHtml = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      const analysis = await fetchSolarData(lat, lng);
      if (!analysis) {
        return '';
      }
      return formatSolarDataHtml(analysis);
    },
    [fetchSolarData]
  );

  /**
   * Clear the cache (useful for managing memory)
   */
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    fetchSolarData,
    getSolarHtml,
    clearCache,
    cacheSize: cache.size,
  };
};
