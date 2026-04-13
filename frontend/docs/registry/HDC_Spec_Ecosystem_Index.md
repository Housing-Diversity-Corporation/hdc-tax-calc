# SPEC_REGISTRY_NOTES
## HDC Platform Specification Ecosystem — Master Reference

**Version:** April 2026 Update (incorporating Registry_Update_April_2026.md)
**Purpose:** Master index of all companion documents, open issues, and session artifacts for the HDC platform spec ecosystem.
**Maintained by:** Brad Padden / HDC

---

## 1. Companion Document Versions

| Document | Version | Location | Notes |
|---|---|---|---|
| HDC Tax Benefits Platform Spec | v6.0 | Claude Chat project knowledge | Current. Function signatures, test scenarios, CC prompts. |
| OZ 2.0 Master Specification | v11.0 | Claude Chat project knowledge | Current. Deep calculation mechanics, UI architecture. |
| OZ 2.0 Addendum | v9.3 | Claude Chat project knowledge | Current. 56-jurisdiction state data tables. |
| HDC Tax Benefits Program Spec | v1.5 | Claude Chat project knowledge | Updated April 2026. Program-level reference. Five new §16.2 workstreams added. |
| Spec Implementation Registry | v4.2 | Claude Chat project knowledge | Current as of 2026-03-17. IMPL-001 through IMPL-153. 1,866 tests, 0 failures. Next: IMPL-154. |
| HDC Platform Product Roadmap | v2.0 | Claude Chat project knowledge | New April 2026. Supersedes Platform Vision v1.0. Seven-track architecture. |
| HDC Canonical Deal Schema Spec | v1.0 | Claude Chat project knowledge | New April 2026. Rosetta stone — 112 fields across 5 source categories. Full PostgreSQL schema. §10 updated per CIE Audit Entry 1.0. |
| HDC Deal Ingestion Engine Spec | v1.0 | Claude Chat project knowledge | New April 2026. Replaces v0.1. Multi-agent CIE architecture. Standard ingestion prompt defined in §5. |
| HDC Proforma Engine Spec | v2.0 | Claude Chat project knowledge | Current. Three-layer engine: deal schema, calculation, CIE ingestion. |
| HDC Integration Spec | v0.1 | Claude Chat project knowledge | Current. Typed contract from ProformaOutput to CalculationParams. |
| HDC Deal Snapshot and Versioning Spec | v1.0 | Claude Chat project knowledge | New April 2026. Mutable state + change log + immutable snapshots at publish events. |
| HDC Investor Onboarding and Subscription Spec | v1.0 | Claude Chat project knowledge | New April 2026. Track 4 full spec: investor record, accreditation, subscription, DocuSign, capital calls, documents, communications. |
| AHF Deal Sourcing Brief | v1.1 | Claude Chat project knowledge | New April 2026. Four-lane taxonomy, risk matrix, current pipeline (701, 4448, 4001), soft source strategy, stack rank. |
| CIE Capability Audit Log | v1.0 | Claude Chat project knowledge | New April 2026. First audit April 11, 2026. Quarterly update cadence. Empirical foundation for all CIE spec assumptions. |
| HDC Strategy and Execution Plan | v3.1 | Claude Chat project knowledge | Current. Go-to-market strategy, partnerships. |
| Tax Efficiency Mapping Spec | v1.2 | Claude Chat project knowledge | Current. |
| Multi-Profile Portfolio Manager Spec | v2.1 | Claude Chat project knowledge | Current. Screen 6, dual-persona model. |
| Sizing Optimizer AMT Addendum | v1.0 | Claude Chat project knowledge | Current. |
| HDC Tax Provisions Reference | v1.0 | Claude Chat project knowledge | Current. |
| Tax Counsel Verification | rev2 | Claude Chat project knowledge | Current. Sidley Austin / Daniel Altman. |
| HDC National Screening Map Engineering Spec | v1.0 | Claude Chat project knowledge | Current. 13-layer geospatial visualization spec. |

**Archived / Superseded:**

| Document | Superseded By | Archive Date |
|---|---|---|
| Platform Vision: Deal Lifecycle Architecture v1.0 | HDC Platform Product Roadmap v2.0 | April 2026 |
| HDC Deal Ingestion Engine Spec v0.1 | HDC Deal Ingestion Engine Spec v1.0 | April 2026 |
| Tax_Benefits_Spec_Portfolio_Manager_Additions.md | Tax Benefits Spec v6.0 (incorporated) | 2026-03-15 |

---

## 2. Implementation Registry Summary

| Range | Assignment | Status |
|---|---|---|
| IMPL-001–083 | Phases 1–16 (original build through capital stack enhancement) | All deployed |
| IMPL-084–107 | Save flow, pool aggregation, hold period, state tax, exit tax, investor archetype | All deployed |
| IMPL-108–117 | Timing Architecture Rewire (computeTimeline, Investment Date as master clock) | All deployed |
| IMPL-118–128 | First-Year LIHTC, NIIT, Tax Efficiency Mapping workstream | All deployed |
| IMPL-129–153 | Year 1 Tax Reduction display, table fields, test cleanup, assorted | All deployed |
| IMPL-154+ | Unassigned — available for future work | — |

**Current baseline (April 2026):**
- Branch: `main`
- Latest IMPL: IMPL-153
- Tests: 1,866 (0 failures)
- Next available: IMPL-154

---

## 3. Open Issues

