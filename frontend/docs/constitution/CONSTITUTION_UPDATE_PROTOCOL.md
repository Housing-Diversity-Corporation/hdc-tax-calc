# Constitution Update Protocol v1.0

## Purpose

Ensure `/docs/constitution/` files remain current as standards, protocols, and decisions evolve during development work.

---

## When to Update

Update constitution files when ANY of the following occur during a session:

1. **New documentation standard established** (e.g., Strategic Context Template)
2. **New validation protocol added** (e.g., grep audit requirements)
3. **Key business logic decision made** (e.g., fee structure changes)
4. **New regulatory source identified** (e.g., Tax Foundation, Novogradac)
5. **SDD process refinement** (e.g., Definition of Done updates)

---

## How to Update

1. At end of session, Chat (Claude) asks:
   > "Did we establish any new standards, protocols, or decisions that should be added to the constitution?"

2. If yes, create CC prompt to update relevant `/docs/constitution/` file

3. CC executes update before session ends

4. This is **part of Definition of Done** - not optional

---

## Constitution Files

| File | Purpose |
|------|---------|
| `SDD_STRATEGIC_CONTEXT_TEMPLATE.md` | Template for connecting specs to business strategy |
| `CONSTITUTION_UPDATE_PROTOCOL.md` | This file - how to keep constitution current |
| `FORMULA_MAP_UPDATE_PROTOCOL.md` | Maintenance protocol for Formula Map (calculation traceability) |
| `VALIDATION_PROTOCOL.md` | Validation requirements (may need relocation here) |

---

## Integration Points

- **Chat (Claude):** Has this protocol in Memory, checks at session end
- **Claude Code:** Has this protocol in `/docs/constitution/`, references during work
- **Handoff Prompts:** Include Constitution Update Protocol reminder

---

**Document Version:** v1.0
**Created:** November 29, 2025
