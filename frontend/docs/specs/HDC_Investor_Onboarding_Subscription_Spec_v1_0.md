# HDC Investor Onboarding and Subscription Specification
## Track 4 — From First Engagement to Signed Subscription

**Version:** 1.0
**Date:** April 2026
**Status:** Specification — Design Complete, Not Yet Built
**Author:** Brad Padden / HDC

**Depends On:**
- HDC Canonical Deal Schema Spec v1.0 (§3.15 — Category D investor fields)
- HDC Deal Snapshot and Versioning Spec v1.0 (snapshot_id linkage)
- HDC Platform Product Roadmap v2.0 (Tracks 4–5)
- Multi-Profile Portfolio Manager Spec v2.1 (multiple profiles per investor)

**Consumed By:**
- Angel (PostgreSQL schema implementation — investors, subscriptions, documents, communications tables)
- Track 5 — Investor Portal (investor-facing views)
- Track 6 — Fund Administration (capital calls, distributions, K-1s)
- Track 7 — Compliance and Reporting (KYC/AML, beneficial ownership)

**Design Basis:** April 11–12, 2026 architecture session. Decisions recorded in Section 10 (Key Decisions — Do Not Revisit).

---

## 1. Purpose

This spec defines the data model, workflows, and integrations for bringing an investor from first formal engagement through signed subscription agreement, and for tracking all subsequent model updates, capital calls, documents, and communications in the platform.

The investor record is the hub. Every deal subscription, document, capital call, communication, and tax profile links back to a single investor record. The platform becomes the complete, auditable record of the investor relationship.

---

## 2. Investor Record Lifecycle

```
First formal engagement
  → investors row created (HDC team action)
  → Tax profile created (investor_tax_profiles, links to investors)

Accreditation verification
  → Documents collected and stored
  → accreditation_status = 'verified', expiration tracked

Pre-legal interest tracking
  → investor_commitments row created: status = 'soft_circle' or 'hard_circle'
  → No snapshot link — pre-legal

Subscription agreement execution (LEGAL TRIGGER)
  → investor_deal_subscriptions row created
  → snapshot_id = current active snapshot id (IMMUTABLE)
  → DocuSign envelope executed, PDF stored in documents table
  → signed_at populated from DocuSign completion webhook

Post-signing
  → Capital call and funding tracked in investor_deal_subscriptions and investor_capital_calls
  → Model updates → investor_snapshot_history rows (additive, never overwritten)
  → Documents → documents table
  → Communications → investor_communications table
```

---

## 3. Investor Record Table

### 3.1 Core investors Table

```sql
CREATE TABLE investors (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Legal identity
  legal_name                  TEXT NOT NULL,
  entity_type                 TEXT NOT NULL
                                CHECK (entity_type IN (
                                  'Individual', 'LLC', 'Trust',
                                  'Partnership', 'Corporation', 'Other'
                                )),

  -- Primary contact
  primary_contact_name        TEXT NOT NULL,
  primary_contact_email       TEXT NOT NULL UNIQUE,
  primary_contact_phone       TEXT,
  mailing_address             TEXT,

  -- Tax identity (encrypted at rest)
  tax_id                      TEXT,   -- EIN or SSN; encrypted

  -- Accreditation
  accreditation_status        TEXT NOT NULL DEFAULT 'not_verified'
                                CHECK (accreditation_status IN (
                                  'verified', 'expired', 'pending', 'not_verified'
                                )),
  accreditation_verified_at   TIMESTAMPTZ,
  accreditation_expires_at    TIMESTAMPTZ,   -- Typically 90 days from verification
  accreditation_doc_id        UUID REFERENCES documents(id),

  -- KYC / AML
  kyc_status                  TEXT NOT NULL DEFAULT 'pending'
                                CHECK (kyc_status IN ('cleared', 'pending', 'flagged')),
  kyc_completed_at            TIMESTAMPTZ,
  aml_status                  TEXT NOT NULL DEFAULT 'pending'
                                CHECK (aml_status IN ('cleared', 'pending', 'flagged')),
  aml_completed_at            TIMESTAMPTZ,

  -- Relationship
  wealth_manager_id           UUID REFERENCES wealth_managers(id),
  referral_source             TEXT,
  notes                       TEXT,

  -- Audit
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                  UUID NOT NULL REFERENCES users(id),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by                  UUID REFERENCES users(id),
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_investors_email ON investors (primary_contact_email);
CREATE INDEX idx_investors_wealth_manager ON investors (wealth_manager_id);
CREATE INDEX idx_investors_accreditation_expires ON investors (accreditation_expires_at)
  WHERE accreditation_status = 'verified';
```

