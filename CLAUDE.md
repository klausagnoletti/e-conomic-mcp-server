# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides AI assistants with tools to interact with the e-conomic REST API for bookkeeping operations. The server uses the `@modelcontextprotocol/sdk` to register tools that can create and manage customers, products, draft invoices, and booked invoices.

## Required Environment Variables

The server requires e-conomic API credentials:
- `ECONOMIC_APP_SECRET_TOKEN` (required)
- `ECONOMIC_AGREEMENT_GRANT_TOKEN` (required)

Optional environment variables:
- `ECONOMIC_BASE_URL` (defaults to `https://restapi.e-conomic.com`)
- `ECONOMIC_DEBUG` (set to `true` to emit JSON debug logs to stderr)
- `ECONOMIC_VALIDATE` (set to `true` to validate requests/responses against OpenAPI schema; requires running `npm run openapi:download` first)

For local development, credentials can be stored in a `.env` file at the repository root. For CI/shared environments, inject credentials at runtime via your secret manager.

## Development Commands

### Start the server
```bash
npm start
```

### Run tests
```bash
npm test
# or
npm run test:harness
```

The test harness (`scripts/test-harness.js`) invokes all registered tools with sample data to verify functionality. It supports placeholder replacement (`$lastDraft`, `$lastBooked`) to chain dependent operations. See `docs/test-harness.md` for detailed information.

### Quick sanity check
```bash
npm run test:sanity
```

Runs a basic connectivity test using demo tokens if credentials are not set. Useful for verifying the server can reach the e-conomic API.

### OpenAPI validation (optional)
```bash
npm run openapi:download
```

Downloads the official e-conomic OpenAPI specification to the repository. When `ECONOMIC_VALIDATE=true` is set, requests and responses are automatically validated against the schema. Validation errors return `E_REQUEST_VALIDATION` or `E_RESPONSE_VALIDATION` error codes.

## Architecture

### Entry Point
- `src/server.js` - Creates the MCP server instance, registers all tools, and connects to stdio transport

### Tool Registration Pattern
All tools follow a consistent registration pattern:
1. Tools are defined in individual files under `src/tools/`
2. Each tool file exports a `register*Tool(server)` function
3. `src/tools/index.js` imports and calls all registration functions
4. Tools use Zod schemas for input validation
5. Tools return standardized MCP responses with `{ content: [{ type: "text", text: "..." }] }`

### API Client Layer
- `src/economic/api-client.js` - Centralizes all HTTP communication with e-conomic API
  - `validateCredentials()` - Checks for required env vars
  - `request(method, path, body)` - Makes authenticated requests
  - `EconomicApiError` - Custom error class with `status`, `errorCode`, `details`, `hint` fields

All tools should use the `request()` function and handle `EconomicApiError` exceptions.

### Error Handling
Tools should catch `EconomicApiError` and return error details in MCP format. Use `errorToContent()` helper from `src/tools/tool-helpers.js` for consistency.

### Logging
- `src/utils/logger.js` provides structured JSON logging to stderr
- `logDebug(message, fields)` - Only logs when `ECONOMIC_DEBUG=true`
- `logEvent(level, message, fields)` - Logs at any level

### Testing & Validation
- `src/utils/openapi-validator.js` - Validates requests/responses against downloaded OpenAPI spec
- `src/utils/openapi-loader.js` - Loads and caches OpenAPI schemas from file
- Test harness supports placeholder replacement to chain dependent operations:
  - `$lastDraft` - Returns the draft invoice number from the previous `create_invoice_draft` call
  - `$lastBooked` - Returns the booked invoice number from the previous `book_invoice_draft` call
- Schema tracking in `src/tools/index.js` captures Zod schemas for validation tool usage

### Tool Categories
- **Connectivity**: `hello` (sanity check)
- **Customers**: `list_customers`, `get_customer`, `update_customer`
- **Products**: `list_products`, `upsert_product`
- **Draft invoices**: `list_invoice_drafts`, `get_invoice_draft`, `create_invoice_draft`, `update_invoice_draft`, `book_invoice_draft`
- **Booked invoices**: `list_booked_invoices`, `get_booked_invoice`, `download_invoice_pdf`
- **Journals**: `create_draft_entry`, `attach_pdf_to_entry`, `match_booked_entries`, `book_and_match_receipt`, `list_journal_entries`, `get_booked_entry`, `list_bank_transactions`
- **Reference data**: `list_payment_terms`, `list_customer_groups`, `list_vat_zones`
- **Utility/Safety**: `get_environment_info`, `validate_payload`

### Special Tool Behaviors

**create_invoice_draft**:
- If `createCustomerIfMissing=true` and customer doesn't exist, creates the customer first
- If line `productNumber` is omitted, defaults to `"1"`
- Fetches invoice template from e-conomic API if required fields (layout, payment terms, recipient) are missing

**upsert_product**:
- `productGroupNumber` is required when creating a new product
- Updates existing product if `productNumber` already exists

### Journal Tools

**create_draft_entry**, **attach_pdf_to_entry**, **match_booked_entries**, **book_and_match_receipt**:
- Tools for managing journal entries and matching receipts to accounting records
- Support attaching PDF documents to vouchers for receipt tracking
- Provide matching capabilities to reconcile booked entries

**list_journal_entries**:
- Query the daily journal (daglig journal) with optional date range filtering
- Parameters: journalNumber, fromDate, toDate, pagination (skippages, pagesize)
- Useful for finding payment entries and reconciling against invoices

**get_booked_entry**:
- Retrieve detailed information about a specific booked journal entry (voucher)
- Shows payment details, amounts, and transaction dates
- Essential for verifying payment information

**list_bank_transactions**:
- Fetch bank transactions from integrated bank account
- Supports date range filtering and pagination
- Shows transaction dates and amounts for payment reconciliation
- Parameters: accountNumber, fromDate, toDate, pagination (skippages, pagesize)

### Utility & Safety Tools

**get_environment_info**:
- Returns the current environment (Sandbox or Live)
- Useful for AI agents to determine safe operation scope

**validate_payload**:
- Dry-run validation of any tool's input arguments against its Zod schema
- Returns validation errors without executing the tool
- Helps catch malformed inputs before tool invocation
- Usage: `{ "toolName": "create_invoice_draft", "arguments": {...} }`

## Adding New Tools

1. Create `src/tools/my-new-tool.js`:
   ```javascript
   import { z } from "zod";
   import { request } from "../economic/api-client.js";
   import { errorToContent } from "./tool-helpers.js";

   export const registerMyNewTool = (server) => {
     server.registerTool(
       "my_new_tool",
       {
         title: "My New Tool",
         description: "What this tool does",
         inputSchema: z.object({
           // ... zod schema
         }),
       },
       async (input) => {
         try {
           const data = await request("GET", "/some/endpoint");
           return {
             content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
           };
         } catch (error) {
           return errorToContent(error);
         }
       }
     );
   };
   ```

2. Import and register in `src/tools/index.js`

3. Add test case to `scripts/test-harness.js`

## Documentation

User-facing documentation is located in the `docs/` directory:
- **`docs/workflows.md`** - Common use case workflows and examples
- **`docs/ai-testing.md`** - Guide for testing tools with AI models
- **`docs/test-harness.md`** - Detailed test harness documentation
- **`docs/creating-auth-tokens.md`** - How to create and manage e-conomic API credentials

These guides provide practical examples and best practices for using the MCP server.
