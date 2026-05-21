# IMPL-186 — Full Canonical Schema Build
## CC Prompt v2.6 | May 2026
## Supersedes: IMPL_186_Final_CC_Prompt_v2_1.md (v2.2)

---

## BEAD TRACKING

```bash
# At start — capture ID explicitly
BEAD_ID=$(bd q "IMPL-186 — Full canonical schema build: v1.0 core + v1.2 extensions")
echo "Claimed bead: $BEAD_ID"
[[ -z "$BEAD_ID" ]] && { echo "ERROR: bd q failed to return ID"; exit 1; }

# At end — close with captured ID after commit confirmed
bd close "$BEAD_ID" -r "Completed by IMPL-186 commit <sha>"
```

---

## CONTEXT — REQUIRED READING BEFORE STARTING

This IMPL deploys the complete HDC canonical deal schema for
the first time. Two prior specs define the full target:

- **HDC_Canonical_Deal_Schema_Spec_v1_0.md** (April 2026) —
  13 core tables including the root `deals` table.
- **HDC_Canonical_Schema_Spec_v1_2.md** (May 2026) —
  Composable extension: 5 additional tables, deprecates
  deal_senior_debt and deal_phil_debt.

**Neither has ever been built.** Phase 2.1 was blocked on
Angel's schema review. Angel departed May 2026. Brad owns
the backend. This IMPL does everything in one pass.

**Facts confirmed by pre-build audit (May 11, 2026):**

1. No Flyway, no Liquibase. Hibernate ddl-auto=update manages
   schema. New @Entity classes → Hibernate creates tables on
   restart. No SQL migration files needed.

2. All new fields must be nullable. Existing records must not
   break on restart.

3. **PK strategy: Long with GenerationType.IDENTITY.**
   All 15 existing entities use Long/IDENTITY (BIGSERIAL).
   The canonical schema spec specified UUID — that was a spec
   assumption that does not match the codebase. All 18 new
   entities use Long/IDENTITY to match existing convention.
   UUID adoption is deferred.

4. deal_senior_debt and deal_phil_debt are deprecated in v1.2
   and replaced by deal_debt_tranches. Do NOT create them.

5. deals ↔ deal_snapshots has a circular FK.
   deals.activeSnapshotId references deal_snapshots.id, and
   deal_snapshots.deal → deals. Handle by storing
   activeSnapshotId as a plain nullable Long column on Deal
   (not a @ManyToOne) to break the circular dependency.
   Set null at creation; updated at first publish.

6. deal_tax_events.sourceTranche FK → deal_debt_tranches.
   DealDebtTranche entity must be created before DealTaxEvent.

7. Entity package: `com.hdc.hdc_map_backend.entity.deals`
   (new sub-package, mirrors existing entity.taxBenefits)

8. @Table annotation: `@Table(name = "table_name", schema = "tax_benefits")`

9. JSONB columns: `@Column(columnDefinition = "jsonb")`
   Pattern confirmed in DealBenefitProfile.java.

10. Repository base: `JpaRepository<Entity, Long>`
    New repositories in `repository/deals/` package.

11. No existing seed pattern. Create:
    `config/QueenswoodSeedRunner.java` implementing
    CommandLineRunner. Guard with existence check before
    inserting.

12. deals.createdBy and deals.updatedBy reference users.id
    which is Long/bigint. Store as Long fields — no @ManyToOne
    to avoid cross-schema join complexity.

**Existing entities (do not modify):**
DealConduit, DealBenefitProfile, InputProjectDefinition,
InputCapitalStructure, InputTaxCredits, InputOpportunityZone,
InputInvestorProfile, InputProjections, InputHdcIncome,
InputInvPortalSettings, InvestmentPool, InvestorTaxInfo,
PoolMembership, User, PasswordResetToken.

---

## BLOCKERS FIRST

Pre-build audit confirmed environment is ready. One remaining
check before writing any code:

### Confirm Section 2 DB results are READY

The Section 2 SSH audit should have returned:
- 13 rows in tax_benefits schema (no canonical tables)
- 0 rows for canonical table name check
- users.id = bigint ✓
- deal_conduit.id = bigint ✓

Paste the Section 2 findings here before proceeding.
If Section 2 is not yet complete, run the SSH audit first
(IMPL_186_Section2_DB_Audit_CC_Prompt_v1_0.md) and return
when READY is confirmed.

### Quick local grep — confirm no entity files exist yet

```bash
find backend/src/main/java -path "*/entity/deals*" -name "*.java"
```

