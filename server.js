import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "e-conomic-mcp-server",
  version: "0.1.0",
});

server.registerTool(
  "hello",
  {
    title: "Hello",
    description: "Return a friendly greeting.",
    inputSchema: z.object({
      name: z.string().optional().describe("Name to greet"),
    }),
  },
  async ({ name }) => {
    const target = name?.trim() ? name.trim() : "world";
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${target}!`,
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
