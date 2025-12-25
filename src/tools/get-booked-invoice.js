import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerGetBookedInvoiceTool = (server) => {
  server.registerTool(
    "get_booked_invoice",
    {
      title: "Get booked invoice",
      description: "Fetch a booked invoice by number.",
      inputSchema: z.object({
        bookedInvoiceNumber: z
          .number()
          .int()
          .positive()
          .describe("Booked invoice number"),
      }),
    },
    async ({ bookedInvoiceNumber }) => {
      try {
        const data = await request(
          "GET",
          `/invoices/booked/${bookedInvoiceNumber}`
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
