# HDC Project Knowledge Catalog
## Complete Suite Reference — May 2026

**Version:** 1.4
**Purpose:** Substantive description of every document in the HDC project knowledge ecosystem — what it contains, what decisions it records, and why it is load-bearing for the project. Covers both Claude Chat project knowledge files and the synced GitHub repo (`frontend/docs/` and subdirectories).

**State:** Post-May 4, 2026 cross-app reference addition. 23 project knowledge documents + 18 repo engineering process documents = 41 total.

---

## Group 1 — Platform Calculator: What Is Built

The live HDC Tax Benefits Platform — 86,000+ lines, React/TypeScript/Spring Boot, IMPL-160, tests current as of 2026-04-08.

---

### HDC Tax Benefits Spec v6.0
`[Project Knowledge]`

The primary CC implementation specification for the tax benefits calculator. Contains every function signature (`calculateFullInvestorAnalysis()`, `calculateTaxUtilization()`, `calculateExitTax()`, `computeTimeline()`, and ~40 others), TypeScript interface definitions for `CalculationParams`, `InvestorAnalysisResults`, `BenefitStream`, and all sub-types, CC prompt structure and DoD standards, and test scenario tables with expected numeric outputs. This is the document a Claude Code agent reads to build or modify the engine. Everything calculation-specific lives here and nowhere else.

**Why it matters:** It is the single source of truth for the calculation engine. Any discrepancy between this spec and the codebase is a bug. Any change to how a benefit is calculated must be reflected here before CC builds it.

---

### OZ 2.0 Master Specification v11.0
`[Project Knowledge]`

The institutional-grade reference document for the complete platform. Written for Novogradac, Sidley Austin, and wealth managers. Covers the business model and investor thesis, full §42 LIHTC mechanics, §168(k) bonus depreciation, §1400Z-2 OZ deferral and exclusion, the four-layer value hierarchy, capital structure conventions, and the full history of platform corrections — including the §38(c)(4)(B)(iii) specified credit finding, the §752 OZ basis exclusion correction, and the passive depreciation rate fix (37% to 40.8% for non-REP investors). Contains deal-level validation scenarios for Trace 4001.

**Why it matters:** When a partner, advisor, or auditor needs to understand the platform's tax positions, they read this. It is also the historical record of corrections that prevents the project from reverting to prior wrong answers.

---

### OZ 2.0 Addendum v9.3
`[Project Knowledge]`

The 56-jurisdiction data layer for the Master Spec. Contains state income tax rates, bonus depreciation conformity table, OZ conformity by state, state LIHTC program availability and credit rates, and prevailing wage rules by state.

**Why it matters:** The platform models 56 jurisdictions. Without this, state tax calculations have no authoritative data source.

---

### HDC Tax Benefits Program Spec v1.5
`[Project Knowledge → moving to repo /docs/specs/]`

The program-level overview and routing document. Explains what the platform is and what it is built for (§1-3), describes all six platform screens (§13A), maps implementation status by phase and IMPL range (§14), contains the full platform roadmap (§16), statutory authority reference table (§17), and known-correct tax law corrections (§18). Updated April 2026 to add five new §16.2 workstreams and retire the Platform Vision v1.0 reference.

**Why it matters:** Answers "what is this platform and where does it stand?" New sessions open here first.

---

### Tax Efficiency Mapping Spec v1.2
`[Project Knowledge]`

Specification for the 3.1M-combination batch analysis engine. Defines six input dimensions, the 1,064,448-combination first batch run against Trace 4001, the Roth conversion sub-loop for REP+grouped profiles, output schema per row, and five-dimension investor fit scoring. Step 3 batch validation is the next open action.

**Why it matters:** The data engine behind Caprock segmentation conversations and the efficiency frontier maps.

---

### Multi-Profile Portfolio Manager Spec v2.1
`[Project Knowledge]`

Specification for Screen 6 — the wealth manager's portfolio management interface. Defines dual-persona model, portfolio table architecture, deal selector, batch export, and backend schema mapping to the deployed `tax_benefits` normalized schema. Engine fully deployed; no UI code exists.

