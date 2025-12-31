/**
 * IMPL-7.0-004: Warning Types & Classification System
 *
 * Provides type definitions, severity classification, and helper functions
 * for displaying warnings from state LIHTC calculations and other calculator warnings.
 */

/**
 * Warning severity levels
 */
export type WarningSeverity = 'critical' | 'warning' | 'info';

/**
 * Warning categories/types
 */
export type WarningType =
  | 'prevailing_wage'
  | 'sunset'
  | 'transferability'
  | 'conformity'
  | 'cap'
  | 'no_program'
  | 'general';

/**
 * Structured warning object
 */
export interface CalculatorWarning {
  id: string;
  type: WarningType;
  severity: WarningSeverity;
  message: string;
  dismissible: boolean;
  metadata?: {
    state?: string;
    program?: string;
    sunsetYear?: number;
    yearsRemaining?: number;
    capAmount?: number;
    requestedAmount?: number;
  };
}

/**
 * Warning classification rules
 */
const WARNING_PATTERNS: Array<{
  pattern: RegExp;
  type: WarningType;
  severity: WarningSeverity;
  dismissible: boolean;
}> = [
  // Prevailing wage - CRITICAL (affects project feasibility)
  {
    pattern: /prevailing wage required/i,
    type: 'prevailing_wage',
    severity: 'critical',
    dismissible: false,
  },

  // Sunset - already expired (CRITICAL)
  {
    pattern: /has sunset/i,
    type: 'sunset',
    severity: 'critical',
    dismissible: false,
  },

  // Sunset - expiring soon (WARNING)
  {
    pattern: /sunsets.*\d+ year/i,
    type: 'sunset',
    severity: 'warning',
    dismissible: true,
  },

  // No state liability - CRITICAL (cannot use credits)
  {
    pattern: /no.*tax liability.*cannot be used/i,
    type: 'transferability',
    severity: 'critical',
    dismissible: false,
  },

  // Cap exceeded - WARNING (may not get full allocation)
  {
    pattern: /exceeds annual cap/i,
    type: 'cap',
    severity: 'warning',
    dismissible: true,
  },

  // No program available - INFO (not an error, just no state benefit)
  {
    pattern: /No state LIHTC program/i,
    type: 'no_program',
    severity: 'info',
    dismissible: true,
  },
];

/**
 * Classify a warning message into a structured CalculatorWarning object
 */
export function classifyWarning(
  message: string,
  index: number = 0
): CalculatorWarning {
  // Try to match against known patterns
  for (const rule of WARNING_PATTERNS) {
    if (rule.pattern.test(message)) {
      return {
        id: `warning-${index}-${Date.now()}`,
        type: rule.type,
        severity: rule.severity,
        message,
        dismissible: rule.dismissible,
        metadata: extractMetadata(message, rule.type),
      };
    }
  }

  // Default to general warning if no pattern matches
  return {
    id: `warning-${index}-${Date.now()}`,
    type: 'general',
    severity: 'warning',
    message,
    dismissible: true,
  };
}

/**
 * Extract metadata from warning message
 */
function extractMetadata(
  message: string,
  type: WarningType
): CalculatorWarning['metadata'] {
  const metadata: CalculatorWarning['metadata'] = {};

  // Extract state code (2 uppercase letters)
  const stateMatch = message.match(/\b([A-Z]{2})\b/);
  if (stateMatch) {
    metadata.state = stateMatch[1];
  }

  // Extract program name (text after "for" and before " in ")
  const programMatch = message.match(/for\s+(.+?)\s+in\s+/i);
  if (programMatch) {
    metadata.program = programMatch[1].trim();
  }

  // Extract sunset year and years remaining
  if (type === 'sunset') {
    const sunsetYearMatch = message.match(/sunsets?\s+(\d{4})/i);
    if (sunsetYearMatch) {
      metadata.sunsetYear = parseInt(sunsetYearMatch[1], 10);
    }

    const yearsRemainingMatch = message.match(/(\d+)\s+year\(s\)\s+remaining/i);
    if (yearsRemainingMatch) {
      metadata.yearsRemaining = parseInt(yearsRemainingMatch[1], 10);
    }
  }

  // Extract cap and requested amounts
  if (type === 'cap') {
    const amountMatches = message.match(/[\d,]+/g);
    if (amountMatches && amountMatches.length >= 2) {
      metadata.requestedAmount = parseInt(amountMatches[0].replace(/,/g, ''), 10);
      metadata.capAmount = parseInt(amountMatches[1].replace(/,/g, ''), 10);
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

/**
 * Convert array of warning strings to structured CalculatorWarning objects
 */
export function classifyWarnings(messages: string[]): CalculatorWarning[] {
  return messages.map((message, index) => classifyWarning(message, index));
}

/**
 * Filter warnings by severity
 */
export function filterWarningsBySeverity(
  warnings: CalculatorWarning[],
  severity: WarningSeverity | WarningSeverity[]
): CalculatorWarning[] {
  const severities = Array.isArray(severity) ? severity : [severity];
  return warnings.filter((w) => severities.includes(w.severity));
}

/**
 * Filter warnings by type
 */
export function filterWarningsByType(
  warnings: CalculatorWarning[],
  type: WarningType | WarningType[]
): CalculatorWarning[] {
  const types = Array.isArray(type) ? type : [type];
  return warnings.filter((w) => types.includes(w.type));
}

/**
 * Get count of warnings by severity
 */
export function getWarningSeverityCounts(warnings: CalculatorWarning[]): {
  critical: number;
  warning: number;
  info: number;
} {
  return warnings.reduce(
    (counts, w) => {
      counts[w.severity]++;
      return counts;
    },
    { critical: 0, warning: 0, info: 0 }
  );
}

/**
 * Check if warnings array contains any critical warnings
 */
export function hasCriticalWarnings(warnings: CalculatorWarning[]): boolean {
  return warnings.some((w) => w.severity === 'critical');
}

/**
 * Sort warnings by severity (critical first, then warning, then info)
 */
export function sortWarningsBySeverity(
  warnings: CalculatorWarning[]
): CalculatorWarning[] {
  const severityOrder: Record<WarningSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return [...warnings].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

/**
 * Get icon for warning severity
 */
export function getWarningSeverityIcon(severity: WarningSeverity): string {
  switch (severity) {
    case 'critical':
      return '🚫';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
  }
}

/**
 * Get CSS class name for warning severity
 */
export function getWarningSeverityClassName(severity: WarningSeverity): string {
  return `warning-${severity}`;
}

/**
 * Format warning message for display (with optional truncation)
 */
export function formatWarningMessage(
  message: string,
  maxLength?: number
): string {
  if (!maxLength || message.length <= maxLength) {
    return message;
  }

  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Type alias for backward compatibility
 */
export type Warning = CalculatorWarning;
