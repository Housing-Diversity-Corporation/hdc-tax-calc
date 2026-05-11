# HDC Housing Finance Agency Knowledge Base
## Specification v1.1 — May 2026
**Classification: PROPRIETARY — TRADE SECRET**
**Author:** Brad Padden / Claude Chat
**Status:** Active — first entry NY HPD documented below

---

## 1. Purpose and Strategic Rationale

Every LIHTC deal is shaped by the specific policies, programs, institutional
expectations, and loan mechanics of the Housing Finance Agency or city agency
that provides soft debt, tax credits, or regulatory oversight. These vary
materially by state and by agency. A developer who has done one NY HPD deal
knows things that no amount of upfront research can fully substitute for.

The HDC HFA Knowledge Base codifies those learnings. Every deal HDC closes
contributes to the HFA record for that agency. The next deal with the same
HFA is pre-populated with those learnings. The platform gets demonstrably
smarter with every transaction — not through generic machine learning, but
through structured, auditable, deal-validated institutional knowledge.

This is a compounding competitive advantage. A new entrant to a market cannot
replicate it without doing the deals. HDC's accumulated HFA knowledge becomes
a proprietary asset that grows with deal volume and cannot be purchased.

**This specification and all HFA knowledge records are proprietary trade
secrets of Housing Diversity Corporation. They are not to be disclosed to
any third party without explicit written authorization from the CEO.**

---

## 2. Architecture — Where HFA Knowledge Lives

The HFA Knowledge Base is the third layer of the composable deal schema:

```
Layer 1 — Canonical Core
  Universal fields shared by all deals regardless of geography or deal type.
  LIHTC basis, applicable fraction, credit stream, waterfall, exit cap rate.

Layer 2 — Deal-Type Extensions
  Activated by deal structure. deal_debt_tranches, deal_grants,
  deal_equity_installments, deal_uses_breakdown, deal_tax_events.

Layer 3 — HFA Knowledge Layer  ← THIS SPEC
  Activated by HFA identity. Pre-populates deal defaults based on
  accumulated institutional learnings for that specific agency.
  Overridable by analyst on a per-deal basis.
```

When a new deal is created, the platform looks up the HFA record and
pre-populates:
- Default exit horizon
- Soft debt rate structure defaults
- Forgiveness expectation and trigger type
- Cash-out refinancing restrictions
- Resyndication program availability and timing
- Regulatory agreement standard provisions
- Transfer and subordination approval requirements
- Distribution restriction baseline
- State LIHTC availability and match mechanics
- Any other agency-specific mechanics documented in prior deals

The analyst reviews and confirms each pre-populated value. If a deal reveals
a deviation from the HFA default, that deviation is documented and may trigger
an update to the HFA record after deal close.

---

## 3. HFA Record Schema

Each HFA has one record. Fields are populated progressively as deals are done.
Empty fields are explicitly flagged as UNKNOWN — requiring deal-specific research.

