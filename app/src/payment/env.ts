import * as z from "zod";

export const paymentPlansSchema = z.object({
  PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID: z.string().default("dev-hobby-plan"),
  PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID: z.string().default("dev-pro-plan"),
  PAYMENTS_CREDITS_10_PLAN_ID: z.string().default("dev-credits-plan"),
});
