# HDC Canonical Deal Schema Specification
## The Rosetta Stone — Field Definitions, Sources, and Mappings Across All Systems

**Version:** 1.0  
**Date:** April 2026  
**Author:** Brad Padden / HDC  
**Status:** Draft for Review  

**Depends On:**
- HDC Tax Benefits Platform Spec v6.0
- HDC Proforma Engine Spec v2.0
- HDC Deal Ingestion Engine Spec v1.0
- HDC Integration Spec v0.1

**Consumed By:**
- Claude in Excel (CIE) — extraction target for Category A fields
- HDC Platform app — input panels for Category B fields
- Geospatial / National Screening Map — source for Category C fields
- Investor record system — source for Category D fields
- Calculation engine — all fields combined into CalculationParams
- Deal snapshots — complete frozen copy at publish event
- Integration publication interface — typed contract to Tax Benefits Platform

---

## 1. Purpose and Governing Principle

This specification defines every field in the HDC canonical deal schema — its named range, data type, validation rules, source category, default value, and system mapping. It is the single document that all other specs reference for field definitions. If a field definition changes, it changes here first, and downstream specs are updated to match.

**The governing principle:** Every field has exactly one authoritative source. No field is entered twice. No field is derived in the UI if it can be derived in the engine. No field is left undefined in the schema even if it is optional at runtime.

---

## 2. Source Category Definitions

Every field belongs to exactly one source category. The category determines where the value comes from and which system is responsible for populating it.

| Category | Label | Source | Who Populates |
|---|---|---|---|
| **A** | Developer model | Developer's submitted Excel proforma | Claude in Excel (CIE) extracts |
| **B** | HDC structuring | HDC deal decisions not in developer model | Analyst enters in app |
| **C** | Platform intelligence | Geospatial, state conformity, HFA data | Platform auto-populates |
| **D** | Investor profile | Per-investor tax and financial profile | Pulled from investor record |
| **E** | Derived / default | Calculated from other fields or HDC standard | Engine computes or applies default |

The four input flows converge on one saved profile:

```
Category A  →  CIE extraction from developer Excel
Category B  →  Analyst input in app deal panels
Category C  →  Platform geospatial + state intelligence layer     →  Saved Deal Profile
Category D  →  Investor record (per-investor, not per-deal)
Category E  →  Engine defaults + derivations
```

Category D fields are investor-specific, not deal-specific. They live in the investor record and are merged with the deal profile at calculation time, not stored on the deal itself. A single deal can be run against multiple investor profiles simultaneously.

---

## 3. Field Registry

### 3.1 Project Fundamentals

| Field | Named Range | Type | Category | Validation | Default | CIE Extraction Notes |
|---|---|---|---|---|---|---|
| Project Cost | `ProjectCost` | number ($M) | **A** | > 0 | none — required | "Total project cost", "Total development cost", "Total uses" — common labels |
| Land Value | `LandValue` | number ($M) | **A** | >= 0 | 0 | "Land", "Land acquisition", "Land cost" |
| Predevelopment Costs | `PredevelopmentCosts` | number ($M) | **A** | >= 0 | 0 | "Predevelopment", "Pre-dev costs", "Soft costs pre-construction" |
| Project Location | `ProjectLocation` | string | **A/C** | valid address or coordinates | none — required | Address field on cover sheet; platform geocodes and overlays OZ/QCT/DDA |
| Number of Units | `Units` | integer | **A** | > 0 | none — required | "Total units", "Unit count", "#units" |
| Property State | `PropertyState` | string (2-char) | **C** | valid US state code | derived from ProjectLocation | Auto-derived from geocoding; drives state LIHTC, PW rules |
| Hold Period | `HoldPeriod` | integer (years) | **B** | 10–30 | 14 | Not extracted from developer model — HDC decision |

### 3.2 Operating Assumptions

| Field | Named Range | Type | Category | Validation | Default | CIE Extraction Notes |
|---|---|---|---|---|---|---|
| Stabilized NOI | `YearOneNOI` | number ($M) | **A** | > 0 | none — required | "Stabilized NOI", "Year 1 NOI", "Net operating income" — most prominent figure in model |
| NOI Growth Rate | `NoiGrowthRate` | number (%) | **A** | 0–10% | 3% | "NOI growth", "Revenue growth", "Annual escalator" |
| Exit Cap Rate | `ExitCapRate` | number (%) | **A/B** | 3–10% | none — no default | Extracted if present; analyst must confirm — too deal-specific for default |
| Stabilized Occupancy | `StabilizedOccupancy` | number (%) | **A** | 50–100% | 95% | "Occupancy", "Physical occupancy", "Stabilized occupancy" |
| Lease-Up Months | `LeaseUpMonths` | integer | **A/B** | 1–36 | 18 | "Lease-up period", "Absorption"; analyst confirms |
| Construction Delay | `ConstructionDelayMonths` | integer | **A/B** | 0–24 | 0 | "Construction timeline"; analyst overrides for HDC structuring |

### 3.3 Senior Debt

| Field | Named Range | Type | Category | Validation | Default | CIE Extraction Notes |
|---|---|---|---|---|---|---|
| Senior Debt (%) | `SeniorDebtPct` | number (%) | **A** | 0–80% | none — required | "Senior loan LTV", "First mortgage %", "Debt %" of total cost |
| Senior Debt Rate | `SeniorDebtRate` | number (%) | **A** | 0–15% | none — required | "Interest rate", "Senior rate", "Mortgage rate" |
| Senior Debt Term | `SeniorDebtTerm` | integer (years) | **A** | 1–40 | 14 | "Loan term", "Maturity" |
| Senior Debt Amort | `SeniorDebtAmort` | integer (years) | **A** | 1–40 | 35 | "Amortization", "Amort period" |
| Senior Debt IO Years | `SeniorDebtIOYears` | integer | **A/B** | 0–10 | 0 | "Interest only period", "IO years" |

