# Git Workflow Standards

**Version:** 1.0
**Date:** 2026-01-27
**Status:** Active

---

## Pre-Commit Audit (Required)

Before executing any git commit, always audit the working directory state first:

```bash
git status
git diff --stat
git log -1 --format="%ci %s"  # Date of last commit
```

### Report to User Before Committing

1. **Number of modified/untracked files** — Flag if count seems high for the stated task
2. **Summary of changes by category** — Group files by purpose
3. **Any files that appear unrelated** — Highlight files that don't match the task
4. **Date of last commit** — Identify stale uncommitted work (>1 day old = flag)

### Discrepancy Handling

If the user provides a commit message that doesn't match the actual pending changes:

1. **Flag the discrepancy** — Clearly state what doesn't match
2. **List unexpected files** — Show files that seem unrelated to the task
3. **Ask whether to:**
   - Proceed with an amended/expanded message
   - Commit in separate batches (one for stated task, one for prior work)
   - Exclude certain files from the commit

**Never commit without knowing what's being committed.**

### Example Audit Output

```
=== Pre-Commit Audit ===
Last commit: 2026-01-21 (6 days ago) - "IMPL-078: UI Consolidation"
Files staged: 53
Files expected for ISS-051-055: ~15

WARNING: 38 files appear unrelated to ISS-051-055:
- CalculatorConfiguration.java (backend entity)
- VALIDATION_SOP.md (1008 lines, new doc)
- STATE_LIHTC_AUDIT_2026-01-22.md (dated prior to today)
- iss-039-validation.test.ts (different ISS number)

Recommend: Split into separate commits or expand message.
```

---

## Rationale

Prevents accidentally bundling unrelated work into a single commit, which:

- **Creates misleading git history** — Commit messages don't reflect actual changes
- **Makes rollbacks harder** — Can't revert one feature without reverting unrelated work
- **Obscures what each commit changed** — Code review becomes impossible
- **Violates atomic commit principle** — One commit should do one thing

---

## Commit Message Standards

### Format

```
<type>: <short summary>

<body - what changed and why>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Types

| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix (use ISS-XXX reference) |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes nor adds |
| `test` | Adding or updating tests |
| `chore` | Maintenance (deps, config) |

### ISS/IMPL References

Always include issue references in commit messages:

```
ISS-051 to ISS-055: S-curve, DSCR, waterfall fixes

ISS-051 v2: HDC promote base single source of truth
ISS-052: Operating Cash / Excess Reserve separation
ISS-053: S-curve fix (was overriding to 100%)
ISS-054: Stabilized DSCR display
ISS-055: "Year 1 NOI" → "Stabilized NOI" rename
```

---

## History

| Date | Change | Reference |
|------|--------|-----------|
| 2026-01-27 | Initial creation | Post-mortem: 6 days of work bundled accidentally |
