import { registerHelloTool } from "./hello.js";
import { registerListCustomersTool } from "./list-customers.js";
import { registerCreateInvoiceDraftTool } from "./create-invoice-draft.js";
import { registerUpdateInvoiceDraftTool } from "./update-invoice-draft.js";
import { registerUpdateCustomerTool } from "./update-customer.js";
import { registerGetCustomerTool } from "./get-customer.js";
import { registerListProductsTool } from "./list-products.js";
import { registerUpsertProductTool } from "./upsert-product.js";
import { registerListInvoiceDraftsTool } from "./list-invoice-drafts.js";
import { registerGetInvoiceDraftTool } from "./get-invoice-draft.js";
import { registerBookInvoiceDraftTool } from "./book-invoice-draft.js";
import { registerListBookedInvoicesTool } from "./list-booked-invoices.js";
import { registerGetBookedInvoiceTool } from "./get-booked-invoice.js";
import { registerDownloadInvoicePdfTool } from "./download-invoice-pdf.js";
import { registerListPaymentTermsTool } from "./list-payment-terms.js";
import { registerListCustomerGroupsTool } from "./list-customer-groups.js";
import { registerListVatZonesTool } from "./list-vat-zones.js";
import { registerCreateDraftEntryTool } from "./create-draft-entry.js";
import { registerAttachPdfToEntryTool } from "./attach-pdf-to-entry.js";
import { registerMatchBookedEntriesTool } from "./match-booked-entries.js";
import { registerBookAndMatchReceiptTool } from "./book-and-match-receipt.js";

import { registerGetEnvironmentInfoTool } from "./get-environment-info.js";
import { registerValidatePayloadTool } from "./validate-payload.js";

// Helper to intercept calls and capture schemas
const createSchemaTrackingServer = (originalServer) => {
  const schemas = new Map();

  return {
    registerTool: (name, config, handler) => {
      // Store the schema
      if (config.inputSchema) {
        schemas.set(name, config.inputSchema);
      }
      // Delegate to real server
      originalServer.registerTool(name, config, handler);
    },
    getSchemas: () => schemas
  };
};

const registerTools = (server) => {
  // Wrap server to capture schemas
  const trackingServer = createSchemaTrackingServer(server);
  const schemas = trackingServer.getSchemas();

  registerHelloTool(trackingServer);
  registerListCustomersTool(trackingServer);
  registerGetCustomerTool(trackingServer);
  registerListProductsTool(trackingServer);
  registerUpsertProductTool(trackingServer);
  registerCreateInvoiceDraftTool(trackingServer);
  registerUpdateInvoiceDraftTool(trackingServer);
  registerUpdateCustomerTool(trackingServer);
  registerListInvoiceDraftsTool(trackingServer);
  registerGetInvoiceDraftTool(trackingServer);
  registerBookInvoiceDraftTool(trackingServer);
  registerListBookedInvoicesTool(trackingServer);
  registerGetBookedInvoiceTool(trackingServer);
  registerDownloadInvoicePdfTool(trackingServer);
  registerListPaymentTermsTool(trackingServer);
  registerListCustomerGroupsTool(trackingServer);
  registerListVatZonesTool(trackingServer);
  registerCreateDraftEntryTool(trackingServer);
  registerAttachPdfToEntryTool(trackingServer);
  registerMatchBookedEntriesTool(trackingServer);
  registerBookAndMatchReceiptTool(trackingServer);

  // Register safety tools (needs raw server for environment info, tracking server for schema access??)
  // Actually, validate_payload needs the schemas map.
  registerGetEnvironmentInfoTool(server); // Doesn't need schema tracking wrapper
  registerValidatePayloadTool(server, schemas); // Pass the map
};

export default registerTools;
