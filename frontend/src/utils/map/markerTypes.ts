/**
 * Marker Type Definitions for User Customization
 * Provides organized catalog of all available marker types for the marker selector
 */

import { ESTABLISHMENT_COLORS } from './customMarkerSVGs';

export interface MarkerTypeDefinition {
  id: string;
  label: string;
  color: string;
  category: string;
  keywords: string[]; // For search filtering
}

// Category definitions for organized display
export const MARKER_CATEGORIES = {
  transport: {
    id: 'transport',
    label: 'Transportation',
    icon: '🚗',
  },
  food: {
    id: 'food',
    label: 'Food & Dining',
    icon: '🍽️',
  },
  health: {
    id: 'health',
    label: 'Health & Wellness',
    icon: '🏥',
  },
  shopping: {
    id: 'shopping',
    label: 'Shopping & Retail',
    icon: '🛍️',
  },
  lodging: {
    id: 'lodging',
    label: 'Lodging',
    icon: '🏨',
  },
  education: {
    id: 'education',
    label: 'Education & Culture',
    icon: '📚',
  },
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    icon: '🎭',
  },
  sports: {
    id: 'sports',
    label: 'Sports & Fitness',
    icon: '💪',
  },
  services: {
    id: 'services',
    label: 'Services',
    icon: '🔧',
  },
  nature: {
    id: 'nature',
    label: 'Nature & Parks',
    icon: '🌳',
  },
  finance: {
    id: 'finance',
    label: 'Finance',
    icon: '💰',
  },
  government: {
    id: 'government',
    label: 'Government & Public',
    icon: '🏛️',
  },
} as const;

