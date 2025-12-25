import { logDebug } from "../utils/logger.js";

const DEFAULT_BASE_URL = "https://restapi.e-conomic.com";

export class EconomicApiError extends Error {
  constructor(message, { status, errorCode, details, hint } = {}) {
    super(message);
    this.name = "EconomicApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
    this.hint = hint;
  }
}

const getBaseUrl = () =>
  process.env.ECONOMIC_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_BASE_URL;

export const validateCredentials = () => {
  const appSecretToken = process.env.ECONOMIC_APP_SECRET_TOKEN?.trim();
  const agreementGrantToken = process.env.ECONOMIC_AGREEMENT_GRANT_TOKEN?.trim();

  if (!appSecretToken || !agreementGrantToken) {
    throw new EconomicApiError(
      "Missing ECONOMIC_APP_SECRET_TOKEN or ECONOMIC_AGREEMENT_GRANT_TOKEN environment variables.",
      { status: 0, errorCode: "E_NO_CREDENTIALS" }
    );
  }

  return { appSecretToken, agreementGrantToken };
};

const buildHeaders = () => {
  const { appSecretToken, agreementGrantToken } = validateCredentials();

  return {
    "Content-Type": "application/json",
    "X-AppSecretToken": appSecretToken,
    "X-AgreementGrantToken": agreementGrantToken,
  };
};

export const request = async (method, path, body) => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;
  logDebug("request", { method, path });

  const response = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorPayload;
    try {
      errorPayload = await response.json();
    } catch (error) {
      errorPayload = { message: await response.text() };
    }

    const message =
      errorPayload?.message ??
      `e-conomic API request failed (${response.status}).`;

    throw new EconomicApiError(message, {
      status: response.status,
      errorCode: errorPayload?.errorCode,
      details: errorPayload,
      hint: errorPayload?.developerHint,
    });
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
