# HDC Platform Build Sequence
## May 2026 — Brad's Working Guide

---

## How to Read This

Each block must complete before the next block starts unless marked
**[parallel]**. Owner is noted for each item. Blockers are called out
explicitly. This is sequenced by dependency, not by calendar.

---

## Block 1 — Accuracy and Documentation
*Run immediately. No dependencies. Low risk.*

| IMPL | Owner | What | Why First |
|---|---|---|---|
| DA-1 / DA-2 commit | CC | Add OZ inclusion event + §461(l) indexing to DOCUMENTED_ASSUMPTIONS.md | Documentation only. One file. Zero risk. Gets repo current. |
| IMPL-168 | CC | §42(f)(1) defect fix | Real accuracy bug. Affects every December PIS deal. Platform is wrong until this ships. |

**Exit criteria:** DOCUMENTED_ASSUMPTIONS.md updated. §42(f)(1) fix committed and tested.

---

## Block 2 — Transparency Panel
*Begins after Block 1. No backend dependency.*

| IMPL | Owner | What | Notes |
|---|---|---|---|
| IMPL-170 | CC | generateTransparencyNarrative.ts — pure function | Single unified narrative for all investors. No role-specific variants. Simplifies all five sections. |
| IMPL-171 | CC | InvestorTaxTransparencyPanel.tsx — React component | Consumes IMPL-170 output. One UI for all investor types. |
| IMPL-172 | CC | Wire panel into FundDetail.tsx | Renders below KPI strip. |
| IMPL-173 | CC | Over/undersize comparison table | Depends IMPL-172. |
| IMPL-174 | CC | Three-component return table | Depends IMPL-172. |

**Exit criteria:** Transparency panel live in UI across all three investor tracks. IMPL-175 deferred — needs Phase B4 backend (Block 5).

---

## Block 3 — RBAC (Full Sequence)
*Runs in parallel with Block 2. Brad backend first, then CC frontend.*

### Brad — Backend (run first)

| IMPL | Owner | What | Notes |
|---|---|---|---|
| IMPL-176 | Brad | Role, Permission, UserRole, RoleAuditLog entities. Seed SQL. | Foundation for entire RBAC stack. |
| IMPL-177 | Brad | Migration SQL. JWT updated with permissions + roles. | Depends 176. |
| IMPL-178 | Brad | Signup endpoint: onboardingRole, role assignment, audit log. | Depends 176. |
| IMPL-179 | Brad | Migrate @PreAuthorize on all 8 controllers. Object-level ownership checks. | Depends 177. |

### CC — Frontend (after IMPL-177 ships)

| IMPL | Owner | What | Notes |
|---|---|---|---|
| IMPL-180 | CC | Auth context: permissions array, hasPermission(), PERMISSIONS constants. | Depends IMPL-177. |
| IMPL-181 | CC | Conditional rendering: portfolio manager, transparency panel, export, nav. | Depends IMPL-180. |
| IMPL-182 | CC | Signup flow: channel selection toggle, onboardingRole to backend. | Depends IMPL-178. |
| IMPL-183 | Brad | Admin role management API: assign/remove roles, audit log endpoint. | Depends IMPL-179. |
| IMPL-184 | CC | Admin UI: user list, role badges, assignment controls, audit log view. | Depends IMPL-183. |

**Exit criteria:** Full RBAC stack live. Three roles functional: individual_investor, wealth_manager, hdc_admin. JWT claims correct. Admin UI working.

---

## Block 4 — Canonical Schema + Forgiveness Toggle
*Originally Brad's most consequential block. IMPL-186 superseded May 2026 — see Backlog and registry entry for replacement strategy.*

**Prerequisite decision:** ~~devFeeClosingAmount convention~~ **RESOLVED — Option C. devFeeClosingAmount stays as direct dollar input. devFeePct computes total only. IMPL-190 unblocked.**

