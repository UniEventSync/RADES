-- Run only after 202611020002_developer_account_type.sql has committed.
alter table public.profiles drop constraint if exists profile_erp_student;
alter table public.profiles add constraint profile_erp_student check (
  (account_type = 'student' and erp_number ~ '^\d{5}$')
  or (account_type in ('faculty', 'developer') and erp_number is null)
);
