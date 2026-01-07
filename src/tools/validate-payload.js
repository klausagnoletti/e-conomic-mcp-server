import { z } from "zod";
import { errorToContent } from "./tool-helpers.js";

// We need access to the tool registry or schemas.
// Since pure MCP SDK doesn't easily expose a "getToolSchema" to the tool handler itself 
// (unless we pass the server instance or specific schema map),
// we will need to maintain a map or access the server's internal tool capabilities if possible.
// 
// Strategy: registerValidatePayloadTool will function as a "meta-tool".
// It needs access to the generated Zod schemas of OTHER tools.
// 
// Solution: We will pass a `schemas` object to this register function.
// In index.js, we will populate this map as we register tools.

export const registerValidatePayloadTool = (server, schemas) => {
    server.registerTool(
        "validate_payload",
        {
            title: "Validate Tool Payload (Dry Run)",
            description: "Validate arguments for a specific tool without executing it. Use this to check your inputs before running dangerous operations.",
            inputSchema: z.object({
                toolName: z.string().describe("The name of the tool to validate against (e.g. 'payout_employee')."),
                arguments: z.any().describe("The JSON arguments object you intend to send."),
            }),
        },
        async ({ toolName, arguments: args }) => {
            try {
                const schema = schemas.get(toolName);

                if (!schema) {
                    return {
                        content: [{ type: "text", text: JSON.stringify({ valid: false, error: `Tool '${toolName}' not found or has no schema registered.` }) }]
                    };
                }

                const result = schema.safeParse(args);

                if (result.success) {
                    return {
                        content: [{ type: "text", text: JSON.stringify({ valid: true, message: "Payload is valid." }, null, 2) }]
                    };
                } else {
                    return {
                        content: [{ type: "text", text: JSON.stringify({ valid: false, errors: result.error.errors }, null, 2) }]
                    };
                }
            } catch (error) {
                return errorToContent(error);
            }
        }
    );
};
