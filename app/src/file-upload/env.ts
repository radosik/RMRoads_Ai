import * as z from "zod";

export const fileUploadEnvSchema = z.object({
  AWS_S3_REGION: z.string().default("us-east-1"),
  AWS_S3_IAM_ACCESS_KEY: z.string().default("dev-aws-access-key"),
  AWS_S3_IAM_SECRET_KEY: z.string().default("dev-aws-secret-key"),
  AWS_S3_FILES_BUCKET: z.string().default("dev-rmroads-files"),
});
