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

const registerTools = (server) => {
  registerHelloTool(server);
  registerListCustomersTool(server);
  registerGetCustomerTool(server);
  registerListProductsTool(server);
  registerUpsertProductTool(server);
  registerCreateInvoiceDraftTool(server);
  registerUpdateInvoiceDraftTool(server);
  registerUpdateCustomerTool(server);
  registerListInvoiceDraftsTool(server);
  registerGetInvoiceDraftTool(server);
  registerBookInvoiceDraftTool(server);
  registerListBookedInvoicesTool(server);
  registerGetBookedInvoiceTool(server);
  registerDownloadInvoicePdfTool(server);
  registerListPaymentTermsTool(server);
  registerListCustomerGroupsTool(server);
  registerListVatZonesTool(server);
};

export default registerTools;
