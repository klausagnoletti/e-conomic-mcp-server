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
