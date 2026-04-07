Use 'bd' for task tracking. Before starting any work:
1. Run `bd ready` to see available tasks
2. Run `bd update <id> --claim` to atomically claim your task
3. Read VALIDATION_PROTOCOL.md, UI_NAVIGATION_MAP.md, and
   RUNTIME_UI_VERIFICATION.md before any implementation or
   runtime verification
4. On completion, run `bd close <id> "<summary>"` and update
   SPEC_IMPLEMENTATION_REGISTRY
5. Do not request commit approval with any DoD item incomplete
6. Runtime verification is mandatory for all UI-touching IMPLs —
   report actual screen values before requesting commit approval
