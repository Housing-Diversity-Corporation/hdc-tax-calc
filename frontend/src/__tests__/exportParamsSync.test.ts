/**
 * IMPL-143: Export Params Sync Test
 *
 * Enforces Rule 1 of LIVE_EXCEL_SYNC_PROTOCOL.md:
 * Every CalculationParams field must be present in the
 * export params object (HDCResultsComponent.tsx) or
 * explicitly excluded as engine-internal.
 *
 * If this test fails, a new field was added to CalculationParams
 * without being wired through to the Live Excel export.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Engine-internal exclusions ──────────────────────────────────
// Fields that are computed by the engine or not user inputs.
// Each exclusion MUST have a reason.
const ENGINE_INTERNAL_EXCLUSIONS: Record<string, string> = {
  // Engine-internal: auto-derived from timeline, not user input
  placedInServiceMonth: 'Engine-internal, timeline-derived from investmentDate + constructionMonths',
  exitMonth: 'Engine-internal, timeline-derived from exit date',

  // Engine-computed from other params
  seniorLoanAmount: 'Computed: seniorDebtPct × projectCost',
  interestReserveAmount: 'Computed by engine from interestReserveMonths + debt params',
  yearOneDepreciation: 'Computed by engine from basis and depreciation schedule',
  annualStraightLineDepreciation: 'Computed by engine from basis and MACRS schedule',
  year1NetBenefit: 'Alias for netTaxBenefit, already exported under that name',

  // Not wired in UI state layer — no user input exists
  prefEquityEnabled: 'Not wired in UI state (engine-only feature)',
  prefEquityPct: 'Not wired in UI state',
  prefEquityTargetMOIC: 'Not wired in UI state',
  prefEquityAccrualRate: 'Not wired in UI state',
  prefEquityOzEligible: 'Not wired in UI state',
  loanFeesPercent: 'Not wired in UI',
  legalStructuringCosts: 'Not wired in UI',
  organizationCosts: 'Not wired in UI',
  subDebtPriority: 'Not wired in UI (object type, not simple field)',
  pabTerm: 'Not wired in UI (uses default 40)',

  // Derived from other exported fields or not needed for export
  philanthropicEquityPct: 'Derived from capital structure percentages',
  investorEquityRatio: 'Derived from investorEquityPct',
  autoBalanceCapital: 'UI-only toggle, does not affect calculations',
  outsideInvestorSubDebtAmortization: 'Not wired in UI',
  passiveGainType: 'Not used in export calculations',
  investorType: 'Not used in export calculations',
  annualIncome: 'Superseded by annualOrdinaryIncome/annualPassiveIncome/annualPortfolioIncome',
  ozCapitalGainsTaxRate: 'Exported as capitalGainsTaxRate (different prop name)',
  iraBalance: 'Not useful for Excel export (comprehensive report only)',
  assetSaleGain: 'Not useful for Excel export (comprehensive report only)',
  niitApplies: 'Engine-computed from investorState + investorTrack + groupingElection',
  investorHasStateLiability: 'Not in Results props (integrated into stateLIHTCIntegration)',
  stateLIHTCUserPercentage: 'Rolled into stateLIHTCIntegration result object',
  stateLIHTCUserAmount: 'Rolled into stateLIHTCIntegration result object',

  // Fund/pool integration — not per-deal export fields
  fundEntryYear: 'Fund-level field, not per-deal export',
  dealName: 'Metadata, not a calculation input',
  hdcPlatformMode: 'UI mode toggle, not a calculation input',

  // IMPL-165: Cash sweep — engine-internal waterfall parameters
  philSweepPct: 'Engine-internal waterfall parameter (IMPL-165)',
  hdcDebtFundSweepPct: 'Engine-internal waterfall parameter (IMPL-165)',

  // DSCR Cash Management — engine-internal
  hdcDeferralInterestRate: 'Engine-internal DSCR parameter',
  subDebtDefaultPremium: 'Engine-internal DSCR parameter',

  // IMPL-154: Passive income character split — engine-internal sub-fields
  annualPassiveOrdinaryIncome: 'Character split of annualPassiveIncome, not separate user input for export',
  annualPassiveLTCGIncome: 'Character split of annualPassiveIncome, not separate user input for export',

};

/**
 * Parse an interface definition from a TypeScript file and extract field names.
 * Handles multi-line definitions, comments, and nested types.
 */
function extractInterfaceFields(filePath: string, interfaceName: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Find the interface start
  const interfaceRegex = new RegExp(`export interface ${interfaceName}\\s*\\{`);
  const match = interfaceRegex.exec(content);
  if (!match) {
    throw new Error(`Interface ${interfaceName} not found in ${filePath}`);
  }

  // Track brace depth to find the end of the interface
  let depth = 0;
  let startIdx = match.index + match[0].length;
  let endIdx = startIdx;

  for (let i = match.index; i < content.length; i++) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  const body = content.slice(startIdx, endIdx);
  const fields: string[] = [];

  // Match field declarations: identifier followed by ? and :
  // Skip comments, nested objects, method signatures
  const lines = body.split('\n');
  let inNestedObject = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/**') || trimmed.startsWith('*/')) {
      continue;
    }

    // If we're inside a nested object, just track braces and skip
    if (inNestedObject > 0) {
      for (const ch of trimmed) {
        if (ch === '{') inNestedObject++;
        if (ch === '}') inNestedObject--;
      }
      continue;
    }

    // Match field name: word characters followed by optional ? and :
    const fieldMatch = trimmed.match(/^(\w+)\??:/);
    if (fieldMatch) {
      fields.push(fieldMatch[1]);
    }

    // Track opening braces for nested objects (e.g., subDebtPriority?: { ... })
    for (const ch of trimmed) {
      if (ch === '{') inNestedObject++;
      if (ch === '}') inNestedObject--;
    }
  }

  return fields;
}

