// iCal/ICS file parser for importing calendar events

interface ICalEvent {
  title: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  recurrence?: string;
  rrule?: string;
}

/**
 * Parse ICS file content and extract events
 */
export function parseICSFile(icsContent: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = icsContent.split(/\r\n|\n|\r/);

  let currentEvent: Partial<ICalEvent> = {};
  let inEvent = false;
  let inAlarm = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Start of event
    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      inAlarm = false;
      currentEvent = {};
      continue;
    }

    // End of event
    if (line.startsWith('END:VEVENT')) {
      if (currentEvent.title && currentEvent.startDate) {
        events.push(currentEvent as ICalEvent);
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }

    // Skip alarm components
    if (line.startsWith('BEGIN:VALARM')) {
      inAlarm = true;
      continue;
    }
    if (line.startsWith('END:VALARM')) {
      inAlarm = false;
      continue;
    }

    // Only parse event properties, not alarms
    if (!inEvent || inAlarm) continue;

    // Parse properties
    if (line.startsWith('SUMMARY:')) {
      currentEvent.title = line.substring(8).replace(/\\/g, '');
    } else if (line.startsWith('DTSTART:')) {
      const dateStr = line.substring(8);
      currentEvent.startDate = parseICSDate(dateStr);
    } else if (line.startsWith('DTSTART;')) {
      // Handle parameters like TZID
      const match = line.match(/DTSTART[^:]*:(.+)/);
      if (match) {
        currentEvent.startDate = parseICSDate(match[1]);
      }
    } else if (line.startsWith('DTEND:')) {
      const dateStr = line.substring(6);
      currentEvent.endDate = parseICSDate(dateStr);
    } else if (line.startsWith('DTEND;')) {
      const match = line.match(/DTEND[^:]*:(.+)/);
      if (match) {
        currentEvent.endDate = parseICSDate(match[1]);
      }
    } else if (line.startsWith('DESCRIPTION:')) {
      currentEvent.description = line.substring(12).replace(/\\/g, '');
    } else if (line.startsWith('LOCATION:')) {
      currentEvent.location = line.substring(9).replace(/\\/g, '');
    } else if (line.startsWith('RRULE:')) {
      currentEvent.rrule = line.substring(7);
      currentEvent.recurrence = parseRRule(line.substring(7));
    }
  }

  return events;
}

/**
 * Parse ICS date format to ISO format
 * Handles both YYYYMMDD and YYYYMMDDTHHmmss formats
 */
function parseICSDate(dateStr: string): string {
  // Remove timezone info if present
  dateStr = dateStr.replace(/Z$/, '');

  // Format: YYYYMMDDTHHmmss
  if (dateStr.includes('T')) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);

    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  // Format: YYYYMMDD
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Parse RRULE (recurrence rule) to our format
 */
function parseRRule(rrule: string): string {
  const upperRule = rrule.toUpperCase();

  if (upperRule.includes('FREQ=DAILY')) return 'daily';
  if (upperRule.includes('FREQ=WEEKLY')) return 'weekly';
  if (upperRule.includes('FREQ=MONTHLY')) return 'monthly';
  if (upperRule.includes('FREQ=YEARLY')) return 'yearly';

  return 'none';
}

/**
 * Convert ICS events to our Event format
 */
export function convertICSEventsToEvents(
  icsEvents: ICalEvent[],
  defaultParent: 'A' | 'B' = 'A'
): any[] {
  return icsEvents.map((icsEvent, index) => {
    // Extract time from date if available
    let startTime = '09:00';
    let endTime = '10:00';

    if (icsEvent.startDate && icsEvent.startDate.includes('T')) {
      startTime = icsEvent.startDate.substring(11, 16);
    }
    if (icsEvent.endDate && icsEvent.endDate.includes('T')) {
      endTime = icsEvent.endDate.substring(11, 16);
    }

    // Get just the date part (YYYY-MM-DD)
    const startDate = icsEvent.startDate?.split('T')[0] || new Date().toISOString().split('T')[0];
    const endDate = icsEvent.endDate?.split('T')[0] || startDate;

    return {
      title: icsEvent.title,
      startDate,
      endDate,
      startTime,
      endTime,
      timeZone: 'UTC',
      parent: defaultParent,
      type: 'custody',
      recurrence: icsEvent.recurrence || 'none',
      recurrenceInterval: 1,
      recurrenceEnd: '',
      recurrenceDays: '[]',
      description: icsEvent.description || '',
      location: icsEvent.location || '',
      address: '',
      city: '',
      postalCode: '',
    };
  });
}

/**
 * Read and parse ICS file from File object
 */
export function readICSFile(file: File): Promise<ICalEvent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const events = parseICSFile(content);
        resolve(events);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate ICS file format
 */
export function validateICSFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.endsWith('.ics')) {
    return { valid: false, error: 'File must be a .ics file' };
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
}
