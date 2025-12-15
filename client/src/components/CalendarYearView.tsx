import { useState } from "react";
import { format, startOfYear, endOfYear, eachMonthOfInterval, getDay, getDaysInMonth, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Event, Parent } from "@/lib/mockData";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface CalendarYearViewProps {
  year: number;
  events: Event[];
}

export default function CalendarYearView({ year, events }: CalendarYearViewProps) {
  const startDate = startOfYear(new Date(year, 0, 1));
  const endDate = endOfYear(startDate);
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  const getEventForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Simple lookup - in real app use a map for O(1)
    return events.find(e => format(e.date, 'yyyy-MM-dd') === dateStr);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {months.map((month) => (
        <div key={month.toString()} className="bg-white rounded-xl p-4 shadow-sm border border-border/50">
          <h3 className="font-display font-bold text-lg mb-4 text-center">{format(month, 'MMMM')}</h3>
          
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
              <div key={d} className="font-medium">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for start of month */}
            {Array.from({ length: getDay(startOfMonth(month)) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Days */}
            {Array.from({ length: getDaysInMonth(month) }).map((_, i) => {
              const date = new Date(year, month.getMonth(), i + 1);
              const event = getEventForDate(date);
              const isWeekend = getDay(date) === 0 || getDay(date) === 6;

              let bgClass = "bg-transparent";
              let textClass = "text-foreground";
              
              if (event) {
                if (event.type === 'travel') {
                   bgClass = "bg-purple-100 text-purple-700 ring-1 ring-purple-200";
                } else if (event.type === 'holiday') {
                   bgClass = "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200";
                } else if (event.parent === 'A') {
                  bgClass = "bg-[hsl(150_30%_60%)]/20 text-[hsl(150_30%_30%)]";
                } else {
                  bgClass = "bg-[hsl(15_50%_65%)]/20 text-[hsl(15_50%_40%)]";
                }
              }

              return (
                <TooltipProvider key={i}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-md text-sm cursor-pointer transition-all hover:scale-110",
                          bgClass,
                          !event && "hover:bg-muted"
                        )}
                      >
                        {i + 1}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{format(date, 'MMM do, yyyy')}</p>
                      {event && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {event.title} • {event.type}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
