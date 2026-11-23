alter table public.events
  add column if not exists subcategory text,
  add column if not exists venues text[];

update public.events
set subcategory = case category
  when 'Technology' then 'Tech Seminar'
  when 'Music & Arts' then 'Concert'
  when 'Sports' then 'Tournament'
  when 'Workshop' then 'Professional Skills'
  when 'Culture' then 'Cultural Festival'
  when 'Campus' then 'Orientation'
  when 'Entrepreneurship' then 'Startup Pitch'
  else 'General'
end
where subcategory is null;

update public.events
set venues = case
  when venues is not null and cardinality(venues) > 0 then venues
  when btrim(coalesce(venue, '')) = '' then array['Student Center']::text[]
  else array[venue]::text[]
end;

alter table public.events
  alter column subcategory set default 'General',
  alter column subcategory set not null,
  alter column venues set default array['Student Center']::text[],
  alter column venues set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'events_subcategory_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events add constraint events_subcategory_check
      check (subcategory in (
        'Hackathon','Coding Competition','Tech Seminar','Tech Workshop',
        'Concert','Battle of Bands','Open Mic','Theatre','Art Exhibition',
        'Tournament','Match','Tryouts','Fitness Event',
        'Professional Skills','Academic','Creative','Technical',
        'Cultural Festival','Debate','Heritage','Food Event',
        'Orientation','Society Showcase','Networking','Fundraiser',
        'Startup Pitch','Business Workshop','Startup Expo','General'
      ));
  end;
  if not exists (
    select 1 from pg_constraint
    where conname = 'events_venues_check'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events add constraint events_venues_check
      check (
        cardinality(venues) between 1 and 9
        and venues <@ array[
          'OBS courtyard','Tabba classrooms','Aman CED classrooms','Fauji lawn',
          'Student Center','Auditorium','Cricket ground','Football ground','Amphi theatre'
        ]::text[]
      );
  end;
end $$;

alter table public.events add constraint events_category_subcategory_check check (
  (category = 'Technology' and subcategory in ('Hackathon','Coding Competition','Tech Seminar','Tech Workshop'))
  or (category = 'Music & Arts' and subcategory in ('Concert','Battle of Bands','Open Mic','Theatre','Art Exhibition'))
  or (category = 'Sports' and subcategory in ('Tournament','Match','Tryouts','Fitness Event'))
  or (category = 'Workshop' and subcategory in ('Professional Skills','Academic','Creative','Technical'))
  or (category = 'Culture' and subcategory in ('Cultural Festival','Debate','Heritage','Food Event'))
  or (category = 'Campus' and subcategory in ('Orientation','Society Showcase','Networking','Fundraiser'))
  or (category = 'Entrepreneurship' and subcategory in ('Startup Pitch','Business Workshop','Startup Expo','Networking'))
  or (category = 'Other' and subcategory = 'General')
);

grant select (id, society_id, title, description, category, subcategory, venue, venues, starts_at, ends_at, status, capacity, price_pkr, registration_type, team_min, team_max, image_url, is_public) on public.events to anon, authenticated;