### 3.2 Investor Tax Profiles

Investor tax profiles are the Category D fields from Canonical Deal Schema Spec §3.15. Multiple profiles per investor are supported (per Multi-Profile Portfolio Manager Spec v2.1).

```sql
CREATE TABLE investor_tax_profiles (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id              UUID NOT NULL REFERENCES investors(id),

  -- Profile identity
  profile_name             TEXT NOT NULL,    -- "Primary", "Conservative", "High Income Year"
  is_default               BOOLEAN NOT NULL DEFAULT FALSE,

  -- Category D fields (see Canonical Schema Spec §3.15 for full definitions)
  federal_tax_rate         DECIMAL(5,4),     -- e.g., 0.37
  niit_rate                DECIMAL(5,4),     -- 0 or 0.038
  state_tax_rate           DECIMAL(5,4),
  lt_capital_gains_rate    DECIMAL(5,4),
  state_capital_gains_rate DECIMAL(5,4),
  investor_state           CHAR(2),
  state_conforms           BOOLEAN,
  investor_track           TEXT CHECK (investor_track IN ('rep', 'non-rep')),
  is_rep                   BOOLEAN,
  grouping_election        BOOLEAN,
  passive_gain_type        TEXT CHECK (passive_gain_type IN ('short-term', 'long-term')),
  investor_type            TEXT,
  w2_income                DECIMAL(15,2),
  business_income          DECIMAL(15,2),
  ira_balance              DECIMAL(15,2),
  passive_income           DECIMAL(15,2),
  asset_sale_gain          DECIMAL(15,2),
  annual_income            DECIMAL(15,2),
  filing_status            TEXT CHECK (filing_status IN ('single', 'married-filing-jointly')),
  deferred_gain            DECIMAL(15,2),
  capital_gains_tax_rate   DECIMAL(5,4),
  oz_capital_gains_tax_rate DECIMAL(5,4),

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one default profile per investor
CREATE UNIQUE INDEX uq_investor_default_profile
  ON investor_tax_profiles (investor_id)
  WHERE is_default = TRUE;
```

---

## 4. Accreditation Verification

### 4.1 Verification Window

The standard accreditation verification window is 90 days from the date of verification. The platform:
- Sets `accreditation_expires_at = accreditation_verified_at + 90 days`
- Runs a nightly check: any investor with `accreditation_status = 'verified'` AND `accreditation_expires_at < NOW() + 14 days` is flagged in the HDC team dashboard as "expiring soon"
- If `accreditation_expires_at < NOW()`: `accreditation_status` → `'expired'`, HDC team alerted

### 4.2 Verification Dependency

Before an investor can execute a subscription agreement, the platform requires:
1. `accreditation_status = 'verified'`
2. `accreditation_expires_at > NOW()` (still within valid window)
3. `accreditation_doc_id` is set (document is on file)

If any condition fails, the subscription agreement workflow is blocked with a clear error message to the HDC team.

### 4.3 Accreditation Document Linkage

The accreditation document is stored in the `documents` table and linked to:
- `investors.accreditation_doc_id` (current active accreditation)
- `investor_deal_subscriptions.accreditation_doc_id` (the accreditation in effect at signing — never changes even if investor re-verifies later)

---

