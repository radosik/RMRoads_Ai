import * as z from "zod";
import { paymentPlansSchema } from "../env";

export const lemonSqueezyEnvSchema = paymentPlansSchema.extend({
  LEMONSQUEEZY_API_KEY: z.string().default("dev-lemon-api-key"),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().default("dev-lemon-webhook-secret"),
  LEMONSQUEEZY_STORE_ID: z.string().default("dev-lemon-store"),
});
