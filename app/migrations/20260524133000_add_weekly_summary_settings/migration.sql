ALTER TABLE "Organization"
ADD COLUMN "weeklySummaryEmailsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "weeklySummaryRecipients" TEXT NOT NULL DEFAULT '',
ADD COLUMN "weeklySummaryLastSentAt" TIMESTAMP(3),
ADD COLUMN "weeklySummaryEmailStatus" TEXT NOT NULL DEFAULT 'pending';
