# e-conomic-mcp-server

Perfect for anyone who, like me, is more geek than bookkeeper. Finally there is a bit of fun in bookkeeping. Who would have thought.

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

You'll find all the information on both tokens you need to get started {here}(docs/creating-auth-tokens.md). It's a bit complex but not as boring and annoying as it looks like by first glimpse. Pinky promise!

### Recommended ways to supply tokens

- **Local development**: keep secrets in `.env` and run `npm start` from the repo root so `dotenv` loads them.
- **Desktop MCP clients**: either start the server from a shell that has `.env` loaded, or pass env variables in the client config if you want the client to spawn the server for you.
- **CI/shared environments**: use your secret manager (GitHub Actions secrets, etc.) and inject env vars at runtime. Do not commit `.env`.

## Tool examples

## Tools

- `hello`
- `list_customers`
- `get_customer`
- `list_products`
- `upsert_product`
- `list_invoice_drafts`
- `get_invoice_draft`
- `create_invoice_draft`
- `update_invoice_draft`
- `book_invoice_draft`
- `list_booked_invoices`
- `get_booked_invoice`
- `download_invoice_pdf`
- `update_customer`
- `list_payment_terms`
- `list_customer_groups`
- `list_vat_zones`

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

### book_invoice_draft

Example payload:

```json
{
  "draftInvoiceNumber": 30067
}
```

### upsert_product

Example payload:

```json
{
  "productNumber": "CONSULTING",
  "name": "Consulting Services",
  "salesPrice": 1000,
  "productGroupNumber": 3
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

## MCP client setup

### Claude Desktop

Add an MCP server entry to your Claude Desktop config file and restart Claude Desktop:

```json
{
  "mcpServers": {
    "e-conomic": {
      "command": "node",
      "args": ["/absolute/path/to/e-conomic-mcp-server/src/server.js"],
      "env": {
        "ECONOMIC_APP_SECRET_TOKEN": "your_token",
        "ECONOMIC_AGREEMENT_GRANT_TOKEN": "your_token",
        "ECONOMIC_BASE_URL": "https://restapi.e-conomic.com"
      }
    }
  }
}
```

Common config locations:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### Claude Code

Add the MCP server via Claude Code:

```bash
claude mcp add-json e-conomic '{
  "type": "stdio",
  "command": "node",
  "args": ["/absolute/path/to/e-conomic-mcp-server/src/server.js"],
  "env": {
    "ECONOMIC_APP_SECRET_TOKEN": "...",
    "ECONOMIC_AGREEMENT_GRANT_TOKEN": "...",
    "ECONOMIC_BASE_URL": "https://restapi.e-conomic.com"
  }
}'
```

Use `--scope project` to write a shared `.mcp.json` file in the repo, or `--scope user` to make it global for your user.

### Codex CLI (OpenAI)

Add the MCP server using Codex CLI:

```bash
codex mcp add e-conomic --env ECONOMIC_APP_SECRET_TOKEN=... \
  --env ECONOMIC_AGREEMENT_GRANT_TOKEN=... \
  --env ECONOMIC_BASE_URL=https://restapi.e-conomic.com \
  -- node /absolute/path/to/e-conomic-mcp-server/src/server.js
```

Codex stores MCP configuration in `~/.codex/config.toml` if you prefer to edit it directly.

### Gemini CLI

Add to your Gemini CLI settings (user or project settings):

```json
{
  "mcpServers": {
    "e-conomic": {
      "command": "node",
      "args": ["/absolute/path/to/e-conomic-mcp-server/src/server.js"],
      "env": {
        "ECONOMIC_APP_SECRET_TOKEN": "your_token",
        "ECONOMIC_AGREEMENT_GRANT_TOKEN": "your_token",
        "ECONOMIC_BASE_URL": "https://restapi.e-conomic.com"
      }
    }
  }
}
```

Settings files are located at `~/.gemini/settings.json` (user) or `<project>/.gemini/settings.json` (project). System-wide settings live under `/etc/gemini-cli/settings.json` (Linux), `C:\\ProgramData\\gemini-cli\\settings.json` (Windows), or `/Library/Application Support/GeminiCli/settings.json` (macOS).

## License

MIT
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
