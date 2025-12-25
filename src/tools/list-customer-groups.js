import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerListCustomerGroupsTool = (server) => {
  server.registerTool(
    "list_customer_groups",
    {
      title: "List customer groups",
      description: "Fetch a page of customer groups.",
      inputSchema: z.object({
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe("Number of customer groups per page (default 100)."),
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Page number to fetch (default 1)."),
      }),
    },
    async ({ pageSize, page }) => {
      try {
        const resolvedPageSize = pageSize ?? 100;
        const resolvedPage = page ?? 1;
        const skipPages = resolvedPage - 1;
        const query = new URLSearchParams({
          pagesize: String(resolvedPageSize),
          skippages: String(skipPages),
        });

        const data = await request(
          "GET",
          `/customer-groups?${query.toString()}`
        );
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
