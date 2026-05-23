import * as z from "zod";

export const plausibleEnvSchema = z.object({
  PLAUSIBLE_API_KEY: z.string().default("dev-plausible-api-key"),
  PLAUSIBLE_SITE_ID: z.string().default("localhost"),
  PLAUSIBLE_BASE_URL: z.string().default("https://plausible.io/api"),
});

export const googleAnalyticsEnvSchema = z.object({
  GOOGLE_ANALYTICS_CLIENT_EMAIL: z.string().default("dev@example.com"),
  GOOGLE_ANALYTICS_PRIVATE_KEY: z.string().default("dev-google-private-key"),
  GOOGLE_ANALYTICS_PROPERTY_ID: z.string().default("dev-google-property"),
});
