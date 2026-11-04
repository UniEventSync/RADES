create extension if not exists pgcrypto;
create type public.account_type as enum ('student', 'faculty');
create type public.global_role as enum ('user', 'office', 'super_admin');
create type public.member_role as enum ('panelist');
create type public.member_status as enum ('active', 'removed');
create type public.event_status as enum ('draft', 'pending_patron', 'pending_ossie', 'published', 'rejected', 'cancelled');
create type public.approval_role as enum ('patron', 'office');
create type public.approval_decision as enum ('approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique, first_name text not null, last_name text not null,
  erp_number text, account_type public.account_type not null,
  global_role public.global_role not null default 'user', phone text, avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint profile_erp_student check ((account_type = 'student' and erp_number ~ '^\d{5}$') or (account_type = 'faculty' and erp_number is null))
);
create table public.societies (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  description text not null default '', logo_url text, contact_email text,
  is_active boolean not null default true, created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.society_members (
  id uuid primary key default gen_random_uuid(), society_id uuid not null references public.societies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'panelist', status public.member_status not null default 'active',
  added_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(society_id,user_id)
);
create table public.society_patrons (
  id uuid primary key default gen_random_uuid(), society_id uuid not null references public.societies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, assigned_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(society_id,user_id)
);
create table public.events (
  id uuid primary key default gen_random_uuid(), society_id uuid not null references public.societies(id) on delete restrict,
  title text not null, description text not null default '', category text not null default 'Campus', venue text not null,
  starts_at timestamptz not null, ends_at timestamptz not null, capacity integer, image_url text,
  status public.event_status not null default 'draft', rejection_reason text,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint event_valid_dates check (ends_at > starts_at), constraint event_valid_capacity check (capacity is null or capacity > 0)
);
create table public.event_approvals (
  id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade,
  approver_id uuid not null references public.profiles(id), approval_role public.approval_role not null,
  decision public.approval_decision not null, comments text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.audit_log (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), action text not null,
  entity_type text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.notifications_log (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null,
  event_id uuid references public.events(id) on delete set null, type text not null, status text not null,
  provider_id text, error_message text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index events_status_starts_idx on public.events(status,starts_at);
create index events_society_idx on public.events(society_id);
create index society_members_user_idx on public.society_members(user_id,status);
create index society_patrons_user_idx on public.society_patrons(user_id);
create index event_approvals_event_idx on public.event_approvals(event_id);
create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['profiles','societies','society_members','society_patrons','events','event_approvals','audit_log','notifications_log'] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t);
  end loop;
end $$;

create function public.validate_iba_auth_email() returns trigger language plpgsql security definer set search_path='' as $$
declare normalized text := lower(trim(new.email)); begin
  if normalized='ossie@iba.edu.pk' and coalesce(auth.role(),'')<>'service_role' then
    raise exception 'This email is reserved for the RADES OSSIE account.' using errcode='23514';
  end if;
  if normalized !~ '^[a-z]+\.[a-z]+\.[0-9]{5}@khi\.iba\.edu\.pk$' and normalized !~ '^[a-z][a-z0-9]*([._-][a-z0-9]+)*@iba\.edu\.pk$' then
    raise exception 'Only IBA student or faculty email addresses can register.' using errcode='23514';
  end if; return new;
end $$;
create trigger auth_users_iba_email before insert or update of email on auth.users for each row execute function public.validate_iba_auth_email();

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare email_value text:=lower(new.email); local_parts text[]; student boolean;
begin
  student := email_value ~ '^[a-z]+\.[a-z]+\.[0-9]{5}@khi\.iba\.edu\.pk$';
  local_parts := string_to_array(split_part(email_value,'@',1),'.');
  insert into public.profiles(id,email,first_name,last_name,erp_number,account_type,global_role) values (
    new.id,email_value,coalesce(nullif(new.raw_user_meta_data->>'first_name',''),initcap(local_parts[1])),
    coalesce(nullif(new.raw_user_meta_data->>'last_name',''),case when student then initcap(local_parts[2]) else '' end),
    case when student then local_parts[3] else null end,case when student then 'student'::public.account_type else 'faculty'::public.account_type end,'user'
  ); return new;
end $$;
create trigger auth_user_profile after insert on auth.users for each row execute function public.handle_new_user();

create function public.current_global_role() returns public.global_role language sql stable security definer set search_path='' as $$
  select global_role from public.profiles where id=(select auth.uid()) $$;
create function public.is_office() returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(public.current_global_role() in ('office','super_admin'),false) $$;
create function public.is_society_panelist(target_society uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.society_members m where m.society_id=target_society and m.user_id=(select auth.uid()) and m.status='active') $$;
create function public.is_society_patron(target_society uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.society_patrons p where p.society_id=target_society and p.user_id=(select auth.uid())) $$;

create function public.enforce_panelist_limit() returns trigger language plpgsql security definer set search_path='' as $$
declare count_active integer; begin
  if new.status='active' and new.role='panelist' and (tg_op='INSERT' or old.status<>'active' or old.role<>'panelist') then
    perform 1 from public.societies s where s.id=new.society_id for update;
    select count(*) into count_active from public.society_members m where m.society_id=new.society_id and m.status='active' and m.role='panelist' and (tg_op<>'UPDATE' or m.id<>new.id);
  if count_active>=3 then raise exception 'A society can have up to three active panelists.' using errcode='23514'; end if;
  end if; return new;
end $$;
create trigger society_panelist_limit before insert or update on public.society_members for each row execute function public.enforce_panelist_limit();

create function public.enforce_event_workflow() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.status not in ('draft','pending_patron') or not public.is_society_panelist(new.society_id) then raise exception 'Only assigned society panelists can create event drafts.' using errcode='42501'; end if;
    return new;
  end if;
  if new.status is distinct from old.status then
    if old.status in ('draft','pending_patron') and new.status in ('draft','pending_patron') and public.is_society_panelist(old.society_id) then return new; end if;
    if new.status='pending_patron' and old.status in ('rejected','pending_ossie','published') and public.is_society_panelist(old.society_id) then return new; end if;
    if old.status='pending_patron' and new.status in ('pending_ossie','rejected') and public.is_society_patron(old.society_id) then return new; end if;
    if old.status='pending_ossie' and new.status in ('published','rejected') and public.is_office() then return new; end if;
    raise exception 'Event approval must follow the patron then OSSIE review sequence.' using errcode='42501';
  end if;
  if not public.is_society_panelist(old.society_id) and not public.is_office() then raise exception 'Only assigned panelists can edit event details.' using errcode='42501'; end if;
  return new;
end $$;
create trigger events_workflow before insert or update on public.events for each row execute function public.enforce_event_workflow();

create function public.log_event_change() returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid;
begin
  actor := coalesce(auth.uid(),new.created_by);
  if tg_op='INSERT' then
    insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata) values(actor,'event_created','event',new.id,jsonb_build_object('title',new.title,'status',new.status));
  elsif new.status is distinct from old.status then
    insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata) values(actor,'event_status_changed','event',new.id,jsonb_build_object('title',new.title,'from',old.status,'to',new.status));
  else
    insert into public.audit_log(actor_id,action,entity_type,entity_id,metadata) values(actor,'event_updated','event',new.id,jsonb_build_object('title',new.title));
  end if;
  return new;
