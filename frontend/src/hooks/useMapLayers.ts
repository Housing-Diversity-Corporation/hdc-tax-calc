import { useState, useCallback, useRef, useEffect } from 'react';
import type { GeoJsonFeatureCollection, GeoJsonFeature } from '../types/geojson';
import { SEATTLE_ZONING_COLORS } from '../utils/colors';
import api from '../services/api';

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
  styleFunction?: (feature: google.maps.Data.Feature) => google.maps.Data.StyleOptions;
  clickHandler?: (event: google.maps.Data.MouseEvent) => void;
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
  onOverlappingFeaturesClick?: (features: OverlappingFeature[]) => void
) => {
  const [layers, setLayers] = useState<LayerConfig[]>([]);
  const layersRef = useRef<Map<string, google.maps.Data>>(new Map());
  const layerConfigsRef = useRef<LayerConfig[]>([]);
  const enabledLayersRef = useRef<Set<string>>(new Set());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [seattleZoningFilters, setSeattleZoningFilters] = useState<Set<string>>(
    new Set(Object.keys(SEATTLE_ZONING_COLORS))
  );
  const [seattleBaseZoneFilters, setSeattleBaseZoneFilters] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; code: string } | null>(null);

  // Helper function to detect all features at a given point
  const detectOverlappingFeatures = useCallback((latLng: google.maps.LatLng): OverlappingFeature[] => {
    const overlapping: OverlappingFeature[] = [];

    console.log('🔍 Detecting overlapping features at:', latLng.lat(), latLng.lng());
    console.log('🔍 Enabled layers from ref:', Array.from(enabledLayersRef.current));

    // Get the current layer configs from ref
    const currentLayers = layerConfigsRef.current.filter(l => enabledLayersRef.current.has(l.id));

    console.log('🔍 Checking', currentLayers.length, 'enabled layers');

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

          console.log('✅ Found overlapping feature in layer:', layerConfig.name);
          overlapping.push({
            layerId: layerConfig.id,
            layerName: layerConfig.name,
            properties,
            feature,
            latLng
          });
        }
      });
      console.log(`🔍 Layer "${layerConfig.name}" has ${featureCount} features loaded`);
    });

    console.log('🔍 Total overlapping features found:', overlapping.length);
    return overlapping;
  }, []);

  const layerConfigs: LayerConfig[] = [
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
        styleFunction: () => ({
          fillColor: 'green',
          strokeColor: '#4CAF50',
          strokeOpacity: 0.9,
          strokeWeight: 2
        }),
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
        id: 'HACLA Delta',
        name: 'HACLA Delta',
        description: ' Includes voucher payment standards (VPS) with tier qualification at the zipcode level.',
        enabled: false,
        apiTableId: 'hacla_delta',
        displayProperties: [],
        locations: [{ state: 'California', city: 'Los Angeles' }],
        styleFunction: () => ({ fillColor: 'lightgreen', strokeColor: '#000', strokeOpacity: 0.9, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'HACLA Delta')
      },
      {
        id: 'HACLA VPS',
        name: 'HACLA VPS',
        description: 'Includes voucher payment standards (VPS) with tier qualification at the zipcode level.',
        enabled: false,
        apiTableId: 'hacla_vps',
        displayProperties: [],
        locations: [{ state: 'California', city: 'Los Angeles' }],
        styleFunction: () => ({ fillColor: 'lightblue', strokeColor: '#000', strokeOpacity: 0.9, strokeWeight: 1 }),
        clickHandler: (event) => handleDynamicClick(event, 'HACLA VPS')
      },
      {
        id: 'High Opportunity Areas - AFFH',
        name: 'HOA - AFFH',
        description: 'Census tracts that are considered High Opportunity Areas by the Affimatively Furthering Fair Housing, AFFH, agency. Governed by California Tax Credit Allocation Committee and Housing and Community Development.',
        enabled: false,
        apiTableId: 'hoa_affh',
        displayProperties: [],
        locations: [{ state: 'California' , city: 'Los Angeles'}],
        styleFunction: () => ({ fillColor: 'yellow', strokeColor: '#000', strokeOpacity: 0.9, strokeWeight: 1 }),
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
          const categoryVisible = seattleZoningFilters.has(category);
          const baseZoneVisible = seattleBaseZoneFilters.size === 0 || seattleBaseZoneFilters.has(baseZone);
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
  ];

  const locations = [
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

  useEffect(() => {
    if (map && !infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }
  }, [map]);

  useEffect(() => {
    if (map) {
      initializeLayers();
    }
  }, [map, selectedLocation]);

  const initializeLayers = useCallback(() => {
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
      if (config.geoJsonUrl) {
        layer.loadGeoJson(config.geoJsonUrl);
      }
      
      if (config.styleFunction) {
        layer.setStyle(config.styleFunction);
      }
      
      if (config.clickHandler) {
        layer.addListener('click', config.clickHandler);
      }
      
      layersRef.current.set(config.id, layer);
      config.layer = layer;
    });

    layerConfigsRef.current = filteredLayers;
    setLayers(filteredLayers);
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

    console.log(`Current zoom level: ${zoom} for layer ${layerId}`);

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
      console.log(`Layer ${layerId} restricted to zoom levels above 14. Current zoom: ${zoom}`);

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
      console.log(`Layer ${layerId} restricted to zoom levels 10 and above. Current zoom: ${zoom}`);

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
      console.log(`Loaded ${featureCount} features for ${layerId}`);
    } catch (error) {
      console.error(`Error fetching ${layerId}:`, error);
      setLayers(prev =>
        prev.map(l =>
          l.id === layerId ? { ...l, loading: false } : l
        )
      );
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const idleListener = map.addListener('idle', () => {
      layers.forEach(layerConfig => {
        if (layerConfig.enabled && layerConfig.apiTableId) {
          fetchGeodataLayer(layerConfig.id, layerConfig.apiTableId);
        }
      });
    });

    const zoomListener = map.addListener('zoom_changed', () => {
      const currentZoom = map.getZoom();
      console.log(`🗺️ Zoom level changed to: ${currentZoom}`);
    });

    return () => {
      google.maps.event.removeListener(idleListener);
      google.maps.event.removeListener(zoomListener);
    };
  }, [map, layers, fetchGeodataLayer]);

  const toggleLayer = useCallback(async (layerId: string) => {
    const layer = layersRef.current.get(layerId);
    if (!layer || !map) return;

    console.log(`🔍 toggleLayer: Called for ${layerId}`);

    setLayers(prev => {
      const newLayers = [...prev];
      const layerIndex = newLayers.findIndex(l => l.id === layerId);
      if (layerIndex === -1) {
        console.log(`🔍 toggleLayer: Layer ${layerId} not found in state`);
        return prev;
      }

      const layerConfig = newLayers[layerIndex];
      const newEnabled = !layerConfig.enabled;
      console.log(`🔍 toggleLayer: ${layerId} enabled: ${layerConfig.enabled} → ${newEnabled}`);

      newLayers[layerIndex] = { ...layerConfig, enabled: newEnabled };

      // Update the ref immediately for synchronous access
      if (newEnabled) {
        enabledLayersRef.current.add(layerId);
      } else {
        enabledLayersRef.current.delete(layerId);
      }
      console.log(`🔍 toggleLayer: enabledLayersRef now has: [${Array.from(enabledLayersRef.current).join(', ')}]`);

      if (newEnabled && layerConfig.apiTableId) {
        console.log(`🔍 toggleLayer: Fetching geodata for ${layerId} (${layerConfig.apiTableId})`);
        fetchGeodataLayer(layerId, layerConfig.apiTableId);
      }

      layer.setMap(newEnabled ? map : null);

      console.log(`🔍 toggleLayer: Returning updated layers with ${layerId} enabled: ${newEnabled}`);
      return newLayers;
    });
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
    if (!map || !event.latLng) return;

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
  }, [map, detectOverlappingFeatures, onOverlappingFeaturesClick]);

  const handleSeattleZoningClick = useCallback((event: google.maps.Data.MouseEvent) => {
    if (!map || !event.latLng) return;

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
  }, [map, detectOverlappingFeatures, onOverlappingFeaturesClick]);

  const addIntersectionLayer = useCallback((geoJsonData: GeoJsonFeatureCollection) => {
    if (!map) return;

    let filteredGeoJson = geoJsonData;
    const seattleZoningEnabled = layers.some(l => l.id === 'SDCI Zoning' && l.enabled);
    
    if (seattleZoningEnabled) {
      console.log('Filtering intersection results based on Seattle Zoning filters');
      filteredGeoJson = {
        ...geoJsonData,
        features: geoJsonData.features.filter((feature) => {
          const properties = feature.properties || {};
          const categoryDesc = properties.category_desc as string;
          const baseZone = properties.base_zone as string;
          
          if (categoryDesc && typeof categoryDesc === 'string') {
            const categoryVisible = seattleZoningFilters.has(categoryDesc);
            const baseZoneVisible = seattleBaseZoneFilters.size === 0 ? false : seattleBaseZoneFilters.has(baseZone);
            const shouldShow = categoryVisible && baseZoneVisible;
            console.log(`Feature with category '${categoryDesc}', base zone '${baseZone}': ${shouldShow ? 'keeping' : 'filtering out'}`);
            return shouldShow;
          }
          
          return true;
        })
      };
      
      console.log(`Filtered ${geoJsonData.features.length} features to ${filteredGeoJson.features.length}`);
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
    
    console.log(`Final filtered: ${finalGeoJson.features.length} polygon features`);
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

    console.log(`Added intersection layer with ${finalGeoJson.features?.length || 0} features`);
  }, [map, layers, seattleZoningFilters, seattleBaseZoneFilters, handleDynamicClick]);

  const toggleSeattleZoneFilter = useCallback((zoneCategory: string) => {
    setSeattleZoningFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(zoneCategory)) {
        newFilters.delete(zoneCategory);
      } else {
        newFilters.add(zoneCategory);
      }
      return newFilters;
    });
  }, []);

  const toggleSeattleBaseZoneFilter = useCallback((baseZone: string) => {
    setSeattleBaseZoneFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(baseZone)) {
        newFilters.delete(baseZone);
      } else {
        newFilters.add(baseZone);
      }
      return newFilters;
    });
  }, []);

  useEffect(() => {
    const seattleLayer = layersRef.current.get('SDCI Zoning');
    if (seattleLayer && seattleZoningFilters.size > 0) {
      const availableBaseZones = new Set<string>();
      
      seattleLayer.forEach(feature => {
        const categoryDesc = feature.getProperty('category_desc') as string;
        const baseZone = feature.getProperty('base_zone') as string;
        
        if (baseZone && categoryDesc && seattleZoningFilters.has(categoryDesc)) {
          availableBaseZones.add(baseZone);
        }
      });

      setSeattleBaseZoneFilters(availableBaseZones);
    }
  }, [seattleZoningFilters]);

  useEffect(() => {
    const seattleLayer = layersRef.current.get('SDCI Zoning');
    if (seattleLayer) {
      seattleLayer.setStyle((feature: google.maps.Data.Feature) => {
        const category = feature.getProperty('category_desc') as string;
        const baseZone = feature.getProperty('base_zone') as string;
        
        const categoryVisible = seattleZoningFilters.has(category);
        const baseZoneVisible = seattleBaseZoneFilters.size === 0 ? false : seattleBaseZoneFilters.has(baseZone);
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
    }
  }, [seattleZoningFilters, seattleBaseZoneFilters]);

  // Function to get layers with current enabled state (synchronous)
  const getLayersWithCurrentState = () => {
    return layers.map(layer => ({
      ...layer,
      enabled: enabledLayersRef.current.has(layer.id)
    }));
  };

  // Function to update layer z-index based on hierarchy
  const updateLayerZIndex = useCallback((layerId: string, zIndex: number) => {
    const layer = layersRef.current.get(layerId);
    if (layer && map) {
      // Update the layer style to include zIndex
      const currentStyle = layers.find(l => l.id === layerId)?.styleFunction;
      if (currentStyle) {
        layer.setStyle((feature: google.maps.Data.Feature) => {
          const baseStyle = currentStyle(feature);
          return {
            ...baseStyle,
            zIndex
          };
        });
      } else {
        layer.setStyle({ zIndex });
      }

      // Update the layers state
      setLayers(prev =>
        prev.map(l =>
          l.id === layerId ? { ...l, zIndex } : l
        )
      );
    }
  }, [map, layers]);

  return {
    layers,
    toggleLayer,
    layersRef: layersRef.current,
    addIntersectionLayer,
    seattleZoningFilters,
    toggleSeattleZoneFilter,
    seattleZoningColors: SEATTLE_ZONING_COLORS,
    seattleBaseZoneFilters,
    toggleSeattleBaseZoneFilter,
    locations,
    selectedLocation,
    setSelectedLocation,
    getLayersWithCurrentState,
    updateLayerZIndex
  };
};