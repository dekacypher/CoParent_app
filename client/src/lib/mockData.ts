import { addDays, format, startOfYear, eachWeekOfInterval, endOfYear, isSameDay } from "date-fns";

export type Parent = "A" | "B";

export interface Event {
  id: string;
  title: string;
  date: Date;
  parent: Parent;
  type: "custody" | "holiday" | "activity" | "travel";
}

export const generateYearlySchedule = (year: number): Event[] => {
  const startDate = startOfYear(new Date(year, 0, 1));
  const endDate = endOfYear(startDate);
  const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
  const events: Event[] = [];

  // Mock 50/50 Schedule: Week on / Week off (switching on Sundays)
  // Or the specific request: Parent A (Fri-Sun), Parent B (Sun-Fri)
  
  // Let's implement the specific request:
  // Parent A: Fri afternoon -> Sun afternoon
  // Parent B: Sun evening -> Fri morning
  
  let currentDate = startDate;
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    
    let parent: Parent = "B"; // Default to B (Weekdays)
    
    if (dayOfWeek === 5) {
      // Friday - Split day, but let's simplify for visualization to "Transition" or predominantly B day then A eve
      parent = "B"; 
    } else if (dayOfWeek === 6) {
      // Saturday - Parent A
      parent = "A";
    } else if (dayOfWeek === 0) {
      // Sunday - Split day, predominantly A then B eve
      parent = "A";
    }

    events.push({
      id: `custody-${format(currentDate, 'yyyy-MM-dd')}`,
      title: parent === "A" ? "Parent A" : "Parent B",
      date: currentDate,
      parent: parent,
      type: "custody"
    });

    currentDate = addDays(currentDate, 1);
  }

  // Add some holidays and activities
  events.push({ id: 'h1', title: 'Summer Vacation', date: new Date(year, 6, 15), parent: 'A', type: 'travel' });
  events.push({ id: 'h2', title: 'Christmas', date: new Date(year, 11, 25), parent: 'B', type: 'holiday' });
  events.push({ id: 'a1', title: 'Soccer Practice', date: new Date(year, 2, 10), parent: 'B', type: 'activity' });
  events.push({ id: 'a2', title: 'Piano Lesson', date: new Date(year, 2, 12), parent: 'B', type: 'activity' });

  return events;
};

export const MOCK_EVENTS = generateYearlySchedule(2025);

export const SUGGESTED_ACTIVITIES = [
  {
    id: 1,
    title: "Nature Scavenger Hunt",
    category: "Outdoor",
    ageRange: "5-10",
    duration: "2 hours",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Explore the local park and find items on a list. Great for bonding and outdoor education."
  },
  {
    id: 2,
    title: "Science Museum Visit",
    category: "Educational",
    ageRange: "6-12",
    duration: "Half Day",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Interactive learning experience. Check for special weekend workshops."
  },
  {
    id: 3,
    title: "Home Baking Day",
    category: "Indoor",
    ageRange: "4-14",
    duration: "3 hours",
    image: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Bake cookies or a cake together. Teaches math (measuring) and patience."
  },
  {
    id: 4,
    title: "Bike Riding Trail",
    category: "Active",
    ageRange: "8+",
    duration: "2-4 hours",
    image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: "Hit the local trails for some exercise and fresh air."
  }
];
