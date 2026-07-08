import { validateCredentials, EconomicApiError } from "./api-client.js";
import { logDebug } from "../utils/logger.js";

// The modern e-conomic OpenAPI lives on a different host than the classic REST
// API (restapi.e-conomic.com). It carries the machine-readable spec and the
// clean customer-payment contract (Journals API, entry type 2). Same auth
// headers as the classic API.
const OPENAPI_BASE = "https://apis.e-conomic.com";

const buildHeaders = () => {
  const { appSecretToken, agreementGrantToken } = validateCredentials();

  return {
    "Content-Type": "application/json",
    "X-AppSecretToken": appSecretToken,
    "X-AgreementGrantToken": agreementGrantToken,
  };
};

// path is relative to the OpenAPI host, e.g. "journalsapi/v15.0.0/draft-entries".
export const openapiRequest = async (method, path, body) => {
  const url = `${OPENAPI_BASE}/${path.replace(/^\//, "")}`;
  logDebug("openapiRequest", { method, path });

  const response = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    let errorPayload;
    try {
      errorPayload = await response.json();
    } catch (error) {
      errorPayload = { message: await response.text() };
    }

    const message =
      errorPayload?.title ??
      errorPayload?.message ??
      `e-conomic OpenAPI request failed (${response.status}).`;

    throw new EconomicApiError(message, {
      status: response.status,
      errorCode: errorPayload?.errorCode,
      details: errorPayload,
    });
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};
