# Map App Integration Reference v1.1

**Date:** 2026-05-04
**Purpose:** Reference document for the HDC Tax Benefits app project knowledge. Provides Chat and CC working in the Tax Benefits repo with sufficient context about the HDC Map app to plan and execute cross-app integration work without re-auditing. Updated per the Cross-App Sync Protocol when either app changes.

**Companion document:** `TAX_BENEFITS_APP_INTEGRATION_REFERENCE.md` lives in the Map repo at `docs/`. The two docs together form the bidirectional cross-app context layer.

**Source of truth:** Map app code at `~/Projects/map/` (separate repo). When this reference and the Map repo disagree, Map repo wins. This doc is a derived view, not authoritative.

---

## 1. Architectural Premise (Angel-Confirmed)

The Map app and Tax Benefits app are deliberately separate services. Decision documented and reaffirmed May 2026.

| Property | Map App | Tax Benefits App |
|---|---|---|
| Repo | `~/Projects/map/` (separate) | `HousingDiversityCorp/HDC-platform` |
| Backend | Spring Boot 3.5.3, Java 17, PostGIS | Spring Boot, Java 17, AWS RDS (relational) |
| Frontend | Vite + React + TS + Google Maps | Vite + React + TS |
| Database | PostgreSQL with PostGIS extension; geodatabase optimized for geospatial compute | PostgreSQL relational; investors, deals, tax projections, capital stacks |
| Production | `map.americanhousing.fund` | `calc.americanhousing.fund` |
| Contract | API only; no shared schema, no shared types, no shared deployment |

The two databases serve fundamentally different workloads (geospatial CPU-intensive vs. relational fast queries) and should not compete for the same infrastructure. This split is durable.

---

## 2. Map App Capability Summary

Source: `specs/HDC_Map_App_Audit_Report.md` (2026-04-09) plus Slate Memo Verification (2026-05-04) plus CC cross-check from commit 7220029. Updated as Map app capabilities change.

**Verified against Map repo as of 2026-05-04** via CC cross-check during commit 10f8295 (Map side) and 7220029 (Tax Benefits side). Refresh per sync protocol when capability changes.

### 2.1 Spatial Data Layers (33 surfaced)

**National (8):** Census Tracts, US Cities, DDA 2025 + 2026, FMR 2025 + 2026, SAFMR 2025 + 2026, QCT 2025 + 2026, OZ 2.0, HOA-FHFA, HOA-AFFH, USDA Rural Development Ineligible Areas, US Zipcodes.

**State (CA/WA) (2):** Counties, OZ 1.0.

**LA-specific (3):** HACLA VPS, HACLA Delta, Council Districts.

**Seattle/King County (20):** SDCI Zoning, MHA, Urban Village, King County Parcels, 12 Environmental Critical Areas (steep slope, slide areas, slide events, slide scarps, flood-prone, liquefaction-prone, peat settlement, landfill historical, riparian, wetlands, wildlife habitat), Frequent Transit Areas plus 4 additional 2026 transit layers.

**Surfaced via:** `hdc-map-frontend/src/hooks/map/useMapLayers.ts` (canonical layer registry).

### 2.2 Spatial Operations

| Operation | Endpoint | Persistence |
|---|---|---|
| Point-in-polygon intersection | `IntersectionController` | One-shot |
| Saved intersections | `SavedIntersectionsController` | Per user |
| Neighborhood search | `SavedNeighborhoodSearchController` | Per user |
| Geodata serving (spatial layer queries) | `GeodataController` | Stateless |
| Choropleth rendering by data column | (frontend) | Session |

### 2.3 Parcel Intelligence

| Capability | Endpoint | Source |
|---|---|---|
| Parcel lookup | `ParcelController` | King County parcel data |
| Parcel enrichment | `ParcelEnrichmentController` | Multi-source append |
| Listing comps | `controller/listing_comps/*` | Internal |
| RentCast rent comps | `RentcastController` | RentCast API |
| WalkScore | `WalkScoreController` | WalkScore API |

### 2.4 LLM/RAG Layer

| Component | Status |
|---|---|
| Chat endpoint | `ChatController` (built) |
| RAG admin | `RAGAdminController` (built) |
| Dedicated `rag_schema` in DB | Built |

### 2.5 User & Personalization

JWT auth, Google OAuth, favorites (`FavoritesController`), favorite locations (`FavoriteLocationController`), property presets (`PropertyPresetController`), map markers (`MarkerController`), profile/banner images, investor tax info (`InvestorTaxInfoController`).

### 2.6 Admin & Ops

