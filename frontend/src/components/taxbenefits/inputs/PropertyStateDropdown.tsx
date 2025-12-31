/**
 * IMPL-035: Simple Property State Dropdown
 *
 * A minimal dropdown for selecting where the project is physically located.
 * Unlike StrategicOzSelector (which shows investor-related OZ info), this component
 * displays ONLY the state selection without any tax rate or OZ conformity details.
 *
 * Property State determines: State LIHTC eligibility, prevailing wage requirements
 * Investor State (separate field) determines: OZ conformity, tax rates
 */

import React, { useMemo } from 'react';
import { STATE_TAX_PROFILES } from '../../../utils/taxbenefits/stateProfiles';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface PropertyStateDropdownProps {
  selectedState: string;
  setSelectedState: (value: string) => void;
  readOnly?: boolean;
}

const PropertyStateDropdown: React.FC<PropertyStateDropdownProps> = ({
  selectedState,
  setSelectedState,
  readOnly = false,
}) => {
  // Get sorted states for dropdown (alphabetically by name)
  const sortedStates = useMemo(() => {
    return Object.entries(STATE_TAX_PROFILES)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
      .map(([code, data]) => ({ code, name: data.name }));
  }, []);

  return (
    <div className="hdc-input-group">
      <label className="hdc-input-label">
        Property State
        <span style={{ fontSize: '0.7rem', color: '#666', display: 'block', fontWeight: 'normal' }}>
          Where project is physically located. Determines State LIHTC eligibility.
        </span>
      </label>
      <Select
        value={selectedState}
        onValueChange={setSelectedState}
        disabled={readOnly}
      >
        <SelectTrigger className="hdc-input">
          <SelectValue placeholder="Select property state..." />
        </SelectTrigger>
        <SelectContent>
          {sortedStates.map((state) => (
            <SelectItem key={state.code} value={state.code}>
              {state.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PropertyStateDropdown;
