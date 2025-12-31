/**
 * Custom SVG Marker System
 * Provides SVG templates and utilities for creating custom map markers
 * Uses brand theme colors
 */

// Brand Theme Colors
export const BRAND_COLORS = {
  fadedJade: '#407f7f',
  sushi: '#7fbd45',
  gulfStream: '#92c3c2',
  mercury: '#e5e5e5',
  cabbagePont: '#474a44',
  white: '#ffffff',
  black: '#000000',
  fountainBlue: '#54bfbf',
  sanJuan: '#3e5d80',
  bismark: '#43778a',
  spectra: '#1c3333',
  romanCoffee: '#73513e',
  husk: '#bfb05e',
  strikemaster: '#734968',
  brownRust: '#bf7041',
};

// Property Type Colors (Development)
export const PROPERTY_COLORS = {
  acquisition: BRAND_COLORS.brownRust,    // Brown/Rust for early stage
  preDevelopment: BRAND_COLORS.husk,      // Gold/Husk for planning
  construction: BRAND_COLORS.bismark,     // Blue for active construction
  completed: BRAND_COLORS.sushi,          // Green for completed

  // Government/School
  public: BRAND_COLORS.sanJuan,           // Blue for public
  private: BRAND_COLORS.strikemaster,     // Purple for private
  community: BRAND_COLORS.fountainBlue,   // Cyan for community
};

// Establishment Type Colors (Keyword Search)
// Organized by priority - more specific types take precedence
export const ESTABLISHMENT_COLORS = {
  // Fitness & Sports (Highest priority for health-related)
  gym: '#FF6B35',              // Orange-red for fitness
  fitness: '#FF6B35',
  spa: '#9B59B6',              // Purple for spa/wellness

  // Food & Dining
  cafe: '#6F4E37',             // Coffee brown
  coffee: '#6F4E37',
  restaurant: '#FBBC04',       // Yellow for food
  food: '#FBBC04',
  bar: '#C0392B',              // Dark red for bars

  // Education
  school: '#4285F4',           // Google Blue
  education: '#4285F4',
  university: '#4285F4',
  library: '#3498DB',          // Light blue for library

  // Healthcare
  hospital: '#EA4335',         // Red for medical
  health: '#EA4335',
  medical: '#EA4335',
  pharmacy: '#E74C3C',         // Bright red for pharmacy
  doctor: '#EA4335',
  dentist: '#EA4335',
  veterinary: '#E67E22',       // Orange for veterinary

  // Entertainment
  entertainment: '#9C27B0',    // Purple for entertainment
  movie: '#9C27B0',
  theater: '#9C27B0',
  casino: '#8E44AD',           // Dark purple for casino
  nightclub: '#E91E63',        // Pink for nightlife

  // Parks & Recreation
  park: '#34A853',             // Green for parks
  recreation: '#34A853',
  zoo: '#27AE60',              // Bright green for zoo
  aquarium: '#3498DB',         // Blue for aquarium

  // Shopping
  shopping: '#FF6D00',         // Orange for shopping
  store: '#FF6D00',
  mall: '#FF6D00',

  // Transportation
  transit: '#607D8B',          // Grey for transit
  airport: '#546E7A',          // Dark grey for airport
  station: '#607D8B',

  // Lodging
  lodging: '#795548',          // Brown for hotels
  hotel: '#795548',

  // Finance
  bank: '#2ECC71',             // Green for finance
  atm: '#27AE60',

  // Gas & Auto
  gas: '#FF5722',              // Deep orange for gas
  carwash: '#FF7043',
  carrental: '#F4511E',

  default: BRAND_COLORS.fadedJade,
};

/**
 * Get color for property category
 */
export const getPropertyColor = (propertyCategory: string): string => {
  const key = propertyCategory.toLowerCase().replace(/[_-]/g, '');
  return PROPERTY_COLORS[key as keyof typeof PROPERTY_COLORS] || BRAND_COLORS.fadedJade;
};

/**
 * Parse keywords from type string (handles underscores, hyphens, etc.)
 * Example: 'cafe_shop' -> ['cafe', 'shop']
 */
const parseTypeKeywords = (type: string): string[] => {
  return type.toLowerCase().split(/[_\-\s]+/);
};

/**
 * Get color for establishment type with hierarchy and word parsing
 * Priority order: gym/fitness > cafe/coffee > specific types > general types
 */
export const getEstablishmentColor = (types: string[] = []): string => {
  if (!types || types.length === 0) return ESTABLISHMENT_COLORS.default;

  // Priority 1: Gym/Fitness (most specific)
  for (const type of types) {
    const keywords = parseTypeKeywords(type);
    if (keywords.some(k => k === 'gym' || k === 'fitness')) {
      return ESTABLISHMENT_COLORS.gym;
    }
    if (keywords.some(k => k === 'spa')) {
      return ESTABLISHMENT_COLORS.spa;
    }
  }

  // Priority 2: Cafe/Coffee (more specific than general food)
  for (const type of types) {
    const keywords = parseTypeKeywords(type);
    if (keywords.some(k => k === 'cafe' || k === 'coffee')) {
      return ESTABLISHMENT_COLORS.cafe;
    }
  }

  // Priority 3: Specific establishment types (bar, pharmacy, etc.)
  for (const type of types) {
    const keywords = parseTypeKeywords(type);

    // Bars & Nightlife
    if (keywords.some(k => k === 'bar' || k === 'nightclub' || k === 'night')) {
      return ESTABLISHMENT_COLORS.bar;
    }

    // Healthcare specific
    if (keywords.some(k => k === 'pharmacy')) {
      return ESTABLISHMENT_COLORS.pharmacy;
    }
    if (keywords.some(k => k === 'dentist')) {
      return ESTABLISHMENT_COLORS.dentist;
    }
    if (keywords.some(k => k === 'veterinary' || k === 'vet')) {
      return ESTABLISHMENT_COLORS.veterinary;
    }
    if (keywords.some(k => k === 'hospital' || k === 'doctor' || k === 'clinic')) {
      return ESTABLISHMENT_COLORS.hospital;
    }

    // Finance
    if (keywords.some(k => k === 'bank')) {
      return ESTABLISHMENT_COLORS.bank;
    }
    if (keywords.some(k => k === 'atm')) {
      return ESTABLISHMENT_COLORS.atm;
    }

    // Auto & Gas
    if (keywords.some(k => k === 'gas' || k === 'gasstation' || k === 'fuel')) {
      return ESTABLISHMENT_COLORS.gas;
    }
    if (keywords.some(k => k === 'carwash' || k === 'wash')) {
      return ESTABLISHMENT_COLORS.carwash;
    }
    if (keywords.some(k => k === 'carrental' || k === 'rental')) {
      return ESTABLISHMENT_COLORS.carrental;
    }

    // Entertainment specific
    if (keywords.some(k => k === 'casino')) {
      return ESTABLISHMENT_COLORS.casino;
    }
    if (keywords.some(k => k === 'movie' || k === 'theater' || k === 'cinema')) {
      return ESTABLISHMENT_COLORS.movie;
    }

    // Education specific
    if (keywords.some(k => k === 'library')) {
      return ESTABLISHMENT_COLORS.library;
    }
    if (keywords.some(k => k === 'university')) {
      return ESTABLISHMENT_COLORS.university;
    }
    if (keywords.some(k => k === 'school')) {
      return ESTABLISHMENT_COLORS.school;
    }

    // Nature & Recreation
    if (keywords.some(k => k === 'zoo')) {
      return ESTABLISHMENT_COLORS.zoo;
    }
    if (keywords.some(k => k === 'aquarium')) {
      return ESTABLISHMENT_COLORS.aquarium;
    }

    // Transportation specific
    if (keywords.some(k => k === 'airport')) {
      return ESTABLISHMENT_COLORS.airport;
    }
  }

  // Priority 4: General categories
  for (const type of types) {
    const keywords = parseTypeKeywords(type);

    if (keywords.some(k => k === 'restaurant' || k === 'food')) {
      return ESTABLISHMENT_COLORS.food;
    }
    if (keywords.some(k => k === 'health' || k === 'medical')) {
      return ESTABLISHMENT_COLORS.health;
    }
    if (keywords.some(k => k === 'education')) {
      return ESTABLISHMENT_COLORS.education;
    }
    if (keywords.some(k => k === 'entertainment')) {
      return ESTABLISHMENT_COLORS.entertainment;
    }
    if (keywords.some(k => k === 'park' || k === 'recreation')) {
      return ESTABLISHMENT_COLORS.park;
    }
    if (keywords.some(k => k === 'shopping' || k === 'store' || k === 'mall')) {
      return ESTABLISHMENT_COLORS.shopping;
    }
    if (keywords.some(k => k === 'transit' || k === 'station')) {
      return ESTABLISHMENT_COLORS.transit;
    }
    if (keywords.some(k => k === 'lodging' || k === 'hotel')) {
      return ESTABLISHMENT_COLORS.lodging;
    }
  }

  return ESTABLISHMENT_COLORS.default;
};

