# Test Harness

This repo includes a lightweight script for exercising MCP tools without a full MCP client.

## Run the harness

```bash
npm run test:harness
```

The harness currently invokes:
- `hello` (no credentials needed)
- `list_customers` (requires e-conomic credentials)

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
