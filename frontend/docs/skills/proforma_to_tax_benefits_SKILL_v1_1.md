---
name: proforma-to-tax-benefits
version: 1.1
updated: May 2026
description: Standardize a sponsor-provided LIHTC proforma, run it through the HDC tax benefits app, and reconcile the export against the canonical model. Surfaces architectural defects in HDC and produces an IC-ready bug memo when reconciliation fails.
changelog:
  - v1.0 (April 2026): Initial skill. Built from Trace 4001 CIE session. Covers 9-step reconciliation workflow, bug memo format, IMPL ticket handoff.
  - v1.1 (May 2026): Added version header and changelog. No workflow changes.
evolution_notes: >
  Update this skill when: a new deal type exposes a gap in the proforma
  mapping; a new IMPL changes a waterfall tier or calculation path that
  the reconciliation checks against; a bug memo produces a different
  structure than the 7-section format; tolerance thresholds need revision
  based on accumulated deal experience.
---

## When to use

A sponsor has sent a proforma (Excel file, varied format) for a LIHTC deal we're underwriting. The deal needs to flow through the HDC tax benefits app to produce the standardized export that drives LP marketing materials. Use this skill to:
- Map the sponsor's proforma into HDC's input schema
- Run the HDC export
- Reconcile HDC's output against the canonical Trace-style model
- Flag any reconciliation gaps as either config issues (fixable in inputs) or architectural defects (require HDC code changes)

Do NOT use this skill if:
- The deal is already in Trace canonical format and HDC has been reconciled previously — just re-run with updated inputs
- The sponsor is sending a pure term sheet with no proforma — start with deal model build first, then come here

## Success bar

- LP IRR variance vs canonical: **<0.5pp**
- LP cash flow line items: **<1% per year**
- Exit debt balances: exact match (any drift = bug)
- Tax benefit schedule: <1% per year through 2037

If you can't hit these, the gap is either (a) a config issue requiring an input fix, or (b) an architectural defect requiring an IMPL ticket. Classify and document — do not ship past the bar without explicit user override.

## Workflow

### Step 1: Intake the sponsor proforma

Read the sponsor's Excel file. Identify:
- Cap stack: every debt source, principal, rate, term, amortization, IO period, exit treatment, sweep behavior
- NOI build: unit mix, AMI bands, gross rents, vacancy, opex, growth assumptions
- S&U: acquisition price, depreciable basis, land allocation, eligible costs, financing fees
- Tax structure: credit type (4%/9%), credit price, boost, PIS date, 42(f)(1) election, investor type assumed
- Exit: hold period, exit cap, terminal NOI

**Done when:** You have a structured intake summary. Anything ambiguous, ask the user before proceeding — sponsor proformas hide assumptions in formula chains.

### Step 2: Map to HDC input schema

HDC expects a specific input shape. Translate the sponsor's structure:
- Multi-source cap stacks → HDC's debt entity list (Senior, PAB, Phil, Outside, DDF/C-note)
- Soft pay structures with sweeps → debt entity with `sweep_percentage` and `soft_pay_priority` fields (requires IMPL-165)
- Hope notes / deferred fees → C-note structure (requires IMPL-166)
- Investor type → preset (C-corp / HNW REP / HNW Passive)

Flag any sponsor construct that doesn't map cleanly. These become input questions or candidates for HDC architecture review.

**Done when:** All sponsor inputs are mapped to an HDC-compatible JSON or input set. Unmappable items are listed for user review.

### Step 3: Build the canonical reference model in parallel

Before running HDC, build (or update) the Trace-style canonical model with the same inputs. This is the ground truth HDC will be reconciled against. The canonical model uses transparent Excel formulas that are auditable cell-by-cell.

If a Trace template already exists for the project, populate it. If not, kick off the canonical build first and return here.

**Done when:** Canonical model produces full LP cash flow, debt balance schedule, tax benefit schedule, exit waterfall, and IRR/MOIC. All formulas reference inputs (no hardcoded computed values).

### Step 4: Run the HDC export

Run the proforma through HDC. Capture:
- Full output workbook
- Underlying intermediate calculations (waterfall steps, depreciation by asset class, credit schedule)
- HDC version / build SHA (so you know which IMPLs are in)

**Done when:** HDC export workbook is in hand and you've recorded the build it came from.

### Step 5: Diff HDC vs canonical

For each metric, compute variance:

| Metric | Tolerance | If outside |
|---|---|---|
| LP IRR | <0.5pp | Investigate |
| LP MOIC | <0.05x | Investigate |
| LP CF year-by-year | <1% | Investigate per year |
| Debt balance at exit (each source) | exact | Bug — escalate immediately |
| Tax benefit by year | <1% | Investigate |
| Tax credit schedule | exact | Bug — escalate immediately |

Build the diff as a side-by-side table in a `Reconciliation` sheet of the canonical workbook.

**Done when:** Every metric is classified pass / investigate / escalate, with the variance value documented.

### Step 6: Classify gaps

For each "investigate" or "escalate" variance, classify:

