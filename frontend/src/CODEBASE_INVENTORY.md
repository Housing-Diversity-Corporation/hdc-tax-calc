# HDC Tax Calculator - Codebase Inventory

**Generated:** January 7, 2026
**Purpose:** Pre-debug codebase review for IMPL-048 IRR audit
**Version:** v2.49 (post-cleanup)

---

## Summary Statistics

| Category | Files | Lines |
|----------|-------|-------|
| Total TypeScript/TSX | 248 | ~73,200 |
| Test Files | 63 | 24,319 |
| Production Files | 185 | ~48,900 |

### By Directory

| Directory | Files | Lines | Purpose |
|-----------|-------|-------|---------|
| `components/` | ~133 | ~34,200 | UI Components |
| `utils/` | ~90 | ~34,100 | Calculation & Utility Logic |
| `hooks/` | 10 | ~2,900 | React Hooks (state/calc) |
| `services/` | 4 | ~450 | API Services |
| `types/` | 3 | ~660 | TypeScript Definitions |

---

## 1. CORE CALCULATION ENGINE

**Critical for IMPL-048 debugging. These files contain the IRR and financial calculations.**

### Primary Calculation Files

| File | Lines | Purpose | IRR-Related? |
|------|-------|---------|--------------|
| [calculations.ts](utils/taxbenefits/calculations.ts) | 1,627 | **MASTER FILE** - IRR, waterfall, cash flows, exit proceeds | ⚠️ PRIMARY |
| [preferredEquityCalculations.ts](utils/taxbenefits/preferredEquityCalculations.ts) | 453 | Preferred equity waterfall, promote, pref return | ⚠️ YES |
| [lihtcCreditCalculations.ts](utils/taxbenefits/lihtcCreditCalculations.ts) | 408 | Federal LIHTC credit schedule (10-year) | YES |
| [stateLIHTCCalculations.ts](utils/taxbenefits/stateLIHTCCalculations.ts) | 654 | State LIHTC credit calculations | YES |
| [depreciationSchedule.ts](utils/taxbenefits/depreciationSchedule.ts) | 265 | MACRS depreciation schedules | YES |
| [depreciableBasisUtility.ts](utils/taxbenefits/depreciableBasisUtility.ts) | 243 | Depreciable basis calculations | YES |

### Supporting Calculation Files

| File | Lines | Purpose |
|------|-------|---------|
| [hdcAnalysis.ts](utils/taxbenefits/hdcAnalysis.ts) | 468 | HDC platform analysis |
| [hdcOzStrategy.ts](utils/taxbenefits/hdcOzStrategy.ts) | 253 | OZ tax strategy calculations |
| [taxCapacity.ts](utils/taxbenefits/taxCapacity.ts) | 261 | Tax capacity analysis |
| [interestReserveCalculation.ts](utils/taxbenefits/interestReserveCalculation.ts) | 146 | Interest reserve calculations |
| [sCurveUtility.ts](utils/taxbenefits/sCurveUtility.ts) | 122 | S-curve interest schedule |
| [territorialTaxCalculations.ts](utils/taxbenefits/territorialTaxCalculations.ts) | 333 | Territorial tax calculations |
| [iraConversion.ts](utils/taxbenefits/iraConversion.ts) | 272 | IRA conversion planning |
| [sensitivityAnalysis.ts](utils/taxbenefits/sensitivityAnalysis.ts) | 229 | Sensitivity analysis |

### Data & Constants

| File | Lines | Purpose |
|------|-------|---------|
| [propertyPresets.ts](utils/taxbenefits/propertyPresets.ts) | 724 | Property preset definitions |
| [stateProfiles.ts](utils/taxbenefits/stateProfiles.ts) | 451 | State tax profiles |
| [stateData.ts](utils/taxbenefits/stateData.ts) | 189 | State-level data |
| [constants.ts](utils/taxbenefits/constants.ts) | 104 | Global constants |

### Validation & Guards

