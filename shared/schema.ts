import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  avatar: text("avatar"),
  preferences: jsonb("preferences").$type<{
    defaultQuizLength: number;
    autoSaveToLibrary: boolean;
    questionDifficulty: string;
    studyReminders: boolean;
    emailNotifications: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tests = pgTable("tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  notes: text("notes").notNull(),
  questions: jsonb("questions").$type<Array<{
    id: string;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    sourceText?: string;
  }>>().notNull(),
  questionCount: integer("question_count").notNull(),
  timeLimit: integer("time_limit"), // in minutes
  difficulty: text("difficulty").notNull().default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const testResults = pgTable("test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  testId: varchar("test_id").references(() => tests.id).notNull(),
  score: integer("score").notNull(), // percentage
  timeTaken: integer("time_taken").notNull(), // in minutes
  answers: jsonb("answers").$type<Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }>>().notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  createdAt: true,
});

export const insertTestResultSchema = createInsertSchema(testResults).omit({
  id: true,
  completedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;
export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResults.$inferSelect;
