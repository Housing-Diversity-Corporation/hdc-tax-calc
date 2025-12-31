import { SearchResult } from '../../types/map/map.types';

// Seattle downtown coordinates for mock searches
export const SEATTLE_DOWNTOWN = {
  lat: 47.6062,
  lng: -122.3321
};

// Mock place types mapping (following Google Places API types)
type PlaceTypeConfig = {
  names: string[];
  types: string[];  // Google Places API types with hierarchy
};

const placeTypeConfigs: Record<string, PlaceTypeConfig> = {
  // Fitness & Sports (Priority 1)
  gym: {
    names: ['Fitness Center', 'PowerGym', 'Elite Fitness', 'Iron Works', 'Body Factory', 'Muscle Club', 'FitLife', 'The Gym'],
    types: ['gym', 'health', 'point_of_interest', 'establishment']
  },
  fitness: {
    names: ['Athletic Club', 'Strong Studio', 'Peak Performance', 'Vitality Fitness', 'CrossFit Box', 'Yoga Studio'],
    types: ['gym', 'health', 'point_of_interest', 'establishment']
  },
  spa: {
    names: ['Serenity Spa', 'Wellness Center', 'Rejuvenate Spa', 'Zen Retreat', 'Luxury Spa', 'Tranquil Day Spa'],
    types: ['spa', 'beauty_salon', 'health', 'point_of_interest', 'establishment']
  },

  // Food & Drink (Priority 2)
  cafe: {
    names: ['Morning Brew Cafe', 'Corner Coffeehouse', 'Espresso Lounge', 'The Daily Grind', 'Java Junction', 'Steam Cafe'],
    types: ['cafe', 'food', 'point_of_interest', 'establishment']
  },
  coffee: {
    names: ['Starbucks', 'Local Coffee Co', 'Brew House', 'Roast & Toast', 'Caffeine Dreams', 'Coffee Culture'],
    types: ['cafe', 'coffee_shop', 'food', 'point_of_interest', 'establishment']
  },
  boba: {
    names: ['Boba Tea House', 'Bubble Bliss', 'Tea Time Cafe', 'Pearl Tea Lounge', 'Tiger Sugar', 'Kung Fu Tea'],
    types: ['cafe', 'tea_house', 'food', 'point_of_interest', 'establishment']
  },
  bar: {
    names: ['The Tap Room', 'Sports Bar & Grill', 'Cocktail Lounge', 'Brew Pub', 'Wine Bar', 'The Ale House'],
    types: ['bar', 'night_club', 'food', 'point_of_interest', 'establishment']
  },
  restaurant: {
    names: ['The Bistro', 'Fine Dining', 'Local Eats', 'The Kitchen', 'Tasty Bites', 'Culinary Delights'],
    types: ['restaurant', 'food', 'point_of_interest', 'establishment']
  },
  pizza: {
    names: ['Pizza Palace', 'Slice House', 'Italiano Pizza', 'Brick Oven', 'Pizza Express', 'Papa\'s Pizzeria'],
    types: ['pizza_restaurant', 'restaurant', 'food', 'point_of_interest', 'establishment']
  },
  sushi: {
    names: ['Sushi Bar', 'Tokyo Sushi', 'Sake House', 'Zen Sushi', 'Samurai Sushi', 'Nami Sushi'],
    types: ['sushi_restaurant', 'restaurant', 'food', 'point_of_interest', 'establishment']
  },

  // Healthcare (Priority 3)
  pharmacy: {
    names: ['CVS Pharmacy', 'Walgreens', 'Local Pharmacy', 'Health Mart', 'Care Pharmacy', 'Wellness Drugs'],
    types: ['pharmacy', 'drugstore', 'health', 'store', 'point_of_interest', 'establishment']
  },
  hospital: {
    names: ['City Hospital', 'Medical Center', 'Regional Hospital', 'Emergency Care', 'Health Center', 'General Hospital'],
    types: ['hospital', 'doctor', 'health', 'point_of_interest', 'establishment']
  },
  dentist: {
    names: ['Smile Dental', 'Family Dentistry', 'Bright Teeth', 'Dental Care', 'Tooth Doctors', 'Gentle Dental'],
    types: ['dentist', 'doctor', 'health', 'point_of_interest', 'establishment']
  },
  veterinary: {
    names: ['Pet Vet Clinic', 'Animal Hospital', 'Paws & Claws', 'Veterinary Care', 'Pet Health Center', 'VetCare'],
    types: ['veterinary_care', 'health', 'point_of_interest', 'establishment']
  },

  // Finance
  bank: {
    names: ['Chase Bank', 'Bank of America', 'Wells Fargo', 'US Bank', 'Credit Union', 'Community Bank'],
    types: ['bank', 'atm', 'finance', 'point_of_interest', 'establishment']
  },

  // Auto & Gas
  gas: {
    names: ['Shell', '76', 'Chevron', 'BP Gas', 'Texaco', 'Arco'],
    types: ['gas_station', 'convenience_store', 'store', 'point_of_interest', 'establishment']
  },

  // Entertainment
  movie: {
    names: ['AMC Theaters', 'Regal Cinema', 'Cinemark', 'IMAX Theater', 'Local Theater', 'Picture House'],
    types: ['movie_theater', 'entertainment', 'point_of_interest', 'establishment']
  },
  casino: {
    names: ['Lucky Star Casino', 'The Palace Casino', 'Fortune Casino', 'Golden Gate', 'Royal Casino', 'Vegas Nights'],
    types: ['casino', 'entertainment', 'point_of_interest', 'establishment']
  },

  // Education
  school: {
    names: ['Lincoln Elementary', 'Central High School', 'Academy of Learning', 'Public School', 'Private Academy', 'Charter School'],
    types: ['school', 'primary_school', 'education', 'point_of_interest', 'establishment']
  },
  university: {
    names: ['State University', 'City College', 'Technical Institute', 'Community College', 'Liberal Arts College', 'University'],
    types: ['university', 'school', 'education', 'point_of_interest', 'establishment']
  },
  library: {
    names: ['Public Library', 'Central Library', 'Branch Library', 'Community Library', 'City Library', 'Reading Center'],
    types: ['library', 'book_store', 'store', 'point_of_interest', 'establishment']
  },

  // Parks & Recreation
  park: {
    names: ['City Park', 'Central Park', 'Riverside Park', 'Community Park', 'Green Space', 'Memorial Park'],
    types: ['park', 'tourist_attraction', 'point_of_interest', 'establishment']
  },
  zoo: {
    names: ['City Zoo', 'Wildlife Park', 'Animal Sanctuary', 'Safari Park', 'Zoo & Aquarium', 'Exotic Animals'],
    types: ['zoo', 'tourist_attraction', 'point_of_interest', 'establishment']
  },
  aquarium: {
    names: ['Ocean Aquarium', 'Sea Life Center', 'Marine World', 'Underwater World', 'Fish Aquarium', 'Aquatic Center'],
    types: ['aquarium', 'tourist_attraction', 'point_of_interest', 'establishment']
  },

  // Shopping
  shopping: {
    names: ['Shopping Center', 'Retail Plaza', 'The Mall', 'Shopping District', 'Market Square', 'Outlet Center'],
    types: ['shopping_mall', 'store', 'point_of_interest', 'establishment']
  },
  store: {
    names: ['General Store', 'Convenience Store', 'Department Store', 'Retail Shop', 'The Store', 'Quick Stop'],
    types: ['store', 'point_of_interest', 'establishment']
  },

  // Transportation
  airport: {
    names: ['International Airport', 'Regional Airport', 'City Airport', 'Municipal Airport', 'Air Terminal', 'Flight Center'],
    types: ['airport', 'transit_station', 'point_of_interest', 'establishment']
  },
  transit: {
    names: ['Bus Station', 'Metro Station', 'Transit Hub', 'Railway Station', 'Transit Center', 'Transport Terminal'],
    types: ['transit_station', 'train_station', 'point_of_interest', 'establishment']
  },

  // Lodging
  hotel: {
    names: ['Grand Hotel', 'Comfort Inn', 'Luxury Suites', 'Boutique Hotel', 'City Hotel', 'Riverside Lodge'],
    types: ['lodging', 'hotel', 'point_of_interest', 'establishment']
  },

  // Neighborhood Categories (aligned with NEIGHBORHOOD_CATEGORIES)
  // Transportation Category
  bus_station: {
    names: ['Metro Bus Station', 'Transit Center', 'Regional Bus Terminal', 'Downtown Bus Hub', 'City Bus Depot', 'Express Bus Station', 'Local Transit Stop', 'Commuter Bus Plaza'],
    types: ['bus_station', 'transit_station', 'point_of_interest', 'establishment']
  },
  subway_station: {
    names: ['Central Metro Station', 'Underground Transit Hub', 'Subway Terminal', 'Light Rail Station', 'Metro Link', 'City Metro Stop', 'Rail Transit Center', 'Express Metro'],
    types: ['subway_station', 'light_rail_station', 'transit_station', 'point_of_interest', 'establishment']
  },
  train_station: {
    names: ['Union Station', 'Central Train Terminal', 'Railway Station', 'Amtrak Station', 'Commuter Rail Hub', 'Regional Train Center', 'Railroad Terminal', 'Express Rail'],
    types: ['train_station', 'transit_station', 'point_of_interest', 'establishment']
  },

  // Health & Wellness Category
  wellness_center: {
    names: ['Holistic Wellness Center', 'Mind & Body Wellness', 'Integrative Health Studio', 'Wellness & Recovery', 'Natural Health Center', 'Vitality Wellness', 'Balance Wellness Hub', 'Total Wellness Spa'],
    types: ['wellness_center', 'health', 'spa', 'point_of_interest', 'establishment']
  },
  yoga_studio: {
    names: ['Zen Yoga Studio', 'Hot Yoga Collective', 'Flow Yoga Center', 'Power Yoga Studio', 'Inner Peace Yoga', 'Bikram Yoga', 'Vinyasa Flow Studio', 'Mindful Yoga Space'],
    types: ['yoga_studio', 'gym', 'health', 'point_of_interest', 'establishment']
  },
  massage: {
    names: ['Tranquility Massage Therapy', 'Deep Tissue Clinic', 'Therapeutic Massage Center', 'Healing Touch Spa', 'Sports Massage Studio', 'Relaxation Massage', 'Body & Soul Massage', 'Premier Massage Therapy'],
    types: ['massage', 'spa', 'health', 'point_of_interest', 'establishment']
  },
  medical_clinic: {
    names: ['Community Health Clinic', 'Family Medical Center', 'Urgent Care Clinic', 'Primary Care Associates', 'Walk-In Medical Center', 'Neighborhood Health Clinic', 'Express Care Medical', 'Health First Clinic'],
    types: ['doctor', 'hospital', 'health', 'point_of_interest', 'establishment']
  },

  // Housing Category
  apartment_complex: {
    names: ['Riverside Apartments', 'The Heights Residences', 'Park View Towers', 'Urban Living Complex', 'Skyline Apartments', 'Garden Court Residences', 'Metro Apartments', 'Downtown Living'],
    types: ['apartment_complex', 'housing_complex', 'real_estate_agency', 'point_of_interest', 'establishment']
  },
  condominium_complex: {
    names: ['Luxury Condos', 'Harbor View Condominiums', 'Elite Condo Tower', 'Waterfront Condos', 'Premier Condominium', 'City View Condos', 'Modern Condo Living', 'Grand Condominiums'],
    types: ['condominium_complex', 'housing_complex', 'real_estate_agency', 'point_of_interest', 'establishment']
  },

  // Education Category
  primary_school: {
    names: ['Lincoln Elementary School', 'Riverside Primary', 'Oakwood Elementary', 'Washington Grade School', 'Maple Leaf Elementary', 'Heritage Primary School', 'Sunshine Elementary', 'Discovery Elementary'],
    types: ['primary_school', 'school', 'education', 'point_of_interest', 'establishment']
  },
  secondary_school: {
    names: ['Central High School', 'Roosevelt Secondary', 'Metro High School', 'Lincoln Academy', 'Jefferson High', 'Madison High School', 'Valley Secondary School', 'Summit High'],
    types: ['secondary_school', 'school', 'education', 'point_of_interest', 'establishment']
  },

  // Entertainment & Recreation Category
  dog_park: {
    names: ['Bark Park', 'Paws & Play Dog Park', 'Canine Commons', 'Happy Tails Dog Park', 'Off-Leash Dog Area', 'Doggy Playground', 'Pooch Park', 'Pet Paradise'],
    types: ['dog_park', 'park', 'point_of_interest', 'establishment']
  },
  community_center: {
    names: ['Neighborhood Community Center', 'Recreation & Community Hub', 'City Community Center', 'Family Resource Center', 'Cultural Community Center', 'Youth & Community Center', 'Social Services Hub', 'Community Activities Center'],
    types: ['community_center', 'establishment', 'point_of_interest']
  },
  movie_theater: {
    names: ['Cineplex Theater', 'AMC Cinema', 'Regal Movies', 'IMAX Experience', 'Art House Cinema', 'Multiplex Theater', 'Classic Movie House', 'Premium Cinema'],
    types: ['movie_theater', 'entertainment', 'point_of_interest', 'establishment']
  },
  amusement_park: {
    names: ['Adventure Land', 'Family Fun Park', 'Thrill Seeker Park', 'Fantasy World', 'Happy Times Amusement', 'Wonder Park', 'Joy Ride Park', 'Excitement Central'],
    types: ['amusement_park', 'tourist_attraction', 'point_of_interest', 'establishment']
  },
  botanical_garden: {
    names: ['City Botanical Gardens', 'Harmony Gardens', 'Nature Conservatory', 'Flora & Fauna Gardens', 'Tranquil Botanic Park', 'Heritage Gardens', 'Zen Botanical Center', 'Green Oasis Gardens'],
    types: ['botanical_garden', 'garden', 'park', 'tourist_attraction', 'point_of_interest', 'establishment']
  },
};

