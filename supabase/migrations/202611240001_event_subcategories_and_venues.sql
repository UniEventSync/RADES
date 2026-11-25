-- Adds the event taxonomy and multi-venue fields used by event creation and display.
-- Existing event rows retain their current category and venue values.

alter table public.events
  add column if not exists subcategory text not null default 'General',
  add column if not exists venues text[] not null default array['Student Center']::text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'events_subcategory_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events add constraint events_subcategory_check check (
      subcategory = any (array[
        'Hackathon', 'Coding Competition', 'Tech Seminar', 'Tech Workshop',
        'Concert', 'Battle of Bands', 'Open Mic', 'Theatre', 'Art Exhibition',
        'Tournament', 'Match', 'Tryouts', 'Fitness Event',
        'Professional Skills', 'Academic', 'Creative', 'Technical',
        'Cultural Festival', 'Debate', 'Heritage', 'Food Event',
        'Orientation', 'Society Showcase', 'Networking',
        'Fundraiser', 'Startup Pitch', 'Business Workshop', 'Startup Expo',
        'General'
      ]::text[])
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'events_venues_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events add constraint events_venues_check check (
      cardinality(venues) between 1 and 9
      and venues <@ array[
        'OBS courtyard', 'Tabba classrooms', 'Aman CED classrooms',
        'Fauji lawn', 'Student Center', 'Auditorium', 'Cricket ground',
        'Football ground', 'Amphi theatre'
      ]::text[]
    );
  end if;
end
$$;

-- The public event pages read these fields for published events.
grant select (subcategory, venues) on public.events to anon, authenticated;
