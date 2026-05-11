---
name: math-reference-update
description: Audit AHF_Mathematical_Reference_v3_x.md against the current engine codebase whenever a calculation file changes. Makes targeted updates to keep the reference current — line references, formula logic, constants, status flags, and new sections. Triggered automatically when any engine file appears in git diff.
---

## When to use

Trigger this skill at DoD time for any IMPL that touches a calculation engine file. The check is mechanical — run `git diff --name-only` and if any file in the trigger list appears, this skill runs before commit approval.

**Trigger files (any one of these in diff → skill runs):**
- `calculations.ts`
- `investorTaxUtilization.ts`
- `depreciationSchedule.ts`
- `lihtcCreditCalculations.ts`
- `stateLIHTCCalculations.ts`
- `preferredEquityCalculations.ts`
- `poolAggregation.ts`
- `investorSizing.ts`
- `fundSizingOptimizer.ts`
- `xirrCalculation.ts`
- `sCurveUtility.ts`
- `investorFit.ts`
- `territorialTaxCalculations.ts`
- `iraConversion.ts`
- `taxCapacity.ts`

**Do NOT use this skill if:**
- The diff touches only UI files, test files, or non-calculation utilities
- The diff is a pure refactor with no behavioral change (confirm with Brad before skipping)
- The reference was already updated in this same IMPL session

## Success bar

At the end of this skill, one of three outcomes must be confirmed:

1. **No change needed** — reference is current, confirmed with a 4-point audit report
2. **Targeted update made** — specific sections updated, versioned, committed in same push
3. **New section drafted** — new formula section added for Brad review; flagged before commit

If the skill finds a formula change it cannot resolve automatically (e.g., a materially new algorithm requiring novel mathematical notation), it stops and reports to Brad rather than guessing.

## File-to-section mapping

Use this table to identify which reference sections are affected by a changed file.

| Changed file | Reference sections affected |
|---|---|
| calculations.ts | G-1 through G-6, G-14, G-16, H-1, H-2, H-4, E-17, E-18, E-19, Appendix A |
| investorTaxUtilization.ts | E-3 through E-9, E-13 through E-16, E-22, G-7, G-8, G-11 through G-13, P-E15, Appendix A |
| depreciationSchedule.ts | G-1, Appendix A |
| lihtcCreditCalculations.ts | G-2, Appendix A |
| stateLIHTCCalculations.ts | H-3, G-15, Appendix A |
| preferredEquityCalculations.ts | H-4, Appendix A |
| poolAggregation.ts | E-20, P-E20, E-21, P-E21 |
| investorSizing.ts | G-9 through G-10, E-9 through E-12, E-14, Appendix A |
| fundSizingOptimizer.ts | G-10, E-10, Appendix A |
| xirrCalculation.ts | E-1, Appendix A |
| sCurveUtility.ts | E-6, Appendix A |
| investorFit.ts | E-4, G-18 |
| territorialTaxCalculations.ts | G-17 |
| iraConversion.ts | E-11, Appendix A |
| taxCapacity.ts | Phase B4 section (future) |

## Versioning convention

| Change type | Version bump | Example |
|---|---|---|
| Line reference update only | None — add date comment | `▶ calculations.ts:303-305 [updated May 2026]` |
| Status flag change (F→C, PARTIAL→C) | None — update inline | `Closed form: **YES**` |
| Constant value update (Appendix A) | Patch: v3.2 → v3.2.1 | §461(l) threshold updated for new tax year |
| Formula logic update (existing section) | Minor: v3.2 → v3.3 | Waterfall tier order changed |
| New formula section added | Minor: v3.2 → v3.3 | New IMPL ships, new H/G/E item added |
| Structural rewrite | Major: v3.x → v4.0 | Three-state architecture, Phase B4 |

---

## Workflow

### Step 1: Identify affected sections

Run:
```bash
git diff --name-only HEAD
```

Map each changed file to its reference sections using the table above.

Report: "Files changed: [list]. Affected sections: [list]."

