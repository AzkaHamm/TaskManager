import { InsertUser, User, Task, InsertTask } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createTask(userId: number, task: InsertTask): Promise<Task>;
  getTasks(userId: number): Promise<Task[]>;
  updateTask(taskId: number, userId: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(taskId: number, userId: number): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  sessionStore: session.Store;
  private currentUserId: number;
  private currentTaskId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTask(userId: number, task: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const newTask: Task = {
      ...task,
      id,
      userId,
      createdAt: new Date(),
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }

  async updateTask(taskId: number, userId: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(taskId);
    if (!task || task.userId !== userId) return undefined;
    
    const updatedTask: Task = {
      ...task,
      ...updates,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : task.dueDate,
    };
    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }

  async deleteTask(taskId: number, userId: number): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || task.userId !== userId) return false;
    return this.tasks.delete(taskId);
  }
}

export const storage = new MemStorage();
