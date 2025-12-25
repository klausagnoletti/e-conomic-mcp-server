import { z } from "zod";
import { EconomicApiError, request } from "../economic/api-client.js";

const lineSchema = z.object({
  description: z.string().min(1).describe("Line description"),
  quantity: z.number().positive().describe("Quantity"),
  unitPrice: z.number().describe("Unit net price"),
  productNumber: z.string().min(1).optional().describe("Optional product number"),
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

  if (line.discountPercentage !== undefined) {
    payload.discountPercentage = line.discountPercentage;
  }

  if (line.productNumber) {
    payload.product = { productNumber: line.productNumber };
  }

  if (line.unitNumber) {
    payload.unit = { unitNumber: line.unitNumber };
  }

  return payload;
};

const fetchInvoiceTemplate = async (customerNumber, currency) => {
  const query = new URLSearchParams();
  if (currency) {
    query.set("currency", currency);
  }
  const url = query.toString()
    ? `/customers/${customerNumber}/templates/invoice?${query.toString()}`
    : `/customers/${customerNumber}/templates/invoice`;

  return request("GET", url);
};

export const registerCreateInvoiceDraftTool = (server) => {
  server.registerTool(
    "create_invoice_draft",
    {
      title: "Create invoice draft",
      description: "Create a draft invoice in e-conomic.",
      inputSchema: z.object({
        customerNumber: z
          .number()
          .int()
          .positive()
          .describe("Customer number in e-conomic"),
        currency: z
          .string()
          .length(3)
          .describe("Invoice currency (ISO 4217)")
          .transform((value) => value.toUpperCase()),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe("Invoice date (YYYY-MM-DD)"),
        lines: z.array(lineSchema).min(1).describe("Invoice lines"),
        layoutNumber: z.number().int().positive().optional(),
        paymentTermsNumber: z.number().int().positive().optional(),
        recipientName: z.string().min(1).optional(),
        recipientVatZoneNumber: z.number().int().positive().optional(),
        dueDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
      }),
    },
    async ({
      customerNumber,
      currency,
      date,
      lines,
      layoutNumber,
      paymentTermsNumber,
      recipientName,
      recipientVatZoneNumber,
      dueDate,
    }) => {
      try {
        let payload;
        const needsTemplate =
          !layoutNumber ||
          !paymentTermsNumber ||
          !recipientName ||
          !recipientVatZoneNumber;

        if (needsTemplate) {
          payload = await fetchInvoiceTemplate(customerNumber, currency);
        } else {
          payload = {
            customer: { customerNumber },
            layout: { layoutNumber },
            paymentTerms: { paymentTermsNumber },
            recipient: {
              name: recipientName,
              vatZone: { vatZoneNumber: recipientVatZoneNumber },
            },
          };
        }

        payload.date = date;
        payload.currency = currency;
        payload.customer = { customerNumber };

        if (layoutNumber) {
          payload.layout = { layoutNumber };
        }

        if (paymentTermsNumber) {
          payload.paymentTerms = { paymentTermsNumber };
        }

        if (!payload.recipient) {
          payload.recipient = {};
        }

        if (recipientName) {
          payload.recipient.name = recipientName;
        }

        if (recipientVatZoneNumber) {
          payload.recipient.vatZone = { vatZoneNumber: recipientVatZoneNumber };
        }

        if (dueDate) {
          payload.dueDate = dueDate;
        }

        payload.lines = lines.map(buildLine);

        const data = await request("POST", "/invoices/drafts", payload);

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
        if (error instanceof EconomicApiError) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: error.message,
                    status: error.status,
                    errorCode: error.errorCode,
                    hint: error.hint,
                    details: error.details,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        throw error;
      }
    }
  );
};
