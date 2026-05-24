-- CreateTable
CREATE TABLE "PilotLead" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "shipmentVolume" TEXT NOT NULL,
    "currentTools" TEXT NOT NULL,
    "disruptionPain" TEXT NOT NULL,
    "pilotGoal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',

    CONSTRAINT "PilotLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PilotLead_createdAt_idx" ON "PilotLead"("createdAt");

-- CreateIndex
CREATE INDEX "PilotLead_workEmail_idx" ON "PilotLead"("workEmail");

-- CreateIndex
CREATE INDEX "PilotLead_status_idx" ON "PilotLead"("status");