/**
 * Create a circular marker SVG (no teardrop)
 */
export const createPinMarkerSVG = (color: string, size: number = 40): string => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="${color}" stroke="${BRAND_COLORS.white}" stroke-width="2.5"/>
      <circle cx="12" cy="12" r="4" fill="${BRAND_COLORS.white}" />
    </svg>
  `;
};

/**
 * Create a circle marker SVG
 */
export const createCircleMarkerSVG = (color: string, size: number = 32): string => {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="${BRAND_COLORS.white}" stroke-width="3"/>
      <circle cx="16" cy="16" r="6" fill="${BRAND_COLORS.white}"/>
    </svg>
  `;
};

/**
 * Get SVG icon for property category (using detailed SVG paths)
 */
const getPropertyIcon = (propertyCategory: string, iconFillColor: string = 'white'): string => {
  const category = propertyCategory.toLowerCase();

  // Acquisition - Building with magnifying glass (from acquisition.svg)
  if (category.includes('acquisition')) {
    return `<g transform="translate(12, 12) scale(0.0322575) translate(-142.5, -140)">
            <path fill="${iconFillColor}" d="M265.568,272.046H148.977V140.032c-2.025-1.621-3.999-3.321-5.857-5.186c-2.635-2.632-4.958-5.48-7.094-8.436v145.636
              H19.431V12.954h116.595v33.528c2.14-2.959,4.462-5.808,7.1-8.439c1.859-1.862,3.829-3.563,5.851-5.18V6.476
              c0-3.575-2.901-6.476-6.476-6.476H12.955C9.38,0,6.476,2.901,6.476,6.476v272.049c0,3.575,2.904,6.476,6.479,6.476h129.546H272.05
              c3.575,0,6.476-2.9,6.476-6.476V174.872c-3.575,3.223-8.108,5.044-12.957,5.044v92.13H265.568z"/>
            <path fill="${iconFillColor}" d="M129.547,86.443c0,16.554,6.448,32.118,18.156,43.823c11.708,11.721,27.275,18.168,43.832,18.168
              c14.374,0,28-4.877,39.005-13.827l4.84,4.837c-1.138,4.311-0.071,9.079,3.306,12.456l17.717,17.738
              c2.529,2.533,5.851,3.801,9.166,3.801c3.315,0,6.63-1.262,9.153-3.792c5.06-5.059,5.072-13.257,0.013-18.319l-17.714-17.738
              c-3.389-3.39-8.164-4.457-12.481-3.312l-4.836-4.833c19.717-24.319,18.282-60.207-4.333-82.822
              c-11.714-11.711-27.278-18.159-43.835-18.159s-32.124,6.448-43.829,18.159C135.995,54.328,129.547,69.889,129.547,86.443z
              M191.535,37.418c13.097,0,25.411,5.1,34.673,14.361c19.111,19.115,19.111,50.215,0,69.33
              c-9.265,9.268-21.576,14.371-34.673,14.371c-13.096,0-25.407-5.103-34.672-14.371c-9.262-9.264-14.362-21.569-14.362-34.666
              c0-13.094,5.1-25.405,14.361-34.664C166.12,42.518,178.435,37.418,191.535,37.418z"/>
            <path fill="${iconFillColor}" d="M71.251,179.751c0-3.575-2.901-6.476-6.476-6.476H42.102c-3.575,0-6.476,2.901-6.476,6.476v22.689
              c0,3.581,2.901,6.482,6.476,6.482h22.674c3.575,0,6.476-2.901,6.476-6.482L71.251,179.751L71.251,179.751z"/>
            <path fill="${iconFillColor}" d="M119.83,179.751c0-3.575-2.9-6.476-6.479-6.476h-22.67c-3.575,0-6.476,2.901-6.476,6.476v22.689
              c0,3.581,2.901,6.482,6.476,6.482h22.671c3.578,0,6.479-2.901,6.479-6.482L119.83,179.751L119.83,179.751z"/>
            <path fill="${iconFillColor}" d="M64.775,221.877H42.102c-3.575,0-6.476,2.897-6.476,6.476v22.689c0,3.575,2.901,6.476,6.476,6.476h22.674
              c3.575,0,6.476-2.901,6.476-6.476v-22.689C71.251,224.774,68.35,221.877,64.775,221.877z"/>
            <path fill="${iconFillColor}" d="M113.352,221.877H90.681c-3.575,0-6.476,2.897-6.476,6.476v22.689c0,3.575,2.901,6.476,6.476,6.476h22.671
              c3.578,0,6.479-2.901,6.479-6.476v-22.689C119.83,224.774,116.93,221.877,113.352,221.877z"/>
            <path fill="${iconFillColor}" d="M71.251,131.157c0-3.578-2.901-6.479-6.476-6.479H42.102c-3.575,0-6.476,2.901-6.476,6.479v22.687
              c0,3.578,2.901,6.479,6.476,6.479h22.674c3.575,0,6.476-2.901,6.476-6.479L71.251,131.157L71.251,131.157z"/>
            <path fill="${iconFillColor}" d="M119.83,131.157c0-3.578-2.9-6.479-6.479-6.479h-22.67c-3.575,0-6.476,2.901-6.476,6.479v22.687
              c0,3.578,2.901,6.479,6.476,6.479h22.671c3.578,0,6.479-2.901,6.479-6.479L119.83,131.157L119.83,131.157z"/>
            <path fill="${iconFillColor}" d="M71.251,82.559c0-3.581-2.901-6.482-6.476-6.482H42.102c-3.575,0-6.476,2.901-6.476,6.482v22.689
              c0,3.575,2.901,6.476,6.476,6.476h22.674c3.575,0,6.476-2.901,6.476-6.476L71.251,82.559L71.251,82.559z"/>
            <path fill="${iconFillColor}" d="M119.83,82.559c0-3.581-2.9-6.482-6.479-6.482h-22.67c-3.575,0-6.476,2.901-6.476,6.482v22.689
              c0,3.575,2.901,6.476,6.476,6.476h22.671c3.578,0,6.479-2.901,6.479-6.476L119.83,82.559L119.83,82.559z"/>
            <path fill="${iconFillColor}" d="M71.251,33.958c0-3.575-2.901-6.476-6.476-6.476H42.102c-3.575,0-6.476,2.901-6.476,6.476v22.689
              c0,3.578,2.901,6.476,6.476,6.476h22.674c3.575,0,6.476-2.897,6.476-6.476L71.251,33.958L71.251,33.958z"/>
            <path fill="${iconFillColor}" d="M119.83,33.958c0-3.575-2.9-6.476-6.479-6.476h-22.67c-3.575,0-6.476,2.901-6.476,6.476v22.689
              c0,3.578,2.901,6.476,6.476,6.476h22.671c3.578,0,6.479-2.897,6.479-6.476L119.83,33.958L119.83,33.958z"/>
            <path fill="${iconFillColor}" d="M200.797,179.751c0-3.575-2.901-6.476-6.476-6.476H171.65c-3.581,0-6.479,2.901-6.479,6.476v22.689
              c0,3.581,2.897,6.482,6.479,6.482h22.671c3.575,0,6.476-2.901,6.476-6.482V179.751z"/>
            <path fill="${iconFillColor}" d="M249.376,179.751c0-3.575-2.9-6.476-6.476-6.476h-22.674c-3.575,0-6.476,2.901-6.476,6.476v22.689
              c0,3.581,2.901,6.482,6.476,6.482H242.9c3.575,0,6.476-2.901,6.476-6.482V179.751z"/>
            <path fill="${iconFillColor}" d="M194.321,221.877H171.65c-3.581,0-6.479,2.897-6.479,6.476v22.689c0,3.575,2.897,6.476,6.479,6.476h22.671
              c3.575,0,6.476-2.901,6.476-6.476v-22.689C200.797,224.774,197.896,221.877,194.321,221.877z"/>
            <path fill="${iconFillColor}" d="M242.9,221.877h-22.674c-3.575,0-6.476,2.897-6.476,6.476v22.689c0,3.575,2.901,6.476,6.476,6.476H242.9
              c3.575,0,6.476-2.901,6.476-6.476v-22.689C249.376,224.774,246.476,221.877,242.9,221.877z"/>
            </g>`;
  }

  // Pre-development - Blueprint book (from predevelopment.svg)
  if (category.includes('pre') || category.includes('development')) {
    return `<g transform="translate(12, 12) scale(0.020332) translate(-256, -250)">
            <path fill="${iconFillColor}" d="M490.667,74.667H167.979c-9.472-36.807-42.88-64-82.645-64C38.202,10.667,0,48.869,0,96v320
              c0,0.461,0.012,0.914,0.034,1.36c0.73,46.501,38.624,83.973,85.299,83.973h405.333c11.782,0,21.333-9.551,21.333-21.333V96
              C512,84.218,502.449,74.667,490.667,74.667z M42.667,96c0-23.567,19.099-42.667,42.667-42.667S128,72.433,128,96v246.081
              c-12.551-7.26-27.123-11.415-42.667-11.415c-15.543,0-30.116,4.155-42.667,11.415V96z M469.333,458.667h-384
              c-23.567,0-42.667-19.099-42.667-42.667s19.099-42.667,42.667-42.667S128,392.433,128,416c0,14.222,10.667,21.333,21.333,21.333
              h0l0,0c10.667,0,21.333-7.111,21.333-21.333V117.333h298.667V458.667z"/>
            <path fill="${iconFillColor}" d="M234.667,352h170.667c11.782,0,21.333-9.551,21.333-21.333V224c0-6.715-3.161-13.038-8.533-17.067l-85.333-64
              c-7.585-5.689-18.015-5.689-25.6,0l-85.333,64c-5.372,4.029-8.533,10.352-8.533,17.067v106.667
              C213.333,342.449,222.885,352,234.667,352z M256,234.667l64-48l64,48v74.667H256V234.667z"/>
            </g>`;
  }

  // Construction - Crane building (from construction.svg)
  if (category.includes('construction')) {
    return `<g transform="translate(12, 12) scale(0.00905165) translate(-518, -506)">
            <path fill="${iconFillColor}" d="M719.426083 455.245822h234.197458v73.724278H719.426083zM960.258726 580.454221v68.686453h-87.609017v-99.527776h-73.724279v100.387893a203.479008 203.479008 0 0 0-187.505414 202.618891h92.523969a110.586418 110.586418 0 0 1 110.586418-110.586417h145.482576v82.694065h73.724278V580.454221h-73.724278zM610.682773 973.527499a48.043655 48.043655 0 1 0 95.964435 0c0-26.54074-48.043655-104.934223-48.043654-104.934223s-47.920781 78.516356-47.920781 104.934223zM130.000478 762.92181h79.867968v45.094684h-79.867968zM130.000478 688.82891h79.867968v45.094684h-79.867968zM130.000478 837.137584h79.867968v45.094683h-79.867968zM902.016546 252.504056L679.123478 10.442675A35.633401 35.633401 0 0 0 650.985378 0.121276h-15.359224L138.724517 275.112835 45.340431 381.030048a28.629595 28.629595 0 0 0 0 40.548353 32.561556 32.561556 0 0 0 12.28738 7.74105V528.478605a81.711075 81.711075 0 1 0 112.429525 75.813133h-61.436899a20.274177 20.274177 0 1 1-20.274177-20.39705h30.71845V434.725898l98.299037 9.092661h140.936246v29.735459a53.204354 53.204354 0 0 0 50.501131 50.50113h57.873558v376.362441h-127.788749V491.616466h-147.448557v73.724278h73.724279v362.477702H73.724278V745.10511H0V1001.542725h578.735585a84.291425 84.291425 0 0 1-4.792078-27.892352c0-18.676817 11.304389-46.692043 24.57476-73.724279h-56.521947v-65.614607h33.298799a237.023555 237.023555 0 0 1 18.553943-75.567386h-51.852742V688.214541h71.266802v35.019033a243.412993 243.412993 0 0 1 69.177948-70.160939V417.892187h226.947904a33.544547 33.544547 0 0 0 2.58035-12.287379V280.273534a35.387654 35.387654 0 0 0-9.952778-27.769478zM190.085764 376.975213h-58.856548l58.856548-58.856549v58.856549z m129.631857 0h-71.143929v-58.856549h71.143929v58.856549z m-8.232545-128.034497L556.372554 116.851384l-78.270609 132.089332H311.485076z m77.533366 124.962652v-55.784704h64.508744z m224.24468 244.887478h-71.266802v-88.34626h71.266802v88.34626z m0-167.722733H446.400506v-40.056858l80.850958-73.724279h86.011658v113.412515z zm0-202.250271h-49.149518l49.149518-78.516356v78.516356z zm114.764127 128.034497h-39.196741v-58.856549h39.196741v58.856549z m-45.586179-128.034497V126.681288l112.675273 122.136554h-112.675273z zm160.350306 128.034497h-45.217558v-58.856549h45.586179v58.856549z"/>
            </g>`;
  }

  // Completed - Apartment building (from completed.svg)
  if (category.includes('completed')) {
    return `<g transform="translate(12, 12) scale(0.08338075) translate(-46.24, -61.44)">
            <path fill="${iconFillColor}" d="M3.55,119.32H0v3.56H92.49v-3.56h-2v-17a1.22,1.22,0,0,0-1.22-1.22H75.54a1.22,1.22,0,0,0-1.22,1.22v17H48.47V95.23a1.63,1.63,0,0,0-1.63-1.62H19.94a1.63,1.63,0,0,0-1.63,1.62v24.09H0V2.6A2.79,2.79,0,0,1,.82.85h0a2.84,2.84,0,0,1,2-.84H63.93a2.82,2.82,0,0,1,2,.84l.13.13a2.83,2.83,0,0,1,.72,1.89V34.57H102a2.39,2.39,0,0,1,1.69.7h0a2.36,2.36,0,0,1,.7,1.68v84.29a1.63,1.63,0,0,1-1.63,1.63H92.49v-3.56H101V38H66.79v81.34H63.23V3.56H3.55V119.32Zm84.54,0H76.76V103.5H88.09v15.82ZM85.45,45h8.81c.07,0,.13.1.13.22v5.71c0,.1-.06.21-.13.21H85.45c-.07,0-.13-.09-.13-.21V45.22c0-.12.06-.22.13-.22Zm0,39.6h8.81c.07,0,.13.1.13.21v5.71c0,.11-.06.22-.13.22H85.45c-.07,0-.13-.1-.13-.22V84.81c0-.11.06-.21.13-.21Zm-14.85,0h8.8c.08,0,.14.1.14.21v5.71c0,.11-.06.22-.14.22H70.6c-.08,0-.14-.1-.14-.22V84.81c0-.11.06-.21.14-.21ZM85.45,71.4h8.81c.07,0,.13.1.13.22v5.71c0,.11-.06.22-.13.22H85.45c-.07,0-.13-.1-.13-.22V71.62c0-.13.06-.22.13-.22Zm0-13.2h8.81c.07,0,.13.1.13.22v5.71c0,.11-.06.22-.13.22H85.45c-.07,0-.13-.1-.13-.22V58.42c0-.12.06-.22.13-.22ZM70.6,45h8.8c.08,0,.14.1.14.22v5.71c0,.1-.06.21-.14.21H70.6c-.08,0-.14-.09-.14-.21V45.22c0-.12.06-.22.14-.22Zm0,26.4h8.8c.08,0,.14.1.14.22v5.71c0,.11-.06.22-.14.22H70.6c-.08,0-.14-.1-.14-.22V71.62c0-.13.06-.22.14-.22Zm0-13.2h8.8c.08,0,.14.1.14.22v5.71c0,.11-.06.22-.14.22H70.6c-.08,0-.14-.1-.14-.22V58.42c0-.12.06-.22.14-.22ZM45.21,119.32H21.57V96.86H45.21v22.46ZM12.13,12.52h9.58a.28.28,0,0,1,.27.27v9.59a.28.28,0,0,1-.27.27H12.13a.28.28,0,0,1-.27-.27V12.79a.28.28,0,0,1,.27-.27Zm32.94,0h9.58a.28.28,0,0,1,.27.27v9.59a.28.28,0,0,1-.27.27H45.07a.28.28,0,0,1-.27-.27V12.79a.28.28,0,0,1,.27-.27Zm-16.47,0h9.58a.28.28,0,0,1,.27.27v9.59a.28.28,0,0,1-.27.27H28.6a.28.28,0,0,1-.27-.27V12.79a.28.28,0,0,1,.27-.27ZM12.13,33.28h9.58a.28.28,0,0,1,.27.27v9.59a.28.28,0,0,1-.27.27H12.13a.28.28,0,0,1-.27-.27V33.55a.28.28,0,0,1,.27-.27Zm32.94,0h9.58a.28.28,0,0,1,.27.27v9.59a.28.28,0,0,1-.27.27H45.07a.28.28,0,0,1-.27-.27V33.55a.28.28,0,0,1,.27-.27Zm-16.47,0h9.58a.28.28,0,0,1,.27.27v9.59a.28.28,0,0,1-.27.27H28.6a.28.28,0,0,1-.27-.27V33.55a.28.28,0,0,1,.27-.27ZM12.13,74.8h9.58a.27.27,0,0,1,.27.27v9.58a.27.27,0,0,1-.27.27H12.13a.27.27,0,0,1-.27-.27V75.07a.27.27,0,0,1,.27-.27Zm32.94,0h9.58a.27.27,0,0,1,.27.27v9.58a.27.27,0,0,1-.27.27H45.07a.27.27,0,0,1-.27-.27V75.07a.27.27,0,0,1,.27-.27Zm-16.47,0h9.58a.27.27,0,0,1,.27.27v9.58a.27.27,0,0,1-.27.27H28.6a.27.27,0,0,1-.27-.27V75.07a.27.27,0,0,1,.27-.27ZM12.13,54h9.58a.27.27,0,0,1,.27.27V63.9a.28.28,0,0,1-.27.27H12.13a.28.28,0,0,1-.27-.27V54.31a.27.27,0,0,1,.27-.27Zm32.94,0h9.58a.27.27,0,0,1,.27.27V63.9a.28.28,0,0,1-.27.27H45.07a.28.28,0,0,1-.27-.27V54.31a.27.27,0,0,1,.27-.27ZM28.6,54h9.58a.27.27,0,0,1,.27.27V63.9a.28.28,0,0,1-.27.27H28.6a.28.28,0,0,1-.27-.27V54.31A.27.27,0,0,1,28.6,54Z"/>
            </g>`;
  }

  // Public - Government building
  if (category.includes('public')) {
    return `<path d="M7 16H17M12 7L7 10V16M12 7L17 10V16M12 7V10" stroke="white" stroke-width="1" fill="none"/>
            <circle cx="12" cy="9" r="1" fill="${iconFillColor}"/>`;
  }

  // Private - Office building
  if (category.includes('private')) {
    return `<rect x="8" y="8" width="8" height="8" fill="none" stroke="white" stroke-width="1.2"/>
            <line x1="10" y1="10" x2="10" y2="11" stroke="white" stroke-width="1"/>
            <line x1="12" y1="10" x2="12" y2="11" stroke="white" stroke-width="1"/>
            <line x1="14" y1="10" x2="14" y2="11" stroke="white" stroke-width="1"/>
            <line x1="10" y1="13" x2="10" y2="14" stroke="white" stroke-width="1"/>
            <line x1="12" y1="13" x2="12" y2="14" stroke="white" stroke-width="1"/>
            <line x1="14" y1="13" x2="14" y2="14" stroke="white" stroke-width="1"/>`;
  }

  // Community - People/Group
  if (category.includes('community')) {
    return `<circle cx="10" cy="10" r="2" fill="${iconFillColor}"/>
            <circle cx="14" cy="10" r="2" fill="${iconFillColor}"/>
            <path d="M7 15C7 13 8.5 12 10 12C11.5 12 13 13 13 15" fill="none" stroke="white" stroke-width="1"/>
            <path d="M11 15C11 13 12.5 12 14 12C15.5 12 17 13 17 15" fill="none" stroke="white" stroke-width="1"/>`;
  }

  // Default - House
  return `<path d="M12 7L7 11V16H17V11L12 7Z" fill="none" stroke="white" stroke-width="1.2"/>
          <rect x="10.5" y="13" width="3" height="3" fill="${iconFillColor}"/>`;
};

