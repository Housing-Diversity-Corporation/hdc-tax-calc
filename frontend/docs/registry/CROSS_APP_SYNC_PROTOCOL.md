# Cross-App Sync Protocol v1.0

**Date:** 2026-05-04
**Purpose:** Govern how the two cross-app reference docs stay in sync as either the Map app or the Tax Benefits app evolves. Lives in both repos as the durable convention. CC and Chat both reference this protocol when material changes happen.

**The two reference docs:**
- `MAP_APP_INTEGRATION_REFERENCE.md` lives in the Tax Benefits repo at `frontend/docs/reference/`. Describes the Map app for Tax Benefits-side context.
- `TAX_BENEFITS_APP_INTEGRATION_REFERENCE.md` lives in the Map repo at `docs/`. Describes the Tax Benefits app for Map-side context.

**The naming convention is intentional:** each doc describes the *other* app, because that is the side that needs awareness.

---

## 1. Trigger Conditions

A material change is any change that affects:

| Category | Examples |
|---|---|
| Cross-app contracts | Endpoints, payloads, types crossing the app boundary; the `CalculatorConfigurationController` scope; Pipeline Screening API contracts |
| Capability surface in either reference doc | New built capability, new layer added, new spec promoted to built status |
| Architectural decisions affecting integration | Investor identity ownership, deal sourcing flow, snapshot/audit responsibilities |
| New track or phase work | Track 8 phase advancing from spec to build; Track 9 skill capabilities expanding |

A change is NOT material if:

- It is a bug fix that does not change a contract or capability advertised in the reference doc
- It is an internal refactor with no external surface change
- It is a UI-only change that does not affect cross-app integration

When in doubt, update the reference doc. The cost of an unnecessary version bump is low; the cost of a missed material change is the same documentation drift this protocol is designed to prevent.

---

## 2. Update Workflow

When a material change happens in repo X (where X is either Tax Benefits or Map):

1. **Identify which reference doc is affected.** Material changes in repo X update the reference doc in repo Y, because Y is the side that needs awareness of changes in X. (Tax Benefits change updates Map repo's reference doc. Map change updates Tax Benefits repo's reference doc.)

2. **Apply the update.** Either repo X queues a CC prompt for repo Y to apply the update, or the human (Brad) applies the update directly during the session that produced the change.

3. **Bump version.** Per vX.X convention. Major changes (new track, fundamental architecture shift, decision reversed) increment the whole number. Minor refinements (capability addition, IMPL landing, status flip) increment the decimal.

4. **Note in Session-End Checklist.** The originating repo's session-end checklist Step 4 (Stale Docs) gets an entry: "Cross-app sync queued for [other repo]: [brief description of change]."

5. **Confirm reciprocal update.** When the other repo applies the update, that completes the sync cycle.

---

## 3. Versioning Convention

vX.X. Match Brad's standing convention.

| Change Type | Version Bump |
|---|---|
| New track added (e.g., Track 10) | Whole number (v1.x → v2.0) |
| Fundamental architecture shift (e.g., merge to monorepo) | Whole number |
| Architectural decision reversed | Whole number |
| New built capability | Decimal (v1.0 → v1.1) |
| Status flip (specced → built, or built → deprecated) | Decimal |
| New Track 8 phase started | Decimal |
| New IMPL landing that affects integration surface | Decimal |
| Editorial cleanup, link fix, typo | No version bump (commit only) |

---

## 4. Cross-Repo Coordination

The two repos do not share a CI pipeline or shared deployment. Coordination happens via:

| Mechanism | When Used |
|---|---|
| CC prompt from one repo to the other | Standard case. Originating repo drafts a CC prompt with the diff; receiving repo's CC applies in next session. |
| Human direct edit during multi-repo session | When Brad has both repos open and is making the change live. |
| Chat-mediated sync | When the change crosses domains and Chat is helping plan the integration; Chat produces both updates in parallel. |

The coordination mechanism does not matter for the final state. What matters is that both reference docs reach consistent versions within one working session of the change.

---

## 5. Sync Verification

At the start of any session involving cross-app integration work, CC or Chat:

1. Reads the local reference doc
2. Notes the current version
3. Confirms the version matches the last known sync per the receiving repo's session log
4. If out of date, requests an update from the other side before proceeding with substantive work

This verification step prevents working from a stale baseline. The April-9 Map app audit showed how a stale doc (Roadmap v2.0 marking Phase 1.3 as "not built" when it was substantially built) can anchor an entire audit to the wrong baseline.

---

## 6. Skill Development (Future)

The manual sync workflow is the v1.0 baseline. A future Claude skill could automate the diff-and-update step:

- Skill detects material change in repo X via git diff against reference doc trigger conditions
- Skill drafts the corresponding update for repo Y's reference doc
- Skill outputs the draft for human review before commit

Not built. Will be considered after enough cycles of manual sync to understand the pattern stabilization. Until then, manual sync per Section 2 is the protocol.

---

## 7. Conflict Resolution

If the two reference docs make incompatible claims about the same surface area (e.g., one says investor identity is owned by Tax Benefits, the other says shared), Tax Benefits-side reference doc wins for items inside the Tax Benefits app's domain, and Map-side reference doc wins for items inside the Map app's domain. For items in the cross-app integration surface (Track 8), the more recently updated doc wins, and the other should be aligned in the next session.

If conflict cannot be resolved by document precedence (e.g., genuinely conflicting architectural intent), Brad and Chat reconcile in a focused session and update both docs to the agreed position.

---

## 8. Storage Locations

| Doc | Tax Benefits Repo | Map Repo |
|---|---|---|
| `MAP_APP_INTEGRATION_REFERENCE.md` | `frontend/docs/reference/` | (not present) |
| `TAX_BENEFITS_APP_INTEGRATION_REFERENCE.md` | (not present) | `docs/` |
| `CROSS_APP_SYNC_PROTOCOL.md` | `frontend/docs/registry/` | `docs/` |

The protocol doc itself lives in both repos because it governs both.

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-04 | Initial protocol. Establishes trigger conditions, update workflow, versioning convention, coordination mechanisms, sync verification, conflict resolution. Manual workflow baseline; skill automation deferred. |

---

*End of Cross-App Sync Protocol v1.0*