## 5. Pre-Legal Interest Tracking

Before subscription agreement execution, investor interest is tracked without any snapshot linkage.

```sql
CREATE TABLE investor_commitments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id            UUID NOT NULL REFERENCES investors(id),
  deal_id                UUID NOT NULL REFERENCES deals(id),

  status                 TEXT NOT NULL
                           CHECK (status IN ('soft_circle', 'hard_circle', 'converted', 'withdrawn')),
  amount                 DECIMAL(15,2),   -- Indicated interest amount

  -- Lifecycle
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by             UUID NOT NULL REFERENCES users(id),
  converted_at           TIMESTAMPTZ,     -- Set when status = 'converted'
  subscription_id        UUID REFERENCES investor_deal_subscriptions(id),  -- Set on conversion
  withdrawn_at           TIMESTAMPTZ,
  withdrawal_reason      TEXT,

  notes                  TEXT
);
```

| Status | Description | Snapshot Link |
|---|---|---|
| `soft_circle` | Verbal or written indication of interest | None — pre-legal |
| `hard_circle` | Firm commitment pending documentation | None — pre-legal |
| `converted` | Converted to subscription agreement | Via `subscription_id` → `investor_deal_subscriptions` |
| `withdrawn` | Withdrew before signing | None |

Soft and hard circles feed HDC's fundraising dashboard (Track 6) but carry no legal obligation and have no connection to deal snapshots.

---

## 6. Subscription Agreement Execution

### 6.1 The Legal Trigger

The subscription agreement execution is the single event that:
1. Creates an `investor_deal_subscriptions` record
2. Links the investor to the **current active snapshot** (`snapshot_id` — immutable forever after creation)
3. Links to the executed subscription agreement document
4. Links to the investor's current accreditation document
5. Records `signed_at`, `signed_by`, `amount`

No other event creates a subscription record. Soft circles and hard circles are not subscriptions.

### 6.2 investor_deal_subscriptions Table

```sql
CREATE TABLE investor_deal_subscriptions (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id                UUID NOT NULL REFERENCES investors(id),
  deal_id                    UUID NOT NULL REFERENCES deals(id),
  tax_profile_id             UUID NOT NULL REFERENCES investor_tax_profiles(id),

  -- Snapshot linkage (immutable after creation)
  snapshot_id                UUID NOT NULL REFERENCES deal_snapshots(id),
  -- The snapshot_id records the exact version of the deal model the investor agreed to.
  -- This field MUST NOT be updated under any circumstances after the row is created,
  -- even if the deal model is subsequently republished.

  -- Subscription terms
  amount                     DECIMAL(15,2) NOT NULL,  -- Committed capital (set at signing, immutable)
  subscription_date          DATE NOT NULL,

  -- Document linkage
  subscription_doc_id        UUID NOT NULL REFERENCES documents(id),   -- Executed subscription agreement
  accreditation_doc_id       UUID NOT NULL REFERENCES documents(id),   -- Accreditation at time of signing
  docusign_envelope_id       TEXT,                                      -- DocuSign envelope reference

  -- Execution metadata (write-once)
  signed_at                  TIMESTAMPTZ NOT NULL,    -- Populated from DocuSign completion webhook
  signed_by                  TEXT NOT NULL,           -- DocuSign signer name/email
  executed_by_hdc            UUID REFERENCES users(id),   -- HDC team member who initiated envelope

  -- Capital call tracking (mutable post-signing)
  capital_called             DECIMAL(15,2) NOT NULL DEFAULT 0,
  capital_funded             DECIMAL(15,2) NOT NULL DEFAULT 0,
  funding_deadline           DATE,

  -- Status
  status                     TEXT NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'withdrawn', 'transferred', 'closed')),

  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_investor ON investor_deal_subscriptions (investor_id);
CREATE INDEX idx_subscriptions_deal ON investor_deal_subscriptions (deal_id);
CREATE INDEX idx_subscriptions_snapshot ON investor_deal_subscriptions (snapshot_id);
```

