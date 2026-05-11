# HDC Canonical Deal Schema Specification
## v1.2 — May 2026

**Status:** Draft — Supersedes v1.1 in sections noted below
**Author:** Brad Padden / Claude Chat
**Driver:** Queenswood Phase II CIE Capital Stack Audit (CIE Discovery Report v1.0, May 2026)
**Prior version:** HDC_Canonical_Deal_Schema_Spec_v1_0.md

---

## What Changed From v1.0

v1.0 modeled debt as a single senior debt entry plus one philanthropic
debt field. Queenswood Phase II revealed this cannot represent real
LIHTC capital stacks. The CIE audit found 30 schema gaps — 22 universal.

This revision adds four new tables and a new tax events model. It does
not change the existing 13-table structure from v1.0. It extends it.

**Net additions:**
- `deal_debt_tranches` — replaces deal_senior_debt and deal_phil_debt
- `deal_grants` — new Category F for philanthropic and government grants
- `deal_equity_installments` — replaces single equity % field
- `deal_uses_breakdown` — extends TDC with line-by-line hard/soft detail
- `deal_tax_events` — new table for forgiveness and inclusion event modeling
- Forgiveness fields added to debt tranches
- calculations.ts exit model must be updated for forgiveness toggle

**Tables deprecated (data migrated to deal_debt_tranches):**
- `deal_senior_debt` — deprecated, replaced by tranche type = senior
- `deal_phil_debt` — deprecated, replaced by tranche type = philanthropic_sub

---

## 1. The Queenswood Finding in Plain Terms

Queenswood Phase II has three debt tranches where v1.0 expected one:

| Tranche | Amount | Note Rate | Pay Rate | Yr35 Balance | Forgiveness |
|---|---|---|---|---|---|
| HDC 1st Mortgage (perm) | $41.2M | 6.40% | 6.40% | $41.2M | No |
| HDC 2nd Mortgage (city) | $20.0M | 4.72% | 1.25% PIK | ~$86.2M | Silent (expected) |
| HPD 3rd Mortgage (city) | $91.6M | 4.72% | 0.25% PIK | ~$476.3M | Silent (expected) |

Combined soft debt accrues from $111.6M to ~$562M at maturity.
The v1.0 schema blends these into one field. The v1.0 exit model
applies Math.max(0) to net exit proceeds, producing $0 for this
deal regardless of actual forgiveness expectations.

The fix is not complex. A `deal_debt_tranches` table with per-tranche
forgiveness fields, combined with a forgiveness toggle in the exit
model, resolves this correctly.

The Mets $5M contribution is a philanthropic grant — not debt, not
equity, not DDF. ~30% of LIHTC deals have this structure.
`deal_grants` is the new home for it.

---

## 2. Source Category Update

v1.0 defined five source categories (A–E). This revision adds Category F.

| Category | Label | Source | Who Populates |
|---|---|---|---|
| A | Developer model | Developer Excel | CIE extracts |
| B | HDC structuring | HDC deal decisions | Analyst enters in app |
| C | Platform intelligence | Geospatial + state tables | Platform auto-populates |
| D | Investor profile | Per-investor tax profile | Merged at calculation time |
| E | Derived / default | Calculated from other fields | Engine computes |
| **F** | **Grants / subsidies** | **Philanthropic or gov grant** | **CIE extracts or analyst enters** |

Category F fields never enter the waterfall as debt or equity. They
are sources only. Their basis treatment (included / excluded from
eligible basis) must be flagged per grant and confirmed with counsel
when the grantor is a tax-exempt entity.

---

## 3. New Table: deal_debt_tranches

Replaces deal_senior_debt and deal_phil_debt. One row per debt tranche.
A deal can have an arbitrary number of tranches.

