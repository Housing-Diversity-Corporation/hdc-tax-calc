# Backend Entity Registry
**Version:** 1.0
**Date:** 2026-04-08
**Branch:** main | **Baseline IMPL:** 160
**Purpose:** Living snapshot of deployed backend schema for CC reference.
This is an audit aid — the Java entities are the source of truth.
If this file disagrees with the actual entity, update this file.

## Update Protocol
Any IMPL that adds or modifies backend entity fields must update the
affected section of this file before closing the bead. Include the
registry update in the SPEC_IMPLEMENTATION_REGISTRY entry.

---

## 1. Database Configuration

| Setting | Value |
|---|---|
| ddl-auto | update (Hibernate sole schema manager — no Flyway, no Liquibase) |
| Database | hdc_main_db |
| Schemas | public, user_schema, tax_benefits |
| Default schema | user_schema (hibernate.default_schema) |
| Connection pool | HikariCP, max 10, 120s timeout, 30min max lifetime |

**Schema management rule:** Angel adds fields to Java entity classes.
Hibernate creates/alters columns on server restart. All new fields must
be nullable for backward compatibility with existing records.

---

## 2. Entity Inventory

### 2.1 tax_benefits Schema

---

#### DealConduit
**Class:** DealConduit.java
**Table:** tax_benefits.deal_conduit
**Columns (4):** id, is_preset (Boolean, not nullable), created_at, updated_at
**Relationships:**
- 8x @OneToOne → child input tables (cascade ALL, orphanRemoval=true, EAGER)
- @JsonUnwrapped on ALL 8 child entities → API returns flat JSON
- 1x @OneToMany → DealBenefitProfile (cascade ALL, LAZY)

**@JsonUnwrapped children (flat JSON on GET /api/deal-conduits/{id}):**
projectDefinition, capitalStructure, taxCredits, opportunityZone,
investorProfile, projections, hdcIncome, portalSettings

---

#### InputProjectDefinition — Panel 1
**Class:** InputProjectDefinition.java
**Table:** tax_benefits.input_project_definition
**Columns (6):**

| Java Field | DB Column | Type |
|---|---|---|
| projectCost | project_cost | Double |
| predevelopmentCosts | predevelopment_costs | Double |
| landValue | land_value | Double |
| selectedState | selected_state | String |
| yearOneNoi | year_one_noi | Double |
| createdAt | created_at | LocalDateTime |
| updatedAt | updated_at | LocalDateTime |

FK: deal_conduit_id (not nullable, unique)

---

#### InputCapitalStructure — Panel 2
**Class:** InputCapitalStructure.java
**Table:** tax_benefits.input_capital_structure
**Columns (45):**

| Java Field | DB Column | Type |
|---|---|---|
| autoBalanceCapital | auto_balance_capital | Boolean |
| investorEquityRatio | investor_equity_ratio | Double |
| investorEquityPct | investor_equity_pct | Double |
| philanthropicEquityPct | philanthropic_equity_pct | Double |
| seniorDebtPct | senior_debt_pct | Double |
| seniorDebtRate | senior_debt_rate | Double |
| seniorDebtAmortization | senior_debt_amortization | Double |
| seniorDebtIoYears | senior_debt_io_years | Integer |
| philDebtPct | phil_debt_pct | Double |
| philDebtRate | phil_debt_rate | Double |
| philDebtAmortization | phil_debt_amortization | Double |
| philCurrentPayEnabled | phil_current_pay_enabled | Boolean |
| philCurrentPayPct | phil_current_pay_pct | Double |
| hdcSubDebtPct | hdc_sub_debt_pct | Double |
| hdcSubDebtPikRate | hdc_sub_debt_pik_rate | Double |
| pikCurrentPayEnabled | pik_current_pay_enabled | Boolean |
| pikCurrentPayPct | pik_current_pay_pct | Double |
| investorSubDebtPct | investor_sub_debt_pct | Double |
| investorSubDebtPikRate | investor_sub_debt_pik_rate | Double |
| investorPikCurrentPayEnabled | investor_pik_current_pay_enabled | Boolean |
| investorPikCurrentPayPct | investor_pik_current_pay_pct | Double |
| outsideInvestorSubDebtPct | outside_investor_sub_debt_pct | Double |
| outsideInvestorSubDebtRate | outside_investor_sub_debt_rate | Double |
| outsideInvestorSubDebtAmortization | outside_investor_sub_debt_amortization | Integer |
| outsideInvestorPikCurrentPayEnabled | outside_investor_pik_current_pay_enabled | Boolean |
| outsideInvestorPikCurrentPayPct | outside_investor_pik_current_pay_pct | Double |
| hdcDebtFundPct | hdc_debt_fund_pct | Double |
| hdcDebtFundPikRate | hdc_debt_fund_pik_rate | Double |
| hdcDebtFundCurrentPayEnabled | hdc_debt_fund_current_pay_enabled | Boolean |
| hdcDebtFundCurrentPayPct | hdc_debt_fund_current_pay_pct | Double |
| subDebtPriority | sub_debt_priority | TEXT |
| subDebtPriorityHdc | sub_debt_priority_hdc | Integer |
| subDebtPriorityInvestor | sub_debt_priority_investor | Integer |
| subDebtPriorityOutsideInvestor | sub_debt_priority_outside_investor | Integer |
| interestReserveEnabled | interest_reserve_enabled | Boolean |
| interestReserveMonths | interest_reserve_months | Integer |
| interestReserveAmount | interest_reserve_amount | Double |
| pabEnabled | pab_enabled | Boolean |
| pabPctOfEligibleBasis | pab_pct_of_eligible_basis | Double |
| pabRate | pab_rate | Double |
| pabTerm | pab_term | Integer |
| pabAmortization | pab_amortization | Integer |
| pabIoYears | pab_io_years | Integer |
| hdcPlatformMode | hdc_platform_mode | String |
| createdAt | created_at | LocalDateTime |
| updatedAt | updated_at | LocalDateTime |