| File | Lines | Purpose |
|------|-------|---------|
| [calculationGuards.ts](utils/taxbenefits/calculationGuards.ts) | 209 | Type guards for calculations |
| [validation.ts](utils/taxbenefits/validation.ts) | 185 | Input validation |
| [taxDataValidation.ts](utils/taxbenefits/taxDataValidation.ts) | 376 | Tax data validation |
| [warningTypes.ts](utils/taxbenefits/warningTypes.ts) | 287 | Warning system types |

### Formatters & Export

| File | Lines | Purpose |
|------|-------|---------|
| [formatters.ts](utils/taxbenefits/formatters.ts) | 165 | Number/currency formatting |
| [exportUtils.ts](utils/taxbenefits/exportUtils.ts) | 200 | Export utilities |
| [auditExport/auditExport.ts](utils/taxbenefits/auditExport/auditExport.ts) | ~200 | Audit export functionality |
| [auditExport/formulaMap.ts](utils/taxbenefits/auditExport/formulaMap.ts) | ~100 | Formula mappings |
| [auditTrace.ts](utils/taxbenefits/auditTrace.ts) | 195 | Audit trail tracking |
| [explanations.ts](utils/taxbenefits/explanations.ts) | 176 | Calculation explanations |

**Subtotal Core Utils: 29 files, ~9,330 lines**

---

## 2. STATE MANAGEMENT (Hooks)

| File | Lines | Purpose | IRR-Related? |
|------|-------|---------|--------------|
| [useHDCCalculations.ts](hooks/taxbenefits/useHDCCalculations.ts) | 822 | **Main calculation hook** - orchestrates all calcs | ⚠️ PRIMARY |
| [useHDCState.ts](hooks/taxbenefits/useHDCState.ts) | 384 | State management for calculator inputs | YES |

### Other Hooks

| File | Lines | Purpose |
|------|-------|---------|
| [useUserProfile.ts](hooks/useUserProfile.ts) | ~200 | User profile management |
| [useResponsive.ts](hooks/useResponsive.ts) | ~50 | Responsive utilities |
| [useResponsiveText.ts](hooks/useResponsiveText.ts) | ~50 | Responsive text |
| [use-auto-scroll.ts](hooks/use-auto-scroll.ts) | ~30 | Auto-scroll hook |
| [use-autosize-textarea.ts](hooks/use-autosize-textarea.ts) | ~30 | Textarea autosize |

**Subtotal Hooks: 10 files, ~2,900 lines**

---

## 3. MAIN CALCULATOR COMPONENTS

**Top-level orchestration components.**

| File | Lines | Purpose |
|------|-------|---------|
| [HDCCalculatorMain.tsx](components/taxbenefits/HDCCalculatorMain.tsx) | 656 | **Master orchestrator** - connects state/calc/UI |
| [HDCInputsComponent.tsx](components/taxbenefits/HDCInputsComponent.tsx) | 891 | Input panel container |
| [HDCResultsComponent.tsx](components/taxbenefits/HDCResultsComponent.tsx) | 626 | Results panel container |

**Subtotal Main Components: 3 files, 2,173 lines**

---

## 4. UI - INPUT COMPONENTS

**All input sections for the calculator.**

