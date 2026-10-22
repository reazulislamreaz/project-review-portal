-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "previousFeedback" TEXT;
ALTER TABLE "Submission" ADD COLUMN "resubmittedAt" TIMESTAMP(3);