| Item | Owner | What | Notes |
|---|---|---|---|
| ~~IMPL-186~~ | ~~Brad~~ | ~~Deploy 5 new canonical schema tables…~~ | **⊘ SUPERSEDED (May 2026).** Approach duplicated existing Input* entity work. Replaced by incremental extension. See registry entry + Backlog → "Surfaced by IMPL-186 Architecture Review". Build prompt preserved at `frontend/docs/prompts/IMPL_186_Final_CC_Prompt_v2_6.md`. |
| IMPL-185 | CC | Exit model forgiveness toggle. Filter forgivable tranches from outstanding debt at exit. | **✅ Shipped 2026-05-18** via incremental `philDebtForgivenessEnabled` toggle on `InputCapitalStructure` — did not require canonical schema. |

**Block status:** Closed. IMPL-185 shipped via a non-canonical-schema path. IMPL-186 superseded; downstream IMPLs re-pointed.

---

## Block 5 — Downstream Schema Work
*Originally blocked on IMPL-186. After IMPL-186 superseded (May 2026), IMPLs in this block were re-scoped and re-pointed to incremental schema extensions.*

| IMPL | Owner | What | Notes |
|---|---|---|---|
| ~~IMPL-187~~ (original) | ~~CC~~ | ~~CIE ingestion prompt update: extract per-tranche fields into deal_debt_tranches.~~ | **Re-scoped.** IMPL-187 shipped 2026-05-18 as OZ Capital Gains Field Resolution Fix. Original CIE-ingestion scope re-queued — see Backlog → Composable Debt. |
| ~~IMPL-188~~ (original) | ~~CC~~ | ~~deal_grants UI panel: Category F input, basis inclusion flag, counsel-required warning.~~ | **Re-scoped.** IMPL-188 shipped 2026-05-21 as `CapitalSource` type + `legacyToSources()` migration. Grant UI now planned via composable capital sources (see `HDC_Composable_Capital_Sources_Spec_v1_2.md`). |
| IMPL-189 | CC | deal_equity_installments UI: replace single equity % with multi-installment table. | ~~Depends IMPL-186.~~ Re-evaluate against composable sources architecture — equity installments may fold into `CapitalSource[]` via per-source funding triggers. |
| IMPL-190 | CC | Two-scenario fee architecture, Scenario A: devFeePct (1–20%) computes devFeeTotal. AUM fee dormant with reactivation note. | ~~Depends IMPL-186 for schema field.~~ Now depends on incremental `DealConduit` field addition (small IMPL). Prompt still ready. |

**[Parallel with above]**

| Item | Owner | What | Notes |
|---|---|---|---|
| Phase B4 backend | Brad | annual_tax_positions + tax_scenarios (JSONB) tables. | Unblocks IMPL-175 (trajectory integration in transparency panel). |
| State conformity backend | Brad | Move state conformity from hardcoded frontend to backend table. | Overdue from Q1 2026. |

**Exit criteria:** CIE can ingest Queenswood-style capital stacks. deal_grants and equity installments live in UI. Phase B4 tables deployed.

---

## Block 6 — Quick Wins
*Run anytime after Block 3. No hard dependencies.*

| Item | Owner | What | Notes |
|---|---|---|---|
| PDF report bug fix | CC | Report conflates gross exit value (~$60M) with net investor returns (~$35M). | Audit prompt drafted and ready. Medium priority. |
| Screen 4 Pool View UI | CC | Pool view engine deployed (IMPL-085). UI screen not yet built. | Engine complete. UI only. 3–5 days. |
| Tax Efficiency Map Step 3 | CC | Batch validation against real investor data. | 1–2 days. Validates batch runner output. |
| IMPL-175 | CC | Phase B4 trajectory integration in transparency panel. | Depends Phase B4 backend (Block 5). Graceful static fallback until then. |
| Multi-profile portfolio manager | CC | Spec v2.1 complete. Wealth manager book-of-business view. | 5–7 days. No backend dependency for scaffolding. |

---

## Block 7 — Track 8 Cross-App Integration
*Originally fully blocked on Block 4 (canonical schema). With IMPL-186 superseded (May 2026), dependencies re-point to incremental DealConduit identity extension + composable capital sources.*

