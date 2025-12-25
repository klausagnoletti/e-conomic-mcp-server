import { EconomicApiError } from "../economic/api-client.js";

export const errorToContent = (error) => {
  if (!(error instanceof EconomicApiError)) {
    throw error;
  }

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
};