| File | Lines | Purpose |
|------|-------|---------|
| [CapitalStructureSection.tsx](components/taxbenefits/inputs/CapitalStructureSection.tsx) | 795 | Capital structure inputs |
| [InvestorTaxAndOZSection.tsx](components/taxbenefits/inputs/InvestorTaxAndOZSection.tsx) | 720 | Investor tax & OZ inputs |
| [TaxCreditsSection.tsx](components/taxbenefits/inputs/TaxCreditsSection.tsx) | 703 | Tax credits configuration |
| [BasicInputsSection.tsx](components/taxbenefits/inputs/BasicInputsSection.tsx) | 478 | Basic project inputs |
| [InvestorProfileSection.tsx](components/taxbenefits/inputs/InvestorProfileSection.tsx) | 478 | Investor profile inputs |
| [StateLIHTCSection.tsx](components/taxbenefits/inputs/StateLIHTCSection.tsx) | 411 | State LIHTC inputs |
| [PremiumStateSelector.tsx](components/taxbenefits/inputs/PremiumStateSelector.tsx) | 388 | State selector (premium) |
| [LIHTCStructureSection.tsx](components/taxbenefits/inputs/LIHTCStructureSection.tsx) | 358 | LIHTC structure inputs |
| [TaxPlanningInputsSection.tsx](components/taxbenefits/inputs/TaxPlanningInputsSection.tsx) | 297 | Tax planning inputs |
| [HDCFeesSection.tsx](components/taxbenefits/inputs/HDCFeesSection.tsx) | 267 | HDC fees configuration |
| [InvestmentPortalSection.tsx](components/taxbenefits/inputs/InvestmentPortalSection.tsx) | 266 | Investment portal inputs |
| [OpportunityZoneSection.tsx](components/taxbenefits/inputs/OpportunityZoneSection.tsx) | 238 | OZ qualification inputs |
| [StrategicOzSelector.tsx](components/taxbenefits/inputs/StrategicOzSelector.tsx) | 231 | Strategic OZ selector |
| [PresetSelector.tsx](components/taxbenefits/inputs/PresetSelector.tsx) | 216 | Property preset selector |
| [SaveConfiguration.tsx](components/taxbenefits/inputs/SaveConfiguration.tsx) | 211 | Save/load configurations |
| [ProjectionsSection.tsx](components/taxbenefits/inputs/ProjectionsSection.tsx) | 210 | Projections inputs |
| [ConsolidatedTaxSection.tsx](components/taxbenefits/inputs/ConsolidatedTaxSection.tsx) | 196 | Consolidated tax inputs |
| [EnhancedStateSelector.tsx](components/taxbenefits/inputs/EnhancedStateSelector.tsx) | 196 | Enhanced state selector |
| [ProjectDefinitionSection.tsx](components/taxbenefits/inputs/ProjectDefinitionSection.tsx) | 176 | Project definition inputs |
| [TaxRatesSection.tsx](components/taxbenefits/inputs/TaxRatesSection.tsx) | 110 | Tax rates inputs |
| [TaxTimingSection.tsx](components/taxbenefits/inputs/TaxTimingSection.tsx) | 85 | Tax timing inputs |
| [PropertyStateDropdown.tsx](components/taxbenefits/inputs/PropertyStateDropdown.tsx) | 62 | Property state dropdown |

### Shared Input Components

| File | Lines | Purpose |
|------|-------|---------|
| [shared/HDCInput.tsx](components/taxbenefits/inputs/shared/HDCInput.tsx) | ~100 | Custom input component |
| [shared/HDCSelect.tsx](components/taxbenefits/inputs/shared/HDCSelect.tsx) | ~100 | Custom select component |
| [shared/HDCCheckbox.tsx](components/taxbenefits/inputs/shared/HDCCheckbox.tsx) | ~50 | Custom checkbox component |

**Subtotal Input Components: ~25 files, ~7,300 lines**

---

## 5. UI - RESULT COMPONENTS

**All result/output sections for the calculator.**

### Cash Flow & Charts