const streetNames = [
  'Main St', 'Broadway', 'Park Ave', 'Oak St', 'Maple Ave',
  '1st Ave', '2nd Ave', 'Market St', 'Union St', 'Pike St',
  'Madison St', 'Jefferson St', 'Jackson St', 'Spring St'
];

const cities = ['Seattle', 'Bellevue', 'Tacoma', 'Spokane', 'Portland'];

const reviewTexts = [
  'Great place! Really enjoyed the atmosphere and friendly staff.',
  'Best in town! Highly recommend trying their signature items.',
  'Good service and quality. Will definitely come back.',
  'Nice location and good value for money.',
  'Excellent experience! The staff was very attentive.',
  'Love this place! Been coming here for years.',
  'Decent place, nothing special but gets the job done.',
  'Amazing! Exceeded all my expectations.',
  'Good spot for a quick visit. Clean and organized.',
  'Friendly staff and great ambiance. Perfect!',
];

const authorNames = [
  'John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emily Brown',
  'David Lee', 'Jennifer Garcia', 'Chris Martinez', 'Amanda Davis',
  'James Rodriguez', 'Lisa Anderson', 'Robert Taylor', 'Maria Thomas'
];

// Generate random coordinate within radius (in meters) of center
function randomLocationInRadius(
  centerLat: number,
  centerLng: number,
  radius: number
): { lat: number; lng: number } {
  const radiusInDegrees = radius / 111000; // Approximate meters to degrees

  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;

  const lat = centerLat + distance * Math.cos(angle);
  const lng = centerLng + distance * Math.sin(angle);

  return { lat, lng };
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Get place config for keyword
function getPlaceConfig(keyword: string): PlaceTypeConfig {
  const lowerKeyword = keyword.toLowerCase();
  const config = placeTypeConfigs[lowerKeyword];

  if (config) return config;

  // Fallback: try to find a config that matches keyword
  for (const [key, value] of Object.entries(placeTypeConfigs)) {
    if (lowerKeyword.includes(key) || key.includes(lowerKeyword)) {
      return value;
    }
  }

  // Default to restaurant if no match found
  return placeTypeConfigs.restaurant;
}

// Get place names for keyword
function getPlaceNames(keyword: string, count: number): string[] {
  const config = getPlaceConfig(keyword);
  const templates = config.names;

  // If we need more names than templates, add numbered variations
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    if (i >= templates.length) {
      names.push(`${template} ${Math.floor(i / templates.length) + 1}`);
    } else {
      names.push(template);
    }
  }

  return names;
}