```sql
CREATE TABLE deal_debt_tranches (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id                     UUID NOT NULL REFERENCES deals(id)
                                    ON DELETE CASCADE,
    tranche_number              INTEGER NOT NULL,
    -- Waterfall priority and sort order (1 = most senior)

    label                       TEXT NOT NULL,
    -- Label as it appears in the proforma

    tranche_type                TEXT NOT NULL,
    -- Enum: senior_construction | senior_permanent | home_soft |
    --       htf_soft | cdfi_mezz | city_soft | state_soft |
    --       ddf_note | seller_carryback | philanthropic_sub | other

    construction_amount         NUMERIC(14,4),
    permanent_amount            NUMERIC(14,4),
    -- Both needed: senior debt converts from $130.6M const to $41.2M perm

    note_rate                   NUMERIC(8,6),
    -- Contractual accrual rate (what the loan actually charges)

    pay_rate                    NUMERIC(8,6),
    -- Actual cash pay rate (may be 0 for full PIK, fractional for partial)

    rate_type                   TEXT NOT NULL,
    -- Enum: fixed | floating | zero | pik_full | pik_partial

    rate_components             JSONB,
    -- For component rates: {"base_rate": 0.0565, "service_fee": 0.0025,
    --   "mip": 0.0050} — NYC bond deals always have 3 components

    amortization_years          INTEGER,
    term_years                  INTEGER,
    io_years                    INTEGER,

    waterfall_priority          INTEGER NOT NULL,
    recourse_type               TEXT,
    -- Enum: full | non_recourse | limited

    lender_name                 TEXT,
    sizing_method               TEXT,
    -- Enum: fixed_amount | per_unit | pct_of_tdc

    is_bond_financed            BOOLEAN NOT NULL DEFAULT false,
    bond_type                   TEXT,
    -- Enum: te_bonds | taxable_bonds | recycled_bonds

    federal_funding_source      TEXT,
    -- Enum: home | htf | cdbg | city_only | state_only | none
    -- Affects §42(d)(5)(A) below-market loan basis rules.
    -- HPD funding source unknown for Queenswood — flag for determination.

    -- FORGIVENESS FIELDS

    forgiveness_enabled         BOOLEAN NOT NULL DEFAULT false,
    -- Toggle consumed by exit model in calculations.ts.
    -- When true, tranche is excluded from outstanding debt at exit.

    forgiveness_type            TEXT,
    -- Enum: full | partial

    forgiveness_pct             NUMERIC(6,4),
    -- 1.0 for full forgiveness. Partial pct if applicable.

    forgiveness_trigger_type    TEXT,
    -- Enum: date_based | compliance_period | performance |
    --       regulatory_agreement | silent_expected | not_applicable
    -- silent_expected = market expectation but no legal mechanism
    -- (Queenswood tranches 2 and 3 are both silent_expected)

    forgiveness_trigger_date    DATE,
    forgiveness_trigger_description TEXT,
    -- Plain English description of trigger conditions

    forgiveness_schedule        JSONB,
    -- For phased forgiveness: [{"year": 20, "pct": 0.50},
    --   {"year": 35, "pct": 0.50}]

    -- COD / TAX FLAGS (populated by analyst or counsel; not CIE)

    cod_income_treatment        TEXT,
    -- Enum: taxable | sec108_exclusion | not_modeled | counsel_required
    -- Queenswood: §108 insolvency exclusion applies (liabilities >> FMV)
    -- but proforma is silent — cod_income_treatment = 'not_modeled'

    sec108_exclusion_basis      TEXT,
    -- Enum: insolvency | bankruptcy | qualified_farm |
    --       qualified_real_property | not_applicable

    basis_adjustment_at_forgiveness TEXT,
    -- Notes on basis adjustment if forgiveness reduces basis
    -- under §1017

    -- EXTENDED USE / REGULATORY

    extended_use_agreement_years INTEGER,
    -- Years of regulatory agreement attached to this tranche
    -- Often the binding constraint on forgiveness timing

    intercreditor_notes         TEXT,
    notes                       TEXT,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (deal_id, tranche_number)
);

CREATE INDEX idx_debt_tranches_deal
    ON deal_debt_tranches(deal_id);
CREATE INDEX idx_debt_tranches_type
    ON deal_debt_tranches(tranche_type);
```

**Queenswood seed rows (for reference):**

