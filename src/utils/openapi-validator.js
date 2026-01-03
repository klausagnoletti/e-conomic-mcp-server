import { getAjv, getSpec, matchPathTemplate, logValidationErrors } from "./openapi-loader.js";

// Build validators map: { "<METHOD> <pathTemplate>": { requestValidator, responseValidators: {statusCode: fn, default: fn} } }
let validators = null;

const buildValidators = () => {
  if (validators) return validators;
  const spec = getSpec();
  const ajv = getAjv();
  if (!spec || !ajv) {
    validators = {};
    return validators;
  }

  const map = {};
  const paths = spec.paths || {};

  for (const [pathKey, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const key = `${method.toUpperCase()} ${pathKey}`;
      const entry = {};

      // Request body validator
      const requestBodySchema =
        operation.requestBody?.content?.["application/json"]?.schema;
      if (requestBodySchema) {
        entry.requestValidator = ajv.compile(requestBodySchema);
      }

      // Response validators
      const responseValidators = {};
      const responses = operation.responses || {};
      for (const [statusCode, response] of Object.entries(responses)) {
        const schema = response?.content?.["application/json"]?.schema;
        if (schema) {
          responseValidators[statusCode] = ajv.compile(schema);
        }
      }
      if (Object.keys(responseValidators).length > 0) {
        entry.responseValidators = responseValidators;
      }

      map[key] = entry;
    }
  }

  validators = map;
  return validators;
};

const findValidator = (method, path) => {
  const map = buildValidators();
  const templates = Object.keys(map)
    .filter((key) => key.startsWith(method.toUpperCase() + " "))
    .map((key) => key.slice(method.length + 1));

  const matchedTemplate = matchPathTemplate(path, templates);
  if (!matchedTemplate) return null;
  return map[`${method.toUpperCase()} ${matchedTemplate}`];
};

export const validateRequestBody = (method, path, body) => {
  const validator = findValidator(method, path);
  if (!validator?.requestValidator) return { ok: true };
  const valid = validator.requestValidator(body);
  if (!valid) {
    logValidationErrors("request", validator.requestValidator.errors);
    return { ok: false, errors: validator.requestValidator.errors };
  }
  return { ok: true };
};

export const validateResponseBody = (method, path, statusCode, body) => {
  const validator = findValidator(method, path);
  if (!validator?.responseValidators) return { ok: true };

  const responseValidator =
    validator.responseValidators[statusCode] ||
    validator.responseValidators[String(statusCode)] ||
    validator.responseValidators["default"];

  if (!responseValidator) return { ok: true };

  const valid = responseValidator(body);
  if (!valid) {
    logValidationErrors("response", responseValidator.errors);
    return { ok: false, errors: responseValidator.errors };
  }

  return { ok: true };
};