Expected: no output. If any files appear — stop and report.

---

## LOMBOK CONVENTIONS — APPLY TO ALL 18 ENTITIES

Plan reviews complete. All decisions confirmed. Apply these
conventions to every entity in this IMPL without exception.

**Annotations on every entity class:**
`@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`
No `@Data`. No `@ToString`. No `@EqualsAndHashCode`.

**@Builder.Default required on these field types:**
- Every `List<...>` collection field → `= new ArrayList<>()`
- Every `Boolean` field with a false default → `= false`
- Every `String` field with a string default (e.g. `status`,
  `modelingStatus`, `sourceType`) → `= "value"`

Without `@Builder.Default`, Lombok Builder assigns null to
fields that have Java field-init defaults, causing not-null
constraint violations on first seed run.

**Bidirectional back-ref pattern (DealConduit convention):**

For every `@OneToOne` parent-side relationship on Deal.java,
override the Lombok-generated setter to auto-link the back-ref:

```java
// Deal.java
public void setProject(DealProject project) {
    this.project = project;
    if (project != null) project.setDeal(this);
}
// Repeat for: operating, equity, subDebt, lihtc, stateLihtc,
// oz, depreciation, fees, misc
```

Lombok detects the existing method signature and skips
generating its own. Child's `setDeal()` is plain Lombok —
no override needed on the child side.

For every `@OneToMany` collection on Deal.java, add an
`addX(...)` helper:

```java
// Deal.java
public void addDebtTranche(DealDebtTranche tranche) {
    debtTranches.add(tranche);
    tranche.setDeal(this);
}
// Repeat for: addGrant, addEquityInstallment,
// addUsesBreakdown, addTaxEvent, addSnapshot, addChangeLog
```

**Builder rule — strictly enforced:**
Never set relationship fields via the builder. Always use
`setX()`/`addX()` helpers after `.build()`. This applies
everywhere: seed runner, tests, and any future code.

```java
// CORRECT
Deal deal = Deal.builder().dealName("Queenswood Phase II").build();
deal.setProject(project);   // links both directions

// WRONG — builder bypasses setter, back-ref is null
Deal deal = Deal.builder().project(project).build();
```

---

## REQUIRED CHANGES

Build in this exact layer order. All files in
`backend/src/main/java/com/hdc/hdc_map_backend/`:

---

### LAYER 1 — ENGINE VERSION REGISTRY

**File:** `entity/deals/EngineVersion.java`
**Table:** `tax_benefits.engine_versions`

```java
@Entity
@Table(name = "engine_versions", schema = "tax_benefits")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EngineVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String version;          // e.g. "1.0.0"

    private Instant deployedAt;
    private String notes;
}
```

---

### LAYER 2 — ROOT DEAL RECORD

**File:** `entity/deals/Deal.java`
**Table:** `tax_benefits.deals`

```java
@Entity
@Table(name = "deals", schema = "tax_benefits")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String dealName;

    private Integer dealLane;        // 1–4
    private String status;           // draft|internal_review|published|archived
    private String sourceType;       // manual_entry|cie_import|proforma_import

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Long createdBy;          // FK → user_schema.users.id (Long)

    private Instant updatedAt;
    private Long updatedBy;          // FK → user_schema.users.id (Long)

    // Circular FK broken: stored as plain Long, not @ManyToOne
    // Set null at creation; updated at first publish event
    private Long activeSnapshotId;   // FK → deal_snapshots.id

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (status == null) status = "draft";
        if (sourceType == null) sourceType = "manual_entry";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // 1:1 children
    @OneToOne(mappedBy = "deal", cascade = CascadeType.ALL,
              orphanRemoval = true, optional = true)
    private DealProject project;

    @OneToOne(mappedBy = "deal", cascade = CascadeType.ALL,
              orphanRemoval = true, optional = true)
    private DealOperating operating;

    @OneToOne(mappedBy = "deal", cascade = CascadeType.ALL,
              orphanRemoval = true, optional = true)
    private DealEquity equity;

    @OneToOne(mappedBy = "deal", cascade = CascadeType.ALL,
              orphanRemoval = true, optional = true)
    private DealSubDebt subDebt;

    @OneToOne(mappedBy = "deal", cascade = CascadeType.ALL,
              orphanRemoval = true, optional = true)
    private DealLihtc lihtc;

    @OneToOne(mappedBy = "deal", cascade = CascadeType.ALL,
              orphanRemoval = true, optional = true)
    private DealStateLihtc stateLihtc;

    @OneToOne(mappedBy = "deal", cascade = CascadeType.ALL,
              orphanRemoval = true, optional = true)
    private DealOz oz;

    @OneToOne(mappedBy = "deal", cascade = CascadeType.ALL,
              orphanRemoval = true, optional = true)
    private DealDepreciation depreciation;

    @OneToOne(mappedBy = "deal", cascade = CascadeType.ALL,
              orphanRemoval = true, optional = true)
    private DealFees fees;

    @OneToOne(mappedBy = "deal", cascade = CascadeType.ALL,
              orphanRemoval = true, optional = true)
    private DealMisc misc;

    // 1:many children
    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL,
               orphanRemoval = true)
    @OrderBy("trancheNumber ASC")
    private List<DealDebtTranche> debtTranches = new ArrayList<>();

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL,
               orphanRemoval = true)
    private List<DealGrant> grants = new ArrayList<>();

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL,
               orphanRemoval = true)
    @OrderBy("installmentNumber ASC")
    private List<DealEquityInstallment> equityInstallments = new ArrayList<>();

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL,
               orphanRemoval = true)
    @OrderBy("lineNumber ASC")
    private List<DealUsesBreakdown> usesBreakdown = new ArrayList<>();

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL,
               orphanRemoval = true)
    private List<DealTaxEvent> taxEvents = new ArrayList<>();

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL,
               orphanRemoval = true)
    @OrderBy("versionNumber DESC")
    private List<DealSnapshot> snapshots = new ArrayList<>();

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL,
               orphanRemoval = true)
    private List<DealChangeLog> changeLog = new ArrayList<>();
}
```

