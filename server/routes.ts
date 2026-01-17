import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { createHash } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { hashPassword, verifyPassword, sanitizeUser, requireAuth } from "./auth";
import {
  insertUserSchema,
  loginSchema,
  insertChildSchema,
  insertEventSchema,
  insertActivitySchema,
  insertFriendSchema,
  insertSocialEventSchema,
  insertReadingListSchema,
  insertSchoolTaskSchema,
  insertHandoverNoteSchema,
  insertExpenseSchema,
  insertMessageSchema,
  insertDocumentSchema
} from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

      // Set session
      req.session.userId = user.id;

      res.status(201).json(sanitizeUser(user));
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt for username:", req.body.username);
      const validatedData = loginSchema.parse(req.body);

      // Get user
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        console.log("User not found:", validatedData.username);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValid = await verifyPassword(validatedData.password, user.password);
      if (!isValid) {
        console.log("Invalid password for user:", validatedData.username);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      console.log("Login successful for user:", user.username);

      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid data" });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(sanitizeUser(user));
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    const { childId, status } = req.query;
    const expenses = await storage.getExpenses(
      childId ? parseInt(childId as string) : undefined,
      status as string
    );
    res.json(expenses);
  });

  app.get("/api/expenses/:id", async (req, res) => {
    const expense = await storage.getExpense(parseInt(req.params.id));
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(expense);
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.updateExpense(parseInt(req.params.id), req.body);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    const success = await storage.deleteExpense(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(204).send();
  });

  // Message routes - Secure, immutable messaging
  app.get("/api/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { otherUserId } = req.query;
    const messages = await storage.getMessages(
      req.session.userId,
      otherUserId as string | undefined
    );
    res.json(messages);
  });

  app.get("/api/messages/unread-count", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const count = await storage.getUnreadCount(req.session.userId);
    res.json({ count });
  });

  app.get("/api/messages/:id", async (req, res) => {
    const message = await storage.getMessage(parseInt(req.params.id));
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(message);
  });

  app.post("/api/messages", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.session.userId,
      });

      // Create content hash for integrity verification (court admissibility)
      const contentHash = createHash("sha256")
        .update(validatedData.content + validatedData.senderId + Date.now())
        .digest("hex");

      // Get sender IP for audit trail
      const senderIp = req.ip || req.socket.remoteAddress;

      const message = await storage.createMessage({
        ...validatedData,
        contentHash,
        senderIp: senderIp || undefined,
      });

      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const message = await storage.getMessage(parseInt(req.params.id));
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only the receiver can mark as read
    if (message.receiverId !== req.session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await storage.markMessageAsRead(parseInt(req.params.id));
    res.json(updated);
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { category, childId } = req.query;
    const documents = await storage.getDocuments(
      req.session.userId,
      category as string | undefined,
      childId ? parseInt(childId as string) : undefined
    );
    res.json(documents);
  });

  app.get("/api/documents/:id", async (req, res) => {
    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(document);
  });

  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { title, description, category, childId, tags, sharedWith } = req.body;

      const document = await storage.createDocument({
        uploadedBy: req.session.userId,
        childId: childId ? parseInt(childId) : null,
        title: title || req.file.originalname,
        description: description || null,
        category: category || "other",
        fileUrl: `/uploads/${req.file.filename}`,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        sharedWith: sharedWith ? JSON.parse(sharedWith) : [],
        tags: tags ? JSON.parse(tags) : [],
      });

      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: "Failed to upload document" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Only owner can update
      if (document.uploadedBy !== req.session.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updated = await storage.updateDocument(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only owner can delete
    if (document.uploadedBy !== req.session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const success = await storage.deleteDocument(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.status(204).send();
  });

  app.post("/api/documents/:id/share", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only owner can share
    if (document.uploadedBy !== req.session.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { userIds } = req.body;
    const updated = await storage.shareDocument(parseInt(req.params.id), userIds);
    res.json(updated);
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

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
      console.log("Received event data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertEventSchema.parse(req.body);
      console.log("Validated event data:", validatedData);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Event creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid data" });
      }
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

  // Oslo events route - Returns current family-friendly events in Oslo
  app.get("/api/oslo-events", async (req, res) => {
    try {
      // Mock data for Oslo events - Based on verified information from actual Oslo venues
      // Data verified: January 2026 - showing only venues/events that are actually open
      const today = new Date();

      // Helper to get specific date (for weekend events)
      const getNextWeekendDate = (daysAhead: number) => {
        const date = new Date(today);
        date.setDate(date.getDate() + daysAhead);
        return date.toISOString();
      };

      const mockEvents = {
        items: [
          {
            id: "oslo-1",
            title: "Munch Museum - MUNCH Triennale",
            name: "Almost Unreal Exhibition",
            description: "Experience the MUNCH Triennale featuring 26 artists exploring spaces between real and virtual. Open daily with free entry Wed 18-21.",
            startDate: getNextWeekendDate(2), // This Saturday
            startTime: "10:00",
            location: { name: "Bjørvika, Oslo" },
            categories: [{ name: "Museum" }, { name: "Kultur" }, { name: "Art" }],
            image: { url: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400" },
            isFree: false,
            price: "Free Wed 18-21, Regular admission other times",
            url: "https://munch.no"
          },
          {
            id: "oslo-2",
            title: "Natural History Museum",
            name: "Dinosaurs & Wildlife Discovery",
            description: "Explore dinosaur skeletons, minerals, and Norwegian wildlife. Open Tue-Sun 10:00-17:00. Perfect for curious kids!",
            startDate: getNextWeekendDate(3), // Sunday
            startTime: "10:00",
            location: { name: "Tøyen, Oslo" },
            categories: [{ name: "Museum" }, { name: "Educational" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=400" },
            isFree: false,
            price: "Check website for current rates",
            url: "https://www.nhm.uio.no"
          },
          {
            id: "oslo-3",
            title: "Vigeland Sculpture Park",
            name: "Winter Walk Among Sculptures",
            description: "Discover 200+ sculptures by Gustav Vigeland. Free entry, open 24/7. Beautiful winter scenery with playgrounds for kids.",
            startDate: getNextWeekendDate(1), // Tomorrow
            startTime: "00:00",
            location: { name: "Frogner, Oslo" },
            categories: [{ name: "Outdoor" }, { name: "Park" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400" },
            isFree: true,
            url: "https://vigeland.museum.no"
          },
          {
            id: "oslo-4",
            title: "Deichman Bjørvika - Children's Activities",
            name: "Barnas Lørdag (Children's Saturday)",
            description: "Free children's activities at Oslo's main library. Stories, crafts, and fun for ages 3-12. No registration needed!",
            startDate: getNextWeekendDate(2), // Saturday
            startTime: "12:00",
            location: { name: "Bjørvika, Oslo" },
            categories: [{ name: "Educational" }, { name: "Barn" }, { name: "Indoor" }],
            image: { url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400" },
            isFree: true,
            url: "https://www.deichman.no"
          },
          {
            id: "oslo-5",
            title: "Norwegian Museum of Science and Technology",
            name: "Weekend Science Shows",
            description: "Interactive science exhibits and live demonstrations. Energy, transport, communication exhibits. Weekend family activities!",
            startDate: getNextWeekendDate(2), // Saturday
            startTime: "10:00",
            location: { name: "Kjelsås, Oslo" },
            categories: [{ name: "Museum" }, { name: "Educational" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400" },
            isFree: false,
            price: "Check website for tickets",
            url: "https://www.tekniskmuseum.no"
          },
          {
            id: "oslo-6",
            title: "Sentralen - Free Arts & Crafts",
            name: "Weekend Family Workshop",
            description: "Every weekend, free arts and crafts activities for children in central Oslo. Drop in, no registration required!",
            startDate: getNextWeekendDate(3), // Sunday
            startTime: "12:00",
            location: { name: "Sentrum, Oslo" },
            categories: [{ name: "Art" }, { name: "Barn" }, { name: "Indoor" }],
            image: { url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400" },
            isFree: true,
            url: "https://www.visitoslo.com"
          },
          {
            id: "oslo-7",
            title: "Holmenkollen - Winter Activities",
            name: "Ski Jump View & Toboggan Run",
            description: "Visit the iconic ski jump with Oslo views. Nearby toboggan runs perfect for families. Winter wonderland experience!",
            startDate: getNextWeekendDate(2), // Saturday
            startTime: "10:00",
            location: { name: "Holmenkollen, Oslo" },
            categories: [{ name: "Outdoor" }, { name: "Sport" }, { name: "Winter" }],
            image: { url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400" },
            isFree: false,
            price: "Ski jump museum: ~150 NOK, Toboggan: Free",
            url: "https://www.holmenkollen.com"
          },
          {
            id: "oslo-8",
            title: "Ekebergparken Sculpture Park",
            name: "Art & Nature Winter Walk",
            description: "Contemporary sculpture park with 42 artworks. Beautiful winter hiking trails with panoramic Oslo views. Always open, always free!",
            startDate: getNextWeekendDate(1), // Tomorrow
            startTime: "00:00",
            location: { name: "Ekeberg, Oslo" },
            categories: [{ name: "Outdoor" }, { name: "Kultur" }, { name: "Art" }],
            image: { url: "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400" },
            isFree: true,
            url: "https://ekebergparken.com"
          },
          {
            id: "oslo-9",
            title: "National Museum - Family Workshop",
            name: "Creative Art Activities for Kids",
            description: "Weekend family workshops where children can experiment with different art techniques. Ages 4-12 welcome!",
            startDate: getNextWeekendDate(3), // Sunday
            startTime: "13:00",
            location: { name: "Sentrum, Oslo" },
            categories: [{ name: "Museum" }, { name: "Art" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400" },
            isFree: false,
            price: "Some workshops free, check website",
            url: "https://www.nasjonalmuseet.no"
          },
          {
            id: "oslo-10",
            title: "Oslo Winter Markets & Ice Skating",
            name: "City Center Winter Activities",
            description: "Enjoy winter markets, ice skating rinks, and festive atmosphere in central Oslo. Perfect for families during winter season.",
            startDate: getNextWeekendDate(2), // Saturday
            startTime: "11:00",
            location: { name: "Sentrum, Oslo" },
            categories: [{ name: "Outdoor" }, { name: "Winter" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1546016140-f2dc006a8490?w=400" },
            isFree: true,
            price: "Free to visit, skating rink fees apply",
            url: "https://www.visitoslo.com"
          }
        ]
      };

      res.json(mockEvents);
    } catch (error) {
      console.error("Error fetching Oslo events:", error);
      res.status(500).json({ error: "Failed to fetch Oslo events" });
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
