import * as z from "zod";
import { paymentPlansSchema } from "../env";

export const stripeEnvSchema = paymentPlansSchema.extend({
  STRIPE_API_KEY: z.string().default("sk_test_dev_placeholder"),
  STRIPE_WEBHOOK_SECRET: z.string().default("whsec_dev_placeholder"),
});
