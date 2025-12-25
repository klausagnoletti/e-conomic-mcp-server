import { z } from "zod";

export const registerHelloTool = (server) => {
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
};