### 3.4 Philanthropic Debt

All philanthropic debt fields are HDC structuring decisions. Developer models do not contain them.

| Field | Named Range | Type | Category | Validation | Default |
|---|---|---|---|---|---|
| Phil Debt (%) | `PhilDebtPct` | number (%) | **B** | 0–50% | 0 |
| Phil Debt Rate | `PhilDebtRate` | number (%) | **B** | 0–10% | 3% |
| Phil Debt Amortization | `PhilDebtAmort` | integer (years) | **B** | 1–40 | 30 |
| Phil Current Pay Enabled | `PhilCurrentPayEnabled` | boolean | **B** | 0 or 1 | 1 |
| Phil Current Pay (%) | `PhilCurrentPayPct` | number (%) | **B** | 0–100% | 50% |

### 3.5 Equity Structure

HDC-specific equity structuring. Not in developer models.

| Field | Named Range | Type | Category | Validation | Default |
|---|---|---|---|---|---|
| Investor Equity (%) | `InvestorEquityPct` | number (%) | **B** | 0–100% | derived from auto-balance |
| Philanthropic Equity (%) | `PhilEquityPct` | number (%) | **B** | 0–50% | 0 |
| Investor Equity Ratio (%) | `InvestorEquityRatio` | number (%) | **B** | 0–100% | 50% |
| Auto-Balance Capital | `AutoBalanceCapital` | boolean | **B** | 0 or 1 | 1 |
| Investor Promote Share (%) | `InvestorPromoteShare` | number (%) | **B** | 0–100% | 75% |
| Promote Hurdle Rate (%) | `PromoteHurdleRate` | number (%) | **B** | 0–30% | 8% |

### 3.6 Sub-Debt Layers

All sub-debt is HDC structuring. Not in developer models.

| Field | Named Range | Type | Category | Default |
|---|---|---|---|---|
| HDC Sub-Debt (%) | `HDCSubDebtPct` | number (%) | **B** | 0 |
| HDC Sub-Debt PIK Rate | `HDCSubDebtPIKRate` | number (%) | **B** | 8% |
| HDC PIK Current Pay Enabled | `HDCPIKCurrentPayEnabled` | boolean | **B** | 0 |
| HDC PIK Current Pay (%) | `HDCPIKCurrentPayPct` | number (%) | **B** | 50% |
| Investor Sub-Debt (%) | `InvestorSubDebtPct` | number (%) | **B** | 0 |
| Investor Sub-Debt PIK Rate | `InvestorSubDebtPIKRate` | number (%) | **B** | 8% |
| Inv PIK Current Pay Enabled | `InvestorPIKCurrentPayEnabled` | boolean | **B** | 0 |
| Inv PIK Current Pay (%) | `InvestorPIKCurrentPayPct` | number (%) | **B** | 50% |
| Outside Sub-Debt (%) | `OutsideSubDebtPct` | number (%) | **B** | 0 |
| Outside PIK Rate | `OutsidePIKRate` | number (%) | **B** | 8% |
| Outside Amortization | `OutsideSubDebtAmort` | integer (years) | **B** | 10 |
| Outside Current Pay Enabled | `OutsideCurrentPayEnabled` | boolean | **B** | 0 |
| Outside Current Pay (%) | `OutsideCurrentPayPct` | number (%) | **B** | 0 |
| Sub-Debt Priority: Outside | `SubDebtPriorityOutside` | integer | **B** | 1 |
| Sub-Debt Priority: HDC | `SubDebtPriorityHDC` | integer | **B** | 2 |
| Sub-Debt Priority: Investor | `SubDebtPriorityInvestor` | integer | **B** | 3 |
| HDC Debt Fund (%) | `HDCDebtFundPct` | number (%) | **B** | 0 |
| HDC DF PIK Rate | `HDCDFPIKRate` | number (%) | **B** | 8% |
| HDC DF Current Pay Enabled | `HDCDFCurrentPayEnabled` | boolean | **B** | 0 |
| HDC DF Current Pay (%) | `HDCDFCurrentPayPct` | number (%) | **B** | 50% |

### 3.7 PAB Structure

HDC brings the PAB structure. Not in developer models for Lane 1 and Lane 4 deals.

| Field | Named Range | Type | Category | Validation | Default |
|---|---|---|---|---|---|
| PAB Enabled | `PABEnabled` | boolean | **B** | 0 or 1 | 1 for LIHTC deals |
| PAB % of Eligible Basis | `PABPctOfEligibleBasis` | number (%) | **B** | 25–100% | 30% |
| PAB Rate | `PABRate` | number (%) | **B** | 0–10% | 4.5% |
| PAB Term | `PABTerm` | integer (years) | **B** | 1–40 | 40 |
| PAB Amortization | `PABAmortization` | integer (years) | **B** | 1–40 | 35 |
| PAB IO Years | `PABIOYears` | integer | **B** | 0–10 | 0 |

### 3.8 LIHTC Parameters