**Why it matters:** The Caprock-facing feature. Without it the platform is single-profile.

---

### Sizing Optimizer AMT Addendum v1.0
`[Project Knowledge]`

Targeted specification for a §38(c) calculation gap — the current engine omits prong (A) tentative minimum tax. Specifies the corrected two-prong computation. Status: pending Daniel Altman (Sidley Austin) review before any IMPL is assigned.

**Why it matters:** Until resolved, the sizing optimizer overstates the credit ceiling for a specific investor segment.

---

## Group 2 — Platform Architecture: Where It Is Going

---

### HDC Platform Product Roadmap v2.0
`[Project Knowledge → moving to repo /docs/specs/]`

Seven-track architecture from tax benefits calculator to fund administration system. Each track has phases with deliverables, build sequence, and dependency mapping. Seven strategic principles governing all build decisions. Supersedes Platform Vision v1.0.

**Why it matters:** Any question about what to build next and in what order is answered here.

---

### HDC Canonical Deal Schema Spec v1.0
`[Project Knowledge → moving to repo /docs/specs/]`

The rosetta stone for all field definitions. Defines all 112 fields across five source categories. Section 8 contains full PostgreSQL DDL for 13 deal tables. Section 9 defines TypeScript interfaces. Section 10 (patched per CIE Audit Entry 1.0) defines the multi-agent CIE workflow in full.

**Why it matters:** No database tables are built until Angel reviews this. The typed contract all other specs reference for field definitions.

---

### HDC Deal Snapshot and Versioning Spec v1.0
`[Project Knowledge → moving to repo /docs/specs/]`

Specification for the immutable audit architecture for published deal models. Three-layer model: mutable current state, append-only change log, immutable snapshots at publish events. Contains PostgreSQL DDL for `deal_snapshots`, `deal_change_log`, and `engine_versions`. Nine-step atomic publish transaction with full rollback on failure.

**Why it matters:** The legal defense layer. Without this, republishing a deal overwrites what investors were shown.

---

### HDC Investor Onboarding and Subscription Spec v1.0
`[Project Knowledge → moving to repo /docs/specs/]`

Track 4 full spec — investor lifecycle from first engagement through signed subscription. PostgreSQL DDL for all investor tables. Accreditation verification (90-day window). DocuSign integration. Model update notification (30-day acknowledgment window). Capital call tracking, document management, communication log.

**Why it matters:** Defines everything Angel needs to build the investor-facing layer.

---

### HDC Deal Pipeline Screening Spec v1.0
`[New — to be committed to repo /docs/specs/]`

Specification for the three-gate automated deal screening pipeline. Sourced from Angel's architecture memo (April 10, 2026). Three gates: Gate 1 (HDC Map API spatial qualification — OZ/QCT/DDA), Gate 2 (Tax Benefits Platform feasibility — DSCR, PAB threshold, capital stack), Gate 3 (investment quality score via `GET /api/deal-conduits/{id}/stack-rank`). Documents the separate services architecture (Map App on PostGIS/EC2, Tax Benefits Platform on RDS), API contracts for both pipeline endpoints, and data flow. The two endpoints (`POST /api/deal-conduits/from-proforma`, `GET /api/deal-conduits/{id}/stack-rank`) are specced but not yet built.

**Why it matters:** First formal specification of the deal ingestion pipeline connection points. Without it, Items 7 and 8 from Angel's backend task list have no spec to build against.

---

### HDC Deal Ingestion Engine Spec v1.0
`[Project Knowledge]`

Specification for the CIE-based deal intake workflow. Multi-agent CIE architecture, three-tier confidence scoring, and the standard ingestion prompt (§5). Supersedes v0.1.

**Why it matters:** CIE reduces deal intake from 2-4 hours to 15-30 minutes — but only if the standard prompt is a fixed artifact.

---

### CIE Capability Audit Log v1.0
`[Project Knowledge]`

Empirical foundation for all CIE integration spec assumptions. Records what CIE can and cannot do as of April 11, 2026. Next audit due July 11, 2026.

**Why it matters:** Every CIE spec assumption traces back to this document.

---

