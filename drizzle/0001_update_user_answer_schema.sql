-- Migration to update UserAnswer table schema
-- Rename existing columns and add new ones

-- Rename correctAns to expectedAnswer
ALTER TABLE "userAnswer" RENAME COLUMN "correctAns" TO "expectedAnswer";

-- Rename userAns to userAnswer
ALTER TABLE "userAnswer" RENAME COLUMN "userAns" TO "userAnswer";

-- Rename feedback to aiFeedback
ALTER TABLE "userAnswer" RENAME COLUMN "feedback" TO "aiFeedback";

-- Add new columns
ALTER TABLE "userAnswer" ADD COLUMN "userAudio" text;
ALTER TABLE "userAnswer" ADD COLUMN "transcript" text;
ALTER TABLE "userAnswer" ADD COLUMN "category" varchar;
ALTER TABLE "userAnswer" ADD COLUMN "difficulty" varchar;
ALTER TABLE "userAnswer" ADD COLUMN "strengths" text;
ALTER TABLE "userAnswer" ADD COLUMN "areasForImprovement" text;
ALTER TABLE "userAnswer" ADD COLUMN "specificSuggestions" text;
ALTER TABLE "userAnswer" ADD COLUMN "technicalAccuracy" integer;
ALTER TABLE "userAnswer" ADD COLUMN "communication" integer;
ALTER TABLE "userAnswer" ADD COLUMN "problemSolving" integer;
ALTER TABLE "userAnswer" ADD COLUMN "overallAssessment" text;
ALTER TABLE "userAnswer" ADD COLUMN "evaluatedAt" varchar;

-- Update rating column type from varchar to integer
ALTER TABLE "userAnswer" ALTER COLUMN "rating" TYPE integer USING rating::integer;