| Field | Named Range | Type | Category | Validation | Default | Notes |
|---|---|---|---|---|---|---|
| Federal LIHTC Enabled | `FedLIHTCEnabled` | boolean | **B** | 0 or 1 | 1 | HDC decision |
| LIHTC Eligible Basis | `LIHTCEligibleBasis` | number ($M) | **A/B** | > 0 | derived from ProjectCost - LandValue - exclusions | CIE extracts if present; analyst confirms |
| Applicable Fraction | `ApplicableFraction` | number (%) | **B** | 40–100% | 100% | HDC structuring decision |
| LIHTC Rate | `LIHTCRate` | number (%) | **E** | 4% only | 4% | Always 4% for PAB deals — derived, not entered |
| Qualified Basis Boost | `QualifiedBasisBoost` | boolean | **C** | 0 or 1 | derived from QCT/DDA overlay | Platform auto-detects from geospatial layer |
| Commercial Space Costs | `CommercialSpaceCosts` | number ($M) | **A** | >= 0 | 0 | Exclusion from eligible basis |
| Syndication Costs | `SyndicationCosts` | number ($M) | **A** | >= 0 | 0 | Exclusion |
| Marketing/Org Costs | `MarketingCosts` | number ($M) | **A** | >= 0 | 0 | Exclusion |
| Financing Fees | `FinancingFees` | number ($M) | **A** | >= 0 | 0 | Exclusion |
| Bond Issuance Costs | `BondIssuanceCosts` | number ($M) | **A** | >= 0 | 0 | Exclusion |
| Operating Deficit Reserve | `OperatingDeficitReserve` | number ($M) | **A** | >= 0 | 0 | Exclusion |
| Replacement Reserve | `ReplacementReserve` | number ($M) | **A** | >= 0 | 0 | Exclusion |
| Other Exclusions | `OtherExclusions` | number ($M) | **A/B** | >= 0 | 0 | Catch-all; analyst confirms |

### 3.9 State LIHTC

| Field | Named Range | Type | Category | Notes |
|---|---|---|---|---|
| State LIHTC Enabled | `StateLIHTCEnabled` | boolean | **C** | Auto-set based on PropertyState |
| State LIHTC Rate | `StateLIHTCRate` | number (%) | **C** | From state LIHTC program table |
| State LIHTC Annual Credit | `StateLIHTCAnnualCredit` | number ($M) | **E** | Derived from federal credit × state rate |
| State LIHTC Syndication Rate | `StateLIHTCSyndRate` | number (%) | **C/B** | Default from state program; analyst overrides |
| State LIHTC Path | `StateLIHTCPath` | enum | **B** | 'syndicated' or 'direct_use' |
| State LIHTC Syndication Year | `StateLIHTCSyndYear` | integer | **B** | 0 = at close |
| Investor Has State Liability | `InvestorHasStateLiability` | boolean | **D** | Per-investor; from investor record |
| State LIHTC User Percentage | `StateLIHTCUserPct` | number (%) | **D** | Per-investor |
| State LIHTC User Amount | `StateLIHTCUserAmount` | number ($M) | **E** | Derived |

### 3.10 Depreciation and Tax Mechanics

| Field | Named Range | Type | Category | Validation | Default | Notes |
|---|---|---|---|---|---|---|
| Cost Segregation (%) | `CostSegPct` | number (%) | **E** | 15–30% | 20% | HDC empirical default; deal-level override permitted |
| Bonus Depreciation (%) | `BonusDepreciationPct` | number (%) | **C** | 0–100% | 100% | From state conformity table based on PropertyState |
| Include Depreciation Schedule | `IncludeDepreciationSchedule` | boolean | **B** | 0 or 1 | 1 | |
| Loan Fees (%) | `LoanFeesPct` | number (%) | **A** | 0–5% | 0 | |
| Legal/Structuring Costs | `LegalStructuringCosts` | number ($M) | **A** | >= 0 | 0 | |
| Organization Costs | `OrganizationCosts` | number ($M) | **B** | >= 0 | 0 | HDC structuring cost |

### 3.11 HDC Fee Structure

| Field | Named Range | Type | Category | Default | Notes |
|---|---|---|---|---|---|
| HDC Fee Rate (%) | `HDCFeeRate` | number (%) | **B** | 10% | Under review — may be eliminated per fee simplification |
| HDC Deferred Interest Rate | `HDCDeferredInterestRate` | number (%) | **B** | 8% | |
| AUM Fee Enabled | `AUMFeeEnabled` | boolean | **B** | 1 | |
| AUM Fee (%) | `AUMFeePct` | number (%) | **B** | 1% | |
| AUM Current Pay Enabled | `AUMCurrentPayEnabled` | boolean | **B** | 0 | |
| AUM Current Pay (%) | `AUMCurrentPayPct` | number (%) | **B** | 50% | |
| HDC Platform Mode | `HDCPlatformMode` | enum | **B** | 'traditional' | |

### 3.12 Advance Financing

| Field | Named Range | Type | Category | Default |
|---|---|---|---|---|
| HDC Advance Financing Enabled | `HDCAdvanceFinancing` | boolean | **B** | 0 |
| Tax Advance Discount Rate (%) | `TaxAdvanceDiscountRate` | number (%) | **B** | 20% |
| Advance Financing Rate (%) | `AdvanceFinancingRate` | number (%) | **B** | 8% |
| Tax Delivery Months | `TaxDeliveryMonths` | integer | **B** | 12 |

### 3.13 Interest Reserve and Preferred Equity

| Field | Named Range | Type | Category | Default |
|---|---|---|---|---|
| Interest Reserve Enabled | `InterestReserveEnabled` | boolean | **B** | 0 |
| Interest Reserve Months | `InterestReserveMonths` | integer | **B** | 18 |
| Pref Equity Enabled | `PrefEquityEnabled` | boolean | **B** | 0 |
| Pref Equity (%) | `PrefEquityPct` | number (%) | **B** | 0 |
| Pref Equity Target MOIC | `PrefEquityTargetMOIC` | number | **B** | 1.7 |
| Pref Equity Accrual Rate | `PrefEquityAccrualRate` | number (%) | **B** | 12% |
| Pref Equity OZ Eligible | `PrefEquityOZEligible` | boolean | **B** | 0 |

### 3.14 Opportunity Zone Parameters

| Field | Named Range | Type | Category | Notes |
|---|---|---|---|---|
| OZ Enabled | `OZEnabled` | boolean | **C** | Auto-set from geospatial OZ tract overlay |
| OZ Version | `OZVersion` | integer | **C** | 1 = original OZ, 2 = OZ 2.0; from IRS tract list |
| OZ Type | `OZType` | enum | **B** | 'standard' or 'qof-qozb'; HDC structural decision |
| OZ Step-Up (%) | `OZStepUpPct` | number (%) | **E** | Derived from investment date and hold period |

