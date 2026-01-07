# e-conomic MCP Workflows

This document describes common workflows for AI agents interacting with the e-conomic MCP server. It is designed to help you, the AI, understand how to chain tools together to accomplish complex accounting tasks.

## 1. Book and Match Receipt (Expense Management)

**Goal:** Process a receipt PDF, book the expense to a cost account, and optionally match it to a bank transaction.

**Tools Used:** `book_and_match_receipt` (All-in-one).

### Scenario
The user uploads a receipt image/PDF for "Lunch with client" (500 DKK) and asks you to book it. They might also provide a bank transaction ID to match it against.

### Step-by-Step
1.  **Analyze Request**: Extract the following data:
    *   **Amount**: 500.00
    *   **Currency**: DKK
    *   **Date**: 2023-10-25
    *   **Text**: "Lunch with client"
    *   **Account**: Find the "Representation" or "Meals" account (e.g. 3600).
    *   **PDF**: You must read the file and convert it to a **Base64 string**.
2.  **Execute Tool**: Call `book_and_match_receipt`.
    *   If the user didn't specify a journal, the tool will auto-select one.
    *   If the user provided a match ID (e.g. from a previous `list_booked_entries` call), include it.

### Example Prompt
> "Here is a receipt for a taxi (125 DKK). Please book it to the Travel account and match it with the bank transaction #10203 I showed you earlier."

### Tool Call
```json
{
  "name": "book_and_match_receipt",
  "arguments": {
    "amount": 125.00,
    "currency": "DKK",
    "date": "2023-10-25",
    "text": "Taxi to airport",
    "accountNumber": 3600,
    "pdfBase64": "<base64_string_of_pdf>",
    "matchWithBookedEntryNumber": 10203
  }
}
```

---

## 2. Advanced Journal Entry (Manual Booking)

**Goal:** Create a complex journal entry (e.g. split booking, accruals) and attach documentation manually.

**Tools Used:** `create_draft_entry`, `attach_pdf_to_entry`, `book_journal`.

### Scenario
You need to book a monthly salary run or a complex invoice that requires multiple lines (split across projects or departments).

### Step-by-Step
1.  **create_draft_entry**: Create the lines in a specific journal.
    *   *Input*: `journalNumber`, `entries` array (Account, Amount, Text, Date).
    *   *Output*: Returns created entry details, including `voucherNumber`.
2.  **attach_pdf_to_entry**: Attach the supporting document (e.g. payroll PDF).
    *   *Input*: `journalNumber`, `accountingYear`, `voucherNumber` (from step 1), `attachment` (Base64).
3.  **Book Journal**: Use a tool (if available) or instruct the user to book it in the UI if verification is needed.
    *   *Note*: The `book_and_match_receipt` tool handles simple single-voucher bookings, but for multi-voucher headers, manual composition is better.

---

## 3. Invoice Drafting

**Goal:** Create and send a sales invoice.

**Tools Used:** `list_customers` (or `create_customer`), `list_products`, `create_invoice_draft`, `book_invoice_draft`.

### Step-by-Step
1.  **Identify Customer**: Use `list_customers` to find the customer number. If new, use `create_customer` (or let `create_invoice_draft` handle it via `createCustomerIfMissing`).
2.  **Identify Product**: Use `list_products` to find the correct product number (e.g. "Consulting Hours").
3.  **Create Draft**: Call `create_invoice_draft` with customer, date, and lines.
4.  **Review**: Show the draft details to the user.
5.  **Book**: Call `book_invoice_draft` to finalize and generate an invoice number.
6.  **Download**: Call `download_invoice_pdf` if the user typically wants the file.
