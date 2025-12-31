/**
 * Creates a tier-based style function for Google Maps Data Layer.
 * Automatically detects tier property and maps to colors.
 *
 * @param colors - Array of colors (tier 1 = colors[0], tier 2 = colors[1], etc.)
 * @returns Style function compatible with google.maps.Data.setStyle()
 */
export const getTierStyle = (colors: string[]) => {
  return (feature: google.maps.Data.Feature): google.maps.Data.StyleOptions => {
    // Try common tier property names
    const tierProperties = ['tier', 'c_district', 'district', 'zone_tier'];

    let tierValue: any = null;
    for (const prop of tierProperties) {
      tierValue = feature.getProperty(prop);
      if (tierValue !== null && tierValue !== undefined) break;
    }

    // Convert to color index (tier 1 = index 0)
    let tierIndex = 0;
    if (tierValue !== null && tierValue !== undefined) {
      const numValue = typeof tierValue === 'string' ? parseInt(tierValue, 10) : Number(tierValue);
      if (!isNaN(numValue) && numValue > 0) {
        tierIndex = numValue - 1;
      }
    }

    // Ensure index is within bounds
    tierIndex = Math.max(0, Math.min(tierIndex, colors.length - 1));

    return {
      fillColor: colors[tierIndex],
      fillOpacity: 0.7,
      strokeColor: 'black',
      strokeWeight: 0.5,
      strokeOpacity: 0.9
    };
  };
};