**Immutability enforcement:** A PostgreSQL trigger prevents any UPDATE to the `snapshot_id`, `amount`, `signed_at`, `subscription_doc_id`, or `accreditation_doc_id` columns after the row is created.

### 6.3 DocuSign Integration Workflow

1. HDC team member initiates subscription agreement from platform
2. Platform generates envelope with investor's information pre-filled
3. Platform sends envelope via DocuSign API; stores `docusign_envelope_id`
4. Investor receives email from DocuSign and signs
5. DocuSign sends webhook to platform on execution completion
6. Platform webhook handler:
   a. Retrieves executed PDF from DocuSign API
   b. Stores PDF in platform document management
   c. Creates `documents` row; sets `executed_at` from DocuSign timestamp
   d. Creates `investor_deal_subscriptions` row: `signed_at` from DocuSign webhook, `snapshot_id` = current `deals.active_snapshot_id`, `subscription_doc_id` = new document id
   e. Updates `investor_commitments.status` = 'converted', `subscription_id` = new subscription id
7. HDC team receives notification: "Subscription executed — [investor name] — [deal name] — $[amount]"

**Critical:** The `snapshot_id` stored on the subscription row is the `deals.active_snapshot_id` at the moment the DocuSign webhook fires (i.e., at the moment the investor signs). If the deal is republished between when the investor receives the DocuSign link and when they sign, the new snapshot becomes the one recorded on the subscription. This is intentional and correct — the investor signed under the terms in effect at the moment of signing.

---

## 7. Model Update Notification Workflow

When a deal model is republished (new snapshot goes active), all investors with `investor_deal_subscriptions.snapshot_id = prior_active_snapshot_id` are notified and their acknowledgment is tracked.

**This is triggered automatically by the atomic publish transaction in Deal Snapshot and Versioning Spec v1.0 §6, Step 8.**

### 7.1 Notification Steps

1. Publish transaction inserts `investor_snapshot_history` rows: `status = 'pending_acknowledgment'`, `notified_at = NOW()`
2. Notification emails queued (not sent inside the transaction — queued for async delivery)
3. Email template (model update):
   - Subject: "Update to your [Deal Name] investment terms"
   - Prior terms summary (key metrics from prior snapshot)
   - New terms summary (key metrics from new snapshot)
   - Change summary (delta from `deal_snapshots.change_summary`)
   - Effective date
   - Link to portal acknowledgment page
4. Investor visits portal, reviews side-by-side comparison
5. Investor clicks "I acknowledge the updated terms"
6. Platform updates `investor_snapshot_history` row: `status = 'acknowledged'`, `acknowledged_at = NOW()`, `acknowledged_by = [investor portal login]`
7. Confirmation email sent to investor and HDC team

### 7.2 Overdue Tracking

Platform runs a nightly job:
- `SELECT * FROM investor_snapshot_history WHERE status = 'pending_acknowledgment' AND notified_at < NOW() - INTERVAL '30 days'`
- For each row found: set `status = 'overdue'`, set `overdue_flagged_at = NOW()`
- HDC team dashboard shows count of overdue acknowledgments per deal
- HDC team initiates manual outreach

The 30-day window is configurable per deal in the `deals` table (`acknowledgment_window_days`, default 30).

---

## 8. Capital Call and Funding Tracking

### 8.1 Capital Calls Table

```sql
CREATE TABLE capital_calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id           UUID NOT NULL REFERENCES deals(id),

  call_number       INTEGER NOT NULL,    -- Sequential for this deal; starts at 1
  call_date         DATE NOT NULL,       -- Date call was issued
  call_amount       DECIMAL(15,2) NOT NULL,  -- Total amount called across all investors
  due_date          DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'issued'
                      CHECK (status IN ('issued', 'partially_funded', 'fully_funded')),

  notice_doc_id     UUID REFERENCES documents(id),  -- Capital call notice document
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID NOT NULL REFERENCES users(id),

  UNIQUE (deal_id, call_number)
);
```

