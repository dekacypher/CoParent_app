import type {
  User,
  Child,
  Event,
  Activity,
  Friend,
  SocialEvent,
  ReadingListItem,
  SchoolTask,
  HandoverNote,
  Expense,
  Message,
  Document,
  InsertUser,
  LoginUser,
  InsertExpense,
  InsertMessage,
  InsertDocument
} from "@shared/schema";

const API_BASE = "/api";

// Authentication
export async function register(userData: InsertUser): Promise<Omit<User, 'password'>> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
    credentials: "include"
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to register");
  }
  return res.json();
}

export async function login(credentials: LoginUser): Promise<Omit<User, 'password'>> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    credentials: "include"
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to login");
  }
  return res.json();
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to logout");
}

export async function getCurrentUser(): Promise<Omit<User, 'password'> | null> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    credentials: "include"
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

// Children
export async function getChildren(): Promise<Child[]> {
  const res = await fetch(`${API_BASE}/children`);
  if (!res.ok) throw new Error("Failed to fetch children");
  return res.json();
}

export async function getChild(id: number): Promise<Child> {
  const res = await fetch(`${API_BASE}/children/${id}`);
  if (!res.ok) throw new Error("Failed to fetch child");
  return res.json();
}

// Events
export async function getEvents(childId?: number, startDate?: string, endDate?: string): Promise<Event[]> {
  const params = new URLSearchParams();
  if (childId) params.append("childId", childId.toString());
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  
  const res = await fetch(`${API_BASE}/events?${params}`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function createEvent(event: Omit<Event, "id" | "createdAt">): Promise<Event> {
  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
}

export async function updateEvent(id: number, event: Partial<Event>): Promise<Event> {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
  if (!res.ok) throw new Error("Failed to update event");
  return res.json();
}

export async function deleteEvent(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete event");
}

// Activities
export async function getActivities(season?: string): Promise<Activity[]> {
  const params = season ? `?season=${season}` : "";
  const res = await fetch(`${API_BASE}/activities${params}`);
  if (!res.ok) throw new Error("Failed to fetch activities");
  return res.json();
}

export async function getOsloEvents(): Promise<any> {
  const res = await fetch(`${API_BASE}/oslo-events`);
  if (!res.ok) throw new Error("Failed to fetch Oslo events");
  return res.json();
}

// Friends
export async function getFriends(): Promise<Friend[]> {
  const res = await fetch(`${API_BASE}/friends`);
  if (!res.ok) throw new Error("Failed to fetch friends");
  return res.json();
}

export async function createFriend(friend: Omit<Friend, "id" | "createdAt">): Promise<Friend> {
  const res = await fetch(`${API_BASE}/friends`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(friend)
  });
  if (!res.ok) throw new Error("Failed to create friend");
  return res.json();
}

// Social Events
export async function getSocialEvents(): Promise<SocialEvent[]> {
  const res = await fetch(`${API_BASE}/social-events`);
  if (!res.ok) throw new Error("Failed to fetch social events");
  return res.json();
}

export async function updateSocialEvent(id: number, event: Partial<SocialEvent>): Promise<SocialEvent> {
  const res = await fetch(`${API_BASE}/social-events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });
  if (!res.ok) throw new Error("Failed to update social event");
  return res.json();
}

// Reading List
export async function getReadingList(childId?: number): Promise<ReadingListItem[]> {
  const params = childId ? `?childId=${childId}` : "";
  const res = await fetch(`${API_BASE}/reading-list${params}`);
  if (!res.ok) throw new Error("Failed to fetch reading list");
  return res.json();
}

export async function createReadingListItem(item: Omit<ReadingListItem, "id" | "createdAt">): Promise<ReadingListItem> {
  const res = await fetch(`${API_BASE}/reading-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error("Failed to create reading list item");
  return res.json();
}

export async function updateReadingListItem(id: number, item: Partial<ReadingListItem>): Promise<ReadingListItem> {
  const res = await fetch(`${API_BASE}/reading-list/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error("Failed to update reading list item");
  return res.json();
}

// School Tasks
export async function getSchoolTasks(childId?: number): Promise<SchoolTask[]> {
  const params = childId ? `?childId=${childId}` : "";
  const res = await fetch(`${API_BASE}/school-tasks${params}`);
  if (!res.ok) throw new Error("Failed to fetch school tasks");
  return res.json();
}

export async function updateSchoolTask(id: number, task: Partial<SchoolTask>): Promise<SchoolTask> {
  const res = await fetch(`${API_BASE}/school-tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task)
  });
  if (!res.ok) throw new Error("Failed to update school task");
  return res.json();
}

