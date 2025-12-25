# Issue: Add e-conomic API client (auth + request helper)

## Summary
Create a small, reusable API client module for e-conomic that handles authentication headers, base URL configuration, request/response handling, and error normalization.

## Context
All tools (draft invoices, booking receipts, matching receipts) will call the e-conomic REST API. A shared client reduces duplication and keeps tool code focused on mapping input to the correct endpoints.

## Goals
- A centralized request helper for the e-conomic API.
- Support for API key + app secret authentication (and a placeholder for OAuth tokens later if needed).
- Consistent error handling with informative messages for tool responses.

## Acceptance Criteria
- API client is located in `src/economic/api-client.js` (or similar) and exported for reuse.
- Client reads credentials from environment variables (e.g., `ECONOMIC_APP_SECRET`, `ECONOMIC_API_KEY`).
- Requests include required headers for e-conomic auth.
- Non-2xx responses return structured errors (status, message, details).

## Implementation Notes
- Base URL should default to `https://restapi.e-conomic.com` (confirm in docs).
- Use `fetch` in Node 18+ (available globally) or a small dependency if needed.
- Avoid throwing raw errors; wrap them with consistent shape to return via MCP tools.

## Tasks
1. Add API client module with `request(method, path, body)` helper.
2. Include `validateCredentials()` to fail fast when env vars are missing.
3. Add basic logging (request method/path, but never log secrets).
4. Export a typed response/error object for consistent tool handling.

## Out of Scope
- Tool definitions or business logic.
- OAuth flow support (future enhancement).
