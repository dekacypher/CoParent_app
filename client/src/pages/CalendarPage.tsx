import Layout from "@/components/Layout";
import CalendarYearView from "@/components/CalendarYearView";
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/lib/api";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, Share2, Calendar as CalendarIcon, Filter } from "lucide-react";

export default function CalendarPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents()
  });

  const eventsWithDates = events.map(e => ({
    ...e,
    date: parseISO(e.date)
  }));

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading calendar...</div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Yearly Plan</h1>
            <p className="text-muted-foreground mt-1">2025 Schedule Overview</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
             <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button size="sm" className="bg-primary text-white hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm bg-white p-3 rounded-lg border border-border w-fit shadow-sm">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-[hsl(150_30%_60%)]"></div>
             <span>Parent A</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-[hsl(15_50%_65%)]"></div>
             <span>Parent B</span>
           </div>
           <div className="w-px h-4 bg-border mx-2"></div>
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
             <span>Holiday</span>
           </div>
            <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full bg-purple-400"></div>
             <span>Travel</span>
           </div>
        </div>

        <CalendarYearView year={2025} events={eventsWithDates} />
      </div>
    </Layout>
  );
}
