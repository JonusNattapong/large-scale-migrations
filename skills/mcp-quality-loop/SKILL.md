---
name: mcp-quality-loop
description: Drive a disciplined implementation or repair loop with the project's `quality-loop` MCP server. Use when Claude needs to repeatedly check tests, type checks, linting, builds, migrations, or other configured project gates; especially after making a code change or when asked to verify, fix until green, or run a quality loop.
---

# MCP quality loop

Use the `quality-loop` MCP server as the source of truth for configured project gates. It batches local checks into one structured tool result, so do not manually reconstruct its configured commands.

## Workflow

1. Call `quality_loop` with `action: "list"`. State the gates selected and their purpose.
2. Call it with `action: "run"` before changing code when diagnosing; otherwise run it after the implementation.
3. Read failed output, make the smallest relevant change, then call `run` again. Keep the same gate set unless a failure proves a gate is irrelevant.
4. Stop only when every selected gate passes, or when a failure needs user action (credentials, unavailable service, destructive migration, or a product decision).
5. In the handoff, report the exact passed and blocked gate names. Never claim success based solely on an edit.

## Guardrails

- The MCP server runs only commands declared in `quality-loop/config.json`; do not ask it to execute arbitrary shell input.
- Prefer `run` over `loop`. Use `loop` only for eventually-consistent external checks, such as a service or CI status, where rerunning the exact checks without editing is meaningful.
- Limit `loop` to 5 attempts. Treat its timeout as diagnostic evidence, not permission to keep polling forever.
- Do not run gates marked `destructive` unless the user explicitly authorizes that operation.

## Configuration

Read [the configuration reference](references/configuration.md) when adding, changing, or diagnosing a gate.