| Item | Description | Owner | Priority |
|---|---|---|---|
| Canonical schema Angel review | Angel to review PostgreSQL schema in Canonical Schema Spec v1.0 §8 against existing table conventions before any deal tables are created | Angel | High |
| HDC fee rate decision | Canonical Schema Spec §3.11 notes HDC Fee Rate under review for elimination. Decision needed before schema is built | Brad | High |
| Phase B4 Annual Tax Capacity | Backend tables needed; blocked on Angel | Angel | High |
| Capital Account Ledger | Two CC pre-implementation audit items outstanding (construction period display; gross depreciation exposure in calculations.ts) | CC | High |
| Object-level authorization | Pre-launch blocker; spec not yet written | Brad / CC | High |
| CI/CD pipeline and test gates | Spec not yet written; priority | Brad / CC | High |
| Build HDC canonical Excel template | Named ranges, provenance tab, summary tab. Required before CIE integration can be tested | CC / Angel | High |
| Compile HDC reference tables for CIE | State conformity, OZ tracts, state LIHTC programs in standard Excel format for Python sandbox upload | Brad / Angel | High |
| PDF report generation bug | Conflates gross exit value (~$60M) with net investor returns (~$35M) — 8-question CC audit prompt drafted | CC | Medium |
| Trace deal unit count | Shows 100 instead of correct 195 — corrupted saved DB record, not code | Angel | Medium |
| Screen 4 Pool View UI | Engine deployed (IMPL-085); UI screen not yet built | CC | Medium |
| State Conformity backend table | Bonus depreciation conformity by state per State Conformity Enhancement Spec v1.0 | Angel / CC | Medium |
| State allocation process map | Per-state QAP, PAB calendar, application window timeline for multi-state sourcing | Brad / Chat | Medium |
| Version-control standard ingestion prompt | Store in /docs/cie/ in repo alongside canonical template. Update cadence tied to CIE audit cadence | Brad / Chat | Medium |
| Next CIE capability audit | Due July 11, 2026 or earlier if Anthropic announces Excel integration update | Brad | Medium |
| OZ Benefits strip state tax / NIIT components | Do not surface state tax and NIIT savings explicitly — pre-existing gap | CC | Low |
| K-1 linkage to investor_snapshot_history | Table design needed | Angel | Low |
| KYC/AML beneficial ownership table structure | Structure needed | Brad / Sidley | Low |

---

## 4. Session Artifacts Log

| Date | Artifact | Version | Type | Status |
|---|---|---|---|---|
| April 2026 | AHF Deal Sourcing Brief | v1.1 | Landscape .docx | Complete |
| April 2026 | HDC Canonical Deal Schema Spec | v1.0 | Markdown spec | Complete |
| April 2026 | HDC Platform Product Roadmap | v2.0 | Markdown spec | Complete — supersedes Vision v1.0 |
| April 2026 | HDC Deal Ingestion Engine Spec | v1.0 | Markdown spec | Complete — supersedes v0.1 |
| April 2026 | CIE Capability Audit Log | v1.0 | Markdown log | Complete — first entry April 11, 2026 |
| April 2026 | Deal Lane Risk Matrix (widget) | v4 | Visual / conversation artifact | Complete — conversation only |
| April 2026 | HDC Deal Snapshot and Versioning Spec | v1.0 | Markdown spec | New — produced this session |
| April 2026 | HDC Investor Onboarding and Subscription Spec | v1.0 | Markdown spec | New — produced this session |
| 2026-03-17 | Tax Efficiency Map React artifact | v1.0 | React widget | 12x13 heatmap, fund size slider, three investor types |
| 2026-03-17 | 1,064,448-row batch dataset | — | Data artifact | Generated from Trace 260303 $65M config |
| 2026-03-17 | AHF Two-Tier Presentation System | v4.4 | Deck | Advanced to v4.4 |

---

## 5. Constitution Updates (Pending — Apply to /docs/constitution/ Before Session End)

The following architectural principles emerged from the April 2026 session and should be added to the platform constitution:

**Schema-first design:**
The canonical schema spec must be complete and reviewed by Angel before any related database tables are created. Retrofitting audit columns, version stamps, and provenance chains after initial build requires migrations, data backfills, and broken audit trails.

**Publish event as snapshot trigger:**
Every publish event to the platform creates a snapshot automatically. No analyst discretion required. The act of publishing is the freeze. Internal working models can be iterated freely without affecting the live published snapshot.

**Investor records are additive:**
When a deal model is updated and republished, investor records are never overwritten. A new row is added to `investor_snapshot_history` pointing to the new snapshot. The original subscription record and its snapshot_id are permanent and immutable.

**Category D fields are not stored on deals:**
Investor tax profile fields (Category D) live on the investor record and are merged with deal parameters at calculation time. They are not stored on the deal itself. A single deal profile can be run against multiple investor profiles simultaneously without duplication.

---

## 6. Version Sync Log

| Date | Program Spec | Tax Benefits Spec | Registry | Notes |
|---|---|---|---|---|
| 2026-03-15 | v1.0 | v6.0 | v4.1 | Program Spec first published |
| 2026-03-17 | v1.4 | v6.0 | v4.2 | IMPL-120–128 deployed. Tax Efficiency Map complete. |
| April 2026 | v1.5 | v6.0 | v4.2 | April architecture session. Seven tracks, canonical schema, CIE audit, snapshot design, investor onboarding. |

---

*End of SPEC_REGISTRY_NOTES — April 2026 Update*
