# Test Harness

This repo includes a lightweight script for exercising MCP tools without a full MCP client.

## Run the harness

```bash
npm run test:harness
```

The harness currently invokes:
- `hello` (no credentials needed)
- `list_customers` (requires e-conomic credentials by default)
- `create_invoice_draft`, `update_invoice_draft`, `book_invoice_draft`
- `update_customer`
- `list_products`, `upsert_product`
- `list_invoice_drafts`, `get_invoice_draft`
- `list_booked_invoices`, `get_booked_invoice`, `download_invoice_pdf`
- `list_payment_terms`, `list_customer_groups`, `list_vat_zones`

## Use demo credentials

If you want to test against the demo API instead of your own tokens:

```bash
npm run test:harness -- --demo
```

Demo mode forces both tokens to `demo` and only supports GET requests.

## Required environment variables

To test `list_customers`, set these before running the harness:

```bash
export ECONOMIC_APP_SECRET_TOKEN=your_app_secret
export ECONOMIC_AGREEMENT_GRANT_TOKEN=your_agreement_grant
# Optional
export ECONOMIC_BASE_URL=https://restapi.e-conomic.com
```

## Notes

- The harness logs input/output for each tool.
- Errors are caught and printed without stopping the rest of the samples.
- `download_invoice_pdf` returns a base64 payload, which can be large.