- **Config**: Wrong input on either side. Fix the input, re-run from Step 4.
  - Most common: investor type assumption (C-corp 21% vs HNW 40.8%) drives ~5-7pp of IRR variance on its own
- **Architectural**: HDC's data model or waterfall engine can't represent the construct. Cannot fix in inputs.
  - Examples: percentage cash sweep (pre-IMPL-165), PAB exit treatment (pre-IMPL-164), DDF paydown (pre-IMPL-166)
  - These become IMPL tickets for Claude Code
- **Acceptable**: Documented, understood, immaterial. E.g., HDC frontloads tax losses Y1 ($5.31M vs Trace $1.07M) — different timing, same NPV. Document and move on.

**Done when:** Every flagged variance has a classification and an owner (input fix / IMPL ticket / document).

### Step 7: If clean (<0.5pp IRR, <1% CF), ship

Update the project's `Project_Status` sheet:
- Mark reconciliation phase complete
- Note HDC build SHA used
- File inventory entry for the HDC export
- Brief note on any "acceptable" residuals

Hand off to LP marketing / IC deck workflow.

### Step 8: If dirty, produce bug memo

When architectural defects surface, generate the standardized HDC bug memo. Use this structure (from the Trace 4001 precedent):

1. **Executive Summary**: variance magnitude, attribution (config % / architectural %)
2. **Confirmed Defects**: ID, severity, defect, evidence (cell or output field), suspected code location
3. **Architecture Review Questions**: schema, waterfall engine, tax engine, output completeness, reconciliation framework
4. **Reconciliation Detail**: line-by-line Trace vs HDC variance with attribution
5. **Recommended Path Forward**: phased — config fixes, code audit, targeted IMPLs, regression harness, validate
6. **Long-term needs**: what the fund requires HDC to support
7. **Asks**: confirm sprint capacity, authorize audit, decide incremental vs refactor, IC timing independence

Write the memo as a new sheet (`HDC_Bug_Memo`) in the project workbook with red tab color. Banner uses `#2E5597` with white text. Section headers same color. Each defect row gets cell-level evidence (e.g., `Exit!B10`) and the canonical expected behavior.

Update `Project_Status` with:
- HDC issues section showing each defect with FIXED / PENDING / DEFERRED status
- Post-Fix Follow-Ups section listing: re-export validation, any pending config fixes (e.g., investor type toggle), reconciliation harness if not yet built

**Done when:** HDC_Bug_Memo sheet exists with all 7 sections, and Project_Status reflects the open IMPLs. Each follow-up todo has a cell note with detailed procedure / spec / acceptance criteria so anyone picking it up cold can execute.

### Step 9: Hand off IMPL tickets to Claude Code

For each architectural defect, draft a one-page spec:
- Defect summary (1-2 sentences)
- Evidence (canonical expected vs HDC actual, with concrete numbers)
- Suspected code location
- Acceptance test: this canonical fixture should produce these outputs within tolerance

Send to Claude Code via send_message. Track returned IMPL numbers in HDC_Bug_Memo Status Update section.

**Done when:** Each architectural defect has a spec sent and an IMPL tracking number recorded.

### Step 10: After IMPLs land, re-validate

For each IMPL closed:
- Confirm HDC build includes the fix (check version / SHA)
- Re-export Trace through fixed HDC
- Re-run Step 5 diff
- Update Project_Status: defect FIXED with IMPL reference
- Update HDC_Bug_Memo Status Update section

If reconciliation still fails after all IMPLs, return to Step 6 — there are more defects to find.

**Done when:** All defects FIXED, full reconciliation passes the success bar, project moves to LP marketing.

## Standing requirements (regardless of deal)

- **Investor-type preset toggle** (Phase 1): every HDC run must record which investor type was assumed. If toggle isn't yet in HDC, record it manually in the reconciliation sheet so the assumption isn't invisible.
- **Reconciliation harness** (Phase 4): canonical fixtures should accumulate. Each closed reconciliation contributes its inputs and expected outputs as a regression test for HDC's CI.

## Anti-patterns to avoid

- **"Trace as workaround" trap**: Don't accept "Trace is canonical, HDC just exports for show." That hides architectural defects. If HDC can't produce numbers within tolerance, that's a real problem to file, not a feature to route around.
- **Acceptable-by-magnitude rationalization**: Don't classify a $1.49M cash flow leak as "small relative to the deal." Sweep gaps compound across deals. Flag it.
- **Silent input fudging**: If you adjust an input to make HDC tie to canonical without understanding why, you've masked a defect. Always classify the gap before fixing it.

## Examples

### Trace 4001 (precedent)
- Reconciliation found 9.6pp IRR variance
- Classification: 90% config (HNW vs C-corp tax rate default) + 10% architectural (3 defects)
- IMPLs: 164 (PAB exit), 165 (% cash sweep), 166 (DDF/C-note)
- After IMPLs: architectural variance dropped to <1pp; config gap remains until investor-type toggle ships
- Memo and Project_Status updates produced from the same workflow this skill encodes
