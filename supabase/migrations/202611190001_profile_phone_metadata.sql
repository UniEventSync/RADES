-- Store an optional signup phone number for newly created profiles.
-- Existing profile rows are not updated by this migration.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare email_value text:=lower(new.email); local_parts text[]; student boolean;
begin
  student := email_value ~ '^[a-z]+\.[a-z]+\.[0-9]{5}@khi\.iba\.edu\.pk$';
  local_parts := string_to_array(split_part(email_value,'@',1),'.');
  insert into public.profiles(id,email,first_name,last_name,erp_number,account_type,global_role,phone) values (
    new.id,email_value,coalesce(nullif(new.raw_user_meta_data->>'first_name',''),initcap(local_parts[1])),
    coalesce(nullif(new.raw_user_meta_data->>'last_name',''),case when student then initcap(local_parts[2]) else '' end),
    case when student then local_parts[3] else null end,case when student then 'student'::public.account_type else 'faculty'::public.account_type end,'user',
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone','')),'')
  ); return new;
end $$;
