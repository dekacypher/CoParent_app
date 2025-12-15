import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertChildSchema,
  insertEventSchema,
  insertActivitySchema,
  insertFriendSchema,
  insertSocialEventSchema,
  insertReadingListSchema,
  insertSchoolTaskSchema,
  insertHandoverNoteSchema
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Children routes
  app.get("/api/children", async (req, res) => {
    const children = await storage.getChildren();
    res.json(children);
  });

  app.get("/api/children/:id", async (req, res) => {
    const child = await storage.getChild(parseInt(req.params.id));
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    res.json(child);
  });

  app.post("/api/children", async (req, res) => {
    try {
      const validatedData = insertChildSchema.parse(req.body);
      const child = await storage.createChild(validatedData);
      res.status(201).json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/children/:id", async (req, res) => {
    try {
      const child = await storage.updateChild(parseInt(req.params.id), req.body);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      res.json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Events routes
  app.get("/api/events", async (req, res) => {
    const { childId, startDate, endDate } = req.query;
    const events = await storage.getEvents(
      childId ? parseInt(childId as string) : undefined,
      startDate as string,
      endDate as string
    );
    res.json(events);
  });

  app.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(parseInt(req.params.id));
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  });

  app.post("/api/events", async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.updateEvent(parseInt(req.params.id), req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    const success = await storage.deleteEvent(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(204).send();
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    const { season } = req.query;
    const activities = await storage.getActivities(season as string);
    res.json(activities);
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Friends routes
  app.get("/api/friends", async (req, res) => {
    const friends = await storage.getFriends();
    res.json(friends);
  });

  app.post("/api/friends", async (req, res) => {
    try {
      const validatedData = insertFriendSchema.parse(req.body);
      const friend = await storage.createFriend(validatedData);
      res.status(201).json(friend);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/friends/:id", async (req, res) => {
    try {
      const friend = await storage.updateFriend(parseInt(req.params.id), req.body);
      if (!friend) {
        return res.status(404).json({ error: "Friend not found" });
      }
      res.json(friend);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Social Events routes
  app.get("/api/social-events", async (req, res) => {
    const events = await storage.getSocialEvents();
    res.json(events);
  });

  app.post("/api/social-events", async (req, res) => {
    try {
      const validatedData = insertSocialEventSchema.parse(req.body);
      const event = await storage.createSocialEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/social-events/:id", async (req, res) => {
    try {
      const event = await storage.updateSocialEvent(parseInt(req.params.id), req.body);
      if (!event) {
        return res.status(404).json({ error: "Social event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Reading List routes
  app.get("/api/reading-list", async (req, res) => {
    const { childId } = req.query;
    const items = await storage.getReadingList(
      childId ? parseInt(childId as string) : undefined
    );
    res.json(items);
  });

  app.post("/api/reading-list", async (req, res) => {
    try {
      const validatedData = insertReadingListSchema.parse(req.body);
      const item = await storage.createReadingListItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/reading-list/:id", async (req, res) => {
    try {
      const item = await storage.updateReadingListItem(parseInt(req.params.id), req.body);
      if (!item) {
        return res.status(404).json({ error: "Reading list item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // School Tasks routes
  app.get("/api/school-tasks", async (req, res) => {
    const { childId } = req.query;
    const tasks = await storage.getSchoolTasks(
      childId ? parseInt(childId as string) : undefined
    );
    res.json(tasks);
  });

  app.post("/api/school-tasks", async (req, res) => {
    try {
      const validatedData = insertSchoolTaskSchema.parse(req.body);
      const task = await storage.createSchoolTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/school-tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateSchoolTask(parseInt(req.params.id), req.body);
      if (!task) {
        return res.status(404).json({ error: "School task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Handover Notes routes
  app.get("/api/handover-notes", async (req, res) => {
    const { childId } = req.query;
    const notes = await storage.getHandoverNotes(
      childId ? parseInt(childId as string) : undefined
    );
    res.json(notes);
  });

  app.post("/api/handover-notes", async (req, res) => {
    try {
      const validatedData = insertHandoverNoteSchema.parse(req.body);
      const note = await storage.createHandoverNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  return httpServer;
}
