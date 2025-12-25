import { z } from "zod";

const ECONOMIC_BASE_URL =
  process.env.ECONOMIC_BASE_URL?.replace(/\/$/, "") ??
  "https://restapi.e-conomic.com";
const ECONOMIC_APP_SECRET_TOKEN = process.env.ECONOMIC_APP_SECRET_TOKEN;
const ECONOMIC_AGREEMENT_GRANT_TOKEN = process.env.ECONOMIC_AGREEMENT_GRANT_TOKEN;

const defaultHeaders = () => {
  if (!ECONOMIC_APP_SECRET_TOKEN || !ECONOMIC_AGREEMENT_GRANT_TOKEN) {
    throw new Error(
      "Missing ECONOMIC_APP_SECRET_TOKEN or ECONOMIC_AGREEMENT_GRANT_TOKEN environment variables."
    );
  }

  return {
    "Content-Type": "application/json",
    "X-AppSecretToken": ECONOMIC_APP_SECRET_TOKEN,
    "X-AgreementGrantToken": ECONOMIC_AGREEMENT_GRANT_TOKEN,
  };
};

const economicRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(`${ECONOMIC_BASE_URL}${path}`, {
    method,
    headers: defaultHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `e-conomic API request failed (${response.status}): ${errorText}`
    );
  }

  return response.json();
};

export const registerListCustomersTool = (server) => {
  server.registerTool(
    "list_customers",
    {
      title: "List customers",
      description: "Fetch a page of customers from the e-conomic API.",
      inputSchema: z.object({
        pageSize: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .describe("Number of customers per page (default 100)."),
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Page number to fetch (default 1)."),
      }),
    },
    async ({ pageSize, page }) => {
      const resolvedPageSize = pageSize ?? 100;
      const resolvedPage = page ?? 1;
      const skipPages = resolvedPage - 1;
      const query = new URLSearchParams({
        pagesize: String(resolvedPageSize),
        skippages: String(skipPages),
      });

      const data = await economicRequest(`/customers?${query.toString()}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );
};
