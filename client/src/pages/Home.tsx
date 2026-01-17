import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/lib/api";
import { format, isSameDay, parseISO } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Sun, ChevronRight, Plus } from "lucide-react";
import ActivitySuggestions from "@/components/ActivitySuggestions";
import { Link } from "wouter";
import generatedImage from '@assets/generated_images/abstract_soft_shapes_representing_family_harmony.png';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

export default function Home() {
  const today = new Date(2025, 2, 14); // Mock date for demo (March 14, 2025)
  const [selectedEvent, setSelectedEvent] = useState<typeof eventsWithDates[0] | null>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents()
  });

  const eventsWithDates = events.map(e => ({
    ...e,
    date: parseISO(e.startDate)
  }));

  const todaysEvent = eventsWithDates.find(e => isSameDay(e.date, today));
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Main Section - Welcome & Status */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Hero / Welcome */}
          <div className="relative overflow-hidden rounded-2xl bg-primary/5 border border-primary/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="z-10 max-w-md">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                Good Morning, Sarah
              </h1>
              <p className="text-muted-foreground">
                Everything is on track. You have the kids this weekend starting Friday at 3:00 PM.
              </p>
              <div className="mt-6 flex gap-3">
                 <Link href="/calendar">
                  <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                    View Full Calendar
                  </Button>
                </Link>
                <Link href="/expenses">
                  <Button variant="outline" className="rounded-full bg-white/50 border-primary/20 hover:bg-white">
                    Log Expense
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none hidden md:block">
               <img src={generatedImage} alt="Abstract Harmony" className="h-full w-full object-cover mix-blend-multiply" />
            </div>
          </div>

          {/* Today's Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-none shadow-sm soft-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
                <Sun className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">With Parent B</div>
                <p className="text-xs text-muted-foreground">Until Friday, Mar 15 • 3:00 PM</p>
                <div className="mt-4 h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 w-[70%]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm soft-shadow">
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Handover</CardTitle>
                <MapPin className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">School Pickup</div>
                <p className="text-xs text-muted-foreground">Friday, Mar 15 • Lincoln Elementary</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 w-fit px-2 py-1 rounded-md">
                   Parent B → Parent A
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Schedule Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">Next 7 Days</h2>
              <Button variant="ghost" size="sm" className="text-muted-foreground">See all</Button>
            </div>
            <div className="bg-white rounded-xl p-1 shadow-sm border border-border">
              {eventsWithDates.filter(e => e.date >= today).slice(0, 5).map((event, i) => (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
                    i !== 4 && "border-b border-border/50"
                  )}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex flex-col items-center justify-center text-xs font-bold border",
                      isSameDay(event.date, today)
                        ? "bg-primary text-white border-primary"
                        : "bg-background text-muted-foreground border-border"
                    )}>
                      <span>{format(event.date, 'MMM')}</span>
                      <span className="text-lg">{format(event.date, 'd')}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.type} • {event.startTime} - {event.endTime} {event.timeZone}
                      </p>
                      {event.startDate !== event.endDate && (
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(event.endDate), 'MMM do')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {event.recurrence && event.recurrence !== 'none' && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {event.recurrence}
                      </span>
                    )}
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      event.parent === 'A'
                        ? "bg-[hsl(150_30%_60%)]/20 text-[hsl(150_30%_30%)]"
                        : "bg-[hsl(15_50%_65%)]/20 text-[hsl(15_50%_40%)]"
                    )}>
                      Parent {event.parent}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Section - Suggestions & Quick Actions */}
        <div className="space-y-8">
          
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="font-display font-bold text-lg mb-2">Auto-Plan 2026</h3>
                <p className="text-indigo-100 text-sm mb-4">Ready to set up next year? Generate a complete schedule in seconds.</p>
                <Link href="/calendar">
                  <Button variant="secondary" size="sm" className="w-full bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                    Start Planning
                  </Button>
                </Link>
             </div>
             {/* Decorative circles */}
             <div className="absolute top-[-20%] right-[-20%] w-32 h-32 rounded-full bg-white/10 blur-2xl" />
             <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 rounded-full bg-purple-400/20 blur-xl" />
          </div>

          <ActivitySuggestions />
          
          <div className="bg-secondary/30 rounded-xl p-6 border border-secondary">
             <h3 className="font-display font-bold text-lg mb-4">Quick Add</h3>
             <div className="space-y-2">
                <Link href="/calendar" className="block">
                  <Button variant="outline" className="w-full justify-start bg-white hover:bg-white/80 border-secondary-foreground/10 text-secondary-foreground">
                    <Plus className="w-4 h-4 mr-2" /> Add Event
                  </Button>
                </Link>
                <Link href="/messages" className="block">
                  <Button variant="outline" className="w-full justify-start bg-white hover:bg-white/80 border-secondary-foreground/10 text-secondary-foreground">
                    <Plus className="w-4 h-4 mr-2" /> Request Change
                  </Button>
                </Link>
             </div>
          </div>

        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {format(selectedEvent.date, 'EEEE, MMMM do, yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.startTime} - {selectedEvent.endTime} {selectedEvent.timeZone}
                    </p>
                  </div>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                    </div>
                  </div>
                )}
                {selectedEvent.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2">
                  <div className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium",
                    selectedEvent.parent === 'A'
                      ? "bg-[hsl(150_30%_60%)]/20 text-[hsl(150_30%_30%)]"
                      : "bg-[hsl(15_50%_65%)]/20 text-[hsl(15_50%_40%)]"
                  )}>
                    Parent {selectedEvent.parent}
                  </div>
                  <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                    {selectedEvent.type}
                  </div>
                  {selectedEvent.recurrence && selectedEvent.recurrence !== 'none' && (
                    <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground">
                      {selectedEvent.recurrence}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
