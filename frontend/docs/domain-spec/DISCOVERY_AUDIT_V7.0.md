# Discovery Audit v7.0

**Version:** 1.0  
**Date:** 2025-12-14  
**Status:** Ready for CC Execution

---

## Purpose

Audit the existing codebase and documentation before implementing v7.0/7.1 enhancements. This is **discovery only** — no code changes.

**Reference:** `/docs/domain-spec/` (all files including MASTER_SPEC_V7.0.md, ADDENDUM_V7.0.md)

---

## Deliverables

### 1. Asset Inventory

Catalog all calculation modules:

| Category | Definition |
|----------|------------|
| PRESERVE | Working, unchanged in v7.0 |
| ENHANCE | Working, will be extended |
| REMOVE | Deprecated per v7.0 spec |
| NEW | Doesn't exist yet |

**Output format:**
```
| Module/File | Category | Notes |
|-------------|----------|-------|
| example.ts  | PRESERVE | ... |
```

### 2. Validated Logic Inventory

List all calculation logic that has been independently verified, including:
- Depreciation (20% Y1 from 11 studies)
- Newton-Raphson IRR
- MACRS schedules
- Waterfall/covenant mechanics
- State conformity structures
- Any others found in codebase

**Output format:**
```
| Logic | Location | Verification Source |
|-------|----------|---------------------|
| ...   | ...      | ...                 |
```

### 3. Input/Output Field Inventory

Complete list of current inputs and outputs with types. Flag which are affected by v7.0/7.1.

**Output format:**
```
| Field | Type | Direction | v7.0 Impact |
|-------|------|-----------|-------------|
| ...   | ...  | Input     | UNCHANGED / ENHANCED / REMOVED |
```

### 4. Best Practice Recommendations

Given the transition scope (OZBenefits → TaxBenefits), recommend approach for:
- Branch strategy
- Testing/regression
- Incremental vs. batch changes
- Naming migration

### 5. Documentation Audit

Compare existing `/docs/domain-spec/` files against new v7.0 docs:

| Status | Definition |
|--------|------------|
| Conflicts | Contradictory information |
| Superseded | Fully replaced by v7.0 |
| Complementary | Still valid, no overlap |
| Merge candidates | Partial overlap, consolidate |

**Files to audit:**
- CALCULATION_FLOW_ORDER.md
- COMPREHENSIVE_WATERFALL_GUIDE.md
- EXIT_CATCHUP_WATERFALL_DOCUMENTATION.md
- HDC_CALCULATION_LOGIC.md
- STATE_TAX_CONFORMITY_SPEC.md

**Output format:**
```
| File | Status | Notes |
|------|--------|-------|
| ...  | ...    | ...   |
```

---

## Constraints

- **NO CODE CHANGES** — audit only
- Report findings for human review
- Flag ambiguities or conflicts for clarification
- Do not begin implementation tasks

---

## Output

Single markdown file: `DISCOVERY_AUDIT_RESULTS.md`

Place in `/docs/domain-spec/`