export const eventCategories = [
  "Technology",
  "Music & Arts",
  "Sports",
  "Workshop",
  "Culture",
  "Campus",
  "Entrepreneurship",
  "Other",
] as const;

export type EventCategory = (typeof eventCategories)[number];

export const subcategoriesByCategory: Record<EventCategory, readonly string[]> = {
  Technology: ["Hackathon", "Coding Competition", "Tech Seminar", "Tech Workshop"],
  "Music & Arts": ["Concert", "Battle of Bands", "Open Mic", "Theatre", "Art Exhibition"],
  Sports: ["Tournament", "Match", "Tryouts", "Fitness Event"],
  Workshop: ["Professional Skills", "Academic", "Creative", "Technical"],
  Culture: ["Cultural Festival", "Debate", "Heritage", "Food Event"],
  Campus: ["Orientation", "Society Showcase", "Networking", "Fundraiser"],
  Entrepreneurship: ["Startup Pitch", "Business Workshop", "Startup Expo", "Networking"],
  Other: ["General"],
};

export const eventSubcategories = [
  "Hackathon",
  "Coding Competition",
  "Tech Seminar",
  "Tech Workshop",
  "Concert",
  "Battle of Bands",
  "Open Mic",
  "Theatre",
  "Art Exhibition",
  "Tournament",
  "Match",
  "Tryouts",
  "Fitness Event",
  "Professional Skills",
  "Academic",
  "Creative",
  "Technical",
  "Cultural Festival",
  "Debate",
  "Heritage",
  "Food Event",
  "Orientation",
  "Society Showcase",
  "Networking",
  "Fundraiser",
  "Startup Pitch",
  "Business Workshop",
  "Startup Expo",
  "General",
] as const;

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
] as const;

export function isEventSubcategory(category: string, subcategory: string) {
  return eventCategories.includes(category as EventCategory)
    && subcategoriesByCategory[category as EventCategory].includes(subcategory);
}

export function eventVenueLabel(venues: readonly string[] | null | undefined, legacyVenue?: string | null) {
  const selected = venues?.filter(Boolean) ?? [];
  const defaultOnly = selected.length === 1 && selected[0] === "Student Center";

  // Older rows received the new column's default without changing their original venue.
  if (defaultOnly && legacyVenue && legacyVenue !== "Student Center") return legacyVenue;
  if (selected.length) return selected.join(", ");
  return legacyVenue || "Venue to be announced";
}