// Handover Notes
export async function getHandoverNotes(childId?: number): Promise<HandoverNote[]> {
  const params = childId ? `?childId=${childId}` : "";
  const res = await fetch(`${API_BASE}/handover-notes${params}`);
  if (!res.ok) throw new Error("Failed to fetch handover notes");
  return res.json();
}

export async function createHandoverNote(note: Omit<HandoverNote, "id" | "createdAt">): Promise<HandoverNote> {
  const res = await fetch(`${API_BASE}/handover-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note)
  });
  if (!res.ok) throw new Error("Failed to create handover note");
  return res.json();
}

// Expenses
export async function getExpenses(childId?: number, status?: string): Promise<Expense[]> {
  const params = new URLSearchParams();
  if (childId) params.append("childId", childId.toString());
  if (status) params.append("status", status);

  const res = await fetch(`${API_BASE}/expenses?${params}`);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function getExpense(id: number): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses/${id}`);
  if (!res.ok) throw new Error("Failed to fetch expense");
  return res.json();
}

export async function createExpense(expense: InsertExpense): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense)
  });
  if (!res.ok) throw new Error("Failed to create expense");
  return res.json();
}

export async function updateExpense(id: number, expense: Partial<Expense>): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense)
  });
  if (!res.ok) throw new Error("Failed to update expense");
  return res.json();
}

export async function deleteExpense(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete expense");
}

// Messages
export async function getMessages(otherUserId?: string): Promise<Message[]> {
  const params = otherUserId ? `?otherUserId=${otherUserId}` : "";
  const res = await fetch(`${API_BASE}/messages${params}`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function getUnreadCount(): Promise<{ count: number }> {
  const res = await fetch(`${API_BASE}/messages/unread-count`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch unread count");
  return res.json();
}

export async function sendMessage(message: Omit<InsertMessage, "senderId">): Promise<Message> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function markMessageAsRead(id: number): Promise<Message> {
  const res = await fetch(`${API_BASE}/messages/${id}/read`, {
    method: "PATCH",
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to mark message as read");
  return res.json();
}

// Documents
export async function getDocuments(category?: string, childId?: number): Promise<Document[]> {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (childId) params.append("childId", childId.toString());

  const res = await fetch(`${API_BASE}/documents?${params}`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function getDocument(id: number): Promise<Document> {
  const res = await fetch(`${API_BASE}/documents/${id}`);
  if (!res.ok) throw new Error("Failed to fetch document");
  return res.json();
}

export async function uploadDocument(file: File, metadata: {
  title?: string;
  description?: string;
  category: string;
  childId?: number;
  tags?: string[];
  sharedWith?: string[];
}): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata.title) formData.append("title", metadata.title);
  if (metadata.description) formData.append("description", metadata.description);
  formData.append("category", metadata.category);
  if (metadata.childId) formData.append("childId", metadata.childId.toString());
  if (metadata.tags) formData.append("tags", JSON.stringify(metadata.tags));
  if (metadata.sharedWith) formData.append("sharedWith", JSON.stringify(metadata.sharedWith));

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: formData,
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to upload document");
  return res.json();
}

export async function updateDocument(id: number, document: Partial<Document>): Promise<Document> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(document),
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to update document");
  return res.json();
}

export async function deleteDocument(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function shareDocument(id: number, userIds: string[]): Promise<Document> {
  const res = await fetch(`${API_BASE}/documents/${id}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIds }),
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to share document");
  return res.json();
}
