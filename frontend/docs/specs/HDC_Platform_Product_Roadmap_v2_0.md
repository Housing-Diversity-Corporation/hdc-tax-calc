# HDC Platform Product Roadmap
## From Tax Benefits Calculator to Full-Stack Fund Administration System

**Version:** 2.0  
**Date:** April 2026  
**Status:** North Star — Strategic Vision and Build Sequence  
**Author:** Brad Padden / HDC  
**Supersedes:** Platform Vision: Deal Lifecycle Architecture v1.0 (2026-02-19)

**Companion Documents:**
- HDC Tax Benefits Platform Spec v6.0
- OZ 2.0 Master Specification v11.0
- HDC Canonical Deal Schema Spec v1.0 (April 2026)
- HDC Proforma Engine Spec v2.0
- HDC Deal Ingestion Engine Spec v1.0 (April 2026)
- HDC Integration Spec v0.1
- HDC Strategy & Execution Plan v3.1
- AHF Deal Sourcing Brief v1.1
- SPEC_IMPLEMENTATION_REGISTRY (current version)

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-02-19 | Initial vision. Three-state deal lifecycle, Excel-to-platform relationship, audit trail architecture, central math engine concept. |
| 2.0 | 2026-04-11 | Major expansion. Seven-track architecture. Four-lane deal sourcing taxonomy. Canonical schema four-flow convergence model. CIE integration. Snapshot versioning and investor linkage. Full investor onboarding, subscription, and portal. Fund administration. Document management. Compliance and reporting. State allocation process map. |

---

## Part 1: Vision Statement

The HDC platform is evolving from a point-in-time tax benefit calculator into a self-contained, institutional-grade fund administration system — one that manages the complete lifecycle of an affordable housing investment from deal sourcing through investor exit.

Every component of the lifecycle that today lives in a spreadsheet, an email thread, a DocuSign folder, or a manual process is a candidate for the platform. The goal is not to build software for its own sake. The goal is that when Novogradac audits the fund, when Sidley needs to reconstruct the terms an investor invested under, when an investor asks what they own and what it's worth — the answer comes from one system, instantly, with a complete audit trail.

The platform is also itself a product. HDC's competitive moat is not just that it finds good deals — it is that it runs a technology-enabled fund administration process that institutional syndicators cannot replicate because they were not built with individual investors in mind.

---

## Part 2: Strategic Principles

These principles govern every build decision. When there is ambiguity about how to build something, return to these.

**Schema-first design.** The canonical schema must be reviewed and finalized before any related database tables are created. Retrofitting audit columns, version stamps, and provenance chains after initial build creates migrations, data backfills, and broken audit trails.

**Publish event as freeze.** Every publish event to the platform creates an immutable snapshot automatically. No analyst discretion required. Internal working models can be iterated freely without affecting the live snapshot.

**Investor records are additive.** When a deal model is updated and republished, investor records are never overwritten. A new row is added pointing to the new snapshot. The original subscription record and its snapshot reference are permanent and immutable.

**Category D fields are not stored on deals.** Investor tax profile fields live on the investor record and are merged with deal parameters at calculation time. A single deal can be run against multiple investor profiles simultaneously.

**The calculation engine is the single source of truth.** All calculations live in the engine. No derived values in the UI. No duplicate logic in hooks or components. This principle already governs the Tax Benefits Platform and extends to all new layers.

**Auditability proportional to need.** Append-only event sourcing is theoretically correct but operationally expensive. The platform uses mutable current state plus lightweight change log plus immutable snapshots at publish events. This is sufficient for Novogradac, Sidley, IRS, and investor defensibility without the maintenance burden of full event sourcing.

**Meet analysts where they are.** Excel is the deal structuring environment for the foreseeable future. The platform's job during deal construction is to be the best possible integration with Excel — via CIE — not to force analysts into unfamiliar input forms during the creative phase.

---

## Part 3: Platform Architecture Overview

The platform is organized into seven tracks. Each track has its own build phases and dependencies. Tracks are not sequential — several run in parallel once prerequisites are met.

```
Track 1 — Deal Sourcing and Pipeline
          Four-lane taxonomy, state allocation process map,
          geospatial screening, pipeline dashboard

Track 2 — Deal Modeling and Ingestion
          Canonical schema, CIE integration, proforma engine,
          four-flow convergence model

Track 3 — Deal Publication and Versioning
          Snapshot system, publish event trigger, change log,
          engine version registry

Track 4 — Investor Onboarding and Subscription
          Investor record, accreditation, subscription agreement,
          DocuSign integration, capital call and funding tracking

Track 5 — Investor Portal
          Investor-facing deal view, holdings dashboard,
          snapshot history, document library, communications

Track 6 — Fund Administration
          Capital accounts, distribution management,
          K-1 generation, fund-level reporting

Track 7 — Compliance and Reporting
          AML/KYC, beneficial ownership, audit export,
          Novogradac/Sidley-ready reporting
```

