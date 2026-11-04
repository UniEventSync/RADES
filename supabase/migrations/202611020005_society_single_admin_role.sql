-- A society has one student assignment type: its society admin.
-- The existing panelist value remains the internal storage label for that role.
update public.society_members
set role = 'panelist'
where role <> 'panelist';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'society_members_single_student_role'
      and conrelid = 'public.society_members'::regclass
  ) then
    alter table public.society_members
      add constraint society_members_single_student_role check (role = 'panelist');
  end if;
end $$;