---

#### InputTaxCredits — Panel 3
**Class:** InputTaxCredits.java
**Table:** tax_benefits.input_tax_credits
**Columns (21):**

| Java Field | DB Column | Type |
|---|---|---|
| lihtcEnabled | lihtc_enabled | Boolean |
| applicableFraction | applicable_fraction | Double |
| creditRate | credit_rate | Double |
| placedInServiceMonth | placed_in_service_month | Integer |
| ddaQctBoost | dda_qct_boost | Boolean |
| commercialBasisPct | commercial_basis_pct | Double |
| commercialSpaceCosts | commercial_space_costs | Double |
| syndicationCosts | syndication_costs | Double |
| marketingCosts | marketing_costs | Double |
| financingFees | financing_fees | Double |
| bondIssuanceCosts | bond_issuance_costs | Double |
| operatingDeficitReserve | operating_deficit_reserve | Double |
| replacementReserve | replacement_reserve | Double |
| otherExclusions | other_exclusions | Double |
| stateLihtcEnabled | state_lihtc_enabled | Boolean |
| syndicationRate | syndication_rate | Double |
| investorHasStateLiability | investor_has_state_liability | Boolean |
| stateLihtcUserPercentage | state_lihtc_user_percentage | Double |
| stateLihtcUserAmount | state_lihtc_user_amount | Double |
| stateLihtcSyndicationYear | state_lihtc_syndication_year | Integer |
| createdAt | created_at | LocalDateTime |
| updatedAt | updated_at | LocalDateTime |

---

#### InputOpportunityZone — Panel 4
**Class:** InputOpportunityZone.java
**Table:** tax_benefits.input_opportunity_zone
**Columns (7):**

| Java Field | DB Column | Type |
|---|---|---|
| ozEnabled | oz_enabled | Boolean |
| ozType | oz_type | String |
| ozVersion | oz_version | String |
| ozDeferredCapitalGains | oz_deferred_capital_gains | Double |
| ozCapitalGainsTaxRate | oz_capital_gains_tax_rate | Double |
| createdAt | created_at | LocalDateTime |
| updatedAt | updated_at | LocalDateTime |

---

#### InputInvestorProfile — Panel 5
**Class:** InputInvestorProfile.java
**Table:** tax_benefits.input_investor_profile
**Columns (26):**

| Java Field | DB Column | Type |
|---|---|---|
| investorState | investor_state | String |
| projectLocation | project_location | String |
| federalOrdinaryRate | federal_ordinary_rate | Double |
| federalCapitalGainsRate | federal_capital_gains_rate | Double |
| stateOrdinaryRate | state_ordinary_rate | Double |
| stateCapitalGainsRate | state_capital_gains_rate | Double |
| federalTaxRate | federal_tax_rate | Double |
| stateTaxRate | state_tax_rate | Double |
| ltCapitalGainsRate | lt_capital_gains_rate | Double |
| niitRate | niit_rate | Double |
| capitalGainsTaxRate | capital_gains_tax_rate | Double |
| investorTrack | investor_track | String |
| passiveGainType | passive_gain_type | String |
| investorType | investor_type | String |
| annualOrdinaryIncome | annual_ordinary_income | Double |
| annualPassiveIncome | annual_passive_income | Double |
| annualPortfolioIncome | annual_portfolio_income | Double |
| groupingElection | grouping_election | Boolean |
| filingStatus | filing_status | String |
| annualIncome | annual_income | Double |
| includeDepreciationSchedule | include_depreciation_schedule | Boolean |
| w2Income | w2_income | Double |
| businessIncome | business_income | Double |
| iraBalance | ira_balance | Double |
| passiveIncome | passive_income | Double |
| assetSaleGain | asset_sale_gain | Double |