---

### LAYER 3 — DEAL SNAPSHOT + CHANGE LOG

**File:** `entity/deals/DealSnapshot.java`
**Table:** `tax_benefits.deal_snapshots`

Fields:
- id: Long PK (IDENTITY)
- deal: @ManyToOne(nullable=false) → Deal
- versionNumber: Integer NOT NULL
- status: String NOT NULL (draft|active|superseded|withdrawn)
- engineVersion: String NOT NULL
- schemaVersion: String DEFAULT '1.2'
- inputsJson: String @Column(columnDefinition="jsonb")
- outputsJson: String @Column(columnDefinition="jsonb")
- inputHash: String
- outputHash: String
- changeSummary: String @Column(columnDefinition="jsonb")
- lockedAt: Instant
- lockedBy: Long (FK → users.id as plain Long)
- supersededAt: Instant
- supersededById: Long (plain Long, not @ManyToOne)

Unique constraint: @Table uniqueConstraints on (deal_id, version_number)

**File:** `entity/deals/DealChangeLog.java`
**Table:** `tax_benefits.deal_change_log`

Fields:
- id: Long PK (IDENTITY)
- deal: @ManyToOne(nullable=false) → Deal
- tableName: String NOT NULL
- fieldName: String NOT NULL
- oldValue: String
- newValue: String
- changedAt: Instant NOT NULL (set via @PrePersist)
- changedBy: Long NOT NULL (plain Long → users.id)
- changeSource: String NOT NULL
  (cie_import|analyst_entry|geospatial_update|engine_update|manual_override)
- changeNote: String

---

### LAYER 4 — 1:1 DEAL CHILD TABLES

Each entity follows this exact pattern:

```java
@Entity
@Table(name = "deal_XXXX", schema = "tax_benefits")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DealXxxx {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id", nullable = false, unique = true)
    @JsonIgnore
    private Deal deal;

    // ... all fields nullable (BigDecimal, Integer, Boolean, String)
}
```

Build all 10 child entities:

**DealProject** → `deal_project`
projectCost, landValue, predevelopmentCosts (BigDecimal 12,4),
projectLocation (String), projectLocationLat, projectLocationLng
(BigDecimal 10,7), units (Integer), propertyState (String),
holdPeriod (Integer)

**DealOperating** → `deal_operating`
yearOneNoi, noiGrowthRate, exitCapRate, stabilizedOccupancy
(BigDecimal 6,4), leaseUpMonths, constructionDelayMonths (Integer)

**DealEquity** → `deal_equity`
investorEquityPct, philEquityPct, investorEquityRatio,
investorPromoteShare, promoteHurdleRate (BigDecimal 6,4),
autoBalanceCapital (Boolean)

