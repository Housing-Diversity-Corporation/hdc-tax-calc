# ISS-076 — OZ Recapture-Avoided Recognized in Year 3 Instead of at Exit

| Field | Value |
|-------|-------|
| **Issue ID** | ISS-076 |
| **Date logged** | 2026-07-17 |
| **Status** | 🔴 OPEN — logged for examination, no fix applied |
| **Priority** | High (materially inflates IRR; contingent benefit recognized ~10 years early) |
| **Discovered on** | Preset `701 BG 64M TDC` (OZ + 4% LIHTC, §42(f)(1) elected) |
| **Origin of behavior** | IMPL-048 / IMPL-048b (introduced annual recognition of `ozRecaptureAvoided`) |
| **Related guards** | IMPL-134 / v10.9 (OZ double-count fix in extended calculation path) |
| **Affected file** | `frontend/src/utils/taxbenefits/calculations.ts` |

---

## Summary

For OZ 10+ year holds, the engine recognizes the **depreciation-recapture-avoided** benefit
(`ozRecaptureAvoided`) **annually, as depreciation is taken**, rather than at the end of the hold
when the benefit is actually realized. Because bonus depreciation front-loads the §1245 write-off
into the first operating year, the bulk of this benefit lands in **Year 3** (the placed-in-service /
bonus year) — roughly a decade before the sale that creates it. This pulls a large, contingent
cash benefit forward and inflates the early-year IRR.

---

## Symptoms (evidence from `701 BG 64M TDC`)

Live UI figures at time of logging: **Investor IRR 10.1%**, **Total Returns $83.73M / 2.36x**,
investor equity ≈ $35.5M.

**Confirmed deal timeline (per deal team, 2026-07-17):** raise + **2-year construction** (Years 1–2)
→ **placed in service in Year 3** (bonus depreciation lands) → **LIHTC credit period begins in
Year 4** (§42(f)(1) deferral). This timeline is intentional and correct — it is NOT a modeling error.
The consequence for this issue: **there is no LIHTC in Year 3**, so Year 3's non-depreciation amount
is almost entirely the mistimed OZ benefit.

The Investor Returns Model "Total" column for Year 3 is ~2× the steady-state years. Decomposition
of Year 3's **$12.315M** total:

| Component | ≈ $M | Correct timing? |
|-----------|------|-----------------|
| Bonus depreciation tax benefit (shelters other income now) | 5.353 | ✅ Correct in Year 3 |
| **OZ recapture-avoided (`ozRecaptureAvoided`), + possibly step-up; NO LIHTC in Yr 3** | **~6.96** | ❌ **recapture portion should be at exit** |
| **Total** | **12.315** | — |

The steady-state years (Yr 4, 6–12) settle to ~$3.33M — this is the **LIHTC** stream, which begins
in Year 4 (federal ~$2.2M + state ~$1.1M). Year 3 is the outlier because the §1245 bonus write-off
is concentrated there, and its recapture-avoided is recognized in the same year.

> **Correction (2026-07-17):** an earlier version of this doc split Year 3 as ~$3.33M LIHTC +
> ~$3.63M recapture-avoided. That was wrong — LIHTC starts in **Year 4**, not Year 3. Year 3's
> full ~$6.96M "other" is OZ-benefit (predominantly `ozRecaptureAvoided`, possibly with a step-up
> component), so the mistimed amount is **larger** than first logged. The exact per-component split
> must be confirmed by instrumenting the engine before any fix.

---

## Root cause (code)

`frontend/src/utils/taxbenefits/calculations.ts`:

- **Definition** (per-year, tied to that year's depreciation character):
  - L1827–1832: `ozRecaptureAvoided = (yearly1245Amount * federalOrdinaryRate) + (yearly1250Amount * sec1250Rate)`
  - `yearly1245Amount` is large in the bonus year → `ozRecaptureAvoided` spikes in Year 3.
- **Included in annual cash flow that drives IRR**:
  - L1860–1862: `totalCashFlow = ... + ozRecaptureAvoided + ...`
  - L2263: `cashFlowArray = investorCashFlows.map(cf => cf.totalCashFlow)` → fed to `calculateIRR`.
- **Existing double-count guards (must be respected by any fix)**:
  - L2281: comment — `ozRecaptureAvoided` already in `cumulativeReturns` via annual `totalCashFlow`.
  - L2540: alternate IRR recompute subtracts it: `cf => cf.totalCashFlow - (cf.ozRecaptureAvoided || 0)`.

---

## Why the current timing is wrong (for a cash-flow IRR)

`ozRecaptureAvoided` represents **tax you would owe at sale but don't**, because the OZ 10-year
basis step-up to FMV forgives the depreciation recapture. The cash event — recapture tax **not
paid** — occurs **in the year of sale**, and only if two conditions hold:

1. The investor holds the full **10 years**, and
2. Actually **sells** into the step-up.

Recognizing it in Year 3 asserts both conditions are already satisfied and books a Year-13 cash
event ten years early. Since IRR (Newton-Raphson over the cash-flow series) weights early dollars
heavily, this **overstates the early IRR**.

**Important distinction — not everything in Year 3 is mistimed:** the **bonus depreciation tax
benefit** ($5.353M) *is* correctly in Year 3 — that is a real, in-year reduction of tax on the
investor's other income. Only the **recapture-avoided** piece is mistimed. The two are separate
benefits: (1) sheltering income now, and (2) never repaying that shelter at exit. Item (2) belongs
at exit.

---

## Proposed resolution (not yet applied)

1. **Move recognition to the exit year.** Sum `ozRecaptureAvoided` across all hold years and
   include the total in the **exit-year** cash flow instead of annually.
2. **Keep the annual figures for display only** (they usefully show the benefit accruing with
   depreciation), but exclude them from the IRR/MOIC cash-flow series until exit.
3. **Reconcile the double-count guards** at L2281 and L2540 so the relocated benefit is counted
   exactly once — neither dropped nor double-added at exit.
4. **Confirm sub-10-year behavior**: verify the benefit is **clawed back / not recognized** if the
   OZ 10-year test isn't met (i.e., a shorter hold should not receive it at all). This is the case
   where early recognition could most seriously misstate a return.
5. **Re-run `701 BG 64M TDC`** and record the before/after IRR and MOIC.

**Expected impact:** total nominal return unchanged; **early IRR drops** (moving ~$3.6M+ from Year 3
to Year 13). Magnitude to be measured on re-run.

---

## Related open question (now tracked as ISS-077)

**Interest reserve distributed in Year 2.** The reserve is capitalized into TPC and is intended to
**fund the lease-up shortfall after construction**. The engine books
`excessReserveDistribution = interestReserveBalance` (L1750–1758) — the **whole balance**
(~$1.128M) — in Year 2, which is likely still mid-lease-up. Need to confirm the S-curve draw has
already consumed what lease-up requires and that only a genuine *excess* is distributed (and at the
right time). Distributing reserve that should still be funding the ramp would overstate Year-2
returns. **Decision needed:** log as its own ISS or fold into a reserve-timing review.

---

## Reproduction / verification steps

1. Load preset `701 BG 64M TDC` on localhost:5173.
2. Open the Investor Returns Model table; note Year 3 "Total" ≈ $12.315M vs steady Yr 4–12 ≈ $4.3–5.1M.
3. Subtract the "Tax Benefit" and "Distributions" columns from each year's "Total"; observe Yr 4/6–12
   flatten to ~$3.33M (LIHTC) while Year 3 carries an extra ~$3.6M (`ozRecaptureAvoided`).
4. Cross-reference `calculations.ts:1827-1832` and `:1860-1862` to confirm the annual recognition path.
