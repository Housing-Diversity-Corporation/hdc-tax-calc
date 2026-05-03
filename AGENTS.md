Use 'bd' for task tracking. Before starting any work:
1. Run `bd ready` to see available tasks
2. Run `bd q "<description>"` to create and capture the task (returns an ID)
3. Read VALIDATION_PROTOCOL.md, UI_NAVIGATION_MAP.md, and
   RUNTIME_UI_VERIFICATION.md before any implementation or
   runtime verification
   BACKEND_ENTITY_REGISTRY.md — living schema snapshot of all deployed
   backend entities, columns, and endpoints. Read before any IMPL that
   adds backend fields or touches API integration. Update when Angel adds
   fields to any entity class.

## Specification Documents

All platform specifications live in `frontend/docs/specs/`. Read the
relevant spec before beginning any IMPL in its domain.

| Spec | Domain | Read When |
|---|---|---|
| HDC_Tax_Benefits_Program_Spec_v1_5.md | Platform overview, roadmap, statutory authority | Start of any new workstream |
| HDC_Canonical_Deal_Schema_Spec_v1_0.md | Deal schema, 112 fields, PostgreSQL DDL | Any deal data or schema work |
| HDC_Platform_Product_Roadmap_v2_0.md | Seven-track build sequence | Planning or architecture decisions |
| HDC_Deal_Snapshot_Versioning_Spec_v1_0.md | Snapshot tables, publish transaction | Any snapshot or versioning work |
| HDC_Investor_Onboarding_Subscription_Spec_v1_0.md | Investor tables, subscription, DocuSign | Any investor-facing work |
| HDC_Deal_Pipeline_Screening_Spec_v1_0.md | Three-gate pipeline, API contracts | Any pipeline or ingestion work |

### Spec Update Protocol
If an IMPL changes behavior described in a spec, update the spec
file in `frontend/docs/specs/` in the same commit. Spec and code
stay in sync. Never commit a behavior change without updating the
spec that governs it.

## Registry Documents
`frontend/docs/registry/` contains index files maintained by
Brad and Chat — not by CC. Do not modify these files.

- `HDC_Spec_Ecosystem_Index.md` — architectural decisions, open issues, session artifacts
- `HDC_Project_Knowledge_Catalog_v1_3.md` — description of every document in the ecosystem
- `SESSION_END_CHECKLIST.md` — seven-question checklist run at end of every session

## Reference Documents
`frontend/docs/reference/` contains operational reference documents. Read before making any infrastructure, deployment, or environment decisions.

| Document | Read When |
|---|---|
| HDC_Infrastructure_Reference_v3_0.md | Any infrastructure question, AWS change, or server issue |
| Brad_Ops_Runbook_v2_0.md | Any deployment, startup, or local dev question |

CRITICAL RULES (from Brad_Ops_Runbook_v2_0.md §16):
- If production is working, do not change infrastructure to fix a local dev problem
- Never modify OAuth config, S3 bucket, nginx, or SSL without reading the fragile configs section first
- Describe what you want to accomplish — not how to do it

4. On completion, run `bd close <id>` and update
   SPEC_IMPLEMENTATION_REGISTRY
5. Do not request commit approval with any DoD item incomplete
6. Runtime verification is mandatory for all UI-touching IMPLs —
   report actual screen values before requesting commit approval

---

## IMPL Prompt Template

Use this template structure for any task framed as `IMPL-<N>`. The
template enforces audit-before-coding, manual math verification, and
end-to-end runtime checks — required because the tax-benefit math has
no second reader and stale code or unverified arithmetic produces
plausible-looking wrong answers.

When NOT to use: chore work (server restarts, env setup, config tweaks,
doc edits, debugging conversations). Overkill for non-implementation
work.

