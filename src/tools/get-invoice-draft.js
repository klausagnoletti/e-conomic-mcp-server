import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerGetInvoiceDraftTool = (server) => {
  server.registerTool(
    "get_invoice_draft",
    {
      title: "Get invoice draft",
      description: "Fetch a draft invoice by number.",
      inputSchema: z.object({
        draftInvoiceNumber: z
          .number()
          .int()
          .positive()
          .describe("Draft invoice number"),
      }),
    },
    async ({ draftInvoiceNumber }) => {
      try {
        const data = await request(
          "GET",
          `/invoices/drafts/${draftInvoiceNumber}`
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
