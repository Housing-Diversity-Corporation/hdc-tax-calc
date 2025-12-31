import {
  GraduationCap,
  Sparkles,
  Heart,
  Home,
  Train,
  type LucideIcon
} from 'lucide-react';

/**
 * Category definition for neighborhood exploration
 */
export interface NeighborhoodCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  types: string[];
  description?: string;
}

/**
 * All available neighborhood categories with their Google Places API types
 * Based on Google Places API (New) - November 2024 place types
 */
export const NEIGHBORHOOD_CATEGORIES: Record<string, NeighborhoodCategory> = {
  education: {
    id: 'education',
    label: 'Education',
    icon: GraduationCap,
    description: 'Schools, libraries, and educational institutions',
    types: [
      'library',
      'preschool',
      'primary_school',
      'school',
      'secondary_school',
      'university',
    ],
  },

  entertainment: {
    id: 'entertainment',
    label: 'Entertainment & Recreation',
    icon: Sparkles,
    description: 'Parks, entertainment venues, and recreational activities',
    types: [
      'adventure_sports_center',
      'amphitheatre',
      'amusement_center',
      'amusement_park',
      'aquarium',
      'banquet_hall',
      'barbecue_area',
      'botanical_garden',
      'bowling_alley',
      'casino',
      'childrens_camp',
      'comedy_club',
      'community_center',
      'concert_hall',
      'convention_center',
      'cultural_center',
      'cycling_park',
      'dance_hall',
      'dog_park',
      'event_venue',
      'ferris_wheel',
      'garden',
      'hiking_area',
      'historical_landmark',
      'internet_cafe',
      'karaoke',
      'marina',
      'movie_rental',
      'movie_theater',
      'national_park',
      'night_club',
      'observation_deck',
      'off_roading_area',
      'opera_house',
      'park',
      'philharmonic_hall',
      'picnic_ground',
      'planetarium',
      'plaza',
      'roller_coaster',
      'skateboard_park',
      'state_park',
      'tourist_attraction',
      'video_arcade',
      'visitor_center',
      'water_park',
      'wedding_venue',
      'wildlife_park',
      'wildlife_refuge',
      'zoo',
    ],
  },

  health: {
    id: 'health',
    label: 'Health & Wellness',
    icon: Heart,
    description: 'Healthcare facilities, gyms, and wellness centers',
    types: [
      'chiropractor',
      'dental_clinic',
      'dentist',
      'doctor',
      'drugstore',
      'hospital',
      'massage',
      'medical_lab',
      'pharmacy',
      'physiotherapist',
      'sauna',
      'skin_care_clinic',
      'spa',
      'tanning_studio',
      'wellness_center',
      'yoga_studio',
    ],
  },

  housing: {
    id: 'housing',
    label: 'Housing',
    icon: Home,
    description: 'Residential buildings and housing complexes',
    types: [
      'apartment_building',
      'apartment_complex',
      'condominium_complex',
      'housing_complex',
    ],
  },

  transportation: {
    id: 'transportation',
    label: 'Transportation',
    icon: Train,
    description: 'Public transit stations and transportation hubs',
    types: [
      'airport',
      'airstrip',
      'bus_station',
      'bus_stop',
      'ferry_terminal',
      'heliport',
      'international_airport',
      'light_rail_station',
      'park_and_ride',
      'subway_station',
      'taxi_stand',
      'train_station',
      'transit_depot',
      'transit_station',
      'truck_stop',
    ],
  },
};

/**
 * Get all category IDs as an array
 */
export const getCategoryIds = (): string[] => {
  return Object.keys(NEIGHBORHOOD_CATEGORIES);
};

/**
 * Get category by ID
 */
export const getCategoryById = (id: string): NeighborhoodCategory | undefined => {
  return NEIGHBORHOOD_CATEGORIES[id];
};

/**
 * Get all place types from selected categories
 */
export const getTypesFromCategories = (categoryIds: string[]): string[] => {
  return categoryIds.flatMap(
    (id) => NEIGHBORHOOD_CATEGORIES[id]?.types || []
  );
};

/**
 * Convert categories to multi-select options
 */
export const categoriesToOptions = () => {
  return Object.values(NEIGHBORHOOD_CATEGORIES).map((category) => ({
    label: category.label,
    value: category.id,
    icon: category.icon,
  }));
};
