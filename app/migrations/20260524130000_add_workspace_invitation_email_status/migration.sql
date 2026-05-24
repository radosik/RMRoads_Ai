-- AlterTable
ALTER TABLE "WorkspaceInvitation"
ADD COLUMN     "inviteEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "inviteEmailStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "inviteEmailProviderId" TEXT;
