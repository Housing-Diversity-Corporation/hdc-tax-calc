# Session-End Checklist
## Run Before Closing Every Chat or CC Session

**Version:** 1.0
**Date:** April 2026
**Location:** `frontend/docs/registry/SESSION_END_CHECKLIST.md`
**Maintained by:** Brad and Chat — not CC

---

## The Seven Questions

### 1. DECISIONS
Did this session produce any decision that changes how CC should behave or build?

Examples: tax law interpretation confirmed, architecture pattern settled, calculation approach chosen, business rule clarified.

**Action:** Add to `frontend/docs/DOCUMENTED_ASSUMPTIONS.md` or the relevant spec in `frontend/docs/specs/`. If it affects how CC reads or writes code, it belongs in the repo — not just in Chat memory.

---

### 2. NEW SPECS OR ARTIFACTS
Did this session produce any new spec, document, or structured artifact?

Examples: new feature spec, updated roadmap section, new API contract, updated field definitions.

**Action:** Queue a CC commit to `frontend/docs/specs/` (implementation specs CC uses to build) or `frontend/docs/reference/` (business, legal, and tax docs CC reads for context). Do not leave new specs only in Chat project knowledge.

---

### 3. OPEN ITEMS
Did this session surface any new open issues, blockers, deferred decisions, or unresolved questions?

Examples: legal review pending, Angel decision needed, architectural question deferred, fee rate not yet decided.

**Action:** Add to the Open Issues table in `frontend/docs/registry/HDC_Spec_Ecosystem_Index.md`.

---

### 4. STALE DOCS
Did this session reveal that any repo document is out of date?

Examples: SPEC_REGISTRY_NOTES.md baseline behind actual IMPL count, a spec that doesn't reflect a recent decision, AGENTS.md missing a new file reference.

**Action:** Flag explicitly. Either queue a CC update prompt now or add to open items so it gets picked up at the start of the next relevant session. Never leave a known stale doc unlogged.

---

### 5. MEMORY
Did this session produce any new standing protocol, convention, process standard, or recurring instruction?

Examples: new DoD item, new prompt structure requirement, new version control convention, new coordination rule with Angel.

**Action:** Add to Chat memory now, before the session closes. Memory added after the session is lost.

---

### 6. CATALOG
Does the Project Knowledge Catalog need a new or updated entry?

Examples: new document added to repo or Chat, document moved from Chat to repo, document retired or superseded, document content materially changed.

**Action:** Queue a catalog version update. The catalog lives at `frontend/docs/registry/HDC_Project_Knowledge_Catalog_vX_X.md`. Increment the version number per the vX.X convention.

---

### 7. CONSTITUTION
Did this session produce any new architectural principle, invariant rule, or permanent design decision?

Examples: new single-source-of-truth rule, new schema-first principle, new immutability requirement, new agent coordination standard.

**Action:** CC prompt to add to `frontend/docs/constitution/` before the session closes. This is part of the existing DoD — generalizing it here as the final checklist item.

---

## Quick Reference

| Question | If Yes → Action |
|---|---|
| New decision affecting CC behavior? | DOCUMENTED_ASSUMPTIONS.md or relevant spec |
| New spec or artifact produced? | CC commit to /docs/specs/ or /docs/reference/ |
| New open issue or blocker? | HDC_Spec_Ecosystem_Index.md open issues table |
| Stale doc discovered? | Flag for CC update prompt |
| New standing protocol? | Add to Chat memory now |
| Catalog needs update? | Queue catalog version increment |
| New architectural principle? | CC prompt to /docs/constitution/ |

---

## How to Use This

At the end of every session — Chat planning sessions and CC implementation sessions both — run through these seven questions in order. Most sessions will have answers to 2-3 of them. A major architecture session like April 12, 2026 may touch all seven.

The goal is not perfection on every session. The goal is that nothing important falls through the gap between Chat and the repo. Every decision that affects CC's judgment should be findable in the repo. Every artifact produced in Chat should have a path to the repo.

---

*This checklist is maintained by Brad and Chat. CC does not update this file.*