**DealSubDebt** → `deal_sub_debt`
hdcSubDebtPct, hdcSubDebtPikRate, hdcPikCurrentPayPct,
investorSubDebtPct, investorSubDebtPikRate, invPikCurrentPayPct,
outsideSubDebtPct, outsidePikRate, outsideCurrentPayPct,
hdcDebtFundPct, hdcDfPikRate, hdcDfCurrentPayPct (all BigDecimal 6,4),
outsideSubDebtAmort (Integer),
hdcPikCurrentPayEnabled, invPikCurrentPayEnabled,
outsideCurrentPayEnabled, hdcDfCurrentPayEnabled (Boolean),
subDebtPriorityOutside, subDebtPriorityHdc,
subDebtPriorityInvestor (Integer)

**DealLihtc** → `deal_lihtc`
lihtcEligibleBasis, applicableFraction, pabPctOfEligibleBasis,
pabRate, commercialSpaceCosts, syndicationCosts, marketingCosts,
financingFees, bondIssuanceCosts, operatingDeficitReserve,
replacementReserve, otherExclusions (BigDecimal),
pabTerm, pabAmortization, pabIoYears, pisMonth (Integer),
fedLihtcEnabled, qualifiedBasisBoost, pabEnabled,
electDeferCreditPeriod (Boolean)

**DealStateLihtc** → `deal_state_lihtc`
stateLihtcRate, stateLihtcSyndRate (BigDecimal 6,4),
stateLihtcSyndYear (Integer),
stateLihtcEnabled (Boolean), stateLihtcPath (String)

**DealOz** → `deal_oz`
ozVersion (String),   // '1.0' | '2.0' — matches entity + TS convention
ozEnabled (Boolean), ozType (String)

**DealDepreciation** → `deal_depreciation`
costSegPct, bonusDepreciationPct, loanFeesPct,
legalStructuringCosts, organizationCosts (BigDecimal),
includeDepreciationSchedule (Boolean)

**DealFees** → `deal_fees`
devFeePct, hdcDeferredInterestRate, aumFeePct,
aumCurrentPayPct (BigDecimal 6,4),
— NOTE: devFeePct replaces hdc_fee_rate per §3.11 resolution —
aumFeeEnabled, aumCurrentPayEnabled (Boolean),
hdcPlatformMode (String)

**DealMisc** → `deal_misc`
taxAdvanceDiscountRate, advanceFinancingRate,
prefEquityPct, prefEquityTargetMoic, prefEquityAccrualRate
(BigDecimal 6,4),
taxDeliveryMonths, interestReserveMonths (Integer),
hdcAdvanceFinancing, interestReserveEnabled,
prefEquityEnabled, prefEquityOzEligible (Boolean)

---

### LAYER 5 — v1.2 EXTENSION TABLES (1:many)

**DealDebtTranche** → `deal_debt_tranches`

```java
@Entity
@Table(name = "deal_debt_tranches", schema = "tax_benefits",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"deal_id", "tranche_number"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DealDebtTranche {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id", nullable = false)
    @JsonIgnore
    private Deal deal;

    @Column(nullable = false)
    private Integer trancheNumber;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private String trancheType;
    // senior_construction|senior_permanent|home_soft|htf_soft|
    // cdfi_mezz|city_soft|state_soft|ddf_note|
    // seller_carryback|philanthropic_sub|other

    private BigDecimal constructionAmount;
    private BigDecimal permanentAmount;
    private BigDecimal noteRate;
    private BigDecimal payRate;

    @Column(nullable = false)
    private String rateType;
    // fixed|floating|zero|pik_full|pik_partial

    @Column(columnDefinition = "jsonb")
    private String rateComponents;

    private Integer amortizationYears;
    private Integer termYears;
    private Integer ioYears;

    @Column(nullable = false)
    private Integer waterfallPriority;

    private String recourseType;
    private String lenderName;
    private String sizingMethod;

    @Column(nullable = false)
    private Boolean isBondFinanced = false;

    private String bondType;
    private String federalFundingSource;
    // home|htf|cdbg|city_only|state_only|none

    // FORGIVENESS FIELDS
    @Column(nullable = false)
    private Boolean forgivenessEnabled = false;

    private String forgivenessType;          // full|partial
    private BigDecimal forgivenessPct;
    private String forgivenessTriggerType;
    // date_based|compliance_period|performance|
    // regulatory_agreement|silent_expected|not_applicable

    private LocalDate forgivenessTriggerDate;
    private String forgivenessTriggerDescription;

    @Column(columnDefinition = "jsonb")
    private String forgivenessSchedule;

    // COD / TAX FLAGS
    private String codIncomeTreatment;
    // taxable|sec108_exclusion|not_modeled|counsel_required

    private String sec108ExclusionBasis;
    private String basisAdjustmentAtForgiveness;
    private Integer extendedUseAgreementYears;
    private String intercreditorNotes;
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() { createdAt = Instant.now(); }
}
```

