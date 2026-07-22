---
name: code-migration
description: >
  Run a large-scale language migration with Anthropic's six-step process:
  feasibility → judge setup → map & rules → stress-test → translate → compile → test → parity.
  Use when the user wants to migrate, port, or rewrite a codebase from one language
  to another ("migrate this to Rust", "port our Python CLI to TypeScript",
  "should we rewrite this in Go?"), or asks for a migration feasibility assessment.
  Not for incremental JS→TS adoption or single-file conversions.
---

# Code migration (six-step process)

You are orchestrating a language migration using [Anthropic's code-migration kit](https://github.com/anthropics/code-migration-kit-with-claude-code).

**Kit location:** `migration-kit/` — README.md defines the process; CLAUDE.md defines your standing rules — read both before acting. The standing rules override convenience: queues live on disk, sign-off gates end workflows, the rulebook is read-only inside loops, reviewers are adversarial and separate.

## Prerequisite: the Kit

Make sure `migration-kit/` is present in the repo root (it is — installed by this skill). If it's missing, copy it from this skill's install source.

## Core doctrine

> You don't fix the code. You fix the process (loop) that produced the code.

The entire methodology rests on this: individual failures get burned down by fixer agents; recurring failures indict a rule, and the rule gets amended.

## Invocation and autonomous loop

This skill owns the migration loop directly. Do not require `/loopmd`, the `loopmd` skill, `LOOP.md`, or `PROGRESS.md`.

The user can invoke it with `/code-migration <source> to <target>` or naturally ask to migrate/port/rewrite a codebase. Determine the current phase from artifacts on disk, execute that phase, and repeat its mechanical queue until its exit condition passes. Stop only at the explicit human sign-off gates below, on a blocker requiring user action, or when parity is complete.

## Routing

1. **No migration artifacts exist yet** (`migration/` absent): run `migration-kit/prompts/00-feasibility.md`. Produce the report, deliver the verdict, STOP. Do not begin Step 1 in the same session — the human kicks off each phase.

2. **Feasibility signed off, no judge yet:** confirm a judge exists that runs against both old and new code through the public surface. If the existing suite tests the public surface (or already lives in a third language), carry it to Step 6. If it imports internals, run `migration-kit/prompts/00b-judge-setup.md` to build and validate a portable parity harness. Never start Step 1 without a judge.

3. **Feasibility + judge signed off, no map/rules:** run Step 1 — adapt a `migration-kit/scripts/depmap_*` for the source ecosystem (`prompts/01-dependency-map.md`), copy `migration-kit/templates/RULEBOOK.md` → `migration/RULEBOOK.md` and draft it with the human, then `prompts/02-gap-inventory.md`. Each ends at its own gate.

4. **Step 1 signed off:** confirm `.claude/settings.json` is installed from `migration-kit/templates/settings.json` (the human does this; never install it yourself), then run `migration-kit/prompts/03-stress-test.md`. If this is a redesign migration, substitute adversarial design-doc review.

5. **Stress test signed off:** run `migration-kit/prompts/04-translation-kickoff.md` with `scripts/queue_runner.mjs`.

6. **Translation queue empty:** Step 4 → Step 5 → Step 6 via `prompts/05-survey-build.md`, then smoke tests, then inherited suite burndown (or parity referee against old code).

7. **Step 6 done-gate passed:** run `migration-kit/prompts/06-post-parity.md` — collect port markers, classify fix-now vs document-and-close. Ends at its own gate.

## Constant behaviors

- Report progress as burndown numbers (`queue_runner.mjs status`), not prose.
- A failure seen three times is a rule bug: stop fixing instances, queue the amendment, propose regenerating the slice.
- "Don't migrate" and "stop here" are valid recommendations at every gate.

## Reference

- **[Blog post](https://claude.com/blog/ai-code-migration)** — "How Anthropic runs large-scale code migrations with Claude Code" (Jul 16, 2026)
- **[GitHub repo](https://github.com/anthropics/code-migration-kit-with-claude-code)** — prompts, templates, scripts
