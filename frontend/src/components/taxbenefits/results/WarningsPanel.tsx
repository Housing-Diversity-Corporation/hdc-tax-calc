/**
 * IMPL-7.0-004: Warnings Panel Component
 *
 * Displays warnings from state LIHTC calculations and other calculator warnings
 * with severity-based styling. Critical warnings are non-dismissible.
 */

import React, { useState } from 'react';
import {
  CalculatorWarning,
  classifyWarnings,
  sortWarningsBySeverity,
  getWarningSeverityCounts,
  hasCriticalWarnings,
  getWarningSeverityIcon,
  getWarningSeverityClassName,
} from '../../../utils/taxbenefits/warningTypes';
import './WarningsPanel.css';

export interface WarningsPanelProps {
  /**
   * Array of warning messages (strings) or structured warnings
   */
  warnings?: string[] | CalculatorWarning[];

  /**
   * Optional title for the panel
   * @default "Warnings & Notices"
   */
  title?: string;

  /**
   * Whether to show the panel when there are no warnings
   * @default false
   */
  showWhenEmpty?: boolean;

  /**
   * Custom CSS class name
   */
  className?: string;

  /**
   * Callback when a warning is dismissed
   */
  onDismissWarning?: (warning: CalculatorWarning) => void;
}

/**
 * WarningsPanel component
 *
 * Displays a list of warnings with severity-based styling:
 * - Critical: Red, non-dismissible
 * - Warning: Yellow, dismissible
 * - Info: Blue, dismissible
 */
export const WarningsPanel: React.FC<WarningsPanelProps> = ({
  warnings = [],
  title = 'Warnings & Notices',
  showWhenEmpty = false,
  className = '',
  onDismissWarning,
}) => {
  // Convert string warnings to structured warnings if needed
  const structuredWarnings: CalculatorWarning[] =
    warnings.length > 0 && typeof warnings[0] === 'string'
      ? classifyWarnings(warnings as string[])
      : (warnings as CalculatorWarning[]);

  // Sort warnings by severity (critical first)
  const sortedWarnings = sortWarningsBySeverity(structuredWarnings);

  // Track dismissed warnings
  const [dismissedWarningIds, setDismissedWarningIds] = useState<Set<string>>(
    new Set()
  );

  // Filter out dismissed warnings
  const visibleWarnings = sortedWarnings.filter(
    (w) => !dismissedWarningIds.has(w.id)
  );

  // Don't render if no warnings and showWhenEmpty is false
  if (visibleWarnings.length === 0 && !showWhenEmpty) {
    return null;
  }

  // Get warning counts
  const counts = getWarningSeverityCounts(visibleWarnings);
  const hasCritical = hasCriticalWarnings(visibleWarnings);

  /**
   * Handle dismissing a warning
   */
  const handleDismiss = (warning: CalculatorWarning) => {
    if (!warning.dismissible) {
      return;
    }

    setDismissedWarningIds((prev) => new Set(prev).add(warning.id));

    if (onDismissWarning) {
      onDismissWarning(warning);
    }
  };

  return (
    <div className={`warnings-panel ${className}`}>
      {/* Header */}
      <div className="warnings-panel-header">
        <h3 className="warnings-panel-title">{title}</h3>
        {visibleWarnings.length > 0 && (
          <div className="warnings-panel-counts">
            {counts.critical > 0 && (
              <span className="warning-count warning-count-critical">
                {counts.critical} Critical
              </span>
            )}
            {counts.warning > 0 && (
              <span className="warning-count warning-count-warning">
                {counts.warning} Warning{counts.warning !== 1 ? 's' : ''}
              </span>
            )}
            {counts.info > 0 && (
              <span className="warning-count warning-count-info">
                {counts.info} Info
              </span>
            )}
          </div>
        )}
      </div>

      {/* Warning List */}
      {visibleWarnings.length > 0 ? (
        <div className="warnings-panel-list">
          {visibleWarnings.map((warning) => (
            <div
              key={warning.id}
              className={`warning-item ${getWarningSeverityClassName(
                warning.severity
              )} ${warning.dismissible ? 'dismissible' : 'non-dismissible'}`}
            >
              {/* Icon */}
              <div className="warning-icon">
                {getWarningSeverityIcon(warning.severity)}
              </div>

              {/* Content */}
              <div className="warning-content">
                <div className="warning-message">{warning.message}</div>

                {/* Metadata (if present) */}
                {warning.metadata && (
                  <div className="warning-metadata">
                    {warning.metadata.state && (
                      <span className="warning-metadata-item">
                        State: {warning.metadata.state}
                      </span>
                    )}
                    {warning.metadata.program && (
                      <span className="warning-metadata-item">
                        Program: {warning.metadata.program}
                      </span>
                    )}
                    {warning.metadata.sunsetYear && (
                      <span className="warning-metadata-item">
                        Sunset: {warning.metadata.sunsetYear}
                      </span>
                    )}
                    {warning.metadata.yearsRemaining !== undefined && (
                      <span className="warning-metadata-item">
                        {warning.metadata.yearsRemaining} year
                        {warning.metadata.yearsRemaining !== 1 ? 's' : ''}{' '}
                        remaining
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Dismiss Button */}
              {warning.dismissible && (
                <button
                  className="warning-dismiss-button"
                  onClick={() => handleDismiss(warning)}
                  aria-label="Dismiss warning"
                  title="Dismiss this warning"
                >
                  ×
                </button>
              )}

              {/* Non-dismissible indicator */}
              {!warning.dismissible && (
                <div
                  className="warning-non-dismissible-indicator"
                  title="This warning cannot be dismissed"
                >
                  🔒
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="warnings-panel-empty">
          <span className="warnings-panel-empty-icon">✓</span>
          <span className="warnings-panel-empty-text">
            No warnings or notices
          </span>
        </div>
      )}

      {/* Critical Warning Footer */}
      {hasCritical && (
        <div className="warnings-panel-footer warnings-panel-footer-critical">
          <strong>⚠️ Critical warnings require attention before proceeding.</strong>
        </div>
      )}
    </div>
  );
};

export default WarningsPanel;
