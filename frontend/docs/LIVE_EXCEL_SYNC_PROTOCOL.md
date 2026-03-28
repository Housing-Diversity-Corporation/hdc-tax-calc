LIVE EXCEL SYNC PROTOCOL v1.0
Date: 2026-03-28
Reference: IMPL-143

## Purpose

Ensure the Live Excel export always reflects what
the engine actually computed. This protocol must be
followed whenever:
- A new input field is added to the platform
- An existing field data source changes
- A new sheet is added to the export
- Any calculation logic changes that affects inputs

## The Four Sync Rules

### Rule 1: Every new CalculationParams field must be in the export params object

When you add a field to CalculationParams, you MUST:
□ Add to HDCResultsComponent.tsx props interface
□ Thread from HDCCalculatorMain.tsx
□ Add to export params object
□ Add to relevant sheet builder

Verification command:
```bash
grep -n "YOUR_NEW_FIELD" \
  frontend/src/types/taxbenefits/index.ts \
  frontend/src/components/taxbenefits/HDCResultsComponent.tsx \
  frontend/src/components/taxbenefits/HDCCalculatorMain.tsx \
  frontend/src/utils/taxbenefits/auditExport/index.ts \
  frontend/src/utils/taxbenefits/auditExport/sheets/inputsSheet.ts
```

All 5 files must have matches.

AUTOMATED: exportParamsSync.test.ts enforces this
automatically. If the test fails, a field is missing.

### Rule 2: Never use || for numeric fallbacks

|| treats 0 as falsy. Use ?? instead.
❌ params.noiGrowthRate || 3
✅ params.noiGrowthRate ?? 3

Applies everywhere in auditExport/.

### Rule 3: Never hardcode input values in sheet builders

❌ { label: 'Lease-Up Months', value: 18 }
✅ { label: 'Lease-Up Months', value: params.interestReserveMonths ?? 18 }

### Rule 4: Timeline-derived fields must read from rawTimeline, not params

The normalization block in index.ts unconditionally
overwrites:
  placedInServiceMonth → 1
  constructionDelayMonths → 0

Sheet builders MUST use rawTimeline as primary source
for these fields.

❌ params.placedInServiceMonth
✅ rawTimeline?.pisCalendarMonth ?? params.placedInServiceMonth ?? 7

❌ params.constructionDelayMonths
✅ rawTimeline
    ? monthsBetween(rawTimeline.investmentDate, rawTimeline.pisDate)
    : params.constructionDelayMonths ?? 0

## Sync Verification Checklist

Run after any export update:
□ exportParamsSync.test passes (Rule 1 automated)
□ No || for numeric fields in auditExport/
□ No hardcoded input values in sheet builders
□ Timeline fields reading from rawTimeline
□ Export verified against UI for all active deals

## Issue Classification

Type A — Prop drilling gap
  Fix: HDCResultsComponent.tsx + HDCCalculatorMain.tsx

Type B — Normalization overwrite
  Fix: Read from rawTimeline or rawParams

Type C — Hardcoded constant
  Fix: Replace literal with params field reference

Type D — Wrong coercion (|| vs ??)
  Fix: Change || to ??

Type E — Wrong data source
  Fix: Use rawTimeline as primary source

## Session Reference

IMPL-143 (2026-03-28) encountered all five failure
types. This protocol prevents recurrence.
