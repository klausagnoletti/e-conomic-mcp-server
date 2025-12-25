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

const main = async () => {
  const server = createHarnessServer();
  registerTools(server);
  const useDemo = process.argv.includes("--demo");

  if (useDemo) {
    process.env.ECONOMIC_APP_SECRET_TOKEN = "demo";
    process.env.ECONOMIC_AGREEMENT_GRANT_TOKEN = "demo";
  }

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
  ];

  for (const sample of samples) {
    console.log(`\n=== Tool: ${sample.name} ===`);
    console.log("Input:", JSON.stringify(sample.input, null, 2));

    try {
      const output = await invokeTool(server, sample.name, sample.input);
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