### 3.15 Investor Tax Profile (Category D — Per Investor, Not Per Deal)

These fields are stored on the investor record, not the deal. They are merged with deal parameters at calculation time. A deal profile does not contain these fields — the calculation engine receives them separately per investor.

| Field | Named Range | Type | Source Record | Notes |
|---|---|---|---|---|
| Federal Tax Rate | `FederalTaxRate` | number (%) | investor_tax_info | Derived from income; not manually entered |
| NIIT Rate | `NIITRate` | number (%) | investor_tax_info | Always 3.8% or 0; derived |
| State Tax Rate | `StateTaxRate` | number (%) | investor_tax_info | From InvestorState conformity table |
| LT Capital Gains Rate | `LTCapitalGainsRate` | number (%) | investor_tax_info | 20% standard; derived |
| State Capital Gains Rate | `StateCapitalGainsRate` | number (%) | investor_tax_info | From InvestorState |
| Investor State | `InvestorState` | string | investor_tax_info | 2-char state code |
| State Conforms to Federal | `StateConforms` | boolean | investor_tax_info | From state conformity table |
| Investor Track | `InvestorTrack` | enum | investor_tax_info | 'rep' or 'non-rep' |
| Is REP | `IsREP` | boolean | investor_tax_info | Real Estate Professional status |
| Grouping Election | `GroupingElection` | boolean | investor_tax_info | §469 grouping election status |
| Passive Gain Type | `PassiveGainType` | enum | investor_tax_info | 'short-term' or 'long-term' |
| Investor Type | `InvestorType` | enum | investor_tax_info | 'ordinary', 'capital-gains', etc. |
| W2 Income | `W2Income` | number ($) | investor_tax_info | Annual W2 |
| Business Income | `BusinessIncome` | number ($) | investor_tax_info | QBI / pass-through |
| IRA Balance | `IRABalance` | number ($) | investor_tax_info | For Roth conversion modeling |
| Passive Income | `PassiveIncome` | number ($) | investor_tax_info | Annual passive income |
| Asset Sale Gain | `AssetSaleGain` | number ($) | investor_tax_info | Deferred gain source event |
| Annual Income | `AnnualIncome` | number ($) | investor_tax_info | Total gross income |
| Filing Status | `FilingStatus` | enum | investor_tax_info | 'single' or 'married-filing-jointly' |
| Deferred Gain | `DeferredGain` | number ($M) | investor_tax_info | OZ deferral amount |
| Capital Gains Tax Rate | `CapitalGainsTaxRate` | number (%) | investor_tax_info | Blended rate on deferred gain |
| OZ Capital Gains Tax Rate | `OZCapitalGainsTaxRate` | number (%) | investor_tax_info | Rate applicable to OZ investment |

---

## 4. Field Count by Category

| Category | Label | Field Count | Populated By |
|---|---|---|---|
| A | Developer model | 27 | CIE extraction |
| B | HDC structuring | 48 | Analyst — app input panels |
| C | Platform intelligence | 8 | Auto-populated — geospatial + state tables |
| D | Investor profile | 22 | Investor record — merged at calculation time |
| E | Derived / default | 7 | Engine computes |
| **Total** | | **112** | |

---

## 5. CIE Extraction Target — Category A Fields

The following 27 fields are CIE's extraction targets from a developer's submitted Excel model. CIE applies confidence scoring per the Deal Ingestion Engine Spec. Fields with no default require analyst confirmation before a profile can be saved.

### High Confidence (CIE auto-maps, no analyst review needed)
These labels are consistent enough across developer models that CIE can extract them reliably:

| Field | Common Labels in Developer Models |
|---|---|
| ProjectCost | "Total project cost", "Total uses", "Total development cost", "Total capitalization" |
| Units | "Total units", "Unit count", "# of units", "Residential units" |
| YearOneNOI | "Stabilized NOI", "Year 1 NOI", "Net operating income (stabilized)" |
| SeniorDebtPct | "Senior loan LTV", "First mortgage %", "Debt ratio" |
| SeniorDebtRate | "Interest rate", "Senior rate", "Note rate", "Coupon" |
| SeniorDebtTerm | "Loan term", "Maturity (years)" |
| SeniorDebtAmort | "Amortization", "Amort period", "Loan amortization" |
| StabilizedOccupancy | "Occupancy", "Physical occupancy", "Stabilized occupancy %" |
| LandValue | "Land", "Land acquisition", "Land cost", "Site acquisition" |

### Medium Confidence (CIE flags for quick analyst confirmation)
Values are usually present but labeling varies enough to warrant a quick check:

| Field | Common Labels | Reason for Medium Confidence |
|---|---|---|
| LIHTCEligibleBasis | "Eligible basis", "Qualified basis pre-boost" | May be absent in non-LIHTC models |
| NoiGrowthRate | "Revenue growth", "NOI escalator", "Annual growth" | May be embedded in assumptions tab |
| ExitCapRate | "Exit cap", "Terminal cap rate", "Residual cap" | Sometimes missing; no default |
| LeaseUpMonths | "Lease-up", "Absorption period" | Sometimes in narrative, not model |
| ConstructionDelayMonths | "Construction timeline", "Development period" | Often in timeline not model |
| SeniorDebtIOYears | "IO period", "Interest only years" | Often 0 and omitted |
| FinancingFees | "Financing costs", "Loan fees" | Often in soft cost schedule |
| BondIssuanceCosts | "Bond costs", "Issuance costs" | LIHTC-specific; absent in market-rate |
| SyndicationCosts | "Syndication", "Credit syndication fees" | LIHTC-specific |
| CommercialSpaceCosts | "Commercial", "Retail space costs" | Present only in mixed-use |
| PredevelopmentCosts | "Predevelopment", "Pre-dev" | Sometimes rolled into soft costs |
| ReplacementReserve | "Replacement reserve", "Capital reserve" | Sometimes in operating budget |
| OperatingDeficitReserve | "Operating reserve", "Deficit reserve" | Sometimes missing |
| MarketingCosts | "Marketing", "Lease-up costs" | Sometimes absent |

