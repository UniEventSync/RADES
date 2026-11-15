-- Allow society admins and OSSIE to remove a published event from public listings.
-- The event returns to draft and can be edited and resubmitted through review.
create or replace function public.enforce_event_workflow() returns trigger
  language plpgsql security definer set search_path=''
as $$
begin
  if tg_op='INSERT' then
    if new.status not in ('draft','pending_patron') or not public.is_society_panelist(new.society_id) then
      raise exception 'Only assigned society admins can create event drafts.' using errcode='42501';
    end if;
    if new.status='pending_patron' and not exists(select 1 from public.society_patrons p where p.society_id=new.society_id) then
      raise exception 'A faculty patron must be assigned before an event is submitted.' using errcode='23514';
    end if;
    return new;
  end if;
  if new.society_id is distinct from old.society_id then
    raise exception 'An event cannot be moved to another society.' using errcode='42501';
  end if;
  if old.is_public and new.status <> 'draft' then new.is_public := true; end if;
  if new.status is distinct from old.status then
    if new.status='cancelled' then
      if public.is_office() then return new; end if;
      if (old.status in ('draft','pending_patron','pending_ossie','rejected') or (old.status='published' and old.starts_at>now())) and public.is_society_panelist(old.society_id) then return new; end if;
      raise exception 'Only OSSIE can force-cancel an approved or published event.' using errcode='42501';
    end if;
    if old.status='published' and new.status='draft' and (public.is_office() or public.is_society_panelist(old.society_id)) then
      new.is_public := false;
      return new;
    end if;
    if old.status='pending_ossie' and new.status='pending_patron' and public.is_society_panelist(old.society_id) then
      if not exists(select 1 from public.society_patrons p where p.society_id=new.society_id) then
        raise exception 'A faculty patron must be assigned before an event is submitted.' using errcode='23514';
      end if;
      return new;
    end if;
    if old.status in ('draft','pending_patron','rejected','published') and new.status in ('draft','pending_patron') and public.is_society_panelist(old.society_id) then
      if new.status='pending_patron' and not exists(select 1 from public.society_patrons p where p.society_id=new.society_id) then
        raise exception 'A faculty patron must be assigned before an event is submitted.' using errcode='23514';
      end if;
      return new;
    end if;
    if old.status='pending_patron' and new.status in ('pending_ossie','rejected') and public.is_society_patron(old.society_id) then return new; end if;
    if old.status='pending_ossie' and new.status in ('published','rejected') and public.is_office() then return new; end if;
    raise exception 'Event approval must follow the patron then OSSIE review sequence.' using errcode='42501';
  end if;
  if old.status in ('draft','pending_patron','rejected') and public.is_society_panelist(old.society_id) then return new; end if;
  if public.is_office() then return new; end if;
  raise exception 'Event details are locked after final approval.' using errcode='42501';
end
$$;