| Phase | Owner | What | Depends On |
|---|---|---|---|
| Phase 8.1 | Brad + CC | Map → Tax Benefits Gate 1 Handoff. Address in Map returns OZ, DDA, QCT, SAFMR, transit, environmental payload. Tax Benefits frontend consumes to pre-populate Category C fields. | DealConduit identity extension (Backlog) |
| Phase 8.3 | Brad | Shared investor identity. Tax Benefits is source of truth. Map reads via API. | Canonical investor-profile spec v1.3 (Backlog) + RBAC |
| Phase 8.4 | Brad + CC | Map → Tax Benefits deal sourcing trigger. Parcel identified in Map → deal created in Tax Benefits pre-populated. | DealConduit identity extension + Phase 8.1 |
| Phase 8.2 | CC | Tax Benefits → Map pipeline visualization. Modeled deals pinned on map with projected returns. | Phase 8.1 |
| Phase 8.5 | Brad + CC | Cross-app stack rank dashboard. Physical eligibility + financial returns in one view. | All above |

**Spec status:** Phase 8.1 spec exists. Phases 8.2–8.5 need specs (Lane C).

---

## Block 8 — HFA Knowledge Base
*Runs after canonical schema (Block 4). WSHFC record is high priority given active WA deals.*

| IMPL | Owner | What | Notes |
|---|---|---|---|
| IMPL-193 | Brad | hfa_knowledge table + hfa_deviations on deals table. | NYC HPD and HDC records ready to seed from Queenswood. |
| IMPL-194 | CC | HFA lookup and pre-population in deal creation flow. | Depends IMPL-193. |

**Priority HFA records to populate:** WSHFC (active WA deals), Ohio HDFA, Georgia DCA.

---

## Block 9 — Scenario B Fee Architecture
*After IMPL-190 (Scenario A) is stable and Scenario B spec is written.*

| IMPL | Owner | What | Notes |
|---|---|---|---|
| Scenario B spec | Brad + Chat | HDC as asset manager: devFeeHDCShare, AUM fee reactivation, tax-exempt interest flag (§103). | Lane C. ~1 session. Needed before IMPL-192. |
| IMPL-192 | CC | Two-scenario fee architecture Scenario B. | Depends spec + IMPL-190. |

---

## Block 10 — Pre-Launch Blockers
*Must complete before any external user (investor or wealth manager) accesses the platform.*
*These gate Tracks 4, 5, and 6 entirely.*
*Approach: go lighter for now. RBAC (Block 3) handles role separation.*
*Full hardening deferred until closer to external launch.*

| Item | Owner | What | Notes |
|---|---|---|---|
| CI/CD pipeline spec | Brad + Chat | Test gates, deployment pipeline. | Lane C. Defer until closer to launch. ~1 session when ready. |
| CI/CD pipeline build | Brad | Implement per spec. | Depends spec. |
| Object-level auth (full) | Brad | RBAC covers Tax Benefits endpoints (IMPL-179). Full cross-entity scoping deferred — revisit before investor portal goes live. | Do not block Tracks 4–6 on this indefinitely; set a checkpoint at Block 11 start. |

---

## Block 11 — Investor-Facing Platform
*Fully blocked on Block 10. This is where the platform goes external.*

| Track | Item | Owner | Notes |
|---|---|---|---|
| Track 4 | Investor Onboarding spec | Brad + Chat | DocuSign, subscription record, accreditation, soft/hard circle tracking. ~2 sessions. |
| Track 4 | Investor onboarding build | CC + Brad | Depends spec + pre-launch blockers. |
| Track 5 | Investor Portal spec | Brad + Chat | Auth, holdings dashboard, document library, snapshot acknowledgment. ~2 sessions. |
| Track 5 | Investor portal build | CC + Brad | Depends spec + pre-launch blockers. |
| Track 6 | Fund Administration spec | Brad + Chat | Capital calls, distributions, K-1 management. Design complete April 2026; needs formal spec. ~2 sessions. |
| Track 6 | Fund administration build | CC + Brad | Depends spec. |
| Track 3 | Deal Snapshot spec | Brad + Chat | Immutable audit record. Investor linkage to exact model version. ~1 session. |
| Track 3 | Snapshot system build | Brad + CC | Depends spec + canonical schema. |

