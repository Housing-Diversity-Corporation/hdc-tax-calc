import React, { useState } from 'react';
import PresetSelector from './PresetSelector';
import PropertyStateDropdown from './PropertyStateDropdown';
import { Input } from '../../ui/input';
import { Slider } from '../../ui/slider';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface ProjectDefinitionSectionProps {
  // Project Costs
  projectCost: number;
  setProjectCost: (value: number) => void;
  predevelopmentCosts: number;
  setPredevelopmentCosts: (value: number) => void;
  landValue: number;
  setLandValue: (value: number) => void;

  // Operating Parameters
  yearOneNOI: number;
  setYearOneNOI: (value: number) => void;
  opexRatio: number;
  setOpexRatio: (value: number) => void;

  // Property State (IMPL-035: where project is physically located)
  selectedState: string;
  setSelectedState: (value: string) => void;

  // Helper functions
  formatCurrency: (value: number) => string;
  onPresetSelect?: (presetId: string) => void;

  // Read-only mode
  isReadOnly?: boolean;
}

const ProjectDefinitionSection: React.FC<ProjectDefinitionSectionProps> = ({
  projectCost,
  setProjectCost,
  predevelopmentCosts,
  setPredevelopmentCosts,
  landValue,
  setLandValue,
  yearOneNOI,
  setYearOneNOI,
  opexRatio,
  setOpexRatio,
  selectedState,
  setSelectedState,
  formatCurrency,
  onPresetSelect,
  isReadOnly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="hdc-calculator">
      <div className="hdc-section" style={{ borderLeft: '4px solid var(--hdc-gulf-stream)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', paddingBottom: '0.375rem', borderBottom: '2px solid var(--hdc-gulf-stream)' }}>
          <h3
            className="hdc-section-header"
            style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span style={{ marginRight: '0.5rem' }}>{isExpanded ? '▼' : '▶'}</span>
            1. Project Definition
          </h3>
        </div>

        {isExpanded && (
          <>
            {/* Preset Selection Section - Only show if not read-only */}
            {!isReadOnly && onPresetSelect && (
              <div className="preset-selection-wrapper" style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid rgba(127, 189, 69, 0.2)',
              }}>
                <PresetSelector
                  onPresetSelect={onPresetSelect}
                />
              </div>
            )}

            {/* Project Cost */}
            <div className="hdc-input-group">
              <label className="hdc-input-label">Project Cost ($M)</label>
              <Input
                type="number"
                value={projectCost}
                onChange={(e) => setProjectCost(Number(e.target.value) || 0)}
                className="hdc-input"
                disabled={isReadOnly}
              />
            </div>

            {/* Predevelopment Costs */}
            <div className="hdc-input-group">
              <label className="hdc-input-label">
                Predevelopment Costs ($M)
                <span style={{ fontSize: '0.75rem', color: '#666', display: 'block', fontWeight: 'normal', marginTop: '0.25rem' }}>
                  Architecture, engineering, permits, etc. (added to depreciable basis)
                </span>
              </label>
              <Input
                type="number"
                step="0.1"
                value={predevelopmentCosts}
                onChange={(e) => setPredevelopmentCosts(Number(e.target.value) || 0)}
                className="hdc-input"
                disabled={isReadOnly}
                placeholder="0"
              />
            </div>

            {/* Land Value */}
            <div className="hdc-input-group">
              <label className="hdc-input-label">Land Value ($M)</label>
              <Input
                type="number"
                step="0.1"
                value={landValue}
                onChange={(e) => setLandValue(Number(e.target.value) || 0)}
                className="hdc-input"
                disabled={isReadOnly}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
                Non-depreciable portion of project cost
              </div>
            </div>

            {/* Property State - IMPL-035: Simple dropdown for property location */}
            <PropertyStateDropdown
              selectedState={selectedState}
              setSelectedState={setSelectedState}
              readOnly={isReadOnly}
            />

            {/* Year 1 NOI */}
            <div className="hdc-input-group">
              <label className="hdc-input-label">Year 1 NOI ($M)</label>
              <Input
                type="number"
                step="0.1"
                value={yearOneNOI}
                onChange={(e) => setYearOneNOI(Number(e.target.value) || 0)}
                className="hdc-input"
                disabled={isReadOnly}
              />
            </div>

            {/* Operating Expense Ratio */}
            <div className="hdc-input-group">
              <label className="hdc-input-label">Operating Expense Ratio (%)</label>
              <Slider
                disabled={isReadOnly}
                min={10}
                max={80}
                step={5}
                value={[opexRatio]}
                onValueChange={(vals) => setOpexRatio(vals[0])}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
                {opexRatio}% of Year 1 Revenue
              </div>
              <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                Sets initial operating expenses relative to revenue
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDefinitionSection;
