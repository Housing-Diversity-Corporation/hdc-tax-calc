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

All referenced docs live in `frontend/docs/`:
- `VALIDATION_PROTOCOL.md`, `VALIDATION_SCENARIOS.md`,
  `LIVE_EXCEL_SYNC_PROTOCOL.md`, `RUNTIME_UI_VERIFICATION.md`,
  `debugging-patterns.md`
- Constitution docs at `frontend/docs/constitution/`:
  `CALCULATION_ARCHITECTURE.md`, `BACKEND_ENTITY_REGISTRY.md`,
  `CAPITAL_STACK_STANDARDS.md`, `DEV_ENVIRONMENT_STARTUP.md`,
  `GIT_WORKFLOW.md`

```
BEAD TRACKING
bd q "<brief description of task>"
Claim this bead before starting. Close after commit.

---

CONTEXT

Required reading (always include):
- VALIDATION_PROTOCOL.md — mandatory for every IMPL
- VALIDATION_SCENARIOS.md — update after any IMPL that adds or changes scenarios
- <file:line range>
- <file:line range>
- <relevant spec or doc>

Conditional required reading (include when applicable):
- LIVE_EXCEL_SYNC_PROTOCOL.md — any IMPL touching audit export or
  CalculationParams fields
- RUNTIME_UI_VERIFICATION.md — any IMPL touching UI components, hooks,
  or display logic
- debugging-patterns.md — any IMPL investigating unexpected behavior

<2-3 sentence description of what this IMPL does and why. Include the
problem being solved and the expected outcome. Reference any prior IMPLs
this depends on or relates to.>

Spec writing doctrine: tight on outcomes, loose on implementation.
REQUIRED CHANGES below defines what must be true after the change —
not which files to edit or how to implement it.

---

COORDINATION NOTES

- Branch: main
- Dependency: <prior IMPL number and commit, or "none">
- Parallel work: <any other active beads or IMPLs that touch
  overlapping files, or "none">
- <Any other coordination flags — e.g., "Angel no longer available
  for backend work — Brad owns Java/Spring Boot">

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
grep -rn "<term>" frontend/src/ --include="*.ts" --include="*.tsx" \
  | head -20

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
- Show arithmetic step by step

Scenario C — Zero/default regression:
- All new params at zero or default
- All outputs must be identical to pre-IMPL baseline

---

REQUIRED CHANGES

Outcome-focused only. Define what must be true after the change.
Do not prescribe which files to edit or how to implement unless the
fix is surgical and the exact lines are known. In that case, paste
the corrected block.

FILE 1: <filename>

<What must be true after this change. Expected behavior, not
implementation path.>

FILE 2: <filename>

<Same pattern.>

FILE 3: <filename — UI if applicable>

Locate correct render path before modifying — never assume which
component renders a UI section from types alone:
grep -rn "<relevant term>" frontend/src/components/ \
  --include="*.tsx" | head -20

<UI outcome: what the user must see, what inputs must exist, what
display conditions apply.>

PROP CHAIN — if new params added, wire through all layers in this
order and no other:
- types/taxbenefits/index.ts (field declaration)
- calculations.ts (destructure + logic)
- useHDCState.ts (state var + return)
- useHDCCalculations.ts (props interface + engine pass-through)
- HDCCalculatorMain.tsx (state destructure + props)
- HDCInputsComponent.tsx (props interface + pass-through)
- Target UI component (input binding)

Mirror the exact pattern used for <reference param from prior IMPL>.

grep -rn "<new param name>" frontend/src/ \
  --include="*.ts" --include="*.tsx" | head -20

---

TESTS REQUIRED

Add <N> tests to <existing test file — grep to locate> or new file:

1. <Test name>: <inputs> — verify <expected output>
   (±<tolerance> tolerance)
2. <Test name>: <inputs> — verify <expected output>
3. <Test name>: <edge case> — verify <expected behavior>
4. Zero/default regression: all new params at 0 or default — verify
   all outputs identical to pre-IMPL baseline values

All existing tests must pass.
Baseline: <N> suites, <N> tests, 0 failures.

---

DEFINITION OF DONE

Standard items (every IMPL):
- [ ] Audit findings reported before any code written
- [ ] Audit confirms no material discrepancy with CONTEXT — if it
      does, CC stopped and reported before proceeding
- [ ] All grep blockers executed and results reported
- [ ] Scenarios A, B, C math verified and reported before coding
- [ ] Required changes are outcome-verified — not just coded
- [ ] <N> new tests added and passing
- [ ] Full test suite: 0 failures
- [ ] Item 11: git status + git diff --stat reviewed before commit —
      diff must show only the expected files
- [ ] Item 12: SPEC_IMPLEMENTATION_REGISTRY updated with IMPL-<N>
      entry in same commit
- [ ] VALIDATION_SCENARIOS.md updated if any scenarios added
      or changed

UI items (include when IMPL touches UI, hooks, or display logic):
- [ ] Item 13: Dev server started — full end-to-end user workflow
      completed — actual screen values reported for all affected
      outputs before committing. Tests passing is not sufficient.
      A feature that exists in the engine but is invisible to the
      user is not done.
- [ ] RUNTIME_UI_VERIFICATION.md procedure followed

Spec update items (include when IMPL changes documented behavior):
- [ ] Item 14: Any spec in frontend/docs/specs/ whose described
      behavior this IMPL changes has been updated in the same commit
- [ ] Item 15: Updated spec filename(s) listed in completion report
      alongside modified code files

Export items (include when IMPL touches CalculationParams or export):
- [ ] LIVE_EXCEL_SYNC_PROTOCOL.md four rules verified:
      Rule 1 — new CalculationParams field appears in export params
               object (exportParamsSync.test.ts enforces)
      Rule 2 — no || for numeric fallbacks — use ?? only
      Rule 3 — no hardcoded input values in sheet builders
      Rule 4 — timeline-derived fields read from rawTimeline,
               not params

End-to-end verification:
- [ ] Run dev server — set <param> to <value> — report actual
      screen value for <output> (must be ~<expected>)
- [ ] Set all new params to 0/default — confirm all outputs
      identical to pre-IMPL baseline

Final:
- [ ] Constitution checked — if new files created or architecture
      changed, CALCULATION_ARCHITECTURE.md (frontend/docs/constitution/)
      updated
- [ ] Bead closed after commit — not before
```
