# Documented Assumptions

Platform assumptions that affect LIHTC credit calculations, investor disclosures, and deal structuring. Each item includes the IRC basis, platform treatment, and any required deal-level verification.

---

## LIHTC Compliance — First-Year Mechanics
*Added: IMPL-118 | Source: Novogradac LIHTC literature + 2026-03-04 design session*

### Item 4 — Form 8609 Delivery Risk
Credits cannot be claimed until IRS Form 8609 is physically received from the state Housing
Finance Agency. Delays in 8609 issuance may defer credit utilization to a subsequent tax year.
For large partnerships, post-2015 Bipartisan Budget Act rules require delayed credit claims via
Administrative Adjustment Request (AAR) rather than amended return.

**Platform treatment:** Operational risk, not modeled as a calculation parameter. HDC manages
8609 timing through its HFA relationships (WSHFC — Lisa Vatske). Include the following language
in investor disclosure documentation:

> "Credit period commencement is contingent on receipt of IRS Form 8609 from the state Housing
> Finance Agency. Delays in 8609 issuance may defer credit utilization to a subsequent tax year.
> For large partnerships, post-2015 rules require delayed credit claims via Administrative
> Adjustment Request rather than amended return."

---

### Item 5 — First-of-Month PIS Precision
IRC §42 requires a building to be placed in service on the first day of a month to count that
month toward the Year 1 credit proration. A PIS date of January 2 means credits begin in
February, not January.

**Platform treatment:** Documented assumption. The Timing Architecture Rewire (IMPL-108–117)
moved the platform to exact PIS dates. HDC controls its PIS dates operationally and targets
month-start dates when first-day-of-month precision affects credit timing. No additional
modeling required.

---

### Item 6 — Building-by-Building Credit Basis (Future Improvement)
IRC §42 determines credits per building, not per project. A multi-building project (e.g.,
Trace 4001 with multiple buildings) could have staggered PIS dates, each with its own
applicable fraction and credit schedule.

**Platform treatment:** Known limitation. The platform currently models one PIS date per
project. This is conservative for multi-building projects if any building has a later PIS date.

**Future improvement required:** When a multi-building deal is encountered, implement
per-building PIS dates and credit schedules. Track as a future IMPL at that time.

---

### Item 7 — Square Footage Fraction Verification
IRC §42 requires the lower of (unit count fraction) OR (square footage fraction) for each
monthly applicable fraction. The platform uses the unit count fraction only.

**Platform treatment:** Documented assumption. HDC's Affordable by Design right-sized units
are sufficiently uniform that the unit count fraction and square footage fraction are effectively
equal. This must be verified on each deal.

**Deal-level verification required for every LIHTC deal:**
1. Obtain unit-level square footage matrix from architect's drawings.
2. Compute: low-income unit SF ÷ total unit SF = square footage fraction.
3. Confirm square footage fraction ≥ unit count fraction.
4. If square footage fraction is lower, it must be used as the applicable fraction cap.
5. Document result in the deal file before submitting Form 8609 application.

---

### Item 9 — Acquisition-Specific Mechanics (Future Research Required)
The following mechanics apply to acquisition deals and acquisition/rehab deals. They are not
modeled in the platform for Fund 1 but must be researched and implemented before structuring
any acquisition/rehab deal.

**Revenue Procedure 2003-82 — Pre-Existing Tenant Safe Harbor:**
For acquisition deals (dealType: 'acquisition'), existing tenants at the time of acquisition
are deemed to satisfy income qualification requirements under a safe harbor. The 120-day
window applies for certifying all residents. Applies to Trace 4001. No additional platform
modeling required for pure acquisitions.

**Tack-Back Rule (acquisition/rehab only — dealType: 'acquisition_rehab'):**
For acquisition/rehab deals, the LIHTC credit period starts on the later of:
(a) the acquisition date, or (b) January 1 of the year in which rehabilitation is substantially
completed. This is not the acquisition date alone. The platform's credit start year logic
must be extended when acquisition_rehab dealType is activated.

**120-Day Certification Window:**
Tenants must be income-certified within 120 days of the acquisition closing date.
Operational requirement — not a calculation parameter.

**Action required before first acquisition/rehab deal:** Engage Novogradac to confirm
deal-specific application of tack-back rule and confirm platform implementation approach.
Pre-assign an IMPL number at that time.

---

## §461(l) EBL Threshold — W-2 Wages Excluded
*Added: April 2026 validation session | Reverted: IMPL-153 (commit 77a2493)*

**Confirmed:** W-2 wages from employment are NOT included in "aggregate gross
income attributable to trades or businesses" under §461(l)(3)(A)(i).

**Authority:**
- CARES Act technical correction (effective tax years beginning 2021+):
  "Employee wages are excluded from gross trade or business income in computing
  the overall amount of an EBL."
- JCT Blue Book (JCS-1-18, December 2018): "The wage income is not taken into
  account in determining the amount of the deduction limited under section 461(l)."

**Platform implementation:** Flat SECTION_461L_LIMITS[filingStatus] cap is correct.
Do not add annualOrdinaryIncome offset to the EBL threshold. IMPL-153 attempted
this and was reverted (commit 77a2493) after counsel research confirmed exclusion.

