#!/usr/bin/env node
// quality-loop MCP server — zero-dependency stdio JSON-RPC server.
//
// Exposes a single tool, `quality_loop`, that runs the project "gates" declared
// in config.json. The MCP client can never inject a command: only commands
// written in the config file are ever executed.
//
// Actions:
//   list  -> report configured gates (no execution)
//   run   -> run all gates (or a subset via `checks`), return structured results
//   loop  -> re-run gates up to `maxAttempts` (1..5) until all pass
//
// Config resolution order (user's project wins over the bundled example, so
// the same installed plugin adapts to whatever project it runs in):
//   1. $QUALITY_LOOP_CONFIG (absolute or cwd-relative path)
//   2. ./quality-loop.config.json         in the user's project (cwd)
//   3. ./mcp-quality-loop.config.json     in the user's project (cwd, legacy)
//   4. ./config.json next to this file    (the bundled default / example)

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const MAX_TIMEOUT = 600_000;
const DEFAULT_TIMEOUT = 120_000;
const NAME_RE = /^[A-Za-z0-9._-]+$/;

function configPath() {
  const candidates = [
    process.env.QUALITY_LOOP_CONFIG && resolve(process.env.QUALITY_LOOP_CONFIG),
    resolve(process.cwd(), "quality-loop.config.json"),
    resolve(process.cwd(), "mcp-quality-loop.config.json"),
    join(HERE, "config.json"),
  ].filter(Boolean);
  for (const p of candidates) if (existsSync(p)) return p;
  return null;
}

function loadChecks() {
  const path = configPath();
  if (!path) throw new Error("No quality-loop config found (looked for config.json / mcp-quality-loop.config.json).");
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`Invalid JSON in ${path}: ${e.message}`);
  }
  const checks = Array.isArray(parsed.checks) ? parsed.checks : [];
  const seen = new Set();
  for (const c of checks) {
    if (!c || typeof c.name !== "string" || !NAME_RE.test(c.name))
      throw new Error(`Each check needs a valid "name" (letters, digits, . _ -). Bad entry near: ${JSON.stringify(c)}`);
    if (typeof c.command !== "string" || !c.command.trim())
      throw new Error(`Check "${c.name}" is missing a "command".`);
    if (seen.has(c.name)) throw new Error(`Duplicate check name: "${c.name}".`);
    seen.add(c.name);
    c.timeoutMs = Math.min(Number(c.timeoutMs) || DEFAULT_TIMEOUT, MAX_TIMEOUT);
  }
  return { path, checks };
}

function runCheck(check) {
  const started = Date.now();
  try {
    const stdout = execSync(check.command, {
      timeout: check.timeoutMs,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    return { name: check.name, passed: true, durationMs: Date.now() - started, output: stdout.trim() };
  } catch (e) {
    const output = [e.stdout, e.stderr].filter(Boolean).join("\n").trim() || e.message;
    return {
      name: check.name,
      passed: false,
      durationMs: Date.now() - started,
      timedOut: e.killed === true || e.signal === "SIGTERM",
      exitCode: typeof e.status === "number" ? e.status : null,
      output,
    };
  }
}

function selectChecks(all, requested) {
  if (!requested || requested.length === 0) return all;
  const byName = new Map(all.map((c) => [c.name, c]));
  const picked = [];
  for (const name of requested) {
    const c = byName.get(name);
    if (!c) throw new Error(`Unknown gate "${name}". Configured: ${all.map((x) => x.name).join(", ") || "(none)"}.`);
    picked.push(c);
  }
  return picked;
}

function format(results) {
  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);
  const lines = [`Gates: ${passed.length}/${results.length} passed.`, ""];
  for (const r of results) {
    lines.push(`${r.passed ? "PASS" : "FAIL"}  ${r.name}  (${r.durationMs}ms${r.timedOut ? ", TIMED OUT" : ""})`);
    if (!r.passed && r.output) lines.push(indent(r.output));
  }
  return { text: lines.join("\n"), allPassed: failed.length === 0, passed: passed.map((r) => r.name), failed: failed.map((r) => r.name) };
}

const indent = (s) => s.split("\n").map((l) => "    " + l).join("\n");

function handleTool(args) {
  const action = args?.action || "run";
  const { path, checks } = loadChecks();

  if (action === "list") {
    const text =
      `Config: ${path}\nConfigured gates (${checks.length}):\n` +
      (checks.map((c) => `  - ${c.name}${c.destructive ? " [destructive]" : ""}: ${c.description || c.command}`).join("\n") || "  (none)");
    return { content: [{ type: "text", text }] };
  }

  if (action === "run") {
    const selected = selectChecks(checks, args?.checks);
    const results = selected.map(runCheck);
    const { text } = format(results);
    return { content: [{ type: "text", text }] };
  }

  if (action === "loop") {
    const maxAttempts = Math.min(Math.max(Number(args?.maxAttempts) || 1, 1), 5);
    const selected = selectChecks(checks, args?.checks);
    const transcript = [];
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const results = selected.map(runCheck);
      const summary = format(results);
      transcript.push(`--- attempt ${attempt}/${maxAttempts} ---\n${summary.text}`);
      if (summary.allPassed) {
        transcript.push(`\nAll gates passed on attempt ${attempt}.`);
        break;
      }
      if (attempt === maxAttempts) transcript.push(`\nStill failing after ${maxAttempts} attempts: ${summary.failed.join(", ")}.`);
    }
    return { content: [{ type: "text", text: transcript.join("\n\n") }] };
  }

  throw new Error(`Unknown action "${action}". Use list, run, or loop.`);
}

// ---- Minimal MCP stdio JSON-RPC (newline-delimited) ----------------------

const TOOL = {
  name: "quality_loop",
  description: "Run the project's configured quality gates (tests, lint, build, etc.) and return structured pass/fail results. Commands come only from the config file.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["list", "run", "loop"], description: "list gates, run once, or loop until green" },
      checks: { type: "array", items: { type: "string" }, description: "optional subset of gate names; default = all" },
      maxAttempts: { type: "number", minimum: 1, maximum: 5, description: "loop only: attempts before giving up" },
    },
  },
};

function reply(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}
function replyError(id, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32000, message } }) + "\n");
}

function dispatch(msg) {
  const { id, method, params } = msg;
  if (method === "initialize") {
    return reply(id, {
      protocolVersion: params?.protocolVersion || "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "quality-loop", version: "1.0.0" },
    });
  }
  if (method === "tools/list") return reply(id, { tools: [TOOL] });
  if (method === "tools/call") {
    if (params?.name !== "quality_loop") return replyError(id, `Unknown tool: ${params?.name}`);
    try {
      return reply(id, handleTool(params.arguments || {}));
    } catch (e) {
      return reply(id, { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true });
    }
  }
  if (method === "ping") return reply(id, {});
  // Notifications (no id) need no response.
  if (id !== undefined && id !== null) replyError(id, `Unhandled method: ${method}`);
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    try {
      dispatch(JSON.parse(line));
    } catch {
      // Ignore unparseable lines.
    }
  }
});
process.stdin.on("end", () => process.exit(0));