If no trigger files appear in the diff, report "No calculation engine files changed — math reference audit not required" and exit.

---

### Step 2: Run the 4-point audit for each affected section

For each affected section, check all four points. Report findings before making any changes.

**Point 1 — Line references current?**

For each `▶` file reference in the affected section, verify the cited function and line range still exists:

```bash
# Check function still exists at cited location
grep -n "FUNCTION_NAME" frontend/src/utils/taxbenefits/TARGET_FILE.ts

# Check line range contains expected logic
sed -n 'START,ENDp' frontend/src/utils/taxbenefits/TARGET_FILE.ts
```

Result: CURRENT (line ref valid) | STALE (function moved or lines shifted)

**Point 2 — Formula logic unchanged?**

Read the diff for the affected function. Compare against the formula block in the reference. Check for:
- New conditional branches not reflected in the formula
- Changed formula structure (e.g., min/max flipped, new pool added)
- New parameters added that appear in the formula
- Waterfall priority changes

Result: UNCHANGED | CHANGED (describe what changed)

**Point 3 — Constants unchanged?**

For each constant named in the affected section and in Appendix A, verify current value in codebase:

```bash
grep -n "CONSTANT_NAME" frontend/src/utils/taxbenefits/investorTaxUtilization.ts
grep -n "CONSTANT_NAME" frontend/src/utils/taxbenefits/calculations.ts
```

Result: CURRENT | CHANGED (old value → new value)

**Point 4 — Status flags current?**

Check if any F (future) items in the affected section were deployed in this IMPL:
- Was an IMPL number referenced in the section now completed?
- Did a PARTIAL section become fully implemented?

Result: CURRENT | UPDATE NEEDED (F→C or PARTIAL→C)

---

### Step 3: Report audit findings

Before making any changes, report the full audit:

```
MATH REFERENCE AUDIT — IMPL-XXX
================================
Files changed: [list]
Affected sections: [list]

Section [code]: [name]
  Point 1 — Line refs: CURRENT / STALE [details]
  Point 2 — Formula: UNCHANGED / CHANGED [details]
  Point 3 — Constants: CURRENT / CHANGED [details]
  Point 4 — Status: CURRENT / UPDATE NEEDED [details]

[repeat for each section]

SUMMARY:
  No changes needed: [count sections]
  Updates required: [count sections]
  New sections needed: [count, if any]
  Recommended version bump: [None / Patch / Minor / Major]
```

If all four points are CURRENT for all sections: report "Reference is current — no updates needed" and exit. Commit proceeds.

If any point needs updating: proceed to Step 4.

---

### Step 4: Make targeted updates

Apply only the changes identified in Step 3. Do not rewrite sections that are current.

**For stale line references (Point 1):**

Find the new location of the function:
```bash
grep -n "functionName" frontend/src/utils/taxbenefits/TARGET_FILE.ts
```

Update the `▶` line:
```
▶  calculations.ts:NEW_START-NEW_END (functionName)
```

**For formula logic changes (Point 2):**

Update the formula block to reflect the new logic. Use the same notation style as the surrounding section (monospace code blocks for pseudocode, inline notation for simple expressions).

If the change is complex enough to require new variable definitions, add rows to the variable table. If a new constraint applies, add it to the constraints list.

Do NOT rewrite the entire section — make surgical additions or replacements.

**For constant changes (Point 3):**

Update the value in the affected section AND in Appendix A:

In the section:
```
r_HDC,def default = NEW_VALUE%    (previously OLD_VALUE%)
```

In Appendix A table row:
```
| HDC deferred interest rate (default) | NEW_VALUE% | AUM fee deferred-pool compounding |
```

**For status flag changes (Point 4):**

Update the status line at the top of the section:
```
Closed form: **YES**  ← remove PARTIAL notation
```

Or update the F → C notation:
```
~~F — IMPL-185: forgivable debt toggle not yet implemented~~
C — IMPL-185 deployed [Month Year]. Forgiveness flag filters soft debt from exit waterfall.
```

