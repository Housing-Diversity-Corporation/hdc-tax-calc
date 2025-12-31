# Codebase Synchronization Map

**Version**: 1.0
**Created**: January 2025
**Purpose**: Document all parallel implementations requiring synchronization when adding new features

---

## Table of Contents

1. [Parallel Implementations Requiring Synchronization](#1-parallel-implementations-requiring-synchronization)
2. [File Classification System](#2-file-classification-system)
3. [Feature Sync Checklist Template](#3-feature-sync-checklist-template)
4. [Cleanup Recommendations](#4-cleanup-recommendations)
5. [Quick Reference Tables](#5-quick-reference-tables)

---

## 1. Parallel Implementations Requiring Synchronization

### Overview

This codebase contains **two parallel calculator implementations** that share a common calculation engine but maintain separate UI components, state management, and hooks:

- **HDC Calculator** (Primary implementation)
- **OZ Benefits Calculator** (Secondary implementation with OZ-specific features)

### Shared Components (Single Source of Truth)

These files are shared by both calculators and require **NO duplication**:

| File | Purpose | Used By |
|------|---------|---------|
| `src/utils/HDCCalculator/calculations.ts` | Core calculation engine | Both calculators |
| `src/utils/HDCCalculator/interestReserveCalculation.ts` | Interest reserve utility | Both calculators |
| `src/utils/HDCCalculator/monthlyPaymentCalculation.ts` | Payment calculations | Both calculators |
| `src/utils/HDCCalculator/exitProceedsCalculation.ts` | Exit proceeds utility | Both calculators |

**Rule**: When modifying shared calculation files, test BOTH calculators.

---

### HDC Calculator ↔ OZ Benefits File Pairs

When adding a new feature parameter (like `seniorDebtIOYears` in Step 5B), **synchronize these file pairs**:

#### Type Definitions (2 files)

| HDC Calculator | OZ Benefits | Purpose |
|----------------|-------------|---------|
| `src/types/HDCCalculator/index.ts` | `src/types/oz-benefits/index.ts` | TypeScript interfaces |

**Sync Points**:
- `CalculationParams` interface (must have identical fields)
- `InvestorAnalysisResults` interface (if adding result fields)
- Props interfaces (if adding UI parameters)

---

#### State Management Hooks (4 files)

| HDC Calculator | OZ Benefits | Purpose |
|----------------|-------------|---------|
| `src/hooks/HDCCalculator/useHDCState.ts` | `src/hooks/oz-benefits/useHDCState.ts` | React state management |
| `src/hooks/HDCCalculator/useHDCCalculations.ts` | `src/hooks/oz-benefits/useHDCCalculations.ts` | Calculation hook |

**Sync Points** (per hook file):
- `useState()` declarations
- Return statement entries
- Props interface definitions
- Dependency arrays in `useMemo`/`useEffect`
- Parameter passing to calculation engine

**Example Pattern** (from Step 5B):
```typescript
// useHDCState.ts (both HDC + OZ)
const [seniorDebtIOYears, setSeniorDebtIOYears] = useState(0);

return {
  // ... other state
  seniorDebtIOYears,
  setSeniorDebtIOYears,
};
```

---

#### UI Input Components (4+ files)

| HDC Calculator | OZ Benefits | Purpose |
|----------------|-------------|---------|
| `src/components/HDCCalculator/inputs/BasicInputsSection.tsx` | `src/components/oz-benefits/inputs/BasicInputsSection.tsx` | Basic inputs UI |
| `src/components/HDCCalculator/inputs/CapitalStructureSection.tsx` | `src/components/oz-benefits/inputs/CapitalStructureSection.tsx` | Capital structure UI |

**Sync Points** (per component):
- Props interface definitions
- Destructuring statements
- Form controls (inputs, selects, checkboxes)
- Validation logic
- Conditional rendering logic
- Tooltip/help text

**Note**: OZ Benefits may have additional OZ-specific fields not present in HDC Calculator. The synchronization requirement applies to **shared fields only**.

---

#### Result Display Components (10+ files)

| HDC Calculator | OZ Benefits | Purpose |
|----------------|-------------|---------|
| `src/components/HDCCalculator/results/*.tsx` | `src/components/oz-benefits/results/*.tsx` | Result displays |

**Sync Note**: Result components typically receive **calculated outputs** rather than input parameters. New input parameters rarely require result component changes unless they affect the display format or add new result fields.

**Exception**: If a new feature adds a new **result field** (e.g., a new metric or breakdown), result components must be synchronized.

---

### Synchronization Decision Tree

```
New Feature Added
    ↓
Does it add a new INPUT parameter?
    YES → Sync types, hooks, input components (8 files minimum)
    NO → Continue
    ↓
Does it change CALCULATION LOGIC?
    YES → Update shared engine (calculations.ts) + test BOTH calculators
    NO → Continue
    ↓
Does it add a new RESULT field?
    YES → Sync types, result components (2+ files)
    NO → Continue
    ↓
Does it change EXISTING behavior?
    YES → Test BOTH calculators thoroughly
    NO → Single calculator update OK
```

---

## 2. File Classification System

### Discovery Summary

**Total Variant Files Found**: 123 files with "` 2`" suffix pattern

**Distribution**:
- Components: 67 files
- Hooks: 16 files
- Types: 6 files
- Utils: 22 files
- UI/Styles: 49 files

**Discovery Commands**:
```bash
find src -name "* 2.*" | wc -l
# Result: 123 files

find src/components -name "* 2.*" | wc -l
# Result: 67 files

find src/hooks -name "* 2.*" | wc -l
# Result: 16 files
```

---

### Classification Categories

#### Category A: Intentional Variants (Keep Both)

**Definition**: Files with "` 2`" suffix that serve a distinct purpose and should remain.

**Examples**:
- None identified yet (requires manual code review)

**How to Identify**:
1. Check git history: `git log --follow "path/to/File 2.tsx"`
2. Look for comments explaining purpose
3. Check for different imports/logic than primary version

**Action**: Document purpose in this file, maintain both versions

---

#### Category B: Active Duplicates (Merge Required)

**Definition**: Files with "` 2`" suffix that are functionally identical or near-identical to the primary version, indicating work-in-progress or experimental code.

**Risk Level**: **HIGH** - Can cause confusion, maintenance burden

**Characteristics**:
- Same imports as primary version
- Same component structure
- Minor differences (formatting, incomplete edits)
- Recent modification dates (active development)

**Action**:
1. Compare with primary: `diff -u "File.tsx" "File 2.tsx"`
2. Merge valuable changes into primary
3. Remove duplicate
4. Update imports in consuming files

---

#### Category C: Deprecated Backups (Safe to Remove)

**Definition**: Files with "` 2`" suffix that are stale backups with no recent modifications.

**Risk Level**: **LOW** - Likely safe to remove

**Characteristics**:
- Old modification dates (>6 months)
- No recent git commits
- No imports/references from other files
- Identical or older version than primary

**How to Verify Safety**:
```bash
# Check for any imports of the variant file
grep -r "File 2" src --include="*.ts" --include="*.tsx"

# Check last modification date
ls -la "path/to/File 2.tsx"

# Check git history
git log --oneline --follow "path/to/File 2.tsx" | head -5
```

**Action**:
1. Verify no references exist
2. Create git commit removing files (allows recovery if needed)
3. Document removal in commit message

---

#### Category D: Editor Artifacts (Safe to Remove)

**Definition**: Files created accidentally by editors, IDEs, or operating systems.

**Risk Level**: **NONE** - Safe to remove immediately

**Examples**:
- `.DS_Store` files (macOS Finder)
- `Thumbs.db` (Windows Explorer)
- `.swp`, `.swo` files (Vim)
- `*~` files (Emacs)

**Action**: Add to `.gitignore`, remove from repository

---

### Classification Workflow

**For each "` 2.*`" file found**:

1. **Check References**:
   ```bash
   grep -r "Filename 2" src --include="*.ts" --include="*.tsx"
   ```
   - If references exist → **Category A or B** (Intentional or Active)
   - If no references → Continue to step 2

2. **Check Git History**:
   ```bash
   git log --oneline --follow "path/to/File 2.tsx" | head -10
   ```
   - Recent commits (< 1 month) → **Category B** (Active duplicate)
   - Old commits (> 6 months) → **Category C** (Deprecated backup)

3. **Compare with Primary**:
   ```bash
   diff -u "File.tsx" "File 2.tsx"
   ```
   - Identical or trivial differences → **Category C** (Backup)
   - Significant differences + references → **Category A** (Intentional)
   - Significant differences + no references → **Category B** (WIP)

4. **Document Decision**:
   - Add to appropriate category list below
   - Include justification

---

### Classified Files (To Be Populated)

#### Intentional Variants
*None identified yet - requires manual review*

#### Active Duplicates (Merge Required)
```bash
# Run this to get candidate list:
find src -name "* 2.*" -type f -newermt "2024-07-01" | sort
```

*To be populated during cleanup phase*

#### Deprecated Backups (Safe to Remove)
```bash
# Run this to get candidate list:
find src -name "* 2.*" -type f ! -newermt "2024-07-01" | sort
```

*To be populated during cleanup phase*

---

## 3. Feature Sync Checklist Template

### Overview

Use this checklist when adding a **new input parameter** that affects both HDC Calculator and OZ Benefits.

**Example**: Adding `seniorDebtIOYears` parameter (Step 5B)

---

### Phase 1: Type Definitions

- [ ] **HDC Types** (`src/types/HDCCalculator/index.ts`)
  - [ ] Add to `CalculationParams` interface
  - [ ] Add JSDoc comment with description
  - [ ] Specify type (number, boolean, string, etc.)

- [ ] **OZ Types** (`src/types/oz-benefits/index.ts`)
  - [ ] Add to `CalculationParams` interface
  - [ ] Ensure field name matches HDC exactly
  - [ ] Copy JSDoc comment

**Verification**:
```bash
grep -n "newParameterName" src/types/HDCCalculator/index.ts
grep -n "newParameterName" src/types/oz-benefits/index.ts
# Should see matching interface entries
```

---

### Phase 2: Shared Calculation Engine

- [ ] **Core Calculations** (`src/utils/HDCCalculator/calculations.ts`)
  - [ ] Add to function parameter destructuring
  - [ ] Implement calculation logic
  - [ ] Update relevant calculations (NOI, debt service, cash flows, etc.)
  - [ ] Add inline comments explaining logic

- [ ] **Related Utilities** (if applicable)
  - [ ] Interest reserve calculation
  - [ ] Monthly payment calculation
  - [ ] Exit proceeds calculation
  - [ ] Other utility functions

**Verification**:
```bash
grep -n "newParameterName" src/utils/HDCCalculator/calculations.ts
# Verify parameter is used in logic, not just declared
```

---

### Phase 3: State Management - HDC Calculator

- [ ] **HDC State Hook** (`src/hooks/HDCCalculator/useHDCState.ts`)
  - [ ] Add `useState()` declaration with default value
  - [ ] Add to return statement (both getter and setter)
  - [ ] Document default value choice

- [ ] **HDC Calculations Hook** (`src/hooks/HDCCalculator/useHDCCalculations.ts`)
  - [ ] Add to props interface
  - [ ] Pass to `calculateFullInvestorAnalysis()`
  - [ ] Pass to `calculateHDCAnalysis()`
  - [ ] Pass to any utility functions (e.g., interest reserve)
  - [ ] Add to dependency arrays in `useMemo`/`useEffect`

**Verification**:
```bash
grep -c "newParameterName" src/hooks/HDCCalculator/useHDCState.ts
# Should see at least 2 occurrences (useState + return)

grep -c "newParameterName" src/hooks/HDCCalculator/useHDCCalculations.ts
# Should see at least 3 occurrences (interface + 2-3 calls)
```

---

### Phase 4: State Management - OZ Benefits

- [ ] **OZ State Hook** (`src/hooks/oz-benefits/useHDCState.ts`)
  - [ ] Add `useState()` declaration with same default as HDC
  - [ ] Add to return statement (both getter and setter)
  - [ ] Ensure naming matches HDC exactly

- [ ] **OZ Calculations Hook** (`src/hooks/oz-benefits/useHDCCalculations.ts`)
  - [ ] Add to props interface
  - [ ] Pass to calculation functions
  - [ ] Pass to utility functions
  - [ ] Add to dependency arrays

**Verification**:
```bash
grep -c "newParameterName" src/hooks/oz-benefits/useHDCState.ts
# Should match HDC count (at least 2)

grep -c "newParameterName" src/hooks/oz-benefits/useHDCCalculations.ts
# Should match HDC count (at least 3)
```

---

### Phase 5: UI Components - HDC Calculator

- [ ] **Identify Target Component**
  - [ ] BasicInputsSection (for basic project parameters)
  - [ ] CapitalStructureSection (for debt/equity parameters)
  - [ ] ProjectionsSection (for NOI/growth parameters)
  - [ ] Other section (specify)

- [ ] **Update Component Props Interface**
  - [ ] Add parameter to props interface
  - [ ] Add setter to props interface
  - [ ] Add to destructuring statement

- [ ] **Add UI Control**
  - [ ] Choose control type (input, select, checkbox, etc.)
  - [ ] Add label with clear description
  - [ ] Add value binding to state
  - [ ] Add onChange handler calling setter
  - [ ] Add conditional rendering if applicable
  - [ ] Add tooltip/help text if needed
  - [ ] Support read-only mode (`isReadOnly` prop)
  - [ ] Match existing styling patterns

**Example** (Step 5B - Senior Debt IO Years):
```tsx
<div className="hdc-input-group">
  <label className="hdc-input-label">
    Interest-Only Years
    <span style={{ fontSize: '0.65rem', color: '#666', display: 'block' }}>
      IO period starts at placed in service
    </span>
  </label>
  <Select
    value={seniorDebtIOYears.toString()}
    onValueChange={(value) => setSeniorDebtIOYears(Number(value))}
    disabled={isReadOnly}
  >
    <SelectTrigger className="hdc-input">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="0">None (Full P&I)</SelectItem>
      <SelectItem value="1">1 Year</SelectItem>
      {/* ... */}
    </SelectContent>
  </Select>
</div>
```

**Verification**:
```bash
grep -n "newParameterName" src/components/HDCCalculator/inputs/TargetSection.tsx
# Should see: props interface, destructuring, UI control (3+ occurrences)
```

---

### Phase 6: UI Components - OZ Benefits

- [ ] **OZ Benefits Input Component** (`src/components/oz-benefits/inputs/[TargetSection].tsx`)
  - [ ] Add to props interface
  - [ ] Add to destructuring
  - [ ] Add UI control (copy from HDC, adjust styling if needed)
  - [ ] Verify tooltip text is appropriate for OZ context
  - [ ] Test with OZ-specific features enabled

**Verification**:
```bash
grep -n "newParameterName" src/components/oz-benefits/inputs/TargetSection.tsx
# Should match HDC pattern (props + destructuring + UI control)
```

---

### Phase 7: Testing

- [ ] **Create Feature Test File**
  - [ ] Location: `src/utils/HDCCalculator/__tests__/features/[feature-name].test.ts`
  - [ ] Use descriptive `describe()` blocks
  - [ ] Include baseline test (default value)
  - [ ] Test all meaningful values (min, max, edge cases)
  - [ ] Test interaction with related features

- [ ] **Test Scenarios** (adapt to your feature)
  - [ ] Baseline (default/disabled state)
  - [ ] Minimum non-zero value
  - [ ] Maximum value
  - [ ] Mid-range values
  - [ ] Edge cases (0, negative if applicable)
  - [ ] Interaction with construction delay
  - [ ] Interaction with other parameters

- [ ] **Run Tests**
  ```bash
  cd hdc-map-frontend
  npm test -- features/[feature-name].test.ts
  ```

- [ ] **Verify All Pass**
  - [ ] New feature tests: 100% passing
  - [ ] Existing test suite: No regressions

**Example Test Structure** (Step 5B):
```typescript
describe('Feature Name', () => {
  const baseParams = { /* standard params */ };

  describe('Baseline - Feature Disabled', () => {
    it('should calculate with default behavior', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        newParameter: 0,
      });
      expect(result.someMetric).toBeCloseTo(expectedValue, 2);
    });
  });

  describe('Feature Enabled - Value X', () => {
    it('should apply feature logic correctly', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        newParameter: X,
      });
      expect(result.someMetric).toBeCloseTo(expectedValue, 2);
    });
  });

  // ... more scenarios
});
```

---

### Phase 8: Documentation

- [ ] **HDC Calculation Logic** (`src/utils/HDCCalculator/HDC_CALCULATION_LOGIC.md`)
  - [ ] Add section for new feature
  - [ ] Document formula/logic
  - [ ] Explain when feature applies
  - [ ] Provide example calculation
  - [ ] Link to test file

- [ ] **Configuration Fields** (`src/components/HDCCalculator/CONFIGURATION_FIELDS.md`)
  - [ ] Add entry with:
    - Field name
    - Type
    - Default value
    - Description
    - UI location
    - Related fields

- [ ] **Update Relevant Docs**
  - [ ] STEP_X_COMPLETION.md (create if new feature step)
  - [ ] Other affected documentation

---

### Phase 9: Validation

- [ ] **Grep Audit**
  ```bash
  grep -rn "newParameterName" src --include="*.ts" --include="*.tsx" | grep -v ".test.ts" | grep -v "node_modules"
  ```
  - [ ] Verify expected file count (minimum 12 for basic input parameter)
  - [ ] Check each occurrence is intentional
  - [ ] Document total reference count

- [ ] **File Inventory**
  - [ ] List all files ADDED (tests, docs)
  - [ ] List all files UPDATED with line counts
  - [ ] Total lines added across all files

- [ ] **Layer Synchronization Check**
  - [ ] Types: Both HDC + OZ ✓
  - [ ] Shared engine: Updated ✓
  - [ ] HDC hooks: Both files ✓
  - [ ] OZ hooks: Both files ✓
  - [ ] HDC components: Relevant sections ✓
  - [ ] OZ components: Relevant sections ✓
  - [ ] Tests: Created and passing ✓
  - [ ] Documentation: Updated ✓

- [ ] **Dev Server Check**
  ```bash
  cd hdc-map-frontend
  npm run dev
  ```
  - [ ] No TypeScript errors
  - [ ] No console errors
  - [ ] HMR (Hot Module Reload) working
  - [ ] UI renders correctly in both calculators

- [ ] **Test Suite Check**
  ```bash
  npm test
  ```
  - [ ] All existing tests still pass
  - [ ] New tests pass
  - [ ] No test failures or warnings

---

### Phase 10: Completion Report

- [ ] **Create STEP_X_COMPLETION.md**
  - [ ] Executive summary
  - [ ] Files modified (with line counts)
  - [ ] Test results (screenshot or output)
  - [ ] Grep audit results
  - [ ] File inventory
  - [ ] Verification checklist
  - [ ] Known issues (if any)

- [ ] **Update CODEBASE_SYNC_MAP.md** (this file)
  - [ ] Add new parameter to sync checklist examples
  - [ ] Document any new sync patterns discovered
  - [ ] Update file pair mappings if new files added

---

### Touchpoint Summary

**Minimum files requiring updates for a basic input parameter**:

| Category | HDC | OZ | Shared | Tests | Docs | Total |
|----------|-----|----|----|-------|------|-------|
| Types | 1 | 1 | - | - | - | 2 |
| Calculation Engine | - | - | 1 | - | - | 1 |
| Utilities | - | - | 0-2 | - | - | 0-2 |
| State Hooks | 1 | 1 | - | - | - | 2 |
| Calculation Hooks | 1 | 1 | - | - | - | 2 |
| Input Components | 1-2 | 1-2 | - | - | - | 2-4 |
| Tests | - | - | - | 1 | - | 1 |
| Documentation | - | - | - | - | 2-3 | 2-3 |
| **Total** | **4-5** | **4-5** | **1-3** | **1** | **2-3** | **12-17** |

**Step 5B Example** (`seniorDebtIOYears`):
- Files updated: 15
- Lines added: 594 (including 393-line test file)
- Total references: 49 (production code only)

---

## 4. Cleanup Recommendations

### Priority 1: HIGH - Active Duplicates (Immediate Action)

**Risk**: Code confusion, divergent implementations, maintenance burden

**Files**: TBD (requires classification)

**Action Plan**:
1. Run classification workflow on all 123 "` 2.*`" files
2. For each active duplicate:
   - Compare with primary: `diff -u "File.tsx" "File 2.tsx"`
   - If changes are valuable: Merge into primary, remove duplicate
   - If changes are incomplete: Decide to keep (complete it) or discard
   - Update all imports referencing the duplicate
3. Create git commit for each file removal (allows easy recovery)

**Timeline**: Within 1-2 weeks

---

### Priority 2: MEDIUM - Deprecated Backups (Scheduled Cleanup)

**Risk**: Clutter, confusion, wasted storage

**Files**: TBD (requires classification)

**Action Plan**:
1. Verify no references exist:
   ```bash
   grep -r "Filename 2" src --include="*.ts" --include="*.tsx"
   ```
2. Check git history for last modification date:
   ```bash
   git log --oneline --follow "path/to/File 2.tsx" | head -5
   ```
3. If >6 months old + no references: Safe to remove
4. Batch remove in single commit with descriptive message

**Timeline**: Within 1 month

---

### Priority 3: LOW - Intentional Variants (Document Only)

**Risk**: None if properly documented

**Files**: TBD (requires manual review)

**Action Plan**:
1. Identify true intentional variants
2. Add comment at top of file explaining purpose:
   ```typescript
   /**
    * INTENTIONAL VARIANT
    *
    * This file is a variant of ComponentName.tsx that [explain difference].
    * DO NOT MERGE with primary version.
    *
    * Use Cases:
    * - [List when to use this vs. primary]
    *
    * Sync Requirements:
    * - [List what must stay in sync with primary, if anything]
    */
   ```
3. Document in CODEBASE_SYNC_MAP.md (this file)
4. Add to team documentation

**Timeline**: Ongoing as discovered

---

### Priority 4: Preventive - Add `.gitignore` Rules

**Action**: Prevent future accumulation of variant files

**Add to `.gitignore`**:
```gitignore
# Editor artifacts
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# Backup files (manual backups should use git branches instead)
*.backup.*
*_backup.*
* copy.*
* Copy.*

# Note: "* 2.*" pattern not added yet - requires manual classification first
```

**Timeline**: Immediate (except "` 2.*`" pattern)

---

### Cleanup Metrics (To Track)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Total "` 2.*`" files | 123 | <10 | ⏳ Pending classification |
| Classified files | 0 | 123 | ⏳ Pending workflow |
| Intentional variants | ? | <10 | ⏳ To be determined |
| Active duplicates | ? | 0 | ⏳ To be merged/removed |
| Deprecated backups | ? | 0 | ⏳ To be removed |

---

### Cleanup Workflow

```bash
# Step 1: Export full list of variant files
find src -name "* 2.*" -type f > variant_files_list.txt

# Step 2: For each file, run classification workflow
while read file; do
  echo "=== $file ==="

  # Check references
  basename=$(basename "$file")
  grep -r "$basename" src --include="*.ts" --include="*.tsx" | head -5

  # Check git history
  git log --oneline --follow "$file" | head -5

  # Ask for classification decision
  echo "Category? (A=Intentional, B=Active, C=Deprecated, D=Artifact)"
  read category

  # Append to appropriate list
  echo "$file" >> "category_${category}_files.txt"

done < variant_files_list.txt

# Step 3: Process each category
# Category C (Deprecated) - Safe to remove
if [ -f category_C_files.txt ]; then
  echo "Removing deprecated backups..."
  while read file; do
    git rm "$file"
  done < category_C_files.txt
  git commit -m "chore: Remove deprecated backup files (Category C)"
fi

# Category D (Artifacts) - Safe to remove + update .gitignore
# Category B (Active) - Manual review required
# Category A (Intentional) - Document only
```

---

## 5. Quick Reference Tables

### HDC ↔ OZ Benefits File Pairs

#### Type Definitions

| HDC Calculator | OZ Benefits | Sync Level |
|----------------|-------------|------------|
| `src/types/HDCCalculator/index.ts` | `src/types/oz-benefits/index.ts` | **EXACT** - All `CalculationParams` fields must match |

**Sync Level Legend**:
- **EXACT**: Field names, types, defaults must be identical
- **PARTIAL**: Shared fields must match, each can have unique fields
- **INDEPENDENT**: No sync required

---

#### State Management Hooks

| HDC Calculator | OZ Benefits | Sync Level |
|----------------|-------------|------------|
| `src/hooks/HDCCalculator/useHDCState.ts` | `src/hooks/oz-benefits/useHDCState.ts` | **EXACT** - All shared parameters |
| `src/hooks/HDCCalculator/useHDCCalculations.ts` | `src/hooks/oz-benefits/useHDCCalculations.ts` | **EXACT** - Props interface must match |

---

#### Input Components

| HDC Calculator | OZ Benefits | Sync Level |
|----------------|-------------|------------|
| `src/components/HDCCalculator/inputs/BasicInputsSection.tsx` | `src/components/oz-benefits/inputs/BasicInputsSection.tsx` | **PARTIAL** - Shared fields only |
| `src/components/HDCCalculator/inputs/CapitalStructureSection.tsx` | `src/components/oz-benefits/inputs/CapitalStructureSection.tsx` | **PARTIAL** - Shared fields only |
| `src/components/HDCCalculator/inputs/ProjectionsSection.tsx` | `src/components/oz-benefits/inputs/ProjectionsSection.tsx` | **PARTIAL** - Shared fields only |

**Note**: OZ Benefits may have additional OZ-specific input fields not present in HDC Calculator. Only shared fields require synchronization.

---

#### Result Components

| HDC Calculator | OZ Benefits | Sync Level |
|----------------|-------------|------------|
| `src/components/HDCCalculator/results/*.tsx` | `src/components/oz-benefits/results/*.tsx` | **INDEPENDENT** - Rarely requires sync |

**Exception**: If a new feature adds a **result metric** (not input parameter), result components may need updates.

---

### Shared Calculation Files (Single Source of Truth)

| File | Purpose | Used By | Sync Required |
|------|---------|---------|---------------|
| `src/utils/HDCCalculator/calculations.ts` | Core engine | Both | Test both calculators |
| `src/utils/HDCCalculator/interestReserveCalculation.ts` | Interest reserve | Both | Test both calculators |
| `src/utils/HDCCalculator/monthlyPaymentCalculation.ts` | Debt payments | Both | Test both calculators |
| `src/utils/HDCCalculator/exitProceedsCalculation.ts` | Exit proceeds | Both | Test both calculators |

---

### Feature Sync Verification Checklist

Use this quick checklist when completing a feature:

```bash
# Types (2 files)
grep -c "parameterName" src/types/HDCCalculator/index.ts
grep -c "parameterName" src/types/oz-benefits/index.ts
# Counts should match

# Shared Engine (1 file)
grep -c "parameterName" src/utils/HDCCalculator/calculations.ts
# Should see usage, not just parameter declaration

# HDC Hooks (2 files)
grep -c "parameterName" src/hooks/HDCCalculator/useHDCState.ts
grep -c "parameterName" src/hooks/HDCCalculator/useHDCCalculations.ts
# Should see 2+ and 3+ respectively

# OZ Hooks (2 files)
grep -c "parameterName" src/hooks/oz-benefits/useHDCState.ts
grep -c "parameterName" src/hooks/oz-benefits/useHDCCalculations.ts
# Counts should match HDC hooks

# HDC Components (2+ files)
grep -c "parameterName" src/components/HDCCalculator/inputs/TargetSection.tsx
# Should see 3+ (props + destructure + UI control)

# OZ Components (2+ files)
grep -c "parameterName" src/components/oz-benefits/inputs/TargetSection.tsx
# Should match HDC component count

# Tests (1+ files)
ls src/utils/HDCCalculator/__tests__/features/*parameter*.test.ts
# Should exist

# Run tests
npm test -- features/*parameter*.test.ts
# Should pass 100%
```

---

### Common Sync Patterns by Parameter Type

| Parameter Type | Example | Files to Update | Special Considerations |
|----------------|---------|-----------------|------------------------|
| **Basic Number** | `projectCost` | 12-15 files | Add validation, min/max, formatting |
| **Percentage** | `seniorDebtRate` | 12-15 files | Display as % (multiply by 100), validate 0-100 |
| **Boolean Toggle** | `interestReserveEnabled` | 12-15 files | Conditional rendering of dependent fields |
| **Dropdown/Enum** | `seniorDebtIOYears` (0-10) | 12-15 files | SelectItem options, validation |
| **Date/Timing** | `taxBenefitDelayMonths` | 12-17 files | May affect cash flow timing, placement in service |
| **Debt Parameter** | `seniorDebtPct` | 12-17 files | Check waterfall, DSCR, capital structure constraints |
| **Tax Parameter** | `federalTaxRate` | 12-17 files | Affects tax calculations, depreciation, benefits |

---

### Step 5B Reference (seniorDebtIOYears)

**Total Files Modified**: 15
**Total Lines Added**: 594 (including 393-line test file)
**Production Code References**: 49
**Test Coverage**: 19 tests, 100% passing

**File Breakdown**:
1. `src/types/HDCCalculator/index.ts` (+3 lines)
2. `src/types/oz-benefits/index.ts` (+3 lines)
3. `src/utils/HDCCalculator/calculations.ts` (+4 lines)
4. `src/utils/HDCCalculator/interestReserveCalculation.ts` (+4 lines)
5. `src/hooks/HDCCalculator/useHDCState.ts` (+2 lines)
6. `src/hooks/HDCCalculator/useHDCCalculations.ts` (+4 lines)
7. `src/components/HDCCalculator/inputs/BasicInputsSection.tsx` (+3 lines)
8. `src/components/HDCCalculator/inputs/CapitalStructureSection.tsx` (+52 lines)
9. `src/hooks/oz-benefits/useHDCState.ts` (+2 lines)
10. `src/hooks/oz-benefits/useHDCCalculations.ts` (+3 lines)
11. `src/components/oz-benefits/inputs/CapitalStructureSection.tsx` (+47 lines)
12. `src/utils/HDCCalculator/__tests__/features/senior-debt-io-period.test.ts` [NEW] (+393 lines)
13. `src/utils/HDCCalculator/HDC_CALCULATION_LOGIC.md` (+10 lines)
14. `src/components/HDCCalculator/CONFIGURATION_FIELDS.md` (+1 line)
15. `src/utils/HDCCalculator/__tests__/features/STEP_5B_COMPLETION.md` [NEW] (documentation)

**Use Step 5B as the template for future parameter additions.**

---

## Appendix: Discovery Commands

### Find All Variant Files
```bash
find src -name "* 2.*" -type f | sort
```

### Find Component Variants
```bash
find src/components -name "* 2.*" -type f | sort
```

### Find Hook Variants
```bash
find src/hooks -name "* 2.*" -type f | sort
```

### Find Type Variants
```bash
find src/types -name "* 2.*" -type f | sort
```

### Check for References to a Variant File
```bash
grep -r "Filename 2" src --include="*.ts" --include="*.tsx"
```

### Check Git History of Variant File
```bash
git log --oneline --follow "path/to/File 2.tsx"
```

### Compare Variant with Primary
```bash
diff -u "File.tsx" "File 2.tsx"
```

### Count Total Variant Files by Category
```bash
find src/components -name "* 2.*" | wc -l
find src/hooks -name "* 2.*" | wc -l
find src/types -name "* 2.*" | wc -l
find src/utils -name "* 2.*" | wc -l
```

---

## Maintenance

**This document should be updated when**:
- New parallel implementations are added
- New sync patterns are discovered
- Variant file classification is completed
- Cleanup phases are executed
- New feature types require different sync workflows

**Last Updated**: January 2025
**Next Review**: After Step 6 completion or after variant file cleanup

---

**End of CODEBASE_SYNC_MAP.md**