**DealGrant** → `deal_grants`

Fields (all nullable except label, grantSourceType, amount):
- id: Long PK
- deal: @ManyToOne → Deal
- grantLabel: String NOT NULL
- grantSourceType: String NOT NULL
  (philanthropic|city|state|federal_cdbg|federal_home|
   federal_htf|cdfi|developer_contribution|other)
- grantorName: String
- amount: BigDecimal(14,4) NOT NULL
- includedInEligibleBasis: Boolean (null = unknown/counsel required)
- basisInclusionRationale: String
- repaymentRequired: Boolean NOT NULL DEFAULT false
- grantConditions: String
- notes: String
- createdAt: Instant (@PrePersist)

**DealEquityInstallment** → `deal_equity_installments`

Unique constraint: (deal_id, installment_number)
Fields:
- id: Long PK
- deal: @ManyToOne → Deal
- installmentNumber: Integer NOT NULL
- amount: BigDecimal(14,4) NOT NULL
- pctOfTotal: BigDecimal(6,4)
- triggerType: String NOT NULL
  (construction_start|construction_completion|
   certificate_of_occupancy|stabilization|
   credit_delivery_8609|breakeven|date_based|other)
- triggerDate: LocalDate
- triggerDescription: String
- notes: String

**DealUsesBreakdown** → `deal_uses_breakdown`

Unique constraint: (deal_id, line_number)
Fields:
- id: Long PK
- deal: @ManyToOne → Deal
- lineNumber: Integer NOT NULL
- label: String NOT NULL
- category: String NOT NULL
  (hard_cost|soft_cost|developer_fee|
   financing_cost|reserves|accrued_interest|other)
- amount: BigDecimal(14,4) NOT NULL
- eligibleBasisIncluded: Boolean (null = unknown)
- eligibleBasisRationale: String
- notes: String

**DealTaxEvent** → `deal_tax_events`

Fields:
- id: Long PK
- deal: @ManyToOne(nullable=false) → Deal
- sourceTranche: @ManyToOne(optional=true) → DealDebtTranche
- eventType: String NOT NULL
  (forgiveness_cod|oz_inclusion_event|
   basis_adjustment|recapture_event|other)
- projectedYear: Integer
- grossAmount: BigDecimal(14,4)
- excludedAmount: BigDecimal(14,4)
- netTaxableAmount: BigDecimal(14,4)
- sec108Applicable: Boolean NOT NULL DEFAULT false
- sec108ExclusionType: String
- modelingStatus: String NOT NULL DEFAULT 'not_modeled'
  (modeled|not_modeled|counsel_required|not_applicable)
- taxTreatmentNotes: String
- createdAt: Instant (@PrePersist)

---

### LAYER 6 — REPOSITORIES

**File location:** `repository/deals/`
**Base type:** `JpaRepository<Entity, Long>`

```java
// DealRepository
public interface DealRepository extends JpaRepository<Deal, Long> {
    Optional<Deal> findByDealName(String dealName);
    List<Deal> findByStatus(String status);
    List<Deal> findByDealLane(Integer lane);
}

// DealDebtTrancheRepository
public interface DealDebtTrancheRepository
    extends JpaRepository<DealDebtTranche, Long> {
    List<DealDebtTranche> findByDealIdOrderByTrancheNumberAsc(Long dealId);
    List<DealDebtTranche> findByDealIdAndForgivenessEnabledTrue(Long dealId);
}

// DealSnapshotRepository
public interface DealSnapshotRepository
    extends JpaRepository<DealSnapshot, Long> {
    List<DealSnapshot> findByDealIdOrderByVersionNumberDesc(Long dealId);
    Optional<DealSnapshot> findByDealIdAndStatus(Long dealId, String status);
}

// All others: JpaRepository<Entity, Long> defaults only
// DealChangeLogRepository
// DealGrantRepository
// DealEquityInstallmentRepository
// DealUsesBreakdownRepository
// DealTaxEventRepository
```

---

### LAYER 7 — QUEENSWOOD SEED SERVICE + RUNNER

Two classes. Service holds the logic. Runner calls it.
`@Profile("!test")` on the runner only — not the service.

**File:** `service/QueenswoodSeedService.java`

