import type { 
  Child, 
  Event, 
  Activity, 
  Friend, 
  SocialEvent, 
  ReadingListItem, 
  SchoolTask, 
  HandoverNote 
} from "@shared/schema";

const API_BASE = "/api";

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

// Activities
export async function getActivities(season?: string): Promise<Activity[]> {
  const params = season ? `?season=${season}` : "";
  const res = await fetch(`${API_BASE}/activities${params}`);
  if (!res.ok) throw new Error("Failed to fetch activities");
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
