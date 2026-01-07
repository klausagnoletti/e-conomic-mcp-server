import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerMatchBookedEntriesTool = (server) => {
    server.registerTool(
        "match_booked_entries",
        {
            title: "Match Booked Entries",
            description:
                "Match two or more booked entries against each other (e.g. invoice and payment).",
            inputSchema: z.object({
                entries: z
                    .array(
                        z.object({
                            bookedEntryNumber: z.number().describe("The entry number of the booked entry."),
                        })
                    )
                    .min(2)
                    .describe("List of booked entries to match. Must contain at least two entries."),
            }),
        },
        async ({ entries }) => {
            try {
                // Endpoint: POST /booked-entries/match
                // This is a common operation. The user mentioned "match_booked_entries" in the issue.
                const data = await request("POST", `/booked-entries/match`, {
                    entries,
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(data || { success: true }, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return errorToContent(error);
            }
        }
    );
};