```sql
CREATE TABLE hfa_knowledge (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hfa_name                    TEXT NOT NULL UNIQUE,
    -- Full name: "NYC Department of Housing Preservation and Development"
    hfa_abbreviation            TEXT NOT NULL,
    -- "HPD"
    state                       TEXT NOT NULL,
    city                        TEXT,
    hfa_type                    TEXT NOT NULL,
    -- Enum: city | state | county | federal | cdfi | other

    -- EXIT HORIZON
    exit_horizon_default        TEXT,
    -- 'year_15_institutional' | 'year_10_plus_negotiated' | 'deal_specific'
    exit_horizon_notes          TEXT,
    -- Plain English explanation of the institutional expectation
    exit_program_name           TEXT,
    -- Named program if one exists (e.g. "HPD Year 15 Preservation Program")
    exit_program_url            TEXT,

    -- SOFT DEBT MECHANICS
    typical_rate_type           TEXT,
    -- 'pik_full' | 'pik_partial' | 'fixed' | 'zero' | 'aff_rate'
    typical_note_rate           NUMERIC(8,6),
    typical_pay_rate            NUMERIC(8,6),
    typical_term_years          INTEGER,
    forgiveness_expectation     TEXT,
    -- 'expected_at_maturity' | 'expected_at_resyndication' |
    -- 'regulatory_period_end' | 'not_expected' | 'unknown'
    forgiveness_trigger_type    TEXT,
    -- Per deal_debt_tranches taxonomy
    forgiveness_notes           TEXT,

    -- REFINANCING RESTRICTIONS
    cash_out_refi_permitted     TEXT,
    -- 'permitted' | 'restricted' | 'requires_payoff' | 'unknown'
    cash_out_refi_notes         TEXT,
    rate_term_refi_permitted    TEXT,
    -- 'permitted_with_subordination' | 'restricted' | 'unknown'
    subordination_process       TEXT,
    -- Description of subordination request process and timeline
    subordination_url           TEXT,

    -- DISTRIBUTION RESTRICTIONS
    distribution_restrictions   TEXT,
    -- 'refi_proceeds_restricted' | 'operating_distributions_permitted' |
    -- 'waterfall_governed' | 'unknown'
    distribution_notes          TEXT,

    -- TRANSFER AND TRANSFER APPROVAL
    transfer_approval_required  BOOLEAN,
    transfer_approval_process   TEXT,
    lp_exit_pre_year15_permitted BOOLEAN,
    lp_exit_pre_year15_notes    TEXT,

    -- RESYNDICATION
    resyndication_program       TEXT,
    -- Name of resyndication program if one exists
    resyndication_eligibility   TEXT,
    -- Key eligibility requirements for resyndication
    resyndication_notes         TEXT,

    -- STATE/LOCAL LIHTC
    state_lihtc_available       BOOLEAN,
    state_lihtc_program_name    TEXT,
    state_lihtc_rate            NUMERIC(8,6),
    state_lihtc_notes           TEXT,

    -- REGULATORY AGREEMENT
    regulatory_agreement_term_years INTEGER,
    regulatory_agreement_standard_provisions TEXT,
    -- Key provisions relevant to deal modeling

    -- BONUS DEPRECIATION CONFORMITY
    bonus_dep_conformity_pct    NUMERIC(6,4),
    -- 0.0 = non-conforming, 1.0 = fully conforming, 0.3 = 30%
    bonus_dep_notes             TEXT,

    -- OZ CONFORMITY
    oz_conformity               BOOLEAN,
    oz_conformity_notes         TEXT,

    -- DEAL HISTORY
    deals_closed_count          INTEGER NOT NULL DEFAULT 0,
    first_deal_closed_date      DATE,
    last_deal_closed_date       DATE,
    last_updated_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    last_updated_by             TEXT,

    -- LEARNING LOG
    -- JSON array of {date, deal_name, learning, field_updated}
    learning_log                JSONB DEFAULT '[]'::jsonb,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes                       TEXT
);
```

---

## 4. Deal-Level HFA Link

Each deal record links to the HFA Knowledge Base and records any
deviations from the HFA defaults:

```sql
ALTER TABLE deals ADD COLUMN IF NOT EXISTS
    hfa_id UUID REFERENCES hfa_knowledge(id);

ALTER TABLE deals ADD COLUMN IF NOT EXISTS
    hfa_deviations JSONB DEFAULT '{}'::jsonb;
    -- Documents any fields where this deal deviates from the HFA default.
    -- Format: {"field_name": {"hfa_default": x, "deal_value": y, "reason": z}}
    -- Populated by analyst. Triggers HFA record review after deal close.
```

---

## 5. The Learning Protocol

When a deal closes, the following process runs:

**Step 1 — Deviation review.** The analyst reviews `hfa_deviations` on the
closed deal. Each deviation is assessed: was this a one-off exception or a
signal that the HFA default needs updating?

**Step 2 — HFA record update.** If a deviation signals a genuine update to
the HFA's standard practice, the HFA record is updated and the learning log
is appended with the date, deal name, and the learning.

**Step 3 — Downstream deal population.** Any future deal with the same HFA
that has not yet been locked picks up the updated default.

**Step 4 — CC spec update.** If the learning is material enough to affect
how CC builds calculations or models, a spec update is queued.