```java
@Service
@RequiredArgsConstructor
public class QueenswoodSeedService {

    private final DealRepository dealRepository;

    @Transactional   // default propagation (REQUIRED) — do not override
    public void seedQueenswood() {
        if (dealRepository.countByDealName("Queenswood Phase II") > 0) {
            return; // idempotent — already seeded
        }

        // Build root — never set relationship fields in builder
        Deal deal = Deal.builder()
            .dealName("Queenswood Phase II")
            .dealLane(4)
            .status("draft")
            .sourceType("cie_import")
            .build();

        // Build and link DealProject via setter (auto-links back-ref)
        DealProject project = DealProject.builder()
            .units(270)
            .propertyState("NY")
            .holdPeriod(15)
            .build();
        deal.setProject(project);   // setter links project.deal = deal

        // Build and add debt tranches via addX helper (auto-links back-ref)
        deal.addDebtTranche(DealDebtTranche.builder()
            .trancheNumber(1)
            .label("HDC 1st Mortgage Perm")
            .trancheType("senior_permanent")
            .permanentAmount(new BigDecimal("41235000.00"))
            .noteRate(new BigDecimal("0.064000"))
            .payRate(new BigDecimal("0.064000"))
            .rateType("fixed")
            .waterfallPriority(1)
            // forgivenessEnabled defaults to false via @Builder.Default
            .forgivenessTriggerType("not_applicable")
            .build());

        deal.addDebtTranche(DealDebtTranche.builder()
            .trancheNumber(2)
            .label("HDC 2nd Mortgage")
            .trancheType("city_soft")
            .permanentAmount(new BigDecimal("20000000.00"))
            .noteRate(new BigDecimal("0.047200"))
            .payRate(new BigDecimal("0.012500"))
            .rateType("pik_partial")
            .waterfallPriority(2)
            .forgivenessEnabled(true)
            .forgivenessTriggerType("silent_expected")
            .build());

        deal.addDebtTranche(DealDebtTranche.builder()
            .trancheNumber(3)
            .label("HPD 3rd Mortgage")
            .trancheType("city_soft")
            .permanentAmount(new BigDecimal("91586775.00"))
            .noteRate(new BigDecimal("0.047200"))
            .payRate(new BigDecimal("0.002500"))
            .rateType("pik_partial")
            .waterfallPriority(3)
            .forgivenessEnabled(true)
            .forgivenessTriggerType("silent_expected")
            .notes("Federal funding source (HOME/HTF/city-only) unconfirmed. "
                 + "Affects §42(d)(5)(A) eligible basis treatment. "
                 + "Confirm with Megan Riess before publishing.")
            .build());

        deal.addDebtTranche(DealDebtTranche.builder()
            .trancheNumber(4)
            .label("Deferred Dev Fee")
            .trancheType("ddf_note")
            .permanentAmount(new BigDecimal("10362290.00"))
            .noteRate(BigDecimal.ZERO)
            .payRate(BigDecimal.ZERO)
            .rateType("zero")
            .waterfallPriority(4)
            .forgivenessTriggerType("not_applicable")
            .build());

        // Equity installments
        deal.addEquityInstallment(DealEquityInstallment.builder()
            .installmentNumber(1)
            .amount(new BigDecimal("17761428.00"))
            .pctOfTotal(new BigDecimal("0.15"))
            .triggerType("construction_start")
            .build());

        deal.addEquityInstallment(DealEquityInstallment.builder()
            .installmentNumber(2)
            .amount(new BigDecimal("100648095.00"))
            .pctOfTotal(new BigDecimal("0.85"))
            .triggerType("stabilization")
            .build());

        // Grant
        deal.addGrant(DealGrant.builder()
            .grantLabel("Mets Contribution")
            .grantSourceType("philanthropic")
            .grantorName("New York Mets (entity TBD)")
            .amount(new BigDecimal("5000000.00"))
            // includedInEligibleBasis intentionally null — counsel required
            .notes("Mets entity tax status unconfirmed. If 501(c)(3), "
                 + "§42(d)(5) may require basis exclusion. "
                 + "Confirm with counsel.")
            .build());

        // Save everything in one call — cascade=ALL handles children
        dealRepository.save(deal);

        // Tax events — must be added after deal is persisted so
        // sourceTranche FK can be resolved
        Deal saved = dealRepository.findByDealName("Queenswood Phase II")
            .orElseThrow();
        DealDebtTranche tranche2 = saved.getDebtTranches().get(1);
        DealDebtTranche tranche3 = saved.getDebtTranches().get(2);

        String codNotes = "§108 insolvency exclusion likely applies. "
            + "Liabilities exceed FMV at projected forgiveness date. "
            + "Counsel confirmation required.";

        saved.addTaxEvent(DealTaxEvent.builder()
            .eventType("forgiveness_cod")
            .sourceTranche(tranche2)
            .sec108Applicable(true)
            // modelingStatus defaults to "not_modeled" via @Builder.Default
            .taxTreatmentNotes(codNotes)
            .build());

        saved.addTaxEvent(DealTaxEvent.builder()
            .eventType("forgiveness_cod")
            .sourceTranche(tranche3)
            .sec108Applicable(true)
            .taxTreatmentNotes(codNotes)
            .build());

        dealRepository.save(saved);
    }
}
```

