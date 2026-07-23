# quality-loop configuration

Configure checks in `quality-loop/config.json`.

```json
{
  "checks": [
    {
      "name": "tests",
      "command": "npm test",
      "timeoutMs": 120000,
      "description": "Run the unit tests"
    }
  ]
}
```

`name` must be unique and contain only letters, digits, `.`, `_`, or `-`. `command` is intentionally fixed in this file; the MCP client cannot inject a command. `timeoutMs` defaults to 120000 and may not exceed 600000. Add `destructive: true` for a migration, reset, deployment, or any command that changes persistent external state.

The server accepts `action: "list"`, `action: "run"` (with optional `checks`), and `action: "loop"` (with `maxAttempts` from 1 to 5).
