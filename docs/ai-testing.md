# Sanity testing with an AI agent

Use this when you want an AI assistant (Claude, Codex/Gemini CLI, etc.) to run the lightweight sanity checks we ship with the repo.

## What the script does
- Runs a minimal set of read-only tools: `hello`, `list_payment_terms`, `list_customer_groups`, `list_vat_zones`.
- Loads environment variables from `.env` in the repo root.
- If no tokens are present and `SANITY_USE_DEMO` is **not** set to `false`, the script falls back to `demo/demo` credentials so it can still run without real secrets.

## Stage 1: quick script (you run it)
```
npm install
npm run test:sanity
```
- Uses `.env` if present; otherwise falls back to `demo/demo` unless `SANITY_USE_DEMO=false`.
- Confirms the MCP can reach the API and that credentials are wired.

## Expected outcome
- Each tool prints an `Output` block with JSON data.
- Non-zero exit code or `Error:` lines mean a failure. Common causes:
  - Missing tokens and `SANITY_USE_DEMO=false`.
  - Network/auth issues with your e-conomic environment.

## Tips
- For live testing only, export `SANITY_USE_DEMO=false` to force the run to fail fast if real tokens are absent.
- Keep `.env` untracked (already in `.gitignore`). Store real tokens only locally.***

## Stage 2: “real life” agent prompt (no scripts)
After Stage 1 passes, give this to your AI agent to exercise the MCP end-to-end without asking it to run scripts:
```
You are connected to the e-conomic MCP. Using the available tools:
1) List one customer and summarize it.
2) Create a new customer in the sandbox with a realistic name/address; return its ID.
3) Create an invoice draft for that customer with one service line, qty 2, realistic unit price, and the default VAT zone.
4) Fetch and show the draft invoice you just created.
Report each step’s tool inputs and outputs. If any step fails, stop and summarize the error.
```
- Keep this in the sandbox to avoid touching production data.
- Swap the scenario for any workflow you want to validate; the key is a natural-language, multi-step check.
