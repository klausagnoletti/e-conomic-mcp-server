import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import registerTools from "../src/tools/index.js";

dotenv.config();
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

const createHarnessServer = () => {
  const tools = [];
  return {
    tools,
    registerTool(name, config, handler) {
      tools.push({ name, config, handler });
    },
  };
};

const invokeTool = async (server, name, input) => {
  const tool = server.tools.find((entry) => entry.name === name);
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  return tool.handler(input);
};

const resolvePlaceholders = (input, context) => {
  if (input === "$lastDraft") {
    return context.lastDraftNumber;
  }

  if (input === "$lastBooked") {
    return context.lastBookedInvoiceNumber;
  }

  if (Array.isArray(input)) {
    return input.map((value) => resolvePlaceholders(value, context));
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        resolvePlaceholders(value, context),
      ])
    );
  }

  return input;
};

const captureIdentifiers = (output, context) => {
  const text = output?.content?.[0]?.text;
  if (!text) {
    return;
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed?.draftInvoiceNumber) {
      context.lastDraftNumber = parsed.draftInvoiceNumber;
    }
    if (parsed?.bookedInvoiceNumber) {
      context.lastBookedInvoiceNumber = parsed.bookedInvoiceNumber;
    }
  } catch (error) {
    // Ignore non-JSON tool output.
  }
};

const hasNullPlaceholder = (input) => {
  if (input === null) {
    return true;
  }
  if (Array.isArray(input)) {
    return input.some(hasNullPlaceholder);
  }
  if (input && typeof input === "object") {
    return Object.values(input).some(hasNullPlaceholder);
  }
  return false;
};

const main = async () => {
  const server = createHarnessServer();
  registerTools(server);
  const useDemo = process.argv.includes("--demo");

  if (useDemo) {
    process.env.ECONOMIC_APP_SECRET_TOKEN = "demo";
    process.env.ECONOMIC_AGREEMENT_GRANT_TOKEN = "demo";
  }

  const secretToken = process.env.ECONOMIC_APP_SECRET_TOKEN?.trim();
  const grantToken = process.env.ECONOMIC_AGREEMENT_GRANT_TOKEN?.trim();
  const tokenSuffix = (value) =>
    value ? `${value.slice(-4)} (len ${value.length})` : "missing";

  console.log("Token check:");
  console.log(`- AppSecretToken: ${tokenSuffix(secretToken)}`);
  console.log(`- AgreementGrantToken: ${tokenSuffix(grantToken)}`);

  const context = {
    lastDraftNumber: null,
    lastBookedInvoiceNumber: null,
  };

  const samples = [
    {
      name: "hello",
      input: { name: "Codex" },
    },
    {
      name: "list_customers",
      input: { pageSize: 1, page: 1 },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "get_customer",
      input: { customerNumber: 90001 },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "list_products",
      input: { pageSize: 5, page: 1 },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "upsert_product",
      input: {
        productNumber: "CONSULTING",
        name: "Consulting Services",
        salesPrice: 1000,
        productGroupNumber: 3,
      },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "create_invoice_draft",
      input: {
        customerNumber: 90001,
        createCustomerIfMissing: true,
        newCustomer: {
          name: "Sandbox Test Customer",
          currency: "DKK",
          paymentTermsNumber: 1,
          customerGroupNumber: 1,
          vatZoneNumber: 1,
          email: "sandbox-test@example.com",
          city: "Copenhagen",
          country: "Denmark",
        },
        currency: "DKK",
        date: "2015-06-23",
        lines: [
          {
            description: "Test service",
            quantity: 1,
            unitPrice: 100,
          },
        ],
      },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "list_invoice_drafts",
      input: { pageSize: 5, page: 1 },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "get_invoice_draft",
      input: { draftInvoiceNumber: "$lastDraft" },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "update_invoice_draft",
      input: {
        draftInvoiceNumber: "$lastDraft",
        date: "2015-06-24",
        dueDate: "2015-07-08",
        lines: [
          {
            description: "Test service (updated)",
            quantity: 2,
            unitPrice: 120,
          },
        ],
      },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "book_invoice_draft",
      input: {
        draftInvoiceNumber: "$lastDraft",
      },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "list_booked_invoices",
      input: { pageSize: 5, page: 1 },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "get_booked_invoice",
      input: { bookedInvoiceNumber: "$lastBooked" },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "download_invoice_pdf",
      input: { bookedInvoiceNumber: "$lastBooked" },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "update_customer",
      input: {
        customerNumber: 90001,
        name: "Sandbox Test Customer Updated",
        email: "billing@example.com",
      },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "list_payment_terms",
      input: { pageSize: 5, page: 1 },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "list_customer_groups",
      input: { pageSize: 5, page: 1 },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
    {
      name: "list_vat_zones",
      input: { pageSize: 5, page: 1 },
      envHint:
        "Requires ECONOMIC_APP_SECRET_TOKEN and ECONOMIC_AGREEMENT_GRANT_TOKEN",
    },
  ];

  for (const sample of samples) {
    console.log(`\n=== Tool: ${sample.name} ===`);
    const resolvedInput = resolvePlaceholders(sample.input, context);
    if (hasNullPlaceholder(resolvedInput)) {
      console.log("Input: skipped (missing dependency)");
      continue;
    }
    console.log("Input:", JSON.stringify(resolvedInput, null, 2));

    try {
      const output = await invokeTool(server, sample.name, resolvedInput);
      captureIdentifiers(output, context);
      console.log("Output:", JSON.stringify(output, null, 2));
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      if (sample.envHint) {
        console.error(sample.envHint);
      }
    }
  }
};

main().catch((error) => {
  console.error("Harness failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
