import { z } from "zod";
import { request, validateCredentials } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

const buildPdfUrl = (bookedInvoiceNumber) =>
  `/invoices/booked/${bookedInvoiceNumber}/pdf`;

export const registerDownloadInvoicePdfTool = (server) => {
  server.registerTool(
    "download_invoice_pdf",
    {
      title: "Download invoice PDF",
      description: "Download a booked invoice PDF as base64.",
      inputSchema: z.object({
        bookedInvoiceNumber: z
          .number()
          .int()
          .positive()
          .describe("Booked invoice number"),
      }),
    },
    async ({ bookedInvoiceNumber }) => {
      try {
        const baseUrl =
          process.env.ECONOMIC_BASE_URL?.replace(/\/$/, "") ??
          "https://restapi.e-conomic.com";
        const { appSecretToken, agreementGrantToken } = validateCredentials();
        const url = `${baseUrl}${buildPdfUrl(bookedInvoiceNumber)}`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "X-AppSecretToken": appSecretToken,
            "X-AgreementGrantToken": agreementGrantToken,
          },
        });

        if (!response.ok) {
          let errorPayload;
          try {
            errorPayload = await response.json();
          } catch (parseError) {
            errorPayload = { message: await response.text() };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: errorPayload?.message ?? "Failed to fetch PDF.",
                    status: response.status,
                    errorCode: errorPayload?.errorCode,
                    hint: errorPayload?.developerHint,
                    details: errorPayload,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  bookedInvoiceNumber,
                  contentType: response.headers.get("content-type"),
                  size: arrayBuffer.byteLength,
                  base64,
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