### 8.2 Per-Investor Capital Call Tracking

```sql
CREATE TABLE investor_capital_calls (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capital_call_id     UUID NOT NULL REFERENCES capital_calls(id),
  investor_id         UUID NOT NULL REFERENCES investors(id),
  subscription_id     UUID NOT NULL REFERENCES investor_deal_subscriptions(id),

  amount_called       DECIMAL(15,2) NOT NULL,   -- This investor's share of the call
  amount_funded       DECIMAL(15,2) NOT NULL DEFAULT 0,
  funded_at           TIMESTAMPTZ,              -- Wire receipt timestamp
  wire_reference      TEXT,                     -- Bank wire reference for reconciliation
  status              TEXT NOT NULL DEFAULT 'called'
                        CHECK (status IN ('called', 'funded', 'late', 'excused')),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Rollup to subscription record:** After each `investor_capital_calls` insert or update, a trigger recalculates and updates `investor_deal_subscriptions.capital_called` and `investor_deal_subscriptions.capital_funded` to reflect cumulative totals.

---

## 9. Document Management

All documents stored natively in platform, linked to the records they relate to.

```sql
CREATE TABLE documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Record linkage (all nullable — a document may link to multiple record types)
  deal_id               UUID REFERENCES deals(id),
  investor_id           UUID REFERENCES investors(id),
  subscription_id       UUID REFERENCES investor_deal_subscriptions(id),
  snapshot_id           UUID REFERENCES deal_snapshots(id),  -- Links doc to the snapshot it describes
  capital_call_id       UUID REFERENCES capital_calls(id),

  -- Document identity
  document_type         TEXT NOT NULL
                          CHECK (document_type IN (
                            'subscription_agreement',
                            'accreditation',
                            'k1',
                            'capital_call',
                            'distribution_notice',
                            'quarterly_update',
                            'investor_notice',
                            'side_letter',
                            'amendment',
                            'offering_summary',
                            'other'
                          )),
  document_version      TEXT,               -- For versioned documents (e.g., offering_summary v3)
  display_name          TEXT NOT NULL,      -- Human-readable filename for portal display

  -- Storage
  storage_url           TEXT NOT NULL,      -- Internal cloud storage reference (not exposed to client)
  file_size_bytes       INTEGER,
  mime_type             TEXT,

  -- DocuSign (for executed documents)
  docusign_envelope_id  TEXT,
  executed_at           TIMESTAMPTZ,        -- Timestamp of execution (for signed docs)

  -- Access control
  is_investor_visible   BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = accessible in investor portal

  -- Audit
  uploaded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by           UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_documents_deal ON documents (deal_id);
CREATE INDEX idx_documents_investor ON documents (investor_id);
CREATE INDEX idx_documents_subscription ON documents (subscription_id);
CREATE INDEX idx_documents_snapshot ON documents (snapshot_id);
CREATE INDEX idx_documents_investor_visible ON documents (investor_id, is_investor_visible)
  WHERE is_investor_visible = TRUE;
```

**Document versioning for offering summaries:** When Snapshot 2 is published, a new offering summary is generated with `snapshot_id = Snapshot 2`. Snapshot 1's offering summary retains `snapshot_id = Snapshot 1` and remains accessible in the investor portal's version history tab.

---

## 10. Communication Log

Every investor communication recorded, whether sent via email, portal notification, or both.

```sql
CREATE TABLE investor_communications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id           UUID NOT NULL REFERENCES investors(id),
  deal_id               UUID REFERENCES deals(id),
  snapshot_id           UUID REFERENCES deal_snapshots(id),   -- Which snapshot this communication relates to

  communication_type    TEXT NOT NULL
                          CHECK (communication_type IN (
                            'snapshot_update',
                            'capital_call',
                            'distribution',
                            'quarterly_update',
                            'k1_available',
                            'accreditation_expiring',
                            'acknowledgment_overdue',
                            'ad_hoc'
                          )),

  subject               TEXT NOT NULL,
  body_preview          TEXT,             -- First 500 chars for log display
  document_id           UUID REFERENCES documents(id),  -- Attached document if any

  -- Delivery
  sent_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_by               UUID NOT NULL REFERENCES users(id),
  method                TEXT NOT NULL
                          CHECK (method IN ('email', 'portal', 'both')),

  -- Acknowledgment tracking (for communications requiring it)
  requires_acknowledgment BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at       TIMESTAMPTZ,
  acknowledged_by       TEXT
);

