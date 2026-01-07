import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerCreateDraftEntryTool = (server) => {
  server.registerTool(
    "create_draft_entry",
    {
      title: "Create Draft Journal Entry",
      description:
        "Create a new draft journal entry. This is used for creating manual entries or complex booking flows that require attachments.",
      inputSchema: z.object({
        journalNumber: z.number().describe("The number of the journal to create the entry in."),
        entries: z
          .array(
            z.object({
              accountNumber: z.number().describe("Account number to book on."),
              amount: z.number().describe("Amount in the currency of the journal."),
              text: z.string().describe("Description text for the entry."),
              date: z.string().describe("Date of the entry (YYYY-MM-DD)."),
              currency: z.string().optional().describe("Currency code (e.g., 'DKK'). Defaults to journal booking currency if ignored."),
              voucherNumber: z.number().optional().describe("Voucher number. If omitted, the system may assign one."),
            })
          )
          .describe("List of partial entries (debit/credit lines) for this voucher."),
      }),
    },
    async ({ journalNumber, entries }) => {
      try {
        const data = await request("POST", `/journals/${journalNumber}/entries`, {
          entries,
        });

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
