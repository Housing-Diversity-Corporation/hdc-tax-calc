# HDC Deal Snapshot and Versioning Specification
## Immutable Audit Architecture for Published Deal Models

**Version:** 1.0
**Date:** April 2026
**Status:** Specification — Design Complete, Not Yet Built
**Author:** Brad Padden / HDC

**Depends On:**
- HDC Canonical Deal Schema Spec v1.0 (§8 — full PostgreSQL schema)
- HDC Platform Product Roadmap v2.0 (Track 3)

**Consumed By:**
- Angel (PostgreSQL schema implementation)
- Track 4 — Investor Onboarding and Subscription (snapshot_id linkage)
- Track 5 — Investor Portal (snapshot history display)
- Track 7 — Compliance and Reporting (audit export)

**Design Basis:** April 11–12, 2026 architecture session. Decisions recorded in this spec are final. See Section 9 (Key Decisions — Do Not Revisit).

---

## 1. Purpose

Every deal published on the HDC platform must produce an immutable, timestamped record of exactly what was shown to investors — the inputs used and the outputs produced — at the moment of publication. When an investor asks what they agreed to, when Novogradac audits the fund, when Sidley reconstructs the basis for a tax position, the answer must come from one system with a complete, non-repudiable record.

This spec defines the snapshot system that provides that record.

---

## 2. Design Philosophy

**Not full event sourcing.** Append-only event sourcing applied to every field write is theoretically correct but operationally expensive: complex replay logic, migrations for schema changes, high storage volume, and difficult debugging. This system uses a lighter model that achieves the same auditability goals.

**The model:** Mutable current state + lightweight change log + immutable snapshots at publish events.

| Layer | What It Is | Mutability |
|---|---|---|
| Current deal state | Live working values across 13 deal tables | Mutable — analysts edit freely |
| Change log | Record of every field write (who, what, when, old value, new value) | Append-only — never updated |
| Snapshots | Complete frozen copy of inputs + outputs at every publish event | Insert-only — never updated, never deleted |

Analysts can iterate on a deal model freely without affecting anything investors see. The publish event is the freeze point.

---

## 3. Core Rules

These rules are invariants. No workflow, admin action, or edge case may violate them.

1. **Every publish event creates a snapshot automatically.** No analyst discretion. No "publish without snapshotting." The act of publishing is the freeze.

2. **Only one snapshot per deal may have `status = 'active'` at any time.** This is enforced by a database constraint, not by application logic alone.

3. **Snapshots are insert-only.** Once a snapshot row is written and locked, no column in that row may be updated except `superseded_at` and `superseded_by` (set when the snapshot is superseded by a newer one). The `inputs_json`, `outputs_json`, `input_hash`, `output_hash`, `locked_at`, and `locked_by` columns are write-once.

4. **Snapshots are never deleted.** No cascade delete from the deals table may reach snapshot rows. Deletion of a deal must be blocked if any snapshot exists.

5. **Engine version is stamped on every snapshot.** Enables post-hoc detection of whether IRR changed because inputs changed or because the calculation engine changed.

6. **Every field write to any deal table creates a change log row.** Change log rows are append-only.

7. **Investor subscription records link to a snapshot_id that is immutable after creation.** The snapshot_id on `investor_deal_subscriptions` is set once at signing and never updated.

---

## 4. Snapshot Lifecycle

```
Deal created (draft)
  → deals row created
  → active_snapshot_id = NULL
  → no snapshot row

Deal published for the first time
  → Atomic transaction (see Section 6)
  → deal_snapshots row created: version_number = 1, status = 'active'
  → deals.active_snapshot_id = new snapshot id
  → Investors viewing the deal see Snapshot 1 terms

Investors sign subscription agreements
  → investor_deal_subscriptions rows created
  → snapshot_id = Snapshot 1 id (immutable forever)

Deal model updated by analyst (working state changes)
  → deal_* table rows updated
  → deal_change_log rows appended for every field changed
  → active_snapshot_id still points to Snapshot 1 (investors still see Snapshot 1)

Deal republished
  → Atomic transaction (see Section 6)
  → deal_snapshots row created: version_number = 2, status = 'active'
  → Prior snapshot (Snapshot 1) updated: status = 'superseded', superseded_at, superseded_by
  → deals.active_snapshot_id = Snapshot 2 id
  → All investors subscribed under Snapshot 1 queued for notification
  → investor_snapshot_history rows inserted: status = 'pending_acknowledgment'

Further republications
  → Each creates a new snapshot, supersedes the prior active snapshot
  → investor_snapshot_history grows — never overwritten
```

