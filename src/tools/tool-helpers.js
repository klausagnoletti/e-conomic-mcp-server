import { EconomicApiError } from "../economic/api-client.js";
import { logEvent } from "../utils/logger.js";

export const errorToContent = (error) => {
  if (!(error instanceof EconomicApiError)) {
    throw error;
  }

  // Log full error details server-side for debugging
  logEvent("error", "API error occurred", {
    message: error.message,
    status: error.status,
    errorCode: error.errorCode,
    hint: error.hint,
    details: error.details,
  });

  // Return sanitized error to client (exclude internal hints and details)
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            error: error.message,
            status: error.status,
            errorCode: error.errorCode,
          },
          null,
          2
        ),
      },
    ],
  };
};