### Low Confidence / Not Expected in Developer Model
These are listed for completeness. CIE will not find them; analyst enters directly in app:

| Field | Why Not in Developer Model |
|---|---|
| LegalStructuringCosts | HDC-specific legal costs not in developer's model |
| LoanFeesPct | HDC financing structure not yet determined |
| OtherExclusions | Deal-specific; requires analyst judgment |

---

## 6. Platform Intelligence Layer — Category C Fields

These fields are auto-populated by the platform without analyst action. They require the geospatial overlay and state conformity tables to be current.

| Field | Data Source | Update Cadence | Fallback if Unavailable |
|---|---|---|---|
| PropertyState | Geocoding from ProjectLocation | Real-time | Analyst manual entry |
| OZEnabled | IRS OZ tract shapefile | Annual (IRS Rev. Proc.) | Analyst manual toggle |
| OZVersion | OZ 2.0 eligible tract list | Annual | Analyst manual entry |
| QualifiedBasisBoost | QCT/DDA designation from HUD | Annual | Analyst manual toggle |
| BonusDepreciationPct | State conformity table | Quarterly verified | Platform flag + analyst override |
| StateLIHTCEnabled | State LIHTC program table | Quarterly verified | Analyst manual toggle |
| StateLIHTCRate | State LIHTC program table | Quarterly verified | Analyst manual entry |
| StateConforms | State conformity table | Quarterly verified | Analyst manual toggle |

---

## 7. Derived Fields — Category E

These fields are never entered. They are always computed.

| Field | Derivation |
|---|---|
| LIHTCRate | Always 4.0% for PAB-financed deals. Hard-coded in engine. |
| BonusDepreciationPct | From state conformity table for PropertyState. 100% federal if state conforms. |
| CostSegPct | Default 20% per HDC empirical standard (11-study validation). Deal-level override permitted. |
| StateLIHTCAnnualCredit | LIHTCEligibleBasis × ApplicableFraction × QualifiedBasisBoost × StateLIHTCRate |
| OZStepUpPct | Derived from investment date: 10% if invested before 12/31/2026 and held 5+ years. 0% otherwise. |
| FederalTaxRate | Derived from AnnualIncome + FilingStatus per IRS bracket table. Not manually entered. |
| NIITRate | 3.8% if AnnualIncome exceeds NIIT threshold for FilingStatus. 0% otherwise. |

---

## 8. Database Schema

The canonical schema maps to the following PostgreSQL table structure. Category D fields live in `investor_tax_info` (existing table). Categories A, B, C, and E live in the deal tables below.