This protocol ensures the knowledge base compounds over time. The first deal
with a new HFA is the most research-intensive. The fifth deal is largely
pre-populated. The tenth deal runs on institutional knowledge.

---

## 6. Marketing Language

**For investor materials and advisor conversations (non-confidential framing):**

"HDC's investment analysis platform incorporates institutional knowledge of
housing finance agency mechanics accumulated across every deal the firm has
closed. Each transaction contributes to a proprietary knowledge base that
pre-populates deal models with agency-specific defaults — exit expectations,
debt mechanics, refinancing restrictions, resyndication programs, and
regulatory requirements. The platform gets measurably more accurate with
every deal. This accumulated knowledge is not available to market entrants
and cannot be purchased."

**For technical brief (appropriate for quant advisor context):**

"The platform's composable deal schema incorporates an HFA Knowledge Layer
that sits between the canonical core and deal-type extensions. When a deal
is created, the platform looks up the relevant housing finance agency record
and pre-populates deal defaults with validated institutional learnings from
prior transactions. Deviations from defaults are logged and reviewed at deal
close to update the HFA record. The knowledge base compounds with deal volume —
each transaction makes every subsequent deal with the same agency more
accurate."

---

## 7. HFA Records — Current Inventory

| HFA | State | Type | Deals Closed | Confidence |
|---|---|---|---|---|
| NYC HPD | NY | City | 1 (Queenswood active) | Low — first deal |
| NYC HDC | NY | City | 1 (Queenswood active) | Low — first deal |
| WSHFC | WA | State | Active deals | Medium |

Records below document current knowledge. Fields marked UNKNOWN require
deal-specific research. All records will be updated as deals progress.

---

## 8. HFA Record: NYC HPD
**NYC Department of Housing Preservation and Development**
**First documented:** May 2026 | **Source deal:** Queenswood Phase II (Ella)
**Confidence level:** Low — first NYC HPD deal. All fields subject to revision.

### Exit Horizon
**Default:** `year_15_institutional`

HPD operates a formal Year 15 Preservation Program specifically for its
LIHTC portfolio. The program provides technical assistance to building
sponsors for investor exit and repositioning at the end of the initial
compliance period. Year 15 is HPD's institutional expectation for LP exit
and resyndication engagement on city-assisted LIHTC properties.

Early LP exit (before Year 15) is legally permissible post-HERA but requires
HPD cooperation on soft debt restructuring, resyndication timing, and transfer
approval. There is no automatic right to early exit. HDC's Year 11 credit
maximization target requires explicit HPD engagement beginning at Year 9.

**Program name:** HPD Low Income Housing Tax Credit Portfolio Preservation
Year 15 Program
**Program URL:** https://www.nyc.gov/site/hpd/services-and-information/lihtc-preservation-year-15-program.page

### Soft Debt Mechanics (Queenswood observed)
**Note rate:** 4.72% (HPD 3rd Mortgage / SHLP)
**Pay rate:** 0.25% (effectively full PIK)
**Rate type:** pik_partial
**Forgiveness expectation:** expected_at_maturity or regulatory period end
**Trigger type:** silent_expected — market expectation but no explicit legal mechanism
**Notes:** HPD loans in Queenswood fully accrue. Outstanding balance at
Year 11 is approximately $151M on $91.6M principal. At Year 35 approximately
$476M. Forgiveness is universally expected by market participants but not
contractually documented in the proforma. §108 insolvency exclusion expected
to apply. COD income treatment requires counsel confirmation.
**Counsel required:** YES — HPD federal funding source (HOME/HTF vs city-only)
affects §42(d)(5)(A) eligible basis treatment. Confirm before basis is finalized.

### Refinancing Restrictions
**Cash-out refinancing:** `requires_payoff`
HPD published policy requires payoff of outstanding subsidy balance to
proceed with cash-out refinancing. At Queenswood's HPD balance of ~$151M
accrued at Year 11, cash-out refinancing is not economically viable without
simultaneous HPD debt restructuring.
**Rate/term refinancing:** `permitted_with_subordination`
HPD will consider subordination requests for rate/term refinances.
30-day review period. Requires compliance with all regulatory agreements.
**Subordination URL:** https://alpha.nyc.gov/site/hpd/services-and-information/mortgage-servicing.page

