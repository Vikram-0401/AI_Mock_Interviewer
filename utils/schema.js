import { pgTable, serial, text, varchar, integer } from "drizzle-orm/pg-core";

export const MockInterview = pgTable('mockInterview', {
    id: serial('id').primaryKey(),
    jsonMockResp: text('jsonMockResp').notNull(),
    jobPosition: varchar('jobPosition').notNull(),
    jobDesc: varchar('jobDesc').notNull(),
    jobExperience: varchar('jobExperience').notNull(),
    createdBy: varchar('createdBy').notNull(),
    createdAt: varchar('createdAt'),
    mockId: varchar('mockId').notNull()
});

export const UserAnswer = pgTable('userAnswer', {
    id: serial('id').primaryKey(),
    mockIdRef: varchar('mockId').notNull(),
    question: text('question').notNull(),
    expectedAnswer: text('expectedAnswer'), // Made optional
    userAnswer: text('userAnswer'), // Made optional
    userAudio: text('userAudio'), // Base64 audio data
    transcript: text('transcript'),
    aiFeedback: text('aiFeedback'),
    rating: integer('rating'), // 1-10 scale
    category: varchar('category'), // technical, behavioral, etc.
    difficulty: varchar('difficulty'), // junior, mid, senior
    strengths: text('strengths'), // JSON array of strengths
    areasForImprovement: text('areasForImprovement'), // JSON array of improvement areas
    specificSuggestions: text('specificSuggestions'), // JSON array of suggestions
    technicalAccuracy: integer('technicalAccuracy'), // 1-10 scale
    communication: integer('communication'), // 1-10 scale
    problemSolving: integer('problemSolving'), // 1-10 scale
    overallAssessment: text('overallAssessment'),
    userEmail: varchar('userEmail'),
    createdAt: varchar('createdAt'),
    evaluatedAt: varchar('evaluatedAt')
});