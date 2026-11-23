export const eventCategorySubcategories: Record<string, string[]> = {
  Technology: ["Hackathon", "Coding Competition", "Tech Seminar", "Tech Workshop"],
  "Music & Arts": ["Concert", "Battle of Bands", "Open Mic", "Theatre", "Art Exhibition"],
  Sports: ["Tournament", "Match", "Tryouts", "Fitness Event"],
  Workshop: ["Professional Skills", "Academic", "Creative", "Technical"],
  Culture: ["Cultural Festival", "Debate", "Heritage", "Food Event"],
  Campus: ["Orientation", "Society Showcase", "Networking", "Fundraiser"],
  Entrepreneurship: ["Startup Pitch", "Business Workshop", "Startup Expo", "Networking"],
  Other: ["General"],
};

export const eventVenues = [
  "OBS courtyard",
  "Tabba classrooms",
  "Aman CED classrooms",
  "Fauji lawn",
  "Student Center",
  "Auditorium",
  "Cricket ground",
  "Football ground",
  "Amphi theatre",
];

export function formatEventVenues(venue: string, venues?: string[] | null): string {
  if (venues?.length) return venues.join(", ");
  return venue || "Venue to be announced";
}
