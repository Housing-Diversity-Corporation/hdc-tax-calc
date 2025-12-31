/**
 * IMPL-7.0-013: LIHTC Structure Section Tests
 *
 * Tests for LIHTCStructureSection component including
 * LIHTC Eligible Basis breakdown display functionality.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LIHTCStructureSection from '../LIHTCStructureSection';

const formatCurrency = (value: number) => `$${value.toFixed(2)}M`;

const createMockProps = (overrides = {}) => ({
  lihtcEnabled: false,
  setLihtcEnabled: jest.fn(),
  applicableFraction: 100,
  setApplicableFraction: jest.fn(),
  creditRate: 0.04,
  setCreditRate: jest.fn(),
  placedInServiceMonth: 7,
  setPlacedInServiceMonth: jest.fn(),
  ddaQctBoost: false,
  setDdaQctBoost: jest.fn(),
  lihtcEligibleBasis: 50000000,
  projectCost: 60000000,
  predevelopmentCosts: 0,
  landValue: 8000000,
  interestReserve: 2000000,
  formatCurrency,
  isReadOnly: false,
  ...overrides,
});

describe('LIHTCStructureSection', () => {
  // =========================================================================
  // Basic Rendering
  // =========================================================================

  describe('Basic Rendering', () => {
    it('should render the section header', () => {
      render(<LIHTCStructureSection {...createMockProps()} />);
      expect(screen.getByText(/Federal LIHTC Configuration/i)).toBeInTheDocument();
    });

    it('should show enable checkbox when section is expanded', () => {
      render(<LIHTCStructureSection {...createMockProps()} />);
      expect(screen.getByText(/Enable Federal LIHTC Calculations/i)).toBeInTheDocument();
    });

    it('should not show LIHTC inputs when disabled', () => {
      render(<LIHTCStructureSection {...createMockProps({ lihtcEnabled: false })} />);
      expect(screen.queryByText(/LIHTC Eligible Basis/i)).not.toBeInTheDocument();
    });

    it('should show LIHTC inputs when enabled', () => {
      render(<LIHTCStructureSection {...createMockProps({ lihtcEnabled: true })} />);
      expect(screen.getByText(/LIHTC Eligible Basis \(per IRC §42\)/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Basis Breakdown Display
  // =========================================================================

  describe('Basis Breakdown Display', () => {
    it('should show View Basis Breakdown when enabled with breakdown data', () => {
      render(<LIHTCStructureSection {...createMockProps({ lihtcEnabled: true })} />);
      expect(screen.getByText(/View Basis Breakdown/i)).toBeInTheDocument();
    });

    it('should display project cost in breakdown', () => {
      render(<LIHTCStructureSection {...createMockProps({ lihtcEnabled: true })} />);

      // Click to expand breakdown
      const details = screen.getByText(/View Basis Breakdown/i);
      fireEvent.click(details);

      expect(screen.getByText(/Project Cost:/i)).toBeInTheDocument();
    });

    it('should display land value exclusion in breakdown', () => {
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        landValue: 8000000
      })} />);

      const details = screen.getByText(/View Basis Breakdown/i);
      fireEvent.click(details);

      expect(screen.getByText(/Less: Land Value/i)).toBeInTheDocument();
    });

    it('should display interest reserve exclusion when non-zero', () => {
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        interestReserve: 2000000
      })} />);

      const details = screen.getByText(/View Basis Breakdown/i);
      fireEvent.click(details);

      expect(screen.getByText(/Less: Interest Reserve/i)).toBeInTheDocument();
    });

    it('should not display interest reserve exclusion when zero', () => {
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        interestReserve: 0
      })} />);

      const details = screen.getByText(/View Basis Breakdown/i);
      fireEvent.click(details);

      expect(screen.queryByText(/Less: Interest Reserve/i)).not.toBeInTheDocument();
    });

    it('should display LIHTC Eligible Basis total in breakdown', () => {
      render(<LIHTCStructureSection {...createMockProps({ lihtcEnabled: true })} />);

      const details = screen.getByText(/View Basis Breakdown/i);
      fireEvent.click(details);

      expect(screen.getByText(/= LIHTC Eligible Basis:/i)).toBeInTheDocument();
    });

    it('should not show breakdown when projectCost is undefined', () => {
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        projectCost: undefined
      })} />);

      expect(screen.queryByText(/View Basis Breakdown/i)).not.toBeInTheDocument();
    });

    it('should not show breakdown when landValue is undefined', () => {
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        landValue: undefined
      })} />);

      expect(screen.queryByText(/View Basis Breakdown/i)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Input Controls
  // =========================================================================

  describe('Input Controls', () => {
    it('should show Applicable Fraction slider when enabled', () => {
      render(<LIHTCStructureSection {...createMockProps({ lihtcEnabled: true })} />);
      expect(screen.getByText(/Applicable Fraction/i)).toBeInTheDocument();
    });

    it('should show Credit Rate dropdown when enabled', () => {
      render(<LIHTCStructureSection {...createMockProps({ lihtcEnabled: true })} />);
      expect(screen.getByText(/Credit Rate/i)).toBeInTheDocument();
    });

    it('should show Placed-in-Service Month dropdown when enabled', () => {
      render(<LIHTCStructureSection {...createMockProps({ lihtcEnabled: true })} />);
      expect(screen.getByText(/Placed-in-Service Month/i)).toBeInTheDocument();
    });

    it('should show DDA/QCT Boost checkbox when enabled', () => {
      render(<LIHTCStructureSection {...createMockProps({ lihtcEnabled: true })} />);
      expect(screen.getByText(/DDA\/QCT 130% Basis Boost/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Preview Calculations
  // =========================================================================

  describe('Preview Calculations', () => {
    it('should show Estimated Federal LIHTC preview when valid inputs', () => {
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        lihtcEligibleBasis: 50000000
      })} />);

      expect(screen.getByText(/Estimated Federal LIHTC/i)).toBeInTheDocument();
    });

    it('should show Annual Credit in preview', () => {
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        lihtcEligibleBasis: 50000000
      })} />);

      expect(screen.getByText(/Annual Credit:/i)).toBeInTheDocument();
    });

    it('should show Year 1 Credit in preview', () => {
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        lihtcEligibleBasis: 50000000
      })} />);

      expect(screen.getByText(/Year 1 Credit/i)).toBeInTheDocument();
    });

    it('should show Total 10-Year Credits in preview', () => {
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        lihtcEligibleBasis: 50000000
      })} />);

      expect(screen.getByText(/Total 10-Year Credits/i)).toBeInTheDocument();
    });

    it('should not show preview when eligible basis is zero', () => {
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        lihtcEligibleBasis: 0
      })} />);

      expect(screen.queryByText(/Estimated Federal LIHTC/i)).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Callbacks
  // =========================================================================

  describe('Callbacks', () => {
    it('should call setLihtcEnabled when checkbox is clicked', () => {
      const setLihtcEnabled = jest.fn();
      render(<LIHTCStructureSection {...createMockProps({ setLihtcEnabled })} />);

      const checkbox = screen.getByRole('checkbox', { name: /Enable Federal LIHTC Calculations/i });
      fireEvent.click(checkbox);

      expect(setLihtcEnabled).toHaveBeenCalledWith(true);
    });

    it('should call setDdaQctBoost when DDA/QCT checkbox is clicked', () => {
      const setDdaQctBoost = jest.fn();
      render(<LIHTCStructureSection {...createMockProps({
        lihtcEnabled: true,
        setDdaQctBoost
      })} />);

      const checkbox = screen.getByRole('checkbox', { name: /DDA\/QCT 130% Basis Boost/i });
      fireEvent.click(checkbox);

      expect(setDdaQctBoost).toHaveBeenCalledWith(true);
    });
  });
});