### Distribution Restrictions
**Status:** UNKNOWN — requires deal-specific regulatory agreement review.
**Notes:** HPD regulatory agreements contain supervisory oversight provisions
including restrictions on refinancing and transfers per Article XI. Whether
operating distributions from surplus cash flow are restricted requires
review of the Queenswood-specific regulatory agreement. Megan Riess to confirm.

### Transfer and LP Exit
**Transfer approval required:** LIKELY — regulatory agreement contains
transfer restrictions. Specific approval process for LP interest sale
requires confirmation from HPD.
**Pre-Year 15 LP exit permitted:** Legally yes (post-HERA). Institutionally
requires HPD cooperation. Not routine. Must be negotiated.
**Notes:** HDC's predetermined EHS exit mechanism (FMV minus net deferred
maintenance, consented to at subscription) is designed to work around the
standard ROFR controversy. However, HPD's institutional expectation remains
Year 15. Any Year 11 exit requires explicit HPD pre-agreement. Recommend
addressing with HPD before Queenswood closes.

### Resyndication
**Program:** HPD Year 15 Preservation Program
**Eligibility:** City-assisted LIHTC properties at end of initial compliance
period. Strategies include mortgage modifications, additional subsidy, 4% or
9% tax credits, inclusionary housing program benefits.
**Year 11 resyndication:** Eligible per §42(d)(2)(B) — 10-year minimum since
PIS is satisfied at Year 10 for a December 2029 PIS. New ownership entity
(EHS) must be unrelated to original owner. Non-competitive 4% credits with
PAB financing most likely pathway.
**Notes:** EHS uses resyndication to finance LP interest acquisition. New
LIHTC equity + new debt = purchase price paid to AHF Fund 1 LP. HPD and HDC
soft debt restructured as new regulatory soft debt at resyndication rather
than paid off. Resyndication is the exit financing mechanism, not the
conventional refinance. Conventional refinance alone generates minimal net
proceeds on an affordable property and is subject to HPD cash-out restriction.

### State/Local LIHTC
**Available:** NO — New York State has its own 4% credit program (HCR/HFA)
but it runs alongside federal LIHTC, not as an additional match. No automatic
state credit match comparable to Georgia's 100% match.

### Bonus Depreciation Conformity
**Conformity:** 0% — New York does not conform to §168(k) bonus depreciation.
State depreciation savings: $0. Federal bonus depreciation channel unaffected.

### OZ Conformity
**Conformity:** YES — New York conforms to federal OZ treatment.

### Regulatory Agreement
**Standard term:** Minimum 30 years
**Key provisions:** Restrictions on refinancing and transfers, tenant income
and rent restrictions, HPD supervisory oversight, annual reporting requirements.
Article XI tax exemption regulatory agreement runs concurrent with affordability
restrictions.

### Learning Log
```json
[
  {
    "date": "2026-05-09",
    "deal": "Queenswood Phase II (Ella)",
    "learning": "HPD has a formal Year 15 Preservation Program that establishes Year 15 as the institutional exit horizon for all HPD-financed LIHTC deals. Early LP exit at Year 11 requires explicit HPD cooperation. This shifts the Queenswood base case exit from Year 11 to Year 15.",
    "fields_updated": ["exit_horizon_default", "exit_program_name", "lp_exit_pre_year15_notes"],
    "source": "HPD published program documentation + CIE audit"
  },
  {
    "date": "2026-05-09",
    "deal": "Queenswood Phase II (Ella)",
    "learning": "HPD cash-out refinancing requires payoff of outstanding subsidy balance per published HPD mortgage servicing policy. At accrued soft debt levels in Queenswood, cash-out refinancing is not a viable LP exit mechanism.",
    "fields_updated": ["cash_out_refi_permitted", "cash_out_refi_notes"],
    "source": "HPD mortgage servicing published policy"
  },
  {
    "date": "2026-05-09",
    "deal": "Queenswood Phase II (Ella)",
    "learning": "HPD federal funding source (HOME/HTF vs city-only) for the Queenswood SHLP loan is unknown. This affects §42(d)(5)(A) eligible basis treatment. Counsel confirmation required before basis is finalized.",
    "fields_updated": ["notes"],
    "source": "CIE capital stack audit + legal review"
  }
]
```

