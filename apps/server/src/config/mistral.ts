import { env } from "./env";

export const mistralConfig = {
  apiKey: env.MISTRAL_API_KEY,
  baseUrl: "https://api.mistral.ai/v1",
};
