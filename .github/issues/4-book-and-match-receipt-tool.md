# Issue: Implement `book_and_match_receipt` tool

## Summary
Add an MCP tool that books a receipt from the e-conomic inbox and matches it with a booking entry. The tool should accept a receipt ID and booking details, then return booking + match status.

## Context
Many accounting workflows depend on quickly booking receipts and matching them to transactions. This tool should provide a simple, structured interface for that flow.

## Goals
- Provide a single tool that performs both booking and matching.
- Validate input fields and surface clear errors.
- Keep the internal API workflow flexible (may require multiple e-conomic endpoints).

## Acceptance Criteria
- Tool name `book_and_match_receipt` is registered in the MCP server.
- Input schema validates receipt ID, amount, booking date, and account info.
- Tool returns booking ID and match status.
- Errors include actionable hints (e.g., receipt not found, amount mismatch).

## Suggested Input Schema
- `receiptId` (string)
- `amount` (number)
- `currency` (string)
- `date` (string, ISO 8601)
- `account` (string or number)
- `text` (string, optional)

## Tasks
1. Add tool schema in `src/tools/book-and-match-receipt.js`.
2. Determine required e-conomic API endpoints (inbox receipt, booking, match).
3. Implement sequential API calls if needed (book -> match).
4. Return a compact response: `{ bookingId, matched: true/false }`.

## Out of Scope
- Auto-detection of accounts or VAT codes.
- Batch processing of receipts.
