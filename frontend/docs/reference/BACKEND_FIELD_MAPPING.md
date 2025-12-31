# HDC Calculator Backend Field Mapping

## Overview
This document tracks all HDC Calculator input fields that need to be persisted in the backend database.
**Total Fields: 67 configuration fields**

Last Updated: 2025-01-19

## ✅ Complete Field List (67 Fields)

### Basic Project Fields (4)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Project Cost | Number | `projectCost` | `project_cost` | ✅ |
| Land Value | Number | `landValue` | `land_value` | ✅ |
| Year One NOI | Number | `yearOneNOI` | `year_one_noi` | ✅ |
| Year One Depreciation % | Number | `yearOneDepreciationPct` | `year_one_depreciation_pct` | ✅ |

### Projections (5)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Revenue Growth | Slider | `revenueGrowth` | `revenue_growth` | ✅ |
| Expense Growth | Slider | `expenseGrowth` | `expense_growth` | ✅ |
| OPEX Ratio | Number | `opexRatio` | `opex_ratio` | ✅ |
| Exit Cap Rate | Number | `exitCapRate` | `exit_cap_rate` | ✅ |
| Hold Period | Number | `holdPeriod` | `hold_period` | ✅ |

### Capital Structure Controls (4)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Auto Balance Capital | Checkbox | `autoBalanceCapital` | `auto_balance_capital` | ✅ |
| Investor Equity Ratio | Slider | `investorEquityRatio` | `investor_equity_ratio` | ✅ |
| Investor Equity % | Number | `investorEquityPct` | `investor_equity_pct` | ✅ |
| Philanthropic Equity % | Number | `philanthropicEquityPct` | `philanthropic_equity_pct` | ✅ |

### Senior Debt (3)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Senior Debt % | Number | `seniorDebtPct` | `senior_debt_pct` | ✅ |
| Senior Debt Rate | Number | `seniorDebtRate` | `senior_debt_rate` | ✅ |
| Senior Debt Amortization | Dropdown | `seniorDebtAmortization` | `senior_debt_amortization` | ✅ |

### Philanthropic Debt (5)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Phil Debt % | Number | `philDebtPct` | `phil_debt_pct` | ✅ |
| Phil Debt Rate | Number | `philDebtRate` | `phil_debt_rate` | ✅ |
| Phil Debt Amortization | Dropdown | `philDebtAmortization` | `phil_debt_amortization` | ✅ |
| Phil Current Pay Enabled | Checkbox | `philCurrentPayEnabled` | `phil_current_pay_enabled` | ✅ |
| Phil Current Pay % | Slider | `philCurrentPayPct` | `phil_current_pay_pct` | ✅ |

### HDC Sub Debt (4)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| HDC Sub Debt % | Number | `hdcSubDebtPct` | `hdc_sub_debt_pct` | ✅ |
| HDC Sub Debt PIK Rate | Number | `hdcSubDebtPikRate` | `hdc_sub_debt_pik_rate` | ✅ |
| PIK Current Pay Enabled | Checkbox | `pikCurrentPayEnabled` | `pik_current_pay_enabled` | ✅ |
| PIK Current Pay % | Slider | `pikCurrentPayPct` | `pik_current_pay_pct` | ✅ |

### Investor Sub Debt (4)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Investor Sub Debt % | Number | `investorSubDebtPct` | `investor_sub_debt_pct` | ✅ |
| Investor Sub Debt PIK Rate | Number | `investorSubDebtPikRate` | `investor_sub_debt_pik_rate` | ✅ |
| Investor PIK Current Pay Enabled | Checkbox | `investorPikCurrentPayEnabled` | `investor_pik_current_pay_enabled` | ✅ |
| Investor PIK Current Pay % | Slider | `investorPikCurrentPayPct` | `investor_pik_current_pay_pct` | ✅ |

### Outside Investor Sub Debt (5)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Outside Investor Sub Debt % | Number | `outsideInvestorSubDebtPct` | `outside_investor_sub_debt_pct` | ✅ |
| Outside Investor Sub Debt Rate | Number | `outsideInvestorSubDebtRate` | `outside_investor_sub_debt_rate` | ✅ |
| Outside Investor Sub Debt Amortization | Number | `outsideInvestorSubDebtAmortization` | `outside_investor_sub_debt_amortization` | ✅ |
| Outside Investor PIK Current Pay Enabled | Checkbox | `outsideInvestorPikCurrentPayEnabled` | `outside_investor_pik_current_pay_enabled` | ✅ |
| Outside Investor PIK Current Pay % | Slider | `outsideInvestorPikCurrentPayPct` | `outside_investor_pik_current_pay_pct` | ✅ |

### Interest Reserve (3)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Interest Reserve Enabled | Checkbox | `interestReserveEnabled` | `interest_reserve_enabled` | ✅ |
| Interest Reserve Months | Number | `interestReserveMonths` | `interest_reserve_months` | ✅ |
| Interest Reserve Amount | Calculated | `interestReserveAmount` | `interest_reserve_amount` | ✅ |

