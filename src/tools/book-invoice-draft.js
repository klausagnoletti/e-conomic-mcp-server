import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

const fetchBookingInstructions = (draftInvoiceNumber) =>
  request(
    "GET",
    `/invoices/drafts/${draftInvoiceNumber}/templates/booking-instructions`
  );

export const registerBookInvoiceDraftTool = (server) => {
  server.registerTool(
    "book_invoice_draft",
    {
      title: "Book invoice draft",
      description: "Book a draft invoice into a booked invoice.",
      inputSchema: z.object({
        draftInvoiceNumber: z
          .number()
          .int()
          .positive()
          .describe("Draft invoice number"),
        bookWithNumber: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional booked invoice number"),
      }),
    },
    async ({ draftInvoiceNumber, bookWithNumber }) => {
      try {
        const payload = await fetchBookingInstructions(draftInvoiceNumber);

        if (bookWithNumber) {
          payload.bookWithNumber = bookWithNumber;
        }

        const data = await request("POST", "/invoices/booked", payload);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  bookedInvoiceNumber: data?.bookedInvoiceNumber,
                  draftInvoiceNumber: data?.draftInvoiceNumber,
                  self: data?.self,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return errorToContent(error);
      }
    }
  );
};
