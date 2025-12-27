import { z } from "zod";
import { EconomicApiError, request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

const productSchema = z.object({
  productNumber: z
    .string()
    .min(1)
    .max(50)
    .transform((s) => s.trim())
    .describe("Product number"),
  name: z
    .string()
    .min(1)
    .max(250)
    .transform((s) => s.trim())
    .describe("Product name"),
  salesPrice: z.number().nonnegative().optional().describe("Sales price"),
  costPrice: z.number().nonnegative().optional().describe("Cost price"),
  barCode: z.string().max(100).optional().describe("Barcode"),
  unitNumber: z.number().int().positive().optional().describe("Unit number"),
  productGroupNumber: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Product group number (required when creating)"),
  departmentNumber: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Department number"),
});

const buildProductPayload = (input) => {
  const payload = {
    productNumber: input.productNumber,
    name: input.name,
  };

  if (input.salesPrice !== undefined) {
    payload.salesPrice = input.salesPrice;
  }

  if (input.costPrice !== undefined) {
    payload.costPrice = input.costPrice;
  }

  if (input.barCode) {
    payload.barCode = input.barCode;
  }

  if (input.unitNumber) {
    payload.unit = { unitNumber: input.unitNumber };
  }

  if (input.productGroupNumber) {
    payload.productGroup = { productGroupNumber: input.productGroupNumber };
  }

  if (input.departmentNumber) {
    payload.departmentalDistribution = {
      departmentNumber: input.departmentNumber,
    };
  }

  return payload;
};

export const registerUpsertProductTool = (server) => {
  server.registerTool(
    "upsert_product",
    {
      title: "Upsert product",
      description: "Create or update a product by productNumber.",
      inputSchema: productSchema,
    },
    async (input) => {
      try {
        let exists = false;
        try {
          await request("GET", `/products/${input.productNumber}`);
          exists = true;
        } catch (error) {
          if (!(error instanceof EconomicApiError) || error.status !== 404) {
            throw error;
          }
        }

        const payload = buildProductPayload(input);

        if (!exists && !payload.productGroup) {
          throw new EconomicApiError(
            "productGroupNumber is required when creating a new product.",
            { status: 400, errorCode: "E_PRODUCT_GROUP_REQUIRED" }
          );
        }

        const data = exists
          ? await request("PUT", `/products/${input.productNumber}`, payload)
          : await request("POST", "/products", payload);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (error) {
        return errorToContent(error);
      }
    }
  );
};