---

#### InputProjections — Panel 6
**Class:** InputProjections.java
**Table:** tax_benefits.input_projections
**Columns (13):**

| Java Field | DB Column | Type | Notes |
|---|---|---|---|
| holdPeriod | hold_period | Integer | |
| yearOneDepreciationPct | year_one_depreciation_pct | Double | Cost seg % — drives bonus dep |
| exitCapRate | exit_cap_rate | Double | |
| constructionDelayMonths | construction_delay_months | Integer | |
| taxBenefitDelayMonths | tax_benefit_delay_months | Integer | |
| investmentDate | investment_date | String | ISO date string |
| electDeferCreditPeriod | elect_defer_credit_period | Boolean | §42(f)(1) election |
| pisDateOverride | pis_date_override | String | ISO date string |
| exitExtensionMonths | exit_extension_months | Integer | |
| noiGrowthRate | noi_growth_rate | Double | |
| revenueGrowth | revenue_growth | Double | |
| expenseGrowth | expense_growth | Double | |
| opexRatio | opex_ratio | Double | |

**Pending additions (Bead 1.4 — OBBBA Component Election):**
constructionStartDate (String), gcContractDate (String),
postObbbaComponentPct (Double), preObbbaBonusPct (Double)

---

#### InputHdcIncome — Panel 7
**Class:** InputHdcIncome.java
**Table:** tax_benefits.input_hdc_income
**Columns (12):**

| Java Field | DB Column | Type |
|---|---|---|
| hdcFeeRate | hdc_fee_rate | Double |
| hdcDevelopmentFeePct | hdc_development_fee_pct | Double |
| hdcDeferredInterestRate | hdc_deferred_interest_rate | Double |
| investorPromoteShare | investor_promote_share | Double |
| aumFeeEnabled | aum_fee_enabled | Boolean |
| aumFeeRate | aum_fee_rate | Double |
| aumCurrentPayEnabled | aum_current_pay_enabled | Boolean |
| aumCurrentPayPct | aum_current_pay_pct | Double |
| hdcAdvanceFinancing | hdc_advance_financing | Boolean |
| taxAdvanceDiscountRate | tax_advance_discount_rate | Double |
| advanceFinancingRate | advance_financing_rate | Double |
| taxDeliveryMonths | tax_delivery_months | Integer |

---

#### InputInvPortalSettings — Panel 8
**Class:** InputInvPortalSettings.java
**Table:** tax_benefits.input_inv_portal_settings
**Columns (23):**

| Java Field | DB Column | Type | Notes |
|---|---|---|---|
| dealName | deal_name | String | |
| category | category | String | |
| isActive | is_active | Boolean | |
| userId | user_id | Long | FK → user_schema.users |
| configurationName | configuration_name | String | |
| completionStatus | completion_status | String | |
| isDefault | is_default | Boolean | |
| isInvestorFacing | is_investor_facing | Boolean | Filter for deal selector |
| isShared | is_shared | Boolean | |
| tags | tags | String (1000) | |
| statusCategory | status_category | String | |
| collaboratorIds | collaborator_ids | String (1000) | |
| dealDescription | deal_description | String (5000) | |
| dealLocation | deal_location | String | |
| dealLatitude | deal_latitude | Double | |
| dealLongitude | deal_longitude | Double | |
| dealImageUrl | deal_image_url | String | |
| units | units | Integer | |
| affordabilityMix | affordability_mix | String | |
| projectStatus | project_status | String | |
| minimumInvestment | minimum_investment | Double | |
| createdAt | created_at | LocalDateTime | |
| updatedAt | updated_at | LocalDateTime | |

---