**File:** `config/QueenswoodSeedRunner.java`

```java
@Component
@Profile("!test")   // excluded from test context — prevents RDS pollution
@RequiredArgsConstructor
public class QueenswoodSeedRunner implements CommandLineRunner {

    private final QueenswoodSeedService seedService;

    @Override
    public void run(String... args) {
        seedService.seedQueenswood();
    }
}
```

---

## COORDINATION NOTES

- IMPL-168 (§42(f)(1) fix) is frontend-only, no conflict.
  Can run in parallel.

- IMPL-185 (forgiveness toggle in calculations.ts) depends on
  deal_debt_tranches existing. This IMPL unblocks it.
  After this IMPL closes, IMPL-185 can run immediately.

- Zero changes to any existing entity, repository, or
  controller. New package is fully additive.

- The new deals schema coexists with DealConduit. Migration
  path from DealConduit → canonical deals is Track 8 (future).

- Track 8 OZ mapping is a 2-source JOIN, not 1:1 from deal_oz:
  deal_oz (ozEnabled, ozVersion, ozType)
  + canonical investor-profile (qofRolledInGain, capitalGainsTaxRate)
  → InputOpportunityZone (5 fields for engine)
  The canonical investor-profile table does not yet exist (v1.3
  spec gap). qofRolledInGain has no canonical home until specced.

- BACKEND_ENTITY_REGISTRY.md must be updated as DoD item.
  Version bumps to v2.0. Add all 18 new entities.

---

## INDEPENDENT MATH VERIFICATION

Report before writing the seed runner.

**Queenswood non-forgivable debt:**
HDC 1st Mortgage:   $41,235,000.00
Deferred Dev Fee:   $10,362,290.00
Total:              $51,597,290.00

**Queenswood forgivable debt:**
HDC 2nd Mortgage:   $20,000,000.00
HPD 3rd Mortgage:   $91,586,775.00
Total:             $111,586,775.00

**Total debt at origination:**
$51,597,290 + $111,586,775 = $163,184,065.00

**Equity installments sum:**
$17,761,428 + $100,648,095 = $118,409,523.00

Verify all four totals independently before coding.

---

## TESTS REQUIRED

**Test conventions — apply to every test class in this IMPL:**

```java
@SpringBootTest
@ActiveProfiles({"local", "test"})  // "test" profile excludes seed runner
@Transactional                      // rolls back all inserts after each test
class YourTestClass { ... }
```

Why `@ActiveProfiles({"local","test"})`:
- `local` — loads datasource config from application-local.properties
- `test` — activates `@Profile("!test")` exclusion on QueenswoodSeedRunner
- Without this, the seed runner fires during every @SpringBootTest boot
  and inserts Queenswood into RDS permanently