### HDC Proforma Engine Spec v2.0
`[Project Knowledge]`

Three-layer engine spec to replace deal-specific Excel waterfall models. Seven-phase build sequence. Ship-readiness assessment classifies CI/CD and object-level authorization as "Must Ship" before external users access the platform.

**Why it matters:** Eliminates 2-4 hours of manual re-entry per deal. Also formally documents the two pre-launch blockers.

---

### HDC Integration Spec v0.1
`[Project Knowledge]`

Typed contract between the proforma engine and the Tax Benefits Platform. Defines `publishToTaxBenefitsPlatform()` pure mapping function. Thin stateless mapper — if either system's schema changes, only the mapper updates.

**Why it matters:** Without this contract, changes to either engine silently break the integration.

---

### Map App Integration Reference v1.1
`[Repo — frontend/docs/reference/MAP_APP_INTEGRATION_REFERENCE.md]`

Cross-app reference describing the HDC Map app's capabilities, integration surface, and Slate memo coverage status from the Tax Benefits side. Contains the Angel-confirmed architectural premise (separate apps, separate databases, API-only contract), the Map app capability summary (33 spatial layers, parcel intelligence, LLM/RAG layer, user/personalization, admin/ops), Slate memo coverage verification (5 of 9 capabilities built, 4 reframed as "in development pipeline"), and the five-phase Track 8 cross-app integration surface. Also documents Track 9 continuous validation via the proforma-to-tax-benefits CIE skill loop. Companion document `TAX_BENEFITS_APP_INTEGRATION_REFERENCE.md` lives in the Map repo at `docs/`.

**Why it matters:** Lets Chat and CC plan and execute Track 8 integration work without re-auditing the Map app each session. The April-9 audit showed how a stale reference can anchor an entire planning session to the wrong baseline. Updated per Cross-App Sync Protocol when either app changes.

---

## Group 3 — Tax Law and Legal Reference

---

### HDC Tax Provisions Reference v1.0
`[Project Knowledge]`

Comprehensive inventory of every IRC section the platform models across four groups: Core Benefit Generation, Opportunity Zone, Tax Utilization and Limitations, Exit Tax. For each: provision name and exactly how the platform implements it.

**Why it matters:** At-a-glance reference for any tax law question about platform scope.

---

### Tax Counsel Verification rev2
`[Project Knowledge]`

Written research findings from Daniel Altman (Sidley Austin) covering six specific tax questions with statutory analysis, regulatory citations, confidence assessments, and platform implications. Contains open questions still pending Altman response.

**Why it matters:** The "Big Law said so" layer behind the platform's tax positions.

---

## Group 4 — Fund Operations

---

### AHF Deal Sourcing Brief v1.1
`[Project Knowledge]`

Operational sourcing playbook for AHF Fund I. Four-lane taxonomy with risk profiles, economics, execution requirements. Soft source decision framework. Current pipeline: Trace 4001 (195 units, Lane 1), 4448 California Ave SW (88 units, Lane 1), 701 S Jackson (202 units, Lane 4). 485 total units, $200M+ capitalization.

**Why it matters:** The document the sourcing team works from.

---

### ROFR Memo v2
`[Project Knowledge]`

Right-of-first-refusal legal analysis by Megan Riess (Longwell Riess). Reference for deal structuring conversations involving ROFR provisions in Lanes 2 and 3.

---

## Group 5 — Go-to-Market and Strategy

---

### HDC Strategy and Execution Plan v3.1
`[Project Knowledge]`

Business execution roadmap for AHF Fund I market launch. HDC as transition capital partner, the new individual investor LIHTC market, seven competitive advantages, Q1 2026 objectives, distribution strategy (Fortis, Caprock, aggregators), $25M ARR self-funding path, IP protection sequencing. Platform metrics embedded throughout.

**Why it matters:** Business context for every technical and deal decision.

---

## Group 6 — Registry and Process

---

