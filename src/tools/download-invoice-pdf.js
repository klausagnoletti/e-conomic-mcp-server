import { z } from "zod";
import { request, validateCredentials } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB limit

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
          signal: AbortSignal.timeout(30000),
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
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > MAX_PDF_SIZE) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: `PDF too large: ${contentLength} bytes (max: ${MAX_PDF_SIZE} bytes)`,
                    status: 413,
                    errorCode: "E_PDF_TOO_LARGE",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const arrayBuffer = await response.arrayBuffer();

        // Double-check actual size after download
        if (arrayBuffer.byteLength > MAX_PDF_SIZE) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: `PDF too large: ${arrayBuffer.byteLength} bytes (max: ${MAX_PDF_SIZE} bytes)`,
                    status: 413,
                    errorCode: "E_PDF_TOO_LARGE",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

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
