import { z } from "zod";
import { openapiRequest } from "../economic/openapi-client.js";
import { errorToContent } from "./tool-helpers.js";

const JOURNALS_API = "journalsapi/v15.0.0";

// entryTypeNumber 2 = Customer Payment (per the Journals OpenAPI DraftEntry schema).
// Journal 2 ("Indbetalinger") is preconfigured with customerContraAccount 5820,
// so the bank leg is handled automatically.
export const registerBookCustomerPaymentTool = (server) => {
  server.registerTool(
    "book_customer_payment",
    {
      title: "Book Customer Payment",
      description:
        "Register (and optionally book) an incoming customer payment against a specific invoice via the e-conomic OpenAPI Journals API (entry type 2, Customer Payment). Booking settles the invoice so it stops showing as unpaid. Defaults to a dry-run: book=false creates only an inspectable draft entry. NOTE: booking a journal books ALL of its pending draft entries — journal 2 (Indbetalinger) is normally empty, but confirm before booking if unsure.",
      inputSchema: z.object({
        customerNumber: z
          .number()
          .int()
          .positive()
          .describe("Customer number (debtor) the payment is credited to."),
        invoiceNumber: z
          .string()
          .describe("The booked invoice number to settle (customerInvoiceNumber)."),
        amount: z
          .number()
          .positive()
          .describe("Payment amount in the entry currency (gross, matching the invoice)."),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe("Value date of the payment (YYYY-MM-DD) — the day the money landed."),
        currency: z.string().default("DKK").describe("Currency code. Defaults to DKK."),
        journalNumber: z
          .number()
          .int()
          .positive()
          .default(2)
          .describe("Journal to book in. Defaults to 2 (Indbetalinger / incoming payments)."),
        text: z
          .string()
          .optional()
          .describe("Entry description. Defaults to 'Payment invoice <invoiceNumber>'."),
        book: z
          .boolean()
          .default(false)
          .describe(
            "If true, book the draft immediately (settles the invoice). If false (default), leave an inspectable draft (dry-run)."
          ),
      }),
    },
    async ({ customerNumber, invoiceNumber, amount, date, currency, journalNumber, text, book }) => {
      try {
        const steps = [];

        const entry = {
          entryTypeNumber: 2,
          journalNumber,
          customerNumber,
          customerInvoiceNumber: String(invoiceNumber),
          amount,
          currency,
          date: `${date}T00:00:00Z`,
          text: text ?? `Payment invoice ${invoiceNumber}`,
        };

        const draft = await openapiRequest("POST", `${JOURNALS_API}/draft-entries`, entry);
        steps.push(
          `Created draft customer-payment entry${
            draft?.entryNumber ? ` #${draft.entryNumber}` : ""
          } in journal ${journalNumber} for invoice ${invoiceNumber}.`
        );

        let booked = null;
        if (book) {
          booked = await openapiRequest("POST", `${JOURNALS_API}/entries/draft/${journalNumber}/book`);
          steps.push("Booked journal draft entries — invoice settled.");
        } else {
          steps.push(
            `Dry-run: draft NOT booked. Inspect it, then re-run with book=true, or delete via DELETE ${JOURNALS_API}/draft-entries/${draft?.entryNumber ?? "{entryNumber}"}.`
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, book, steps, draft, booked }, null, 2),
            },
          ],
        };
      } catch (error) {
        return errorToContent(error);
      }
    }
  );
};