Admin dashboard, API dashboard, pricing pages, rate limiting (`controller/ratelimit/*`), Calculator Configuration (`CalculatorConfigurationController`) — the named integration seam to the Tax Benefits app.

---

## 3. Slate Memo Coverage Verification (2026-05-04)

Of 9 named claims in the AHF/Slate memo Capability 2 paragraph:

| Slate Memo Term | Status | Evidence |
|---|---|---|
| OZ designation (incl. OZ 2.0) | Built | `ca_wa_oz`, `oz_ii`, `eig_oz_lgbl` |
| DDA designation | Built | `difficult_development_area`, `_2026` |
| QCT designation | Built | `qualified_census_tract`, `_2026` |
| Walkability | Built | WalkScore API |
| Transit connectivity | Built | `frequent_transit_area`, `_2026` variants |
| SAFMRs zip-level | Built | `safmr_zipcode`, `_2026` |
| Crime | Not built | Only `police.svg` POI marker |
| Food desert (FARA) | Not built | `usda` table is Rural Development eligibility, not FARA |
| Construction cost indices | Not built | Zero references in code |
| Pipeline stack ranking | Not built | No scoring engine in Map app; no cross-app integration |

5 of 9 built, 4 not. Memo edits in v18.1 reframed the 4 not-built items as "in the development pipeline."

---

## 4. Cross-App Integration Surface (Track 8)

The integration target between the two apps. Currently the apps deploy independently but do not communicate. The five flows below are the build queue.

### Phase 8.1 — Map → Tax Benefits Gate 1 Handoff

**Spec:** HDC Deal Pipeline Screening Spec v1.0
**Status:** Endpoints not built
**Contract:** Address goes into Map app, JSON payload returns with OZ, OZ 2.0, DDA, QCT, SAFMR, transit, walkability, environmental critical areas (where applicable). Tax Benefits app's `POST /api/deal-conduits/from-proforma` endpoint consumes this payload to populate Category C fields in canonical schema.

### Phase 8.2 — Tax Benefits → Map Pipeline Visualization

**Spec:** Not yet specced
**Status:** Not built
**Contract:** Tax Benefits app exposes pipeline of in-flight deals; Map app pins them on the map with lane classification, projected returns, status. Required for "every project is stacked and ranked against all pipeline opportunities" claim.

### Phase 8.3 — Shared Investor Identity

**Spec:** Not yet specced
**Status:** Both apps have `InvestorTaxInfoController`; relationship undefined
**Decision:** Tax Benefits app owns investor records as source of truth. Map app reads via API, does not maintain its own investor schema. Map-side `InvestorTaxInfoController` becomes a client of Tax Benefits, not a source.

**Cross-app object-level authorization gap (CONFIRMED 2026-05-04):** Both apps currently expose endpoints that return resources without user-scoping:

| App | Controller | Endpoints | Issue |
|---|---|---|---|
| Map | `CalculatorConfigurationController` | `GET /all`, `GET /{id}` | Comment notes "for collaboration"; any authenticated user can read any other user's calculator configurations |
| Tax Benefits | `DealConduitController` | `GET /configurations/all`, `GET /{id}` | No `Principal`, no `@PreAuthorize`; any authenticated user can read any deal conduit by ID |

`InvestmentPoolController` is the only Tax Benefits controller using `@PreAuthorize`, and even that is role-based (`hasAnyRole('TEAM', 'ADMIN', ...)`), not object-level user-scoped.

**Implication for Phase 8.3:** When Phase 8.3 work begins, the object-level authorization spec must be **cross-app scoped, not Tax-Benefits-only**. Both repos have the same gap and the same investor/user identity model. One unified spec covers both. The current Tax Benefits Open Issue ("Object-level authorization | Pre-launch blocker" in `SPEC_REGISTRY_NOTES.md`) is filed as Tax-Benefits-only and should be re-scoped when the spec is written.

### Phase 8.4 — Map → Tax Benefits Deal Sourcing Trigger

**Spec:** Not yet specced
**Status:** Not built
**Contract:** Map app user identifies a parcel, runs intersection against eligibility layers, triggers "create deal in Tax Benefits app from this parcel." Address, lat/long, parcel data, eligibility flags pre-populate. Complements the CIE skill (which handles sponsor-proforma-sourced deals).

### Phase 8.5 — Cross-App Stack Rank Surface

**Spec:** Not yet specced
**Status:** Not built; `CalculatorConfigurationController` is the named seam, scope unclear
**Contract:** Single dashboard showing AHF pipeline ranked on both physical (Map app eligibility scoring) and financial (Tax Benefits app returns) dimensions. Lives in either app, accessible from both.

