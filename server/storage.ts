import { 
  type User, 
  type InsertUser,
  type Child,
  type InsertChild,
  type Event,
  type InsertEvent,
  type Activity,
  type InsertActivity,
  type Friend,
  type InsertFriend,
  type SocialEvent,
  type InsertSocialEvent,
  type ReadingListItem,
  type InsertReadingListItem,
  type SchoolTask,
  type InsertSchoolTask,
  type HandoverNote,
  type InsertHandoverNote,
  users,
  children,
  events,
  activities,
  friends,
  socialEvents,
  readingList,
  schoolTasks,
  handoverNotes
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Children methods
  getChildren(): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<InsertChild>): Promise<Child | undefined>;

  // Events methods
  getEvents(childId?: number, startDate?: string, endDate?: string): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Activities methods
  getActivities(season?: string): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Friends methods
  getFriends(): Promise<Friend[]>;
  getFriend(id: number): Promise<Friend | undefined>;
  createFriend(friend: InsertFriend): Promise<Friend>;
  updateFriend(id: number, friend: Partial<InsertFriend>): Promise<Friend | undefined>;

  // Social Events methods
  getSocialEvents(): Promise<SocialEvent[]>;
  getSocialEvent(id: number): Promise<SocialEvent | undefined>;
  createSocialEvent(event: InsertSocialEvent): Promise<SocialEvent>;
  updateSocialEvent(id: number, event: Partial<InsertSocialEvent>): Promise<SocialEvent | undefined>;

  // Reading List methods
  getReadingList(childId?: number): Promise<ReadingListItem[]>;
  getReadingListItem(id: number): Promise<ReadingListItem | undefined>;
  createReadingListItem(item: InsertReadingListItem): Promise<ReadingListItem>;
  updateReadingListItem(id: number, item: Partial<InsertReadingListItem>): Promise<ReadingListItem | undefined>;

  // School Tasks methods
  getSchoolTasks(childId?: number): Promise<SchoolTask[]>;
  getSchoolTask(id: number): Promise<SchoolTask | undefined>;
  createSchoolTask(task: InsertSchoolTask): Promise<SchoolTask>;
  updateSchoolTask(id: number, task: Partial<InsertSchoolTask>): Promise<SchoolTask | undefined>;

  // Handover Notes methods
  getHandoverNotes(childId?: number): Promise<HandoverNote[]>;
  createHandoverNote(note: InsertHandoverNote): Promise<HandoverNote>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Children methods
  async getChildren(): Promise<Child[]> {
    return db.select().from(children);
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child || undefined;
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db.insert(children).values(child).returning();
    return newChild;
  }

  async updateChild(id: number, child: Partial<InsertChild>): Promise<Child | undefined> {
    const [updated] = await db.update(children).set(child).where(eq(children.id, id)).returning();
    return updated || undefined;
  }

  // Events methods
  async getEvents(childId?: number, startDate?: string, endDate?: string): Promise<Event[]> {
    let query = db.select().from(events);
    
    const conditions = [];
    if (childId) conditions.push(eq(events.childId, childId));
    if (startDate) conditions.push(gte(events.date, startDate));
    if (endDate) conditions.push(lte(events.date, endDate));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(event).where(eq(events.id, id)).returning();
    return updated || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Activities methods
  async getActivities(season?: string): Promise<Activity[]> {
    if (season) {
      return db.select().from(activities).where(eq(activities.season, season));
    }
    return db.select().from(activities);
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Friends methods
  async getFriends(): Promise<Friend[]> {
    return db.select().from(friends);
  }

  async getFriend(id: number): Promise<Friend | undefined> {
    const [friend] = await db.select().from(friends).where(eq(friends.id, id));
    return friend || undefined;
  }

  async createFriend(friend: InsertFriend): Promise<Friend> {
    const [newFriend] = await db.insert(friends).values(friend).returning();
    return newFriend;
  }

  async updateFriend(id: number, friend: Partial<InsertFriend>): Promise<Friend | undefined> {
    const [updated] = await db.update(friends).set(friend).where(eq(friends.id, id)).returning();
    return updated || undefined;
  }

  // Social Events methods
  async getSocialEvents(): Promise<SocialEvent[]> {
    return db.select().from(socialEvents);
  }

  async getSocialEvent(id: number): Promise<SocialEvent | undefined> {
    const [event] = await db.select().from(socialEvents).where(eq(socialEvents.id, id));
    return event || undefined;
  }

  async createSocialEvent(event: InsertSocialEvent): Promise<SocialEvent> {
    const [newEvent] = await db.insert(socialEvents).values(event).returning();
    return newEvent;
  }

  async updateSocialEvent(id: number, event: Partial<InsertSocialEvent>): Promise<SocialEvent | undefined> {
    const [updated] = await db.update(socialEvents).set(event).where(eq(socialEvents.id, id)).returning();
    return updated || undefined;
  }

  // Reading List methods
  async getReadingList(childId?: number): Promise<ReadingListItem[]> {
    if (childId) {
      return db.select().from(readingList).where(eq(readingList.childId, childId));
    }
    return db.select().from(readingList);
  }

  async getReadingListItem(id: number): Promise<ReadingListItem | undefined> {
    const [item] = await db.select().from(readingList).where(eq(readingList.id, id));
    return item || undefined;
  }

  async createReadingListItem(item: InsertReadingListItem): Promise<ReadingListItem> {
    const [newItem] = await db.insert(readingList).values(item).returning();
    return newItem;
  }

  async updateReadingListItem(id: number, item: Partial<InsertReadingListItem>): Promise<ReadingListItem | undefined> {
    const [updated] = await db.update(readingList).set(item).where(eq(readingList.id, id)).returning();
    return updated || undefined;
  }

  // School Tasks methods
  async getSchoolTasks(childId?: number): Promise<SchoolTask[]> {
    if (childId) {
      return db.select().from(schoolTasks).where(eq(schoolTasks.childId, childId));
    }
    return db.select().from(schoolTasks);
  }

  async getSchoolTask(id: number): Promise<SchoolTask | undefined> {
    const [task] = await db.select().from(schoolTasks).where(eq(schoolTasks.id, id));
    return task || undefined;
  }

  async createSchoolTask(task: InsertSchoolTask): Promise<SchoolTask> {
    const [newTask] = await db.insert(schoolTasks).values(task).returning();
    return newTask;
  }

  async updateSchoolTask(id: number, task: Partial<InsertSchoolTask>): Promise<SchoolTask | undefined> {
    const [updated] = await db.update(schoolTasks).set(task).where(eq(schoolTasks.id, id)).returning();
    return updated || undefined;
  }

  // Handover Notes methods
  async getHandoverNotes(childId?: number): Promise<HandoverNote[]> {
    let query = db.select().from(handoverNotes).orderBy(desc(handoverNotes.createdAt));
    
    if (childId) {
      return query.where(eq(handoverNotes.childId, childId));
    }
    return query;
  }

  async createHandoverNote(note: InsertHandoverNote): Promise<HandoverNote> {
    const [newNote] = await db.insert(handoverNotes).values(note).returning();
    return newNote;
  }
}

export const storage = new DatabaseStorage();
