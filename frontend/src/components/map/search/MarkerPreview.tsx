import React from 'react';
import { createIconOnlySVG } from '../../../utils/map/customMarkerSVGs';
import { useTheme } from '../../../contexts/ThemeContext';

interface MarkerPreviewProps {
  markerType: string | string[]; // Either marker type ID or types array
  size?: number;
  className?: string;
}

/**
 * MarkerPreview - Displays a small preview of a marker icon (circular, no teardrop)
 * Used in the marker type selector to show visual representation
 */
const MarkerPreview: React.FC<MarkerPreviewProps> = ({ markerType, size = 24, className = '' }) => {
  const { isDarkMode } = useTheme();

  // Convert marker type to types array format
  const types = Array.isArray(markerType) ? markerType : [markerType];

  // Generate the icon-only SVG markup (circular, no teardrop)
  const svgMarkup = createIconOnlySVG(types, size, isDarkMode);

  return (
    <div
      className={`marker-preview inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
};

export default MarkerPreview;
