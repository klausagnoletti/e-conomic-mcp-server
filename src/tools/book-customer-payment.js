import { z } from "zod";
import { request } from "../economic/api-client.js";
import { openapiRequest } from "../economic/openapi-client.js";
import { errorToContent } from "./tool-helpers.js";

// The booking action lives on the OpenAPI host but ONLY at v1.1.0 — confirmed
// against e-conomic's own docs (techtalk.e-conomic.com) and endpoint probing
// on 16-07-2026. v15.0.0 (used for other journalsapi calls) 404s here; do not
// "helpfully" bump this to match other endpoints without re-verifying.
const BOOK_JOURNALS_API = "journalsapi/v1.1.0";

// entryTypeNumber 2 = Customer Payment. The draft entry MUST be created via the
// classic REST /journals/{n}/vouchers endpoint with an EXPLICIT contraAccount —
// the OpenAPI draft-entries endpoint does not attach one and the resulting
// entry can never balance (booking then fails with "do not balance" even
// though creation itself succeeds with 201). The journal's configured contra
// account is fetched live rather than hardcoded, since it's journal-specific.
//
// CRITICAL: amount must be NEGATIVE. A customer payment is a credit to the
// debtor account (reduces what they owe); a positive amount books as an
// additional debit and INCREASES the customer's balance instead of clearing
// it. Confirmed the hard way on 16-07-2026 — a positive-amount booking
// doubled a real customer's outstanding balance. See
// ~/.claude/skills/_FINANCEADVISOR/References/EconomicOperator.md
// ("Booking a customer payment") for the full incident and verification.
export const registerBookCustomerPaymentTool = (server) => {
  server.registerTool(
    "book_customer_payment",
    {
      title: "Book Customer Payment",
      description:
        "Register (and optionally book) an incoming customer payment against a specific invoice via e-conomic's Journals API (entry type 2, Customer Payment). Booking settles the invoice so it stops showing as unpaid. Defaults to a dry-run: book=false creates only an inspectable draft entry. Pass the payment amount as a POSITIVE number (gross, matching the invoice) — the tool handles the debit/credit sign internally. CAUTION: a sign-convention bug in an earlier version of this tool booked a payment in the wrong direction and doubled a real customer's balance (16-07-2026). Always inspect the dry-run draft's amount and the customer's dueAmount before and after booking.",
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
          .describe(
            "Payment amount in the entry currency (gross, matching the invoice), as a POSITIVE number. The tool negates it internally before booking, since a customer payment must be a credit to the debtor account."
          ),
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

        // The journal's configured contra account is journal-specific — fetch
        // it live rather than hardcoding 5820 (only correct for journal 2).
        const journal = await request("GET", `/journals/${journalNumber}`);
        const contraAccountNumber = journal?.settings?.contraAccounts?.customerPayments?.accountNumber;
        if (!contraAccountNumber) {
          throw new Error(
            `Journal ${journalNumber} has no configured customerPayments contra account (settings.contraAccounts.customerPayments.accountNumber). Cannot safely book a balanced entry.`
          );
        }
        steps.push(`Resolved journal ${journalNumber} contra account: ${contraAccountNumber}.`);

        const accountingYear = date.slice(0, 4);
        const entryText = text ?? `Payment invoice ${invoiceNumber}`;

        // NEGATIVE amount: a customer payment is a credit to the debtor
        // account. Positive books as an additional debit and INCREASES the
        // customer's balance instead of clearing it — this is the exact bug
        // fixed here on 16-07-2026.
        const voucherPayload = {
          accountingYear: { year: accountingYear },
          journal: { journalNumber },
          entries: {
            customerPayments: [
              {
                date,
                amount: -Math.abs(amount),
                currency: { code: currency },
                customer: { customerNumber },
                customerInvoice: Number(invoiceNumber),
                contraAccount: { accountNumber: contraAccountNumber },
                text: entryText,
              },
            ],
          },
        };

        const draftResult = await request("POST", `/journals/${journalNumber}/vouchers`, voucherPayload);
        const draftEntry = draftResult?.[0]?.entries?.customerPayments?.[0] ?? null;
        steps.push(
          `Created draft customer-payment entry${
            draftEntry?.journalEntryNumber ? ` #${draftEntry.journalEntryNumber}` : ""
          } in journal ${journalNumber} for invoice ${invoiceNumber} (amount ${voucherPayload.entries.customerPayments[0].amount} ${currency}).`
        );

        let booked = null;
        if (book) {
          // Booking endpoint lives ONLY at v1.1.0 on the OpenAPI host — see
          // BOOK_JOURNALS_API comment above. Returns 204 with no body on success.
          await openapiRequest("POST", `${BOOK_JOURNALS_API}/entries/draft/${journalNumber}/book`);
          booked = { bookedAt: new Date().toISOString() };
          steps.push("Booked journal draft entries — invoice should now be settled. Verify customer dueAmount to confirm.");
        } else {
          steps.push(
            `Dry-run: draft NOT booked. Inspect draftEntry.amount above (must be negative), then re-run with book=true, or delete via DELETE /journals/${journalNumber}/entries/${draftEntry?.journalEntryNumber ?? "{entryNumber}"} on the classic REST API.`
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, book, steps, draftEntry, booked }, null, 2),
            },
          ],
        };
      } catch (error) {
        return errorToContent(error);
      }
    }
  );
};