// Complete marker type catalog
export const MARKER_TYPES: Record<string, MarkerTypeDefinition> = {
  // TRANSPORTATION
  airport: {
    id: 'airport',
    label: 'Airport',
    color: ESTABLISHMENT_COLORS.airport,
    category: 'transport',
    keywords: ['airport', 'flight', 'airplane', 'terminal'],
  },
  bus_station: {
    id: 'bus_station',
    label: 'Bus Station',
    color: ESTABLISHMENT_COLORS.transit,
    category: 'transport',
    keywords: ['bus', 'station', 'transit', 'public transport'],
  },
  train_station: {
    id: 'train_station',
    label: 'Train Station',
    color: ESTABLISHMENT_COLORS.station,
    category: 'transport',
    keywords: ['train', 'station', 'rail', 'subway', 'metro'],
  },
  parking: {
    id: 'parking',
    label: 'Parking',
    color: ESTABLISHMENT_COLORS.transit,
    category: 'transport',
    keywords: ['parking', 'lot', 'garage', 'car'],
  },
  gas_station: {
    id: 'gas_station',
    label: 'Gas Station',
    color: ESTABLISHMENT_COLORS.gas,
    category: 'transport',
    keywords: ['gas', 'fuel', 'petrol', 'station'],
  },

  // FOOD & DINING
  cafe: {
    id: 'cafe',
    label: 'Cafe / Coffee Shop',
    color: ESTABLISHMENT_COLORS.cafe,
    category: 'food',
    keywords: ['cafe', 'coffee', 'espresso', 'latte'],
  },
  restaurant: {
    id: 'restaurant',
    label: 'Restaurant',
    color: ESTABLISHMENT_COLORS.restaurant,
    category: 'food',
    keywords: ['restaurant', 'dining', 'food', 'eat'],
  },
  bar: {
    id: 'bar',
    label: 'Bar / Pub',
    color: ESTABLISHMENT_COLORS.bar,
    category: 'food',
    keywords: ['bar', 'pub', 'drinks', 'nightlife', 'alcohol'],
  },
  pizza_restaurant: {
    id: 'pizza_restaurant',
    label: 'Pizza Restaurant',
    color: ESTABLISHMENT_COLORS.food,
    category: 'food',
    keywords: ['pizza', 'pizzeria', 'italian'],
  },
  ice_cream_shop: {
    id: 'ice_cream_shop',
    label: 'Ice Cream Shop',
    color: ESTABLISHMENT_COLORS.food,
    category: 'food',
    keywords: ['ice cream', 'gelato', 'dessert', 'sweets'],
  },

  // HEALTH & WELLNESS
  hospital: {
    id: 'hospital',
    label: 'Hospital',
    color: ESTABLISHMENT_COLORS.hospital,
    category: 'health',
    keywords: ['hospital', 'emergency', 'medical', 'health'],
  },
  pharmacy: {
    id: 'pharmacy',
    label: 'Pharmacy',
    color: ESTABLISHMENT_COLORS.pharmacy,
    category: 'health',
    keywords: ['pharmacy', 'drugstore', 'medicine', 'prescription'],
  },
  dentist: {
    id: 'dentist',
    label: 'Dentist',
    color: ESTABLISHMENT_COLORS.dentist,
    category: 'health',
    keywords: ['dentist', 'dental', 'teeth', 'orthodontist'],
  },
  doctor: {
    id: 'doctor',
    label: 'Doctor / Clinic',
    color: ESTABLISHMENT_COLORS.doctor,
    category: 'health',
    keywords: ['doctor', 'clinic', 'physician', 'medical'],
  },
  veterinary: {
    id: 'veterinary',
    label: 'Veterinary',
    color: ESTABLISHMENT_COLORS.veterinary,
    category: 'health',
    keywords: ['vet', 'veterinary', 'animal', 'pet', 'dog', 'cat'],
  },
  spa: {
    id: 'spa',
    label: 'Spa / Wellness',
    color: ESTABLISHMENT_COLORS.spa,
    category: 'health',
    keywords: ['spa', 'wellness', 'massage', 'relaxation'],
  },

  // SHOPPING & RETAIL
  shopping: {
    id: 'shopping',
    label: 'Shopping / Store',
    color: ESTABLISHMENT_COLORS.shopping,
    category: 'shopping',
    keywords: ['shopping', 'store', 'shop', 'retail', 'mall'],
  },
  grocery_store: {
    id: 'grocery_store',
    label: 'Grocery Store',
    color: ESTABLISHMENT_COLORS.shopping,
    category: 'shopping',
    keywords: ['grocery', 'supermarket', 'food', 'market'],
  },

  // LODGING
  hotel: {
    id: 'hotel',
    label: 'Hotel / Motel',
    color: ESTABLISHMENT_COLORS.hotel,
    category: 'lodging',
    keywords: ['hotel', 'motel', 'inn', 'accommodation'],
  },
  campground: {
    id: 'campground',
    label: 'Campground',
    color: ESTABLISHMENT_COLORS.lodging,
    category: 'lodging',
    keywords: ['campground', 'camping', 'tent', 'rv'],
  },

  // EDUCATION & CULTURE
  school: {
    id: 'school',
    label: 'School',
    color: ESTABLISHMENT_COLORS.school,
    category: 'education',
    keywords: ['school', 'education', 'learning', 'elementary'],
  },
  university: {
    id: 'university',
    label: 'University / College',
    color: ESTABLISHMENT_COLORS.university,
    category: 'education',
    keywords: ['university', 'college', 'higher education'],
  },
  library: {
    id: 'library',
    label: 'Library',
    color: ESTABLISHMENT_COLORS.library,
    category: 'education',
    keywords: ['library', 'books', 'reading', 'public library'],
  },
  museum: {
    id: 'museum',
    label: 'Museum / Gallery',
    color: ESTABLISHMENT_COLORS.entertainment,
    category: 'education',
    keywords: ['museum', 'gallery', 'art', 'culture', 'history'],
  },

  // ENTERTAINMENT
  entertainment: {
    id: 'entertainment',
    label: 'Entertainment',
    color: ESTABLISHMENT_COLORS.entertainment,
    category: 'entertainment',
    keywords: ['entertainment', 'fun', 'activity'],
  },
  movie_theater: {
    id: 'movie_theater',
    label: 'Movie Theater',
    color: ESTABLISHMENT_COLORS.movie,
    category: 'entertainment',
    keywords: ['movie', 'theater', 'cinema', 'film'],
  },
  casino: {
    id: 'casino',
    label: 'Casino',
    color: ESTABLISHMENT_COLORS.casino,
    category: 'entertainment',
    keywords: ['casino', 'gambling', 'gaming'],
  },
  nightclub: {
    id: 'nightclub',
    label: 'Night Club',
    color: ESTABLISHMENT_COLORS.nightclub,
    category: 'entertainment',
    keywords: ['nightclub', 'club', 'dancing', 'nightlife'],
  },

  // SPORTS & FITNESS
  gym: {
    id: 'gym',
    label: 'Gym / Fitness Center',
    color: ESTABLISHMENT_COLORS.gym,
    category: 'sports',
    keywords: ['gym', 'fitness', 'workout', 'exercise'],
  },
  swimming_pool: {
    id: 'swimming_pool',
    label: 'Swimming Pool',
    color: ESTABLISHMENT_COLORS.gym,
    category: 'sports',
    keywords: ['swimming', 'pool', 'aquatic', 'swim'],
  },
  golf_course: {
    id: 'golf_course',
    label: 'Golf Course',
    color: ESTABLISHMENT_COLORS.park,
    category: 'sports',
    keywords: ['golf', 'course', 'country club'],
  },
  stadium: {
    id: 'stadium',
    label: 'Stadium / Arena',
    color: ESTABLISHMENT_COLORS.entertainment,
    category: 'sports',
    keywords: ['stadium', 'arena', 'sports venue'],
  },

  // SERVICES
  car_dealer: {
    id: 'car_dealer',
    label: 'Car Services',
    color: ESTABLISHMENT_COLORS.carrental,
    category: 'services',
    keywords: ['car', 'dealer', 'rental', 'repair', 'wash'],
  },
  bank: {
    id: 'bank',
    label: 'Bank',
    color: ESTABLISHMENT_COLORS.bank,
    category: 'finance',
    keywords: ['bank', 'banking', 'atm', 'finance'],
  },

  // NATURE & PARKS
  park: {
    id: 'park',
    label: 'Park / Garden',
    color: ESTABLISHMENT_COLORS.park,
    category: 'nature',
    keywords: ['park', 'garden', 'nature', 'outdoor'],
  },
  zoo: {
    id: 'zoo',
    label: 'Zoo',
    color: ESTABLISHMENT_COLORS.zoo,
    category: 'nature',
    keywords: ['zoo', 'animals', 'wildlife'],
  },
  aquarium: {
    id: 'aquarium',
    label: 'Aquarium',
    color: ESTABLISHMENT_COLORS.aquarium,
    category: 'nature',
    keywords: ['aquarium', 'fish', 'marine', 'sea life'],
  },

  // GOVERNMENT
  government: {
    id: 'government',
    label: 'Government / City Hall',
    color: ESTABLISHMENT_COLORS.school,
    category: 'government',
    keywords: ['government', 'city hall', 'public', 'municipal'],
  },

  // DEFAULT
  default: {
    id: 'default',
    label: 'Default / Other',
    color: ESTABLISHMENT_COLORS.default,
    category: 'services',
    keywords: ['default', 'other', 'generic', 'misc'],
  },
};

// Get all marker types grouped by category
export const getMarkerTypesByCategory = () => {
  const grouped: Record<string, MarkerTypeDefinition[]> = {};

  Object.values(MARKER_TYPES).forEach((markerType) => {
    if (!grouped[markerType.category]) {
      grouped[markerType.category] = [];
    }
    grouped[markerType.category].push(markerType);
  });

  return grouped;
};

// Get marker type by ID
export const getMarkerTypeById = (id: string): MarkerTypeDefinition | undefined => {
  return MARKER_TYPES[id];
};

// Search marker types by query
export const searchMarkerTypes = (query: string): MarkerTypeDefinition[] => {
  if (!query) return Object.values(MARKER_TYPES);

  const lowerQuery = query.toLowerCase();
  return Object.values(MARKER_TYPES).filter((type) =>
    type.label.toLowerCase().includes(lowerQuery) ||
    type.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
  );
};
