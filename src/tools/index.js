import { registerHelloTool } from "./hello.js";
import { registerListCustomersTool } from "./list-customers.js";

const registerTools = (server) => {
  registerHelloTool(server);
  registerListCustomersTool(server);
};

export default registerTools;