```sql
-- Core deal record (one row per deal, current state)
CREATE TABLE deals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_name                   VARCHAR(255) NOT NULL,
  deal_lane                   INTEGER NOT NULL CHECK (deal_lane IN (1, 2, 3, 4)),
  status                      VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- 'draft' | 'internal_review' | 'published' | 'archived'
  source_type                 VARCHAR(50) NOT NULL DEFAULT 'manual_entry',
  -- 'manual_entry' | 'cie_import' | 'proforma_import'
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                  UUID NOT NULL REFERENCES users(id),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by                  UUID NOT NULL REFERENCES users(id),
  active_snapshot_id          UUID REFERENCES deal_snapshots(id)
  -- null until first publish
);

-- Category A + B + C + E fields (deal parameters)
-- Normalized into logical groups matching the input panels
CREATE TABLE deal_project (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  project_cost                NUMERIC(12,4),
  land_value                  NUMERIC(12,4),
  predevelopment_costs        NUMERIC(12,4),
  project_location            TEXT,
  project_location_lat        NUMERIC(10,7),
  project_location_lng        NUMERIC(10,7),
  units                       INTEGER,
  property_state              CHAR(2),
  hold_period                 INTEGER
);

CREATE TABLE deal_operating (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  year_one_noi                NUMERIC(12,4),
  noi_growth_rate             NUMERIC(6,4),
  exit_cap_rate               NUMERIC(6,4),
  stabilized_occupancy        NUMERIC(6,4),
  lease_up_months             INTEGER,
  construction_delay_months   INTEGER
);

CREATE TABLE deal_senior_debt (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  senior_debt_pct             NUMERIC(6,4),
  senior_debt_rate            NUMERIC(6,4),
  senior_debt_term            INTEGER,
  senior_debt_amort           INTEGER,
  senior_debt_io_years        INTEGER
);

CREATE TABLE deal_phil_debt (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  phil_debt_pct               NUMERIC(6,4),
  phil_debt_rate              NUMERIC(6,4),
  phil_debt_amort             INTEGER,
  phil_current_pay_enabled    BOOLEAN,
  phil_current_pay_pct        NUMERIC(6,4)
);

CREATE TABLE deal_equity (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  investor_equity_pct         NUMERIC(6,4),
  phil_equity_pct             NUMERIC(6,4),
  investor_equity_ratio       NUMERIC(6,4),
  auto_balance_capital        BOOLEAN,
  investor_promote_share      NUMERIC(6,4),
  promote_hurdle_rate         NUMERIC(6,4)
);

CREATE TABLE deal_sub_debt (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  hdc_sub_debt_pct            NUMERIC(6,4),
  hdc_sub_debt_pik_rate       NUMERIC(6,4),
  hdc_pik_current_pay_enabled BOOLEAN,
  hdc_pik_current_pay_pct     NUMERIC(6,4),
  investor_sub_debt_pct       NUMERIC(6,4),
  investor_sub_debt_pik_rate  NUMERIC(6,4),
  inv_pik_current_pay_enabled BOOLEAN,
  inv_pik_current_pay_pct     NUMERIC(6,4),
  outside_sub_debt_pct        NUMERIC(6,4),
  outside_pik_rate            NUMERIC(6,4),
  outside_sub_debt_amort      INTEGER,
  outside_current_pay_enabled BOOLEAN,
  outside_current_pay_pct     NUMERIC(6,4),
  sub_debt_priority_outside   INTEGER,
  sub_debt_priority_hdc       INTEGER,
  sub_debt_priority_investor  INTEGER,
  hdc_debt_fund_pct           NUMERIC(6,4),
  hdc_df_pik_rate             NUMERIC(6,4),
  hdc_df_current_pay_enabled  BOOLEAN,
  hdc_df_current_pay_pct      NUMERIC(6,4)
);

CREATE TABLE deal_lihtc (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  fed_lihtc_enabled           BOOLEAN,
  lihtc_eligible_basis        NUMERIC(12,4),
  applicable_fraction         NUMERIC(6,4),
  -- lihtc_rate is always 4.0 for PAB deals; derived, not stored
  qualified_basis_boost       BOOLEAN,
  pab_enabled                 BOOLEAN,
  pab_pct_of_eligible_basis   NUMERIC(6,4),
  pab_rate                    NUMERIC(6,4),
  pab_term                    INTEGER,
  pab_amortization            INTEGER,
  pab_io_years                INTEGER,
  commercial_space_costs      NUMERIC(12,4),
  syndication_costs           NUMERIC(12,4),
  marketing_costs             NUMERIC(12,4),
  financing_fees              NUMERIC(12,4),
  bond_issuance_costs         NUMERIC(12,4),
  operating_deficit_reserve   NUMERIC(12,4),
  replacement_reserve         NUMERIC(12,4),
  other_exclusions            NUMERIC(12,4)
);

CREATE TABLE deal_state_lihtc (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  state_lihtc_enabled         BOOLEAN,
  state_lihtc_rate            NUMERIC(6,4),
  state_lihtc_synd_rate       NUMERIC(6,4),
  state_lihtc_path            VARCHAR(20),
  state_lihtc_synd_year       INTEGER
);

CREATE TABLE deal_oz (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  oz_enabled                  BOOLEAN,
  oz_version                  INTEGER,
  oz_type                     VARCHAR(20)
  -- oz_step_up_pct is derived from investment date; not stored
);

CREATE TABLE deal_depreciation (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  cost_seg_pct                NUMERIC(6,4),
  bonus_depreciation_pct      NUMERIC(6,4),
  include_depreciation_schedule BOOLEAN,
  loan_fees_pct               NUMERIC(6,4),
  legal_structuring_costs     NUMERIC(12,4),
  organization_costs          NUMERIC(12,4)
);

CREATE TABLE deal_fees (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  hdc_fee_rate                NUMERIC(6,4),
  hdc_deferred_interest_rate  NUMERIC(6,4),
  aum_fee_enabled             BOOLEAN,
  aum_fee_pct                 NUMERIC(6,4),
  aum_current_pay_enabled     BOOLEAN,
  aum_current_pay_pct         NUMERIC(6,4),
  hdc_platform_mode           VARCHAR(20)
);

CREATE TABLE deal_misc (
  deal_id                     UUID PRIMARY KEY REFERENCES deals(id),
  hdc_advance_financing       BOOLEAN,
  tax_advance_discount_rate   NUMERIC(6,4),
  advance_financing_rate      NUMERIC(6,4),
  tax_delivery_months         INTEGER,
  interest_reserve_enabled    BOOLEAN,
  interest_reserve_months     INTEGER,
  pref_equity_enabled         BOOLEAN,
  pref_equity_pct             NUMERIC(6,4),
  pref_equity_target_moic     NUMERIC(6,4),
  pref_equity_accrual_rate    NUMERIC(6,4),
  pref_equity_oz_eligible     BOOLEAN
);
```

### 8.1 Audit and Versioning Tables

```sql
-- Every field change on any deal table is recorded here
CREATE TABLE deal_change_log (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id                     UUID NOT NULL REFERENCES deals(id),
  table_name                  VARCHAR(100) NOT NULL,
  field_name                  VARCHAR(100) NOT NULL,
  old_value                   TEXT,
  new_value                   TEXT,
  changed_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by                  UUID NOT NULL REFERENCES users(id),
  change_source               VARCHAR(50) NOT NULL,
  -- 'cie_import' | 'analyst_entry' | 'geospatial_update' | 'engine_update' | 'manual_override'
  change_note                 TEXT
);

-- Immutable point-in-time snapshots — created automatically at every publish event
CREATE TABLE deal_snapshots (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id                     UUID NOT NULL REFERENCES deals(id),
  version_number              INTEGER NOT NULL,
  status                      VARCHAR(20) NOT NULL DEFAULT 'active',
  -- 'active' | 'superseded' | 'archived'
  -- Constraint: only one 'active' snapshot per deal at any time
  engine_version              VARCHAR(50) NOT NULL,
  schema_version              VARCHAR(50) NOT NULL,
  inputs_json                 JSONB NOT NULL,       -- complete frozen copy of all deal tables
  outputs_json                JSONB NOT NULL,       -- complete frozen calculation outputs
  input_hash                  CHAR(64) NOT NULL,    -- SHA-256 of inputs_json
  output_hash                 CHAR(64) NOT NULL,    -- SHA-256 of outputs_json
  change_summary              TEXT,                 -- human-readable description vs prior version
  locked_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_by                   UUID NOT NULL REFERENCES users(id),
  superseded_at               TIMESTAMPTZ,
  superseded_by               UUID REFERENCES deal_snapshots(id),
  UNIQUE (deal_id, version_number)
);

-- Engine version registry
CREATE TABLE engine_versions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version                     VARCHAR(50) NOT NULL UNIQUE,
  released_at                 TIMESTAMPTZ NOT NULL,
  release_notes               TEXT,
  is_current                  BOOLEAN NOT NULL DEFAULT false
);
```

