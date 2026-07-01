import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerListJournalEntriesTools = (server) => {
  server.registerTool(
    "list_journal_entries",
    {
      title: "List Journal Entries",
      description:
        "Fetch journal entries from the daily journal (daglig journal) with optional filtering by date range and other criteria.",
      inputSchema: z.object({
        journalNumber: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Journal number to filter by (e.g., 1 for daily journal)"),
        fromDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("Filter entries from this date (YYYY-MM-DD)"),
        toDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("Filter entries until this date (YYYY-MM-DD)"),
        skippages: z
          .number()
          .int()
          .min(0)
          .optional()
          .default(0)
          .describe("Number of pages to skip for pagination"),
        pagesize: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .default(100)
          .describe("Number of entries per page"),
      }),
    },
    async (input) => {
      try {
        const queryParams = new URLSearchParams();

        if (input.fromDate !== undefined) {
          queryParams.append("fromdate", input.fromDate);
        }
        if (input.toDate !== undefined) {
          queryParams.append("todate", input.toDate);
        }
        if (input.skippages !== undefined) {
          queryParams.append("skippages", input.skippages);
        }
        if (input.pagesize !== undefined) {
          queryParams.append("pagesize", input.pagesize);
        }

        // Determine which journal to query (default to journal 1 - daily journal)
        const jn = input.journalNumber ?? 1;
        const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
        const data = await request("GET", `/journals/${jn}/entries${query}`);

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
      } catch (error) {
        return errorToContent(error);
      }
    }
  );
};
