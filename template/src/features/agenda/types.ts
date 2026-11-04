export interface CalendarEvent {
  id: string;
  title: string;
  /** `YYYY-MM-DD` (local date). */
  date: string;
  /** `HH:mm`. */
  startTime: string;
  /** `HH:mm`, after `startTime`. */
  endTime: string;
  location: string;
  description: string;
}

export type EventInput = Omit<CalendarEvent, 'id'>;

export interface DateRange {
  from: string;
  to: string;
}
