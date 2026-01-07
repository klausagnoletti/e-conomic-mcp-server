import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerAttachPdfToEntryTool = (server) => {
    server.registerTool(
        "attach_pdf_to_entry",
        {
            title: "Attach PDF to Journal Entry",
            description:
                "Attach a PDF document to an existing journal entry/voucher. The entry must exist in the journal.",
            inputSchema: z.object({
                journalNumber: z.number().describe("The journal number."),
                accountingYear: z.string().describe("The accounting year (e.g. '2025')."), // e-conomic API often uses string for year in paths
                voucherNumber: z.number().describe("The voucher number to attach to."),
                attachment: z.string().describe("Base64 encoded PDF content."),
            }),
        },
        async ({ journalNumber, accountingYear, voucherNumber, attachment }) => {
            try {
                // Note: The specific endpoint for attaching to a draft entry might surely depend on the API version,
                // but typically it is: POST /journals/{journalNumber}/vouchers/{accountingYear}/{voucherNumber}/attachment
                const data = await request(
                    "POST",
                    `/journals/${journalNumber}/vouchers/${accountingYear}/${voucherNumber}/attachment`,
                    {
                        data: attachment,
                        fileName: "attachment.pdf", // Default filename
                    }
                );

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
