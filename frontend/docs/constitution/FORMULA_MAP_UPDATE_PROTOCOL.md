# Formula Map Update Protocol v1.0

## Purpose

Ensure the Formula Map (`/src/utils/taxbenefits/auditExport/formulaMap.ts`) remains synchronized with calculation logic changes. Drift between the Formula Map and actual calculations creates audit risk and undermines export traceability.

---

## Trigger

Any IMPL that **adds, modifies, or removes calculation logic** in:
- `calculations.ts`
- `lihtcCreditCalculations.ts`
- `stateLIHTCCalculations.ts`
- `depreciationSchedule.ts`
- `preferredEquityCalculations.ts`
- `territorialTaxCalculations.ts`
- Supporting utilities (`depreciableBasisUtility.ts`, `interestReserveCalculation.ts`, etc.)

---

## Required Updates to Formula Map

### 1. New Calculations

Add a new `FormulaEntry` with:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (e.g., `calc-newfeature-001`) |
| `name` | Human-readable name |
| `description` | What the formula calculates |
| `tsFile` | Source file path |
| `tsLine` | Line number where calculation occurs |
| `tsLogic` | The TypeScript expression |
| `excelFormula` | Equivalent Excel formula |
| `dependencies` | Input fields required |
| `output` | Output field name |
| `category` | Module grouping |
| `notes` | Special considerations (optional) |

### 2. Modified Calculations

Update existing entry with:
- New `tsLine` if line number changed
- Updated `tsLogic` with new formula
- Updated `excelFormula` to match
- Add note documenting the change reason
- Update `dependencies` if inputs changed

### 3. Removed Calculations

- Remove the `FormulaEntry` from the appropriate array
- If replaced, add note to replacement entry referencing old ID
- Update any entries that had this as a dependency

### 4. Export Cell References

When audit export sheets change:
- Document new sheet/cell locations
- Map to corresponding engine variables
- Update `auditExport.ts` comments if needed

---

## Definition of Done Checklist Addition

For any IMPL touching calculations, the PR checklist must include:

```markdown
- [ ] Formula Map updated (if calculations changed)
  - [ ] New formulas added with complete FormulaEntry
  - [ ] Modified formulas updated with new line numbers
  - [ ] Removed formulas deleted from map
  - [ ] Version history updated
```

---

## Audit Trail

The Formula Map header should include version history:

```typescript
/**
 * IMPL-XXX: Audit Export Package - Formula Map vX.X
 *
 * CHANGELOG vX.X.X:
 * - [describe changes]
 *
 * Version History:
 * | Version | Date       | IMPL     | Changes |
 * |---------|------------|----------|---------|
 * | 2.0.0   | 2025-12-29 | IMPL-037 | Complete rewrite with 6 modules |
 * | 2.0.1   | 2025-12-30 | IMPL-041 | Updated line numbers, added conformity logic |
 */
```

---

## Validation

Before closing any calculation-related IMPL:

1. Run grep to verify line numbers match:
   ```bash
   grep -n "grossDepreciationTaxBenefit" src/utils/taxbenefits/calculations.ts
   ```

2. Cross-check at least one formula entry against source

3. Verify `FORMULA_SUMMARY.totalFormulas` matches actual count

---

## Related Documents

- `/src/utils/taxbenefits/auditExport/formulaMap.ts` - The Formula Map itself
- `/src/utils/taxbenefits/auditExport/auditExport.ts` - Export generator using the map
- `/docs/reference/FORMULA_MAP.md` - User-facing formula documentation (if exists)

---

**Document Version:** v1.0
**Created:** December 29, 2025
**Related IMPL:** IMPL-040b