/**
 * Create a property marker SVG with property icon (teardrop shape)
 */
export const createPropertyMarkerSVG = (propertyCategory: string, size: number = 63, isDarkMode: boolean = false): string => {
  const color = getPropertyColor(propertyCategory);
  const borderColor = isDarkMode ? BRAND_COLORS.black : BRAND_COLORS.white;
  const iconFillColor = isDarkMode ? BRAND_COLORS.black : BRAND_COLORS.white;
  const icon = getPropertyIcon(propertyCategory, iconFillColor);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.floor(size * 2)}" viewBox="0 0 24 48" fill="none">
      <!-- Map pin outline from provided SVG -->
      <path d="M12,0C7.54,0,3.92,3.62,3.92,8.08c0,4.56,2.26,5.53,4.75,8.56C11.66,20.28,12,24,12,24s0.34-3.72,3.33-7.36c2.49-3.03,4.75-4,4.75-8.56C20.08,3.62,16.46,0,12,0z"
            fill="${color}"
            stroke="${borderColor}"
            stroke-width="0.2"/>
      <!-- Icon (positioned 10% higher in circular top) -->
      <g transform="translate(0, -3.96)">
        ${icon}
      </g>
    </svg>
  `;
};

/**
 * Get SVG icon path for establishment type
 * Uses ML-style inference based on Google Places API taxonomy
 *
 * Tier 1: High-priority specific icons (very distinct/popular types)
 * Tier 2: Category fallback icons (general categories)
 * Tier 3: Default icon
 */
const getEstablishmentIcon = (types: string[] = [], iconFillColor: string = 'white'): string => {
  if (!types || types.length === 0) {
    return `<circle cx="12" cy="11" r="3.5" fill="${iconFillColor}"/>`;
  }

  const typeStr = types.join(' ').toLowerCase();

  // Helper function to check if any type matches keywords
  const hasType = (...keywords: string[]): boolean => {
    return types.some(type => {
      const lowerType = type.toLowerCase();
      return keywords.some(keyword => lowerType.includes(keyword));
    });
  };

  // =================================================================
  // TIER 1: HIGH-PRIORITY SPECIFIC ICONS
  // Based on ML inference: popularity + visual distinctiveness + semantic distance
  // =================================================================

  // TRANSPORTATION (Highly distinct subtypes)
  // ----------------------------------------

  // Airplane - Airport/Airstrip (very distinct from general transit)
  if (hasType('airport', 'airstrip', 'international_airport')) {
    return `<path d="M12 8L12 12M8 10.5L12 12L16 10.5M10 14L12 16L14 14" stroke="white" stroke-width="1.2" fill="none"/>
            <circle cx="12" cy="8" r="0.8" fill="${iconFillColor}"/>`;
  }

  // Bus - Bus station/stop
  if (hasType('bus_station', 'bus_stop')) {
    return `<rect x="8" y="8" width="8" height="7" rx="1" fill="none" stroke="white" stroke-width="1.2"/>
            <circle cx="10" cy="14.5" r="0.8" fill="${iconFillColor}"/>
            <circle cx="14" cy="14.5" r="0.8" fill="${iconFillColor}"/>
            <rect x="9" y="9.5" width="2.5" height="2" fill="${iconFillColor}"/>
            <rect x="12.5" y="9.5" width="2.5" height="2" fill="${iconFillColor}"/>`;
  }

  // Train - Train/subway/light rail
  if (hasType('train_station', 'subway_station', 'light_rail_station', 'transit_depot')) {
    return `<rect x="8" y="8" width="8" height="8" rx="1" fill="none" stroke="white" stroke-width="1.2"/>
            <circle cx="10" cy="14" r="0.8" fill="${iconFillColor}"/>
            <circle cx="14" cy="14" r="0.8" fill="${iconFillColor}"/>
            <line x1="8" y1="11" x2="16" y2="11" stroke="white" stroke-width="1"/>
            <circle cx="12" cy="9.5" r="0.6" fill="${iconFillColor}"/>`;
  }

  // Ferry - Ferry terminal
  if (hasType('ferry_terminal')) {
    return `<path d="M7 13L12 11L17 13V15H7V13Z" fill="${iconFillColor}"/>
            <line x1="12" y1="11" x2="12" y2="8" stroke="white" stroke-width="1"/>`;
  }

  // AUTOMOTIVE (Gas is very popular and distinct)
  // ----------------------------------------

  // Gas Pump - Gas station (very popular, deserves own icon)
  if (hasType('gas_station')) {
    return `<path d="M8 8H13V15H8V8Z" fill="none" stroke="white" stroke-width="1"/>
            <rect x="9" y="9.5" width="3" height="2" fill="${iconFillColor}"/>
            <path d="M13 10H15V14" stroke="white" stroke-width="1" fill="none"/>
            <circle cx="15" cy="9" r="0.7" fill="${iconFillColor}"/>`;
  }

  // EV Charging - Electric vehicle charging station
  if (hasType('electric_vehicle_charging_station')) {
    return `<path d="M10 7L8 12H12L10 17" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="10" cy="12" r="5.5" fill="none" stroke="white" stroke-width="1"/>`;
  }

  // Parking - Parking (very common)
  if (hasType('parking')) {
    return `<text x="12" y="15" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${iconFillColor}" text-anchor="middle">P</text>`;
  }

  // Car - General automotive (fallback for car-related)
  if (hasType('car_dealer', 'car_rental', 'car_repair', 'car_wash')) {
    return `<path d="M7 12L8 10H16L17 12V15H7V12Z" fill="none" stroke="white" stroke-width="1"/>
            <circle cx="9" cy="15" r="1" fill="${iconFillColor}"/>
            <circle cx="15" cy="15" r="1" fill="${iconFillColor}"/>
            <path d="M9 10L10 8H14L15 10" fill="none" stroke="white" stroke-width="0.8"/>`;
  }

  // FOOD & DRINK (Specific popular types)
  // ----------------------------------------

  // Coffee Cup - Cafe/Coffee shop (very popular, distinct from general food)
  if (hasType('cafe', 'coffee_shop')) {
    return `<path d="M8 10H15V14C15 15 14 16 12 16C10 16 9 15 9 14V10Z" fill="none" stroke="white" stroke-width="1"/>
            <path d="M15 11H16C16.5 11 17 11.5 17 12C17 12.5 16.5 13 16 13H15" fill="none" stroke="white" stroke-width="1"/>
            <path d="M9 8C9 8 10 7 11 7C12 7 13 8 13 8" fill="none" stroke="white" stroke-width="0.8"/>`;
  }

  // Beer Mug - Bar/Pub (distinct from general restaurant)
  if (hasType('bar', 'pub', 'wine_bar', 'night_club')) {
    return `<path d="M9 9H14V16H9V9Z" fill="none" stroke="white" stroke-width="1"/>
            <path d="M14 11H15.5V13H14" fill="none" stroke="white" stroke-width="1"/>
            <line x1="9" y1="11" x2="14" y2="11" stroke="white" stroke-width="0.6"/>`;
  }

  // Ice Cream - Ice cream shop (visually distinct)
  if (hasType('ice_cream_shop')) {
    return `<circle cx="12" cy="9" r="2" fill="${iconFillColor}"/>
            <circle cx="12" cy="11.5" r="1.5" fill="${iconFillColor}"/>
            <path d="M12 13L12 16L11 17" stroke="white" stroke-width="1.2" fill="none"/>`;
  }

  // Pizza Slice - Pizza restaurant (very popular)
  if (hasType('pizza_restaurant')) {
    return `<path d="M12 7L6 16H18L12 7Z" fill="none" stroke="white" stroke-width="1"/>
            <circle cx="10" cy="12" r="0.8" fill="${iconFillColor}"/>
            <circle cx="14" cy="12" r="0.8" fill="${iconFillColor}"/>
            <circle cx="12" cy="14" r="0.8" fill="${iconFillColor}"/>`;
  }

  // SPORTS (Visually distinct subtypes)
  // ----------------------------------------

  // Swimming - Swimming pool (very distinct from general fitness)
  if (hasType('swimming_pool')) {
    return `<path d="M7 13C8 12 9 13 10 13C11 13 12 12 13 12C14 12 15 13 16 13C17 13 18 12 19 13" stroke="white" stroke-width="1" fill="none"/>
            <path d="M7 15C8 14 9 15 10 15C11 15 12 14 13 14C14 14 15 15 16 15C17 15 18 14 19 15" stroke="white" stroke-width="1" fill="none"/>
            <circle cx="14" cy="9" r="1.2" fill="${iconFillColor}"/>`;
  }

  // Dumbbells - Gym/Fitness center (very popular)
  if (hasType('gym', 'fitness_center')) {
    return `<circle cx="8" cy="12" r="1.5" fill="${iconFillColor}"/>
            <circle cx="16" cy="12" r="1.5" fill="${iconFillColor}"/>
            <line x1="9.5" y1="12" x2="14.5" y2="12" stroke="white" stroke-width="1.5"/>
            <line x1="8" y1="10.5" x2="8" y2="13.5" stroke="white" stroke-width="1.2"/>
            <line x1="16" y1="10.5" x2="16" y2="13.5" stroke="white" stroke-width="1.2"/>`;
  }

  // Golf Flag - Golf course
  if (hasType('golf_course')) {
    return `<line x1="12" y1="8" x2="12" y2="17" stroke="white" stroke-width="1"/>
            <path d="M12 8L16 10L12 12V8Z" fill="${iconFillColor}"/>
            <circle cx="12" cy="15" r="1" fill="${iconFillColor}"/>`;
  }

  // Stadium - Stadium/Arena (large sports venues)
  if (hasType('stadium', 'arena')) {
    return `<ellipse cx="12" cy="13" rx="7" ry="4" fill="none" stroke="white" stroke-width="1"/>
            <path d="M5 13V15C5 16 8 17 12 17C16 17 19 16 19 15V13" fill="none" stroke="white" stroke-width="1"/>`;
  }

  // HEALTH & WELLNESS (Specific medical types)
  // ----------------------------------------

  // Pharmacy - Pharmacy/Drugstore (very popular)
  if (hasType('pharmacy', 'drugstore')) {
    return `<circle cx="12" cy="12" r="6" fill="none" stroke="white" stroke-width="1"/>
            <rect x="10.5" y="8" width="3" height="8" fill="${iconFillColor}"/>
            <rect x="8" y="10.5" width="8" height="3" fill="${iconFillColor}"/>`;
  }

  // Tooth - Dentist (very distinct)
  if (hasType('dentist', 'dental_clinic')) {
    return `<path d="M12 7C9 7 8 9 8 11V14C8 15 8.5 16 9 16C9.5 16 10 15.5 10 15V12C10 11.5 10 11 12 11C14 11 14 11.5 14 12V15C14 15.5 14.5 16 15 16C15.5 16 16 15 16 14V11C16 9 15 7 12 7Z" fill="${iconFillColor}"/>`;
  }

  // Hospital Cross - Hospital (emergency medical)
  if (hasType('hospital')) {
    return `<rect x="10.5" y="7" width="3" height="10" fill="${iconFillColor}"/>
            <rect x="7" y="10.5" width="10" height="3" fill="${iconFillColor}"/>`;
  }

  // Stethoscope - Doctor/Medical (general healthcare)
  if (hasType('doctor', 'medical_lab', 'clinic')) {
    return `<circle cx="8" cy="15" r="1.5" fill="${iconFillColor}"/>
            <circle cx="16" cy="15" r="1.5" fill="${iconFillColor}"/>
            <path d="M8 13.5V11C8 9 10 8 12 8C14 8 16 9 16 11V13.5" stroke="white" stroke-width="1" fill="none"/>
            <path d="M12 8V10" stroke="white" stroke-width="1"/>`;
  }

  // LODGING (Hotel is very common)
  // ----------------------------------------

  // Hotel Bed - Hotel/Motel (very popular)
  if (hasType('hotel', 'motel', 'inn')) {
    return `<path d="M7 13H17V16H7V13Z" fill="none" stroke="white" stroke-width="1"/>
            <circle cx="9.5" cy="11" r="1" fill="${iconFillColor}"/>
            <line x1="7" y1="16" x2="7" y2="17" stroke="white" stroke-width="1"/>
            <line x1="17" y1="16" x2="17" y2="17" stroke="white" stroke-width="1"/>`;
  }

  // Tent - Campground (visually distinct)
  if (hasType('campground', 'camping_cabin', 'rv_park')) {
    return `<path d="M12 7L7 16H17L12 7Z" fill="none" stroke="white" stroke-width="1.2"/>
            <line x1="12" y1="7" x2="12" y2="16" stroke="white" stroke-width="0.8"/>
            <line x1="6" y1="16" x2="18" y2="16" stroke="white" stroke-width="1.2"/>`;
  }

  // SHOPPING (Grocery is very common)
  // ----------------------------------------

  // Shopping Cart - Grocery/Supermarket (very popular)
  if (hasType('grocery_store', 'supermarket')) {
    return `<path d="M8 8L9 14H16L17 8H8Z" fill="none" stroke="white" stroke-width="1"/>
            <circle cx="10" cy="16" r="0.8" fill="${iconFillColor}"/>
            <circle cx="15" cy="16" r="0.8" fill="${iconFillColor}"/>
            <line x1="7" y1="8" x2="8" y2="8" stroke="white" stroke-width="1"/>`;
  }

  // =================================================================
  // TIER 2: CATEGORY FALLBACK ICONS
  // General categories when no specific match found
  // =================================================================

  // Culture - Museum/Art/Theater
  if (hasType('museum', 'art_gallery', 'cultural', 'historical', 'monument', 'performing_arts')) {
    return `<rect x="7" y="10" width="10" height="7" fill="none" stroke="white" stroke-width="1"/>
            <path d="M7 10L12 7L17 10" fill="none" stroke="white" stroke-width="1"/>
            <line x1="9" y1="12" x2="9" y2="15" stroke="white" stroke-width="0.8"/>
            <line x1="12" y1="12" x2="12" y2="15" stroke="white" stroke-width="0.8"/>
            <line x1="15" y1="12" x2="15" y2="15" stroke="white" stroke-width="0.8"/>`;
  }

  // Education - School/University
  if (hasType('school', 'university', 'library', 'education')) {
    return `<path d="M12 7L4 10L12 13L20 10L12 7Z" fill="${iconFillColor}" stroke="white" stroke-width="0.5"/>
            <path d="M6 11V14L12 16.5L18 14V11" fill="none" stroke="white" stroke-width="0.8"/>`;
  }

  // Entertainment - Movie/Theater/Amusement
  if (hasType('movie', 'theater', 'amusement', 'entertainment', 'casino', 'arcade')) {
    return `<circle cx="12" cy="12" r="5" fill="none" stroke="white" stroke-width="1.2"/>
            <path d="M10 9L15 12L10 15V9Z" fill="${iconFillColor}"/>`;
  }

  // Finance - Bank/ATM
  if (hasType('bank', 'atm', 'accounting')) {
    return `<text x="12" y="15.5" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="${iconFillColor}" text-anchor="middle">$</text>`;
  }

  // Food & Drink - Restaurant (general)
  if (hasType('restaurant', 'food')) {
    return `<path d="M9 7V14M9 7V9M9 7L8 7V9L9 9M9 9L10 9V7L9 7M9 14L9 17" stroke="white" stroke-width="1" fill="none"/>
            <path d="M15 7V17M15 7C15 7 14 8 14 9.5M15 7C15 7 16 8 16 9.5" stroke="white" stroke-width="1" fill="none"/>`;
  }

  // Government - City Hall/Government office
  if (hasType('government', 'city_hall', 'courthouse', 'embassy', 'post_office')) {
    return `<path d="M7 16H17M12 7L7 10V16M12 7L17 10V16M12 7V10" stroke="white" stroke-width="1" fill="none"/>
            <circle cx="12" cy="9" r="1" fill="${iconFillColor}"/>`;
  }

  // Health - General medical (fallback)
  if (hasType('health', 'medical', 'wellness', 'spa', 'massage')) {
    return `<rect x="10.5" y="8" width="3" height="8" fill="${iconFillColor}"/>
            <rect x="8" y="11.5" width="8" height="3" fill="${iconFillColor}"/>`;
  }

  // Nature - Park/Beach/Garden
  if (hasType('park', 'garden', 'beach', 'nature', 'hiking', 'trail')) {
    return `<circle cx="12" cy="9" r="3" fill="${iconFillColor}"/>
            <rect x="11.3" y="12" width="1.4" height="5" fill="${iconFillColor}"/>`;
  }

  // Recreation - Zoo/Aquarium/Recreation
  if (hasType('zoo', 'aquarium', 'recreation', 'tourist_attraction')) {
    return `<circle cx="12" cy="12" r="5.5" fill="none" stroke="white" stroke-width="1.2"/>
            <circle cx="10" cy="11" r="0.8" fill="${iconFillColor}"/>
            <circle cx="14" cy="11" r="0.8" fill="${iconFillColor}"/>
            <path d="M9 14C9 14 10 15 12 15C14 15 15 14 15 14" stroke="white" stroke-width="1" fill="none"/>`;
  }

  // Services - Hair/Beauty/Repair
  if (hasType('salon', 'barber', 'beauty', 'repair', 'service')) {
    return `<circle cx="12" cy="10" r="2" fill="${iconFillColor}"/>
            <path d="M8 16C8 14 10 13 12 13C14 13 16 14 16 16" fill="none" stroke="white" stroke-width="1"/>`;
  }

  // Shopping - Store/Mall (general)
  if (hasType('store', 'shop', 'mall', 'market')) {
    return `<path d="M8 9H16V17H8V9Z" fill="none" stroke="white" stroke-width="1.2"/>
            <path d="M10 9V8C10 7 11 6 12 6C13 6 14 7 14 8V9" fill="none" stroke="white" stroke-width="1.2"/>`;
  }

  // Sports - General athletics
  if (hasType('sport', 'athletic', 'field')) {
    return `<circle cx="12" cy="12" r="5" fill="none" stroke="white" stroke-width="1.2"/>
            <path d="M12 7V17M7 12H17" stroke="white" stroke-width="1"/>
            <path d="M9 9L15 15M15 9L9 15" stroke="white" stroke-width="0.8"/>`;
  }

  // Transit - General (fallback for misc transit)
  if (hasType('transit', 'station', 'transportation')) {
    return `<circle cx="12" cy="12" r="6" fill="none" stroke="white" stroke-width="1.2"/>
            <path d="M12 8V12L15 14" stroke="white" stroke-width="1" fill="none"/>`;
  }

  // Lodging - General (fallback for misc lodging)
  if (hasType('lodging', 'accommodation')) {
    return `<path d="M8 8L12 5L16 8V16H8V8Z" fill="none" stroke="white" stroke-width="1"/>
            <rect x="10.5" y="13" width="3" height="3" fill="${iconFillColor}"/>`;
  }

  // =================================================================
  // TIER 3: DEFAULT ICON
  // =================================================================

  return `<circle cx="12" cy="11" r="3.5" fill="${iconFillColor}"/>`;
};

