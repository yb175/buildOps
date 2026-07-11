import { env } from "./env";

// Early validation at application initialization (checks env.ts at startup)
if (process.env.NODE_ENV === "production" && !env.MISTRAL_API_KEY) {
  throw new Error("CRITICAL: MISTRAL_API_KEY environment variable is required in production mode.");
}

export const mistralConfig = {
  get apiKey(): string {
    return process.env.MISTRAL_API_KEY || "";
  },
  get baseUrl(): string {
    return process.env.MISTRAL_BASE_URL || "https://api.mistral.ai/v1";
  },
};