Also add `@ActiveProfiles({"local","test"})` to the existing
`HdcMapBackendApplicationTests` class (one-line edit —
only allowed exception to DoD #12's no-modifications rule).

Add `long countByDealName(String dealName)` to DealRepository.

---

1. **Deal + child entity persistence:**
   - Create Deal, attach DealProject via `deal.setProject(project)`
   - Assert `deal.getId()` is non-null Long after save
   - Assert `deal.getProject()` loads and project.getDeal() == deal
   - Assert all 10 @OneToOne children can round-trip

2. **DealDebtTranche ordering and filtering:**
   - Build 4 tranches using `deal.addDebtTranche(...)` helper
   - Save deal, assert findByDealIdOrderByTrancheNumberAsc → 4 rows
   - Assert findByDealIdAndForgivenessEnabledTrue → 2 rows

3. **DealTaxEvent → DealDebtTranche FK:**
   - Create tax event linked to a specific tranche
   - Assert sourceTranche loads via @ManyToOne

4. **Queenswood seed idempotency:**

```java
@Test
void seedQueenswoodIsIdempotent() {
    seedService.seedQueenswood();
    long n1 = dealRepository.countByDealName("Queenswood Phase II");
    seedService.seedQueenswood();   // second call — should be no-op
    long n2 = dealRepository.countByDealName("Queenswood Phase II");
    assertEquals(1, n1);
    assertEquals(1, n2);
}
```

Note: inject `QueenswoodSeedService` directly — do not call
the runner. Class-level `@Transactional` rolls back after test.

5. **Queenswood seed correctness:**
   - Assert 4 debt tranches exist for Queenswood deal
   - Assert tranches 2 and 3 have forgivenessEnabled=true
   - Assert equity installments sum = 118,409,523.00
   - Assert 1 grant with amount = 5,000,000.00
   - Assert 2 tax events with modelingStatus = "not_modeled"

6. **No regression:**
   - HdcMapBackendApplicationTests passes with
     @ActiveProfiles({"local","test"}) added
   - No existing test behavior changed

---

## DEFINITION OF DONE

**PREREQUISITE — run before any code:**
Section 2 DB audit: `brew install libpq && brew link --force libpq`
then run the 5 queries from IMPL_186_Section2_DB_Audit_CC_Prompt_v1_0.md.
Confirm READY (13 tables, 0 canonical tables, bigint PKs confirmed).

**Build order — strictly observed:**
Write all 18 entity files → all 7 repositories → QueenswoodSeedService →
QueenswoodSeedRunner. First `./mvnw compile -q` runs after all entities
and repositories are written. Layers are reading order, not compile
checkpoints.

1. All 18 new @Entity classes created in `entity/deals/`:
   Deal, EngineVersion, DealSnapshot, DealChangeLog,
   DealProject, DealOperating, DealEquity, DealSubDebt,
   DealLihtc, DealStateLihtc, DealOz, DealDepreciation,
   DealFees, DealMisc, DealDebtTranche, DealGrant,
   DealEquityInstallment, DealUsesBreakdown, DealTaxEvent.

2. All 7 repositories created in `repository/deals/`.
   DealRepository includes `countByDealName(String)`.

3. `QueenswoodSeedService` created in `service/`.
   `QueenswoodSeedRunner` created in `config/` with `@Profile("!test")`.

4. `HdcMapBackendApplicationTests` updated with
   `@ActiveProfiles({"local","test"})` — only allowed
   modification to an existing file in this IMPL.

5. Math verification reported before seed service written.

6. Backend compiles clean: `./mvnw compile -q` → EXIT=0.

7. Server restarts without error. No ERROR or Exception lines
   in startup log.

8. All 18 new tables confirmed in DB via SSH to EC2:

   ```bash
   ssh -i ~/projects/pem_keys/hdc-calc.pem ubuntu@18.223.182.167 \
     "PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -U \$DB_USER \
     -d hdc_main_db -c \"
     SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'tax_benefits'
     ORDER BY table_name;
   \""
   ```

   Expected: 13 existing + 18 new = 31 rows. Report verbatim.

9. Queenswood seed verified in DB:

   ```sql
   SELECT id, deal_name, status, deal_lane
   FROM tax_benefits.deals
   WHERE deal_name = 'Queenswood Phase II';

   SELECT tranche_number, label, permanent_amount,
          forgiveness_enabled, forgiveness_trigger_type
   FROM tax_benefits.deal_debt_tranches
   WHERE deal_id = [id from above]
   ORDER BY tranche_number;
   ```

   Report actual rows. Confirm forgiveness_enabled = true
   on rows 2 and 3.

10. All 6 test categories pass at 100%.

11. git status — only new files plus the one-line edit to
    HdcMapBackendApplicationTests. Report output.

12. git diff --stat confirmed before commit.

13. BACKEND_ENTITY_REGISTRY.md updated, version → v2.0.

14. Commit message:
    "feat: IMPL-186 — Full canonical schema build.
    v1.0 core (11 tables) + v1.2 extensions (5 tables)
    + EngineVersion + DealSnapshot + DealChangeLog.
    18 entities (Long/IDENTITY PKs), 7 repositories,
    QueenswoodSeedService + QueenswoodSeedRunner (@Profile !test).
    Queenswood Phase II seeded: 4 debt tranches
    ($163.2M total, $111.6M forgivable), 2 equity installments,
    1 grant, 2 tax events. Unblocks IMPL-185."

15. SPEC_IMPLEMENTATION_REGISTRY updated with IMPL-186.

16. Bead closed after commit hash and DB output confirmed.
