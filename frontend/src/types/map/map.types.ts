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

export interface SearchSession {
  id: string;
  textQuery: string;
  radius: number;
  centerLat: number;
  centerLng: number;
  results: SearchResult[];
  timestamp: number;
  color: string;
  isMockData?: boolean;
  selectedCategories?: string[];
  searchType?: 'text' | 'nearby' | 'hybrid';
}

export interface SearchResult {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry?: {
    location: {
      lat: (() => number) | number;
      lng: (() => number) | number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  distance?: number;
  customMarkerType?: string; // User's custom marker type selection (session-only)

  // Place Details (New) API fields
  website?: string;
  formatted_phone_number?: string;
  business_status?: string;
  photos?: any[];
  price_level?: number | string; // Can be number (0-4) or string enum ('FREE', 'INEXPENSIVE', etc.)

  // Opening Hours
  opening_hours?: any;
  current_opening_hours?: any;

  // Reviews
  reviews?: Array<{
    author_name: string;
    author_url?: string;
    language?: string;
    profile_photo_url?: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
  }>;

  // Amenities
  takeout?: boolean;
  delivery?: boolean;
  dine_in?: boolean;
  outdoor_seating?: boolean;
  allows_dogs?: boolean;

  // Additional Rich Data
  payment_options?: any;
  editorial_summary?: {
    text: string;
    languageCode?: string;
  };
  generative_summary?: {
    overview?: {
      text: string;
      languageCode?: string;
    };
    description?: {
      text: string;
      languageCode?: string;
    };
  };
  review_summary?: {
    text: string;
    languageCode?: string;
  };
  google_maps_links?: {
    directionsUri?: string;
    photosUri?: string;
    placeUri?: string;
    reviewsUri?: string;
    writeAReviewUri?: string;
  };
  address_descriptor?: {
    areas?: Array<{
      name: string;
      displayName?: {
        text: string;
        languageCode?: string;
      };
      containment?: string;
    }>;
    landmarks?: Array<{
      name: string;
      displayName?: {
        text: string;
        languageCode?: string;
      };
      types?: string[];
      spatialRelationship?: string;
      straightLineDistanceMeters?: number;
      travelDistanceMeters?: number;
    }>;
  };
  address_components?: any[];
  plus_code?: any;
  viewport?: any;
}

export interface LayerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  layer?: google.maps.Data;
  tierColors?: string[];  // If provided, enables tier-based styling
  groupId?: string;  // For versioned layers: identifies which group this layer belongs to
  version?: string;  // For versioned layers: version identifier (e.g., "2025", "2026", "2.0")
}

export interface SponsorConfig {
  [key: string]: {
    color: string;
    properties: google.maps.marker.AdvancedMarkerElement[];
  };
}