| File | Lines | Purpose |
|------|-------|---------|
| [DistributableCashFlowChart.tsx](components/taxbenefits/results/DistributableCashFlowChart.tsx) | 738 | DCF chart visualization |
| [ReturnsBuiltupStrip.tsx](components/taxbenefits/results/ReturnsBuiltupStrip.tsx) | 688 | **Returns buildup display** - shows IRR components |
| [DealValidationStrip.tsx](components/taxbenefits/results/DealValidationStrip.tsx) | 630 | Deal validation display |
| [KPIStrip.tsx](components/taxbenefits/results/KPIStrip.tsx) | 507 | KPI strip display (NEW) |
| [HDCCashFlowSection.tsx](components/taxbenefits/results/HDCCashFlowSection.tsx) | 418 | HDC cash flow section |
| [HDCPlatformSection.tsx](components/taxbenefits/results/HDCPlatformSection.tsx) | 409 | HDC platform metrics |
| [DistributableCashFlowTable.tsx](components/taxbenefits/results/DistributableCashFlowTable.tsx) | 361 | DCF table display |
| [HDCCashFlowChart.tsx](components/taxbenefits/results/HDCCashFlowChart.tsx) | 356 | HDC cash flow chart |
| [TaxPlanningCapacitySection.tsx](components/taxbenefits/results/TaxPlanningCapacitySection.tsx) | 307 | Tax planning capacity |
| [InvestorCashFlowSection.tsx](components/taxbenefits/results/InvestorCashFlowSection.tsx) | 290 | Investor cash flow section |
| [CashFlowTablesSection.tsx](components/taxbenefits/results/CashFlowTablesSection.tsx) | 230 | Cash flow tables |
| [InvestorCashFlowChart.tsx](components/taxbenefits/results/InvestorCashFlowChart.tsx) | 229 | Investor cash flow chart |
| [WarningsPanel.tsx](components/taxbenefits/results/WarningsPanel.tsx) | 224 | Warnings display |
| [FreeInvestmentAnalysisSection.tsx](components/taxbenefits/results/FreeInvestmentAnalysisSection.tsx) | 216 | Free investment analysis |
| [InvestmentSummarySection.tsx](components/taxbenefits/results/InvestmentSummarySection.tsx) | 184 | Investment summary |
| [StateLIHTCIntegrationSection.tsx](components/taxbenefits/results/StateLIHTCIntegrationSection.tsx) | 180 | State LIHTC integration |
| [InvestorAnalysisSection.tsx](components/taxbenefits/results/InvestorAnalysisSection.tsx) | 165 | Investor analysis |
| [OutsideInvestorSection.tsx](components/taxbenefits/results/OutsideInvestorSection.tsx) | 156 | Outside investor section |
| [DSCRAnalysisSection.tsx](components/taxbenefits/results/DSCRAnalysisSection.tsx) | 152 | DSCR analysis |
| [CapitalStructureSection.tsx](components/taxbenefits/results/CapitalStructureSection.tsx) | 144 | Capital structure display |
| [HDCAnalysisSection.tsx](components/taxbenefits/results/HDCAnalysisSection.tsx) | 134 | HDC analysis section |
| [ExpandableDetailsSection.tsx](components/taxbenefits/results/ExpandableDetailsSection.tsx) | 122 | Expandable details |
| [ExportAuditButton.tsx](components/taxbenefits/results/ExportAuditButton.tsx) | 81 | Export audit button |
| [LIHTCCreditSchedule.tsx](components/taxbenefits/results/LIHTCCreditSchedule.tsx) | 72 | LIHTC schedule display |
| [CollapsibleSection.tsx](components/taxbenefits/results/CollapsibleSection.tsx) | 54 | Collapsible wrapper |
| [PreferredEquitySection.tsx](components/taxbenefits/results/PreferredEquitySection.tsx) | 49 | Preferred equity section |
| [WarningBanner.tsx](components/taxbenefits/results/WarningBanner.tsx) | 48 | Warning banner |

**Subtotal Result Components: ~27 files, ~7,144 lines**

---

## 6. REPORTS

| File | Lines | Purpose |
|------|-------|---------|
| [HDCComprehensiveReport.tsx](components/taxbenefits/reports/HDCComprehensiveReport.tsx) | ~400 | Comprehensive PDF report |
| [HDCProfessionalReport.tsx](components/taxbenefits/reports/HDCProfessionalReport.tsx) | ~500 | Professional PDF report |
| [HDCTaxReportJsPDF.tsx](components/taxbenefits/reports/HDCTaxReportJsPDF.tsx) | ~600 | jsPDF report generator |

**Subtotal Reports: 3 files, ~1,500 lines**

---

## 7. SHADCN UI COMPONENTS

Base UI components (from shadcn/ui library).

