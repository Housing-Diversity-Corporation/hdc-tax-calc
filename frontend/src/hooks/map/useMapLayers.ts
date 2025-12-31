import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { GeoJsonFeatureCollection, GeoJsonFeature } from '../../types/map/geojson';
import { SEATTLE_ZONING_COLORS, TIER_COLORS } from '../../utils/map/colors';
import { getTierStyle } from '../../utils/map/tierStyling';
import api from '../../services/api';

interface GeodataFeature {
  ogcFid: number;
  [key: string]: string | number | boolean | null | undefined;
}

interface LayerLocation {
  state: string;
  city?: string;
}

interface LayerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  layer?: google.maps.Data;
  geoJsonUrl?: string;
  apiTableId?: string;
  displayProperties?: string[];
  data?: GeodataFeature[];
  intersectionData?: object;
  loading?: boolean;
  locations: LayerLocation[];
  isNational?: boolean;
  zIndex?: number;
  tierColors?: string[];  // If provided, enables tier-based styling
  styleFunction?: (feature: google.maps.Data.Feature) => google.maps.Data.StyleOptions;
  clickHandler?: (event: google.maps.Data.MouseEvent) => void;
  groupId?: string;  // For versioned layers: identifies which group this layer belongs to
  version?: string;  // For versioned layers: version identifier (e.g., "2025", "2026", "2.0")
}

interface StateWithCities {
  name: string;
  code: string;
  cities: {
    [key: string]: { name: string; code: string };
  };
}

export interface OverlappingFeature {
  layerId: string;
  layerName: string;
  properties: { [key: string]: string | number | boolean | null };
  feature: google.maps.Data.Feature;
  latLng: google.maps.LatLng;
}