/**
 * Extract field names from the export params object in HDCResultsComponent.tsx.
 * Looks for the params={{ ... }} block inside <ExportAuditButton>.
 */
function extractExportParamFields(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Find the ExportAuditButton params block
  const startMarker = '<ExportAuditButton';
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error('ExportAuditButton not found in ' + filePath);
  }

  // Find params={{ from the ExportAuditButton
  const paramsStart = content.indexOf('params={{', startIdx);
  if (paramsStart === -1) {
    throw new Error('params={{ not found after ExportAuditButton in ' + filePath);
  }

  // Find matching closing }}
  let depth = 0;
  let blockStart = paramsStart + 'params={'.length;
  let blockEnd = blockStart;

  for (let i = blockStart; i < content.length; i++) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        blockEnd = i;
        break;
      }
    }
  }

  const block = content.slice(blockStart, blockEnd + 1);
  const fields: string[] = [];

  // Match field assignments: fieldName: value or fieldName:
  const lines = block.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // Match "fieldName:" at start of assignment (handles fieldName: value,)
    const fieldMatch = trimmed.match(/^(\w+):/);
    if (fieldMatch) {
      fields.push(fieldMatch[1]);
    }
  }

  return fields;
}

describe('Export Params Sync (IMPL-143)', () => {
  const typesPath = path.resolve(__dirname, '../types/taxbenefits/index.ts');
  const resultsComponentPath = path.resolve(
    __dirname, '../../src/components/taxbenefits/HDCResultsComponent.tsx'
  );

  // Handle both possible paths (jest may resolve differently)
  const altResultsComponentPath = path.resolve(
    __dirname, '../components/taxbenefits/HDCResultsComponent.tsx'
  );

  const getResultsPath = () => {
    if (fs.existsSync(resultsComponentPath)) return resultsComponentPath;
    if (fs.existsSync(altResultsComponentPath)) return altResultsComponentPath;
    throw new Error(
      `HDCResultsComponent.tsx not found at:\n  ${resultsComponentPath}\n  ${altResultsComponentPath}`
    );
  };

  it('CalculationParams interface can be parsed', () => {
    const fields = extractInterfaceFields(typesPath, 'CalculationParams');
    expect(fields.length).toBeGreaterThan(30);
  });

  it('Export params object can be parsed', () => {
    const fields = extractExportParamFields(getResultsPath());
    expect(fields.length).toBeGreaterThan(30);
  });

  it('every CalculationParams field is in export params or explicitly excluded', () => {
    const calcParamFields = extractInterfaceFields(typesPath, 'CalculationParams');
    const exportFields = extractExportParamFields(getResultsPath());

    const exportFieldSet = new Set(exportFields);
    const exclusionSet = new Set(Object.keys(ENGINE_INTERNAL_EXCLUSIONS));

    const missing: string[] = [];

    for (const field of calcParamFields) {
      if (!exportFieldSet.has(field) && !exclusionSet.has(field)) {
        missing.push(field);
      }
    }

    expect(missing).toEqual([]);
    // If this fails, the missing fields above need to be either:
    // 1. Added to the export params in HDCResultsComponent.tsx, or
    // 2. Added to ENGINE_INTERNAL_EXCLUSIONS in this test (with a reason).
  });

  it('exclusion list does not contain fields that ARE in export params (stale exclusions)', () => {
    const exportFields = extractExportParamFields(getResultsPath());
    const exportFieldSet = new Set(exportFields);

    const stale: string[] = [];
    for (const field of Object.keys(ENGINE_INTERNAL_EXCLUSIONS)) {
      if (exportFieldSet.has(field)) {
        stale.push(field);
      }
    }

    expect(stale).toEqual([]);
    // If this fails, remove the stale fields from ENGINE_INTERNAL_EXCLUSIONS —
    // they are now in the export params and no longer need exclusion.
  });

  it('exclusion list does not contain non-existent CalculationParams fields', () => {
    const calcParamFields = extractInterfaceFields(typesPath, 'CalculationParams');
    const calcFieldSet = new Set(calcParamFields);

    const phantom: string[] = [];
    for (const field of Object.keys(ENGINE_INTERNAL_EXCLUSIONS)) {
      if (!calcFieldSet.has(field)) {
        phantom.push(field);
      }
    }

    expect(phantom).toEqual([]);
    // If this fails, remove the phantom fields from ENGINE_INTERNAL_EXCLUSIONS —
    // they don't exist in CalculationParams (were they renamed or deleted?).
  });
});
