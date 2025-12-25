import { registerHelloTool } from "./hello.js";
import { registerListCustomersTool } from "./list-customers.js";
import { registerCreateInvoiceDraftTool } from "./create-invoice-draft.js";
import { registerUpdateInvoiceDraftTool } from "./update-invoice-draft.js";
import { registerUpdateCustomerTool } from "./update-customer.js";

const registerTools = (server) => {
  registerHelloTool(server);
  registerListCustomersTool(server);
  registerCreateInvoiceDraftTool(server);
  registerUpdateInvoiceDraftTool(server);
  registerUpdateCustomerTool(server);
};

export default registerTools;
