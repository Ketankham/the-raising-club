// Types for event messaging (kept out of types.ts to avoid churn there).

export interface ThreadMessage {
  id: string;
  body: string;
  senderRole: "attendee" | "organizer";
  createdAt: string;
  readAt: string | null;
}

/** The current attendee's thread for an event. */
export interface MyThread {
  registered: boolean;
  registrationId: string | null;
  messages: ThreadMessage[];
}

/** One thread (per registration) as seen by an event organizer. */
export interface EventThread {
  registrationId: string;
  registrantName: string;
  contactEmail: string | null;
  messages: ThreadMessage[];
  unread: number;
  lastAt: string | null;
}
