import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // "parentA" or "parentB"
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;

// Co-Parenting App Tables

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender"),
  interests: text("interests").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  title: text("title").notNull(),
  date: date("date").notNull(),
  parent: text("parent").notNull(), // "A" or "B"
  type: text("type").notNull(), // "custody", "holiday", "activity", "travel"
  description: text("description"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  ageRange: text("age_range").notNull(),
  duration: text("duration").notNull(),
  image: text("image"),
  description: text("description").notNull(),
  season: text("season"), // "winter", "summer", "spring", "fall", "all"
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  relation: text("relation").notNull(),
  kids: text("kids").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const socialEvents = pgTable("social_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: date("date").notNull(),
  location: text("location"),
  friendId: integer("friend_id").references(() => friends.id),
  description: text("description"),
  rsvpStatus: text("rsvp_status").default("pending"), // "pending", "accepted", "declined"
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const readingList = pgTable("reading_list", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  progress: integer("progress").notNull().default(0),
  assignedTo: text("assigned_to").notNull(), // "Parent A" or "Parent B"
  cover: text("cover"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const schoolTasks = pgTable("school_tasks", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  title: text("title").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "in-progress", "completed"
  platform: text("platform").default("Fridge Skole"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const handoverNotes = pgTable("handover_notes", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  parent: text("parent").notNull(), // "A" or "B"
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  title: text("title").notNull(),
  amount: integer("amount").notNull(), // Store as cents to avoid decimal issues
  category: text("category").notNull(), // "medical", "education", "activities", "clothing", "food", "other"
  paidBy: text("paid_by").notNull(), // "parentA" or "parentB"
  splitPercentage: integer("split_percentage").notNull().default(50), // Default 50/50 split
  date: date("date").notNull(),
  receipt: text("receipt"), // URL to receipt image/document
  status: text("status").notNull().default("pending"), // "pending", "approved", "reimbursed"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  // Immutable audit fields - CANNOT be changed after creation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Hash of message content for integrity verification (court admissibility)
  contentHash: text("content_hash").notNull(),
  // IP address for audit trail
  senderIp: text("sender_ip")
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  childId: integer("child_id").references(() => children.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "medical", "legal", "receipt", "school", "court", "other"
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  fileType: text("file_type").notNull(), // MIME type
  sharedWith: text("shared_with").array().notNull().default(sql`ARRAY[]::text[]`), // Array of user IDs
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert Schemas
export const insertChildSchema = createInsertSchema(children).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertFriendSchema = createInsertSchema(friends).omit({ id: true, createdAt: true });
export const insertSocialEventSchema = createInsertSchema(socialEvents).omit({ id: true, createdAt: true });
export const insertReadingListSchema = createInsertSchema(readingList).omit({ id: true, createdAt: true });
export const insertSchoolTaskSchema = createInsertSchema(schoolTasks).omit({ id: true, createdAt: true });
export const insertHandoverNoteSchema = createInsertSchema(handoverNotes).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, contentHash: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Friend = typeof friends.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type SocialEvent = typeof socialEvents.$inferSelect;
export type InsertSocialEvent = z.infer<typeof insertSocialEventSchema>;
export type ReadingListItem = typeof readingList.$inferSelect;
export type InsertReadingListItem = z.infer<typeof insertReadingListSchema>;
export type SchoolTask = typeof schoolTasks.$inferSelect;
export type InsertSchoolTask = z.infer<typeof insertSchoolTaskSchema>;
export type HandoverNote = typeof handoverNotes.$inferSelect;
export type InsertHandoverNote = z.infer<typeof insertHandoverNoteSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
