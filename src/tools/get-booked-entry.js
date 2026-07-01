import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerGetBookedEntryTool = (server) => {
  server.registerTool(
    "get_booked_entry",
    {
      title: "Get Booked Entry",
      description:
        "Fetch detailed information about a specific booked journal entry (voucher) to see payment details, amounts, and dates.",
      inputSchema: z.object({
        bookedEntryNumber: z
          .number()
          .int()
          .positive()
          .describe("The booked entry (voucher) number to retrieve"),
      }),
    },
    async (input) => {
      try {
        const data = await request(
          "GET",
          `/booked-entries/${input.bookedEntryNumber}`
        );

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return errorToContent(error);
      }
    }
  );
};
