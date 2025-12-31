# DealValidationStrip Integration Guide

## IMPL-025: Deal Validation Strip (Conductor's Dashboard)

**Created:** 2025-12-27
**Component:** `DealValidationStrip.tsx`
**Tests:** `__tests__/DealValidationStrip.test.tsx`

---

## Quick Start

### 1. Import the Component

```typescript
import DealValidationStrip from '@/components/taxbenefits/results/DealValidationStrip';
```

### 2. Wire Up in Results Section

Add to `HDCResultsComponent.tsx` (or equivalent results container):

```tsx
import DealValidationStrip from './results/DealValidationStrip';

// Inside the component, get values from useHDCCalculations hook:
const {
  mainAnalysisResults,
  hdcAnalysisResults,
  investorCashFlows
} = useHDCCalculations(/* props */);

// Render at the TOP of results section (before other sections):
return (
  <div className="results-container">
    <DealValidationStrip
      mainAnalysisResults={mainAnalysisResults}
      hdcAnalysisResults={hdcAnalysisResults}
      cashFlows={investorCashFlows}
      // Conditional display props (from state):
      subDebtPct={hdcSubDebtPct}
      investorSubDebtPct={investorSubDebtPct}
      outsideInvestorSubDebtPct={outsideInvestorSubDebtPct}
      prefEquityPct={prefEquityPct}
      philDebtPct={philDebtPct}
    />

    {/* Rest of results sections... */}
    <InvestorCashFlowSection ... />
    <DSCRAnalysisSection ... />
    {/* etc. */}
  </div>
);
```

---

## Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `mainAnalysisResults` | `InvestorAnalysisResults` | Yes | From `useHDCCalculations` |
| `hdcAnalysisResults` | `HDCAnalysisResults` | Yes | From `useHDCCalculations` |
| `cashFlows` | `CashFlowItem[]` | Yes | From `useHDCCalculations.investorCashFlows` |
| `subDebtPct` | `number` | No | HDC sub-debt % for conditional display |
| `investorSubDebtPct` | `number` | No | Investor sub-debt % |
| `outsideInvestorSubDebtPct` | `number` | No | Outside investor sub-debt % |
| `prefEquityPct` | `number` | No | Preferred equity % |
| `philDebtPct` | `number` | No | Philanthropic debt % |

---

## Conditional Display Logic

The component automatically shows/hides sections based on deal structure:

### Sub-Debt Section
Shows when ANY of these are true:
- `subDebtPct > 0`
- `investorSubDebtPct > 0`
- `outsideInvestorSubDebtPct > 0`
- Any sub-debt balance at exit > 0

### Preferred Equity Section
Shows when BOTH are true:
- `prefEquityPct > 0`
- `mainAnalysisResults.preferredEquityResult` exists

---

## Styling

The component uses existing CSS variables:

| Variable | Usage |
|----------|-------|
| `--hdc-faded-jade` | Primary teal, headers |
| `--hdc-sushi` | Pass/success status |
| `--hdc-brown-rust` | Warning status |
| `--hdc-strikemaster` | Fail/error status |
| `--hdc-cabbage-pont` | Secondary text |
| `--hdc-spectra` | Primary text |
| `--hdc-gulf-stream` | Section dividers |
| `--hdc-mercury` | Borders |

---

## Sticky Behavior

The component includes:
- `position: sticky`
- `top: 0`
- `z-index: 40`
- White background with shadow

If you have a fixed header, adjust `top` value:

```tsx
<DealValidationStrip
  style={{ top: '60px' }} // Adjust for header height
  {...props}
/>
```

---

## Collapse State Persistence

The component persists its open/closed state to `localStorage`:
- Key: `dealValidationStrip.isOpen`
- Default: `true` (expanded)

Users' preference is remembered across sessions.

---

## Testing

Run the tests:

```bash
npm test -- DealValidationStrip
```

Test coverage includes:
- Collapsed/expanded state rendering
- DSCR threshold status indicators (pass/warn/fail)
- Conditional section display (sub-debt, pref equity)
- localStorage persistence
- Formatter application
- Edge cases (empty data, null values)

---

## Troubleshooting

### Component not sticky?
- Ensure parent container has `overflow: visible` or `overflow-y: auto`
- Check no ancestor has `transform` or `will-change` (breaks sticky)

### Collapse not animating?
- Radix Collapsible handles animation automatically
- Check that `@radix-ui/react-collapsible` is installed

### Data not displaying?
- Verify `mainAnalysisResults` and `hdcAnalysisResults` are populated
- Check console for any calculation errors
- Ensure cash flows array has valid DSCR values

---

## Files Created

```
src/components/taxbenefits/results/
├── DealValidationStrip.tsx           # Main component
├── __tests__/
│   └── DealValidationStrip.test.tsx  # Test suite
└── DEAL_VALIDATION_STRIP_INTEGRATION.md  # This file
```
