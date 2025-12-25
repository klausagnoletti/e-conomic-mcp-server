import { registerHelloTool } from "./hello.js";
import { registerListCustomersTool } from "./list-customers.js";
import { registerCreateInvoiceDraftTool } from "./create-invoice-draft.js";

const registerTools = (server) => {
  registerHelloTool(server);
  registerListCustomersTool(server);
  registerCreateInvoiceDraftTool(server);
};

export default registerTools;
