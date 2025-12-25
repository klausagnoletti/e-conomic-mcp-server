# Issue: Add a local test harness for tools

## Summary
Create a lightweight local test harness to call MCP tools directly with sample payloads, so we can validate behavior without a full MCP client setup.

## Context
We need quick feedback while building tools. A simple script that imports the tool handlers and runs them with test data will speed up development and debugging.

## Goals
- A script that calls tool handlers directly with sample input.
- A place to store example payloads and expected outputs.
- Clear instructions on how to run the harness.

## Acceptance Criteria
- `npm run test:harness` (or similar) runs the harness script.
- Harness logs input and output clearly.
- Includes at least one sample for `create_invoice_draft` and `book_and_match_receipt`.

## Tasks
1. Add `scripts/test-harness.js` (or `tools/harness.js`) that imports the tool handlers.
2. Load sample payloads from a JSON file or inline constants.
3. Add an npm script to run the harness.
4. Document usage in README.

## Out of Scope
- Automated tests or CI integration.
- Mocking the e-conomic API (optional future enhancement).
