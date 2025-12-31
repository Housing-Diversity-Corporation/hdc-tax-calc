/**
 * IMPL-7.0-004: Warning Types Tests
 *
 * Comprehensive test suite for warning classification and utility functions
 */

import {
  CalculatorWarning,
  WarningSeverity,
  WarningType,
  classifyWarning,
  classifyWarnings,
  filterWarningsBySeverity,
  filterWarningsByType,
  getWarningSeverityCounts,
  hasCriticalWarnings,
  sortWarningsBySeverity,
  getWarningSeverityIcon,
  getWarningSeverityClassName,
  formatWarningMessage,
} from '../warningTypes';

describe('warningTypes', () => {
  // =========================================================================
  // classifyWarning
  // =========================================================================

  describe('classifyWarning', () => {
    it('should classify prevailing wage warnings as critical', () => {
      const message = 'State prevailing wage required for State LIHTC in CA';
      const warning = classifyWarning(message);

      expect(warning.type).toBe('prevailing_wage');
      expect(warning.severity).toBe('critical');
      expect(warning.dismissible).toBe(false);
      expect(warning.message).toBe(message);
    });

    it('should classify expired sunset warnings as critical', () => {
      const message = 'Program State LIHTC has sunset (2020)';
      const warning = classifyWarning(message);

      expect(warning.type).toBe('sunset');
      expect(warning.severity).toBe('critical');
      expect(warning.dismissible).toBe(false);
    });

    it('should classify expiring sunset warnings as warning', () => {
      const message = 'Program State LIHTC sunsets 2028 - only 3 year(s) remaining';
      const warning = classifyWarning(message);

      expect(warning.type).toBe('sunset');
      expect(warning.severity).toBe('warning');
      expect(warning.dismissible).toBe(true);
    });

    it('should classify no liability warnings as critical', () => {
      const message = 'Investor has no GA tax liability - allocated credits cannot be used';
      const warning = classifyWarning(message);

      expect(warning.type).toBe('transferability');
      expect(warning.severity).toBe('critical');
      expect(warning.dismissible).toBe(false);
    });

    it('should classify cap exceeded warnings as warning', () => {
      const message = 'Requested amount 150,000,000 exceeds annual cap of 100,000,000';
      const warning = classifyWarning(message);

      expect(warning.type).toBe('cap');
      expect(warning.severity).toBe('warning');
      expect(warning.dismissible).toBe(true);
    });

    it('should classify no program warnings as info', () => {
      const message = 'No state LIHTC program in TX';
      const warning = classifyWarning(message);

      expect(warning.type).toBe('no_program');
      expect(warning.severity).toBe('info');
      expect(warning.dismissible).toBe(true);
    });

    it('should classify unknown warnings as general warning', () => {
      const message = 'Some unknown warning message';
      const warning = classifyWarning(message);

      expect(warning.type).toBe('general');
      expect(warning.severity).toBe('warning');
      expect(warning.dismissible).toBe(true);
    });

    it('should generate unique IDs with index', () => {
      const message = 'Test warning';
      const warning1 = classifyWarning(message, 0);
      const warning2 = classifyWarning(message, 1);

      expect(warning1.id).not.toBe(warning2.id);
      expect(warning1.id).toContain('warning-0');
      expect(warning2.id).toContain('warning-1');
    });
  });

  // =========================================================================
  // Metadata Extraction
  // =========================================================================

  describe('Metadata Extraction', () => {
    it('should extract state code from prevailing wage warning', () => {
      const message = 'State prevailing wage required for State LIHTC in CA';
      const warning = classifyWarning(message);

      expect(warning.metadata?.state).toBe('CA');
    });

    it('should extract program name from warning', () => {
      const message = 'State prevailing wage required for State LIHTC in CA';
      const warning = classifyWarning(message);

      expect(warning.metadata?.program).toBe('State LIHTC');
    });

    it('should extract sunset year from sunset warning', () => {
      const message = 'Program State LIHTC sunsets 2028 - only 3 year(s) remaining';
      const warning = classifyWarning(message);

      expect(warning.metadata?.sunsetYear).toBe(2028);
    });

    it('should extract years remaining from sunset warning', () => {
      const message = 'Program State LIHTC sunsets 2028 - only 3 year(s) remaining';
      const warning = classifyWarning(message);

      expect(warning.metadata?.yearsRemaining).toBe(3);
    });

    it('should extract cap amounts from cap warning', () => {
      const message = 'Requested amount 150,000,000 exceeds annual cap of 100,000,000';
      const warning = classifyWarning(message);

      expect(warning.metadata?.requestedAmount).toBe(150000000);
      expect(warning.metadata?.capAmount).toBe(100000000);
    });

    it('should return undefined metadata when no extractable data', () => {
      const message = 'Generic warning message';
      const warning = classifyWarning(message);

      expect(warning.metadata).toBeUndefined();
    });
  });

  // =========================================================================
  // classifyWarnings
  // =========================================================================

  describe('classifyWarnings', () => {
    it('should classify array of warning messages', () => {
      const messages = [
        'State prevailing wage required for State LIHTC in CA',
        'Program State LIHTC sunsets 2028 - only 3 year(s) remaining',
        'No state LIHTC program in TX',
      ];

      const warnings = classifyWarnings(messages);

      expect(warnings).toHaveLength(3);
      expect(warnings[0].type).toBe('prevailing_wage');
      expect(warnings[1].type).toBe('sunset');
      expect(warnings[2].type).toBe('no_program');
    });

    it('should handle empty array', () => {
      const warnings = classifyWarnings([]);
      expect(warnings).toHaveLength(0);
    });
  });

  // =========================================================================
  // filterWarningsBySeverity
  // =========================================================================

  describe('filterWarningsBySeverity', () => {
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
      {
        id: 'w3',
        type: 'sunset',
        severity: 'warning',
        message: 'Warning 1',
        dismissible: true,
      },
      {
        id: 'w4',
        type: 'no_program',
        severity: 'info',
        message: 'Info 1',
        dismissible: true,
      },
    ];

    it('should filter by single severity', () => {
      const critical = filterWarningsBySeverity(warnings, 'critical');
      expect(critical).toHaveLength(2);
      expect(critical.every((w) => w.severity === 'critical')).toBe(true);
    });

    it('should filter by multiple severities', () => {
      const criticalAndWarning = filterWarningsBySeverity(warnings, [
        'critical',
        'warning',
      ]);
      expect(criticalAndWarning).toHaveLength(3);
    });

    it('should return empty array if no matches', () => {
      const result = filterWarningsBySeverity(
        [warnings[0]],
        'info'
      );
      expect(result).toHaveLength(0);
    });
  });

  // =========================================================================
  // filterWarningsByType
  // =========================================================================

  describe('filterWarningsByType', () => {
    const warnings: CalculatorWarning[] = [
      {
        id: 'w1',
        type: 'prevailing_wage',
        severity: 'critical',
        message: 'PW 1',
        dismissible: false,
      },
      {
        id: 'w2',
        type: 'sunset',
        severity: 'warning',
        message: 'Sunset 1',
        dismissible: true,
      },
      {
        id: 'w3',
        type: 'sunset',
        severity: 'warning',
        message: 'Sunset 2',
        dismissible: true,
      },
      {
        id: 'w4',
        type: 'no_program',
        severity: 'info',
        message: 'No program',
        dismissible: true,
      },
    ];

    it('should filter by single type', () => {
      const sunsets = filterWarningsByType(warnings, 'sunset');
      expect(sunsets).toHaveLength(2);
      expect(sunsets.every((w) => w.type === 'sunset')).toBe(true);
    });

    it('should filter by multiple types', () => {
      const multiple = filterWarningsByType(warnings, ['prevailing_wage', 'no_program']);
      expect(multiple).toHaveLength(2);
    });

    it('should return empty array if no matches', () => {
      const result = filterWarningsByType([warnings[0]], 'sunset');
      expect(result).toHaveLength(0);
    });
  });

  // =========================================================================
  // getWarningSeverityCounts
  // =========================================================================

  describe('getWarningSeverityCounts', () => {
    it('should count warnings by severity', () => {
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
        {
          id: 'w3',
          type: 'sunset',
          severity: 'warning',
          message: 'Warning 1',
          dismissible: true,
        },
        {
          id: 'w4',
          type: 'cap',
          severity: 'warning',
          message: 'Warning 2',
          dismissible: true,
        },
        {
          id: 'w5',
          type: 'cap',
          severity: 'warning',
          message: 'Warning 3',
          dismissible: true,
        },
        {
          id: 'w6',
          type: 'no_program',
          severity: 'info',
          message: 'Info 1',
          dismissible: true,
        },
      ];

      const counts = getWarningSeverityCounts(warnings);

      expect(counts.critical).toBe(2);
      expect(counts.warning).toBe(3);
      expect(counts.info).toBe(1);
    });

    it('should return zero counts for empty array', () => {
      const counts = getWarningSeverityCounts([]);

      expect(counts.critical).toBe(0);
      expect(counts.warning).toBe(0);
      expect(counts.info).toBe(0);
    });
  });

  // =========================================================================
  // hasCriticalWarnings
  // =========================================================================

  describe('hasCriticalWarnings', () => {
    it('should return true when critical warnings present', () => {
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
          message: 'Warning',
          dismissible: true,
        },
      ];

      expect(hasCriticalWarnings(warnings)).toBe(true);
    });

    it('should return false when no critical warnings', () => {
      const warnings: CalculatorWarning[] = [
        {
          id: 'w1',
          type: 'sunset',
          severity: 'warning',
          message: 'Warning',
          dismissible: true,
        },
        {
          id: 'w2',
          type: 'no_program',
          severity: 'info',
          message: 'Info',
          dismissible: true,
        },
      ];

      expect(hasCriticalWarnings(warnings)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasCriticalWarnings([])).toBe(false);
    });
  });

  // =========================================================================
  // sortWarningsBySeverity
  // =========================================================================

  describe('sortWarningsBySeverity', () => {
    it('should sort warnings by severity (critical first)', () => {
      const warnings: CalculatorWarning[] = [
        {
          id: 'w1',
          type: 'no_program',
          severity: 'info',
          message: 'Info',
          dismissible: true,
        },
        {
          id: 'w2',
          type: 'prevailing_wage',
          severity: 'critical',
          message: 'Critical',
          dismissible: false,
        },
        {
          id: 'w3',
          type: 'sunset',
          severity: 'warning',
          message: 'Warning',
          dismissible: true,
        },
      ];

      const sorted = sortWarningsBySeverity(warnings);

      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('warning');
      expect(sorted[2].severity).toBe('info');
    });

    it('should not mutate original array', () => {
      const warnings: CalculatorWarning[] = [
        {
          id: 'w1',
          type: 'no_program',
          severity: 'info',
          message: 'Info',
          dismissible: true,
        },
        {
          id: 'w2',
          type: 'prevailing_wage',
          severity: 'critical',
          message: 'Critical',
          dismissible: false,
        },
      ];

      const original = [...warnings];
      sortWarningsBySeverity(warnings);

      expect(warnings).toEqual(original);
    });
  });

  // =========================================================================
  // getWarningSeverityIcon
  // =========================================================================

  describe('getWarningSeverityIcon', () => {
    it('should return correct icon for critical', () => {
      expect(getWarningSeverityIcon('critical')).toBe('🚫');
    });

    it('should return correct icon for warning', () => {
      expect(getWarningSeverityIcon('warning')).toBe('⚠️');
    });

    it('should return correct icon for info', () => {
      expect(getWarningSeverityIcon('info')).toBe('ℹ️');
    });
  });

  // =========================================================================
  // getWarningSeverityClassName
  // =========================================================================

  describe('getWarningSeverityClassName', () => {
    it('should return correct class name for critical', () => {
      expect(getWarningSeverityClassName('critical')).toBe('warning-critical');
    });

    it('should return correct class name for warning', () => {
      expect(getWarningSeverityClassName('warning')).toBe('warning-warning');
    });

    it('should return correct class name for info', () => {
      expect(getWarningSeverityClassName('info')).toBe('warning-info');
    });
  });

  // =========================================================================
  // formatWarningMessage
  // =========================================================================

  describe('formatWarningMessage', () => {
    it('should return full message when no max length', () => {
      const message = 'This is a test warning message';
      expect(formatWarningMessage(message)).toBe(message);
    });

    it('should return full message when under max length', () => {
      const message = 'Short message';
      expect(formatWarningMessage(message, 100)).toBe(message);
    });

    it('should truncate message when over max length', () => {
      const message = 'This is a very long warning message that should be truncated';
      const formatted = formatWarningMessage(message, 20);

      expect(formatted).toBe('This is a very lo...');
      expect(formatted.length).toBe(20);
    });

    it('should handle exact max length', () => {
      const message = 'Exactly twenty chars';
      expect(formatWarningMessage(message, 20)).toBe(message);
    });
  });

  // =========================================================================
  // Integration Tests
  // =========================================================================

  describe('Integration Tests', () => {
    it('should correctly process state LIHTC warnings end-to-end', () => {
      const messages = [
        'State prevailing wage required for State LIHTC in CA',
        'Program State LIHTC sunsets 2028 - only 3 year(s) remaining',
        'Requested amount 150,000,000 exceeds annual cap of 100,000,000',
        'No state LIHTC program in TX',
      ];

      // Classify all warnings
      const warnings = classifyWarnings(messages);

      // Sort by severity
      const sorted = sortWarningsBySeverity(warnings);

      // Get counts
      const counts = getWarningSeverityCounts(sorted);

      // Verify
      expect(sorted[0].severity).toBe('critical'); // Prevailing wage
      expect(sorted[1].severity).toBe('warning'); // Sunset
      expect(sorted[2].severity).toBe('warning'); // Cap exceeded
      expect(sorted[3].severity).toBe('info'); // No program

      expect(counts.critical).toBe(1);
      expect(counts.warning).toBe(2);
      expect(counts.info).toBe(1);

      expect(hasCriticalWarnings(sorted)).toBe(true);
    });

    it('should filter and count correctly after classification', () => {
      const messages = [
        'State prevailing wage required for State LIHTC in CA',
        'State prevailing wage required for STCS in NJ',
        'Program State LIHTC sunsets 2028 - only 2 year(s) remaining',
        'No state LIHTC program in TX',
        'No state LIHTC program in FL',
      ];

      const warnings = classifyWarnings(messages);

      const critical = filterWarningsBySeverity(warnings, 'critical');
      const info = filterWarningsBySeverity(warnings, 'info');
      const prevailingWage = filterWarningsByType(warnings, 'prevailing_wage');

      expect(critical).toHaveLength(2);
      expect(info).toHaveLength(2);
      expect(prevailingWage).toHaveLength(2);
    });
  });
});