---

### Step 5: Handle new sections (if IMPL adds new engine feature)

If the IMPL deploys a feature with no existing reference section, draft a new section using this template:

```markdown
---

**[CODE]  —  [Section Name]** ★ NEW [version]

Closed form: **[YES / ALGORITHMIC / PARTIAL / STRUCTURAL]**

[One sentence describing what this covers.]

**[SUBSECTION HEADING]**

[Formula block in monospace code block]

| Symbol | Type | Description | Source field |
| :---- | :---- | :---- | :---- |
| [sym] | [type] | [description] | [field name] |

[Constraints and conditions as bullet list]

▶  [file:line-range (functionName)]

---
```

Flag the new section for Brad review before committing:

> "New section drafted for [code]. Please review mathematical notation and confirm accuracy before I commit. Specifically: [flag any uncertain formula translations]."

Do not commit a new section without Brad confirmation.

---

### Step 6: Update gap analysis and outline

After making reference updates, check whether:

1. **Gap analysis** (`AHF_Math_Reference_Gap_Analysis_v1_1.md`) needs updating:
   - If a Category 3 future item shipped → mark resolved
   - If a Category 2 PARTIAL item became complete → update status
   - If a new gap was discovered → add it

2. **Outline** (`AHF_MathRef_Outline_v1_1.md`) needs updating:
   - Status field for affected sections
   - File reference line numbers if shifted

These are secondary files — update them if warranted, skip if the math reference change was purely a line reference fix.

---

### Step 7: Version bump and commit

Apply the version bump per the versioning convention above.

Update the version in:
- The document header line: `Housing Diversity Corporation  |  [date]  |  v[new]  |  Confidential`
- The footer line: `v[new]  |  Confidential`

Commit message format:
```
docs: Math reference v[new] — [brief description of what changed]
  
Triggered by IMPL-[N]. Sections updated: [list].
[version bump type] version bump: [reason].
```

The math reference commit should be in the SAME push as the IMPL commit. Do not create a separate PR for documentation only — it must travel with the code change that made it necessary.

---

### Step 8: Confirm DoD

After committing, add to the IMPL DoD confirmation:

```
✅ Math reference audit complete
   Sections audited: [list]
   Changes made: [None / list of changes]
   Version: [current version]
   Committed: [Yes, in same push as IMPL-N / No changes needed]
```

---

## Anti-patterns to avoid

**"Formula looks the same to me" without actually checking the diff.**
Always read the actual git diff for the changed function, not just the function name. A renamed variable or reordered conditional can change the mathematical meaning without looking different at a glance.

**Rewriting current sections because they "could be clearer."**
This skill makes targeted updates. If a section is mathematically correct and references are current, leave it alone. Style improvements belong in a dedicated reference revision session, not embedded in IMPL commits.

**Committing a new section without Brad review.**
Novel formula sections require human judgment about mathematical notation. Draft and flag — never auto-commit new sections.

**Skipping the audit when the IMPL "obviously doesn't affect formulas."**
Refactors, renames, and extractions routinely shift line numbers and move functions. Run the audit. It takes two minutes. A stale `▶ calculations.ts:496` pointer found six months later takes much longer to track down.

**Letting the version drift.**
If you update the reference without bumping the version, the document loses its audit trail. Always version every substantive change, even a patch. Future sessions need to know what state the reference was in when a given IMPL shipped.

---

## Standing reference

- Reference file: `frontend/docs/reference/AHF_Mathematical_Reference_v[current].md`
- Gap analysis: `frontend/docs/reference/AHF_Math_Reference_Gap_Analysis_v[current].md`
- Outline: `frontend/docs/reference/AHF_MathRef_Outline_v[current].md`
- IMPL registry: `frontend/docs/SPEC_IMPLEMENTATION_REGISTRY_v4_2_UPDATE.md`

When the reference version increments, rename the file to match (e.g., v3.2.md → v3.3.md). Update all cross-references in AGENTS.md and the gap analysis to point to the new filename.