**Status values for deal_snapshots.status:**

| Status | Meaning |
|---|---|
| `draft` | Snapshot created but publish transaction not yet committed (transient — should not persist) |
| `active` | Current published version; what investors see; only one per deal at any time |
| `superseded` | Was previously active; replaced by a newer snapshot; permanently readable |
| `withdrawn` | Deal was unpublished; no replacement snapshot; investors notified separately |

---

## 5. Database Tables

### 5.1 deal_snapshots

```sql
CREATE TABLE deal_snapshots (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id              UUID NOT NULL REFERENCES deals(id),

  -- Version identity
  version_number       INTEGER NOT NULL,           -- Monotonically increasing per deal; starts at 1
  status               TEXT NOT NULL               -- 'draft' | 'active' | 'superseded' | 'withdrawn'
                         CHECK (status IN ('draft', 'active', 'superseded', 'withdrawn')),

  -- Engine and schema versioning
  engine_version       TEXT NOT NULL,              -- FK to engine_versions.version
  schema_version       TEXT NOT NULL DEFAULT '1.0', -- Canonical Schema Spec version at time of snapshot

  -- Frozen content (write-once after lock)
  inputs_json          JSONB NOT NULL,             -- Complete snapshot of all deal_* table values at publish
  outputs_json         JSONB NOT NULL,             -- Complete calculation engine output at publish

  -- Integrity hashes (write-once)
  input_hash           TEXT NOT NULL,              -- SHA-256(inputs_json) — tamper detection
  output_hash          TEXT NOT NULL,              -- SHA-256(outputs_json) — tamper detection

  -- Delta summary (human-readable diff vs. prior snapshot)
  change_summary       JSONB,                      -- { irr_delta, moic_delta, key_input_changes: [...] }

  -- Lock metadata (write-once)
  locked_at            TIMESTAMPTZ NOT NULL,
  locked_by            UUID NOT NULL REFERENCES users(id),

  -- Supersession metadata (set when this snapshot is superseded)
  superseded_at        TIMESTAMPTZ,
  superseded_by        UUID REFERENCES deal_snapshots(id),

  -- Constraints
  UNIQUE (deal_id, version_number)
);

-- Only one active snapshot per deal at any time
CREATE UNIQUE INDEX uq_deal_active_snapshot
  ON deal_snapshots (deal_id)
  WHERE status = 'active';

-- Prevent deletion of any snapshot row
CREATE RULE no_delete_snapshots AS ON DELETE TO deal_snapshots DO INSTEAD NOTHING;
```

**Notes:**
- `inputs_json` is a complete serialized copy of all fields across all deal tables at the moment of publish. It is not a reference to current deal tables — it is a frozen copy. The snapshot is self-contained and readable even if the underlying deal tables are later modified.
- `outputs_json` is the complete CalculationParams output from the calculation engine run during the publish transaction.
- `change_summary` is generated by comparing this snapshot's `inputs_json` and `outputs_json` against the prior active snapshot. It is a convenience field for display; the authoritative diff is always the full JSON comparison.

### 5.2 deal_change_log

