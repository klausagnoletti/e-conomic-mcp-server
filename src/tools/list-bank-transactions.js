import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerListBankTransactionsTools = (server) => {
  server.registerTool(
    "list_bank_transactions",
    {
      title: "List Bank Transactions",
      description:
        "Fetch booked entries for a bank account using /accounts/{accountNumber}/accounting-years/{year}/entries. accountNumber is required — common values: 5820 (main bank), 5823 (WISE). Date filtering is applied client-side; if the range spans multiple years, all relevant years are queried.",
      inputSchema: z.object({
        accountNumber: z
          .number()
          .int()
          .positive()
          .describe("Bank account number (required). Common values: 5820 (main bank), 5823 (WISE)."),
        fromDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("Filter entries from this date (YYYY-MM-DD). Defaults to start of current year."),
        toDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("Filter entries until this date (YYYY-MM-DD). Defaults to today."),
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
        const today = new Date().toISOString().slice(0, 10);
        const currentYear = new Date().getFullYear();

        const fromDate = input.fromDate ?? `${currentYear}-01-01`;
        const toDate = input.toDate ?? today;

        const fromYear = parseInt(fromDate.slice(0, 4));
        const toYear = parseInt(toDate.slice(0, 4));

        // Query each accounting year in the range (usually just one)
        let allEntries = [];
        for (let year = fromYear; year <= toYear; year++) {
          const data = await request(
            "GET",
            `/accounts/${input.accountNumber}/accounting-years/${year}/entries?skippages=0&pagesize=1000`
          );
          allEntries.push(...(data.collection ?? []));
        }

        // Client-side date filter and sort
        allEntries = allEntries
          .filter((e) => (e.date ?? "") >= fromDate && (e.date ?? "") <= toDate)
          .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

        // Paginate
        const pageSize = input.pagesize ?? 100;
        const skip = (input.skippages ?? 0) * pageSize;
        const page = allEntries.slice(skip, skip + pageSize);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  collection: page,
                  pagination: {
                    skipPages: input.skippages ?? 0,
                    pageSize,
                    results: page.length,
                    totalResults: allEntries.length,
                  },
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
