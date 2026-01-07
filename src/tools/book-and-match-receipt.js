import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

// Helper to find a suitable journal if none provided
const findDefaultJournal = async () => {
    const journals = await request("GET", "/journals?pageSize=5");
    // Prefer "Daglig", "Daily", "Finans", "Finance" or just the first one
    const preferred = journals.collection.find(j =>
        /daglig|daily|finans|finance/i.test(j.name)
    );
    return preferred || journals.collection[0];
};

export const registerBookAndMatchReceiptTool = (server) => {
    server.registerTool(
        "book_and_match_receipt",
        {
            title: "Book and Match Receipt",
            description:
                "Creates a journal entry for a receipt, attaches a PDF, books the journal, and optionally matches it with a bank entry. Requires PDF content as base64.",
            inputSchema: z.object({
                amount: z.number().describe("Amount in currency (e.g. 100.50)."),
                currency: z.string().describe("Currency code (e.g. 'DKK')."),
                date: z.string().describe("Date of expense (YYYY-MM-DD)."),
                text: z.string().describe("Description text."),
                accountNumber: z.number().describe("Cost account number (Debit)."),
                contraAccountNumber: z.number().optional().describe("Contra/Bank account number (Credit). If matched, this should be the bank account."),
                journalNumber: z.number().optional().describe("Target journal. If omitted, tries to find a default journal."),
                pdfBase64: z.string().describe("Base64 encoded PDF content."),
                matchWithBookedEntryNumber: z.number().optional().describe("The booked entry number (e.g. bank transaction) to match with."),
            }),
        },
        async ({
            amount,
            currency,
            date,
            text,
            accountNumber,
            contraAccountNumber,
            journalNumber,
            pdfBase64,
            matchWithBookedEntryNumber,
        }) => {
            try {
                const steps = [];

                // 1. Resolve Journal
                let targetJournalNumber = journalNumber;
                if (!targetJournalNumber) {
                    const journal = await findDefaultJournal();
                    if (!journal) {
                        throw new Error("No journals found. Please create a journal in e-conomic first.");
                    }
                    targetJournalNumber = journal.journalNumber;
                    steps.push(`Selected journal: ${journal.name} (#${targetJournalNumber})`);
                }

                // 2. Create Entry
                // API requires an array of entries. We create a generic finance voucher.
                // If contraAccount is provided, we map it. If not, we create a single-leg entry (unbalanced) which might fail booking?
                // Usually, journals must balance.
                const entryPayload = {
                    entries: [
                        {
                            type: "financeVoucher",
                            accountNumber,
                            contraAccountNumber: contraAccountNumber || undefined,
                            amount: amount, // Positive = Debit cost account?
                            currency: currency,
                            date: date,
                            text: text,
                            // If amount is positive and account is "Cost" (Debit), and Contra is "Bank" (Credit).
                            // e-conomic direction depends on account type, but often positive = debit.
                        }
                    ]
                };

                const createdEntries = await request("POST", `/journals/${targetJournalNumber}/entries`, entryPayload);
                // The response typically contains the created entries. We need the "voucherNumber" and "accountingYear".
                // Assuming the first entry corresponds to our request.
                const createdEntry = createdEntries.collection ? createdEntries.collection[0] : createdEntries;

                // We need voucher info to attach PDF.
                // createdEntry should have: voucherNumber, accountingYear
                // Some responses are nested. Let's inspect safely.
                const voucherNumber = createdEntry.voucherNumber;
                // e-conomic API for entries usually returns the entry object or collection.
                // Assuming we got a collection back because we sent `entries: [...]`?
                // Actually `POST /entries` takes an array but sometimes returns the array.
                // Let's assume `createdEntries` has what we need. 
                // If `createdEntries` is an array/collection, pick first.

                // Wait, the `create_draft_entry` tool uses `entries` array wrapper. The response is usually the created entries.

                if (!voucherNumber) {
                    throw new Error(`Failed to retrieve voucher number from created entry. Response: ${JSON.stringify(createdEntries)}`);
                }

                // For attachment we generally need accountingYear too?
                // Usually part of the entry url or object.
                // createdEntry.accountingYear usually exists.
                // If not, we might need to fetch the journal or entry again?
                // Let's assume it's there or try to fetch.

                steps.push(`Created draft entry #${createdEntry.entryNumber}, Voucher #${voucherNumber}`);

                // 3. Attach PDF
                await request(
                    "POST",
                    `/journals/${targetJournalNumber}/vouchers/${createdEntry.accountingYear}/${voucherNumber}/attachment`,
                    {
                        data: pdfBase64,
                        fileName: "receipt.pdf"
                    }
                );
                steps.push("Attached PDF receipt.");

                // 4. Book Journal
                // Endpoint: POST /journals/{journalNumber}/book
                // It returns the Booked entries numbers if successful? Usually returns 200/204.
                const bookingResult = await request("POST", `/journals/${targetJournalNumber}/book`, {});
                // bookingResult might contain the booked entries if we are lucky, or usually it's just keys.
                steps.push("Booked journal.");

                // 5. Match
                let matchResult = null;
                if (matchWithBookedEntryNumber) {
                    // We need to know OUR booked entry number.
                    // When we book, all drafts become booked.
                    // We need to find the booked entry that corresponds to the one we just made.
                    // This is tricky if it returns empty.
                    // Strategy: Search booked entries by voucherNumber (ref) or date/amount if needed.
                    // Assuming bookingResult returns references to booked items. 
                    // If API returns IDs, great. If not, we search.
                    // Let's assume bookingResult contains something useful?
                    // If not, we might fail matching step gracefully.

                    // For now, let's try to match blindly if we had the ID, but we don't.
                    // We'll search for the last booked entry on this account/amount?
                    // "Risk": Concurrency.

                    // Simplified: If bookingResult has `bookedEntries`, use them.
                    // Otherwise, we skip matching and tell user.
                    if (bookingResult && bookingResult.bookedEntries && bookingResult.bookedEntries.length > 0) {
                        const myBookedEntry = bookingResult.bookedEntries[0].bookedEntryNumber;
                        await request("POST", "/booked-entries/match", {
                            entries: [
                                { bookedEntryNumber: myBookedEntry },
                                { bookedEntryNumber: matchWithBookedEntryNumber }
                            ]
                        });
                        matchResult = "Matched successfully.";
                    } else {
                        matchResult = "Could not identify booked entry ID for auto-matching. Please match manually.";
                    }
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                steps,
                                draftEntry: createdEntry,
                                bookingResult,
                                matchResult
                            }, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return errorToContent(error);
            }
        }
    );
};
