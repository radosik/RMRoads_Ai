ALTER TABLE "ExceptionDecision"
ADD COLUMN "outcomeStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "outcomeNote" TEXT NOT NULL DEFAULT '';
