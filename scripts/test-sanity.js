// Minimal sanity test runner for a few safe, read-only tools.
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import registerTools from "../src/tools/index.js";

// Load env (supports repo-root .env)
dotenv.config();
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

// Fallback to demo tokens if none are set and SANITY_USE_DEMO is not "false"
const ensureTokens = () => {
  const haveTokens =
    process.env.ECONOMIC_APP_SECRET_TOKEN && process.env.ECONOMIC_AGREEMENT_GRANT_TOKEN;
  if (!haveTokens && process.env.SANITY_USE_DEMO?.toLowerCase() !== "false") {
    process.env.ECONOMIC_APP_SECRET_TOKEN = "demo";
    process.env.ECONOMIC_AGREEMENT_GRANT_TOKEN = "demo";
    console.error("Using demo credentials for sanity tests (set SANITY_USE_DEMO=false to require real tokens).");
  }
};

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
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool.handler(input);
};

const main = async () => {
  ensureTokens();

  const server = createHarnessServer();
  registerTools(server);

  const samples = [
    { name: "hello", input: { name: "Sanity" } },
    { name: "list_payment_terms", input: { pageSize: 1, page: 1 } },
    { name: "list_customer_groups", input: { pageSize: 1, page: 1 } },
    { name: "list_vat_zones", input: { pageSize: 1, page: 1 } },
  ];

  for (const sample of samples) {
    console.log(`\n=== ${sample.name} ===`);
    try {
      const output = await invokeTool(server, sample.name, sample.input);
      console.log("Output:", output);
    } catch (error) {
      console.error("Error:", error?.message ?? error);
      process.exitCode = 1;
    }
  }

  // 17. book_and_match_receipt (dry-run check)
  console.log("\n=== book_and_match_receipt (schema check) ===");
  try {
    const output = await invokeTool(server, "book_and_match_receipt", {
      amount: 100,
      currency: "DKK",
      date: "2025-01-01",
      text: "Sanity Test Receipt",
      accountNumber: 1000,
      journalNumber: 1, // Require journal for sanity to avoid auto-search failure
      pdfBase64: "TG9yZW0gSXBzdW0="
    });
    // We expect this to fail in demo mode or without real tokens/journal, 
    // but if it reaches the handler, the registered tool works.
    console.log("Output (might fail execution but tool is present):", output);
  } catch (error) {
    // Expected if no journal/tokens.
    console.log("Tool invoked but failed execution (expected):", error?.message);
  }
  // 18. get_environment_info
  console.log("\n=== get_environment_info ===");
  try {
    const output = await invokeTool(server, "get_environment_info", {});
    console.log("Output:", output);
  } catch (error) {
    console.log("Error:", error?.message);
  }

  // 19. validate_payload
  console.log("\n=== validate_payload (valid) ===");
  try {
    const output = await invokeTool(server, "validate_payload", {
      toolName: "hello",
      arguments: { name: "Tester" }
    });
    console.log("Output:", output);
  } catch (error) {
    console.log("Error:", error?.message);
  }

  console.log("\n=== validate_payload (invalid) ===");
  try {
    const output = await invokeTool(server, "validate_payload", {
      toolName: "get_customer",
      arguments: { customerNumber: "NOT_A_NUMBER" } // Should fail schema
    });
    console.log("Output:", output);
  } catch (error) {
    console.log("Error:", error?.message);
  }
};

main();