#### DealBenefitProfile
**Class:** DealBenefitProfile.java
**Table:** tax_benefits.deal_benefit_profiles
**Columns (33):** deal_name, fund_year, gross_equity, net_equity,
syndication_proceeds, pis_year, projected_exit_year, state_lihtc_path,
property_state, project_cost, oz_enabled, hold_period, pis_month,
investment_date, construction_delay_months, pis_date_override,
elect_defer_credit_period, senior_debt_pct, phil_debt_pct, equity_pct,
syndication_rate, cost_segregation_percent, depreciable_basis,
depreciation_schedule (jsonb), lihtc_schedule (jsonb),
state_lihtc_schedule (jsonb), operating_cash_flow (jsonb), exit_proceeds,
cumulative_depreciation, recapture_exposure, projected_appreciation,
capital_gains_tax, extracted_at, created_at, updated_at
**Relationships:** @ManyToOne → DealConduit | @OneToMany → PoolMembership (cascade ALL)
**Note:** All dollar fields stored in millions. aggregatePoolToBenefitStream()
converts to dollars (×1M). Any new code reading DBP values must go through
this layer.

---

#### InvestorTaxInfo
**Class:** InvestorTaxInfo.java
**Table:** tax_benefits.investor_tax_info
**API endpoint:** /api/investor/tax-info (NOT /api/investor-tax-info)
**Columns (27):**

| Java Field | DB Column | Type | Added |
|---|---|---|---|
| profileName | profile_name | String | B1 |
| annualIncome | annual_income | Double | B1 |
| annualOrdinaryIncome | annual_ordinary_income | Double | B1 |
| annualPassiveIncome | annual_passive_income | Double | B1 |
| annualPassiveOrdinaryIncome | annual_passive_ordinary_income | Double | IMPL-159 |
| annualPassiveLTCGIncome | annual_passive_ltcg_income | Double | IMPL-159 |
| annualPortfolioIncome | annual_portfolio_income | Double | B1 |
| iraBalance | ira_balance | Double | IMPL-146 |
| groupingElection | grouping_election | Boolean | B1 |
| hasMaterialAmtExposure | has_material_amt_exposure | Boolean | IMPL-157 |
| nolDiscountRate | nol_discount_rate | Double | IMPL-160 |
| filingStatus | filing_status | String | B1 |
| federalOrdinaryRate | federal_ordinary_rate | Double | B1 |
| stateOrdinaryRate | state_ordinary_rate | Double | B1 |
| federalCapitalGainsRate | federal_capital_gains_rate | Double | B1 |
| stateCapitalGainsRate | state_capital_gains_rate | Double | B1 |
| selectedState | selected_state | String | B1 |
| projectLocation | project_location | String | B1 |
| investorTrack | investor_track | String | B1 |
| passiveGainType | passive_gain_type | String | B1 |
| repStatus | rep_status | Boolean | B1 |
| ozType | oz_type | String | B1 |
| deferredCapitalGains | deferred_capital_gains | Double | B1 |
| capitalGainsTaxRate | capital_gains_tax_rate | Double | B1 |
| isDefault | is_default | Boolean | B1 |
| createdAt | created_at | LocalDateTime | B1 |
| updatedAt | updated_at | LocalDateTime | B1 |

FK: user_id (not nullable) → user_schema.users
**Pending additions (Bead 3.2 — AMT Engine, after Sidley sign-off):**
amtSaltDeduction (Double), amtIsoExercises (Double),
amtPabInterest (Double), amtOtherPreferences (Double)

---

#### InvestmentPool
**Class:** InvestmentPool.java
**Table:** tax_benefits.investment_pools
**Columns (6):** id, pool_name (not nullable), description (TEXT),
status (default "modeling"), start_year, created_at, updated_at

---

#### PoolMembership
**Class:** PoolMembership.java
**Table:** tax_benefits.pool_memberships
**Columns:** id, added_at + FKs: pool_id (→ InvestmentPool), dbp_id (→ DealBenefitProfile)
**Constraint:** UNIQUE(pool_id, dbp_id)

---

### 2.2 user_schema Schema

#### User
**Class:** User.java
**Table:** user_schema.users
**Columns (15):** id, username, password, role, full_name, created_at,
profile_image_url, banner_image_url, job_title, industry, organization,
location, contact_email, phone, bio (500), email_notify

#### PasswordResetToken
**Class:** PasswordResetToken.java
**Table:** user_schema.password_reset_tokens (via hibernate.default_schema)
**Columns (5):** id, token (unique, not null), email (not null),
expires_at (not null), created_at (not null), used (not null, default false)

---

### 2.3 Entities Not Yet Created (Pending Beads)

| Entity | Table | Bead | Spec |
|---|---|---|---|
| AnnualTaxPosition | annual_tax_positions | 5.1 | Tax Benefits Spec §15.9 |
| TaxScenario | tax_scenarios | 5.1 | Tax Benefits Spec §15.9 |
| StateConformityData | state_conformity_data | 5.3 | State Conformity Enhancement Spec v1.0 |

