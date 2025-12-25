# Issue: Scaffold the Node.js MCP server

## Summary
Stand up the baseline Node.js MCP server structure so we have a stable starting point for adding e-conomic tools. This should include a runnable entrypoint, predictable project layout, environment configuration, and developer-friendly scripts.

## Context
We’ve chosen Node.js for this MCP server. We need a clean, minimal baseline that starts reliably and can be extended with e-conomic API integrations and tool definitions. The current `server.js` is a simple hello-world example; we want to formalize the project setup so subsequent work slots in cleanly.

## Goals
- A stable MCP server entrypoint that runs locally with a single command.
- Clear separation between server wiring, tools, and API client logic.
- Environment variable support for e-conomic credentials.
- Basic developer guidance in README (run instructions, env vars).

## Acceptance Criteria
- `npm start` runs the MCP server without errors.
- Project includes a dedicated directory for tools (e.g., `src/tools/`).
- Environment variable loading is documented in `README.md`.
- Server entrypoint wires up tools from a single registry module.

## Implementation Notes
- Keep the runtime simple—avoid TypeScript for now unless there’s a strong reason.
- Prefer ESM modules (`"type": "module"`) to align with current setup.
- Use `dotenv` (or equivalent) only if necessary; otherwise document required env vars.

## Tasks
1. Create a `src/` directory with `server.js` (or move the existing entrypoint).
2. Add a `src/tools/index.js` that registers tools on the MCP server instance.
3. Update `package.json` scripts if paths move.
4. Update `README.md` with run instructions and environment variable placeholders.

## Out of Scope
- Implementing any e-conomic API calls (handled in later issues).
- Tool business logic (draft invoices, receipt matching).
