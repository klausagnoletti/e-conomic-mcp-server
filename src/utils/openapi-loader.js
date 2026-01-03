import fs from "fs";
import path from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { logDebug } from "./logger.js";

const specPath = path.resolve("generated", "openapi.json");

let cachedSpec = null;
let cachedAjv = null;

const loadSpec = () => {
  if (cachedSpec) return cachedSpec;
  if (!fs.existsSync(specPath)) return null;
  const raw = fs.readFileSync(specPath, "utf-8");
  cachedSpec = JSON.parse(raw);
  return cachedSpec;
};

const buildAjv = () => {
  if (cachedAjv) return cachedAjv;
  const spec = loadSpec();
  if (!spec) return null;
  const ajv = new Ajv({ strictSchema: false, allErrors: true, verbose: true });
  addFormats(ajv);
  cachedAjv = ajv;
  return ajv;
};

export const getSpec = () => loadSpec();

export const getAjv = () => buildAjv();

export const matchPathTemplate = (actualPath, templates) => {
  for (const tmpl of templates) {
    const regex = new RegExp(
      "^" + tmpl.replace(/{[^/]+}/g, "[^/]+").replace(/\//g, "\\/") + "$"
    );
    if (regex.test(actualPath)) {
      return tmpl;
    }
  }
  return null;
};

export const logValidationErrors = (context, errors) => {
  logDebug("openapi-validation-error", { context, errors });
};
