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
