-- Migration to make expectedAnswer and userAnswer columns optional
ALTER TABLE "userAnswer" ALTER COLUMN "expectedAnswer" DROP NOT NULL;
ALTER TABLE "userAnswer" ALTER COLUMN "userAnswer" DROP NOT NULL;