```sql
CREATE TABLE deal_change_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id        UUID NOT NULL REFERENCES deals(id),

  -- Field identity
  table_name     TEXT NOT NULL,    -- Which deal_* table was written
  field_name     TEXT NOT NULL,    -- Column name within that table

  -- Change content
  old_value      TEXT,             -- Prior value as text (NULL if new field)
  new_value      TEXT,             -- New value as text (NULL if field cleared)

  -- Attribution
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by     UUID NOT NULL REFERENCES users(id),
  change_source  TEXT NOT NULL     -- 'cie_import' | 'analyst_entry' | 'geospatial_update' |
                                   -- 'engine_update' | 'manual_override' | 'system'
                   CHECK (change_source IN (
                     'cie_import', 'analyst_entry', 'geospatial_update',
                     'engine_update', 'manual_override', 'system'
                   )),
  change_note    TEXT              -- Optional annotation (e.g., "CIE extraction from 4448_Cali_v64.xlsx")
);

CREATE INDEX idx_change_log_deal_id ON deal_change_log (deal_id);
CREATE INDEX idx_change_log_changed_at ON deal_change_log (changed_at);
```

**Notes:**
- Every write to any column in any `deal_*` table must create a change log row. This is enforced by triggers, not by application-layer discipline.
- The change log is append-only. No update or delete operations are permitted on this table.
- The change log provides the audit trail between snapshots. The snapshot system provides the frozen state at publish. Together they are a complete record.

### 5.3 engine_versions

```sql
CREATE TABLE engine_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version        TEXT NOT NULL UNIQUE,    -- Semantic version string, e.g. '6.0.153'
  released_at    TIMESTAMPTZ NOT NULL,
  release_notes  TEXT,                    -- What changed in this engine version
  is_current     BOOLEAN NOT NULL DEFAULT FALSE
);

-- Only one current engine version at any time
CREATE UNIQUE INDEX uq_current_engine_version
  ON engine_versions (is_current)
  WHERE is_current = TRUE;
```

**Convention for version strings:** `{spec_major}.{spec_minor}.{impl_number}` — e.g., `6.0.153` means Tax Benefits Spec v6.0, IMPL-153.

**Engine version stamping:** When a publish transaction runs, it reads `SELECT version FROM engine_versions WHERE is_current = TRUE` and stamps that value on the snapshot. If the engine changes (new IMPL deployed), a new engine_versions row is inserted with `is_current = TRUE` and all prior rows updated to `is_current = FALSE`. This is the mechanism that distinguishes "IRR changed because inputs changed" from "IRR changed because the engine changed."

---

## 6. Atomic Publish Transaction

The publish event is a single database transaction. All steps succeed or all steps roll back. The platform never shows a partially published deal.

```
BEGIN TRANSACTION;

Step 1: Validate required fields
  SELECT COUNT(*) FROM deal_* tables WHERE deal_id = $deal_id AND required_field IS NULL
  If any required field is NULL → ROLLBACK with validation error

Step 2: Run calculation engine
  Call calculateBenefitStream(deal_id) with current deal state
  If calculation fails or returns error → ROLLBACK with engine error

Step 3: Compute input_hash and output_hash
  input_hash = SHA-256(serialize(all deal_* table values for this deal))
  output_hash = SHA-256(serialize(calculation engine output))

Step 4: Compute change_summary vs. prior active snapshot
  If prior active snapshot exists:
    irr_delta = new_outputs.irr - prior_snapshot.outputs_json.irr
    moic_delta = new_outputs.moic - prior_snapshot.outputs_json.moic
    key_input_changes = [fields where new_inputs differ from prior_snapshot.inputs_json]
  Else:
    change_summary = NULL (first publication)

Step 5: Insert new snapshot row
  INSERT INTO deal_snapshots (
    deal_id, version_number, status, engine_version, schema_version,
    inputs_json, outputs_json, input_hash, output_hash, change_summary,
    locked_at, locked_by
  ) VALUES (
    $deal_id,
    COALESCE((SELECT MAX(version_number) FROM deal_snapshots WHERE deal_id = $deal_id), 0) + 1,
    'active',
    (SELECT version FROM engine_versions WHERE is_current = TRUE),
    '1.0',
    $inputs_json,
    $outputs_json,
    $input_hash,
    $output_hash,
    $change_summary,
    NOW(),
    $current_user_id
  )

Step 6: Supersede prior active snapshot (if any)
  UPDATE deal_snapshots
    SET status = 'superseded',
        superseded_at = NOW(),
        superseded_by = $new_snapshot_id
  WHERE deal_id = $deal_id
    AND status = 'active'
    AND id != $new_snapshot_id

Step 7: Update deal's active snapshot pointer
  UPDATE deals
    SET active_snapshot_id = $new_snapshot_id
  WHERE id = $deal_id

Step 8: Handle investor notifications (if prior snapshot had subscriptions)
  If prior snapshot existed AND
     EXISTS (SELECT 1 FROM investor_deal_subscriptions WHERE snapshot_id = $prior_snapshot_id):

    INSERT INTO investor_snapshot_history (
      investor_id, deal_id, prior_snapshot_id, new_snapshot_id,
      status, notified_at
    )
    SELECT
      ids.investor_id, $deal_id, $prior_snapshot_id, $new_snapshot_id,
      'pending_acknowledgment', NOW()
    FROM investor_deal_subscriptions ids
    WHERE ids.snapshot_id = $prior_snapshot_id

    Enqueue notification emails for all affected investors

Step 9: Update deal listing
  Platform deal listing now reflects new snapshot terms

COMMIT;
```