/**
 * Create an establishment marker SVG with icon (teardrop shape)
 */
export const createEstablishmentMarkerSVG = (types: string[] = [], size: number = 46, isDarkMode: boolean = false): string => {
  const color = getEstablishmentColor(types);
  const borderColor = isDarkMode ? BRAND_COLORS.black : BRAND_COLORS.white;
  const iconFillColor = isDarkMode ? BRAND_COLORS.black : BRAND_COLORS.white;
  const icon = getEstablishmentIcon(types, iconFillColor);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.floor(size * 2)}" viewBox="0 0 24 48" fill="none">
      <!-- Map pin outline from provided SVG -->
      <path d="M12,0C7.54,0,3.92,3.62,3.92,8.08c0,4.56,2.26,5.53,4.75,8.56C11.66,20.28,12,24,12,24s0.34-3.72,3.33-7.36c2.49-3.03,4.75-4,4.75-8.56C20.08,3.62,16.46,0,12,0z"
            fill="${color}"
            stroke="${borderColor}"
            stroke-width="0.2"/>
      <!-- Icon (positioned 10% higher in circular top) -->
      <g transform="translate(0, -3.3)">
        ${icon}
      </g>
    </svg>
  `;
};

/**
 * Create a simple search marker (unsaved) - Red pin with dot
 */
export const createSimpleSearchMarkerSVG = (size: number = 46, isDarkMode: boolean = false): string => {
  const redColor = '#EA4335'; // Google Maps red
  const borderColor = isDarkMode ? BRAND_COLORS.black : BRAND_COLORS.white;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.floor(size * 2)}" viewBox="0 0 24 48" fill="none">
      <!-- Map pin outline -->
      <path d="M12,0C7.54,0,3.92,3.62,3.92,8.08c0,4.56,2.26,5.53,4.75,8.56C11.66,20.28,12,24,12,24s0.34-3.72,3.33-7.36c2.49-3.03,4.75-4,4.75-8.56C20.08,3.62,16.46,0,12,0z"
            fill="${redColor}"
            stroke="${borderColor}"
            stroke-width="0.2"/>
      <!-- Center dot -->
      <circle cx="12" cy="8" r="3" fill="${BRAND_COLORS.white}" />
    </svg>
  `;
};

