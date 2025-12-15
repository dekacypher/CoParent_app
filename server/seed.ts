import { db } from "./db";
import { children, events, activities, friends, readingList, schoolTasks, handoverNotes } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Create a default child
  const [child] = await db.insert(children).values({
    name: "Emma",
    age: 8,
    gender: "female",
    interests: ["reading", "swimming", "art"]
  }).returning();

  console.log("Created child:", child);

  // Seed some events for 2025
  const eventData = [];
  const year = 2025;
  
  // Generate custody schedule for the year
  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= 28; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      
      let parent: "A" | "B" = "B";
      if (dayOfWeek === 6) parent = "A"; // Saturday
      else if (dayOfWeek === 0) parent = "A"; // Sunday
      
      eventData.push({
        childId: child.id,
        title: `Parent ${parent}`,
        date: date.toISOString().split('T')[0],
        parent,
        type: "custody" as const,
        description: null,
        location: null
      });
    }
  }

  // Add some special events
  eventData.push(
    {
      childId: child.id,
      title: "Summer Vacation",
      date: "2025-07-15",
      parent: "A" as const,
      type: "travel" as const,
      description: "Beach house trip",
      location: "Cape Cod"
    },
    {
      childId: child.id,
      title: "Christmas",
      date: "2025-12-25",
      parent: "B" as const,
      type: "holiday" as const,
      description: "Christmas morning",
      location: "Home"
    }
  );

  await db.insert(events).values(eventData);
  console.log("Created events");

  // Seed activities
  await db.insert(activities).values([
    {
      title: "Nature Scavenger Hunt",
      category: "Outdoor",
      ageRange: "5-10",
      duration: "2 hours",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Explore the local park and find items on a list. Great for bonding and outdoor education.",
      season: "spring"
    },
    {
      title: "Science Museum Visit",
      category: "Educational",
      ageRange: "6-12",
      duration: "Half Day",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Interactive learning experience. Check for special weekend workshops.",
      season: "all"
    },
    {
      title: "Home Baking Day",
      category: "Indoor",
      ageRange: "4-14",
      duration: "3 hours",
      image: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Bake cookies or a cake together. Teaches math (measuring) and patience.",
      season: "all"
    },
    {
      title: "Bike Riding Trail",
      category: "Active",
      ageRange: "8+",
      duration: "2-4 hours",
      image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Hit the local trails for some exercise and fresh air.",
      season: "summer"
    },
    {
      title: "Intro to Swahili",
      category: "Language",
      ageRange: "6-12",
      duration: "1 hour",
      image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "Beginner friendly language course for kids. Learn basic greetings and animals.",
      season: "all"
    },
    {
      title: "Family Theater: The Lion King",
      category: "Entertainment",
      ageRange: "All ages",
      duration: "2.5 hours",
      image: "https://images.unsplash.com/photo-1503095392237-7362137d70ae?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      description: "The classic musical is back in town. Great for a weekend afternoon.",
      season: "all"
    }
  ]);
  console.log("Created activities");

  // Seed friends
  await db.insert(friends).values([
    { name: "The Johnsons", avatar: "J", relation: "Neighbors", kids: ["Mikey (8)"] },
    { name: "Sarah & Tom", avatar: "S", relation: "School Friends", kids: ["Emma (7)", "Noah (5)"] },
    { name: "Grandma Judy", avatar: "G", relation: "Family", kids: [] }
  ]);
  console.log("Created friends");

  // Seed reading list
  await db.insert(readingList).values([
    {
      childId: child.id,
      title: "Harry Potter and the Sorcerer's Stone",
      author: "J.K. Rowling",
      progress: 65,
      assignedTo: "Parent A",
      cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
      childId: child.id,
      title: "Charlotte's Web",
      author: "E.B. White",
      progress: 100,
      assignedTo: "Parent B",
      cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
      childId: child.id,
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      progress: 15,
      assignedTo: "Parent A",
      cover: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    }
  ]);
  console.log("Created reading list");

  // Seed school tasks
  await db.insert(schoolTasks).values([
    {
      childId: child.id,
      title: "Math Worksheet: Fractions",
      dueDate: "2025-03-20",
      status: "pending",
      platform: "Fridge Skole"
    },
    {
      childId: child.id,
      title: "Science Fair Project Proposal",
      dueDate: "2025-03-25",
      status: "in-progress",
      platform: "Fridge Skole"
    },
    {
      childId: child.id,
      title: "Permission Slip: Zoo Trip",
      dueDate: "2025-03-18",
      status: "completed",
      platform: "Fridge Skole"
    }
  ]);
  console.log("Created school tasks");

  // Seed a handover note
  await db.insert(handoverNotes).values([
    {
      childId: child.id,
      parent: "B",
      message: "Forgot the math textbook at my place, dropping it off at school tomorrow morning."
    }
  ]);
  console.log("Created handover notes");

  console.log("✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});