end $$;
create trigger events_audit after insert or update on public.events for each row execute function public.log_event_change();

create function public.protect_profile_role() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and (new.global_role is distinct from old.global_role or new.account_type is distinct from old.account_type or new.erp_number is distinct from old.erp_number or new.email is distinct from old.email) then
    raise exception 'Account role and IBA identity fields are managed by RADES.' using errcode='42501';
  end if;
  return new;
end $$;
create trigger profile_protected_fields before update on public.profiles for each row execute function public.protect_profile_role();

create function public.review_event(target_event uuid, requested_decision public.approval_decision, reviewer_comments text default null)
returns public.event_status language plpgsql as $$
declare current_status public.event_status; society uuid; approval_role_value public.approval_role; next_status public.event_status;
begin
  select e.status,e.society_id into current_status,society from public.events e where e.id=target_event for update;
  if current_status is null then raise exception 'Event not found or not accessible.' using errcode='42501'; end if;
  if current_status='pending_patron' and public.is_society_patron(society) then
    approval_role_value := 'patron';
    next_status := case when requested_decision='approved' then 'pending_ossie'::public.event_status else 'rejected'::public.event_status end;
  elsif current_status='pending_ossie' and public.is_office() then
    approval_role_value := 'office';
    next_status := case when requested_decision='approved' then 'published'::public.event_status else 'rejected'::public.event_status end;
  else raise exception 'Event is not awaiting your review.' using errcode='42501';
  end if;
  update public.events set status=next_status, rejection_reason=case when requested_decision='rejected' then coalesce(reviewer_comments,'Not approved') else null end where id=target_event;
  insert into public.event_approvals(event_id,approver_id,approval_role,decision,comments)
  values(target_event,auth.uid(),approval_role_value,requested_decision,reviewer_comments);
  return next_status;
