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
