import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Helper function to generate UUID-like IDs for SQLite
export const generateId = () => crypto.randomUUID();

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // "parentA" or "parentB"
  parentAName: text("parent_a_name").notNull().default("Parent A"), // Custom name for Parent A
  parentBName: text("parent_b_name").notNull().default("Parent B"), // Custom name for Parent B
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
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

export const children = sqliteTable("children", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender"),
  interests: text("interests").notNull().default("[]"), // JSON array stored as text
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  childId: integer("child_id").references(() => children.id), // Optional - can be 0 for all children
  title: text("title").notNull(),
  startDate: text("start_date").notNull(), // ISO date string for when event starts
  endDate: text("end_date").notNull(), // ISO date string for when event ends (can be same as startDate)
  startTime: text("start_time").notNull().default("00:00"), // Time in HH:MM format
  endTime: text("end_time").notNull().default("23:59"), // Time in HH:MM format
  timeZone: text("time_zone").notNull().default("UTC"), // Time zone (e.g., "Europe/Oslo")
  parent: text("parent").notNull(), // "A" or "B"
  type: text("type").notNull(), // "custody", "holiday", "activity", "travel"
  recurrence: text("recurrence"), // "none", "daily", "weekly", "monthly", "yearly", "custom"
  recurrenceInterval: integer("recurrence_interval").default(1), // e.g., every 2 weeks
  recurrenceEnd: text("recurrence_end"), // ISO date string when recurrence ends (optional)
  recurrenceDays: text("recurrence_days"), // JSON array of days for custom recurrence (e.g., "[1,3,5]" for Mon/Wed/Fri)
  description: text("description"),
  location: text("location"),
  address: text("address"), // Full street address
  city: text("city"), // City name
  postalCode: text("postal_code"), // Postal/ZIP code
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
});

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  category: text("category").notNull(),
  ageRange: text("age_range").notNull(),
  duration: text("duration").notNull(),
  image: text("image"),
  description: text("description").notNull(),
  season: text("season"), // "winter", "summer", "spring", "fall", "all"
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
});

export const friends = sqliteTable("friends", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email"),
  avatar: text("avatar"),
  relation: text("relation").notNull(),
  kids: text("kids").notNull().default("[]"), // JSON array stored as text
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
});

export const socialEvents = sqliteTable("social_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  date: text("date").notNull(), // ISO date string
  location: text("location"),
  friendId: integer("friend_id").references(() => friends.id),
  description: text("description"),
  rsvpStatus: text("rsvp_status").default("pending"), // "pending", "accepted", "declined"
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
});

export const readingList = sqliteTable("reading_list", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  childId: integer("child_id").references(() => children.id).notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  progress: integer("progress").notNull().default(0),
  assignedTo: text("assigned_to").notNull(), // "Parent A" or "Parent B"
  cover: text("cover"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
});

export const schoolTasks = sqliteTable("school_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  childId: integer("child_id").references(() => children.id).notNull(),
  title: text("title").notNull(),
  dueDate: text("due_date").notNull(), // ISO date string
  status: text("status").notNull().default("pending"), // "pending", "in-progress", "completed"
  platform: text("platform").default("Fridge Skole"),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
});

export const handoverNotes = sqliteTable("handover_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  childId: integer("child_id").references(() => children.id).notNull(),
  parent: text("parent").notNull(), // "A" or "B"
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  childId: integer("child_id").references(() => children.id).notNull(),
  title: text("title").notNull(),
  amount: integer("amount").notNull(), // Store as cents to avoid decimal issues
  category: text("category").notNull(), // "medical", "education", "activities", "clothing", "food", "other"
  paidBy: text("paid_by").notNull(), // "parentA" or "parentB"
  splitPercentage: integer("split_percentage").notNull().default(50), // Default 50/50 split
  date: text("date").notNull(), // ISO date string
  receipt: text("receipt"), // URL to receipt image/document
  status: text("status").notNull().default("pending"), // "pending", "approved", "reimbursed"
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: text("sender_id").references(() => users.id).notNull(),
  receiverId: text("receiver_id").references(() => users.id).notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  readAt: integer("read_at", { mode: "timestamp" }),
  // Immutable audit fields - CANNOT be changed after creation
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  // Hash of message content for integrity verification (court admissibility)
  contentHash: text("content_hash").notNull(),
  // IP address for audit trail
  senderIp: text("sender_ip")
});

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  uploadedBy: text("uploaded_by").references(() => users.id).notNull(),
  childId: integer("child_id").references(() => children.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "medical", "legal", "receipt", "school", "court", "other"
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  fileType: text("file_type").notNull(), // MIME type
  sharedWith: text("shared_with").notNull().default("[]"), // JSON array of user IDs
  tags: text("tags").notNull().default("[]"), // JSON array of tags
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull()
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