---

## Part 4: Track Specifications

---

### Track 1 — Deal Sourcing and Pipeline

**Purpose:** Give HDC's sourcing team (Megan and others) a structured, tool-supported process for finding deals that fit AHF's four-lane taxonomy, understanding state-specific requirements, and surfacing qualified prospects to the acquisitions team.

**Current state:** Four-lane taxonomy defined and documented in AHF Deal Sourcing Brief v1.1. Three live deals (701 S Jackson, 4448, Trace 4001) in active pipeline. No tooling beyond the brief.

#### Phase 1.1 — Deal Lane Taxonomy (Complete)
- Four-lane taxonomy defined, risk-evaluated, and stack-ranked
- Current AHF Fund I pipeline documented
- Soft source strategy framework defined
- Phase 1 vs. Phase 2 HFA maturity model documented
- Deliverable: AHF Deal Sourcing Brief v1.1

#### Phase 1.2 — State Allocation Process Map
- Per-state QAP (Qualified Allocation Plan) calendar and requirements
- PAB volume cap status and application window per state
- HFA contact directory and relationship notes
- Timeline from initial HFA engagement to allocation close by state
- Priority states: WA (current), OH, GA, NE, OR (per 12-state PAB research)
- Deliverable: State Allocation Process Map spec + data table (backend)

#### Phase 1.3 — Geospatial Deal Screening (HDC National Screening Map)
- 13-layer data visualization: OZ tracts, QCT, DDA, AMI levels, PAB volume cap zones, HFA jurisdictions
- Engineer spec v1.0 already produced
- Input: project address or coordinates
- Output: complete eligibility profile — OZ version, QCT/DDA boost, state LIHTC availability, PAB feasibility
- Feeds directly into Category C fields in Canonical Schema (auto-populates deal profile)
- Deliverable: National Screening Map (existing spec, not yet built)

#### Phase 1.4 — Pipeline Dashboard
- Acquisitions team view: all deals in pipeline, lane classification, current status, ranked by calculated returns
- Stack rank logic: computed from calculation engine outputs, not manual scoring
- Deal status states: Identified → Screened → Modeled → Under LOI → Published → Closed
- Filter by lane, state, HFA, status, projected IRR / MOIC
- Integrates with Track 2 (deal modeling outputs) and Track 3 (snapshot status)
- Deliverable: Pipeline Dashboard UI spec + implementation

---

### Track 2 — Deal Modeling and Ingestion

**Purpose:** Replace manual data entry of deal parameters with a structured, auditable, CIE-assisted process that goes from developer Excel model to fully populated app profile in a single workflow.

**Current state:** 7-panel manual entry in Tax Benefits Platform. Deal Ingestion Engine spec v1.0 complete (April 2026). Proforma Engine spec v2.0 exists. Integration spec v0.1 exists. Canonical Schema spec v1.0 newly produced (April 2026). Nothing built yet.

#### Phase 2.1 — Canonical Schema Database (Prerequisite for everything)
- Angel implements 13 deal tables in PostgreSQL per Canonical Schema Spec v1.0 §8
- Includes change log table, snapshot table, engine version registry from day one
- Schema review required before any tables created
- All 112 fields categorized and mapped to correct tables
- TypeScript interfaces generated from schema
- Deliverable: PostgreSQL migration, TypeScript interfaces, Angel sign-off

#### Phase 2.2 — CIE Integration (Claude in Excel Bridge)

**Spec:** HDC Deal Ingestion Engine Spec v1.0 (April 2026 — replaces v0.1)
**CIE Capability Baseline:** CIE Capability Audit Log Entry 1.0, April 11, 2026
**Status:** Spec complete; not yet built

**What CIE does:**
CIE operates on a multi-agent architecture — one agent per open Excel file. All developer files must be open simultaneously in Excel before running the ingestion prompt. A single standard prompt to the canonical template agent coordinates extraction across all open files, cross-validates between files, looks up Category C values from HDC reference tables in the Python sandbox, and populates the canonical template — all without step-by-step analyst direction.

**What this replaces:**
Manual re-entry of 112 fields across 7 input panels. Current process takes 2-4 hours per deal. CIE process takes 15-30 minutes including analyst review of flagged exceptions.

