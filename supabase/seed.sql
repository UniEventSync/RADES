-- Optional starter society records for local development. OSSIE can also create these in the UI.
insert into public.societies (name, slug, description, contact_email)
values
  ('IBA Arts Society', 'arts-society', 'A home for student creativity, performance, and culture.', null),
  ('IBA Entrepreneurship Society', 'entrepreneurship-society', 'Student-led talks, workshops, and startup community.', null),
  ('IBA Student Societies Office', 'student-societies-office', 'Supporting student-led societies and campus life.', null)
on conflict (slug) do nothing;
