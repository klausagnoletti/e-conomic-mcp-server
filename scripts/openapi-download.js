import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_URL =
  process.env.OPENAPI_URL ||
  "https://restapi.e-conomic.com/swagger/v1/swagger.json";

const OUTPUT_DIR = path.resolve(__dirname, "..", "generated");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "openapi.json");

const main = async () => {
  try {
    console.error(`Downloading OpenAPI spec from ${DEFAULT_URL} ...`);
    const res = await fetch(DEFAULT_URL, { method: "GET" });

    if (!res.ok) {
      throw new Error(`Download failed with status ${res.status}`);
    }

    const json = await res.json();

    if (!json.openapi) {
      throw new Error("Downloaded file does not look like an OpenAPI spec.");
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(json, null, 2));
    console.error(`Saved spec to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error(`openapi:download failed: ${error.message}`);
    process.exitCode = 1;
  }
};

main();
