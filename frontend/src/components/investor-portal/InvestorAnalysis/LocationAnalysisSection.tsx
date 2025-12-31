/**
 * Location Analysis Section
 *
 * Displays property location with:
 * - Google Maps link
 * - Basic location info
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

interface LocationAnalysisSectionProps {
  dealLocation?: string;
  dealLatitude?: number;
  dealLongitude?: number;
}

const LocationAnalysisSection: React.FC<LocationAnalysisSectionProps> = ({
  dealLocation,
  dealLatitude,
  dealLongitude,
}) => {
  if (!dealLocation && !dealLatitude && !dealLongitude) {
    return null;
  }

  const googleMapsUrl = dealLatitude && dealLongitude
    ? `https://www.google.com/maps?q=${dealLatitude},${dealLongitude}`
    : dealLocation
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealLocation)}`
      : null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--hdc-spectra)',
        marginBottom: '1rem'
      }}>
        Location
      </h2>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-[#407f7f] text-lg">
            Property Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dealLocation && (
            <p className="text-gray-700 mb-4">{dealLocation}</p>
          )}
          {dealLatitude && dealLongitude && (
            <p className="text-gray-500 text-sm mb-4">
              Coordinates: {dealLatitude.toFixed(6)}, {dealLongitude.toFixed(6)}
            </p>
          )}
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#407f7f] hover:text-[#276221] no-underline text-sm"
            >
              View on Google Maps →
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationAnalysisSection;
