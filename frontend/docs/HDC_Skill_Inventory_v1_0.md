# HDC Skill Inventory
## v1.0 — May 2026

Living document. Update whenever a skill is added, revised, or retired.
Skills live at `/mnt/skills/user/` in the Claude project environment,
sourced from the repo at `frontend/docs/skills/[skill-name]/SKILL.md`.

---

## Active Skills

### proforma-to-tax-benefits
**Version:** 1.1
**Added:** April 2026
**Last updated:** May 2026 (version header added)
**Location:** `/mnt/skills/user/proforma-to-tax-benefits/SKILL.md`
**Repo path:** `frontend/docs/skills/proforma-to-tax-benefits/SKILL.md`

**What it does:**
Standardizes a sponsor-provided LIHTC proforma, runs it through the
HDC tax benefits app, and reconciles the export against the canonical
model. Surfaces architectural defects and produces an IC-ready bug memo
when reconciliation fails. Covers the full 10-step CIE workflow from
proforma intake through IMPL ticket handoff.

**When triggered:**
Manually, when a sponsor proforma arrives for a new deal. Not
auto-triggered — Brad or Chat loads it explicitly at deal intake.

**Precedent deals:**
- Trace 4001 (April 2026): 9.6pp IRR variance found; surfaced IMPL-164,
  165, 166. Set the reconciliation tolerance standards.
- Queenswood Phase II (May 2026): surfaced canonical schema v1.1 gaps
  (IMPL-185, 186, forgivable debt, per-tranche schema).

**Known gaps / evolution candidates:**
- Does not yet handle Scenario B deals (HDC as asset manager, not
  developer). Update when IMPL-192 ships.
- Tolerance thresholds (0.5pp IRR, 1% CF) set from Trace. May need
  revision as more deals accumulate.
- Step 3 (canonical reference build) assumes Trace-style Excel template.
  Update when canonical schema live and proforma engine ships.

**Trigger for next revision:**
Any new deal that exposes a proforma construct the skill can't map,
or when IMPL-192 (Scenario B) ships.

---

### math-reference-update
**Version:** 1.0
**Added:** May 2026
**Last updated:** May 2026 (initial)
**Location:** `/mnt/skills/user/math-reference-update/SKILL.md` *(pending deployment)*
**Repo path:** `frontend/docs/skills/math-reference-update/SKILL.md`

**What it does:**
Audits `AHF_Mathematical_Reference_v[current].md` against the engine
codebase whenever a calculation file changes. Runs a 4-point check
(line references, formula logic, constants, status flags) for each
affected section. Makes targeted updates and commits them in the same
push as the triggering IMPL.

**When triggered:**
Automatically at DoD time (Item 14) when `git diff --name-only` shows
any of 15 trigger files including `calculations.ts`,
`investorTaxUtilization.ts`, `depreciationSchedule.ts`, and related
engine files.

**Trigger files (15 total):**
calculations.ts, investorTaxUtilization.ts, depreciationSchedule.ts,
lihtcCreditCalculations.ts, stateLIHTCCalculations.ts,
preferredEquityCalculations.ts, poolAggregation.ts, investorSizing.ts,
fundSizingOptimizer.ts, xirrCalculation.ts, sCurveUtility.ts,
investorFit.ts, territorialTaxCalculations.ts, iraConversion.ts,
taxCapacity.ts

**Reference files maintained:**
- `AHF_Mathematical_Reference_v[current].md`
- `AHF_Math_Reference_Gap_Analysis_v[current].md`
- `AHF_MathRef_Outline_v[current].md`

**Known gaps / evolution candidates:**
- Does not yet handle v4.0 structural rewrite (three-state
  architecture). Update when Phase B4 and canonical schema ship.
- Trigger file list will grow as new engine files are added
  (e.g., annualTaxCapacity.ts when Phase B4 ships).
- New section drafting requires Brad review — consider a lightweight
  approval workflow as IMPL volume increases.

**Trigger for next revision:**
First IMPL where the skill runs and produces an incorrect or incomplete
audit result. Also update trigger file list when Phase B4 ships.

---

## Skill Evolution Protocol

### When to update a skill

A skill should be revised when any of the following occur:

| Signal | Action |
|---|---|
| Skill runs but misses a step or produces wrong output | Targeted patch — fix the specific gap |
| New deal type or IMPL pattern not covered by skill | Add to workflow or anti-patterns |
| Tolerance threshold needs revision | Update success bar with rationale |
| A trigger condition is missing | Add to trigger list |
| An anti-pattern is discovered in practice | Add to anti-patterns section |
| A new skill is built that overlaps with an existing one | Clarify "when NOT to use" sections |

### How to update a skill

1. **Identify the gap** in the session where it's discovered. Note it
   explicitly: "The proforma skill doesn't handle X."

2. **Draft the patch** — Chat proposes the targeted change to the
   relevant skill section. Same surgical-fix principle as code.

3. **Update the changelog** in the skill header: add the new version,
   date, and one-line description of what changed.

4. **CC commits** the updated SKILL.md to the repo in a dedicated
   commit: `docs: skill proforma-to-tax-benefits v1.2 — [description]`

5. **Update this inventory** — update the version, last updated date,
   and known gaps section for the affected skill.

### Versioning convention for skills

| Change type | Version bump | Example |
|---|---|---|
| Minor gap fix, anti-pattern added | Patch: v1.0 → v1.1 | New anti-pattern from Queenswood |
| New workflow step added | Minor: v1.0 → v2.0 | Scenario B handling added to proforma skill |
| Full rewrite | Major: v1.0 → v2.0 | Skill rebuilt for new platform architecture |

### Where skills live

```
Repo:    frontend/docs/skills/[skill-name]/SKILL.md
Runtime: /mnt/skills/user/[skill-name]/SKILL.md
```

Skills are deployed from repo to runtime by CC as part of the
repo maintenance workflow. When a skill is updated in the repo,
CC redeploys to the runtime path in the same commit.

---

## Planned Skills (not yet built)

| Skill | Purpose | Trigger | Priority |
|---|---|---|---|
| impl-cc-prompt-builder | Given a spec and IMPL number, build a standards-compliant CC prompt with all required sections, math verification, and DoD | Manual — Brad or Chat at spec-complete stage | Medium |
| oz-inclusion-event-analysis | Given deal parameters and FMV analysis, compute net OZ inclusion event exposure for all active OZ 1.0 deals | Manual — December 2026 deadline approaching | High |
| canonical-schema-seed | Given a proforma or deal summary, populate canonical schema fields for a new deal record | Manual — when canonical schema ships (IMPL-186) | High |
| scenario-b-fee-architecture | Model Scenario B (HDC as asset manager) fee stack: devFeeHDCShare, AUM fee, tax-exempt interest | Manual — when IMPL-192 spec is written | Medium |

---

## Retired Skills

*None yet.*

---

*HDC_Skill_Inventory_v1_0.md | Internal | May 2026 | Confidential*
