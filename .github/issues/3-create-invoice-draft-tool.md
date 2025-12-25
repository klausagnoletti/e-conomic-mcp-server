# Issue: Implement `create_invoice_draft` tool

## Summary
Add an MCP tool to create invoice drafts in e-conomic using structured input. The tool should validate inputs, call the e-conomic API, and return a clear draft identifier and status.

## Context
The first core capability is creating invoice drafts. This tool should be straightforward for a non-technical user: provide customer info and line items, get a draft invoice back.

## Goals
- A single MCP tool named `create_invoice_draft`.
- Input schema capturing essential invoice draft fields.
- A clean mapping from tool input to the e-conomic draft invoice endpoint.

## Acceptance Criteria
- Tool is registered in the MCP server and visible to clients.
- Input schema validates required fields (customer number/ID, currency, line items).
- Tool returns a response with draft invoice ID/number and status.
- Errors include a user-friendly message plus raw API details.

## Suggested Input Schema
- `customerId` (string or number)
- `currency` (string, e.g., "DKK")
- `date` (string, ISO 8601)
- `lines` (array)
  - `description` (string)
  - `quantity` (number)
  - `unitPrice` (number)
  - `vatRate` (number or code)

## Tasks
1. Define `create_invoice_draft` tool schema in `src/tools/create-invoice-draft.js`.
2. Map input to the e-conomic draft invoice endpoint payload.
3. Call the API client and return `draftInvoiceNumber` or `id` from the response.
4. Add example usage in README or a sample payload snippet.

## Out of Scope
- Booking invoices or sending them.
- Advanced invoice features (discounts, layouts, project refs).