---

## Block 12 — Map App Geospatial Enrichment Pipeline

**Status:** Not yet built
**Depends on:** Canonical schema (IMPL-186), Map App geospatial intersections (built)

**Description:**
After a deal's location is set in the canonical schema, the Map App validates and enriches the deal record with geospatial data not available in the proforma:

- FMR (Fair Market Rent) by unit type (studio/1BR/2BR/3BR) for the project's market area
- OZ tract designation — confirmed vs. assumed
- AMI income limits for the project's county/MSA

These enriched attributes are written back to the canonical schema (deal_project and deal_oz tables) and become inputs to the calculation engine and stack ranking.

**Why it matters:**
Low FMRs relative to proforma rent assumptions can materially affect NOI and undermine deal viability. OZ tract confirmation affects investor tax benefit calculations. Both are hidden attributes not visible in the proforma alone.

**Intersection status:** Map App ↔ Tax Benefits Platform intersections are built. The enrichment write-back pipeline is not yet implemented.

---

## Block 13 — Deal Stack Ranking / Portfolio View

**Status:** Not yet built
**Depends on:** Canonical schema (IMPL-186), Map App enrichment pipeline (Block 12)

**Description:**
A portfolio-level view across all canonical deals, sortable and filterable by any canonical schema attribute:

- State / geography
- Deal size (units, total project cost)
- Deal lane (1–4)
- FMR adequacy (enriched by Map App)
- OZ status (confirmed/assumed/not applicable)
- Capital stack complexity (number of debt tranches, equity sources)
- Pipeline status (draft / internal review / published)

**Why it matters:**
Affordable equity has been scarce. Deal flow will accelerate after platform launch. Stack ranking allows HDC to quickly prioritize and compare deals across the pipeline without opening each deal individually. This becomes a critical operational tool as deal volume increases.

**Relationship to Claude in Excel:**
Claude in Excel extracts ~60 fields from each sponsor proforma into the canonical schema. Once populated, the stack ranking view surfaces the full pipeline and identifies where enrichment or additional diligence is needed before a deal enters the calculation engine.

---

## Track 10 — Compliance Layer

**Status:** Not yet built
**Depends on:** Canonical schema (IMPL-186 sequence), Map App enrichment pipeline (Block 12), Tax Benefits Platform investor portal (RBAC complete)

**Description:**
Two tools that form the compliance operating layer for deployed deals. Both feed live compliance data back to the Tax Benefits Platform, enabling the investor portal to show actual vs. projected returns in real time.

---

### Block 14 — Income Averaging Manager

**Status:** Not yet built
**Priority:** High — required before any income averaging election is made on a live deal

The income averaging election (§42(g)(1)(C)) allows a LIHTC project to serve households from 20% to 80% AMI as long as the average across all designated units does not exceed 60% AMI. Managing this designation across a 100–500 unit building as units turn over is a dynamic optimization problem that most property managers currently handle in spreadsheets.

**Capabilities:**
- Real-time AMI band distribution across all units
- Re-designation modeling on unit turnover: "if this vacancy is designated at 40% AMI, here is what happens to the project average and applicable fraction"
- Compliance drift detection — flags when the AMI blend is approaching the 60% average ceiling before a violation occurs
- Applicable fraction feed: updates Tax Benefits Platform automatically when designation changes affect the applicable fraction
- Optimization suggestions: given current occupancy and the available income range, surfaces the designation choices that maximize credits while maintaining compliance

**Strategic note:**
Most operators track income averaging in spreadsheets. HDC building this tool creates a differentiated partnership offer — not just capital but the compliance infrastructure that makes the deal easier to run. Evaluate licensing to third-party operators once the tool is validated on HDC's own deals.

---

### Block 15 — Compliance Regime Manager

**Status:** Not yet built
**Priority:** Medium — required before first deal enters its compliance monitoring period

