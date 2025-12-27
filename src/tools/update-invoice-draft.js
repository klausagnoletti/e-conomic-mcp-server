import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

const DEFAULT_PRODUCT_NUMBER = "1";

const lineSchema = z.object({
  description: z
    .string()
    .min(1)
    .max(2000)
    .transform((s) => s.trim())
    .describe("Line description"),
  quantity: z.number().positive().describe("Quantity"),
  unitPrice: z.number().describe("Unit net price"),
  productNumber: z
    .string()
    .min(1)
    .max(50)
    .optional()
    .describe("Optional product number"),
  unitNumber: z.number().int().positive().optional().describe("Optional unit number"),
  discountPercentage: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Optional discount percentage"),
});

const buildLine = (line, index) => {
  const payload = {
    lineNumber: index + 1,
    sortKey: index + 1,
    description: line.description,
    quantity: line.quantity,
    unitNetPrice: line.unitPrice,
  };

  const resolvedProductNumber = line.productNumber ?? DEFAULT_PRODUCT_NUMBER;

  if (line.discountPercentage !== undefined) {
    payload.discountPercentage = line.discountPercentage;
  }

  if (resolvedProductNumber) {
    payload.product = { productNumber: resolvedProductNumber };
  }

  if (line.unitNumber) {
    payload.unit = { unitNumber: line.unitNumber };
  }

  return payload;
};

const fetchDraft = (draftInvoiceNumber) =>
  request("GET", `/invoices/drafts/${draftInvoiceNumber}`);

export const registerUpdateInvoiceDraftTool = (server) => {
  server.registerTool(
    "update_invoice_draft",
    {
      title: "Update invoice draft",
      description: "Update an existing draft invoice in e-conomic.",
      inputSchema: z.object({
        draftInvoiceNumber: z
          .number()
          .int()
          .positive()
          .describe("Draft invoice number"),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("Invoice date (YYYY-MM-DD)"),
        dueDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe("Due date (YYYY-MM-DD)"),
        currency: z
          .string()
          .length(3)
          .optional()
          .describe("Invoice currency (ISO 4217)")
          .transform((value) => (value ? value.toUpperCase() : value)),
        paymentTermsNumber: z.number().int().positive().optional(),
        layoutNumber: z.number().int().positive().optional(),
        recipientName: z
          .string()
          .min(1)
          .max(250)
          .transform((s) => s.trim())
          .optional(),
        recipientVatZoneNumber: z.number().int().positive().optional(),
        lines: z.array(lineSchema).min(1).optional().describe("Invoice lines"),
      }),
    },
    async ({
      draftInvoiceNumber,
      date,
      dueDate,
      currency,
      paymentTermsNumber,
      layoutNumber,
      recipientName,
      recipientVatZoneNumber,
      lines,
    }) => {
      try {
        const current = await fetchDraft(draftInvoiceNumber);

        // Build payload explicitly from known safe fields only
        const payload = {
          draftInvoiceNumber: current.draftInvoiceNumber,
          date: current.date,
          currency: current.currency,
          customer: current.customer,
          recipient: current.recipient,
          layout: current.layout,
          paymentTerms: current.paymentTerms,
          lines: current.lines,
        };

        if (current.dueDate) {
          payload.dueDate = current.dueDate;
        }

        if (date) {
          payload.date = date;
        }

        if (dueDate) {
          payload.dueDate = dueDate;
        }

        if (currency) {
          payload.currency = currency;
        }

        if (paymentTermsNumber) {
          payload.paymentTerms = { paymentTermsNumber };
        }

        if (layoutNumber) {
          payload.layout = { layoutNumber };
        }

        if (recipientName || recipientVatZoneNumber) {
          payload.recipient = payload.recipient ?? {};
        }

        if (recipientName) {
          payload.recipient.name = recipientName;
        }

        if (recipientVatZoneNumber) {
          payload.recipient.vatZone = { vatZoneNumber: recipientVatZoneNumber };
        }

        if (lines) {
          payload.lines = lines.map(buildLine);
        }

        const data = await request(
          "PUT",
          `/invoices/drafts/${draftInvoiceNumber}`,
          payload
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  draftInvoiceNumber: data?.draftInvoiceNumber,
                  customerNumber: data?.customer?.customerNumber,
                  status: "draft",
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
