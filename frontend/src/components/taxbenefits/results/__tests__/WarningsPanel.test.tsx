/**
 * IMPL-7.0-004: Warnings Panel Tests
 *
 * Comprehensive test suite for WarningsPanel component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WarningsPanel } from '../WarningsPanel';
import {
  CalculatorWarning,
  WarningSeverity,
  WarningType,
} from '../../../../utils/taxbenefits/warningTypes';

describe('WarningsPanel', () => {
  // =========================================================================
  // Basic Rendering
  // =========================================================================

  describe('Basic Rendering', () => {
    it('should not render when no warnings and showWhenEmpty is false', () => {
      const { container } = render(<WarningsPanel warnings={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render empty state when no warnings but showWhenEmpty is true', () => {
      render(<WarningsPanel warnings={[]} showWhenEmpty={true} />);
      expect(screen.getByText('No warnings or notices')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(
        <WarningsPanel
          warnings={['Test warning']}
          title="Custom Title"
        />
      );
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <WarningsPanel warnings={['Test']} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('warnings-panel', 'custom-class');
    });
  });

  // =========================================================================
  // String Warnings (Auto-Classification)
  // =========================================================================

  describe('String Warnings', () => {
    it('should display string warnings', () => {
      const warnings = ['Warning 1', 'Warning 2', 'Warning 3'];
      render(<WarningsPanel warnings={warnings} />);

      warnings.forEach((warning) => {
        expect(screen.getByText(warning)).toBeInTheDocument();
      });
    });

    it('should classify prevailing wage warnings as critical', () => {
      render(
        <WarningsPanel
          warnings={['State prevailing wage required for State LIHTC in CA']}
        />
      );

      const warningItem = screen.getByText(/prevailing wage/i).closest('.warning-item');
      expect(warningItem).toHaveClass('warning-critical');
    });

    it('should classify sunset warnings as critical when expired', () => {
      render(
        <WarningsPanel warnings={['Program State LIHTC has sunset (2020)']} />
      );

      const warningItem = screen.getByText(/has sunset/i).closest('.warning-item');
      expect(warningItem).toHaveClass('warning-critical');
    });

    it('should classify sunset warnings as warning when expiring soon', () => {
      render(
        <WarningsPanel
          warnings={['Program State LIHTC sunsets 2028 - only 3 year(s) remaining']}
        />
      );

      const warningItem = screen.getByText(/sunsets 2028/i).closest('.warning-item');
      expect(warningItem).toHaveClass('warning-warning');
    });

    it('should classify no liability warnings as critical', () => {
      render(
        <WarningsPanel
          warnings={[
            'Investor has no GA tax liability - allocated credits cannot be used',
          ]}
        />
      );

      const warningItem = screen.getByText(/no.*tax liability/i).closest('.warning-item');
      expect(warningItem).toHaveClass('warning-critical');
    });

    it('should classify cap exceeded warnings as warning', () => {
      render(
        <WarningsPanel
          warnings={[
            'Requested amount 150,000,000 exceeds annual cap of 100,000,000',
          ]}
        />
      );

      const warningItem = screen.getByText(/exceeds annual cap/i).closest('.warning-item');
      expect(warningItem).toHaveClass('warning-warning');
    });

    it('should classify no program warnings as info', () => {
      render(<WarningsPanel warnings={['No state LIHTC program in TX']} />);

      const warningItem = screen.getByText(/No state LIHTC program/i).closest('.warning-item');
      expect(warningItem).toHaveClass('warning-info');
    });
  });

  // =========================================================================
  // Structured Warnings
  // =========================================================================

  describe('Structured Warnings', () => {
    it('should display structured warnings', () => {
      const warnings: CalculatorWarning[] = [
        {
          id: 'w1',
          type: 'prevailing_wage',
          severity: 'critical',
          message: 'Prevailing wage required',
          dismissible: false,
        },
        {
          id: 'w2',
          type: 'sunset',
          severity: 'warning',
          message: 'Program sunsets soon',
          dismissible: true,
        },
      ];

      render(<WarningsPanel warnings={warnings} />);

      expect(screen.getByText('Prevailing wage required')).toBeInTheDocument();
      expect(screen.getByText('Program sunsets soon')).toBeInTheDocument();
    });

    it('should display metadata fields', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'sunset',
        severity: 'warning',
        message: 'Program sunsets soon',
        dismissible: true,
        metadata: {
          state: 'KS',
          program: 'State LIHTC',
          sunsetYear: 2028,
          yearsRemaining: 3,
        },
      };

      render(<WarningsPanel warnings={[warning]} />);

      expect(screen.getByText(/State: KS/)).toBeInTheDocument();
      expect(screen.getByText(/Program: State LIHTC/)).toBeInTheDocument();
      expect(screen.getByText(/Sunset: 2028/)).toBeInTheDocument();
      expect(screen.getByText(/3 years remaining/)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Severity Styling
  // =========================================================================

  describe('Severity Styling', () => {
    it('should apply correct CSS class for critical warnings', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'prevailing_wage',
        severity: 'critical',
        message: 'Critical warning',
        dismissible: false,
      };

      render(<WarningsPanel warnings={[warning]} />);

      const warningItem = screen.getByText('Critical warning').closest('.warning-item');
      expect(warningItem).toHaveClass('warning-critical');
    });

    it('should apply correct CSS class for warning severity', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'sunset',
        severity: 'warning',
        message: 'Warning message',
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} />);

      const warningItem = screen.getByText('Warning message').closest('.warning-item');
      expect(warningItem).toHaveClass('warning-warning');
    });

    it('should apply correct CSS class for info severity', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'no_program',
        severity: 'info',
        message: 'Info message',
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} />);

      const warningItem = screen.getByText('Info message').closest('.warning-item');
      expect(warningItem).toHaveClass('warning-info');
    });
  });

  // =========================================================================
  // Dismissible vs Non-Dismissible
  // =========================================================================

  describe('Dismissible Warnings', () => {
    it('should show dismiss button for dismissible warnings', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'sunset',
        severity: 'warning',
        message: 'Dismissible warning',
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} />);

      expect(screen.getByRole('button', { name: /dismiss warning/i })).toBeInTheDocument();
    });

    it('should not show dismiss button for non-dismissible warnings', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'prevailing_wage',
        severity: 'critical',
        message: 'Non-dismissible warning',
        dismissible: false,
      };

      render(<WarningsPanel warnings={[warning]} />);

      expect(screen.queryByRole('button', { name: /dismiss warning/i })).not.toBeInTheDocument();
    });

    it('should show lock icon for non-dismissible warnings', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'prevailing_wage',
        severity: 'critical',
        message: 'Non-dismissible warning',
        dismissible: false,
      };

      render(<WarningsPanel warnings={[warning]} />);

      expect(screen.getByTitle('This warning cannot be dismissed')).toBeInTheDocument();
    });

    it('should remove warning when dismissed', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'sunset',
        severity: 'warning',
        message: 'Dismissible warning',
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss warning/i });
      fireEvent.click(dismissButton);

      expect(screen.queryByText('Dismissible warning')).not.toBeInTheDocument();
    });

    it('should call onDismissWarning callback when warning is dismissed', () => {
      const onDismissWarning = jest.fn();
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'sunset',
        severity: 'warning',
        message: 'Dismissible warning',
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} onDismissWarning={onDismissWarning} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss warning/i });
      fireEvent.click(dismissButton);

      expect(onDismissWarning).toHaveBeenCalledWith(warning);
    });
  });

  // =========================================================================
  // Warning Counts
  // =========================================================================

  describe('Warning Counts', () => {
    it('should display count for critical warnings', () => {
      const warnings: CalculatorWarning[] = [
        {
          id: 'w1',
          type: 'prevailing_wage',
          severity: 'critical',
          message: 'Critical 1',
          dismissible: false,
        },
        {
          id: 'w2',
          type: 'transferability',
          severity: 'critical',
          message: 'Critical 2',
          dismissible: false,
        },
      ];

      render(<WarningsPanel warnings={warnings} />);

      expect(screen.getByText('2 Critical')).toBeInTheDocument();
    });

    it('should display count for warning severity', () => {
      const warnings: CalculatorWarning[] = [
        {
          id: 'w1',
          type: 'sunset',
          severity: 'warning',
          message: 'Warning 1',
          dismissible: true,
        },
        {
          id: 'w2',
          type: 'cap',
          severity: 'warning',
          message: 'Warning 2',
          dismissible: true,
        },
        {
          id: 'w3',
          type: 'sunset',
          severity: 'warning',
          message: 'Warning 3',
          dismissible: true,
        },
      ];

      render(<WarningsPanel warnings={warnings} />);

      expect(screen.getByText('3 Warnings')).toBeInTheDocument();
    });

    it('should display singular "Warning" for count of 1', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'sunset',
        severity: 'warning',
        message: 'Warning 1',
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} />);

      expect(screen.getByText('1 Warning')).toBeInTheDocument();
    });

    it('should display count for info severity', () => {
      const warnings: CalculatorWarning[] = [
        {
          id: 'w1',
          type: 'no_program',
          severity: 'info',
          message: 'Info 1',
          dismissible: true,
        },
        {
          id: 'w2',
          type: 'general',
          severity: 'info',
          message: 'Info 2',
          dismissible: true,
        },
      ];

      render(<WarningsPanel warnings={warnings} />);

      expect(screen.getByText('2 Info')).toBeInTheDocument();
    });

    it('should display combined counts for mixed severities', () => {
      const warnings: CalculatorWarning[] = [
        {
          id: 'w1',
          type: 'prevailing_wage',
          severity: 'critical',
          message: 'Critical',
          dismissible: false,
        },
        {
          id: 'w2',
          type: 'sunset',
          severity: 'warning',
          message: 'Warning 1',
          dismissible: true,
        },
        {
          id: 'w3',
          type: 'cap',
          severity: 'warning',
          message: 'Warning 2',
          dismissible: true,
        },
        {
          id: 'w4',
          type: 'no_program',
          severity: 'info',
          message: 'Info',
          dismissible: true,
        },
      ];

      render(<WarningsPanel warnings={warnings} />);

      expect(screen.getByText('1 Critical')).toBeInTheDocument();
      expect(screen.getByText('2 Warnings')).toBeInTheDocument();
      expect(screen.getByText('1 Info')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Sorting by Severity
  // =========================================================================

  describe('Sorting by Severity', () => {
    it('should display critical warnings first', () => {
      const warnings: CalculatorWarning[] = [
        {
          id: 'w1',
          type: 'no_program',
          severity: 'info',
          message: 'Info warning',
          dismissible: true,
        },
        {
          id: 'w2',
          type: 'prevailing_wage',
          severity: 'critical',
          message: 'Critical warning',
          dismissible: false,
        },
        {
          id: 'w3',
          type: 'sunset',
          severity: 'warning',
          message: 'Warning message',
          dismissible: true,
        },
      ];

      const { container } = render(<WarningsPanel warnings={warnings} />);

      const warningItems = container.querySelectorAll('.warning-item');
      const firstWarning = warningItems[0];

      // Critical should be first
      expect(firstWarning).toHaveClass('warning-critical');
      expect(firstWarning.textContent).toContain('Critical warning');
    });
  });

  // =========================================================================
  // Critical Warning Footer
  // =========================================================================

  describe('Critical Warning Footer', () => {
    it('should show critical footer when critical warnings present', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'prevailing_wage',
        severity: 'critical',
        message: 'Critical warning',
        dismissible: false,
      };

      render(<WarningsPanel warnings={[warning]} />);

      expect(
        screen.getByText(/Critical warnings require attention before proceeding/i)
      ).toBeInTheDocument();
    });

    it('should not show critical footer when no critical warnings', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'sunset',
        severity: 'warning',
        message: 'Warning message',
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} />);

      expect(
        screen.queryByText(/Critical warnings require attention before proceeding/i)
      ).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Icons
  // =========================================================================

  describe('Icons', () => {
    it('should display correct icon for critical severity', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'prevailing_wage',
        severity: 'critical',
        message: 'Critical warning',
        dismissible: false,
      };

      render(<WarningsPanel warnings={[warning]} />);

      // Critical icon is 🚫
      expect(screen.getByText('🚫')).toBeInTheDocument();
    });

    it('should display correct icon for warning severity', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'sunset',
        severity: 'warning',
        message: 'Warning message',
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} />);

      // Warning icon is ⚠️
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should display correct icon for info severity', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'no_program',
        severity: 'info',
        message: 'Info message',
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} />);

      // Info icon is ℹ️
      expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('Edge Cases', () => {
    it('should handle empty array of warnings', () => {
      const { container } = render(<WarningsPanel warnings={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle undefined warnings prop', () => {
      const { container } = render(<WarningsPanel />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle warnings with missing metadata', () => {
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'general',
        severity: 'warning',
        message: 'Warning without metadata',
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} />);

      expect(screen.getByText('Warning without metadata')).toBeInTheDocument();
      expect(screen.queryByText(/State:/)).not.toBeInTheDocument();
    });

    it('should handle very long warning messages', () => {
      const longMessage = 'A'.repeat(500);
      const warning: CalculatorWarning = {
        id: 'w1',
        type: 'general',
        severity: 'warning',
        message: longMessage,
        dismissible: true,
      };

      render(<WarningsPanel warnings={[warning]} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle multiple dismissals', () => {
      const warnings: CalculatorWarning[] = [
        {
          id: 'w1',
          type: 'sunset',
          severity: 'warning',
          message: 'Warning 1',
          dismissible: true,
        },
        {
          id: 'w2',
          type: 'cap',
          severity: 'warning',
          message: 'Warning 2',
          dismissible: true,
        },
        {
          id: 'w3',
          type: 'general',
          severity: 'warning',
          message: 'Warning 3',
          dismissible: true,
        },
      ];

      render(<WarningsPanel warnings={warnings} />);

      const dismissButtons = screen.getAllByRole('button', { name: /dismiss warning/i });

      // Dismiss first warning
      fireEvent.click(dismissButtons[0]);
      expect(screen.queryByText('Warning 1')).not.toBeInTheDocument();
      expect(screen.getByText('Warning 2')).toBeInTheDocument();
      expect(screen.getByText('Warning 3')).toBeInTheDocument();

      // Dismiss second warning
      const remainingButtons = screen.getAllByRole('button', { name: /dismiss warning/i });
      fireEvent.click(remainingButtons[0]);
      expect(screen.queryByText('Warning 2')).not.toBeInTheDocument();
      expect(screen.getByText('Warning 3')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Integration with State LIHTC Warnings
  // =========================================================================

  describe('Integration with State LIHTC Warnings', () => {
    it('should display typical state LIHTC warnings correctly', () => {
      const warnings = [
        'State prevailing wage required for State LIHTC in CA',
        'Program State LIHTC sunsets 2028 - only 3 year(s) remaining',
        'Requested amount 150,000,000 exceeds annual cap of 100,000,000',
      ];

      render(<WarningsPanel warnings={warnings} />);

      expect(screen.getByText(/prevailing wage/i)).toBeInTheDocument();
      expect(screen.getByText(/sunsets 2028/i)).toBeInTheDocument();
      expect(screen.getByText(/exceeds annual cap/i)).toBeInTheDocument();
    });

    it('should correctly classify and style mixed state LIHTC warnings', () => {
      const warnings = [
        'State prevailing wage required for STCS in NJ', // Critical
        'Program State LIHTC sunsets 2028 - only 2 year(s) remaining', // Warning
        'No state LIHTC program in TX', // Info
      ];

      render(<WarningsPanel warnings={warnings} />);

      expect(screen.getByText('1 Critical')).toBeInTheDocument();
      expect(screen.getByText('1 Warning')).toBeInTheDocument();
      expect(screen.getByText('1 Info')).toBeInTheDocument();
    });
  });
});
