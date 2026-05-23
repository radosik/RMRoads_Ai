-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "alertEmailsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "alertRecipients" TEXT NOT NULL DEFAULT '';