```
BEAD TRACKING
bd q "<brief description of task>"
Claim this bead before starting. Close after commit.

---

CONTEXT

Required reading:
- <file:line range>
- <file:line range>
- <relevant spec or doc>

<2-3 sentence description of what this IMPL does and why. Include the
problem being solved and the expected outcome. Reference any prior IMPLs
this depends on or relates to.>

---

AUDIT FIRST

Before any code changes, audit the current state of the relevant code
paths and report findings:

1. <What to audit — e.g., "Locate and paste the current implementation
   of <function> in full">
2. <What to audit — e.g., "Confirm <param> is accessible at the
   insertion point — paste surrounding context (±10 lines)">
3. <What to audit — e.g., "List all current <step types / field names /
   waterfall priorities / enum values> in scope">
4. <What to audit — e.g., "Confirm no prior IMPL has already addressed
   this — grep for <term> and report all hits">

Do not proceed to BLOCKERS FIRST until audit findings are reported.
If audit reveals the implementation differs materially from what CONTEXT
describes, stop and report before writing any code.

---

BLOCKERS FIRST

Before writing any code:

1. <grep command to confirm key variable/function is in scope>
grep -n "<term>" <file> | head -20

2. <grep command to confirm no conflicting implementation exists>
grep -rn "<term>" frontend/src/ --include="*.ts" --include="*.tsx" | head -20

3. <grep command to locate insertion point or call site>
grep -n "<term>" <file> | head -20

4. <grep command to confirm new field/param does not already exist>
grep -rn "<term>" frontend/src/ --include="*.ts" --include="*.tsx"

---

INDEPENDENT MATH VERIFICATION

Before coding, verify these scenarios manually and report results:

Scenario A — <label>:
- Input: <value>, <value>, <value>
- Expected output: <value>
- Show arithmetic step by step

Scenario B — <label>:
- Input: <value>, <value>, <value>
- Expected output: <value>

Scenario C — Zero/default regression:
- All new params at zero or default
- All outputs identical to pre-IMPL baseline

---

REQUIRED CHANGES

FILE 1: <filename>

<Outcome-focused description. What must be true after the change, not
how to implement it. Paste corrected code blocks only where the fix is
surgical and unambiguous.>

FILE 2: <filename>

<Same pattern — outcome first, code only where necessary.>

FILE 3: <filename — UI if applicable>

Locate correct component before modifying:
grep -rn "<relevant term>" frontend/src/components/ --include="*.tsx" | head -20

<UI outcome description. Input labels, binding, conditional display logic.>

PROP CHAIN — if new params added, wire through all layers:
grep -rn "<new param name>" frontend/src/ --include="*.ts" --include="*.tsx" | head -20

Mirror the pattern used for <reference param from prior IMPL>.

---

TESTS REQUIRED

Add <N> tests to <existing test file or new file>:

1. <Test name>: <inputs> — verify <expected output> (±<tolerance> tolerance)
2. <Test name>: <inputs> — verify <expected output>
3. <Test name>: <edge case> — verify <expected behavior>
4. Zero/default regression: all new params at 0 or default — verify
   all outputs identical to pre-IMPL baseline values

All existing tests must pass.
Baseline: <N> suites, <N> tests, 0 failures.

---

DEFINITION OF DONE

- [ ] Audit findings reported before any code written
- [ ] Audit confirms no material discrepancy with CONTEXT — if it does,
      CC stopped and reported before proceeding
- [ ] All grep blockers executed and results reported
- [ ] Scenarios A, B, C math verified and reported before coding
- [ ] <File 1> changes surgical — only lines <range>
- [ ] <File 2> updated
- [ ] <File 3> UI inputs added — <specific display condition if any>
- [ ] Full prop chain wired if new params added
- [ ] <N> new tests added and passing
- [ ] Full test suite: 0 failures
- [ ] End-to-end: run dev server — set <param> to <value> — report
      actual screen value for <output> (must be ~<expected>)
- [ ] End-to-end: set all new params to 0/default — confirm outputs
      identical to pre-IMPL baseline
- [ ] git status + git diff --stat reviewed before commit
- [ ] SPEC_IMPLEMENTATION_REGISTRY updated with IMPL-<N>
- [ ] Bead closed after commit
```
