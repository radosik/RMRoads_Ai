-- AlterTable
ALTER TABLE "Organization"
ADD COLUMN     "pilotMode" TEXT NOT NULL DEFAULT 'demo',
ADD COLUMN     "pilotSuccessMetric" TEXT NOT NULL DEFAULT 'Time-to-decision and protected shipment value',
ADD COLUMN     "pilotTargetDecisionHours" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "securityReviewCompleted" BOOLEAN NOT NULL DEFAULT false;