end $$;

alter table public.profiles enable row level security;
alter table public.societies enable row level security;
alter table public.society_members enable row level security;
alter table public.society_patrons enable row level security;
alter table public.events enable row level security;
alter table public.event_approvals enable row level security;
alter table public.audit_log enable row level security;
alter table public.notifications_log enable row level security;
create policy "profiles read self or office" on public.profiles for select to authenticated using (id=(select auth.uid()) or public.is_office());
create policy "profiles update self safe" on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()) and global_role=public.current_global_role() and account_type=(select p.account_type from public.profiles p where p.id=(select auth.uid())));
create policy "societies active are visible" on public.societies for select to anon,authenticated using (is_active or public.is_office());
create policy "office manages societies" on public.societies for all to authenticated using (public.is_office()) with check (public.is_office());
create policy "members read scoped" on public.society_members for select to authenticated using (user_id=(select auth.uid()) or public.is_office() or public.is_society_panelist(society_id));
create policy "office manages members" on public.society_members for all to authenticated using (public.is_office()) with check (public.is_office());
create policy "patrons read scoped" on public.society_patrons for select to authenticated using (user_id=(select auth.uid()) or public.is_office());
create policy "office manages patrons" on public.society_patrons for all to authenticated using (public.is_office()) with check (public.is_office());
create policy "published events public others scoped" on public.events for select to anon,authenticated using (status='published' or public.is_office() or public.is_society_panelist(society_id) or public.is_society_patron(society_id));
create policy "panelists create events" on public.events for insert to authenticated with check (public.is_society_panelist(society_id) and created_by=(select auth.uid()));
create policy "event participants update" on public.events for update to authenticated using (public.is_office() or public.is_society_panelist(society_id) or (status in ('pending_patron','pending_ossie') and public.is_society_patron(society_id))) with check (public.is_office() or public.is_society_panelist(society_id) or public.is_society_patron(society_id));
create policy "approvals read relevant" on public.event_approvals for select to authenticated using (public.is_office() or approver_id=(select auth.uid()));
create policy "reviewers record approval" on public.event_approvals for insert to authenticated with check (approver_id=(select auth.uid()) and ((approval_role='patron' and exists(select 1 from public.events e where e.id=event_id and public.is_society_patron(e.society_id))) or (approval_role='office' and public.is_office())));
create policy "audit office read" on public.audit_log for select to authenticated using (public.is_office());
create policy "notification log office read" on public.notifications_log for select to authenticated using (public.is_office());

grant usage on schema public to anon,authenticated;
grant select on public.societies,public.events to anon,authenticated;
grant select,update on public.profiles to authenticated;
grant select,insert,update on public.events to authenticated;
grant select,insert,update,delete on public.societies,public.society_members,public.society_patrons to authenticated;
grant select,insert on public.event_approvals to authenticated;
grant select on public.audit_log to authenticated;
grant select on public.notifications_log to authenticated;
revoke all on function public.review_event(uuid,public.approval_decision,text) from public,anon;
grant execute on function public.review_event(uuid,public.approval_decision,text) to authenticated;