| File | Lines | Purpose |
|------|-------|---------|
| `ui/form.tsx` | ~200 | Form components |
| `ui/navigation-menu.tsx` | ~150 | Navigation menu |
| `ui/carousel.tsx` | ~150 | Carousel |
| `ui/command.tsx` | ~150 | Command palette |
| `ui/dialog.tsx` | ~100 | Dialog/modal |
| `ui/dropdown-menu.tsx` | ~100 | Dropdown menu |
| `ui/alert-dialog.tsx` | ~100 | Alert dialog |
| `ui/select.tsx` | ~100 | Select component |
| `ui/accordion.tsx` | ~80 | Accordion |
| `ui/card.tsx` | ~80 | Card |
| `ui/button.tsx` | ~60 | Button |
| `ui/input.tsx` | ~30 | Input |
| `ui/label.tsx` | ~30 | Label |
| `ui/checkbox.tsx` | ~30 | Checkbox |
| `ui/badge.tsx` | ~30 | Badge |
| (+ ~30 more UI components) | | |

**Subtotal UI Components: ~45 files, ~3,929 lines**

---

## 8. TEST FILES

### Core Calculation Tests

| File | Lines | Focus |
|------|-------|-------|
| [calculations.test.ts](utils/taxbenefits/__tests__/calculations.test.ts) | 662 | Main calculation tests |
| [critical-business-rules.test.ts](utils/taxbenefits/__tests__/critical-business-rules.test.ts) | 529 | Business rule validation |
| [waterfall-comprehensive.test.ts](utils/taxbenefits/__tests__/waterfall-comprehensive.test.ts) | 522 | Waterfall tests |
| [mathematical-formulas.test.ts](utils/taxbenefits/__tests__/mathematical-formulas.test.ts) | 510 | Math formula tests |
| [preferredEquityCalculations.test.ts](utils/taxbenefits/__tests__/preferredEquityCalculations.test.ts) | 768 | Preferred equity tests |
| [lihtcCreditCalculations.test.ts](utils/taxbenefits/__tests__/lihtcCreditCalculations.test.ts) | 712 | LIHTC tests |
| [stateLIHTCCalculations.test.ts](utils/taxbenefits/__tests__/stateLIHTCCalculations.test.ts) | 977 | State LIHTC tests |
| [depreciableBasisUtility.test.ts](utils/taxbenefits/__tests__/depreciableBasisUtility.test.ts) | 882 | Depreciation tests |
| [stateProfiles.test.ts](utils/taxbenefits/__tests__/stateProfiles.test.ts) | 648 | State profile tests |
| [warningTypes.test.ts](utils/taxbenefits/__tests__/warningTypes.test.ts) | 592 | Warning system tests |

### Feature Tests

| File | Lines | Focus |
|------|-------|-------|
| [features/aum-fees-comprehensive.test.ts](utils/taxbenefits/__tests__/features/aum-fees-comprehensive.test.ts) | ~300 | AUM fees |
| [features/oz-calculations-validation.test.ts](utils/taxbenefits/__tests__/features/oz-calculations-validation.test.ts) | ~400 | OZ calculations |
| [features/outside-investor-diagnostic.test.ts](utils/taxbenefits/__tests__/features/outside-investor-diagnostic.test.ts) | ~300 | Outside investor |
| [features/pik-interest-comprehensive.test.ts](utils/taxbenefits/__tests__/features/pik-interest-comprehensive.test.ts) | ~400 | PIK interest |
| [features/philanthropic-debt-dscr.test.ts](utils/taxbenefits/__tests__/features/philanthropic-debt-dscr.test.ts) | ~300 | Phil debt DSCR |

### Integration Tests

| File | Lines | Focus |
|------|-------|-------|
| [full-integration.test.ts](utils/taxbenefits/__tests__/full-integration.test.ts) | 270 | Full integration |
| [integration/waterfall-comprehensive.test.ts](utils/taxbenefits/__tests__/integration/waterfall-comprehensive.test.ts) | ~400 | Waterfall integration |
| [integration/outside-investor-dscr-waterfall.test.ts](utils/taxbenefits/__tests__/integration/outside-investor-dscr-waterfall.test.ts) | ~300 | OI DSCR waterfall |