**Spec cross-reference:** HDC_Tax_Benefits_Spec §5.7 (§461(l) Excess Business Loss Cap)
should include this note:

> **W-2 Wage Exclusion (confirmed):** W-2 wages from employment are excluded
> from §461(l) business income per CARES Act technical correction and JCT Blue
> Book (JCS-1-18). The flat $626K MFJ / $313K Single cap is the correct formula.
> IMPL-153 (reverted, commit 77a2493) confirmed this via research.

---

## 2025 MFJ Marginal Rate at $500K Gross Income
*Added: April 2026 validation session | Validated: Scenario C*

**Confirmed:** $500K gross MFJ → $468,500 taxable (after $31,500 standard
deduction) → 32% marginal bracket. NOT 35% or 37%.

37% bracket begins at $751,600 taxable = ~$783,100 gross MFJ.
35% bracket begins at $501,050 taxable = ~$532,550 gross MFJ.

Any investor materials referencing "pre-HDC marginal rate" for a $500K MFJ
example must use 32%, not 37%. Validated by engine (Scenario C, April 2026).

---

## §42(f)(1) Election — Unconditional for December PIS Deals
*Added: April 2026 validation session | Validated: Scenario A, §38(c) analysis*

**Rationale confirmed by engine validation (April 2026):**
Year 1 bonus depreciation zeros out tax liability → §38(c) ceiling collapses
to $6,250 → LIHTC credits generated in Year 1 cannot be used anyway.

Electing §42(f)(1) defers the credit period start to Year 2, when:
- Depreciation has dropped to recurring level
- Actual tax liability exists
- §38(c) ceiling has recovered

The election trades a partial-year credit that would be wasted for a full
Year 2 credit that can actually be utilized. Should be made unconditionally
for Trace 4001 and 4448 California (December PIS deals).

---

## §752/OZ Inclusion Basis — Valuation, Not §752 Debt Allocations
*Added: April 2026 | Confirmed: Brendan/NSCO external counsel review*

**Incorrect claim:** "§752 debt allocations protect investor basis for
§1400Z-2(b)(1) lesser-of computation."

**Correction:** §752 debt allocations do NOT protect basis for the Dec 31,
2026 inclusion event. Per 26 CFR §1.1400Z2(b)-1(e)(3), basis for inclusion
is computed taking into account only §1400Z-2(b)(2)(B). Valuation protection
(FMV below total debt) is the correct framework — not §752 basis.

**Authority:** 26 CFR §1.1400Z2(b)-1(e)(3); confirmed by Brendan/NSCO
(April 2026).

**Platform impact:** Any OZ exit modeling that references §752 "basis
protection" for the inclusion event must be corrected to use the
FMV-below-debt valuation framework instead.

**Spec cross-references (external documents — update manually):**

HDC_Tax_Benefits_Spec §17.1 "Tax Law Corrections" table — add row:

| §752 debt and OZ inclusion basis | "§752 debt allocations protect investor basis for §1400Z-2(b)(1) lesser-of computation" | §752 debt allocations do NOT protect basis for the Dec 31, 2026 inclusion event. Per 26 CFR §1.1400Z2(b)-1(e)(3), basis for inclusion is computed taking into account only §1400Z-2(b)(2)(B). Valuation protection (FMV below total debt) is the correct framework — not §752 basis. | 26 CFR §1.1400Z2(b)-1(e)(3); confirmed by Brendan/NSCO (April 2026) |

OZ_2_0_Master_Specification Part 5 (Exit Strategy), Dec 31 2026 inclusion
event section — add correction note:

> **Correction (April 2026):** §752 nonrecourse debt allocations do not protect
> investor basis for purposes of the §1400Z-2(b)(1) lesser-of rule. Per 26 CFR
> §1.1400Z2(b)-1(e)(3), the basis used in the inclusion computation is determined
> taking into account only §1400Z-2(b)(2)(B) — not §752 debt allocations.
> Protection from inclusion tax comes entirely from valuation: FMV below total
> debt at the inclusion date. This was confirmed via review by external tax
> counsel (April 2026). Any prior references to §752 "basis protection" for
> the inclusion event are incorrect.

---

## API Null Safety — Formatting Guards
*Added: April 2026 | Source: IMPL-159 crash investigation*

All numeric values received from the API must be guarded against null and
undefined before any formatting call (`.toLocaleString()`, `.toFixed()`, etc.).

**Rule:** Use `!= null` (catches both null and undefined) rather than
`!== undefined` alone. API responses can return `null` for any field; do not
assume a field that was previously populated will always be present.

**Example (correct):**
```typescript
// CORRECT: catches both null and undefined
currentProfile.annualIncome != null
  ? `$${currentProfile.annualIncome.toLocaleString()}`
  : 'N/A'

// WRONG: null passes this check and .toLocaleString() throws
currentProfile.annualIncome !== undefined
  ? `$${currentProfile.annualIncome.toLocaleString()}`
  : 'N/A'
```

**Context:** The backend entity layer returns `null` (not `undefined`) for
unset columns. JavaScript `null !== undefined` evaluates to `true`, so a
`!== undefined` guard passes null through to the formatting call, causing
`TypeError: Cannot read properties of null (reading 'toLocaleString')`.
