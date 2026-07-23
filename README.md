# code-migration — a Claude Code plugin

Port a codebase from one language to another (e.g. Python → Rust, C → Go) using
Anthropic's six-step migration process — packaged as an installable **Claude Code
plugin**. This repo is both the plugin and its marketplace.

## Install

In Claude Code:

```
/plugin marketplace add JonusNattapong/large-scale-migrations
/plugin install code-migration@large-scale-migrations
```

Requires **Node.js 18+** for the bundled quality-loop MCP server (zero
dependencies — nothing to `npm install`).

Then, in any project, just say:

```
migrate this project to Rust
```

or run the slash command `/migrate Rust`.

## What you get

| Component | Role |
| --- | --- |
| **`code-migration` skill** | The six-step playbook: feasibility → judge setup → map & rules → stress-test → translate → compile → test → parity |
| **`mcp-quality-loop` skill** | Teaches Claude to drive the grader below |
| **`quality-loop` MCP server** | Runs your project's gates (tests / lint / build) and loops until green — only commands you declare, never injected |
| **`migration-kit/`** | Bundled prompts, rules, templates, and scripts the skill loads |

## Configure your gates

The quality-loop server looks for its config in the **project you run it in**, in
this order:

1. `$QUALITY_LOOP_CONFIG` (explicit path)
2. `quality-loop.config.json` in your project root
3. `mcp-quality-loop.config.json` in your project root
4. the bundled example (fallback)

Drop a `quality-loop.config.json` in your project to declare the commands Claude
may run:

```json
{
  "checks": [
    { "name": "tests", "command": "npm test", "description": "Run unit tests" },
    { "name": "build", "command": "npm run build", "description": "Production build" }
  ]
}
```

Then ask Claude to *"run the quality loop"*.

## Local development

Clone and point the marketplace at your working copy, or verify the MCP server
directly:

```bash
node quality-loop/server.mjs < /dev/null   # clean exit = healthy
```

## Reference

- Six-step process: [`migration-kit/README.md`](migration-kit/README.md)
- Standing rules: [`migration-kit/CLAUDE.md`](migration-kit/CLAUDE.md)
- Background: [How Anthropic runs large-scale code migrations with Claude Code](https://claude.com/blog/ai-code-migration)

## License

MIT