/**
 * Create a target/crosshair marker for keyword search center
 * Note: This marker respects CSS opacity - when opacity is 0, it becomes completely transparent
 */
export const createSearchCenterMarkerSVG = (isDarkMode: boolean = false, size: number = 32): string => {
  const strokeColor = isDarkMode ? '#81C784' : '#43A047';
  const fillOuter = isDarkMode ? 'rgba(129, 199, 132, 0.25)' : 'rgba(67, 160, 71, 0.2)';
  const fillInner = isDarkMode ? 'rgba(129, 199, 132, 0.4)' : 'rgba(67, 160, 71, 0.3)';
  const fillCenter = isDarkMode ? '#81C784' : '#43A047';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="${fillOuter}" stroke="${strokeColor}" stroke-width="2"/>
      <circle cx="16" cy="16" r="8" fill="${fillInner}" stroke="${strokeColor}" stroke-width="2"/>
      <circle cx="16" cy="16" r="2" fill="${fillCenter}"/>
      <line x1="16" y1="2" x2="16" y2="8" stroke="${strokeColor}" stroke-width="2"/>
      <line x1="16" y1="24" x2="16" y2="30" stroke="${strokeColor}" stroke-width="2"/>
      <line x1="2" y1="16" x2="8" y2="16" stroke="${strokeColor}" stroke-width="2"/>
      <line x1="24" y1="16" x2="30" y2="16" stroke="${strokeColor}" stroke-width="2"/>
    </svg>
  `;
};

/**
 * Create HTML element from SVG string for use with AdvancedMarkerElement
 */
export const createMarkerElement = (svgString: string): HTMLDivElement => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;

  // Check for parsing errors
  const parserError = svgDoc.querySelector('parsererror');
  if (parserError) {
    console.error('SVG parsing error:', parserError.textContent);
    console.error('SVG string:', svgString);
  }

  const container = document.createElement('div');
  container.appendChild(svgElement);
  container.style.cursor = 'pointer';
  container.style.position = 'relative';
  container.style.width = 'fit-content';
  container.style.height = 'fit-content';

  // Position SVG so the pin tip (at 50%, 50% of viewBox) aligns with marker position
  svgElement.style.position = 'absolute';
  svgElement.style.left = '0';
  svgElement.style.top = '0';
  svgElement.style.transform = 'translate(-50%, -50%)';

  return container;
};

/**
 * Create a marker element for a saved property
 */
export const createSavedPropertyMarker = (propertyCategory: string, isDarkMode: boolean = false): HTMLDivElement => {
  const svg = createPropertyMarkerSVG(propertyCategory, 63, isDarkMode);
  const container = createMarkerElement(svg);
  // Positioning handled in createMarkerElement
  return container;
};

/**
 * Create a marker element for an establishment (keyword search result)
 */
export const createEstablishmentMarker = (types: string[], isDarkMode: boolean = false): HTMLDivElement => {
  const svg = createEstablishmentMarkerSVG(types, 46, isDarkMode);
  const container = createMarkerElement(svg);
  // Positioning handled in createMarkerElement
  return container;
};

/**
 * Create a marker element for a simple search (unsaved)
 */
export const createSimpleSearchMarker = (isDarkMode: boolean = false): HTMLDivElement => {
  const svg = createSimpleSearchMarkerSVG(46, isDarkMode);
  const container = createMarkerElement(svg);
  // Positioning handled in createMarkerElement
  return container;
};

/**
 * Create a marker element for keyword search center
 */
export const createSearchCenterMarker = (isDarkMode: boolean = false): HTMLDivElement => {
  const svg = createSearchCenterMarkerSVG(isDarkMode);
  return createMarkerElement(svg);
};

/**
 * Create a marker element by explicit marker type ID
 * Used when user selects a custom marker type
 */
export const createMarkerByType = (markerTypeId: string, size: number = 46, isDarkMode: boolean = false): HTMLDivElement => {
  // Treat the marker type ID as a types array with single element
  const svg = createEstablishmentMarkerSVG([markerTypeId], size, isDarkMode);
  const container = createMarkerElement(svg);
  // Positioning handled in createMarkerElement
  return container;
};

/**
 * Create just the icon SVG without the teardrop marker
 * Used for UI displays like marker type selectors and previews
 */
export const createIconOnlySVG = (types: string[] = [], size: number = 24, isDarkMode: boolean = false): string => {
  const color = getEstablishmentColor(types);
  const iconFillColor = isDarkMode ? BRAND_COLORS.black : BRAND_COLORS.white;
  const icon = getEstablishmentIcon(types, iconFillColor);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="${color}" stroke="${isDarkMode ? BRAND_COLORS.black : BRAND_COLORS.white}" stroke-width="2"/>
      ${icon}
    </svg>
  `;
};