---

## 3. Repository Inventory

| Repository | Entity | Custom Methods |
|---|---|---|
| DealConduitRepository | DealConduit | findByIsPresetTrue/False, findUserConfigurations, findAllConfigurations, findUserDefault, findActivePresets, findActivePresetsByCategory, findSharedConfigurations, findSharedUpdatedSince |
| DealBenefitProfileRepository | DealBenefitProfile | findByDealConduitIdOrderByExtractedAtDesc |
| InvestmentPoolRepository | InvestmentPool | None (JpaRepository defaults) |
| InvestorTaxInfoRepository | InvestorTaxInfo | findByUserOrderByCreatedAtDesc, findByUserIdOrderByCreatedAtDesc, findByUserAndIsDefaultTrue, findByIdAndUser, deleteByIdAndUser, clearDefaultForUser |
| PoolMembershipRepository | PoolMembership | findByPoolId, findByDealBenefitProfileId, findByPoolIdAndDealBenefitProfileId, existsByPoolIdAndDealBenefitProfileId |
| UserRepo | User | findByUsername |
| PasswordResetTokenRepository | PasswordResetToken | findByToken, findByEmail, deleteExpiredTokens, deleteByEmail |

**Note:** No repositories exist for the 8 Panel input entities
(InputProjectDefinition through InputInvPortalSettings). These are managed
entirely through DealConduit cascade relationships.

---

## 4. Controller / Endpoint Inventory

| Controller | Base Path | Endpoint Count |
|---|---|---|
| DealConduitController | /api/deal-conduits | 16 |
| DealBenefitProfileController | /api/deal-benefit-profiles | 6 |
| InvestmentPoolController | /api/investment-pools | 8 |
| InvestorTaxInfoController | /api/investor/tax-info | 7 |
| UserController | /api/public | 5 |
| AccountController | /api/account | 2 |
| BannerImageController | /api/user/banner-image | 3 |
| ProfileImageController | /api/user/profile-image | 3 |

**Total: 50 endpoints across 8 controllers.**

### Key endpoints for CC reference

```
# Deal operations
GET    /api/deal-conduits                    → all configurations (flat JSON via @JsonUnwrapped)
GET    /api/deal-conduits/{id}               → single deal (flat JSON — all 8 panels unwrapped)
POST   /api/deal-conduits                    → create
PUT    /api/deal-conduits/{id}               → update

# Investor profiles
GET    /api/investor/tax-info                → all profiles for current user
GET    /api/investor/tax-info/{id}           → single profile
POST   /api/investor/tax-info                → create
PUT    /api/investor/tax-info/{id}           → update
DELETE /api/investor/tax-info/{id}           → delete

# Deal Benefit Profiles
GET    /api/deal-benefit-profiles            → all DBPs
POST   /api/deal-benefit-profiles/extract    → extract DBP from current calc

# Pools
GET    /api/investment-pools                 → all pools
POST   /api/investment-pools                 → create pool
POST   /api/investment-pools/{id}/deals      → add deal to pool
```

### Deal selector filter (Portfolio Manager)
To get investor-facing deals for the deal selector dropdown:
Filter GET /api/deal-conduits results where `isInvestorFacing === true`.
This field lives on InputInvPortalSettings but is unwrapped to the top level.

---

## 5. Architecture Notes for CC

**Flat JSON is guaranteed:** All 8 Panel entities use @JsonUnwrapped on DealConduit.
GET /api/deal-conduits/{id} returns a single flat object. Fields from all 8 panels
appear at the top level alongside the 4 DealConduit root fields.

**Calculated results are not stored:** The engine is deterministic. No calculated*
columns exist. The Portfolio Manager and all other screens compute results in the
frontend engine on each render.

**DBP dollar units:** All dollar fields in deal_benefit_profiles are stored in
millions. aggregatePoolToBenefitStream() in poolAggregation.ts handles conversion.

**Child entity repositories don't exist:** Never attempt to autowire a repository
for InputProjections, InputCapitalStructure, etc. They are only accessible via
DealConduit cascade. To update a Panel 6 field, load the DealConduit, modify the
child entity, save the DealConduit.

**Adding fields to existing entities:** Angel adds a nullable @Column field to the
Java entity class. Hibernate adds the column on server restart. No DDL scripts, no
migration files. All new fields must be nullable to avoid breaking existing records.

---

*End of Backend Entity Registry v1.0*
*Next update: after Bead 1.4, 1.5, or 3.2 fields are added by Angel.*
