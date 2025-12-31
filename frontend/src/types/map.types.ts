export interface Property {
  id: string;
  name: string;
  address: string;
  units: string;
  bld_size: string;
  unit_size: string;
  walk_score: string;
  bike_score: string;
  transit_score: string;
  lat: string;
  lng: string;
  owner: string;
  url: string;
  status: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  category: string;
}

export interface Comp {
  id: string;
  name: string;
  address: string;
  units: string;
  studio_rent: string;
  studio_sf: string;
  onebr1ba_rent: string;
  onebr1ba_sf: string;
  latitude: string;
  longitude: string;
}

export interface SearchResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  distance?: number;
}

export interface LayerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  layer?: google.maps.Data;
}

export interface SponsorConfig {
  [key: string]: {
    color: string;
    properties: google.maps.marker.AdvancedMarkerElement[];
  };
}
