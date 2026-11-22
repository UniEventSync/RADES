-- Profile avatars use the existing public media bucket. The upload path is
-- profile-avatars/<auth.uid()>/..., so users can replace or remove only their own image.
drop policy if exists "RADES profile avatars upload own image" on storage.objects;
create policy "RADES profile avatars upload own image" on storage.objects for insert to authenticated
with check (
  bucket_id='rades-media'
  and (storage.foldername(name))[1]='profile-avatars'
  and (storage.foldername(name))[2]=auth.uid()::text
);

drop policy if exists "RADES profile avatars update own image" on storage.objects;
create policy "RADES profile avatars update own image" on storage.objects for update to authenticated
using (
  bucket_id='rades-media'
  and (storage.foldername(name))[1]='profile-avatars'
  and (storage.foldername(name))[2]=auth.uid()::text
)
with check (
  bucket_id='rades-media'
  and (storage.foldername(name))[1]='profile-avatars'
  and (storage.foldername(name))[2]=auth.uid()::text
);

drop policy if exists "RADES profile avatars delete own image" on storage.objects;
create policy "RADES profile avatars delete own image" on storage.objects for delete to authenticated
using (
  bucket_id='rades-media'
  and (storage.foldername(name))[1]='profile-avatars'
  and (storage.foldername(name))[2]=auth.uid()::text
);

-- Registration is the database safety boundary too; API validation alone must
-- never be able to create partial or malformed participant entries.
create or replace function public.validate_registration_member_email()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  profile_row public.profiles%rowtype;
begin
  if new.email !~* '^[a-z]+\.[a-z]+\.[0-9]{5}@khi\.iba\.edu\.pk$' then
    raise exception 'Every participant must use an IBA student email address.' using errcode='23514';
  end if;
  select * into profile_row from public.profiles where id=new.user_id;
  if not found or profile_row.account_type <> 'student' or lower(profile_row.email) <> lower(new.email) then
    raise exception 'Every participant must be a matching verified student account.' using errcode='23514';
  end if;
  if not exists(select 1 from auth.users u where u.id=new.user_id and u.email_confirmed_at is not null) then
    raise exception 'Every participant must verify their RADES email.' using errcode='23514';
  end if;
  return new;
end $$;

drop trigger if exists registration_member_validate_student on public.registration_members;
create trigger registration_member_validate_student
  before insert or update of user_id,email on public.registration_members
  for each row execute function public.validate_registration_member_email();

-- Explicit service-only cleanup function. It removes event registrations,
-- payments, tickets, attendance, refunds, emails, feedback, approvals and events,
-- while retaining societies and user/profile accounts.
create or replace function public.clear_rades_event_data()
returns jsonb language plpgsql security definer set search_path='' as $$
declare event_count integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Only the RADES service role can clear event data.' using errcode='42501';
  end if;
  select count(*) into event_count from public.events;
  truncate table
    public.event_attendance,
    public.event_tickets,
    public.event_refund_transactions,
    public.registration_email_deliveries,
    public.event_feedback,
    public.event_payments,
    public.stripe_webhook_events,
    public.registration_members,
    public.registrations,
    public.event_approvals,
    public.notifications_log,
    public.events
  cascade;
  return jsonb_build_object('eventsRemoved',event_count,'cleared',true);
end $$;
revoke all on function public.clear_rades_event_data() from public, anon, authenticated;
grant execute on function public.clear_rades_event_data() to service_role;