The annual compliance regime for LIHTC deals requires tenant income certification at move-in, annual recertification, HFA annual compliance reports, and audit-ready documentation. The compliance regime manager handles the full workflow from initial application intake through annual monitoring.

**Capabilities:**
- Tenant application intake and income verification
- Initial income certification (household composition, asset calculation, AMI eligibility)
- Annual recertification workflow
- HFA annual compliance report generation (state-specific formats)
- Document storage: backup files, income verifications, household certifications, audit trail
- Audit-ready export package
- Compliance data API: feeds applicable fraction, actual NOI, recertification status back to the Tax Benefits Platform

**Integration approach:**
Build as an HDC-operated tool first. Evaluate integration with property management platforms (Yardi, MRI, RealPage) via their APIs when specific PM partners are identified. Design the compliance data output as an open API endpoint so any upstream system — PM's own tool, third-party software, or manual CSV upload — can feed the Tax Benefits Platform using the same schema.

---

### Block 16 — Compliance Data Ingestion API

**Status:** Not yet built
**Depends on:** Block 14 or 15 (either tool can be the first data producer)

A standardized API endpoint on the Tax Benefits Platform that accepts compliance data regardless of source. The platform doesn't care whether data comes from HDC's own compliance tools, a PM's proprietary system, or a Yardi/MRI connector.

**Compliance data schema (minimum):**
- applicableFraction (current, by unit and by AMI band)
- actualNOI (from rent roll, annualized)
- occupancyByAMIBand (income averaging compliance)
- recertificationStatus (current/overdue by unit)
- annualCompliancePeriod (year 1 through year 15+)

**Effect on Tax Benefits Platform:**
Receiving updated applicable fraction and actual NOI triggers a recalculation of projected tax benefits. The investor portal shows live actual vs. projected returns, updated as compliance data flows in annually.

**Connectors to build when partners identified:**
- Yardi API connector
- MRI API connector
- Property manager custom API adapter
- Manual CSV/Excel upload (fallback for all cases)

---

## Backlog (Future Items)

Items identified but not yet sequenced into a track. Promote into a numbered block when scheduling work.

**ROFR Exit Model (future IMPL)**
Right of First Refusal exit mechanism. EHS (or designated nonprofit) purchases the property at a negotiated price — default is outstanding debt balance (senior + philanthropic debt), but the model must support override for deals that provide additional investor upside above the debt price. Exit proceeds under ROFR = negotiated price minus non-forgivable debt repayment. Replaces or supplements the current NOI/cap rate exit model for deals with ROFR provisions in the partnership agreement. Note: loss on sale tax treatment must be modeled alongside ROFR since ROFR price may be below LP adjusted tax basis.

**Loss on Sale Tax Treatment (future IMPL)**
When exit proceeds are below the LP's adjusted tax basis (original investment minus depreciation taken), the LP realizes a tax loss on disposition. Tax treatment differs significantly from a gain: no depreciation recapture, potential ordinary loss treatment depending on partnership structure. Relevant for ROFR exits and any deal where affordability restrictions compress exit value below adjusted basis. Must be modeled alongside ROFR exit (see above).

**RAD Conversions (future roadmap)**
HUD Rental Assistance Demonstration program converts public housing or Section 8 moderate rehabilitation contracts to long-term Section 8 HAP contracts, enabling LIHTC financing on previously ineligible properties. Relevant when HDC acquires public housing stock or partners on HUD-subsidized preservation deals. HAP contract income stream affects NOI, eligible basis, and credit calculations differently from market-rate or standard LIHTC rents. Add to platform when first RAD deal enters the pipeline.

### Surfaced by IMPL-186 Architecture Review (May 2026)

The following items were identified during IMPL-186 scoping and are queued for future IMPLs. None are blocking current work. IMPL-186 itself was superseded — see registry entry and Block 4 for context.

