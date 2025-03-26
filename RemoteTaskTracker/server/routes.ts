import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = await storage.getTasks(req.user.id);
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const validatedTask = insertTaskSchema.parse(req.body);
    const task = await storage.createTask(req.user.id, validatedTask);
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const taskId = parseInt(req.params.id);
    const updates = insertTaskSchema.partial().parse(req.body);
    
    const task = await storage.updateTask(taskId, req.user.id, updates);
    if (!task) return res.sendStatus(404);
    
    res.json(task);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const taskId = parseInt(req.params.id);
    const success = await storage.deleteTask(taskId, req.user.id);
    
    if (!success) return res.sendStatus(404);
    res.sendStatus(204);
  });

  const httpServer = createServer(app);
  return httpServer;
}
