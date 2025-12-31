# Quick Validation Checklist
**For validating Investor Multiple and IRR calculations**

## 📋 Pre-Flight (30 seconds)
- [ ] Load saved configuration in UI
- [ ] Open calculator or spreadsheet
- [ ] Have HDC_CALCULATION_LOGIC.md reference ready

## 📊 Extract Values (2 minutes)

**From "Investor 10-Year Analysis" section:**
```
Initial Investment:              $__________
Tax Benefits (10-year total):    $__________
Operating Cash Flows:            $__________
Exit Proceeds:                   $__________
Investor Sub-Debt Repayment:     $__________ (if shown)
──────────────────────────────────────────────
Net Total Returns (UI):          $__________
Investor Multiple (UI):          ______x
Investor IRR (UI):               _____%
```

## ✅ Validation Steps (3 minutes)

### Step 1: Verify Total Returns
```
Sum = Tax + Operating + Exit + SubDebt
    = $____ + $____ + $____ + $____
    = $__________

Matches UI "Net Total Returns"? ☐ YES ☐ NO
If NO, recheck all four values!
```

### Step 2: Verify Multiple
```
Multiple = Total Returns ÷ Initial Investment
         = $__________ ÷ $__________
         = ______x

Matches UI Multiple? ☐ YES ☐ NO
If NO, check if you're using equity ONLY (not equity + HDC fees)
```

### Step 3: Sanity Check IRR
```
Year 1 Coverage = (Tax Benefits × ~45%) ÷ Initial Investment
                ≈ ______%

Expected IRR based on coverage:
☐ <50% → Expect 8-20% IRR
☐ 50-80% → Expect 20-35% IRR
☐ 80-100% → Expect 35-55% IRR
☐ 100-150% → Expect 55-100% IRR
☐ >150% → Expect 100%+ IRR

UI IRR (____%) is in expected range? ☐ YES ☐ NO
```

## 🚨 Red Flags

**STOP if you see these:**
- [ ] Multiple calculated doesn't match UI (>0.05x difference)
- [ ] Total returns sum doesn't match UI (>$1,000 difference)
- [ ] IRR way outside expected range for coverage level
- [ ] Initial Investment seems too high (includes HDC fees?)
- [ ] Tax Benefits >$20M (probably using gross instead of net)

## ✅ Sign-Off

```
Configuration: ___________________________
Date: ______________
Validated By: ___________________________

Result: ☐ PASS (all checks match)
        ☐ MINOR VARIANCE (within tolerances)
        ☐ FAIL (see notes)

Notes: ________________________________
_______________________________________
_______________________________________
```

---

## Common Mistakes to Avoid

❌ **Including HDC fees in initial investment**
   - Should be equity ONLY

❌ **Using "Gross Tax Benefit" instead of "Net"**
   - Must be after 10% HDC fee deduction

❌ **Missing Investor Sub-Debt repayment**
   - Check Capital Structure for Investor Sub-Debt %

❌ **Expecting "normal" IRRs**
   - 90%+ IRR is normal for free investment scenarios

❌ **Using wrong "Operating Cash Flows" number**
   - Must be from "Investor 10-Year Analysis" section
   - NOT from NOI or raw distributable cash

---

**For detailed guidance, see:** `INVESTOR_RETURNS_VALIDATION_GUIDE.md`
