import React, { useState } from 'react';
import { Button } from 'primereact/button';
import '../styles/keywordSearchResults.css';

interface SearchResult extends google.maps.places.PlaceResult {
  distance?: number;
}

interface KeywordSearchResultsProps {
  results: SearchResult[];
  visible: boolean;
  onResultClick?: (result: SearchResult) => void;
  onClearResults?: () => void;
  onExportCsv?: () => void;
  onSaveSearch?: () => void;
  onSaveLocation?: (result: SearchResult) => void;
}

const KeywordSearchResults: React.FC<KeywordSearchResultsProps> = ({
  results,
  visible,
  onResultClick,
  onClearResults,
  onExportCsv,
  onSaveSearch,
  onSaveLocation
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return Math.round(meters) + ' m';
    } else {
      return (meters / 1000).toFixed(1) + ' km';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    console.log('Result clicked - Full JSON response:', JSON.stringify(result, null, 2));
    onResultClick?.(result);
  };

  return (
    <div className={`keyword-results-panel ${visible ? 'visible' : 'hidden'} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {isExpanded ? (
        <>
          <div className="results-header">
            <h3>Search Results ({results.length})</h3>
            <div className="header-actions">
              <Button
                icon="pi pi-times"
                onClick={onClearResults}
                className="p-button-text p-button-sm"
                tooltip="Close"
                style={{ color: '#7C0A02' }}
              />
              <Button
                icon="pi pi-chevron-right"
                onClick={() => setIsExpanded(false)}
                className="p-button-text p-button-sm"
                tooltip="Collapse"
              />
            </div>
          </div>
          <div className="results-actions">
            <Button
              label="Save Search"
              icon="pi pi-save"
              onClick={onSaveSearch}
              className="p-button-sm"
              style={{ background: '#276221', color: 'white', border: 'none', flex: 1 }}
            />
            <Button
              label="Export CSV"
              icon="pi pi-download"
              onClick={onExportCsv}
              className="p-button-sm"
              style={{ background: '#73513e', color: 'white', border: 'none', flex: 1 }}
            />
            <Button
              label="Clear"
              icon="pi pi-times"
              onClick={onClearResults}
              className="p-button-sm"
              style={{ background: '#7C0A02', color: 'white', border: 'none', flex: 1 }}
            />
          </div>
          <div className="results-list">
            {results.map((result, index) => (
              <div
                key={result.place_id || index}
                className="result-card"
              >
                {result.photos && result.photos.length > 0 && (
                  <img
                    src={result.photos[0].getUrl({ maxWidth: 400, maxHeight: 150 })}
                    alt={result.name || 'Place photo'}
                    className="result-photo"
                  />
                )}
                <div className="result-content" onClick={() => handleResultClick(result)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ flex: 1, marginRight: '8px' }}>{result.name || 'Unknown'}</h4>
                    <Button
                      icon="pi pi-star"
                      className="p-button-rounded p-button-text"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveLocation?.(result);
                      }}
                      tooltip="Save location"
                      tooltipOptions={{ position: 'left' }}
                      style={{
                        color: '#F4B400',
                        minWidth: '32px',
                        width: '32px',
                        height: '32px',
                        padding: 0
                      }}
                    />
                  </div>

                  {result.distance && (
                    <div className="result-distance">
                      <i className="pi pi-compass"></i>
                      <span>{formatDistance(result.distance)}</span>
                    </div>
                  )}

                  {result.rating && (
                    <div className="result-rating">
                      <i className="pi pi-star-fill" style={{ color: '#F4B400' }}></i>
                      <span>{result.rating}/5</span>
                      {result.user_ratings_total && (
                        <span className="rating-count">({result.user_ratings_total})</span>
                      )}
                    </div>
                  )}

                  {result.price_level !== undefined && (
                    <div className="result-price">
                      {Array(result.price_level + 1).fill('$').join('')}
                    </div>
                  )}

                  <div className="result-address">
                    <i className="pi pi-map-marker" style={{ marginRight: '4px', fontSize: '11px' }}></i>
                    {result.vicinity || result.formatted_address}
                  </div>

                  {result.formatted_phone_number && (
                    <div className="result-phone">
                      <i className="pi pi-phone" style={{ marginRight: '4px' }}></i>
                      <a href={`tel:${result.formatted_phone_number}`}>{result.formatted_phone_number}</a>
                    </div>
                  )}

                  {result.website && (
                    <div className="result-website">
                      <i className="pi pi-globe" style={{ marginRight: '4px' }}></i>
                      <a href={result.website} target="_blank" rel="noopener noreferrer">Visit Website</a>
                    </div>
                  )}

                  {result.opening_hours && (
                    <div className="result-status" style={{color:'black'}}>
                      <i className="pi pi-clock" style={{ marginRight: '4px', color: 'black'}}></i>
                      <span>Hours Available</span>
                    </div>
                  )}

                  {result.business_status && result.business_status !== 'OPERATIONAL' && (
                    <div className="result-business-status">
                      {result.business_status}
                    </div>
                  )}

                  {result.types && result.types.length > 0 && (
                    <div className="result-types">
                      {result.types.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="results-collapsed">
          <Button
            icon="pi pi-chevron-left"
            onClick={() => setIsExpanded(true)}
            className="p-button-text expand-button"
            tooltip="Expand Results"
          />
          <span className="results-count">{results.length}</span>
        </div>
      )}
    </div>
  );
};

export default KeywordSearchResults;
