import { db } from "./db";
import * as schema from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("Seeding database...");

  // Create default user
  const hashedPassword = await hashPassword("password123");
  const [user] = await db.insert(schema.users).values({
    username: "parent",
    password: hashedPassword,
    email: "parent@example.com",
    role: "parentA"
  }).returning();

  console.log("Created user:", { id: user.id, username: user.username, email: user.email, role: user.role });

  // Create sample child
  const [child] = await db.insert(schema.children).values({
    name: "Emma",
    age: 8,
    gender: "female",
    interests: JSON.stringify(["art", "reading", "swimming"])
  }).returning();

  console.log("Created child:", child);

  // Create sample activities
  const activitiesData = [
    {
      title: "Nature Scavenger Hunt",
      category: "Outdoor",
      ageRange: "5-10",
      duration: "1-2 hours",
      description: "Explore nature and find hidden treasures in your backyard or local park",
      image: "https://images.unsplash.com/photo-1503616498700-d2bf1387fc6a?w=400",
      season: "all"
    },
    {
      title: "DIY Volcano Experiment",
      category: "Educational",
      ageRange: "6-12",
      duration: "30 mins",
      description: "Learn about chemical reactions with this fun baking soda volcano",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400",
      season: "all"
    },
    {
      title: "Indoor Camping Adventure",
      category: "Indoor",
      ageRange: "4-10",
      duration: "2-3 hours",
      description: "Set up a tent indoors and have a cozy camping experience",
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400",
      season: "all"
    },
    {
      title: "Watercolor Painting",
      category: "Arts & Crafts",
      ageRange: "5-12",
      duration: "1 hour",
      description: "Express creativity through beautiful watercolor art projects",
      image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
      season: "all"
    }
  ];

  await db.insert(schema.activities).values(activitiesData);
  console.log("Created activities");

  console.log("✅ Database seeded successfully!");
}

seed().catch(console.error).finally(() => process.exit(0));