**Analyst role after CIE extraction:**
- Review 3-5 flagged exception fields (not 27)
- Resolve any cross-file inconsistencies CIE detected
- Complete all 48 Category B HDC structuring decisions in app
- Trigger publish from app

**What the live mirror concept was and why it was removed:**
An earlier version of this roadmap described a "live mirror" — CIE automatically updating the canonical template when source files changed. This is not achievable. CIE is prompt-driven, not event-driven. It has no file-watching capability. When developer files update, an analyst re-runs the ingestion prompt. The platform does not automatically detect or process file changes.

**Reference table decoupling:**
CIE can read HDC reference tables (state conformity, OZ tracts, state LIHTC programs) uploaded to the Python sandbox and use them to auto-populate Category C fields without the platform's geospatial layer being built. This decouples Phase 2.2 from the National Screening Map build (Phase 1.3) — deal modeling can proceed fully before geospatial is complete.

**Standard ingestion prompt:**
A required prompt template governs every HDC ingestion session. It defines standing instructions: always flag inconsistencies, always record provenance, never guess on ambiguous fields, always use reference tables for Category C. See Deal Ingestion Engine Spec v1.0 §5 for the full prompt text. Do not modify between sessions.

**Build deliverables:**
- HDC canonical Excel template with named ranges matching all 112 field Named Ranges
- Provenance tab and Summary tab in canonical template
- HDC reference tables in standard Excel format for Python sandbox upload
- Standard ingestion prompt documented and version-controlled
- App publish endpoint: reads named ranges from canonical template, validates, creates deal profile

#### Phase 2.3 — Four-Flow Convergence
The four input flows that populate a complete deal profile:

| Flow | Category | Source | Mechanism |
|---|---|---|---|
| Developer model extraction | A (27 fields) | Developer Excel | CIE reads and maps |
| HDC structuring inputs | B (48 fields) | Analyst judgment | App input panels |
| Platform intelligence | C (8 fields) | Geospatial + state tables | Auto-populated at address entry |
| Investor profile merge | D (22 fields) | Investor record | Merged at calculation time, not stored on deal |

- Flow A: CIE extraction (Phase 2.2)
- Flow B: App input panels — existing 7-panel structure extended to cover all Category B fields
- Flow C: Geospatial overlay fires on ProjectLocation entry, auto-populates OZEnabled, QualifiedBasisBoost, PropertyState, BonusDepreciationPct, StateLIHTCEnabled
- Flow D: Investor record selected at calculation time, merged into CalculationParams
- Deliverable: Wired four-flow convergence, complete deal profile creation

#### Phase 2.4 — Proforma Engine
- Layer 1: Standardized Deal Schema (from Phase 2.1)
- Layer 2: Calculation engine — cash flows, NOI, debt service, waterfall distributions, IRR, promote splits
- Layer 3: Already handled by CIE in Phase 2.2 (replaces batch ingestion layer)
- Publication interface: typed contract from ProformaOutput to CalculationParams (Integration Spec v0.1)
- Auto-recalculation: any assumption change triggers recalculation and re-publishes to Tax Benefits Platform
- Deliverable: Proforma Engine Spec v2.0 implemented

---

### Track 3 — Deal Publication and Versioning

**Purpose:** Create an immutable, auditable record of every deal model that has been publicly presented, with investor linkage to the exact version of the model they invested under.

**Current state:** No snapshot system exists. Design complete from April 2026 session.

#### Phase 3.1 — Publish Event Trigger (Atomic Transaction)
Every publish event executes atomically:
1. Validate all required fields populated; calculation engine run successful
2. Write `deal_snapshots` row: version number, status = 'active', engine version, schema version, inputs_json (complete frozen copy), outputs_json, SHA-256 hashes of both
3. If prior active snapshot: flip to 'superseded', record superseded_at and superseded_by
4. Update `deals.active_snapshot_id`
5. If prior snapshot had investor subscriptions: insert `investor_snapshot_history` rows for all affected investors with status = 'pending_acknowledgment', queue notification emails
6. Platform deal listing updated to new snapshot terms

Full rollback if any step fails. Platform never shows partially published deal.

#### Phase 3.2 — Engine Version Registry
- `engine_versions` table tracks every calculation engine release
- Every snapshot stamped with engine_version at lock time
- Enables detection of: did IRR change because inputs changed, or because the engine changed?
- Delta summary generated on every new snapshot: { irr: +0.3%, moic: +0.04x, ... }

