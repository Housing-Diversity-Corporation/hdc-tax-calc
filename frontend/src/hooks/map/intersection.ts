import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { FeatureCollection } from 'geojson';
import { IntersectionService } from '../../services/map/intersection';
import { IntersectionUtils } from '../../utils/map/intersection';
import type { LayerConfig } from '../../types/map/intersection';

interface UseIntersectionProps {
  layers: LayerConfig[];
  map: google.maps.Map | null;
  seattleZoningFilters: Set<string>;
  seattleBaseZoneFilters: Set<string>;
  getLayersWithCurrentState: () => LayerConfig[];
  toggleLayer: (layerId: string) => void;
  addIntersectionLayer: (featureCollection: FeatureCollection) => void;
}

interface UseIntersectionReturn {
  isIntersecting: boolean;
  performIntersection: () => Promise<void>;
  saveIntersection: (name: string) => Promise<void>;
  exportIntersection: (filename: string) => Promise<void>;
}

/**
 * Custom hook for managing intersection operations
 * Follows Single Responsibility Principle - handles only intersection logic
 */
export function useIntersection({
  layers,
  map,
  seattleZoningFilters,
  seattleBaseZoneFilters,
  getLayersWithCurrentState,
  toggleLayer,
  addIntersectionLayer,
}: UseIntersectionProps): UseIntersectionReturn {
  const [isIntersecting, setIsIntersecting] = useState(false);

  /**
   * Perform spatial intersection on enabled layers
   */
  const performIntersection = useCallback(async () => {
    const currentLayers = getLayersWithCurrentState();
    const enabledLayers = currentLayers.filter(layer => layer.enabled);

    console.log('🔍 Intersection Debug - Enabled Layers:', enabledLayers.map(l => ({
      id: l.id,
      name: l.name,
      enabled: l.enabled,
      apiTableId: l.apiTableId
    })));

    // Extract and validate table IDs
    const tableIds = IntersectionUtils.extractTableIds(enabledLayers);
    const validation = IntersectionUtils.validateIntersectionRequirements(
      enabledLayers.length,
      tableIds.length
    );

    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.message);
      toast.error(validation.message);
      return;
    }

    console.log('🔍 Table IDs for intersection:', tableIds);

    setIsIntersecting(true);

    try {
      // Calculate bounding box and area metrics
      let bbox = null;
      if (map) {
        const bounds = map.getBounds();
        if (bounds) {
          bbox = IntersectionUtils.calculateBoundingBox(bounds);
          const metrics = IntersectionUtils.calculateMetrics(
            map,
            bbox,
            enabledLayers.length,
            tableIds.length
          );

          console.log('📍 Intersection Metrics:', metrics);

          // Warn if area is too large
          if (IntersectionUtils.isAreaTooLarge(metrics.zoom, metrics.areaSize)) {
            toast.warning('Large Area Detected', {
              description: `Zoom level: ${metrics.zoom}. Please zoom in closer for faster results. Current area may take 1-2 minutes to process.`,
              duration: 5000,
            });
          }
        }
      }

      // Build filters and payload
      const filters = IntersectionUtils.buildFilters(
        tableIds,
        seattleZoningFilters,
        seattleBaseZoneFilters
      );
      const payload = IntersectionUtils.createPayload(tableIds, bbox, filters);

      // Show progress toast
      toast.loading('Processing intersection...', {
        description: 'This may take up to a minute for large datasets',
        id: 'intersection-loading'
      });

      // Perform intersection
      const response = await IntersectionService.performIntersection(payload);

      // Dismiss loading toast
      toast.dismiss('intersection-loading');

      // Display results
      const countDetails = IntersectionUtils.formatFeatureCounts(response.featureCounts);
      toast.info('Intersection Details', {
        description: countDetails,
        duration: 6000,
      });

      // Add intersection layer to map
      if (response.featureCollection.features && response.featureCollection.features.length > 0) {
        enabledLayers.forEach(layer => {
          toggleLayer(layer.id);
        });
        addIntersectionLayer(response.featureCollection);
      } else {
        toast.info('No intersections found');
      }
    } catch (error) {
      console.error('Error performing intersection:', error);
      toast.dismiss('intersection-loading');
      toast.error('Failed to perform intersection. Try zooming in to reduce the area.');
    } finally {
      setIsIntersecting(false);
    }
  }, [
    layers,
    map,
    seattleZoningFilters,
    seattleBaseZoneFilters,
    getLayersWithCurrentState,
    toggleLayer,
    addIntersectionLayer
  ]);

  /**
   * Save intersection result to backend
   */
  const saveIntersection = useCallback(async (name: string) => {
    const intersectionLayer = layers.find(layer => layer.id === 'intersection');

    if (!intersectionLayer || !intersectionLayer.intersectionData) {
      toast.warning('No intersection data to save');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.warning('Please sign in to save intersections');
      return;
    }

    try {
      await IntersectionService.saveIntersection(name, intersectionLayer.intersectionData);
      toast.success('Intersection saved successfully!');
    } catch (error) {
      console.error('Error saving intersection:', error);
      toast.error('Failed to save intersection');
    }
  }, [layers]);

  /**
   * Export intersection result to CSV
   */
  const exportIntersection = useCallback(async (filename: string) => {
    const intersectionLayer = layers.find(layer => layer.id === 'intersection');

    if (!intersectionLayer || !intersectionLayer.intersectionData) {
      toast.warning('No intersection data to export');
      return;
    }

    try {
      await IntersectionService.exportToCSV(
        intersectionLayer.intersectionData as FeatureCollection,
        filename
      );
      toast.success(`CSV exported as ${filename}`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  }, [layers]);

  return {
    isIntersecting,
    performIntersection,
    saveIntersection,
    exportIntersection,
  };
}