### 8.2 Subscription and Investor Linkage Tables

```sql
-- Pre-legal soft interest — not linked to a snapshot
CREATE TABLE investor_commitments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id                 UUID NOT NULL REFERENCES investors(id),
  deal_id                     UUID NOT NULL REFERENCES deals(id),
  indicated_amount            NUMERIC(14,2),
  status                      VARCHAR(50) NOT NULL DEFAULT 'soft_circle',
  -- 'soft_circle' | 'hard_circle' | 'converted' | 'withdrawn'
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Legal record — created at subscription agreement execution
-- Immutable after creation except for status field
CREATE TABLE investor_deal_subscriptions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id                 UUID NOT NULL REFERENCES investors(id),
  deal_id                     UUID NOT NULL REFERENCES deals(id),
  snapshot_id                 UUID NOT NULL REFERENCES deal_snapshots(id),
  -- snapshot at time of signing — never changes
  subscription_agreement_id  UUID NOT NULL REFERENCES documents(id),
  accreditation_doc_id        UUID REFERENCES documents(id),
  signed_at                   TIMESTAMPTZ NOT NULL,
  signed_by                   UUID NOT NULL REFERENCES investors(id),
  amount                      NUMERIC(14,2) NOT NULL,
  status                      VARCHAR(50) NOT NULL DEFAULT 'active',
  -- 'active' | 'withdrawn' | 'transferred'
  capital_called              NUMERIC(14,2) NOT NULL DEFAULT 0,
  capital_funded              NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full version history per investor — additive, never overwritten
CREATE TABLE investor_snapshot_history (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id                 UUID NOT NULL REFERENCES investors(id),
  deal_id                     UUID NOT NULL REFERENCES deals(id),
  subscription_id             UUID NOT NULL REFERENCES investor_deal_subscriptions(id),
  snapshot_id                 UUID NOT NULL REFERENCES deal_snapshots(id),
  status                      VARCHAR(50) NOT NULL,
  -- 'original' | 'updated' | 'acknowledged' | 'pending_acknowledgment'
  linked_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  notification_sent_at        TIMESTAMPTZ,
  notification_method         VARCHAR(50),
  acknowledged_at             TIMESTAMPTZ,
  acknowledged_by             UUID REFERENCES users(id)
);

-- Document storage
CREATE TABLE documents (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id                     UUID REFERENCES deals(id),
  investor_id                 UUID REFERENCES investors(id),
  snapshot_id                 UUID REFERENCES deal_snapshots(id),
  document_type               VARCHAR(100) NOT NULL,
  -- 'subscription_agreement' | 'accreditation' | 'k1' | 'capital_call' |
  -- 'investor_notice' | 'side_letter' | 'amendment'
  storage_url                 TEXT NOT NULL,
  docusign_envelope_id        TEXT,
  executed_at                 TIMESTAMPTZ,
  uploaded_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by                 UUID NOT NULL REFERENCES users(id)
);

-- Investor communication log
CREATE TABLE investor_communications (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id                 UUID NOT NULL REFERENCES investors(id),
  deal_id                     UUID REFERENCES deals(id),
  snapshot_id                 UUID REFERENCES deal_snapshots(id),
  communication_type          VARCHAR(100) NOT NULL,
  -- 'snapshot_update' | 'capital_call' | 'distribution' | 'quarterly_update' | 'ad_hoc'
  subject                     TEXT,
  sent_at                     TIMESTAMPTZ,
  sent_by                     UUID REFERENCES users(id),
  method                      VARCHAR(50),
  acknowledged_at             TIMESTAMPTZ
);
```

---

## 9. TypeScript Interface (CalculationParams mapping)

The canonical schema maps to the existing `CalculationParams` interface in the Tax Benefits Platform. The publication interface (Integration Spec v0.1) is a pure mapping function from deal tables to this interface.

```typescript
// Deal-level fields (Categories A + B + C + E)
// Assembled from all deal_* tables via JOIN on deal_id
interface DealCanonicalSchema {
  // Project fundamentals
  projectCost: number;
  landValue: number;
  predevelopmentCosts: number;
  projectLocation: string;
  units: number;
  propertyState: string;
  holdPeriod: number;

  // Operating assumptions
  yearOneNOI: number;
  noiGrowthRate: number;
  exitCapRate: number;
  stabilizedOccupancy: number;
  leaseUpMonths: number;
  constructionDelayMonths: number;

  // Senior debt
  seniorDebtPct: number;
  seniorDebtRate: number;
  seniorDebtTerm: number;
  seniorDebtAmort: number;
  seniorDebtIOYears: number;

  // Phil debt
  philDebtPct: number;
  philDebtRate: number;
  philDebtAmort: number;
  philCurrentPayEnabled: boolean;
  philCurrentPayPct: number;

  // Equity
  investorEquityPct: number;
  philEquityPct: number;
  investorEquityRatio: number;
  autoBalanceCapital: boolean;
  investorPromoteShare: number;
  promoteHurdleRate: number;

  // [remaining fields follow same pattern]
  // Full interface mirrors the named ranges in Section 3 exactly
}

// Investor-level fields (Category D) — merged at calculation time, not stored on deal
interface InvestorTaxProfile {
  federalTaxRate: number;
  niitRate: number;
  stateTaxRate: number;
  ltCapitalGainsRate: number;
  stateCapitalGainsRate: number;
  investorState: string;
  stateConforms: boolean;
  investorTrack: 'rep' | 'non-rep';
  isREP: boolean;
  groupingElection: boolean;
  passiveGainType: 'short-term' | 'long-term';
  investorType: string;
  w2Income: number;
  businessIncome: number;
  iraBalance: number;
  passiveIncome: number;
  assetSaleGain: number;
  annualIncome: number;
  filingStatus: 'single' | 'married-filing-jointly';
  deferredGain: number;
  capitalGainsTaxRate: number;
  ozCapitalGainsTaxRate: number;
}

// Combined at calculation time
type CalculationParams = DealCanonicalSchema & InvestorTaxProfile;
```

