import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerGetCustomerTool = (server) => {
  server.registerTool(
    "get_customer",
    {
      title: "Get customer",
      description: "Fetch a single customer by customer number.",
      inputSchema: z.object({
        customerNumber: z
          .number()
          .int()
          .positive()
          .describe("Customer number in e-conomic"),
      }),
    },
    async ({ customerNumber }) => {
      try {
        const data = await request("GET", `/customers/${customerNumber}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (error) {
        return errorToContent(error);
      }
    }
  );
};