**Rollback behavior:** If any step throws an exception, the entire transaction rolls back. The platform's deal listing is unchanged. No partial snapshot, no orphaned notification records, no inconsistent active_snapshot_id. A rollback event is logged to the system event log with the failing step and error message.

---

## 7. Investor Linkage

### 7.1 Subscription Record (Immutable After Creation)

```sql
-- From HDC Investor Onboarding and Subscription Spec v1.0
investor_deal_subscriptions
  snapshot_id    UUID NOT NULL REFERENCES deal_snapshots(id)
  -- This field is set at signing and NEVER updated.
  -- The investor's legal terms are permanently tied to this snapshot.
```

The `snapshot_id` on `investor_deal_subscriptions` is the permanent legal record of what terms the investor invested under. It is set once when the subscription agreement is executed and is never modified, even if the deal model is updated and republished after signing.

### 7.2 Snapshot History (Additive Per-Investor Version Record)

```sql
CREATE TABLE investor_snapshot_history (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id        UUID NOT NULL REFERENCES investors(id),
  deal_id            UUID NOT NULL REFERENCES deals(id),
  subscription_id    UUID NOT NULL REFERENCES investor_deal_subscriptions(id),

  prior_snapshot_id  UUID NOT NULL REFERENCES deal_snapshots(id),
  new_snapshot_id    UUID NOT NULL REFERENCES deal_snapshots(id),

  -- Notification workflow
  status             TEXT NOT NULL DEFAULT 'pending_acknowledgment'
                       CHECK (status IN ('pending_acknowledgment', 'acknowledged', 'overdue')),
  notified_at        TIMESTAMPTZ NOT NULL,      -- When notification email was sent
  acknowledged_at    TIMESTAMPTZ,               -- When investor acknowledged
  acknowledged_by    TEXT,                      -- Who acknowledged (investor login or wealth manager)
  overdue_flagged_at TIMESTAMPTZ               -- Set when window expires without acknowledgment
);

CREATE INDEX idx_snapshot_history_investor ON investor_snapshot_history (investor_id);
CREATE INDEX idx_snapshot_history_deal ON investor_snapshot_history (deal_id);
CREATE INDEX idx_snapshot_history_status ON investor_snapshot_history (status);
```

**Key property:** This table is additive. A row is inserted for each model update affecting each investor. Rows are never updated except to set `acknowledged_at`, `acknowledged_by`, and `overdue_flagged_at`. The complete version history for every investor is permanently readable as a sequence of rows.

**Querying an investor's version history:**
```sql
SELECT
  ish.*,
  prior_snap.version_number AS prior_version,
  new_snap.version_number AS new_version,
  new_snap.change_summary
FROM investor_snapshot_history ish
JOIN deal_snapshots prior_snap ON ish.prior_snapshot_id = prior_snap.id
JOIN deal_snapshots new_snap ON ish.new_snapshot_id = new_snap.id
WHERE ish.investor_id = $investor_id
  AND ish.deal_id = $deal_id
ORDER BY ish.notified_at ASC;
```

