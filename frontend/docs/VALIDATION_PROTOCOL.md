# TaxBenefits Calculator — Validation Protocol

**Version:** 1.0
**Created:** 2026-01-14
**Last Updated:** 2026-01-14

---

## Purpose

This document defines the validation requirements for all Claude Code prompts and implementations.
Following this protocol prevents calculation bugs, display issues, and regression errors.

---

## Pre-Implementation Checklist

Before modifying any calculation or display logic:

- [ ] Read relevant source files (don't assume)
- [ ] Understand existing data flow
- [ ] Check types/interfaces for available data
- [ ] Review IMPLEMENTATION_TRACKER.md for related IMPLs
- [ ] Check [debugging-patterns.md](./debugging-patterns.md) for known issues

---

## Validation Requirements

All implementations must satisfy:

### 1. Layer Synchronization

Verify all layers are in sync:
- **Types** (types/taxbenefits/index.ts)
- **Engine** (utils/taxbenefits/calculations.ts)
- **UI Components** (components/taxbenefits/*)

### 2. Test Pass Rate

- 100% test pass rate required
- Run: `cd frontend && npx jest --config jest.config.ts --watchAll=false 2>&1 | tail -5`
- Current baseline: 1,844 tests (94 suites)
- Canonical runner: **Jest** (not vitest — vitest is not configured for this project)

### 3. Grep Audit for Consistency

Search for related terms across codebase:
```bash
grep -r "variableName" --include="*.ts" --include="*.tsx"
```

### 4. Independent Mathematical Verification

For calculation changes:
- Verify formula matches documentation
- Test boundary conditions
- Compare against known reference values

### 5. Complete File Inventory

Document all files modified in IMPL description.

---

## UI Display Validation (Added IMPL-057)

When Returns Buildup Strip or other displays show unexpected behavior:

### FIRST CHECK: Is the value exposed?

Before assuming calculation bugs, verify:
1. Value is calculated in engine (grep calculations.ts)
2. Value is in results interface (check types/taxbenefits/index.ts)
3. Value is returned in baseResults object
4. Component receives and displays the value

### Common Symptom: "Inverted" Percentages

If toggling a parameter causes % Total to move OPPOSITE of expected:
- The value may be in totalReturns (denominator)
- But NOT in the displayed component (numerator)
- Fix: Expose the value, don't change calculations

### Checklist for New Calculated Values

- [ ] Calculated in engine (calculations.ts)
- [ ] Added to InvestorAnalysisResults interface (types/taxbenefits/index.ts)
- [ ] Returned in baseResults object (calculations.ts ~line 1568)
- [ ] Included in relevant UI totals (component files)
- [ ] Responds to parameter changes in UI

---

## Post-Implementation Validation

After completing an implementation:

1. **Run full test suite** - All tests must pass
2. **Manual UI verification** - Toggle relevant parameters, confirm expected behavior
3. **Update IMPLEMENTATION_TRACKER.md** - Document the IMPL with date and description
4. **Check debugging-patterns.md** - If you discovered a new pattern, document it

---

## Related Documentation

- [IMPLEMENTATION_TRACKER.md](./IMPLEMENTATION_TRACKER.md) - Complete implementation history
- [debugging-patterns.md](./debugging-patterns.md) - Known debugging patterns and solutions

---

## Document Maintenance

Update this protocol when:
- New validation requirements are discovered
- Debugging patterns emerge that should be standard checks
- Layer synchronization issues cause bugs

**Location:** `frontend/docs/VALIDATION_PROTOCOL.md`

---

## IMPL Definition of Done — Standard Items

Item 11: CC must include `git status` + `git diff --stat` in completion report before commit.
Item 12: CC must update SPEC_IMPLEMENTATION_REGISTRY with IMPL entry.
Item 13: For any IMPL that touches UI components — CC must complete a full end-to-end user workflow in the running dev server and report actual screen values before committing. "Tests pass" and "component exists" are not sufficient. A feature that exists in the engine but is invisible to the user is not done.