CREATE INDEX idx_communications_investor ON investor_communications (investor_id);
CREATE INDEX idx_communications_deal ON investor_communications (deal_id);
```

---

## 11. wealth_managers Reference Table

```sql
CREATE TABLE wealth_managers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_name      TEXT NOT NULL,          -- "Fortis Wealth Management", "Caprock Group"
  contact_name   TEXT,
  contact_email  TEXT,
  contact_phone  TEXT,
  notes          TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Investor records link to this table via `investors.wealth_manager_id`. This allows HDC to track which investors came through which advisory relationships and to aggregate commitments by wealth manager for fundraising reporting.

---

## 12. Key Decisions — Do Not Revisit

These decisions were settled in the April 11–12, 2026 architecture session.

| Decision | Rationale |
|---|---|
| Investor record created at first formal engagement | Creates audit trail from day one. Soft circles are not the trigger — formal engagement (email introduction, NDA, meeting with intent to explore investment) is. |
| Subscription agreement execution is the legal trigger | Soft circles and hard circles carry no legal obligation. The subscription agreement is the contract. Only the contract creates an `investor_deal_subscriptions` row. |
| snapshot_id is immutable after subscription creation | The investor's legal terms are permanently tied to the snapshot in effect when they signed. Any subsequent republication creates a new snapshot but does not change the investor's original terms. |
| investor_snapshot_history is additive | Every model update creates a new row. The history of which version each investor was linked to and when they acknowledged is a permanent, growing record. |
| Category D fields live on investor record, not on deal | A single deal can be evaluated against multiple investor profiles simultaneously. The investor's tax profile at time of subscription is captured via tax_profile_id on the subscription record. |
| DocuSign signed_at comes from webhook, not from platform | The legally authoritative timestamp is the timestamp in the executed DocuSign envelope, not when the HDC platform processed the webhook. |
| Accreditation doc linked to both investor record and subscription | The accreditation on file at time of signing is the relevant legal document. It is captured on the subscription record and never changes even if the investor re-verifies later. |

---

## 13. Open Items

| Item | Owner | Priority |
|---|---|---|
| Angel to review full schema against existing table conventions before any tables created | Angel | High |
| Confirm DocuSign API integration approach: direct API vs. middleware | Brad / Angel | High |
| Confirm cloud storage provider for document management (S3, Azure Blob, GCS) | Brad | High |
| Notification email template design (model update vs. engine-only update) | Brad / Chat | Medium |
| Acknowledgment overdue window: confirm 30-day default | Brad | Medium |
| Investor portal authentication: confirm 2FA approach (SMS, authenticator app, email code) | Brad / Angel | Medium |
| KYC/AML: confirm third-party provider integration (Persona, Jumio, Alloy) | Brad / Sidley | Medium |
| Beneficial ownership tracking table: required for BSA compliance | Brad / Sidley | Medium |
| K-1 linkage to investor_snapshot_history: formal spec needed | Angel | Low |

---

## 14. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | April 2026 | Initial specification. Design basis: April 11–12, 2026 architecture session. Investor record, accreditation verification, pre-legal commitment tracking, subscription agreement execution, DocuSign integration, model update notification workflow, capital call and funding tracking, document management, communication log, wealth managers reference. |

---

*End of HDC Investor Onboarding and Subscription Specification v1.0*