export const useMapLayers = (
  map: google.maps.Map | null,
  onOverlappingFeaturesClick?: (features: OverlappingFeature[]) => void,
  highlightedFeatureRef?: React.MutableRefObject<{ layerId: string; featureProps: any } | null>,
  smallestFeatureIdRef?: React.MutableRefObject<string | null>,
  overlappingFeaturesRef?: React.MutableRefObject<any[]>
) => {

  const [layers, setLayers] = useState<LayerConfig[]>([]);
  const layersRef = useRef<Map<string, google.maps.Data>>(new Map());
  const layerConfigsRef = useRef<LayerConfig[]>([]);
  const enabledLayersRef = useRef<Set<string>>(new Set());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const mapRef = useRef<google.maps.Map | null>(map);
  const [seattleZoningFilters, setSeattleZoningFilters] = useState<Set<string>>(
    new Set(Object.keys(SEATTLE_ZONING_COLORS))
  );
  const [seattleBaseZoneFilters, setSeattleBaseZoneFilters] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; code: string } | null>(null);
  const [initialBaseZonesLoaded, setInitialBaseZonesLoaded] = useState(false);

  // Dynamic mapping between categories and base zones (built from actual layer data)
  const [categoryToBaseZones, setCategoryToBaseZones] = useState<Map<string, Set<string>>>(new Map());
  const [baseZoneToCategory, setBaseZoneToCategory] = useState<Map<string, string>>(new Map());

  // Refs for filters to avoid recreating layerConfigs
  const seattleZoningFiltersRef = useRef(seattleZoningFilters);
  const seattleBaseZoneFiltersRef = useRef(seattleBaseZoneFilters);

  // Keep refs in sync with state and props
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    seattleZoningFiltersRef.current = seattleZoningFilters;
  }, [seattleZoningFilters]);

  useEffect(() => {
    seattleBaseZoneFiltersRef.current = seattleBaseZoneFilters;
  }, [seattleBaseZoneFilters]);

  // Helper function to calculate area of a feature in square meters
  const calculateFeatureArea = useCallback((geometry: google.maps.Data.Geometry): number => {
    let totalArea = 0;

    if (geometry.getType() === 'Polygon') {
      const polygon = geometry as google.maps.Data.Polygon;
      polygon.getArray().forEach(path => {
        totalArea += google.maps.geometry.spherical.computeArea(path.getArray());
      });
    } else if (geometry.getType() === 'MultiPolygon') {
      const multiPolygon = geometry as google.maps.Data.MultiPolygon;
      multiPolygon.getArray().forEach(polygon => {
        polygon.getArray().forEach(path => {
          totalArea += google.maps.geometry.spherical.computeArea(path.getArray());
        });
      });
    }

    return totalArea;
  }, []);

  // Helper function to detect all features at a given point
  const detectOverlappingFeatures = useCallback((latLng: google.maps.LatLng): OverlappingFeature[] => {
    const overlapping: OverlappingFeature[] = [];


    // Get the current layer configs from ref
    const currentLayers = layerConfigsRef.current.filter(l => enabledLayersRef.current.has(l.id));


    currentLayers.forEach(layerConfig => {
      const layer = layersRef.current.get(layerConfig.id);
      if (!layer) return;

      let featureCount = 0;
      layer.forEach(feature => {
        featureCount++;
        const geometry = feature.getGeometry();
        if (!geometry) return;

        // Check if the clicked point is within this feature
        let contains = false;
        if (geometry.getType() === 'Polygon') {
          const polygon = geometry as google.maps.Data.Polygon;
          polygon.getArray().forEach(path => {
            if (google.maps.geometry.poly.containsLocation(latLng, new google.maps.Polygon({ paths: path.getArray() }))) {
              contains = true;
            }
          });
        } else if (geometry.getType() === 'MultiPolygon') {
          const multiPolygon = geometry as google.maps.Data.MultiPolygon;
          multiPolygon.getArray().forEach(polygon => {
            polygon.getArray().forEach(path => {
              if (google.maps.geometry.poly.containsLocation(latLng, new google.maps.Polygon({ paths: path.getArray() }))) {
                contains = true;
              }
            });
          });
        }

        if (contains) {
          const properties: { [key: string]: string | number | boolean | null } = {};
          feature.forEachProperty((value, key) => {
            properties[key] = value as string | number | boolean | null;
          });

          // Calculate area for this feature
          const area = calculateFeatureArea(geometry);

          overlapping.push({
            layerId: layerConfig.id,
            layerName: layerConfig.name,
            properties: { ...properties, _area: area }, // Add area to properties
            feature,
            latLng
          });
        }
      });
    });

    return overlapping;
  }, [calculateFeatureArea]);

  // Helper function to find a feature in a layer by matching properties
  const findFeatureByProperties = useCallback((layer: google.maps.Data, targetProps: any): google.maps.Data.Feature | null => {
    let foundFeature: google.maps.Data.Feature | null = null;

    layer.forEach((feature) => {
      // Match based on ogc_fid or other unique properties
      const ogcFid = feature.getProperty('ogc_fid');
      const targetOgcFid = targetProps.ogc_fid;

      if (ogcFid !== undefined && targetOgcFid !== undefined && ogcFid === targetOgcFid) {
        foundFeature = feature;
        return; // Stop iteration
      }

      // Fallback: match based on _area if available (less reliable but works for overlapping features)
      const area = feature.getProperty('_area');
      const targetArea = targetProps._area;
      if (typeof area === 'number' && typeof targetArea === 'number' && Math.abs(area - targetArea) < 0.01) {
        foundFeature = feature;
        return;
      }
    });

    return foundFeature;
  }, []);

  // Helper function to re-apply highlight after setStyle operations
  const reapplyHighlight = useCallback((layerId: string) => {

    const layer = layersRef.current.get(layerId);
    if (!layer) {
      return;
    }

    // Step 1: Reapply fill opacity for ALL overlapping features in this layer
    if (overlappingFeaturesRef?.current && overlappingFeaturesRef.current.length > 0) {
      overlappingFeaturesRef.current.forEach((f: any) => {
        if (f.layerId === layerId) {
          const isSmallest = f.layerId === smallestFeatureIdRef?.current;


          // Re-find the feature by properties
          const feature = findFeatureByProperties(layer, f.properties);
          if (!feature) {
            return;
          }

          if (isSmallest) {
            // Apply bright red fill to smallest feature
            // But if there's a border highlight on this feature, we'll reapply it in Step 2
            if (!highlightedFeatureRef?.current || highlightedFeatureRef.current.layerId !== layerId) {
              layer.overrideStyle(feature, {
                fillColor: 'pink',  // Brighter pink
                fillOpacity: 0.9,     // 90% opacity (more visible)
                zIndex: 1000           // Bring to front
              });
            }
          }
          // If not smallest, do nothing - let original layer style show
        }
      });
    }

    // Step 2: Reapply GREEN BORDER highlight if this layer is the highlighted one
    if (!highlightedFeatureRef?.current) {
      return;
    }

    const { layerId: highlightedLayerId, featureProps } = highlightedFeatureRef.current;

    // Only reapply border highlight if this is the highlighted layer
    if (highlightedLayerId === layerId) {

      // Re-find the highlighted feature
      const feature = findFeatureByProperties(layer, featureProps);
      if (!feature) {
        return;
      }


      // Determine if this is the smallest feature (should have visible fill)
      const isSmallest = layerId === smallestFeatureIdRef?.current;


      // Apply GREEN BORDER highlight with appropriate fill
      if (isSmallest) {
        // Smallest feature: green border + bright red fill, highest zIndex
        layer.overrideStyle(feature, {
          strokeColor: '#7fbd45', // Green border
          strokeWeight: 4,
          strokeOpacity: 1,
          fillColor: 'pink',   // Brighter pink
          fillOpacity: 0.9,      // 90% opacity (more visible)
          zIndex: 1001            // Highest - always on top
        });
      } else {
        // Not smallest: green border only, keep original fill
        layer.overrideStyle(feature, {
          strokeColor: '#7fbd45', // Green border
          strokeWeight: 4,
          strokeOpacity: 1,
          // Don't override fillColor or fillOpacity - let original layer style show
          zIndex: 999
        });
      }
    } else {
    }
  }, [highlightedFeatureRef, smallestFeatureIdRef, overlappingFeaturesRef, findFeatureByProperties]);

  const layerConfigs: LayerConfig[] = useMemo(() => [
      {
        id: 'Census Tracts',
        name: 'Census Tracts',
        description: 'US Census Tracts',
        enabled: false,
        apiTableId: 'ca_wa_tracts',
        displayProperties: [],
        loading: false,
        locations: [{ state: 'Washington', city: 'Seattle' }],
        styleFunction: () => ({ fillColor: 'blue', strokeColor: '#4A90E2', strokeOpacity: 0.9, strokeWeight: 2 }),
        clickHandler: (event) => handleDynamicClick(event, 'Census Tracts')
      },
      {
        id: 'Cities',
        name: 'Cities',
        description: 'Major US Cities',
        enabled: false,
        apiTableId: 'us_cities',
        displayProperties: [],
        locations: [],
        isNational: true,
        styleFunction: () => ({ fillColor: '#00000000', strokeColor: '#0F52BA', strokeOpacity: 0.9, strokeWeight: 2 }),
        clickHandler: (event) => handleDynamicClick(event, 'Cities')
      },
      {
        id: 'Council Districts',
        name: 'Council Districts',
        description: 'Includes Seattle and Los Angeles Council Districts.',
        enabled: false,
        apiTableId: 'la_seattle_council_districts',
        displayProperties: [],
        locations: [
          { state: 'Washington', city: 'Seattle' },
          { state: 'California', city: 'Los Angeles' }
        ],
        tierColors: TIER_COLORS.DISTRICT,
        clickHandler: (event) => handleDynamicClick(event, 'Council Districts')
      },
      {
        id: 'Counties',
        name: 'Counties',
        description: 'US Counties',
        enabled: false,
        apiTableId: 'ca_wa_counties',
        displayProperties: [],
        locations: [{ state: 'Washington', city: 'Seattle' }],
        styleFunction: () => ({ fillColor: '#00000000', strokeColor: '#AA4A44', strokeOpacity: 0.8, strokeWeight: 4 }),
        clickHandler: (event) => handleDynamicClick(event, 'Counties')
      },
      {
        id: 'Difficult Development Areas',
        name: 'DDA',
        description: 'Difficult Development Areas (DDAs) are areas designated by HUD as having high development costs',
        enabled: false,
        apiTableId: 'difficult_development_area',
        displayProperties: [],
        loading: false,
        locations: [],
        isNational: true,
        styleFunction: () => ({ fillColor: 'orange', strokeColor: '#000', strokeOpacity: 0.9, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'Difficult Development Areas')
      },
      {
        id: 'Fair Market Rents',
        name: 'FMR - MSA',
        description: 'Fair Market Rents are calculated for ZIP Codes for all Metropolitan Statistical Areas in HUD.',
        enabled: false,
        apiTableId: 'fmr_zipcode',
        displayProperties: [],
        locations: [],
        isNational: true,
        groupId: 'fmr',
        version: '2025',
        styleFunction: () => ({ fillColor: 'lightblue', strokeColor: '#E74C3C', strokeOpacity: 0.9, strokeWeight: 2 }),
        clickHandler: (event) => handleDynamicClick(event, 'Fair Market Rents')
      },
      {
        id: 'Small Area Fair Market Rents',
        name: 'FMR - Small Area',
        description: 'Small Area Fair Market Rents (SAFMRs) are FMRs calculated for ZIP Codes. Small Area FMRs are required to be used to set Section 8 Housing Choice Voucher payment standards in areas designated by HUD.',
        enabled: false,
        apiTableId: 'safmr_zipcode',
        displayProperties: [],
        locations: [],
        isNational: true,
        groupId: 'safmr',
        version: '2025',
        styleFunction: () => ({ fillColor: 'purple', strokeColor: '#E74C3C', strokeOpacity: 0.9, strokeWeight: 2 }),
        clickHandler: (event) => handleDynamicClick(event, 'Small Area Fair Market Rents')
      },
      {
        id: 'Frequent Transit Areas',
        name: 'Frequent Transit',
        description: 'Areas with high-frequency transit service',
        enabled: false,
        apiTableId: 'frequent_transit_area',
        displayProperties: ['OBJECTID', 'PIN'],
        locations: [{ state: 'Washington', city: 'Seattle' }],
        loading: false,
        styleFunction: () => ({ fillColor: 'pink', strokeColor: '#27AE60', strokeOpacity: 0.9, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'freuquentTransitAreas')
      },
      {
        id: 'High Opportunity Areas - AFFH',
        name: 'HOA - AFFH',
        description: 'Census tracts that are considered High Opportunity Areas by the Affimatively Furthering Fair Housing, AFFH, agency. Governed by California Tax Credit Allocation Committee and Housing and Community Development.',
        enabled: false,
        apiTableId: 'hoa_affh',
        displayProperties: [],
        locations: [{ state: 'California' , city: 'Los Angeles'}],
        tierColors: TIER_COLORS.AFFH,
        clickHandler: (event) => handleDynamicClick(event, 'High Opportunity Areas - AFFH')
      },
      {
        id: 'High Opportunity Areas - FHFA',
        name: 'HOA - FHFA',
        description: 'Census tracts that are considered High Opportunity Areas by the Federal Housing Finance Agency, FHFA.',
        enabled: false,
        apiTableId: 'hoa',
        displayProperties: [],
        locations: [],
        isNational: true,
        styleFunction: () => ({ fillColor: 'green', strokeColor: '#000', strokeOpacity: 0.9, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'High Opportunity Areas')
      },
      {
        id: 'King County Parcels',
        name: 'KC Parcels',
        description: 'Parcels in King County',
        enabled: false,
        apiTableId: 'parcel_address_area',
        displayProperties: [],
        locations: [{ state: 'Washington', city: 'Seattle' }],
        styleFunction: () => ({ fillColor: 'brown', strokeColor: '#27AE60', strokeOpacity: 0.9, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'King County Parcels')
      },
      {
        id: 'Mandatory Housing Affordability',
        name: 'MHA',
        description: 'Mandatory Housing Affordability requires new development to contribute to affordable housing by including affordable housing in the development or making a payment to the City’s Office of Housing to support affordable housing. The amount of the MHA contribution varies based on a property’s location and other factors specified in Seattle Municipal Code Chapters 23.58B and 23.58C.',
        enabled: false,
        apiTableId: 'mha',
        displayProperties: [],
        locations: [{ state: 'Washington', city: 'Seattle' }],
        styleFunction: () => ({ fillColor: 'orange', strokeColor: '#000', strokeOpacity: 0.9, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'Mandatory Housing Affordability')
      },
      {
        id: 'Opportunity Zones',
        name: 'OZ',
        description: 'Economically-distressed communities eligible for preferential tax treatment',
        enabled: false,
        apiTableId: 'ca_wa_oz',
        displayProperties: [],
        locations: [
          { state: 'California', city: 'Los Angeles' },
          { state: 'Washington', city: 'Seattle' }
        ],
        groupId: 'opportunity-zones',
        version: '1.0',
        styleFunction: () => ({ fillColor: 'turquoise', strokeColor: '#000', strokeOpacity: 1, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'Opportunity Zones')
      },
      {
        id: 'EIG New OZs',
        name: 'OZ 2.0',
        description: 'By the Economic Innovation Group: The budget reconciliation act of 2025 permanently extends the Opportunity Zone tax incentive and calls for a new round of census tracts to be designated as qualifying Opportunity Zones in July 2026. This map depicts which census tracts will be eligible for nomination by governors and subsequent designation based on the criteria laid out in the legislation and according to the latest available data (currently the 2019-2023 American Community Survey 5-Year Estimates). This map may contain errors or omissions and is for illustrative purposes only. Users should expect the U.S. Department of the Treasury to issue an authoritative eligibility map in advance of the next decennial determination period.',
        enabled: false,
        apiTableId: 'eig_oz_lgbl',
        displayProperties: [],
        locations: [],
        isNational: true,
        groupId: 'opportunity-zones',
        version: '2.0',
        styleFunction: () => ({ fillColor: '#54bfbf', strokeColor: '#000', strokeOpacity: 1, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'EIG New OZs')
      },
      {
        id: 'Qualified Census Tract',
        name: 'QCT',
        description: 'Qualified Census Tracts',
        enabled: false,
        apiTableId: 'qualified_census_tract',
        displayProperties: [],
        locations: [],
        isNational: true,
        styleFunction: () => ({ fillColor: 'brown', strokeColor: '#4A90E2', strokeOpacity: 0.9, strokeWeight: 2 }),
        clickHandler: (event) => handleDynamicClick(event, 'Qualified Census Tract')
      },
      {
        id: 'HACLA VPS',
        name: 'VPS',
        description: 'Housing Authority of the City of Los Angeles Veteran Priority Score. Includes voucher payment standards (VPS) with tier qualification at the zipcode level.',
        enabled: false,
        apiTableId: 'hacla_vps',
        displayProperties: [],
        locations: [{ state: 'California', city: 'Los Angeles' }],
        groupId: 'hacla',
        version: 'VPS',
        tierColors: TIER_COLORS.VPS,
        clickHandler: (event) => handleDynamicClick(event, 'HACLA VPS')
      },
      {
        id: 'HACLA Delta',
        name: 'Delta',
        description: 'Housing Authority of the City of Los Angeles Delta',
        enabled: false,
        apiTableId: 'hacla_delta',
        displayProperties: [],
        locations: [{ state: 'California', city: 'Los Angeles' }],
        groupId: 'hacla',
        version: 'Delta',
        tierColors: TIER_COLORS.VPS,
        clickHandler: (event) => handleDynamicClick(event, 'HACLA Delta')
      },
      {
        id: 'SDCI Zoning',
        name: 'SDCI Zoning',
        description: 'Seattle Department of Construction and Inspections Zoning Code',
        enabled: false,
        apiTableId: 'seattle_zoning_code',
        displayProperties: ['category_desc', 'base_zone', 'zone_class', 'zone_ind'],
        locations: [{ state: 'Washington', city: 'Seattle' }],
        styleFunction: (feature: google.maps.Data.Feature) => {
          const category = feature.getProperty('category_desc') as string;
          const baseZone = feature.getProperty('base_zone') as string;
          const categoryVisible = seattleZoningFiltersRef.current.has(category);
          const baseZoneVisible = seattleBaseZoneFiltersRef.current.size === 0 || seattleBaseZoneFiltersRef.current.has(baseZone);
          const isVisible = categoryVisible && baseZoneVisible;
          return {
            fillColor: SEATTLE_ZONING_COLORS[category] || '#CCCCCC',
            fillOpacity: isVisible ? 0.7 : 0,
            strokeColor: '#000',
            strokeOpacity: isVisible ? 0.7 : 0,
            strokeWeight: 0,
            visible: isVisible
          };
        },
        clickHandler: (event) => handleSeattleZoningClick(event)
      },
      {
        id: 'Urban Village',
        name: 'Urban Village',
        description: 'Urban Village layer',
        enabled: false,
        apiTableId: 'urban_villages',
        displayProperties: [],
        locations: [{ state: 'Washington', city: 'Seattle' }],
        styleFunction: () => ({ fillColor: 'red', strokeColor: '#000', strokeOpacity: 1, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'Urban Village')
      },
      {
        id: 'USDA Ineligible Areas',
        name: 'USDA Ineligible',
        description: 'USDA Rural Development Property Ineligibility (SFH/MFH) Zones. Used to determine eligibility for certain USDA Single Family Housing and Multi-Family Housing loan and grant programs.',
        enabled: false,
        apiTableId: 'usda',
        displayProperties: [],
        locations: [],
        isNational: true,
        styleFunction: () => ({ fillColor: '#bfb05e', strokeColor: '#000', strokeOpacity: 1, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'USDA Ineligible Areas')
      },
  ], []); // Empty dependencies - click handlers attached dynamically in initializeLayers

  // Create locations only once using a ref to ensure stable reference
  const locationsRef = useRef<({ name: string; code: string; cities?: { name: string; code: string; }[] })[]>([]);

  if (locationsRef.current.length === 0) {
    locationsRef.current = [
      {
        name: 'All',
        code: 'All'
      },
      ...Object.values(layerConfigs.reduce((acc: { [key: string]: { name: string; code: string; cities: { [key: string]: { name: string; code: string } } } }, layer) => {
        if (layer.locations && Array.isArray(layer.locations)) {
          layer.locations.forEach(loc => {
            const { state, city } = loc;
            acc[state] = acc[state] || { name: state, code: state, cities: {} };
            if (city) {
              acc[state].cities[city] = { name: city, code: `${state}-${city}` };
            }
          });
        }
        return acc;
      }, {})).sort((a, b) => a.name.localeCompare(b.name)).map((state: StateWithCities) => ({
        ...state,
        cities: Object.values(state.cities).sort((a, b) => a.name.localeCompare(b.name))
      }))
    ];
  }

  const locations = locationsRef.current;

  useEffect(() => {
    if (map && !infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }
  }, [map]);

  const initializeLayers = useCallback(() => {
    if (!map) return;

    // Remove all existing layers from the map
    layersRef.current.forEach(layer => {
      layer.setMap(null);
    });
    layersRef.current.clear();
    layerConfigsRef.current = [];
    setLayers([]); // Clear the layers state immediately

    const filteredLayers = layerConfigs.filter(layer => {
      if (!selectedLocation || selectedLocation.code === 'All') {
        return true;
      }

      if (layer.isNational) {
        return true;
      }

      const { code: locationCode } = selectedLocation;
      const [state, city] = locationCode.split('-');

      return layer.locations.some(loc => {
        if (city) {
          return loc.state === state && loc.city === city;
        } else {
          return loc.state === state;
        }
      });
    });

    // Initialize layers
    filteredLayers.forEach(config => {
      const layer = new google.maps.Data();

      // Listen for features being added (e.g., from loadGeoJson)
      layer.addListener('addfeature', () => {
        // Re-apply highlight after features are added, in case this layer is highlighted
        setTimeout(() => reapplyHighlight(config.id), 100);
      });

      if (config.geoJsonUrl) {
        layer.loadGeoJson(config.geoJsonUrl);
      }

      // Apply tier styling if tierColors is provided, otherwise use styleFunction
      if (config.tierColors) {
        layer.setStyle(getTierStyle(config.tierColors));
        reapplyHighlight(config.id);  // Re-apply highlight if this layer was highlighted
      } else if (config.styleFunction) {
        layer.setStyle(config.styleFunction);
        reapplyHighlight(config.id);  // Re-apply highlight if this layer was highlighted
      }

      if (config.clickHandler) {
        layer.addListener('click', config.clickHandler);
      } else {
      }

      layersRef.current.set(config.id, layer);
      config.layer = layer;
    });

    layerConfigsRef.current = filteredLayers;
    setLayers(filteredLayers);
  }, [map, selectedLocation, layerConfigs]); // layerConfigs is stable now with empty deps

  useEffect(() => {
    if (map) {
      initializeLayers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedLocation]);

  const fetchGeodataLayer = useCallback(async (layerId: string, tableId: string) => {
    const layer = layersRef.current.get(layerId);
    if (!layer || !map) return;

    setLayers(prev => 
      prev.map(l => 
        l.id === layerId 
          ? { ...l, loading: true }
          : l
      )
    );

    const bounds = map.getBounds();
    const zoom = map.getZoom();


    if (!bounds || !zoom) {
      setLayers(prev => prev.map(l => l.id === layerId ? { ...l, loading: false } : l));
      return;
    }

    // Define national layers that require higher zoom
    const nationalLayers = [
      'Difficult Development Areas',
      'Fair Market Rents',
      'Small Area Fair Market Rents',
      'High Opportunity Areas - FHFA',
      'Qualified Census Tract',
      'EIG New OZs',
      'USDA Ineligible Areas'
    ];

    // Check zoom restrictions for parcels and transit
    if ((layerId === 'Frequent Transit Areas' || layerId === 'King County Parcels') && zoom <= 14) {

      if (infoWindowRef.current) {
        const layerName = layerId === 'King County Parcels' ? 'King County Parcels' : 'Frequent Transit Areas';
        const content = `
          <div style="padding: 10px; max-width: 250px; text-align: center;">
            <h3 style="color: #333; margin: 0 0 10px 0;">🔍 Zoom In Required</h3>
            <p style="color: #666; margin: 0; font-size: 14px;">
              Please zoom in closer (above level 15) to view ${layerName} data.
            </p>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.setPosition(map.getCenter());
        infoWindowRef.current.open(map);

        setTimeout(() => {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
        }, 3000);
      }

      layer.forEach(feature => {
        layer.remove(feature);
      });

      setLayers(prev => prev.map(l => l.id === layerId ? { ...l, loading: false } : l));
      return;
    }

    // Check zoom restrictions for national layers
    if (nationalLayers.includes(layerId) && zoom < 10) {

      if (infoWindowRef.current) {
        const content = `
          <div style="padding: 10px; max-width: 250px; text-align: center;">
            <h3 style="color: #333; margin: 0 0 10px 0;">🔍 Zoom In Required</h3>
            <p style="color: #666; margin: 0; font-size: 14px;">
              Please zoom in closer (level 10+) to view ${layerId} data. Large nationwide datasets require higher zoom levels.
            </p>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.setPosition(map.getCenter());
        infoWindowRef.current.open(map);

        setTimeout(() => {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
        }, 3000);
      }

      layer.forEach(feature => {
        layer.remove(feature);
      });

      setLayers(prev => prev.map(l => l.id === layerId ? { ...l, loading: false } : l));
      return;
    }

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const bbox = `${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`;

    try {
      const url = `/geodata/${tableId}?bbox=${bbox}&zoom=${zoom}`;
      const response = await api.get(url);
      const geoJsonData = response.data;

      layer.forEach(feature => {
        layer.remove(feature);
      });

      layer.addGeoJson(geoJsonData);

      // Build category-to-base-zone mapping for Seattle Zoning layer
      if (layerId === 'SDCI Zoning') {
        const catToZones = new Map<string, Set<string>>();
        const zoneToCat = new Map<string, string>();
        const allBaseZones = new Set<string>();

        layer.forEach(feature => {
          const category = feature.getProperty('category_desc') as string;
          const baseZone = feature.getProperty('base_zone') as string;

          if (category && baseZone) {
            // Build category -> base zones map
            if (!catToZones.has(category)) {
              catToZones.set(category, new Set());
            }
            catToZones.get(category)!.add(baseZone);

            // Build base zone -> category map (reverse lookup)
            zoneToCat.set(baseZone, category);

            // Collect all base zones
            allBaseZones.add(baseZone);
          }
        });

        setCategoryToBaseZones(catToZones);
        setBaseZoneToCategory(zoneToCat);

        // Auto-select all base zones on first load (to match category filter behavior)
        if (!initialBaseZonesLoaded) {
          setSeattleBaseZoneFilters(allBaseZones);
          setInitialBaseZonesLoaded(true);
        }
      }

      // Re-apply highlight after reloading layer data (e.g., after zoom)
      reapplyHighlight(layerId);

      const featureCount = geoJsonData.features?.length || 0;

      // Warn about large datasets
      if (featureCount > 15000) {
        console.warn(`⚠️ Large dataset loaded: ${featureCount} features for ${layerId}. Consider zooming in for better performance.`);
      }

      setLayers(prev =>
        prev.map(l =>
          l.id === layerId ? { ...l, loading: false, data: geoJsonData.features || [] } : l
        )
      );
    } catch (error: any) {
      console.error(`Error fetching ${layerId}:`, error);

      // Show user-friendly toast notification
      const errorMessage = error?.response?.status === 500
        ? `Data layer "${layerId}" is currently unavailable. The data may not be loaded yet.`
        : `Failed to load "${layerId}". Please try again later.`;

      // Display toast notification using sonner
      const { toast } = await import('sonner');
      toast.error('Layer Load Error', {
        description: errorMessage,
      });

      setLayers(prev =>
        prev.map(l =>
          l.id === layerId ? { ...l, loading: false, enabled: false } : l
        )
      );
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const idleListener = map.addListener('idle', () => {
      // Use layerConfigsRef instead of layers to avoid re-creating listeners
      layerConfigsRef.current.forEach(layerConfig => {
        if (enabledLayersRef.current.has(layerConfig.id) && layerConfig.apiTableId) {
          fetchGeodataLayer(layerConfig.id, layerConfig.apiTableId);
        }
      });
    });

    const zoomListener = map.addListener('zoom_changed', () => {
      const currentZoom = map.getZoom();
    });

    return () => {
      google.maps.event.removeListener(idleListener);
      google.maps.event.removeListener(zoomListener);
    };
  }, [map, fetchGeodataLayer]);

  const toggleLayer = useCallback(async (layerId: string): Promise<void> => {
    const layer = layersRef.current.get(layerId);
    if (!layer || !map) return;

    let shouldFetchData = false;
    let tableId: string | undefined;

    // Update state synchronously first
    setLayers(prev => {
      const newLayers = [...prev];
      const layerIndex = newLayers.findIndex(l => l.id === layerId);
      if (layerIndex === -1) {
        return prev;
      }

      const layerConfig = newLayers[layerIndex];
      const newEnabled = !layerConfig.enabled;

      newLayers[layerIndex] = { ...layerConfig, enabled: newEnabled };

      // Update BOTH refs immediately for synchronous access
      layerConfigsRef.current = newLayers; // Keep config ref in sync
      if (newEnabled) {
        enabledLayersRef.current.add(layerId);
        if (layerConfig.apiTableId) {
          shouldFetchData = true;
          tableId = layerConfig.apiTableId;
        } else {
          // If no apiTableId, layer has static data - show immediately
          layer.setMap(map);
        }
      } else {
        enabledLayersRef.current.delete(layerId);
        layer.setMap(null);
      }

      // Only set map immediately if NOT fetching data (for layers without apiTableId)
      if (!shouldFetchData && newEnabled) {
        layer.setMap(map);
      } else if (!newEnabled) {
        layer.setMap(null);
      }

      return newLayers;
    });

    // If we need to fetch data, await it and THEN show the layer
    if (shouldFetchData && tableId) {
      await fetchGeodataLayer(layerId, tableId);
      // Set layer on map AFTER data is loaded
      layer.setMap(map);
    }
  }, [map, fetchGeodataLayer]);

  const formatKey = (key: string) => {
    if (typeof key !== 'string' || key.length === 0) {
      return '';
    }
    const words = key.split('_');
    const capitalizedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    return capitalizedWords.join(' ');
  };

  const handleDynamicClick = useCallback(async (event: google.maps.Data.MouseEvent, layerId: string) => {

    if (!mapRef.current || !event.latLng) {
      return;
    }

    const map = mapRef.current;

    // Detect all overlapping features at this location
    const overlapping = detectOverlappingFeatures(event.latLng);

    // If any features detected and callback provided, trigger the panel
    if (overlapping.length > 0 && onOverlappingFeaturesClick) {
      // Close info window if it's open
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      onOverlappingFeaturesClick(overlapping);
      return;
    }


    // Otherwise show traditional info window (fallback for when no features detected)
    if (!infoWindowRef.current) return;

    type FeaturePropertyValue = string | number | boolean | null;
    interface FeatureProperties {
      [key: string]: FeaturePropertyValue;
    }

    let content = '<div class="info-window" style="color: black;">';
    content += `<h3 style="color: black;">${layerId}</h3>`;

    if (layerId === 'intersection') {
      event.feature.forEachProperty((value, key) => {
        if (typeof value === 'object' && value !== null) {
          content += `<h4 style="color: black; margin-top: 10px; border-bottom: 1px solid #ccc;">${formatKey(key)}</h4>`;
          const propertyObject = value as FeatureProperties;
          for (const propKey in propertyObject) {
            content += `<p style="color: black;"><strong>${formatKey(propKey)}:</strong> ${propertyObject[propKey]}</p>`;
          }
        } else {
          content += `<p style="color: black;"><strong>${formatKey(key)}:</strong> ${value}</p>`;
        }
      });
    } else {
      if (layerId === 'King County Parcels') {
        const pin = event.feature.getProperty('pin');
        if (pin) {
          try {
            const response = await api.get(`/geodata/proxy/parcel-info?pin=${pin}`);
            const data = response.data;
            if (data.items && data.items.length > 0) {
              const ownerInfo = data.items[0];
              for (const key in ownerInfo) {
                content += `<p style="color: pink;"><strong>${key}:</strong> ${ownerInfo[key]}</p>`;
              }
            }
          } catch (error) {
            console.error('Error fetching parcel owner info:', error);
          }
        }
      }

      event.feature.forEachProperty((value, key) => {
        if (key !== 'geom') {
          content += `<p style="color: black;"><strong>${formatKey(key)}:</strong> ${value}</p>`;
        }
      });
    }

    content += '</div>';

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.setPosition(event.latLng);
    infoWindowRef.current.open(map);
  }, [detectOverlappingFeatures, onOverlappingFeaturesClick]); // Using mapRef.current instead of map dependency

  const handleSeattleZoningClick = useCallback((event: google.maps.Data.MouseEvent) => {

    if (!mapRef.current || !event.latLng) {
      return;
    }

    const map = mapRef.current;

    // Detect all overlapping features at this location
    const overlapping = detectOverlappingFeatures(event.latLng);

    // If any features detected and callback provided, trigger the panel
    if (overlapping.length > 0 && onOverlappingFeaturesClick) {
      // Close info window if it's open
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      onOverlappingFeaturesClick(overlapping);
      return;
    }


    // Fallback to traditional info window for Seattle Zoning
    if (!infoWindowRef.current) return;

    const category = event.feature.getProperty('category_desc') as string;
    const zoneClass = event.feature.getProperty('zone_class');
    const zoneInd = event.feature.getProperty('zone_ind');

    const color = SEATTLE_ZONING_COLORS[category] || '#CCCCCC';

    let content = '<div class="info-window" style="color: black;">';
    content += `<h3 style="color: black; border-bottom: 3px solid ${color}; padding-bottom: 5px;">Seattle Zoning</h3>`;
    content += `<p style="color: black;"><strong>Category:</strong> <span style="color: ${color}; font-weight: bold;">${category}</span></p>`;
    if (zoneClass) content += `<p style="color: black;"><strong>Zone Class:</strong> ${zoneClass}</p>`;
    if (zoneInd) content += `<p style="color: black;"><strong>Zone Indicator:</strong> ${zoneInd}</p>`;

    event.feature.forEachProperty((value, key) => {
      if (key !== 'geom' && key !== 'category_desc' && key !== 'zone_class' && key !== 'zone_ind') {
        content += `<p style="color: black;"><strong>${formatKey(key)}:</strong> ${value}</p>`;
      }
    });

    content += '</div>';

    infoWindowRef.current.setContent(content);
    infoWindowRef.current.setPosition(event.latLng);
    infoWindowRef.current.open(map);
  }, [detectOverlappingFeatures, onOverlappingFeaturesClick]); // Using mapRef.current instead of map dependency

  const addIntersectionLayer = useCallback((geoJsonData: GeoJsonFeatureCollection) => {
    if (!map) return;

    let filteredGeoJson = geoJsonData;
    const seattleZoningEnabled = layerConfigsRef.current.some(l => l.id === 'SDCI Zoning' && l.enabled);
    
    if (seattleZoningEnabled) {
      filteredGeoJson = {
        ...geoJsonData,
        features: geoJsonData.features.filter((feature: GeoJsonFeature) => {
          const properties = feature.properties || {};
          const categoryDesc = properties.category_desc as string;
          const baseZone = properties.base_zone as string;

          if (categoryDesc && typeof categoryDesc === 'string') {
            const categoryVisible = seattleZoningFiltersRef.current.has(categoryDesc);
            const baseZoneVisible = seattleBaseZoneFiltersRef.current.size === 0 ? false : seattleBaseZoneFiltersRef.current.has(baseZone);
            const shouldShow = categoryVisible && baseZoneVisible;
            return shouldShow;
          }

          return true;
        })
      };

    }

    const existingLayer = layersRef.current.get('intersection');
    if (existingLayer) {
      existingLayer.setMap(null);
      layersRef.current.delete('intersection');
    }

    const intersectionLayer = new google.maps.Data();
    
    intersectionLayer.setStyle({
      fillColor: '#FF69B4',
      fillOpacity: 0.35,
      strokeColor: '#FF1493',
      strokeOpacity: 0.8,
      strokeWeight: 2
    });

    const finalGeoJson = {
      ...filteredGeoJson,
      features: filteredGeoJson.features.filter((feature: GeoJsonFeature) => {
        const geomType = feature.geometry?.type;
        //console.log(`Feature geometry type: ${geomType}`);
        return geomType === 'Polygon' || geomType === 'MultiPolygon';
      })
    };
    
    intersectionLayer.addGeoJson(finalGeoJson);
    
    intersectionLayer.setMap(map);
    
    layersRef.current.set('intersection', intersectionLayer);

    intersectionLayer.addListener('click', (event: google.maps.Data.MouseEvent) => {
      handleDynamicClick(event, 'intersection');
    });

    const intersectionConfig: LayerConfig = {
      id: 'intersection',
      name: 'Intersection Results',
      description: 'Results from layer intersection operation',
      enabled: true,
      layer: intersectionLayer,
      locations: [],
      intersectionData: finalGeoJson,
      styleFunction: () => ({
        fillColor: '#FF69B4',
        fillOpacity: 0.35,
        strokeColor: '#FF1493',
        strokeOpacity: 0.8,
        strokeWeight: 2
      }),
      clickHandler: (event) => handleDynamicClick(event, 'intersection')
    };

    setLayers(prev => {
      const filtered = prev.filter(l => l.id !== 'intersection');
      return [...filtered, intersectionConfig];
    });

  }, [map, handleDynamicClick]); // Using refs for filters to avoid recreation

  const setSeattleZoneFilterWithSync = useCallback((newCategoryFilters: Set<string>) => {
    const prevFilters = seattleZoningFilters;

    setSeattleZoningFilters(newCategoryFilters);

    // Sync base zones: select all zones from selected categories
    setSeattleBaseZoneFilters(prevBaseZones => {
      const newBaseZones = new Set<string>();

      // Add all base zones from all selected categories
      newCategoryFilters.forEach(category => {
        const categoryZones = categoryToBaseZones.get(category);
        if (categoryZones) {
          categoryZones.forEach(zone => newBaseZones.add(zone));
        }
      });

      return newBaseZones;
    });
  }, [seattleZoningFilters, categoryToBaseZones]);

  const setSeattleBaseZoneFilterWithSync = useCallback((newBaseZoneFilters: Set<string>) => {
    setSeattleBaseZoneFilters(newBaseZoneFilters);

    // Check which categories should be enabled/disabled based on selected base zones
    setSeattleZoningFilters(prevCategoryFilters => {
      const newCategoryFilters = new Set<string>();

      // For each category, check if ANY of its zones are selected
      categoryToBaseZones.forEach((zones, category) => {
        const hasAnyZoneSelected = Array.from(zones).some(zone => newBaseZoneFilters.has(zone));

        // Only include category if at least one of its zones is selected
        if (hasAnyZoneSelected) {
          newCategoryFilters.add(category);
        }
      });

      return newCategoryFilters;
    });
  }, [categoryToBaseZones]);


  useEffect(() => {
    const seattleLayer = layersRef.current.get('SDCI Zoning');
    if (seattleLayer) {
      seattleLayer.setStyle((feature: google.maps.Data.Feature) => {
        const category = feature.getProperty('category_desc') as string;
        const baseZone = feature.getProperty('base_zone') as string;

        const categoryVisible = seattleZoningFilters.has(category);
        // If no base zones selected (size === 0), show ALL; otherwise filter by selected zones
        const baseZoneVisible = seattleBaseZoneFilters.size === 0 ? true : seattleBaseZoneFilters.has(baseZone);
        const isVisible = categoryVisible && baseZoneVisible;

        return {
          fillColor: SEATTLE_ZONING_COLORS[category] || '#CCCCCC',
          fillOpacity: isVisible ? 0.7 : 0,
          strokeColor: '#000',
          strokeOpacity: isVisible ? 0.7 : 0,
          strokeWeight: 0,
          visible: isVisible
        };
      });
      reapplyHighlight('SDCI Zoning');  // Re-apply highlight after filter change
    }
  }, [seattleZoningFilters, seattleBaseZoneFilters, reapplyHighlight]);

  // Function to get layers with current enabled state (synchronous)
  // Uses refs to get the most up-to-date state, not relying on React state closure
  const getLayersWithCurrentState = useCallback(() => {
    return layerConfigsRef.current.map(layer => ({
      ...layer,
      enabled: enabledLayersRef.current.has(layer.id)
    }));
  }, []);

  // Function to update layer z-index based on hierarchy
  const updateLayerZIndex = useCallback((layerId: string, zIndex: number) => {
    const layer = layersRef.current.get(layerId);
    if (layer && map) {
      // Update the layer style to include zIndex
      const currentStyle = layerConfigsRef.current.find(l => l.id === layerId)?.styleFunction;
      if (currentStyle) {
        layer.setStyle((feature: google.maps.Data.Feature) => {
          const baseStyle = currentStyle(feature);
          return {
            ...baseStyle,
            zIndex
          };
        });
        reapplyHighlight(layerId);  // Re-apply highlight after zIndex change
      } else {
        layer.setStyle({ zIndex });
        reapplyHighlight(layerId);  // Re-apply highlight after zIndex change
      }

      // Update the layers state
      setLayers(prev =>
        prev.map(l =>
          l.id === layerId ? { ...l, zIndex } : l
        )
      );
    }
  }, [map, reapplyHighlight]);

  return {
    layers,
    toggleLayer,
    layersRef: layersRef.current,
    addIntersectionLayer,
    seattleZoningFilters,
    setSeattleZoneFilter: setSeattleZoneFilterWithSync,
    seattleZoningColors: SEATTLE_ZONING_COLORS,
    seattleBaseZoneFilters,
    setSeattleBaseZoneFilter: setSeattleBaseZoneFilterWithSync,
    locations,
    selectedLocation,
    setSelectedLocation,
    getLayersWithCurrentState,
    updateLayerZIndex
  };
};