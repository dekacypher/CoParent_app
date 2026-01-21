import { useState } from "react";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEvents, getChildren, createEvent, updateEvent, deleteEvent } from "@/lib/api";
import { format, parseISO, startOfYear, endOfYear, eachMonthOfInterval, getDay, getDaysInMonth, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Download, Upload, Share2, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event, InsertEvent } from "@shared/schema";
import { readICSFile, validateICSFile, convertICSEventsToEvents } from "@/lib/ics-parser";

export default function CalendarPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filter states
  const [filterParent, setFilterParent] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterChild, setFilterChild] = useState<string>("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents()
  });

  // Filter events
  const filteredEvents = events.filter(event => {
    if (filterParent !== "all" && event.parent !== filterParent) return false;
    if (filterType !== "all" && event.type !== filterType) return false;
    if (filterChild !== "all") {
      if (filterChild === "unassigned" && event.childId) return false;
      if (filterChild !== "unassigned" && event.childId?.toString() !== filterChild) return false;
    }
    return true;
  });

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Calendar link copied",
        description: "Share this link with your co-parent to give them access to the calendar.",
      });
    }).catch(() => {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy the calendar link.",
      });
    });
  };

  const handleExport = () => {
    // Create iCal format content
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Co-Parent App//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    filteredEvents.forEach(event => {
      const startDate = event.startDate.replace(/-/g, '');
      const endDate = event.endDate.replace(/-/g, '');
      const startTime = event.startTime.replace(/:/g, '');
      const endTime = event.endTime.replace(/:/g, '');

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`DTSTART:${startDate}T${startTime}00`);
      icsContent.push(`DTEND:${endDate}T${endTime}00`);
      icsContent.push(`SUMMARY:${event.title}`);
      icsContent.push(`DESCRIPTION:${event.description || ''}`);
      if (event.location) {
        icsContent.push(`LOCATION:${event.location}`);
      }
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `coparent-calendar-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Calendar exported",
      description: "Your calendar has been downloaded as an iCal file.",
    });
  };

  const clearFilters = () => {
    setFilterParent("all");
    setFilterType("all");
    setFilterChild("all");
  };

  const handleImportCalendar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateICSFile(file);
    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: validation.error,
      });
      return;
    }

    try {
      toast({
        title: "Importing calendar...",
        description: "Please wait while we import your events.",
      });

      // Parse ICS file
      const icsEvents = await readICSFile(file);

      if (icsEvents.length === 0) {
        toast({
          variant: "destructive",
          title: "No events found",
          description: "The ICS file doesn't contain any events.",
        });
        return;
      }

      // Convert to our event format
      const convertedEvents = convertICSEventsToEvents(icsEvents);

      // Create events
      let successCount = 0;
      let errorCount = 0;

      for (const eventData of convertedEvents) {
        try {
          await createEvent(eventData);
          successCount++;
        } catch (error) {
          console.error('Error creating event:', error);
          errorCount++;
        }
      }

      // Refresh events
      queryClient.invalidateQueries({ queryKey: ["events"] });

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} events${errorCount > 0 ? ` (${errorCount} failed)` : ''}.`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import calendar file.",
      });
    }

    // Reset input
    e.target.value = '';
  };

  const { data: children = [] } = useQuery({
    queryKey: ["children"],
    queryFn: getChildren,
  });

  const [formData, setFormData] = useState<Partial<InsertEvent>>({
    childId: undefined,
    title: "",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "10:00",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    parent: "A",
    type: "custody",
    recurrence: "none",
    recurrenceInterval: 1,
    recurrenceEnd: "",
    recurrenceDays: "[]",
    description: "",
    location: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const [showRepeatOptions, setShowRepeatOptions] = useState(false);

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event created",
        description: "The event has been added to the calendar.",
      });
      closeDialog();
    },
    onError: (error: any) => {
      console.error("Event creation error:", error);
      toast({
        variant: "destructive",
        title: "Error creating event",
        description: error?.message || "Failed to create event. Please try again.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Event> }) =>
      updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event updated",
        description: "The event has been updated.",
      });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Event deleted",
        description: "The event has been removed from the calendar.",
      });
      closeDialog();
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    setShowRepeatOptions(false);
    setFormData({
      childId: undefined,
      title: "",
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "10:00",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      parent: "A",
      type: "custody",
      recurrence: "none",
      recurrenceInterval: 1,
      recurrenceEnd: "",
      recurrenceDays: "[]",
      description: "",
      location: "",
    });
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Find any event that overlaps with this date
    const existingEvent = events.find(e => {
      return dateStr >= e.startDate && dateStr <= e.endDate;
    });

    if (existingEvent) {
      // Edit existing event
      setSelectedEvent(existingEvent);
      setFormData({
        childId: existingEvent.childId,
        title: existingEvent.title,
        startDate: existingEvent.startDate,
        endDate: existingEvent.endDate,
        startTime: existingEvent.startTime,
        endTime: existingEvent.endTime,
        timeZone: existingEvent.timeZone,
        parent: existingEvent.parent,
        type: existingEvent.type,
        recurrence: existingEvent.recurrence || "none",
        recurrenceInterval: existingEvent.recurrenceInterval || 1,
        recurrenceEnd: existingEvent.recurrenceEnd || "",
        recurrenceDays: existingEvent.recurrenceDays || "[]",
        description: existingEvent.description || "",
        location: existingEvent.location || "",
        address: existingEvent.address || "",
        city: existingEvent.city || "",
        postalCode: existingEvent.postalCode || "",
      });
      setIsEditMode(true);
      setIsDialogOpen(true);
    } else {
      // Create new event
      setSelectedDate(dateStr);
      setFormData({
        ...formData,
        startDate: dateStr,
        endDate: dateStr,
      });
      setIsEditMode(false);
      setIsDialogOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare event data with proper defaults
    // Don't send childId if it's "all" (undefined or 0)
    // Don't send recurrence fields if they're default/empty values
    const { childId, recurrence, recurrenceEnd, recurrenceDays, ...restFormData } = formData;
    const eventData = {
      ...restFormData,
      ...(childId && childId !== 0 ? { childId } : {}), // Only include childId if it's a valid number
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate || new Date().toISOString().split('T')[0],
      startTime: formData.startTime || "09:00",
      endTime: formData.endTime || "10:00",
      timeZone: formData.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      // Only include recurrence fields if they have meaningful values
      ...(recurrence && recurrence !== "none" ? { recurrence } : {}),
      ...(formData.recurrenceInterval && formData.recurrenceInterval !== 1 ? { recurrenceInterval: formData.recurrenceInterval } : {}),
      ...(recurrenceEnd ? { recurrenceEnd } : {}),
      ...(recurrenceDays && recurrenceDays !== "[]" ? { recurrenceDays } : {}),
    };

    console.log("Submitting event data:", eventData);

    if (isEditMode && selectedEvent) {
      updateMutation.mutate({
        id: selectedEvent.id,
        data: eventData as Partial<Event>,
      });
    } else {
      createMutation.mutate(eventData as Omit<Event, "id" | "createdAt">);
    }
  };

  const handleDelete = () => {
    if (selectedEvent) {
      deleteMutation.mutate(selectedEvent.id);
    }
  };

  // Calendar rendering
  const currentYear = new Date().getFullYear();
  const [viewYear, setViewYear] = useState(currentYear);
  const startDate = startOfYear(new Date(viewYear, 0, 1));
  const endDate = endOfYear(startDate);
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  const getEventForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Find events that overlap with this date (startDate <= date <= endDate)
    return filteredEvents.find(e => dateStr >= e.startDate && dateStr <= e.endDate);
  };

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
            <p className="text-muted-foreground mt-1">{viewYear} Schedule Overview</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setViewYear(viewYear - 1)}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> {viewYear - 1}
            </Button>
            <Button
              onClick={() => setViewYear(viewYear + 1)}
              variant="outline"
              size="sm"
            >
              {viewYear + 1} <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => {
                setIsEditMode(false);
                setIsDialogOpen(true);
              }}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="w-4 h-4 mr-2" /> Filter
              {(filterParent !== "all" || filterType !== "all" || filterChild !== "all") && (
                <span className="ml-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
            <Label
              htmlFor="ics-import"
              className="cursor-pointer"
            >
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('ics-import')?.click();
                }}
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" /> Import
                </span>
              </Button>
            </Label>
            <input
              id="ics-import"
              type="file"
              accept=".ics"
              onChange={handleImportCalendar}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button size="sm" className="bg-primary text-white hover:bg-primary/90" onClick={handleExport}>
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

        {/* Calendar Grid */}
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
                  const date = new Date(viewYear, month.getMonth(), i + 1);
                  const event = getEventForDate(date);

                  let bgClass = "bg-transparent";

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
                            onClick={() => handleDateClick(date)}
                          >
                            {i + 1}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-medium">{format(date, 'MMM do, yyyy')}</p>
                          {event ? (
                            <div className="text-xs text-muted-foreground">
                              <p className="font-semibold text-foreground capitalize">{event.title}</p>
                              <p className="capitalize">{event.type} • Parent {event.parent}</p>
                              <p>{event.startTime} - {event.endTime} ({event.timeZone})</p>
                              {event.startDate !== event.endDate && (
                                <p>{format(parseISO(event.startDate), 'MMM do')} - {format(parseISO(event.endDate), 'MMM do')}</p>
                              )}
                              {event.recurrence && event.recurrence !== 'none' && (
                                <p className="text-primary">Repeats {event.recurrence}</p>
                              )}
                              {event.location && <p>📍 {event.location}</p>}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Click to add event
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

        {/* Event Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Event" : "Create Event"}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? "Update the event details" : "Add a new event to the calendar"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Custody - Parent A"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Date and Time Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        setFormData({
                          ...formData,
                          startDate: newStartDate,
                          endDate: formData.endDate && formData.endDate < formData.startDate
                            ? newStartDate
                            : formData.endDate
                        });
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Time Zone and Duration Display */}
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Time Zone:</span>
                    <span className="font-medium">{formData.timeZone}</span>
                  </div>
                  {formData.startDate && formData.endDate && formData.startTime && formData.endTime && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {format(parseISO(formData.startDate), 'MMM do, yyyy')} at {formData.startTime} - {formData.endTime}
                        {formData.startDate !== formData.endDate && (
                          <> to {format(parseISO(formData.endDate), 'MMM do, yyyy')}</>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Child and Parent Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="childId">Child</Label>
                    <Select
                      value={formData.childId?.toString() || "all"}
                      onValueChange={(value) => setFormData({ ...formData, childId: value === "all" ? undefined : parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All children" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All children</SelectItem>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id.toString()}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent">Parent *</Label>
                    <Select
                      value={formData.parent}
                      onValueChange={(value) => setFormData({ ...formData, parent: value as any })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Parent A</SelectItem>
                        <SelectItem value="B">Parent B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custody">👨‍👩‍👧‍👦 Custody</SelectItem>
                      <SelectItem value="holiday">🎉 Holiday</SelectItem>
                      <SelectItem value="activity">⚽ Activity</SelectItem>
                      <SelectItem value="travel">✈️ Travel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Repeat Section - Google Calendar Style */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="recurrence">Repeat</Label>
                    <Select
                      value={formData.recurrence || "none"}
                      onValueChange={(value) => {
                        setFormData({ ...formData, recurrence: value as any });
                        setShowRepeatOptions(value !== "none");
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Does not repeat</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="custom">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showRepeatOptions && (
                    <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Repeats</span>
                        <span className="text-sm font-medium capitalize">
                          {formData.recurrence === "biweekly" ? "every 2 weeks" : formData.recurrence}
                        </span>
                      </div>

                      {formData.recurrence === "weekly" && (
                        <div className="space-y-2">
                          <Label className="text-xs">Repeat on these days</Label>
                          <div className="flex gap-1">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                              <button
                                key={day}
                                type="button"
                                className={cn(
                                  "w-8 h-8 rounded-md text-xs font-medium transition-colors",
                                  JSON.parse(formData.recurrenceDays || "[]").includes(idx)
                                    ? "bg-primary text-white"
                                    : "bg-background border border-border hover:bg-muted"
                                )}
                                onClick={() => {
                                  const days = JSON.parse(formData.recurrenceDays || "[]");
                                  const newDays = days.includes(idx)
                                    ? days.filter((d: number) => d !== idx)
                                    : [...days, idx];
                                  setFormData({ ...formData, recurrenceDays: JSON.stringify(newDays) });
                                }}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="recurrenceEnd" className="text-xs">Ends</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="recurrenceEnd"
                            type="date"
                            value={formData.recurrenceEnd || ""}
                            onChange={(e) => setFormData({ ...formData, recurrenceEnd: e.target.value })}
                            placeholder="Never"
                            min={formData.startDate}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location & Address */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location Name</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Home, School, Central Park"
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St"
                        value={formData.address || ""}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Oslo"
                        value={formData.city || ""}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal/ZIP Code</Label>
                    <Input
                      id="postalCode"
                      placeholder="0001"
                      value={formData.postalCode || ""}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    />
                  </div>

                  {(formData.address || formData.city || formData.postalCode) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const address = [formData.address, formData.city, formData.postalCode]
                          .filter(Boolean)
                          .join(', ');
                        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                        window.open(mapUrl, '_blank');
                      }}
                      className="w-full"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      View on Google Maps
                    </Button>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add any additional notes..."
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {isEditMode ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Filter Dialog */}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Filter Calendar</DialogTitle>
              <DialogDescription>
                Filter events by parent, type, or child
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Parent</Label>
                <Select value={filterParent} onValueChange={setFilterParent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parents</SelectItem>
                    <SelectItem value="A">Parent A</SelectItem>
                    <SelectItem value="B">Parent B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="custody">Custody</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Child</Label>
                <Select value={filterChild} onValueChange={setFilterChild}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Children</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setIsFilterOpen(false)}
                className="flex-1"
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
