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
};

main();
