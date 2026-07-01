# e-conomic MCP Workflows

This document describes common workflows for AI agents interacting with the e-conomic MCP server. It is designed to help you, the AI, understand how to chain tools together to accomplish complex accounting tasks.

## Safety Best Practices (RECOMMENDED)

Before executing any state-changing operations (Create, Update, Book, Delete), implementing the following checks is highly recommended:

1.  **Check Environment**: Call `get_environment_info` to verify if you are connected to a **Sandbox/Demo** or **Live** environment.
    *   *Prompt*: "Am I in a safe sandbox environment?"
    *   *Action*: If `environment` is "live", explicitly ask the user for confirmation before proceeding with bulk operations or irreversible bookings.

2.  **Validate Payloads**: Use `validate_payload` to dry-run your tool arguments.
    *   *Why*: To catch formatting errors (invalid numbers, missing required fields) before sending requests to the API.
    *   *Usage*: Call `validate_payload` with `{ "toolName": "target_tool", "arguments": { ... } }`. If valid, proceed to call `target_tool`.

---

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

## 3. Payment Reconciliation & Finding Payment Dates

**Goal:** Find payment dates for invoices that show as unpaid in the system but have actually been paid. This is essential for reconciling booked invoices against bank transactions.

**Tools Used:** `list_booked_invoices`, `list_journal_entries`, `get_booked_entry`, `list_bank_transactions`, `match_booked_entries`.

### Scenario
You have invoices that appear unpaid in the system (showing `remainder > 0`) but the payments have been received and recorded in the daily journal or bank account. You need to:
1. Identify which invoices are actually paid
2. Find the payment dates
3. Match the payment entries to the invoices

### Step-by-Step

1. **Identify Unpaid Invoices**: Call `list_booked_invoices` to retrieve all booked invoices.
   - Look for invoices with `remainder > 0` (shows unpaid amount)
   - Note the invoice number, customer, and amount

2. **Search Daily Journal**: Call `list_journal_entries` to find payment entries.
   - Use `fromDate` and `toDate` to filter by expected payment period
   - Look for entries matching invoice amounts or customer information
   - Returns journal entry details including dates and amounts

3. **Get Entry Details**: Call `get_booked_entry` for specific journal entries to see full details.
   - Confirms payment date, amount, and account information
   - Helps verify the payment matches the invoice

4. **Search Bank Transactions**: Call `list_bank_transactions` to see bank account activity.
   - Filter by date range around expected payment dates
   - Shows all transactions with amounts and dates
   - Useful when payments may have been processed through the bank

5. **Match Entries**: Call `match_booked_entries` to reconcile the payment against the invoice.
   - Links the payment entry to the original invoice
   - Marks the invoice as paid in the system

### Example Prompt
> "I have two invoices showing as unpaid (#90 and #97) but I believe they were paid in June and September. Can you search the daily journal for payments matching these invoices and show me the payment dates?"

### Tool Calls

**Step 1 - List unpaid invoices:**
```json
{
  "name": "list_booked_invoices",
  "arguments": {
    "pagesize": 100
  }
}
```

**Step 2 - Search daily journal for payments (June 2025):**
```json
{
  "name": "list_journal_entries",
  "arguments": {
    "journalNumber": 1,
    "fromDate": "2025-06-01",
    "toDate": "2025-06-30",
    "pagesize": 50
  }
}
```

**Step 3 - Get details of specific payment entry:**
```json
{
  "name": "get_booked_entry",
  "arguments": {
    "bookedEntryNumber": 12345
  }
}
```

**Step 4 - List bank transactions (September 2025):**
```json
{
  "name": "list_bank_transactions",
  "arguments": {
    "fromDate": "2025-09-01",
    "toDate": "2025-09-30",
    "pagesize": 50
  }
}
```

**Step 5 - Match payment to invoice:**
```json
{
  "name": "match_booked_entries",
  "arguments": {
    "entries": [
      { "bookedEntryNumber": 90 },
      { "bookedEntryNumber": 12345 }
    ]
  }
}
```

---

## 4. Invoice Drafting

**Goal:** Create and send a sales invoice.

**Tools Used:** `list_customers` (or `create_customer`), `list_products`, `create_invoice_draft`, `book_invoice_draft`.

### Step-by-Step
1.  **Identify Customer**: Use `list_customers` to find the customer number. If new, use `create_customer` (or let `create_invoice_draft` handle it via `createCustomerIfMissing`).
2.  **Identify Product**: Use `list_products` to find the correct product number (e.g. "Consulting Hours").
3.  **Create Draft**: Call `create_invoice_draft` with customer, date, and lines.
4.  **Review**: Show the draft details to the user.
5.  **Book**: Call `book_invoice_draft` to finalize and generate an invoice number.
6.  **Download**: Call `download_invoice_pdf` if the user typically wants the file.