**Subtotal Test Files: 63 files, ~24,319 lines**

---

## 9. TYPE DEFINITIONS

| File | Lines | Purpose |
|------|-------|---------|
| [types/taxbenefits/index.ts](types/taxbenefits/index.ts) | 644 | **Master types file** - all calculator interfaces |
| [types/investorTaxInfo.ts](types/investorTaxInfo.ts) | ~100 | Investor tax types |
| [types/propertyPreset.ts](types/propertyPreset.ts) | ~100 | Property preset types |
| [utils/taxbenefits/stateProfiles.types.ts](utils/taxbenefits/stateProfiles.types.ts) | 236 | State profile types |

**Subtotal Types: 4 files, ~1,080 lines**

---

## 10. SERVICES

| File | Lines | Purpose |
|------|-------|---------|
| [services/api.ts](services/api.ts) | ~150 | API client |
| [services/userService.ts](services/userService.ts) | ~100 | User service |
| [services/googleAuth.ts](services/googleAuth.ts) | ~100 | Google auth |
| [services/taxbenefits/calculatorService.ts](services/taxbenefits/calculatorService.ts) | ~100 | Calculator service |

**Subtotal Services: 4 files, ~450 lines**

---

## 11. OTHER COMPONENTS (Non-Calculator)

### Account & Auth

| File | Lines | Purpose |
|------|-------|---------|
| [account/AccountPage.tsx](components/account/AccountPage.tsx) | ~300 | Account page |
| [account/Settings.tsx](components/account/Settings.tsx) | ~200 | Settings |
| [login/SignIn.tsx](components/login/SignIn.tsx) | ~200 | Sign in |
| [login/SignUp.tsx](components/login/SignUp.tsx) | ~200 | Sign up |

### Investor Portal

| File | Lines | Purpose |
|------|-------|---------|
| [investor-portal/InvestorAnalysis/InvestorAnalysis.tsx](components/investor-portal/InvestorAnalysis/InvestorAnalysis.tsx) | ~400 | Investor analysis page |
| [investor-portal/InvestorAnalysis/InvestorAnalysisHighlevelMetrics.tsx](components/investor-portal/InvestorAnalysis/InvestorAnalysisHighlevelMetrics.tsx) | ~200 | High-level metrics |
| [investor-portal/InvestorTaxProfile/InvestorTaxProfilePage.tsx](components/investor-portal/InvestorTaxProfile/InvestorTaxProfilePage.tsx) | ~300 | Tax profile page |

### Navbar & Common

| File | Lines | Purpose |
|------|-------|---------|
| [navbar/NavbarShadcn.tsx](components/navbar/NavbarShadcn.tsx) | ~300 | Main navbar |
| [GradientBackground.tsx](components/GradientBackground.tsx) | ~50 | Background |
| [Tooltip.tsx](components/Tooltip.tsx) | ~50 | Tooltip |
| [Toggle.tsx](components/Toggle.tsx) | ~50 | Toggle |
| [ThemeToggle.tsx](components/ThemeToggle.tsx) | ~50 | Theme toggle |

---

## 12. SUSPICIOUS/DEAD CODE FLAGS

### Potentially Orphaned Files

Based on knip analysis from IMPL-026D, these may have limited usage:

| File | Status | Notes |
|------|--------|-------|
| `utils/taxbenefits/__tests__/analysis/*.ts` | ⚠️ REVIEW | Analysis scripts - may be dev-only |
| `utils/taxbenefits/__tests__/finance-validation-agent.ts` | ⚠️ REVIEW | 1,185 lines - validation agent |
| `utils/taxbenefits/__tests__/test-helpers.ts` | OK | Used by tests |

### High Unused Export Count (from knip)

Files with many unused exports that may need cleanup:

| File | Unused Exports |
|------|----------------|
| `calculations.ts` | ~15 |
| `types/taxbenefits/index.ts` | ~20 |
| `stateProfiles.ts` | ~5 |

### Duplicate Functionality Candidates

| Files | Issue |
|-------|-------|
| `PremiumStateSelector.tsx` vs `EnhancedStateSelector.tsx` | Similar purpose - review |
| `StrategicOzSelector.tsx` vs `OpportunityZoneSection.tsx` | OZ selection overlap |

---

## 13. KEY FILES FOR IMPL-048 IRR DEBUGGING

**Priority reading order for IRR audit:**

1. **[calculations.ts](utils/taxbenefits/calculations.ts)** (1,627 lines) - `calculateIRR()`, `calculateWaterfall()`, `calculateExitProceeds()`
2. **[useHDCCalculations.ts](hooks/taxbenefits/useHDCCalculations.ts)** (822 lines) - Calculation orchestration
3. **[preferredEquityCalculations.ts](utils/taxbenefits/preferredEquityCalculations.ts)** (453 lines) - Waterfall priority
4. **[types/taxbenefits/index.ts](types/taxbenefits/index.ts)** (644 lines) - Type definitions
5. **[ReturnsBuiltupStrip.tsx](components/taxbenefits/results/ReturnsBuiltupStrip.tsx)** (688 lines) - IRR display component

### Critical Functions in calculations.ts

| Function | Line Range | Purpose |
|----------|------------|---------|
| `calculateIRR()` | ~350-450 | Newton-Raphson IRR solver |
| `calculateWaterfall()` | ~600-800 | Waterfall distribution |
| `calculateExitProceeds()` | ~900-1000 | Exit proceeds calculation |
| `calculatePlatformIRR()` | ~1000-1100 | Platform IRR |
| `calculateInvestorIRR()` | ~1100-1200 | Investor IRR |
| `generateCashFlows()` | ~200-350 | Cash flow generation |

---

## 14. FILE TREE SUMMARY

```
frontend/src/
├── components/
│   ├── taxbenefits/           # Main calculator
│   │   ├── HDCCalculatorMain.tsx
│   │   ├── HDCInputsComponent.tsx
│   │   ├── HDCResultsComponent.tsx
│   │   ├── inputs/            # 22 input section files
│   │   ├── results/           # 27 result section files
│   │   └── reports/           # 3 PDF report files
│   ├── investor-portal/       # Investor views
│   ├── account/               # Account management
│   ├── login/                 # Auth components
│   ├── navbar/                # Navigation
│   └── ui/                    # shadcn components (~45 files)
├── hooks/
│   ├── taxbenefits/
│   │   ├── useHDCCalculations.ts  # Main calc hook
│   │   └── useHDCState.ts         # State management
│   └── (utility hooks)
├── utils/
│   ├── taxbenefits/
│   │   ├── calculations.ts        # CORE ENGINE
│   │   ├── (27 other utils)
│   │   ├── auditExport/           # Audit export
│   │   └── __tests__/             # ~50 test files
│   └── propertyPresetTransform.ts
├── services/                  # API services
└── types/                     # Type definitions
```

---

## 15. NEXT STEPS FOR DEBUGGING

1. **Read the audit documents:**
   - `IMPL-048_IRR_AUDIT.md`
   - `IMPL-048b_RETURNS_BUILDUP_AUDIT.md`
   - `IMPL-048c_EXIT_PROCEEDS_AUDIT.md`

2. **Start with calculations.ts:**
   - Focus on `calculateIRR()` and `calculateInvestorIRR()`
   - Trace cash flow inputs
   - Verify Newton-Raphson convergence

3. **Cross-reference with tests:**
   - `calculations.test.ts` - existing coverage
   - `mathematical-formulas.test.ts` - formula verification
   - `critical-business-rules.test.ts` - business rules

4. **Use audit export:**
   - `ExportAuditButton.tsx` triggers audit export
   - `auditExport.ts` generates detailed breakdown

---

*End of Inventory*