---

## 9. HFA Record: NYC HDC
**New York City Housing Development Corporation**
**First documented:** May 2026 | **Source deal:** Queenswood Phase II (Ella)
**Confidence level:** Low — first NYC HDC deal.

### Soft Debt Mechanics (Queenswood observed)
**Note rate:** 4.72% (HDC 2nd Mortgage)
**Pay rate:** 1.25%
**Rate type:** pik_partial
**Forgiveness expectation:** silent_expected — market convention, not
contractually documented in proforma.
**Notes:** HDC 2nd accrues from $20M to ~$31M at Year 11, ~$86M at Year 35.

### Refinancing / Exit
Likely similar institutional framework to HPD given both are NYC agencies.
Specific HDC policies require deal-specific confirmation.
**Status:** UNKNOWN — requires review of HDC loan documents for Queenswood.
**Contact:** confirmations@nychdc.com (per HPD servicing documentation)

### Learning Log
```json
[
  {
    "date": "2026-05-09",
    "deal": "Queenswood Phase II (Ella)",
    "learning": "HDC 2nd Mortgage in Queenswood has PIK structure: 4.72% note rate, 1.25% pay rate, 3.47% net annual accrual. Forgiveness universally expected by market but not documented in proforma.",
    "fields_updated": ["typical_note_rate", "typical_pay_rate", "forgiveness_expectation"],
    "source": "CIE capital stack audit"
  }
]
```

---

## 10. WSHFC Record (placeholder)
**Washington State Housing Finance Commission**
**Status:** Placeholder — to be populated from active WA deals.

---

## 11. Future HFA Records — Priority Queue

As HDC expands geographically, these HFAs should be documented:

| Priority | HFA | State | Why |
|---|---|---|---|
| High | WSHFC | WA | Active deals — document from existing deal history |
| High | Ohio HDFA | OH | Target expansion market |
| High | Georgia DCA | GA | State LIHTC 100% match — high value learnings |
| Medium | Oregon Housing | OR | Target expansion market |
| Medium | Nebraska NIFA | NE | Target expansion market |
| Low | HUD/FHA | Federal | For deals with Section 8 or project-based vouchers |

---

## 12. Implementation Notes

**Where this lives in the repo:**
- Spec: `frontend/docs/specs/HDC_HFA_Knowledge_Base_Spec_v1_0.md`
- HFA records can live in the same file (as above) or in individual files
  per HFA as the knowledge base grows: `frontend/docs/hfa/NYC_HPD_v1_0.md`

**IMPL assignment:** This spec requires two new IMPLs:
- One Brad backend IMPL: `hfa_knowledge` table + `hfa_deviations` on deals → **IMPL-193**
- One CC frontend IMPL: HFA lookup and pre-population UI in deal creation flow → **IMPL-194**

**IMPL numbers:** IMPL-193 and IMPL-194 (next available after IMPL-192).
- IMPL-190: Two-scenario fee architecture, Scenario A (HDC as developer)
- IMPL-191: §465 at-risk basis check candidate (QNRD validation gap)
- IMPL-192: Two-scenario fee architecture, Scenario B (HDC as asset manager)
- IMPL-193: HFA Knowledge Base — Brad backend (hfa_knowledge table)
- IMPL-194: HFA Knowledge Base — CC frontend (HFA lookup + pre-population UI)

---

## 13. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | May 2026 | Initial specification. NYC HPD and HDC records from Queenswood Phase II learnings. HFA Knowledge Layer architecture defined. Learning protocol established. Marketing language drafted. |
| 1.1 | May 2026 | IMPL numbers updated: IMPL-193 (Brad backend: hfa_knowledge table) and IMPL-194 (CC frontend: HFA lookup UI). IMPL-190–192 assigned to two-scenario fee architecture and §465 check. |
