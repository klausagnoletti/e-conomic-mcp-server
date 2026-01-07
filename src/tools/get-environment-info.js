import { z } from "zod";
import { request } from "../economic/api-client.js";
import { errorToContent } from "./tool-helpers.js";

export const registerGetEnvironmentInfoTool = (server) => {
    server.registerTool(
        "get_environment_info",
        {
            title: "Get Environment Info",
            description: "Returns information about the connected e-conomic environment (agreement, company, user). Use this to check if you are connected to a sandbox/demo or live environment.",
            inputSchema: z.object({}),
        },
        async () => {
            try {
                // Fetch /self for agreement details
                const selfData = await request("GET", "/self");

                // Fetch /app-settings/agreement for potential visual indicators (optional, but /self is usually enough)

                // Analyze environment
                const agreementNumber = selfData.agreementNumber;
                const companyName = selfData.company?.name || "Unknown";
                const userName = selfData.user?.name || "Unknown";

                // Heuristic for Sandbox/Demo
                // e-conomic demo agreements are often distinct or named "Demo".
                // But there isn't a strict "isSandbox" flag in the API.
                // We will infer it from the data or just return the data for the user to judge.

                let predictedEnvironment = "live";
                if (
                    companyName.toLowerCase().includes("demo") ||
                    companyName.toLowerCase().includes("sandbox") ||
                    (selfData.user && selfData.user.loginId && selfData.user.loginId.includes("demo"))
                ) {
                    predictedEnvironment = "sandbox";
                }

                // Also check if app secret token is literally "demo" (if we could see it, but we can't here easily)

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                agreementNumber,
                                companyName,
                                userName,
                                currency: selfData.currency,
                                signupDate: selfData.signupDate,
                                predictedEnvironment,
                                fullDetails: {
                                    self: selfData.self,
                                    company: selfData.company,
                                    user: selfData.user
                                }
                            }, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return errorToContent(error);
            }
        }
    );
};
