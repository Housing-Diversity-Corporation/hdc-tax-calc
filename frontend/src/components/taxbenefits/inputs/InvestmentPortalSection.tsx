/**
 * Investment Portal Settings Section
 *
 * Configure investor-facing metadata for deals
 * Controls whether this deal appears in the Investment Portal
 */

import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { HDCCheckbox } from './shared/HDCCheckbox';

interface InvestmentPortalSectionProps {
  isInvestorFacing: boolean;
  setIsInvestorFacing: (value: boolean) => void;
  dealDescription: string;
  setDealDescription: (value: string) => void;
  dealLocation: string;
  setDealLocation: (value: string) => void;
  dealLatitude?: number;
  setDealLatitude?: (value: number | undefined) => void;
  dealLongitude?: number;
  setDealLongitude?: (value: number | undefined) => void;
  units: number;
  setUnits: (value: number) => void;
  affordabilityMix: string;
  setAffordabilityMix: (value: string) => void;
  projectStatus: 'available' | 'funded' | 'pipeline';
  setProjectStatus: (value: 'available' | 'funded' | 'pipeline') => void;
  minimumInvestment: number;
  setMinimumInvestment: (value: number) => void;
  dealImageUrl: string;
  setDealImageUrl: (value: string) => void;
  isReadOnly?: boolean;
}

const InvestmentPortalSection: React.FC<InvestmentPortalSectionProps> = ({
  isInvestorFacing,
  setIsInvestorFacing,
  dealDescription,
  setDealDescription,
  dealLocation,
  setDealLocation,
  units,
  setUnits,
  affordabilityMix,
  setAffordabilityMix,
  projectStatus,
  setProjectStatus,
  minimumInvestment,
  setMinimumInvestment,
  dealImageUrl,
  setDealImageUrl,
  isReadOnly = false,
}) => {
  return (
    <div className="hdc-section">
      <h2 className="hdc-section-header">Investment Portal Settings</h2>
      <p className="hdc-section-description">
        Configure investor-facing metadata. When "Show in Portal" is enabled, this deal will be
        visible to investors in the Investment Portal with the details below.
      </p>

      {/* Master Toggle */}
      <div
        className="hdc-input-group"
        style={{
          padding: '1.5rem',
          background: isInvestorFacing ? 'rgba(127, 189, 69, 0.1)' : 'rgba(191, 176, 94, 0.05)',
          borderRadius: '8px',
          border: `2px solid ${isInvestorFacing ? 'var(--hdc-sushi)' : 'var(--hdc-gulf-stream)'}`,
          marginBottom: '2rem',
        }}
      >
        <label className="hdc-input-label" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <HDCCheckbox
            checked={isInvestorFacing}
            onCheckedChange={setIsInvestorFacing}
            disabled={isReadOnly}
          />
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: isInvestorFacing ? 'var(--hdc-sushi)' : 'inherit' }}>
              Show in Investment Portal
            </span>
            <div style={{ fontSize: '0.9rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
              {isInvestorFacing ? 'This deal is visible to investors' : 'This deal is internal only'}
            </div>
          </div>
        </label>
      </div>

      {/* Only show fields if investor-facing is enabled */}
      {isInvestorFacing && (
        <>
          {/* Project Status */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">
              Project Status
              <span className="hdc-required">*</span>
            </label>
            <Select
              value={projectStatus}
              onValueChange={(value) => setProjectStatus(value as 'available' | 'funded' | 'pipeline')}
              disabled={isReadOnly}
            >
              <SelectTrigger className="hdc-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available - Ready for Investment</SelectItem>
                <SelectItem value="pipeline">Pipeline - Coming Soon</SelectItem>
                <SelectItem value="funded">Funded - Fully Subscribed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deal Description */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">
              Deal Description
              <span className="hdc-required">*</span>
            </label>
            <textarea
              value={dealDescription}
              onChange={(e) => setDealDescription(e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g., Modern affordable housing development in Brooklyn featuring 120 units with community amenities..."
              className="hdc-input"
              rows={4}
              maxLength={5000}
              style={{ resize: 'vertical' }}
            />
            <div className="hdc-input-hint">
              {dealDescription.length}/5000 characters
            </div>
          </div>

          {/* Location */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">
              Location
              <span className="hdc-required">*</span>
            </label>
            <input
              disabled={isReadOnly}
              type="text"
              value={dealLocation}
              onChange={(e) => setDealLocation(e.target.value)}
              placeholder="e.g., Brooklyn, NY"
              className="hdc-input"
            />
          </div>

          {/* Number of Units */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">
              Number of Units
              <span className="hdc-required">*</span>
            </label>
            <input disabled={isReadOnly}
              type="number"
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
              placeholder="120"
              className="hdc-input"
              min="0"
            />
          </div>

          {/* Affordability & Investment */}
          <div className="hdc-input-row">
            <div className="hdc-input-group">
              <label className="hdc-input-label">
                Affordability Mix
                <span className="hdc-required">*</span>
              </label>
              <input disabled={isReadOnly}
                type="text"
                value={affordabilityMix}
                onChange={(e) => setAffordabilityMix(e.target.value)}
                placeholder="e.g., 60% AMI or 50-80% AMI"
                className="hdc-input"
              />
              <div className="hdc-input-hint">
                e.g., "60% AMI" or "50-80% AMI Mix"
              </div>
            </div>

            <div className="hdc-input-group">
              <label className="hdc-input-label">
                Minimum Investment ($)
              </label>
              <input disabled={isReadOnly}
                type="number"
                value={minimumInvestment}
                onChange={(e) => setMinimumInvestment(Number(e.target.value))}
                placeholder="100000"
                className="hdc-input"
                min="0"
                step="10000"
              />
              <div className="hdc-input-hint">
                Optional - leave 0 for no minimum
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">
              Project Image URL
            </label>
            <input disabled={isReadOnly}
              type="text"
              value={dealImageUrl}
              onChange={(e) => setDealImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="hdc-input"
            />
            <div className="hdc-input-hint">
              Optional - URL to project rendering or photo
            </div>
          </div>

          {/* Preview */}
          {dealDescription && dealLocation && (
            <div
              style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'rgba(146, 195, 194, 0.1)',
                borderRadius: '8px',
                border: '1px solid var(--hdc-gulf-stream)',
              }}
            >
              <h4 style={{ color: 'var(--hdc-faded-jade)', marginBottom: '1rem' }}>
                Investment Portal Preview
              </h4>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--hdc-cabbage-pont)' }}>Location:</strong> {dealLocation}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--hdc-cabbage-pont)' }}>Units:</strong> {units || 'Not specified'}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--hdc-cabbage-pont)' }}>Affordability:</strong>{' '}
                  {affordabilityMix || 'Not specified'}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--hdc-cabbage-pont)' }}>Status:</strong>{' '}
                  {projectStatus.charAt(0).toUpperCase() + projectStatus.slice(1)}
                </div>
                <div style={{ marginTop: '1rem', color: 'var(--hdc-cabbage-pont)' }}>
                  {dealDescription}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvestmentPortalSection;
