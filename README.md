# e-conomic-mcp-server

## Getting started

Install dependencies:

```bash
npm install
```

Run the server:

```bash
npm start
```

## Environment variables

The server reads e-conomic credentials from the environment:

- `ECONOMIC_APP_SECRET_TOKEN` (required)
- `ECONOMIC_AGREEMENT_GRANT_TOKEN` (required)
- `ECONOMIC_BASE_URL` (optional, defaults to `https://restapi.e-conomic.com`)

## Tool examples

### create_invoice_draft

Example payload:

```json
{
  "customerNumber": 1,
  "createCustomerIfMissing": true,
  "newCustomer": {
    "name": "Acme ApS",
    "currency": "DKK",
    "paymentTermsNumber": 1,
    "customerGroupNumber": 1,
    "vatZoneNumber": 1
  },
  "currency": "DKK",
  "date": "2025-12-25",
  "lines": [
    {
      "description": "Consulting",
      "quantity": 1,
      "unitPrice": 1000
    }
  ]
}
```

Note: If `productNumber` is omitted on a line, the tool defaults it to `"1"` to match your existing invoicing pattern.

### update_invoice_draft

Example payload:

```json
{
  "draftInvoiceNumber": 30067,
  "date": "2025-12-26",
  "dueDate": "2026-01-10",
  "lines": [
    {
      "description": "Consulting",
      "quantity": 2,
      "unitPrice": 1000
    }
  ]
}
```

### update_customer

Example payload:

```json
{
  "customerNumber": 90001,
  "name": "Sandbox Test Customer Updated",
  "email": "billing@example.com",
  "paymentTermsNumber": 1
}
```