// Generate mock reviews
function generateMockReviews(count: number): SearchResult['reviews'] {
  const reviews = [];
  for (let i = 0; i < count; i++) {
    const authorName = authorNames[Math.floor(Math.random() * authorNames.length)];
    const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
    const daysAgo = Math.floor(Math.random() * 90); // 0-90 days ago

    reviews.push({
      author_name: authorName,
      author_url: `https://maps.google.com/user/${authorName.replace(' ', '')}`,
      profile_photo_url: `https://i.pravatar.cc/150?u=${authorName}`,
      rating: rating,
      relative_time_description: `${daysAgo} days ago`,
      text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
      time: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    });
  }
  return reviews;
}

// Generate mock place data
export function generateMockPlaces(
  keyword: string,
  centerLat: number,
  centerLng: number,
  radius: number,
  count: number = 10
): SearchResult[] {
  console.log(`🎭 MOCK DATA - Generating ${count} mock places for "${keyword}"`);

  const placeNames = getPlaceNames(keyword, count);
  const results: SearchResult[] = [];

  for (let i = 0; i < count; i++) {
    const location = randomLocationInRadius(centerLat, centerLng, radius);
    const distance = calculateDistance(centerLat, centerLng, location.lat, location.lng);

    const streetNumber = Math.floor(Math.random() * 9999) + 100;
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const zipCode = 98000 + Math.floor(Math.random() * 200);

    const rating = Math.round((Math.random() * 1.5 + 3.5) * 10) / 10; // 3.5-5.0
    const reviewCount = Math.floor(Math.random() * 500) + 50;
    const priceLevel = Math.floor(Math.random() * 3) + 1; // 1-3 ($-$$$)

    // Random amenities
    const hasFood = keyword.toLowerCase().includes('restaurant') ||
                    keyword.toLowerCase().includes('cafe') ||
                    keyword.toLowerCase().includes('food') ||
                    keyword.toLowerCase().includes('boba') ||
                    keyword.toLowerCase().includes('coffee');

    const result: SearchResult = {
      place_id: `mock_place_${Date.now()}_${i}`,
      name: placeNames[i],
      formatted_address: `${streetNumber} ${streetName}, ${city}, WA ${zipCode}, USA`,
      geometry: {
        location: {
          lat: () => location.lat,
          lng: () => location.lng,
        },
      },
      rating: rating,
      user_ratings_total: reviewCount,
      types: getPlaceConfig(keyword).types,
      distance: distance,
      website: `https://www.${placeNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
      formatted_phone_number: `(206) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      business_status: 'OPERATIONAL',
      photos: [
        {
          name: `places/${Date.now()}_${i}/photos/photo1`,
          widthPx: 1200,
          heightPx: 800,
          authorAttributions: [{
            displayName: authorNames[Math.floor(Math.random() * authorNames.length)],
            uri: 'https://maps.google.com',
            photoUri: `https://i.pravatar.cc/150?img=${i}`
          }]
        }
      ],
      price_level: priceLevel,
      opening_hours: {
        periods: [],
        weekdayDescriptions: [
          'Monday: 8:00 AM – 8:00 PM',
          'Tuesday: 8:00 AM – 8:00 PM',
          'Wednesday: 8:00 AM – 8:00 PM',
          'Thursday: 8:00 AM – 8:00 PM',
          'Friday: 8:00 AM – 10:00 PM',
          'Saturday: 9:00 AM – 10:00 PM',
          'Sunday: 9:00 AM – 6:00 PM',
        ],
      },
      current_opening_hours: {
        openNow: Math.random() > 0.3, // 70% chance of being open
      },
      reviews: generateMockReviews(Math.floor(Math.random() * 4) + 2), // 2-5 reviews
      takeout: hasFood ? Math.random() > 0.3 : undefined,
      delivery: hasFood ? Math.random() > 0.5 : undefined,
      dine_in: hasFood ? Math.random() > 0.2 : undefined,
      outdoor_seating: hasFood ? Math.random() > 0.6 : undefined,
      allows_dogs: Math.random() > 0.7,
      payment_options: {
        acceptsCreditCards: true,
        acceptsDebitCards: true,
        acceptsCashOnly: false,
        acceptsNfc: Math.random() > 0.5,
      },
      google_maps_links: {
        directionsUri: `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
        placeUri: `https://www.google.com/maps/place/?q=place_id:mock_${i}`,
      },
    };

    results.push(result);
  }

  // Sort by distance
  results.sort((a, b) => (a.distance || 0) - (b.distance || 0));

  console.log(`✅ MOCK DATA - Generated ${results.length} mock places`, {
    keyword,
    centerLocation: { lat: centerLat, lng: centerLng },
    radius,
    results: results.map(r => ({ name: r.name, distance: Math.round(r.distance || 0) + 'm' }))
  });

  return results;
}