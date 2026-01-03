import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

const updateSchema = z.object({
  customerNumber: z
    .number()
    .int()
    .positive()
    .describe("Customer number to update"),
  name: z
    .string()
    .min(1)
    .max(250)
    .transform((s) => s.trim())
    .optional(),
  currency: z
    .string()
    .length(3)
    .optional()
    .describe("Customer currency (ISO 4217)")
    .transform((value) => (value ? value.toUpperCase() : value)),
  paymentTermsNumber: z.number().int().positive().optional(),
  customerGroupNumber: z.number().int().positive().optional(),
  vatZoneNumber: z.number().int().positive().optional(),
  address: z.string().max(500).optional(),
  zip: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  email: z.string().email().max(254).toLowerCase().optional(),
  telephoneAndFaxNumber: z.string().max(50).optional(),
  attention: z.string().max(250).optional(),
  ean: z.string().max(20).optional(),
  cvr: z.string().max(20).optional(),
  website: z
    .string()
    .url()
    .max(500)
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "Website must be a valid HTTP/HTTPS URL",
    })
    .optional(),
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

        // Build payload explicitly from known safe fields only
        const payload = {
          customerNumber: current.customerNumber,
          currency: current.currency,
          paymentTerms: current.paymentTerms,
          customerGroup: current.customerGroup,
          vatZone: current.vatZone,
          name: current.name,
          address: current.address,
          zip: current.zip,
          city: current.city,
          country: current.country,
          email: current.email,
          telephoneAndFaxNumber: current.telephoneAndFaxNumber,
          attention: current.attention,
          ean: current.ean,
          cvr: current.cvr,
          website: current.website,
        };

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
        return errorToContent(error);
      }
    }
  );
};
