import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerListCustomersTool = (server) => {
  server.registerTool(
    "list_customers",
    {
      title: "List customers",
      description: "Fetch a page of customers from the e-conomic API.",
      inputSchema: z.object({
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe("Number of customers per page (default 100)."),
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Page number to fetch (default 1)."),
      }),
    },
    async ({ pageSize, page }) => {
      const resolvedPageSize = pageSize ?? 100;
      const resolvedPage = page ?? 1;
      const skipPages = resolvedPage - 1;
      const query = new URLSearchParams({
        pagesize: String(resolvedPageSize),
        skippages: String(skipPages),
      });

      try {
        const data = await request("GET", `/customers?${query.toString()}`);

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