---

## 8. Delta Summary

Every snapshot after the first includes a `change_summary` JSON object. This is the human-readable diff generated during the publish transaction.

**Structure:**
```json
{
  "irr_delta": 0.003,
  "moic_delta": 0.04,
  "irr_prior": 0.127,
  "irr_new": 0.130,
  "moic_prior": 1.91,
  "moic_new": 1.95,
  "engine_changed": false,
  "prior_engine_version": "6.0.153",
  "new_engine_version": "6.0.153",
  "key_input_changes": [
    {
      "field": "exitCapRate",
      "table": "deal_returns",
      "prior_value": "0.0500",
      "new_value": "0.0475",
      "label": "Exit Cap Rate"
    },
    {
      "field": "seniorDebtRate",
      "table": "deal_debt",
      "prior_value": "0.0625",
      "new_value": "0.0600",
      "label": "Senior Debt Rate"
    }
  ]
}
```

**`engine_changed` flag:** Set to `true` if `new_engine_version != prior_engine_version`. When `engine_changed` is true, IRR and MOIC delta may reflect engine behavior changes even if no inputs changed. The investor notification for engine-only recalculations uses a distinct template.

**Display in investor notification emails:**
- "Your projected IRR has been updated from 12.7% to 13.0%"
- "Your projected MOIC has been updated from 1.91x to 1.95x"
- "Key changes: Exit Cap Rate adjusted from 5.00% to 4.75%; Senior Debt Rate adjusted from 6.25% to 6.00%"

---

## 9. Key Decisions — Do Not Revisit

These decisions were settled in the April 11–12, 2026 architecture session.

| Decision | Rationale |
|---|---|
| Snapshot trigger = publish event | Internal approval is not the trigger. The analyst pressing "Publish" is the trigger. This aligns the legal/investor event with the technical event. |
| No analyst discretion on snapshotting | Reduces operational risk. An analyst cannot accidentally publish without creating a snapshot. |
| Mutable current state (not full event sourcing) | Full event sourcing for 112+ fields across 13 tables is operationally expensive. The mutable + changelog + snapshot model achieves Novogradac, Sidley, IRS, and investor defensibility at lower cost. |
| Investor subscription links to snapshot_id | The snapshot at signing is the permanent legal record of terms. It must be immutable. Updating it on republication would change the legal record retroactively. |
| investor_snapshot_history is additive | Investor records are never overwritten. A new row per update preserves the complete chain of custody. |
| Snapshot deletion is blocked | A snapshot that was shown to investors is evidence. It may not be deleted even if the deal is later closed or withdrawn. Withdrawn deals retain all prior snapshot history. |
| SHA-256 hashes on inputs_json and outputs_json | Provides tamper evidence without requiring a blockchain or external timestamping service. Any modification to a snapshot row can be detected by recomputing the hash. |

---

## 10. Open Items

| Item | Owner | Priority |
|---|---|---|
| Angel to review deal_snapshots, deal_change_log, engine_versions DDL against existing table conventions | Angel | High |
| Confirm trigger implementation strategy: PostgreSQL triggers vs. application-layer interceptors for change log | Angel | High |
| Confirm SHA-256 hash computation: database function vs. application layer | Angel | Medium |
| Investor notification email templates: standard update vs. engine-only recalculation | Brad / Chat | Medium |
| Overdue acknowledgment window: confirm 30-day default is correct for AHF | Brad | Medium |
| Snapshot withdrawal workflow: define process for unpublishing a deal that has been shown to investors but has no subscriptions yet | Brad / Sidley | Low |

---

## 11. Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | April 2026 | Initial specification. Design basis: April 11–12, 2026 architecture session. Core rules, snapshot lifecycle, DDL for deal_snapshots / deal_change_log / engine_versions, atomic publish transaction (9 steps), investor linkage tables, delta summary format. |

---

*End of HDC Deal Snapshot and Versioning Specification v1.0*
