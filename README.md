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
- `ECONOMIC_DEBUG` (optional, set to `true` to emit JSON debug logs to stderr)
- `ECONOMIC_VALIDATE` (optional, set to `true` to validate requests/responses against the downloaded OpenAPI spec)

You'll find all the information on both tokens you need to get started [here](docs/creating-auth-tokens.md). It's a bit complex but not as boring and annoying as it looks like by first glimpse. Pinky promise!

### Recommended ways to supply tokens

- **Local development**: keep secrets in `.env` and run `npm start` from the repo root so `dotenv` loads them.
- **Desktop MCP clients**: either start the server from a shell that has `.env` loaded, or pass env variables in the client config if you want the client to spawn the server for you.
- **CI/shared environments**: use your secret manager (GitHub Actions secrets, etc.) and inject env vars at runtime. Do not commit `.env`.

### OpenAPI validation (optional)

- Download the official spec: `npm run openapi:download` (uses `OPENAPI_URL` if set; defaults to `https://restapi.e-conomic.com/swagger/v1/swagger.json`).
- Enable runtime validation: set `ECONOMIC_VALIDATE=true`. Requests and responses are checked against the OpenAPI schemas when available. Validation errors return `E_REQUEST_VALIDATION` / `E_RESPONSE_VALIDATION`.

## Tools

Tool list:

- Connectivity: `hello`
- Customers: `list_customers`, `get_customer`, `update_customer`
- Products: `list_products`, `upsert_product`
- Draft invoices: `list_invoice_drafts`, `get_invoice_draft`, `create_invoice_draft`, `update_invoice_draft`, `book_invoice_draft`
- Booked invoices: `list_booked_invoices`, `get_booked_invoice`, `download_invoice_pdf`
- Reference data: `list_payment_terms`, `list_customer_groups`, `list_vat_zones`

### Tool reference

| Category | Tool | Purpose | Arguments | Returns / Notes |
| --- | --- | --- | --- | --- |
| Connectivity | `hello` | Sanity check to confirm the server is reachable. | `{ "name": "YourName" }` | Greeting text. |
| Customers | `list_customers` | List customers with pagination. | `{ "pageSize": number, "page": number }` | Paginated customer collection. |
| Customers | `get_customer` | Fetch one customer by customer number. | `{ "customerNumber": number }` | Customer details. |
| Customers | `update_customer` | Update customer fields. | `{ "customerNumber": number, ...fields }` | Updated customer object. |
| Products | `list_products` | List products with pagination. | `{ "pageSize": number, "page": number }` | Paginated product collection. |
| Products | `upsert_product` | Create or update a product. | `{ "productNumber": string, "name": string, "salesPrice": number, "productGroupNumber": number, ...optionalFields }` | Product object. `productGroupNumber` is required on create. |
| Draft invoices | `list_invoice_drafts` | List draft invoices with pagination. | `{ "pageSize": number, "page": number }` | Paginated draft collection. |
| Draft invoices | `get_invoice_draft` | Fetch a draft invoice. | `{ "draftInvoiceNumber": number }` | Draft invoice details. |
| Draft invoices | `create_invoice_draft` | Create a new draft invoice. | `{ "customerNumber": number, "currency": "DKK", "date": "YYYY-MM-DD", "lines": [...], "createCustomerIfMissing": boolean, "newCustomer": {...} }` | Created draft. If a line omits `productNumber`, it defaults to `"1"`. If `createCustomerIfMissing` is true and the customer does not exist, a new customer is created from `newCustomer`. |
| Draft invoices | `update_invoice_draft` | Update a draft invoice. | `{ "draftInvoiceNumber": number, ...fields }` | Updated draft invoice. |
| Draft invoices | `book_invoice_draft` | Book a draft into a booked invoice. | `{ "draftInvoiceNumber": number }` | Booked invoice payload. |
| Booked invoices | `list_booked_invoices` | List booked invoices with pagination. | `{ "pageSize": number, "page": number }` | Paginated booked invoice collection. |
| Booked invoices | `get_booked_invoice` | Fetch a booked invoice. | `{ "bookedInvoiceNumber": number }` | Booked invoice details. |
| Booked invoices | `download_invoice_pdf` | Download a booked invoice PDF. | `{ "bookedInvoiceNumber": number }` | `{ "base64": "..." }`. |
| Reference data | `list_payment_terms` | List payment terms. | `{ "pageSize": number, "page": number }` | Payment terms collection. |
| Reference data | `list_customer_groups` | List customer groups. | `{ "pageSize": number, "page": number }` | Customer groups collection. |
| Reference data | `list_vat_zones` | List VAT zones. | `{ "pageSize": number, "page": number }` | VAT zones collection. |

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

MIT License. See `LICENSE` for details.