| tranche_number | label | type | perm_amount | note_rate | pay_rate | rate_type | forgiveness_enabled | forgiveness_trigger_type |
|---|---|---|---|---|---|---|---|---|
| 1 | HDC 1st Mortgage Perm | senior_permanent | $41,235,000 | 6.40% | 6.40% | fixed | false | not_applicable |
| 2 | HDC 2nd Mortgage | city_soft | $20,000,000 | 4.72% | 1.25% | pik_partial | true | silent_expected |
| 3 | HPD 3rd Mortgage | city_soft | $91,586,775 | 4.72% | 0.25% | pik_partial | true | silent_expected |
| 4 | Deferred Dev Fee | ddf_note | $10,362,290 | 0% | 0% | zero | false | not_applicable |

---

## 4. New Table: deal_grants

New Category F. One row per grant or subsidy source.

```sql
CREATE TABLE deal_grants (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id                     UUID NOT NULL REFERENCES deals(id)
                                    ON DELETE CASCADE,
    grant_label                 TEXT NOT NULL,
    -- Label as it appears in the proforma

    grant_source_type           TEXT NOT NULL,
    -- Enum: philanthropic | city | state | federal_cdbg | federal_home |
    --       federal_htf | cdfi | developer_contribution | other

    grantor_name                TEXT,
    amount                      NUMERIC(14,4) NOT NULL,

    included_in_eligible_basis  BOOLEAN,
    -- NULL = unknown / counsel required
    -- Queenswood Mets $5M: included per TC tab — may be error
    -- if Mets entity is tax-exempt under §42(d)(5) donor rules

    basis_inclusion_rationale   TEXT,
    -- Required if included_in_eligible_basis = true
    -- Must address whether grantor is tax-exempt entity

    repayment_required          BOOLEAN NOT NULL DEFAULT false,
    -- False for true grants. True for forgivable loans
    -- (those belong in deal_debt_tranches, not here)

    grant_conditions            TEXT,
    -- Any compliance conditions attached to the grant

    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5. New Table: deal_equity_installments

Replaces the single investor_equity_pct field for deals with
phased equity pay-in schedules.

```sql
CREATE TABLE deal_equity_installments (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id                     UUID NOT NULL REFERENCES deals(id)
                                    ON DELETE CASCADE,
    installment_number          INTEGER NOT NULL,
    amount                      NUMERIC(14,4) NOT NULL,
    pct_of_total                NUMERIC(6,4),
    -- Decimal: 0.15 for 15%

    trigger_type                TEXT NOT NULL,
    -- Enum: construction_start | construction_completion |
    --       certificate_of_occupancy | stabilization |
    --       credit_delivery_8609 | breakeven | date_based | other

    trigger_date                DATE,
    trigger_description         TEXT,
    notes                       TEXT,

    UNIQUE (deal_id, installment_number)
);
```

**Queenswood seed rows:**

| installment_number | amount | pct_of_total | trigger_type |
|---|---|---|---|
| 1 | $17,761,428 | 15% | construction_start |
| 2 | $100,648,095 | 85% | stabilization |

---

## 6. New Table: deal_uses_breakdown

Extends TDC with line-by-line hard cost, soft cost, and fee detail.
Enables eligible basis calculation at the line-item level.

```sql
CREATE TABLE deal_uses_breakdown (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id                     UUID NOT NULL REFERENCES deals(id)
                                    ON DELETE CASCADE,
    line_number                 INTEGER NOT NULL,
    label                       TEXT NOT NULL,
    -- Label as it appears in the proforma

    category                    TEXT NOT NULL,
    -- Enum: hard_cost | soft_cost | developer_fee |
    --       financing_cost | reserves | accrued_interest | other

    amount                      NUMERIC(14,4) NOT NULL,

    eligible_basis_included     BOOLEAN,
    -- NULL = unknown, true = in eligible basis, false = excluded

    eligible_basis_rationale    TEXT,
    -- Required when included = false to document exclusion reason

    notes                       TEXT,

    UNIQUE (deal_id, line_number)
);
```

**Key Queenswood items that drove this table:**

| label | category | amount | eligible_basis_included |
|---|---|---|---|
| Accrued interest (construction PIK) | accrued_interest | $20,267,584 | NULL — counsel required |
| Deferred reserves | reserves | $3,700,000 | false |
| Mets contribution (as use) | financing_cost | $5,000,000 | NULL — same as grant |

---

## 7. New Table: deal_tax_events

Models tax events generated by forgiveness, OZ inclusion, and
basis adjustments. Populated by analyst or counsel — not CIE.
Consumed by calculations.ts exit model.

```sql
CREATE TABLE deal_tax_events (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id                     UUID NOT NULL REFERENCES deals(id)
                                    ON DELETE CASCADE,
    event_type                  TEXT NOT NULL,
    -- Enum: forgiveness_cod | oz_inclusion_event | basis_adjustment |
    --       recapture_event | other

    source_tranche_id           UUID REFERENCES deal_debt_tranches(id),
    -- Link to the debt tranche that triggers this event (if applicable)

    projected_year              INTEGER,
    -- Hold period year (1-indexed) in which event is projected

    gross_amount                NUMERIC(14,4),
    -- Pre-exclusion amount (e.g. full COD income before §108)

    excluded_amount             NUMERIC(14,4),
    -- §108 exclusion amount, if applicable

    net_taxable_amount          NUMERIC(14,4),
    -- gross_amount - excluded_amount

    sec108_applicable           BOOLEAN NOT NULL DEFAULT false,
    sec108_exclusion_type       TEXT,

    modeling_status             TEXT NOT NULL DEFAULT 'not_modeled',
    -- Enum: modeled | not_modeled | counsel_required | not_applicable

    tax_treatment_notes         TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Queenswood forgiveness events (currently not modeled):**

| event_type | source | gross_amount | sec108_applicable | modeling_status |
|---|---|---|---|---|
| forgiveness_cod | HDC 2nd Mortgage | ~$86.2M at Yr35 | true (insolvency) | not_modeled |
| forgiveness_cod | HPD 3rd Mortgage | ~$476.3M at Yr35 | true (insolvency) | not_modeled |

---

## 8. calculations.ts Exit Model Changes Required

**This is a required change, not optional.** The current exit model
produces $0 net exit proceeds for Queenswood because outstanding
debt (~$562M at maturity) exceeds gross exit value.

### Current behavior (incorrect for forgivable debt deals):

```typescript
// Existing exit model — simplified
const grossExitValue = noi / exitCapRate;
const outstandingDebt = seniorDebt + philDebt; // all debt, no forgiveness
const netExitProceeds = Math.max(0, grossExitValue - outstandingDebt);
// Result: $0 for Queenswood — $562M debt >> exit value
```

### Required behavior:

```typescript
// Updated exit model — forgivable tranches excluded from outstanding debt
const grossExitValue = noi / exitCapRate;

const nonForgivableDebt = debtTranches
    .filter(t => !t.forgiveness_enabled)
    .reduce((sum, t) => sum + outstandingBalanceAtExit(t), 0);

const forgivableDebt = debtTranches
    .filter(t => t.forgiveness_enabled)
    .reduce((sum, t) => sum + outstandingBalanceAtExit(t), 0);

const netExitProceeds = Math.max(0,
    grossExitValue - nonForgivableDebt);
// forgivableDebt is excluded — it does not reduce exit proceeds
// when forgiveness_enabled = true

// Tax event: forgiveness of soft debt at exit
// COD income modeled per deal_tax_events table
// §108 exclusion applied per modeling_status
```

**This change should be a dedicated IMPL.** It is a material
change to the exit model affecting every deal that has forgivable
soft debt. It requires its own tests with Queenswood scenarios.

**Suggested IMPL assignment:** IMPL-185 (next after RBAC sequence).
Owner: CC.
Dependencies: deal_debt_tranches table deployed (Brad).

---

## 9. Accrued Interest as Derived Field

Queenswood PIK accrued interest ($20,267,584 over 48 months
construction) appears as both a source and a cost in the
proforma. This should be computed by the engine, not entered.

**Derivation formula per tranche:**

```
accrued_pik_interest = permanent_amount
    × (note_rate - pay_rate)
    × construction_months / 12
```

For Queenswood Tranche 3 (HPD):
$91,586,775 × (4.72% - 0.25%) × 48/12 ≈ $16.4M
(Remainder from Tranche 2 and timing rounding)

This field is Category E (derived). It does not need a schema
column on deal_debt_tranches — the engine computes it from
note_rate, pay_rate, and construction_months.

---

## 10. HPD Funding Source — Open Item

The federal vs. city-only nature of HPD's funding affects
eligible basis treatment under §42(d)(5)(A):

- Federal below-market loan (HOME, HTF, CDBG): eligible basis
  reduction required
- City-only loan (no federal source): §42(d)(5)(A) does not apply,
  no basis reduction required

Queenswood proforma does not identify HPD's federal funding source.
This must be confirmed before eligible basis is finalized.

**Action required:** Brad or Megan Riess to confirm HPD funding
source for this deal. Update `federal_funding_source` field on
Tranche 3 row before publishing.

---

## 11. Mets Grant Basis Treatment — Open Item

The Mets $5M contribution is included in eligible basis on the
Tax Credit tab of the Queenswood proforma. This may be incorrect
if the Mets entity is a tax-exempt organization.

Under §42(d)(5), grants from tax-exempt entities may reduce
eligible basis. If the Mets entity is a 501(c)(3) or similar,
the $5M should be excluded from eligible basis, reducing the
LIHTC annual credit.

**Action required:** Confirm Mets entity tax status with counsel
before eligible basis is finalized. Update
`included_in_eligible_basis` and `basis_inclusion_rationale`
on the deal_grants row accordingly.

---

## 12. Field Count Update

| Category | v1.0 Count | v1.1 Addition | v1.1 Total |
|---|---|---|---|
| A — Developer model | 27 | +8 (debt tranche fields CIE can extract) | 35 |
| B — HDC structuring | 48 | +12 (forgiveness decisions, basis flags) | 60 |
| C — Platform intelligence | 8 | 0 | 8 |
| D — Investor profile | 22 | 0 | 22 |
| E — Derived / default | 7 | +1 (accrued PIK interest) | 8 |
| F — Grants / subsidies | 0 | +8 (new category) | 8 |
| **Total** | **112** | **+29** | **141** |

---

## 13. Table Count Update

| Table | v1.0 | v1.1 Status |
|---|---|---|
| deals | ✅ | Unchanged |
| deal_project | ✅ | Unchanged |
| deal_operating | ✅ | Unchanged |
| deal_senior_debt | ✅ | **Deprecated** → deal_debt_tranches |
| deal_phil_debt | ✅ | **Deprecated** → deal_debt_tranches |
| deal_lihtc | ✅ | Minor: add 50% bond test field |
| deal_oz | ✅ | Unchanged |
| deal_waterfall | ✅ | Unchanged |
| deal_snapshots | ✅ | Unchanged |
| deal_change_log | ✅ | Unchanged |
| **deal_debt_tranches** | — | **NEW** |
| **deal_grants** | — | **NEW** |
| **deal_equity_installments** | — | **NEW** |
| **deal_uses_breakdown** | — | **NEW** |
| **deal_tax_events** | — | **NEW** |

**New total: 15 active tables** (13 from v1.0 minus 2 deprecated
plus 5 new).

---

## 14. IMPL Additions Driven By This Revision

| IMPL | Owner | Description | Dependency |
|---|---|---|---|
| IMPL-185 | CC | Exit model forgiveness toggle. Filter forgivable tranches from outstanding debt at exit. Add forgiveness_enabled flag to calculation inputs. Tests: Queenswood scenario ($0 without toggle, correct proceeds with toggle). | deal_debt_tranches table deployed |
| IMPL-186 | Brad | Deploy 5 new tables: deal_debt_tranches, deal_grants, deal_equity_installments, deal_uses_breakdown, deal_tax_events. Deprecate deal_senior_debt and deal_phil_debt. Seed Queenswood rows as first real deal. | Canonical schema v1.1 sign-off |
| IMPL-187 | CC | CIE ingestion prompt update: extract per-tranche fields from developer proforma into deal_debt_tranches. Update standard ingestion prompt per Deal Ingestion Engine Spec. | IMPL-186 |
| IMPL-188 | CC | deal_grants UI panel: Category F input in app. Basis inclusion flag + rationale field. Counsel-required warning when grantor is potentially tax-exempt. | IMPL-186 |
| IMPL-189 | CC | deal_equity_installments UI: Replace single equity % with multi-installment table. Trigger type selector per installment. | IMPL-186 |

---

## 15. Remaining Gaps (5 of 30 Not Yet Resolved)

Five gaps from the CIE audit are deferred:

| # | Gap | Reason Deferred |
|---|---|---|
| 12 | Bond recycling mechanics | NYC-specific. Low priority. Future IMPL when next NYC deal arrives. |
| 16 | SONYMA MIP as separate field | rate_components JSONB on deal_debt_tranches handles this without a dedicated column. |
| 20 | Intercreditor provisions | Text field in deal_debt_tranches captures notes. Structured modeling deferred. |
| 27-28 | Solar TC / Developer reserves | Zero in Queenswood. deal_grants handles Solar TC when encountered. Reserves in deal_uses_breakdown. |

---

## 16. Open Items Before Brad Builds Tables

| Item | Owner | Blocks |
|---|---|---|
| HDC fee rate decision (§3.11) | ~~Brad~~ **RESOLVED** | ~~Schema finalization~~ **IMPL-190 resolves this. devFeePct (1–20% of TDC minus land) replaces the AUM fee rate as HDC's developer fee mechanism in Scenario A (HDC as developer). AUM fee preserved dormant for Scenario B (HDC as asset manager, IMPL-192). Schema field: devFeePct on the deal record.** |
| HPD federal funding source confirmation | Brad / Megan Riess | Eligible basis accuracy |
| Mets entity tax status confirmation | Brad / Counsel | Eligible basis accuracy |
| COD income modeling approach for silent forgiveness tranches | Brad / Daniel Altman | deal_tax_events population |
| forgiveness_trigger_type = silent_expected — confirm this is acceptable to Novogradac | Brad / Tom Fantin | Audit defensibility |

---

## 17. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | April 2026 | Initial specification. 112 fields, 13 tables, Categories A-E. |
| 1.1 | May 2026 | Driven by Queenswood Phase II CIE audit. Added deal_debt_tranches (replaces single debt fields), deal_grants (Category F), deal_equity_installments, deal_uses_breakdown, deal_tax_events. Exit model forgiveness toggle required in calculations.ts (IMPL-185). 141 fields, 15 active tables. 25 of 30 CIE-identified gaps resolved. |
| 1.2 | May 2026 | §3.11 HDC fee rate decision resolved: IMPL-190 replaces AUM fee rate with devFeePct (1–20% of TDC minus land) as developer fee mechanism. AUM fee preserved dormant for Scenario B (IMPL-192). HFA Knowledge Base IMPL numbers updated to IMPL-193 (Brad backend) and IMPL-194 (CC frontend). |

---

## 18. HFA Knowledge Layer (Added v1.1)

The composable deal schema has a third layer above the deal-type extensions:
the HFA Knowledge Layer. Composable standards at the deal-type level must
be further adjusted by HFA — housing finance agency mechanics vary materially
by state and by agency and cannot be captured in universal defaults.

**The three-layer architecture:**

```
Layer 1 — Canonical Core (universal)
Layer 2 — Deal-Type Extensions (activated by deal structure)
Layer 3 — HFA Knowledge Layer (activated by HFA identity)
```

When a deal is created, the platform looks up the relevant HFA record and
pre-populates deal defaults — exit horizon, forgiveness expectation, refinancing
restrictions, resyndication program availability, distribution restrictions —
based on validated institutional learnings from prior transactions with that agency.

**Reference:** HDC_HFA_Knowledge_Base_Spec_v1_0.md

**Current HFA records:** NYC HPD, NYC HDC (Queenswood Phase II, May 2026)

**Key learning — NY HPD:** Exit horizon default is Year 15 (institutional),
not Year 11. HPD operates a formal Year 15 Preservation Program. Early LP exit
requires explicit HPD cooperation. Cash-out refinancing requires payoff of
outstanding subsidy balance. Composable defaults for NY HPD deals should be
adjusted accordingly.

**IMPLs required:** Two new IMPLs from IMPL-193 onward.
- Brad: hfa_knowledge table + hfa_deviations on deals table → **IMPL-193**
- CC: HFA lookup and pre-population in deal creation flow → **IMPL-194**

*Note: IMPL-190 is assigned to the two-scenario fee architecture (Scenario A — HDC as developer). IMPL-191 is the §465 at-risk basis check candidate. IMPL-192 is the two-scenario fee architecture (Scenario B — HDC as asset manager). HFA Knowledge Base IMPLs begin at IMPL-193.*