---

## 5. Continuous Validation via CIE Skills (Track 9)

The `proforma-to-tax-benefits` CIE skill is a permanent feedback loop on HDC architecture. Each deal that runs through the skill surfaces config or architectural defects in the Tax Benefits engine. Trace 4001 generated IMPLs 164, 165, 166. Future deals will generate more.

The Map app does not currently participate in this loop. Two future integration paths:

**Path A: Map app participates in canonical fixture library.** When a Map-sourced deal triggers Tax Benefits creation (Phase 8.4), the resulting reconciliation contributes fixtures to the shared regression suite (Phase 9.5). Map app needs no code changes; Phase 8.4 is the bridge.

**Path B: Map app has its own validation skill.** Future possibility if Map app gains its own complex calculations beyond service-layer aggregation. Not currently warranted; Map app math is enrichment, not regulated tax arithmetic.

Track 9 items live in Tax Benefits repo because the defects surface there. Map repo participates indirectly via Phase 8.4.

---

## 6. Map App Documentation Locations

| Document | Location | Notes |
|---|---|---|
| Map app capability audit | `~/Projects/map/specs/HDC_Map_App_Audit_Report.md` | Dated 2026-04-09; Section 8 superseded by Slate Memo Verification |
| Slate Memo Verification | `~/Projects/map/specs/SLATE_MEMO_CAPABILITY_VERIFICATION.md` | Committed 2026-05-04 (a1e5118); definitive on the three open Slate memo terms |
| Map app README | `~/Projects/map/README.md` | Four stale items fixed in 10f8295; five additional accuracy issues queued (regional framing, Zustand, Census API, DB IP, schema discrepancy) |
| Cross-app reference (Tax Benefits side) | `frontend/docs/reference/MAP_APP_INTEGRATION_REFERENCE.md` (this doc) | Lives in Tax Benefits repo |
| Cross-app reference (Map side) | `~/Projects/map/docs/TAX_BENEFITS_APP_INTEGRATION_REFERENCE.md` | Lives in Map repo; committed 10f8295 |
| Cross-App Sync Protocol | Both repos | `frontend/docs/registry/CROSS_APP_SYNC_PROTOCOL.md` (Tax Benefits) and `~/Projects/map/docs/CROSS_APP_SYNC_PROTOCOL.md` (Map) |

---

## 7. Cross-App Sync Protocol Reference

When either app has a material change affecting cross-app integration or capability, both reference docs get updated. Procedure:

1. Material change detected (new Map layer, new Tax Benefits IMPL affecting integration, new Track 8 phase work, change to investor identity ownership, etc.)
2. Update the local reference doc on the side where the change happened
3. Generate a diff or update note for the other side's reference doc
4. Queue a CC prompt for the other repo to apply the update
5. Bump version of both reference docs per vX.X (minor refinement = decimal, major change = whole number)
6. Note in Session-End Checklist Step 4 (Stale Docs)

Full protocol in `CROSS_APP_SYNC_PROTOCOL.md` (both repos).

---

## 8. Storage and Access

This document lives in the Tax Benefits repo at `frontend/docs/reference/MAP_APP_INTEGRATION_REFERENCE.md`. Currently uploaded to Tax Benefits project knowledge for Chat access.

Chat reads this doc to understand Map app capabilities when planning Track 8 integration work without re-auditing.

CC reads this doc when working on integration items (any Track 8 phase, any change touching `CalculatorConfigurationController` contracts, any work on shared investor identity).

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-04 | Initial document. Captures Map app capability state per April-9 audit + Slate Memo Verification + Brad's capability summary. Establishes Track 8 integration surface and Track 9 skill loop relationship. |
| 1.1 | 2026-05-04 | Added "Verified against Map repo as of 2026-05-04" timestamp to Section 2. Added `GeodataController` to §2.2 Spatial Operations and `MarkerController` to §2.5 User & Personalization (CC cross-check finding). Added cross-app object-level authorization gap to Phase 8.3 with concrete confirmation that `DealConduitController` (Tax Benefits) and `CalculatorConfigurationController` (Map) share the same pattern; flagged that the auth spec must be cross-app scoped, not Tax-Benefits-only. Updated §6 with current commit hashes (a1e5118 Slate verification, 10f8295 Map cross-app docs, 7220029 Tax Benefits cross-app docs) and removed stale `~/Projects/hdc-tax-calc/` local-machine path reference. |

---

*End of Map App Integration Reference v1.1*
