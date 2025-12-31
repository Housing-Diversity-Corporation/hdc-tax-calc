export const getMarkerColor = (propertyCategory: string): string => {
  // Development categories
  switch (propertyCategory) {
    case 'acquisition':
      return '#FF9800'; // Orange
    case 'pre-development':
      return '#FFC107'; // Amber
    case 'construction':
      return '#795548'; // Brown
    case 'completed':
      return '#4CAF50'; // Green

    // Government/School categories
    case 'public':
      return '#2196F3'; // Blue
    case 'private':
      return '#9C27B0'; // Purple
    case 'community':
      return '#00BCD4'; // Cyan

    // Default color
    default:
      return '#FF0000'; // Red
  }
};

export const getMarkerIcon = (): string | undefined => {
  // Optional: Return custom icons for different categories
  // For now, we'll just use color differentiation
  return undefined;
};