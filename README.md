# large-scale-migrations

## Code Migration Kit

This repo contains the [Anthropic Code Migration Kit](https://github.com/anthropics/code-migration-kit-with-claude-code) — prompts, templates, and scripts for running large-scale language migrations with Claude Code / Clew Code.

**Kit:** [`migration-kit/`](migration-kit/) — six-step process: feasibility → judge setup → map & rules → stress-test → translate → compile → test → parity.

**Skill:** `.claude/skills/code-migration/` — loads the kit into Clew Code. Use `Skill("code-migration")` or mention "migrate", "port", or "rewrite" to trigger it.

Based on [How Anthropic runs large-scale code migrations with Claude Code](https://claude.com/blog/ai-code-migration) (Jul 16, 2026).

