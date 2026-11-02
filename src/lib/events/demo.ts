export type EventItem = {
  id: string; title: string; description: string; society: string; category: string;
  venue: string; starts_at: string; ends_at: string; status: string;
  capacity?: number | null;
  society_id?: string; created_by?: string;
};

export const demoEvents: EventItem[] = [
  { id: "demo-1", title: "IBA Welcome Week", description: "A week of campus activities, society showcases, and new connections for the IBA community.", society: "Student Societies Office", category: "Campus", venue: "Main Campus", starts_at: "2026-11-12T10:00:00+05:00", ends_at: "2026-11-12T16:00:00+05:00", status: "published" },
  { id: "demo-2", title: "Design Thinking Workshop", description: "A hands-on introduction to creative problem solving and human-centered design.", society: "IBA Entrepreneurship Society", category: "Workshop", venue: "Room C- auditorium", starts_at: "2026-11-18T14:00:00+05:00", ends_at: "2026-11-18T16:00:00+05:00", status: "published" },
  { id: "demo-3", title: "Open Mic Evening", description: "An evening of music, spoken word, and student performances.", society: "IBA Arts Society", category: "Culture", venue: "Theatre", starts_at: "2026-11-21T18:00:00+05:00", ends_at: "2026-11-21T20:30:00+05:00", status: "published" },
];