#### Phase 3.3 — Change Log
- Every field write to any deal table creates a `deal_change_log` row
- Fields recorded: deal_id, table_name, field_name, old_value, new_value, changed_at, changed_by, change_source, change_note
- Change sources: 'cie_import' | 'analyst_entry' | 'geospatial_update' | 'engine_update' | 'manual_override'
- Analyst-facing diff view: what changed between any two snapshots, field by field

#### Phase 3.4 — Snapshot Comparison UI
- Side-by-side view of any two snapshots for a given deal
- Fields that changed highlighted
- IRR / MOIC delta prominently displayed
- Links to change_log entries that explain each change
- Used by HDC team for internal review before republishing; by Sidley for deal reconstruction

---

### Track 4 — Investor Onboarding and Subscription

**Purpose:** Create a structured, documented, legally defensible process for bringing an investor from initial interest through signed subscription agreement, with the investor record as the hub for all subsequent interactions with the platform.

**Current state:** DocuSign and cloud storage used ad hoc. No investor record in platform. No linkage between investor and deal snapshot.

#### Phase 4.1 — Investor Record Creation
The investor record is created when HDC first formally engages with a prospective investor — before any subscription, before any soft circle.

**Core investor record fields:**
```
investors
  id                          UUID primary key
  legal_name                  Full legal name of investing entity
  entity_type                 Individual | LLC | Trust | Partnership | Other
  primary_contact_name        Contact person for communications
  primary_contact_email
  primary_contact_phone
  mailing_address
  tax_id                      EIN or SSN (encrypted)
  accreditation_status        'verified' | 'expired' | 'pending' | 'not_verified'
  accreditation_verified_at   Timestamp
  accreditation_expires_at    Timestamp (typically 90 days from verification)
  accreditation_doc_id        FK to documents table
  kyc_status                  'cleared' | 'pending' | 'flagged'
  kyc_completed_at
  aml_status                  'cleared' | 'pending' | 'flagged'
  created_at
  created_by
  wealth_manager_id           FK to wealth_managers table (Fortis, Caprock, etc.)
  referral_source             How they came to HDC
  notes                       Internal HDC notes
```

**Investor tax profile** (existing `investor_tax_info` table — extend, do not replace):
- All Category D fields from Canonical Schema Spec §3.15
- Multiple profiles per investor supported (Multi-Profile Portfolio Manager Spec v2.1)
- Default profile flagged per investor

#### Phase 4.2 — Accreditation Verification
- Accreditation documents collected at onboarding (income verification, net worth statements, third-party letter)
- Stored in platform document management (Track 5 Phase 5.4)
- 90-day verification window tracked — platform flags upcoming expirations
- System alert: if accreditation expires before fund close, investor flagged for re-verification
- Accreditation doc linked to investor record and to any subscription agreements executed during its validity window

#### Phase 4.3 — Soft Circle and Hard Circle Tracking
Before subscription agreement execution, investor interest is tracked in `investor_commitments`:

| Status | Description | Snapshot Link |
|---|---|---|
| soft_circle | Verbal or written indication of interest | None — pre-legal |
| hard_circle | Firm commitment pending documentation | None — pre-legal |
| converted | Converted to subscription agreement | Via `investor_deal_subscriptions` |
| withdrawn | Withdrew before signing | None |

Soft and hard circles inform HDC's fundraising dashboard (Track 6) but carry no legal obligation and are not linked to snapshots.

#### Phase 4.4 — Subscription Agreement Execution (Legal Trigger)
The subscription agreement execution is the legal event that:
1. Creates an `investor_deal_subscriptions` record
2. Links the investor to the **current active snapshot** (snapshot_id — immutable after creation)
3. Links to the executed subscription agreement document
4. Links to the investor's current accreditation document
5. Records signed_at, signed_by, amount committed

**DocuSign integration:**
- HDC initiates subscription agreement envelope from platform
- Investor receives and signs via DocuSign
- Platform receives webhook on execution completion
- Executed PDF stored in platform document management
- `investor_deal_subscriptions` record created automatically with DocuSign envelope ID and document reference
- Signed_at populated from DocuSign completion timestamp

**Subscription record is immutable after creation.** The snapshot_id recorded at signing never changes even if the model is subsequently updated. The investor's original terms are permanently preserved.

#### Phase 4.5 — Model Update Notification Workflow
When a deal model is republished (new snapshot goes active):

