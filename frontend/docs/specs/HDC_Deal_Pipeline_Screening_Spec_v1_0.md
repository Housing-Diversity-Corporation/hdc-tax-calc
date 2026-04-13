# HDC Deal Pipeline Screening Specification
## Three-Gate Automated Deal Screening

**Version:** 1.0
**Date:** April 2026
**Status:** Design Complete — Endpoints Not Yet Built
**Author:** Brad Padden / HDC
**Source:** Angel architecture memo, April 10, 2026

**Relates to:**
- HDC Platform Product Roadmap v2.0 — Track 1 (Phase 1.3) and Track 2 (Phase 2.4)
- HDC Integration Spec v0.1 — publication interface
- HDC Canonical Deal Schema Spec v1.0 — deal profile structure

---

## 1. Purpose

This specification defines the three-gate automated deal screening pipeline that connects the HDC Map App (spatial qualification service) to the Tax Benefits Platform (calculation and investment quality service). It documents the service architecture, gate definitions, API contracts, and data flow established in the April 10, 2026 architecture session with Angel.

---

## 2. Architecture: Separate Services Model

The pipeline operates across two independent services connected by clean API contracts. This is not a monorepo architecture — each service owns its domain, its database, and its infrastructure.

### 2.1 HDC Map App

| Property | Value |
|---|---|
| Role | Spatial qualification service — Gate 1 |
| Database | PostgreSQL with PostGIS extension |
| Infrastructure | EC2 instance (GIS-optimized, CPU-intensive workloads) |
| Input | Address or coordinates |
| Output | JSON payload with OZ, QCT, DDA qualification data and metadata |

The Map App's database is a geodatabase: geometry columns, spatial indexes, GIS layer metadata. It does not store deal structures, investor profiles, or tax calculations. It receives an address, performs geocoding, runs the coordinates against the geodatabase, and returns results.

### 2.2 Tax Benefits Platform

| Property | Value |
|---|---|
| Role | Feasibility and investment quality service — Gates 2 and 3 |
| Database | AWS RDS (relational — investors, deals, tax projections, capital stacks) |
| Infrastructure | Spring Boot on EC2, RDS |
| Input | Enriched deal record from pipeline |
| Output | Pass/fail feasibility result; investment quality score |

### 2.3 Why Separate Services

The two databases serve fundamentally different purposes with no schema overlap. The Map App's PostGIS database is optimized for CPU-intensive geospatial compute (intersections, dynamic layer rendering, queries against 40+ national layers). The Tax Benefits Platform's RDS database handles fast relational queries against investors, deals, and capital stacks. These workloads have different resource profiles and should not compete for the same database instance.

The data contract between the Map App and the rest of the pipeline is intentionally narrow: an address goes in, a JSON response comes out. No shared types, no shared schemas, no shared deployment required.

---

## 3. Three-Gate Pipeline

Every deal entering the AHF pipeline passes through three sequential gates. Each gate is a service call. The pipeline sends the deal record to the appropriate service and receives a pass/fail or score result.

### Gate 1 — Spatial Qualification (HDC Map API)

| Property | Value |
|---|---|
| Service | HDC Map App |
| Input | Property address |
| Output | JSON with OZ/QCT/DDA qualification + metadata |
| Pass Criteria | Property meets minimum spatial eligibility requirements |

**What the Map App returns:**

```json
{
  "ozEnabled": true,
  "ozVersion": "2.0",
  "qualifiedBasisBoost": 1.30,
  "qdaQctStatus": "QCT",
  "propertyState": "WA",
  "coordinates": { "lat": 47.6062, "lng": -122.3321 },
  "eligibilityMetadata": { ... }
}
```

This JSON payload directly populates the Category C fields in the HDC Canonical Deal Schema (see Canonical Schema Spec v1.0 §2 — Platform Intelligence fields).

### Gate 2 — Feasibility (Tax Benefits Platform)

| Property | Value |
|---|---|
| Service | Tax Benefits Platform |
| Input | Enriched deal record (Gate 1 output + deal parameters) |
| Output | Pass/fail with DSCR, PAB threshold, capital stack analysis |
| Pass Criteria | Deal passes minimum DSCR covenant, PAB threshold, and capital stack feasibility |
| Endpoint | `POST /api/deal-conduits/from-proforma` |

The Tax Benefits Platform runs DSCR calculation, PAB volume cap threshold check, and capital stack feasibility analysis against the deal parameters. Returns pass/fail with supporting detail.

### Gate 3 — Investment Quality (Tax Benefits Platform)

| Property | Value |
|---|---|
| Service | Tax Benefits Platform |
| Input | Deal ID (from Gate 2 pass) |
| Output | Investment quality score (IRR, MOIC, tax benefit utilization by investor archetype) |
| Endpoint | `GET /api/deal-conduits/{id}/stack-rank` |
| Status | Specified, not yet built |

