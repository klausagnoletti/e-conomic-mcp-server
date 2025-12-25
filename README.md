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

You'll find all the information on both tokens you need to get started [here](docs/creating-auth-tokens.md). It's a bit complex but not as boring and annoying as it looks like by first glimpse. Pinky promise!

### Recommended ways to supply tokens

- **Local development**: keep secrets in `.env` and run `npm start` from the repo root so `dotenv` loads them.
- **Desktop MCP clients**: either start the server from a shell that has `.env` loaded, or pass env variables in the client config if you want the client to spawn the server for you.
- **CI/shared environments**: use your secret manager (GitHub Actions secrets, etc.) and inject env vars at runtime. Do not commit `.env`.

## Tools

### Connectivity

- `hello`: Sanity check to confirm the server is reachable. Input: `{ "name": "YourName" }`. Output: greeting text.

### Customers

- `list_customers`: List customers with pagination. Input: `{ "pageSize": number, "page": number }`. Output: paginated customer collection.
- `get_customer`: Fetch one customer by customer number. Input: `{ "customerNumber": number }`. Output: customer details.
- `update_customer`: Update customer fields. Input: `{ "customerNumber": number, ...fields }`. Output: updated customer object.

### Products

- `list_products`: List products with pagination. Input: `{ "pageSize": number, "page": number }`. Output: paginated product collection.
- `upsert_product`: Create or update a product. Input: `{ "productNumber": string, "name": string, "salesPrice": number, "productGroupNumber": number, ...optionalFields }`. Output: product object. Note: `productGroupNumber` is required on create.

### Draft invoices

- `list_invoice_drafts`: List draft invoices. Input: `{ "pageSize": number, "page": number }`. Output: paginated draft collection.
- `get_invoice_draft`: Fetch a draft by draft invoice number. Input: `{ "draftInvoiceNumber": number }`. Output: draft invoice details.
- `create_invoice_draft`: Create a new draft invoice. Input: `{ "customerNumber": number, "currency": "DKK", "date": "YYYY-MM-DD", "lines": [...], "createCustomerIfMissing": boolean, "newCustomer": {...} }`. Output: created draft. Note: If a line omits `productNumber`, it defaults to `"1"` to match your current invoicing pattern. If `createCustomerIfMissing` is true and the customer does not exist, a new customer is created from `newCustomer`.
- `update_invoice_draft`: Update a draft invoice. Input: `{ "draftInvoiceNumber": number, ...fields }`. Output: updated draft invoice.
- `book_invoice_draft`: Book a draft into a booked invoice. Input: `{ "draftInvoiceNumber": number }`. Output: booked invoice payload.

### Booked invoices

- `list_booked_invoices`: List booked invoices. Input: `{ "pageSize": number, "page": number }`. Output: paginated booked invoice collection.
- `get_booked_invoice`: Fetch a booked invoice by invoice number. Input: `{ "bookedInvoiceNumber": number }`. Output: booked invoice details.
- `download_invoice_pdf`: Download booked invoice PDF as base64. Input: `{ "bookedInvoiceNumber": number }`. Output: `{ "base64": "..." }`.

### Reference data

- `list_payment_terms`: List payment terms. Input: `{ "pageSize": number, "page": number }`. Output: payment terms collection.
- `list_customer_groups`: List customer groups. Input: `{ "pageSize": number, "page": number }`. Output: customer groups collection.
- `list_vat_zones`: List VAT zones. Input: `{ "pageSize": number, "page": number }`. Output: VAT zones collection.

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