1. Platform identifies all investors with `investor_deal_subscriptions.snapshot_id` = prior active snapshot
2. Generates change summary (delta between prior and new snapshot)
3. Creates `investor_snapshot_history` row for each affected investor: status = 'pending_acknowledgment'
4. Sends notification email with prior terms, new terms, effective date, and acknowledgment link
5. Investor acknowledges via portal or email link
6. `investor_snapshot_history` row updated: status = 'acknowledged', acknowledged_at, acknowledged_by
7. Investors who have not acknowledged within N days flagged for follow-up

**Investor version history is additive:**
- Original subscription record: unchanged, snapshot_id = Snapshot 1 forever
- `investor_snapshot_history`: grows one row per model update
- Every version an investor was ever linked to is permanently readable
- At any point: query which version each investor acknowledged, and when

#### Phase 4.6 — Capital Call and Funding Tracking
After subscription agreement execution:

```
investor_deal_subscriptions
  amount                      Committed capital (set at signing, immutable)
  capital_called              Running total of capital call requests issued
  capital_funded              Running total of capital actually received
  funding_deadline            Date by which funded capital is due

capital_calls
  id
  deal_id
  call_number                 Sequential call number for this deal
  call_date                   Date call was issued
  call_amount                 Total amount called across all investors
  due_date
  status                      'issued' | 'partially_funded' | 'fully_funded'

investor_capital_calls
  id
  capital_call_id
  investor_id
  subscription_id
  amount_called               This investor's share of the call
  amount_funded               Actual amount received from this investor
  funded_at                   Wire receipt timestamp
  wire_reference              Bank wire reference for reconciliation
  status                      'called' | 'funded' | 'late' | 'excused'
```

---

### Track 5 — Investor Portal

**Purpose:** Give investors a self-service view of their holdings, deal terms, documents, and communications — linked to the exact snapshot they invested under and updated as new snapshots are published.

**Current state:** No investor portal exists. Tax Benefits Calculator is advisor/analyst-facing.

#### Phase 5.1 — Investor Authentication and Access
- Investor login separate from analyst/HDC team login
- Role: investor (read-only to their own records)
- Two-factor authentication required
- Session tokens short-lived (24 hours)
- Access scoped to deals where investor has an `investor_deal_subscriptions` record

#### Phase 5.2 — Holdings Dashboard
Investor's primary view after login:

```
For each deal the investor has subscribed to:
  Deal name
  Subscription amount
  Capital called / funded / outstanding
  Current snapshot version and date
  Snapshot acknowledgment status (acknowledged / pending)
  Next expected distribution or capital call
  Link to deal detail view
```

#### Phase 5.3 — Deal Detail View (Investor-Facing)
For each subscribed deal:

**Current terms tab:**
- Current active snapshot parameters (investor-readable summary, not raw fields)
- Key return metrics: projected IRR, MOIC, hold period
- Capital structure summary
- Tax benefit summary (LIHTC credits, depreciation, OZ benefits)
- Computed against investor's tax profile

**Version history tab:**
- Every snapshot the investor has been linked to
- Date each version went active
- Date investor acknowledged each version
- Summary of what changed between versions
- Link to download each snapshot's offering summary

**Documents tab:**
- Subscription agreement (executed copy)
- Accreditation documentation
- Capital call notices
- Distribution notices
- K-1s (when available)
- Quarterly updates
- Any ad hoc communications

**Tax profile tab:**
- Investor's tax profile inputs
- Ability to update (triggers recalculation against current snapshot)
- Side-by-side before/after if profile updated

#### Phase 5.4 — Document Management
All documents stored natively in platform, linked to the records they relate to:

```
documents
  id
  deal_id                     FK (nullable — some docs are investor-level)
  investor_id                 FK (nullable — some docs are deal-level)
  subscription_id             FK (nullable)
  snapshot_id                 FK (nullable — links doc to the snapshot it relates to)
  document_type               'subscription_agreement' | 'accreditation' |
                              'k1' | 'capital_call' | 'distribution_notice' |
                              'quarterly_update' | 'investor_notice' |
                              'side_letter' | 'amendment' | 'offering_summary'
  document_version            For documents with multiple versions (offering summary)
  storage_url                 Internal cloud storage reference
  docusign_envelope_id        For DocuSign-executed documents
  executed_at                 Timestamp of execution (for signed docs)
  uploaded_at
  uploaded_by
  is_investor_visible         Boolean — investor portal access control
```

**Document versioning:** Offering summaries and deal presentations linked to the snapshot they describe. When Snapshot 2 is published, a new offering summary is generated and linked to Snapshot 2. Snapshot 1's offering summary remains linked to Snapshot 1 and accessible in version history.

#### Phase 5.5 — Communication Log and Notifications
Every investor communication recorded:

```
investor_communications
  id
  investor_id
  deal_id
  snapshot_id                 Which snapshot this communication relates to
  communication_type          'snapshot_update' | 'capital_call' | 'distribution' |
                              'quarterly_update' | 'k1_available' | 'ad_hoc'
  subject
  body_preview                First 500 chars for log display
  sent_at
  sent_by
  method                      'email' | 'portal' | 'both'
  acknowledged_at             For communications requiring acknowledgment
  acknowledged_by
```

Investor portal shows full communication history. HDC team view shows all outbound communications across all investors for a given deal.

#### Phase 5.6 — Snapshot Acknowledgment Flow
When a new snapshot is published and investor notification is queued:

1. Investor receives email: "Your investment terms have been updated"
2. Email includes: prior terms summary, new terms summary, effective date, what changed
3. Link to portal acknowledgment page
4. Portal shows side-by-side comparison of prior and current terms
5. Investor clicks "I acknowledge the updated terms"
6. `investor_snapshot_history` status → 'acknowledged', timestamp recorded
7. Acknowledgment confirmation email sent to investor and HDC team

Investors who do not acknowledge within configurable window (default: 30 days) are flagged in HDC team dashboard for manual outreach.

---

### Track 6 — Fund Administration

**Purpose:** Give HDC the operational infrastructure to run a fund — tracking capital commitments, calls, distributions, and returns against the models investors invested under.

**Current state:** Manual processes. No fund administration tooling.

#### Phase 6.1 — Fund-Level Dashboard (HDC Team)
- Total commitments across all investors
- Capital called vs. funded vs. outstanding by investor and in aggregate
- Soft circles and hard circles pipeline
- Investors pending accreditation verification or re-verification
- Investors pending snapshot acknowledgment
- Upcoming capital calls and distribution dates

#### Phase 6.2 — Capital Account Ledger
- Per-investor capital account tracking: contributions, distributions, allocated income/loss
- Basis tracking per investor: OZ basis, tax basis, §704(b) book basis
- Partnership-level capital account (sum of all investor accounts)
- Consistent with existing Capital Account Ledger spec (blocked on CC audit items)
- Extends to accommodate snapshot linkage — capital account entries tagged to the snapshot in effect at the time of the entry

#### Phase 6.3 — Distribution Management
```
distributions
  id
  deal_id
  distribution_number
  distribution_date
  total_amount
  per_unit_amount
  distribution_type           'current_pay' | 'return_of_capital' | 'profit'
  status                      'declared' | 'paid'

investor_distributions
  id
  distribution_id
  investor_id
  subscription_id
  amount
  paid_at
  payment_method
  payment_reference
```

Distribution notices generated automatically and stored in document management, linked to investor and distribution records. Investor portal shows distribution history.

#### Phase 6.4 — K-1 Management
- K-1 generated annually per investor
- Stored in document management, linked to investor, deal, and tax year
- Investor notified via portal and email when K-1 available
- K-1 linked to the snapshot that was active at year-end (for reconstruction if queried)
- Portal shows K-1 history by year

#### Phase 6.5 — Fund-Level Reporting
- Fund-level P&L, balance sheet, capital account roll-forward
- Investor-level returns vs. projected returns at subscription snapshot
- Variance analysis: actual vs. projected IRR / MOIC by vintage
- Novogradac-ready financial data export

---

### Track 7 — Compliance and Reporting

**Purpose:** Ensure the platform produces audit-ready records for Novogradac, Sidley, IRS, and regulatory requirements throughout the fund lifecycle.

**Current state:** Novogradac relationship active. Sidley engaged for federal tax counsel. No platform-generated compliance reporting.

#### Phase 7.1 — AML/KYC Tracking
```
investor_kyc
  id
  investor_id
  kyc_status                  'cleared' | 'pending' | 'flagged' | 'requires_update'
  kyc_provider                Third-party KYC provider name
  kyc_completed_at
  kyc_expires_at
  kyc_doc_id                  FK to documents
  flagged_reason              If status = 'flagged'

investor_aml
  id
  investor_id
  aml_status
  aml_screening_date
  aml_provider
  pep_status                  Politically Exposed Person flag
  sanctions_status            OFAC and other sanctions screening
  adverse_media_status
```

#### Phase 7.2 — Beneficial Ownership
For entity investors (LLCs, trusts, partnerships):

```
beneficial_owners
  id
  investor_id                 FK to investing entity
  owner_name
  owner_type                  'individual' | 'entity'
  ownership_pct
  control_flag                True if control person regardless of ownership %
  dob                         For individuals (encrypted)
  tax_id                      For individuals (encrypted)
  address
  kyc_status
  kyc_completed_at
```