**Composable Debt (future IMPL)**
Add `deal_debt_tranches` as a 1:many extension to `DealConduit` when a deal requires more than two debt sources. Queenswood is the first candidate. Build prompt preserved at `frontend/docs/prompts/IMPL_186_Final_CC_Prompt_v2_6.md` — the `deal_debt_tranches` entity spec is reusable. Architectural alignment: composable capital sources spec (`HDC_Composable_Capital_Sources_Spec_v1_2.md`) describes the engine-side model; this IMPL would persist that model in the database.

**DealConduit Identity (small IMPL)**
Add `dealName`, `status` (draft / internal_review / published / archived), and `dealLane` (1-4) to `DealConduit`. Makes existing sessions named, retrievable, and stack-rankable without a full schema rebuild. Unblocks Track 8 Phase 8.1 / 8.4.

**Canonical Investor-Profile Spec (v1.3)**
22 Category D investor-profile fields currently live in `InputInvestorProfile` with no canonical definition. `qualifiedCapitalGain` (Category D, per-investor QCG amount) is the first named field — shipped in IMPL-185. Full inventory and table spec to be produced when investor portal work begins. Unblocks Track 8 Phase 8.3 (shared investor identity).

**Track 8 OZ Mapping (2-source JOIN)**
When Track 8 cross-app integration is built, the OZ input mapping requires: `deal_oz` (`ozEnabled`, `ozVersion`, `ozType`) + investor-profile (`qualifiedCapitalGain`, `capitalGainsTaxRate`) → `InputOpportunityZone` (5 fields). Not a 1:1 mapping from `deal_oz` alone — flagged here so Phase 8.1 design accounts for the 2-source join from the start.

**Beads Server Mode + Dolt Upgrade (pre-Gas Town)**
Switch from embedded to server mode (`bd dolt start`) and upgrade dolt 1.85.0 → 2.0.3 before parallel agent work begins. Parallel readiness audit complete — tool is PARTIALLY READY pending this config change.

---

## Parallel Workstreams (Not on Critical Path)

These run independently and don't block the main sequence.

| Item | Owner | Notes |
|---|---|---|
| OZ 2.0 tract designation | Brad | WA Commerce nomination window July 1–September 28, 2026. Grow America, King County/Seattle, Yakama Nation engaged. |
| WSHFC scattered-site fund application | Brad | AHF Fund I 4% LIHTC application. |
| Lincoln Ave / Joe Manning follow-up | Brad | Part 8 math reference is the leave-behind. Clarify deal flow vs. capital markets role before next meeting. |
| Caprock / Fortis distribution channel | Brad | Greg Brown, Mike Boroughs. Activate once investor portal is live. |
| Broker-dealer assessment | External counsel | Required before Scenario B (HDC as equity placement agent) is marketed. Daniel Altman to advise. |
| Math reference v3.3 | Brad + Chat | IMPL-185 + IMPL-187 + IMPL-188 formulas, forgivable debt, QCG resolution, composable capital sources, territorial tax, PARTIAL items. IMPL-186 superseded — math ref no longer waits on canonical schema. |

---

## The Critical Path in One Line

**Block 1 → Block 4 (closed — IMPL-185 shipped; IMPL-186 superseded, incremental extensions queued in Backlog) → Block 7 (Track 8) → Block 10 (pre-launch) → Block 11 (external users)**

Everything else runs in parallel around this spine.

---

## Open Decisions That Still Need Brad

| Decision | Status | Blocks |
|---|---|---|
| devFeeClosingAmount convention | **DECIDED — Option C: remains direct dollar input. devFeePct computes total only.** | IMPL-190 unblocked |
| Transparency panel tone | **DECIDED — one UI for all investors. No role-specific variants.** | IMPL-170–174 simplified |
| Object-level auth scope | **DECIDED — go lighter for now. RBAC (176–184) ships. Full cross-entity hardening deferred until pre-launch.** | External user access |
| Scenario B fee architecture spec | Pending — write when Scenario A (IMPL-190) is stable | IMPL-192 |
| CI/CD pipeline spec | Pending — defer until closer to external launch | External launch |

---

*HDC_Platform_Build_Sequence_v1_0.md | Brad's working guide | May 2026 | Internal*