---

## 10. CIE Workflow

*CIE capability assumptions in this section are based on CIE Capability Audit Entry 1.0, April 11, 2026. Re-audit before implementing. See CIE_Capability_Audit_Log.md.*

### §10.1 Architecture

CIE operates on a multi-agent architecture — one agent instance per open Excel file. Cross-file data access happens via agent-to-agent messaging with 5-15 second round-trip latency per request. CIE is prompt-driven, not event-driven. It has no background monitoring capability and cannot detect file changes autonomously.

The HDC canonical Excel template is the coordinator file. Its CIE agent receives the standard ingestion prompt and sends read requests to the agents running in each developer file. HDC reference tables (state conformity, OZ tracts, LIHTC programs) are uploaded to the CIE Python sandbox and are reusable across prompts within the session without re-uploading.

### §10.2 Pre-Conditions

Before running the ingestion prompt, all of the following must be true:

1. All developer files are open in Excel with the CIE add-in active
2. HDC canonical Excel template is open in Excel
3. HDC reference tables have been uploaded to the CIE Python sandbox
4. Analyst has confirmed which files are developer-submitted and which are HDC reference materials

Files not currently open in Excel cannot be accessed by CIE.

### §10.3 What CIE Does From a Single Prompt

Given the standard ingestion prompt (defined in Deal Ingestion Engine Spec v1.0 §5), CIE:

1. Identifies all open developer files via agent discovery
2. Scans each file's sheet structure and headers to locate key data
3. Extracts all 27 Category A fields using label variant matching per §5 of this spec
4. Cross-validates related values between files (NOI vs. rent roll, project cost vs. construction budget)
5. Looks up Category C fields in Python sandbox reference tables using PropertyState as key
6. Populates canonical template named ranges with extracted values
7. Records provenance for every field (source file, sheet, cell, label found)
8. Flags inconsistencies, ambiguities, and unfound fields
9. Writes extraction summary to summary tab

This happens from one prompt. The analyst does not direct each step.

### §10.4 What CIE Cannot Do

- Access files not open in Excel
- Detect file changes or update template automatically when source files change
- Save or export files
- Run VBA macros or Power Query
- Operate as a background or scheduled process
- Trigger the app publish step (analyst-initiated from app)

### §10.5 Analyst Actions After CIE Extraction

1. Review extraction summary tab — typically 3-5 fields flagged
2. Resolve flagged fields — provide clarification or confirm CIE's interpretation
3. Resolve any cross-file inconsistencies — update source or override with note
4. Complete Category B fields in app (48 HDC structuring decisions)
5. Verify Category C auto-populated fields
6. Trigger publish from app

Estimated analyst time: 15-30 minutes from files open to profile published.

### §10.6 Re-Ingestion on Model Update

When a developer updates their model, the analyst:
1. Opens updated files in Excel
2. Runs standard ingestion prompt again against existing canonical template
3. CIE overwrites prior values, records new provenance
4. Analyst reviews delta in extraction summary
5. If deal already published, reviews delta before deciding to republish
6. Republish triggers new snapshot and investor notification workflow

The platform does not automatically detect or trigger re-ingestion.

---

## 11. Publish Event Trigger

Every publish event executes the following atomically:

```
1. Validate all required fields are populated
2. Run calculation engine — confirm successful output
3. Write deal_snapshots row:
     version_number = MAX(version_number) + 1 for this deal
     status = 'active'
     engine_version = current engine_versions.version
     schema_version = this spec version (1.0)
     inputs_json = complete snapshot of all deal_* tables
     outputs_json = complete calculation output
     input_hash = SHA-256(inputs_json)
     output_hash = SHA-256(outputs_json)
     locked_at = now()
     locked_by = current user
4. If prior active snapshot exists:
     UPDATE deal_snapshots SET
       status = 'superseded',
       superseded_at = now(),
       superseded_by = new snapshot id
     WHERE deal_id = this deal AND status = 'active'
5. UPDATE deals SET active_snapshot_id = new snapshot id
6. If prior snapshot had investor subscriptions:
     INSERT investor_snapshot_history rows for all affected investors
     status = 'pending_acknowledgment'
     notification_sent_at = now()
     Enqueue investor notification emails
7. Platform deal listing updated to new snapshot
```

If any step fails: full rollback. Platform never shows a partially published deal.

---

## 12. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | April 2026 | Initial specification. 112 fields across 5 categories. Four-flow convergence model. Full PostgreSQL schema. Publish event trigger. |
| 1.0 (§10 update) | April 12, 2026 | §10 CIE Workflow replaced per Spec Patch CIE Audit Update v1.0. Basis: CIE Capability Audit Entry 1.0, April 11, 2026. Multi-agent architecture, pre-conditions, what CIE does and cannot do, analyst actions, re-ingestion workflow. Live mirror concept removed — not achievable. |

---

## 13. Open Items

| Item | Owner | Priority |
|---|---|---|
| Confirm HDC Fee Rate elimination (Section 3.11 — under review) | Brad | High |
| Angel to review PostgreSQL schema for conformance with existing table conventions | Angel | High |
| CIE confidence thresholds to be validated against 4448_Cali_v64.xlsx as primary test case | CC | High |
| Accreditation verification expiration tracking (90-day window) to be added to investor tables | Angel | Medium |
| KYC/AML beneficial ownership table structure | Brad / Sidley | Medium |
| K-1 linkage to investor_snapshot_history | Angel | Low |