FINCEN beneficial ownership rule compliance: collect for all entities with 25%+ ownership or control.

#### Phase 7.3 — Audit Export
- Complete deal history export: all snapshots, change logs, investor notifications, acknowledgments
- Per-investor subscription history: which snapshot they invested under, all subsequent updates, acknowledgment timestamps
- Engine version log: which version of the calculation engine produced each output
- Formatted for Novogradac review: deal-level summary + investor-level detail + mathematical reconciliation
- Formatted for Sidley: legal timeline of model changes, investor notifications, and acknowledgments

#### Phase 7.4 — OZ Compliance Tracking
- 90% asset test compliance monitoring per QOF
- 31-month working capital safe harbor timeline tracking
- 10-year holding period clock per investor (from investment date, not PIS date)
- Annual OZ compliance certification reminders
- §1400Z-2(b) inclusion event monitoring (December 31 deadline tracking)

#### Phase 7.5 — LIHTC Compliance Monitoring
- Form 8609 issuance tracking per building per project
- Annual compliance certification reminders (tenant income certifications)
- 15-year compliance period end dates per deal
- Year 15 exit strategy timeline (EHS as MGP, ROFR mechanics)

---

## Part 5: Build Sequence and Dependencies

### Before Fund Open (Must Have)

```
Phase 2.1  Canonical schema database (Angel)
        ↓
Phase 2.2  CIE integration + canonical Excel template
Phase 2.3  Four-flow convergence
Phase 3.1  Publish event trigger + snapshot creation
Phase 3.2  Engine version registry
Phase 4.1  Investor record creation
Phase 4.2  Accreditation verification tracking
Phase 4.4  Subscription agreement execution (DocuSign integration)
Phase 4.5  Model update notification workflow
Phase 5.4  Document management (storage + retrieval)
Phase 6.1  Fund-level dashboard (HDC team)
        ↓
Fund opens / first publish event / first subscription
```

### Shortly After First Close

```
Phase 3.3  Change log (analyst-facing diff view)
Phase 4.3  Soft and hard circle tracking formalized
Phase 4.6  Capital call and funding tracking
Phase 5.1  Investor authentication
Phase 5.2  Holdings dashboard (investor-facing)
Phase 5.3  Deal detail view (investor-facing)
Phase 5.5  Communication log and notifications
Phase 5.6  Snapshot acknowledgment flow
Phase 6.2  Capital account ledger
Phase 7.1  AML/KYC tracking
Phase 7.2  Beneficial ownership
```

### Post-Stabilization / Ongoing

```
Phase 1.2  State allocation process map
Phase 1.3  National Screening Map (geospatial)
Phase 1.4  Pipeline dashboard
Phase 2.4  Proforma engine (full waterfall)
Phase 3.4  Snapshot comparison UI
Phase 6.3  Distribution management
Phase 6.4  K-1 management
Phase 6.5  Fund-level reporting
Phase 7.3  Audit export
Phase 7.4  OZ compliance tracking
Phase 7.5  LIHTC compliance monitoring
```

---

## Part 6: Current State vs. Roadmap

### What Exists Today (Tax Benefits Platform — ~86K lines)

| Feature | Status |
|---|---|
| Tax calculation engine (§42, §168(k), §1400Z-2) | Complete — 153 IMPLs deployed |
| Investor profiling and tax utilization | Complete |
| Deal Benefit Profile (DBP) extraction | Complete |
| Pool aggregation / fund modeling | Complete |
| Phase B3 fit and archetype classification | Complete |
| Sizing optimizer | Complete |
| Exit tax engine (character-split recapture) | Complete |
| Tax Efficiency Map | Complete |
| LIHTC applicable fraction | Complete |
| NIIT-aware depreciation | Complete |
| Timing architecture (XIRR, computeTimeline) | Complete |
| Multi-profile portfolio manager | Spec complete, not built |
| Capital account ledger | Spec complete, blocked |
| Phase B4 annual tax capacity model | Blocked on Angel |
| State conformity backend table | Spec complete, not built |
| Proforma engine | Spec complete, not built |
| Deal ingestion (CIE) | Spec v0.1 complete, needs update |
| Canonical schema | Spec v1.0 complete (April 2026), not built |
| Snapshot / versioning system | Design complete (April 2026), spec pending |
| Investor record + onboarding | Design complete (April 2026), spec pending |
| Investor portal | Design complete (April 2026), spec pending |
| Fund administration | Design complete (April 2026), spec pending |
| Document management | Design complete (April 2026), spec pending |
| Compliance and reporting | Design complete (April 2026), spec pending |
| Pipeline dashboard | Not yet specified |
| National Screening Map | Engineering spec v1.0 complete, not built |
| State allocation process map | Not yet specified |