### Delays (2)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Construction Delay Months | Slider | `constructionDelayMonths` | `construction_delay_months` | ✅ |
| Tax Benefit Delay Months | Slider | `taxBenefitDelayMonths` | `tax_benefit_delay_months` | ✅ |

### Tax Settings (10)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Federal Tax Rate | Dropdown | `federalTaxRate` | `federal_tax_rate` | ✅ |
| Selected State | Dropdown | `selectedState` | `selected_state` | ✅ |
| State Tax Rate | Number | `stateTaxRate` | `state_tax_rate` | ✅ |
| State Capital Gains Rate | Number | `stateCapitalGainsRate` | `state_capital_gains_rate` | ✅ |
| LT Capital Gains Rate | Dropdown | `ltCapitalGainsRate` | `lt_capital_gains_rate` | ✅ |
| NIIT Rate | Number | `niitRate` | `niit_rate` | ✅ |
| Depreciation Recapture Rate | Number | `depreciationRecaptureRate` | `depreciation_recapture_rate` | ✅ |
| Capital Gains Tax Rate | Calculated | `capitalGainsTaxRate` | `capital_gains_tax_rate` | ✅ |
| Deferred Gains | Number | `deferredGains` | `deferred_gains` | ✅ |
| OZ Capital Gains Tax Rate | Calculated | `ozCapitalGainsTaxRate` | `oz_capital_gains_tax_rate` | ✅ |

### Opportunity Zone Settings (4)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| OZ Enabled | Checkbox | `ozEnabled` | `oz_enabled` | ✅ |
| OZ Type | Dropdown | `ozType` | `oz_type` | ✅ |
| OZ Deferred Capital Gains | Number | `ozDeferredCapitalGains` | `oz_deferred_capital_gains` | ✅ |
| OZ Capital Gains Tax Rate | Calculated | `ozCapitalGainsTaxRate` | `oz_capital_gains_tax_rate` | ✅ |

### HDC Fees (5)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| HDC Fee Rate | Slider | `hdcFeeRate` | `hdc_fee_rate` | ✅ |
| HDC Development Fee % | Number | `hdcDevelopmentFeePct` | `hdc_development_fee_pct` | ✅ |
| AUM Fee Enabled | Checkbox | `aumFeeEnabled` | `aum_fee_enabled` | ✅ |
| AUM Fee Rate | Slider | `aumFeeRate` | `aum_fee_rate` | ✅ |
| Investor Promote Share | Slider | `investorPromoteShare` | `investor_promote_share` | ✅ |

### HDC Advance Financing (4)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| HDC Advance Financing | Checkbox | `hdcAdvanceFinancing` | `hdc_advance_financing` | ✅ |
| Tax Advance Discount Rate | Slider | `taxAdvanceDiscountRate` | `tax_advance_discount_rate` | ✅ |
| Advance Financing Rate | Number | `advanceFinancingRate` | `advance_financing_rate` | ✅ |
| Tax Delivery Months | Slider | `taxDeliveryMonths` | `tax_delivery_months` | ✅ |

### Configuration Metadata (2)
| Field Name | Type | Frontend Variable | Backend Column | Status |
|------------|------|-------------------|----------------|--------|
| Configuration Name | Text | `configurationName` | `configuration_name` | ✅ |
| Is Default | Boolean | `isDefault` | `is_default` | ✅ |

## Input Type Summary
- **Checkboxes:** 11
- **Sliders:** 19
- **Dropdowns:** 13
- **Number Inputs:** 20
- **Text Inputs:** 1
- **Calculated Fields:** 3
- **Total:** 67 fields

## Fields NOT Saved (UI State Only)
These fields are for UI state management and should NOT be persisted:
- `validationEnabled`
- `validationResults`
- `showValidationDetails`
- `taxCalculationExpanded`
- `taxOffsetExpanded`
- `depreciationScheduleExpanded`
- Any `isExpanded` states in components

## Adding New Fields Checklist
When adding a new field to the HDC Calculator:

### Frontend:
1. [ ] Add to `useHDCState.ts` hook
2. [ ] Add to `CalculatorConfiguration` interface in `calculatorService.ts`
3. [ ] Add to appropriate input component
4. [ ] Pass through props in `HDCCalculatorMain.tsx`
5. [ ] Update save/load logic in `useHDCState.ts`

### Backend:
1. [ ] Add field to `CalculatorConfiguration.java` entity
2. [ ] Add getter and setter methods
3. [ ] Update database schema (add column)
4. [ ] Test save/load functionality

### Documentation:
1. [ ] Update this BACKEND_FIELD_MAPPING.md file
2. [ ] Update CONFIGURATION_FIELDS.md if needed
3. [ ] Update any affected test files

## Recent Changes
- **2025-01-19:** Added 27 missing fields to backend entity
- **2025-01-19:** Created comprehensive field mapping documentation
- **2025-01-19:** Fixed field naming inconsistencies between frontend and backend