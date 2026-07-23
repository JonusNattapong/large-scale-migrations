# large-scale-migrations

A Claude Code workspace for **porting a codebase from one language to another**
(e.g. Python → Rust, C → Go) using Anthropic's six-step migration process.

## What's in here

The repo has two parts and nothing else:

| Folder | Role | Analogy |
| --- | --- | --- |
| [`migration-kit/`](migration-kit/) | **How to migrate** — the prompts, rules, templates, and scripts that drive the six-step process | the playbook |
| [`quality-loop/`](quality-loop/) | **Check the result** — an MCP server that runs your project's gates (tests / lint / build) and loops until green | the grader |

Two Claude skills wire them into Claude Code:

- `.claude/skills/code-migration/` — say "migrate", "port", or "rewrite" (or `Skill("code-migration")`) to run the playbook.
- `.claude/skills/mcp-quality-loop/` — tells Claude how to drive the grader.

## Setup

Requires **Node.js 18+** (for the quality-loop MCP server) and **Claude Code**.

1. Clone the repo and open it in Claude Code:
   ```bash
   git clone <this-repo> && cd large-scale-migrations
   ```
2. That's it — no `npm install`. The quality-loop MCP server is zero-dependency
   and starts automatically from [`.mcp.json`](.mcp.json).
3. Edit [`quality-loop/config.json`](quality-loop/config.json) to declare your
   project's gates (the commands Claude is allowed to run):
   ```json
   {
     "checks": [
       { "name": "tests", "command": "npm test", "description": "Run unit tests" }
     ]
   }
   ```

Verify the server boots:
```bash
node quality-loop/server.mjs < /dev/null
```
(no output and a clean exit means it's healthy).

## Using it

- **Start a migration:** open Claude Code in the repo and say
  *"migrate this project to <language>"*. The `code-migration` skill takes over
  and walks the six steps: feasibility → judge setup → map & rules → stress-test
  → translate → compile → test → parity.
- **Check quality any time:** ask Claude to *"run the quality loop"*. It calls the
  `quality-loop` MCP tool, which runs only the gates in `quality-loop/config.json`.

## Reference

- Six-step process details: [`migration-kit/README.md`](migration-kit/README.md)
- Standing rules for migration sessions: [`migration-kit/CLAUDE.md`](migration-kit/CLAUDE.md)
- Background: [How Anthropic runs large-scale code migrations with Claude Code](https://claude.com/blog/ai-code-migration) — and a saved copy in [`docs/`](docs/).