### What Needs to Be Specified Next (Priority Order)

1. **Deal Snapshot and Versioning Spec** — Phase 2 audit architecture, April 2026 design session documented; needs formal spec before Angel builds schema
2. **Investor Onboarding and Subscription Spec** — Track 4 in full; DocuSign integration, subscription record, model update notification workflow
3. **Investor Portal Spec** — Track 5; investor authentication, holdings dashboard, document library, snapshot acknowledgment
4. **Update Deal Ingestion Engine Spec** — Reframe CIE as interactive modeling partner, not batch parser
5. **State Allocation Process Map** — For Megan's multi-state sourcing

---

## Part 7: Open Items

| Item | Owner | Priority | Blocking |
|---|---|---|---|
| Angel review of Canonical Schema Spec v1.0 §8 PostgreSQL schema | Angel | Critical | Phase 2.1 |
| HDC fee rate decision (eliminate or retain per §3.11 of Canonical Schema Spec) | Brad | High | Phase 2.1 schema finalization |
| Deal Snapshot and Versioning formal spec | Brad / Chat | High | Phase 3.1 build |
| Investor Onboarding and Subscription formal spec | Brad / Chat | High | Phase 4.4 build |
| DocuSign account and API credentials for integration | Brad | High | Phase 4.4 build |
| Cloud storage decision (S3 / existing / new) for document management | Brad / Angel | High | Phase 5.4 build |
| Investor portal spec | Brad / Chat | High | Track 5 build |
| Update Deal Ingestion Engine Spec v0.1 — CIE-as-interactive-partner | CC / Chat | Medium | Phase 2.2 build |
| Accreditation verification provider selection (third-party or manual) | Brad | Medium | Phase 4.2 |
| KYC/AML provider selection | Brad / Sidley | Medium | Phase 7.1 |
| State allocation process map spec | Brad / Chat | Medium | Track 1.2 |
| National Screening Map build prioritization | Brad | Medium | Track 1.3 |
| K-1 generation approach (internal build vs. integration with CPA software) | Brad / Novogradac | Low | Phase 6.4 |
| Beneficial ownership collection process (platform form vs. manual) | Brad / Sidley | Low | Phase 7.2 |

---

## Part 8: Spec Ecosystem Map

All specifications that constitute the HDC platform spec ecosystem, current as of April 2026:

| Spec | Version | Status | Track |
|---|---|---|---|
| HDC Tax Benefits Platform Spec | v6.0 | Current | All |
| OZ 2.0 Master Specification | v11.0 | Current | 1, 2 |
| OZ 2.0 Addendum | v9.3 | Current | 1, 2 |
| HDC Tax Benefits Program Spec | v1.4 | Current | All |
| Tax Efficiency Mapping Spec | v1.2 | Current | 2 |
| HDC Canonical Deal Schema Spec | v1.0 | New April 2026 | 2, 3, 4 |
| HDC Proforma Engine Spec | v2.0 | Specified, not built | 2 |
| HDC Deal Ingestion Engine Spec | v0.1 | Needs update | 2 |
| HDC Integration Spec | v0.1 | Specified, not built | 2 |
| HDC Canonical Deal Schema Spec (existing) | v1.0 (prior) | Superseded by new v1.0 | — |
| Multi-Profile Portfolio Manager Spec | v2.1 | Specified, not built | 5 |
| Sizing Optimizer AMT Addendum | v1.0 | Current | 2 |
| State Conformity Enhancement Spec | v1.0 | Specified, not built | 2 |
| Platform Vision: Deal Lifecycle Architecture | v1.0 | Superseded by this document | — |
| HDC Strategy & Execution Plan | v3.1 | Current | All |
| AHF Deal Sourcing Brief | v1.1 | New April 2026 | 1 |
| HDC National Screening Map Engineering Spec | v1.0 | Specified, not built | 1 |
| Capital Account Ledger Spec | v1.0 | Specified, blocked | 6 |
| Deal Snapshot and Versioning Spec | — | **Not yet written** | 3 |
| Investor Onboarding and Subscription Spec | — | **Not yet written** | 4 |
| Investor Portal Spec | — | **Not yet written** | 5 |
| Fund Administration Spec | — | **Not yet written** | 6 |
| Document Management Spec | — | **Not yet written** | 5 |
| State Allocation Process Map | — | **Not yet written** | 1 |
