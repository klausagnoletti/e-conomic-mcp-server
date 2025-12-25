import { z } from "zod";
import { EconomicApiError, request } from "../economic/api-client.js";

const DEFAULT_PRODUCT_NUMBER = "1";

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

const newCustomerSchema = z.object({
  name: z.string().min(1).describe("Customer name"),
  currency: z
    .string()
    .length(3)
    .optional()
    .describe("Customer currency (ISO 4217)"),
  paymentTermsNumber: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Payment terms number"),
  customerGroupNumber: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Customer group number"),
  vatZoneNumber: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("VAT zone number"),
  address: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email().optional(),
  telephoneAndFaxNumber: z.string().optional(),
  attention: z.string().optional(),
  ean: z.string().optional(),
  cvr: z.string().optional(),
  website: z.string().optional(),
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

const ensureCustomer = async ({
  customerNumber,
  currency,
  createCustomerIfMissing,
  newCustomer,
}) => {
  try {
    await request("GET", `/customers/${customerNumber}`);
    return;
  } catch (error) {
    if (!(error instanceof EconomicApiError) || error.status !== 404) {
      throw error;
    }

    if (!createCustomerIfMissing) {
      throw error;
    }

    if (!newCustomer) {
      throw new EconomicApiError(
        "Customer does not exist. Provide newCustomer details to create it.",
        { status: 404, errorCode: "E_CUSTOMER_MISSING" }
      );
    }

    const payload = {
      customerNumber,
      name: newCustomer.name,
      currency: (newCustomer.currency ?? currency)?.toUpperCase(),
    };

    if (newCustomer.paymentTermsNumber) {
      payload.paymentTerms = {
        paymentTermsNumber: newCustomer.paymentTermsNumber,
      };
    }

    if (newCustomer.customerGroupNumber) {
      payload.customerGroup = {
        customerGroupNumber: newCustomer.customerGroupNumber,
      };
    }

    if (newCustomer.vatZoneNumber) {
      payload.vatZone = { vatZoneNumber: newCustomer.vatZoneNumber };
    }

    const optionalFields = [
      "address",
      "zip",
      "city",
      "country",
      "email",
      "telephoneAndFaxNumber",
      "attention",
      "ean",
      "cvr",
      "website",
    ];

    for (const field of optionalFields) {
      if (newCustomer[field]) {
        payload[field] = newCustomer[field];
      }
    }

    await request("POST", "/customers", payload);
  }
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
        createCustomerIfMissing: z
          .boolean()
          .optional()
          .describe("Create customer if it does not exist"),
        newCustomer: newCustomerSchema
          .optional()
          .describe("Customer payload when creating a missing customer"),
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
      createCustomerIfMissing,
      newCustomer,
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
        await ensureCustomer({
          customerNumber,
          currency,
          createCustomerIfMissing,
          newCustomer,
        });

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