The platform runs the HDC Reference Investor Profile against the deal's benefit stream and returns an investment quality score. This score feeds the pipeline dashboard stack rank (Track 1, Phase 1.4 of the Platform Roadmap).

---

## 4. API Contracts

### 4.1 POST /api/deal-conduits/from-proforma

**Purpose:** Creates a deal conduit record in the Tax Benefits Platform from a structured proforma payload. This is the Gate 2 entry point — the pipeline sends the enriched deal record and the platform creates a deal profile and runs feasibility analysis.

**Status:** Specified, not yet built. This is Angel's Item 7 from the April 10, 2026 backend task list.

**Request body:** Structured deal payload derived from the canonical schema Category A + B + C fields. Exact schema to be defined when Angel implements.

**Response:**
```json
{
  "dealConduitId": "uuid",
  "feasibilityResult": {
    "passed": true,
    "dscr": 1.18,
    "pabThresholdMet": true,
    "capitalStackFeasible": true,
    "notes": []
  }
}
```

### 4.2 GET /api/deal-conduits/{id}/stack-rank

**Purpose:** Returns the investment quality score for a deal that has passed Gate 2 feasibility. Runs the HDC Reference Investor Profile against the deal's benefit stream and returns IRR, MOIC, and tax benefit utilization metrics that feed the pipeline stack rank.

**Status:** Specified, not yet built. This is Angel's Item 8 from the April 10, 2026 backend task list.

**Response:**
```json
{
  "dealConduitId": "uuid",
  "stackRankScore": 87.4,
  "projectedIRR": 0.127,
  "projectedMOIC": 1.91,
  "taxBenefitUtilization": 0.94,
  "archetypeFit": "A",
  "rankingMetadata": { ... }
}
```

---

## 5. Data Flow

```
Developer submits deal address and parameters
         ↓
Gate 1: HDC Map API
  Address → geocode → PostGIS spatial query
  Returns: OZ/QCT/DDA status + metadata (Category C fields)
         ↓ (on pass)
Pipeline enriches deal record with Gate 1 output
         ↓
Gate 2: POST /api/deal-conduits/from-proforma
  Enriched deal record → Tax Benefits Platform
  Runs: DSCR, PAB threshold, capital stack feasibility
  Returns: pass/fail + deal conduit ID
         ↓ (on pass)
Gate 3: GET /api/deal-conduits/{id}/stack-rank
  Deal conduit ID → Tax Benefits Platform
  Runs: HDC Reference Investor Profile against benefit stream
  Returns: investment quality score, IRR, MOIC, archetype fit
         ↓
Pipeline Dashboard (Track 1, Phase 1.4)
  Stack rank updated with Gate 3 score
  Deal moves to "Screened" status
```

**On gate failure:** Deal is flagged in the pipeline dashboard with the failing gate and reason. Does not proceed to subsequent gates. HDC team reviews manually.

---

## 6. Relationship to Other Specs

| Spec | Relationship |
|---|---|
| HDC Platform Product Roadmap v2.0 | This pipeline implements Track 1 Phase 1.3 (geospatial screening) and Track 2 Phase 2.4 (proforma engine publication interface) |
| HDC Canonical Deal Schema Spec v1.0 | Gate 1 output populates Category C fields; Gate 2 input is Category A + B + C fields |
| HDC Integration Spec v0.1 | Gate 2 endpoint (`POST /api/deal-conduits/from-proforma`) is the publication interface defined in that spec |
| HDC Deal Pipeline Screening Spec (this doc) | Supersedes the pipeline description scattered across roadmap and integration spec |

---

## 7. Open Items

| Item | Owner | Priority |
|---|---|---|
| Implement `POST /api/deal-conduits/from-proforma` — Angel Item 7 | Angel | High — pipeline connection point |
| Implement `GET /api/deal-conduits/{id}/stack-rank` — Angel Item 8 | Angel | High — pipeline connection point |
| Define exact request body schema for Gate 2 endpoint | Angel / Brad | High — required before implementation |
| Define HDC Reference Investor Profile used in Gate 3 scoring | Brad | High — determines stack rank output |
| Gate 1 pass/fail criteria — minimum spatial eligibility requirements | Brad | Medium |
| Pipeline orchestration layer — what coordinates the three gate calls | Brad / Angel | Medium — not yet designed |
| Error handling and retry logic for gate failures | Angel | Medium |

---

## 8. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | April 2026 | Initial specification. Source: Angel architecture memo April 10, 2026. Three-gate pipeline, separate services architecture, API contracts for both pipeline endpoints, data flow, open items. |

---

*End of HDC Deal Pipeline Screening Specification v1.0*
