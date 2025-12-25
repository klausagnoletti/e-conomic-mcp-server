import { z } from "zod";
import { EconomicApiError, request } from "../economic/api-client.js";

const updateSchema = z.object({
  customerNumber: z
    .number()
    .int()
    .positive()
    .describe("Customer number to update"),
  name: z.string().min(1).optional(),
  currency: z
    .string()
    .length(3)
    .optional()
    .describe("Customer currency (ISO 4217)")
    .transform((value) => (value ? value.toUpperCase() : value)),
  paymentTermsNumber: z.number().int().positive().optional(),
  customerGroupNumber: z.number().int().positive().optional(),
  vatZoneNumber: z.number().int().positive().optional(),
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

const fetchCustomer = (customerNumber) =>
  request("GET", `/customers/${customerNumber}`);

export const registerUpdateCustomerTool = (server) => {
  server.registerTool(
    "update_customer",
    {
      title: "Update customer",
      description: "Update an existing customer in e-conomic.",
      inputSchema: updateSchema,
    },
    async (input) => {
      try {
        const current = await fetchCustomer(input.customerNumber);
        const payload = { ...current };

        const directFields = [
          "name",
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

        for (const field of directFields) {
          if (input[field] !== undefined) {
            payload[field] = input[field];
          }
        }

        if (input.currency) {
          payload.currency = input.currency;
        }

        if (input.paymentTermsNumber) {
          payload.paymentTerms = {
            paymentTermsNumber: input.paymentTermsNumber,
          };
        }

        if (input.customerGroupNumber) {
          payload.customerGroup = {
            customerGroupNumber: input.customerGroupNumber,
          };
        }

        if (input.vatZoneNumber) {
          payload.vatZone = { vatZoneNumber: input.vatZoneNumber };
        }

        const data = await request(
          "PUT",
          `/customers/${input.customerNumber}`,
          payload
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  customerNumber: data?.customerNumber,
                  name: data?.name,
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
