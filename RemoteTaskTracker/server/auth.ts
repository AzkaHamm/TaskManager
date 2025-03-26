import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        log(`Attempting login for user: ${username}`, "auth");
        const user = await storage.getUserByUsername(username);
        if (!user) {
          log(`User not found: ${username}`, "auth");
          return done(null, false);
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          log(`Invalid password for user: ${username}`, "auth");
          return done(null, false);
        }

        log(`Login successful for user: ${username}`, "auth");
        return done(null, user);
      } catch (error) {
        log(`Login error: ${error}`, "auth");
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    log(`Serializing user: ${user.id}`, "auth");
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      log(`Deserializing user: ${id}`, "auth");
      const user = await storage.getUser(id);
      if (!user) {
        log(`User not found during deserialization: ${id}`, "auth");
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      log(`Deserialization error: ${error}`, "auth");
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      log(`Registration attempt for username: ${req.body.username}`, "auth");
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        log(`Username already exists: ${req.body.username}`, "auth");
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      log(`User registered successfully: ${user.id}`, "auth");
      req.login(user, (err) => {
        if (err) {
          log(`Login error after registration: ${err}`, "auth");
          return next(err);
        }
        res.status(201).json(user);
      });
    } catch (error) {
      log(`Registration error: ${error}`, "auth");
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    log(`Login attempt for username: ${req.body.username}`, "auth");
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        log(`Login error: ${err}`, "auth");
        return next(err);
      }
      if (!user) {
        log(`Login failed for username: ${req.body.username}`, "auth");
        return res.status(401).send("Invalid username or password");
      }
      req.login(user, (err) => {
        if (err) {
          log(`Session creation error: ${err}`, "auth");
          return next(err);
        }
        log(`Login successful for user: ${user.id}`, "auth");
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const userId = req.user?.id;
    log(`Logout attempt for user: ${userId}`, "auth");
    req.logout((err) => {
      if (err) {
        log(`Logout error: ${err}`, "auth");
        return next(err);
      }
      log(`Logout successful for user: ${userId}`, "auth");
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      log("Unauthenticated user access attempt", "auth");
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}