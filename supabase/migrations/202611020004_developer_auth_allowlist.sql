-- Run after the enum and profile constraint migrations have committed.
create or replace function public.validate_iba_auth_email() returns trigger
language plpgsql security definer set search_path = '' as $$
declare normalized text := lower(trim(new.email));
begin
  if normalized !~ '^[a-z]+\.[a-z]+\.[0-9]{5}@khi\.iba\.edu\.pk$'
     and normalized !~ '^[a-z][a-z0-9]*([._-][a-z0-9]+)*@iba\.edu\.pk$'
     and normalized not in (
       'rayyan@iba.edu.pk',
       'emad@iba.edu.pk',
       'shahzaib@iba.edu.pk',
       'duaa@iba.edu.pk',
       'abdullah@iba.edu.pk'
     ) then
    raise exception 'Use an IBA email address or a RADES developer invitation.' using errcode = '23514';
  end if;
  return new;
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  email_value text := lower(new.email);
  local_parts text[];
  is_student boolean;
  is_developer boolean;
begin
  is_student := email_value ~ '^[a-z]+\.[a-z]+\.[0-9]{5}@khi\.iba\.edu\.pk$';
  is_developer := email_value in (
    'rayyan@iba.edu.pk',
    'emad@iba.edu.pk',
    'shahzaib@iba.edu.pk',
    'duaa@iba.edu.pk',
    'abdullah@iba.edu.pk'
  );
  local_parts := string_to_array(split_part(email_value, '@', 1), '.');
  insert into public.profiles(id, email, first_name, last_name, erp_number, account_type, global_role)
  values (
    new.id,
    email_value,
    coalesce(nullif(new.raw_user_meta_data->>'first_name', ''), initcap(local_parts[1])),
    coalesce(nullif(new.raw_user_meta_data->>'last_name', ''), case when is_student then initcap(local_parts[2]) else '' end),
    case when is_student then local_parts[3] else null end,
    case when is_student then 'student'::public.account_type when is_developer then 'developer'::public.account_type else 'faculty'::public.account_type end,
    'user'
  );
  return new;
end $$;
