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

## MCP setup

The `quality-loop` MCP server is what lets Claude run your tests/build and loop
until green. **If you install this as a plugin, it is registered automatically** —
Claude reads the bundled [`.mcp.json`](.mcp.json), expands `${CLAUDE_PLUGIN_ROOT}`,
and starts the server. Nothing to do.

You only configure MCP by hand if you want to run it **outside** the plugin (e.g.
local development, or wiring it into another repo). Claude Code registers MCP
servers at three scopes:

| Scope | File | Use when |
| --- | --- | --- |
| **Project** | `.mcp.json` at the repo root | everyone who clones the repo gets the same server |
| **User (global)** | `~/.claude.json` | you want it in every project on your machine |
| **Plugin** | `.mcp.json` inside the plugin | ships with the plugin on install (what this repo uses) |

Every scope uses the same shape:

```json
{
  "mcpServers": {
    "quality-loop": {
      "command": "node",
      "args": ["quality-loop/server.mjs"]
    }
  }
}
```

Three ways to add it:

- **Edit `.mcp.json`** directly (as shown above), then reopen the project.
- **CLI:** `claude mcp add quality-loop -- node quality-loop/server.mjs`
- **In a session:** run `/mcp` to view status, authorize, or toggle servers.

Verify it is connected with `/mcp` (look for `quality-loop`), or just ask Claude
to *"run the quality loop"*.

> Note: `${CLAUDE_PLUGIN_ROOT}` only resolves when running as an installed
> plugin. For plain local dev, use a relative path like `quality-loop/server.mjs`.

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
