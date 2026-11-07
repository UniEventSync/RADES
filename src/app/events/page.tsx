import { getUpcomingPublishedEvents } from "@/lib/events/data";
import { EventsBrowse } from "@/components/events-browse";

export default async function EventsPage() {
  const result = await getUpcomingPublishedEvents();
  return <EventsBrowse events={result.events} error={result.error} />;
}