### HDC Spec Ecosystem Index
`[Project Knowledge → moving to repo /docs/registry/]`
*(formerly named SPEC_REGISTRY_NOTES.md in Chat — renamed to avoid collision with repo's CC-maintained SPEC_REGISTRY_NOTES.md)*

Master index of the spec ecosystem maintained by Brad and Chat. Contains: companion document version table, archived document log, open architectural issues (17 items with owner and priority), session artifacts log, pending constitution update items, and version sync log. Updated at the end of sessions that produce new specs or close architectural decisions.

**Why it matters:** The single place that tracks what exists at the project level, what has changed, and what is unresolved across sessions.

---

### SPEC_IMPLEMENTATION_REGISTRY v4.2 Update
`[Project Knowledge]`

IMPL-level build tracker covering IMPL-120 through IMPL-128 (Tax Efficiency Mapping workstream). Current baseline in this file: IMPL-153. Note: the repo's `SPEC_REGISTRY_NOTES.md` and `IMPLEMENTATION_TRACKER.md` are more current — they reflect IMPL-160 as of 2026-04-08.

**Why it matters:** Session reference for IMPL history. The repo files are authoritative for current state.

---

## Group 7 — Repo Engineering Process Documents

These documents live in the GitHub repo under `frontend/docs/` and are synced into project knowledge. They govern how CC works on every session.

---

### frontend/docs/VALIDATION_PROTOCOL.md
`[Repo — frontend/docs/]`

The pre/post implementation validation checklist. Pre-implementation: read relevant source files, understand data flow, check types and interfaces, review IMPLEMENTATION_TRACKER.md, check debugging-patterns.md. Post-implementation: run full test suite, manual UI verification, update IMPLEMENTATION_TRACKER.md. Three mandatory DoD line items: Item 11 (git status + git diff --stat before commit), Item 12 (update SPEC_IMPLEMENTATION_REGISTRY), Item 13 (for any UI-touching IMPL, CC must run the dev server and report actual screen values). Item 14 (new — to be added): if IMPL changes behavior described in a spec in `/docs/specs/`, update that spec in the same commit. Runtime UI verification prerequisites: read UI_NAVIGATION_MAP.md first; update it after every session. Also contains: Crash Investigation Protocol (IMPL-159), Profile Persistence IMPLs checklist, npm Install protocol.

**Why it matters:** The checklist CC runs through at the end of every IMPL.

---

### frontend/docs/IMPLEMENTATION_TRACKER.md
`[Repo — frontend/docs/]`

Complete IMPL history in the repo — all IMPLs from IMPL-001 through IMPL-160, organized by phase. For each IMPL: description, status, date. Currently at v10.0. The SPEC_IMPLEMENTATION_REGISTRY in project knowledge is a slice; this file has everything.

**Why it matters:** Authoritative full IMPL history.

---

### frontend/docs/VALIDATION_SOP.md
`[Repo — frontend/docs/]`

Standard operating procedure for full platform validation. SDD role division, spec writing principles ("tight on outcomes, loose on implementation"), nine validation categories with recommended order A through I. Key conceptual distinctions: Property State is not Investor State; OZ Conformity is not State Income Tax; REP uses 37% rate only.

**Why it matters:** The spec writing doctrine. The distinction between bad spec (prescribes which files to edit) and good spec (defines the output and how to verify it) is what keeps CC implementations surgical.

---

### frontend/docs/VALIDATION_SCENARIOS.md
`[Repo — frontend/docs/]`

Validated scenario tracker — single source of truth for all scenarios confirmed correct. Currently 13 of 15+ scenarios validated (Production certified). Detailed validation point breakdowns for complex scenarios. CC must update this as part of DoD for any IMPL that adds or changes scenarios.

**Why it matters:** Prevents regression. The primary artifact for Novogradac and Sidley validation conversations.

---

### frontend/docs/LIVE_EXCEL_SYNC_PROTOCOL.md
`[Repo — frontend/docs/]`

Four rules for keeping the Live Excel export in sync with the engine. Created from IMPL-143 (2026-03-28) which encountered all five failure types in one session. Rule 1: every new `CalculationParams` field must appear in the export params object (enforced by `exportParamsSync.test.ts`). Rule 2: never use `||` for numeric fallbacks — use `??` (treats 0 as falsy). Rule 3: never hardcode input values in sheet builders — always reference `params`. Rule 4: timeline-derived fields (`placedInServiceMonth`, `constructionDelayMonths`) must read from `rawTimeline`, not `params` (normalization block overwrites params unconditionally). Includes five issue classification types (A through E) and a sync verification checklist.

**Why it matters:** The normalization overwrite bug (Type B) is non-obvious and has caused repeated failures. This protocol prevents recurrence. Any IMPL touching the audit export must follow these four rules.

---

### frontend/docs/RUNTIME_UI_VERIFICATION.md
`[Repo — frontend/docs/]`

Full AppleScript/Chrome runtime UI verification procedure, v1.2 (last updated 2026-04-06, IMPL-157). Defines when to use (React memoization fixes, display changes, input-output wiring, investor track switching, regression checks after changes to `useHDCCalculations.ts`, `calculations.ts`, `KPIStrip.tsx`, or `ReturnsBuiltupStrip.tsx`) and when not to use (pure backend changes, engine-only logic, CSS-only). Documents the one-time Chrome setup (Allow JavaScript from Apple Events), the verification harness in `frontend/scripts/ui-verify.sh`, and direct view navigation recipes added in IMPL-157.

**Why it matters:** More detailed than the VALIDATION_PROTOCOL.md reference to it. CC reads this before any session requiring runtime UI verification.

---

### frontend/docs/debugging-patterns.md
`[Repo — frontend/docs/]`

Catalog of debugging patterns that have caused multi-hour investigations. Patterns: Hidden Value Bug, Inverted Percentage Bug, Excess Reserve Diagnostic, Layer Trace Pattern, Sign Convention Error (ISS-052). Each pattern: symptoms, root cause, quick diagnostic, investigation steps, fix pattern.

**Why it matters:** Reduces debugging time from hours to minutes for recurring issue types.

---

### frontend/docs/AUDIT_PROCESS.md
`[Repo — frontend/docs/]`

Audit guide for the Excel export — designed for Novogradac and external auditors. Five-step process, Returns Buildup Strip verification checklist with expected values for the Trace $35M reference scenario, MOIC and IRR pass criteria (IRR within 0.5%, MOIC within 0.05x).

**Why it matters:** What Novogradac uses during audit.

---

### frontend/docs/DOCUMENTED_ASSUMPTIONS.md
`[Repo — frontend/docs/]`

Registry of all assumptions baked into the calculation engine requiring explicit decisions rather than following directly from statute. Entries: §461(l) W-2 exclusion, 32% marginal rate at $500K MFJ, §42(f)(1) unconditional election rationale, §752/OZ inclusion correction. Updated per commit 545c3ad.

**Why it matters:** Prevents assumptions from being silently changed or forgotten. Sizing Optimizer AMT Addendum DoD requires update when AMT fix ships.

---

### frontend/docs/UI_NAVIGATION_MAP.md
`[Repo — frontend/docs/]`

Living reference for CC runtime UI verification via AppleScript/osascript. App architecture (no URL routing — React state `currentView`, everything at `localhost:5173/`), authentication (`authToken` in localStorage), Chrome window targeting, verification harness. CC reads before any runtime UI verification and updates after every session. Last updated 2026-04-05 (IMPL-152).

**Why it matters:** Without this map, CC wastes time rediscovering selectors and patterns already documented.

---

### frontend/docs/constitution/CALCULATION_ARCHITECTURE.md
`[Repo — frontend/docs/constitution/]`

The single source of truth rule: all financial math in `calculations.ts` and related engine files; hooks pass values; components display values; export sheets write formula strings. Four-layer architecture. Sign convention standard, override anti-pattern, DSCR display standard. History table linking every architectural addition to the IMPL or ISS that prompted it.

**Why it matters:** The foundational rule CC must follow on every session. Violation has caused real bugs (IMPL-057: $72M displayed instead of $15M).

---

### frontend/docs/constitution/BACKEND_ENTITY_REGISTRY.md
`[Repo — frontend/docs/constitution/]`

Living snapshot of all deployed backend entities, columns, relationships, and endpoints. Version 1.0, Date 2026-04-08, Baseline IMPL-160. Documents the three-schema structure (`public`, `user_schema`, `tax_benefits`), Hibernate DDL-auto update configuration, HikariCP connection pool settings, and full entity inventory: `DealConduit` (4 columns, 8x `@OneToOne` children with `@JsonUnwrapped` for flat API response, 1x `@OneToMany` for `DealBenefitProfile`), `InputProjectDefinition`, `InputCapitalStructure`, `InputTaxCredits`, `InputOpportunityZone`, `InputInvestorProfile`, `InputProjections`, `InputHDCIncome`, `InputInvPortalSettings`, and `InvestorTaxInfo`. Update protocol: any IMPL adding or modifying backend entity fields must update this file before closing the bead.

**Why it matters:** Mandatory reading before any backend IMPL. Without it, CC cannot know the current deployed schema and will write against stale assumptions. The Java entities are source of truth; this file is the audit aid.

---

### frontend/docs/constitution/CAPITAL_STACK_STANDARDS.md
`[Repo — frontend/docs/constitution/]`

Unit conventions and capital stack coordination rules. All dollar values stored internally as millions ($M) — prevents off-by-1M errors. PAB-Senior Debt coordination logic: when PABs are enabled they replace conventional Senior Debt while maintaining the user's `mustPayDebtTarget` leverage; the three state variables (`mustPayDebtTarget`, `seniorDebtPct`, `pabFundingAmount`) and four coordination events are fully specified. Created from ISS-025 through ISS-038b.

**Why it matters:** The `|| vs ??` bug and unit confusion bugs are the two most common numeric errors in this codebase. This document prevents both.

---

### frontend/docs/constitution/DEV_ENVIRONMENT_STARTUP.md
`[Repo — frontend/docs/constitution/]`

Startup sequence for the dev environment. Solves the CC session isolation problem — sessions start fresh servers that auto-increment ports (5173 → 5174 → 5175). Defines the standard startup sequence: kill orphan processes, start backend first (Spring Boot on 8080, wait 30s), then frontend (Vite on 5173). Auth hangs silently if backend is not running — the most common dev environment issue.

**Why it matters:** CC sessions that start without following this protocol either hit auth failures or connect to stale servers on wrong ports, causing false test failures and confusing verification results.

---

### frontend/docs/constitution/GIT_WORKFLOW.md
`[Repo — frontend/docs/constitution/]`

Pre-commit audit protocol. Before any `git commit`: run `git status`, `git diff --stat`, `git log -1`. Report to user: number of modified/untracked files, summary by category, any files that appear unrelated to the task, date of last commit (flag if >1 day old). Discrepancy handling: if the user provides a commit message that doesn't match pending changes, flag it explicitly and ask whether to proceed, split into batches, or exclude files. Never commit without knowing what's being committed.

**Why it matters:** Prevents accidentally bundling unrelated work into a single commit. The example audit output in the document shows a real case where 38 files appeared unrelated to the stated task.

---

### Cross-App Sync Protocol v1.0
`[Repo — frontend/docs/registry/CROSS_APP_SYNC_PROTOCOL.md]`

Process protocol governing how the two cross-app reference docs (`MAP_APP_INTEGRATION_REFERENCE.md` here, `TAX_BENEFITS_APP_INTEGRATION_REFERENCE.md` in the Map repo) stay in sync as either app evolves. Defines trigger conditions (cross-app contracts, capability surface changes, architectural decisions, new track or phase work), update workflow (originating repo queues a CC prompt for the receiving repo), versioning convention (decimal for refinements, whole number for major shifts), cross-repo coordination mechanisms, sync verification at session start, and conflict resolution rules. Lives in both repos because it governs both. Manual workflow is the v1.0 baseline; skill automation deferred until pattern stabilizes.

**Why it matters:** Without this protocol, cross-app reference docs drift the moment one repo updates without the other. The protocol is the durable convention that keeps the two reference docs consistent across sessions.

---

### frontend/docs/audits/ (three audit reports)
`[Repo — frontend/docs/audits/]`

Three audit documents from January 2026: `CALCULATION-ARCHITECTURE-AUDIT-2026-01-19.md` (18 violations found across 23 files, critical finding: `validationSheet.ts` contained a 150-line reimplementation of the entire calculation engine), `IMPL-065-PHASE-3B-ANALYSIS.md` (deeper hook vs. engine violation investigation), `RETURNS-BUILDUP-STRIP-AUDIT-2026-01-19.md` (Returns Buildup Strip data source audit, pre-requisite for IMPL-067).

**Why it matters:** When Returns Buildup Strip issues arise, these audits are the first reference for which data sources feed each row.

---

## Quick Reference: Which Document for Which Task

| Task | Primary | Secondary |
|---|---|---|
| Build or modify a calculation | Tax Benefits Spec v6.0 | CALCULATION_ARCHITECTURE.md |
| Write a CC implementation prompt | Tax Benefits Spec v6.0 | VALIDATION_SOP.md |
| Check DoD requirements | VALIDATION_PROTOCOL.md | Tax Benefits Spec v6.0 §11 |
| Runtime UI verification | RUNTIME_UI_VERIFICATION.md | UI_NAVIGATION_MAP.md |
| Live Excel export IMPL | LIVE_EXCEL_SYNC_PROTOCOL.md | VALIDATION_PROTOCOL.md |
| Debug a calculation issue | debugging-patterns.md | CALCULATION-ARCHITECTURE-AUDIT |
| Backend IMPL — any field change | BACKEND_ENTITY_REGISTRY.md | VALIDATION_PROTOCOL.md |
| Dev environment not starting | DEV_ENVIRONMENT_STARTUP.md | — |
| Pre-commit audit | GIT_WORKFLOW.md | VALIDATION_PROTOCOL.md |
| Answer a state tax question | OZ 2.0 Addendum v9.3 | Tax Provisions Reference v1.0 |
| AMT / §38(c) sizing question | Tax Benefits Spec v6.0 §11 | Sizing Optimizer AMT Addendum v1.0 |
| Plan what to build next | Platform Roadmap v2.0 | Program Spec v1.5 §16 |
| Angel building database schema | Canonical Schema Spec v1.0 | Snapshot Spec v1.0 + Onboarding Spec v1.0 |
| Deal pipeline / API contracts | Deal Pipeline Screening Spec v1.0 | Integration Spec v0.1 |
| CIE extraction workflow | Deal Ingestion Engine Spec v1.0 | CIE Capability Audit Log v1.0 |
| Investor / institutional question | OZ 2.0 Master Spec v11.0 | Tax Counsel Verification rev2 |
| Deal sourcing decision | AHF Deal Sourcing Brief v1.1 | Strategy Plan v3.1 |
| Check what is built vs. specced | IMPLEMENTATION_TRACKER.md | SPEC_REGISTRY_NOTES.md (repo) |
| Check open architectural issues | HDC Spec Ecosystem Index | — |
| Validate a scenario | VALIDATION_SCENARIOS.md | VALIDATION_SOP.md |
| Audit Excel export | AUDIT_PROCESS.md | VALIDATION_SCENARIOS.md |
| Documented assumption question | DOCUMENTED_ASSUMPTIONS.md | Tax Counsel Verification rev2 |
| Snapshot / publish event question | Deal Snapshot Spec v1.0 | Canonical Schema Spec v1.0 §11 |
| Investor subscription / DocuSign | Investor Onboarding Spec v1.0 | Platform Roadmap v2.0 Track 4 |
| Cross-app integration question (Map ↔ Tax Benefits) | Map App Integration Reference v1.1 | Cross-App Sync Protocol v1.0 |
| Cross-app reference doc out of sync | Cross-App Sync Protocol v1.0 | Map App Integration Reference v1.1 |

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.4 | 2026-05-04 | Added Map App Integration Reference v1.0 (Group 2) and Cross-App Sync Protocol v1.0 (Group 7). Added two cross-app rows to Quick Reference table. Updated total document count 39 → 41. |
| 1.3 | 2026-04 | Post-April 12 consolidation baseline. 22 project knowledge documents + 17 repo engineering process documents = 39 total. |

---

*End of HDC Project Knowledge Catalog v1.4 — May 2026*
