import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Test routes
  app.post('/api/tests', requireAuth, upload.single('document'), TestController.createTest);
  app.post('/api/tests/generate', requireAuth, TestController.generateQuestions);
  app.post('/api/tests/flashcards', requireAuth, TestController.generateFlashcards);
  app.get('/api/library', requireAuth, TestController.getUserTests);
  app.post('/api/tests/:id/results', requireAuth, TestController.submitResults);

  const httpServer = createServer(app);

  return httpServer;
}