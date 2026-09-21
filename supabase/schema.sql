-- Run once on the chosen Supabase project, then version the resulting migration.
-- No application accounts, student identifiers or academic records are stored.
begin;

create table public.calendar_terms (
  id text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  label text not null,
  starts_on date not null,
  ends_on date not null,
  purge_after date not null,
  active boolean not null default true,
  check (starts_on <= ends_on and ends_on < purge_after)
);
create table public.calendar_courses (
  term_id text not null references public.calendar_terms(id) on delete cascade,
  id text not null,
  code text not null,
  name text not null,
  level text not null,
  primary key (term_id,id)
);
create table public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  term_id text not null,
  course_id text not null,
  kind text not null check (kind in ('exam','homework','announcement')),
  title text not null check (char_length(btrim(title)) between 2 and 100),
  event_date date not null,
  event_time time,
  location text not null default '' check (char_length(location)<=120),
  details text not null default '' check (char_length(details)<=1000),
  nickname text not null check (char_length(btrim(nickname)) between 2 and 32 and nickname !~ '[[:cntrl:]]'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (term_id,course_id) references public.calendar_courses(term_id,id) on delete cascade
);
create index calendar_entries_term_date on public.calendar_entries(term_id,event_date,event_time);
create index calendar_entries_course on public.calendar_entries(term_id,course_id);
create index calendar_entries_created on public.calendar_entries(created_at);
create table public.calendar_reports (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.calendar_entries(id) on delete cascade,
  entry_version timestamptz not null,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (entry_id,entry_version)
);
create index calendar_reports_pending on public.calendar_reports(next_attempt_at) where status in ('pending','sending');
create index calendar_reports_created on public.calendar_reports(created_at);
create table public.calendar_delivery_budget (
  month date primary key,
  attempts integer not null default 0 check (attempts between 0 and 45)
);

alter table public.calendar_terms enable row level security;
alter table public.calendar_courses enable row level security;
alter table public.calendar_entries enable row level security;
alter table public.calendar_reports enable row level security;
alter table public.calendar_delivery_budget enable row level security;
revoke all on public.calendar_terms,public.calendar_courses,public.calendar_entries,public.calendar_reports,public.calendar_delivery_budget from public,anon,authenticated;
grant select,insert,update,delete on public.calendar_terms,public.calendar_courses,public.calendar_entries,public.calendar_reports,public.calendar_delivery_budget to service_role;
-- No anon/authenticated policies: all public access passes through the function.

create function public.calendar_touch_entry() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  new.updated_at=clock_timestamp();
  return new;
end $$;
create trigger calendar_entry_updated before update on public.calendar_entries
for each row execute function public.calendar_touch_entry();

create function public.calendar_create_entry(p_record jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
  t public.calendar_terms;
  e public.calendar_entries;
  entry_id uuid=(p_record->>'id')::uuid;
  day_start timestamptz=date_trunc('day',now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
begin
  -- One transaction for duplicate detection, quota check and insertion.
  perform pg_advisory_xact_lock(20260921,1);
  select * into e from public.calendar_entries where id=entry_id;
  if found then
    if e.term_id=p_record->>'term_id' and e.course_id=p_record->>'course_id'
       and e.kind=p_record->>'kind' and e.title=p_record->>'title'
       and e.event_date=(p_record->>'event_date')::date
       and e.event_time is not distinct from nullif(p_record->>'event_time','')::time
       and e.location=coalesce(p_record->>'location','') and e.details=coalesce(p_record->>'details','')
       and e.nickname=p_record->>'nickname' then
      return jsonb_build_object('id',e.id,'duplicate',true);
    end if;
    raise exception 'request_conflict' using errcode='P0001';
  end if;
  select * into t from public.calendar_terms where id=p_record->>'term_id' and active and purge_after>current_date;
  if not found then raise exception 'term_closed' using errcode='P0001'; end if;
  if (p_record->>'event_date')::date not between t.starts_on and t.ends_on then raise exception 'date_outside_term' using errcode='P0001'; end if;
  if (select count(*) from public.calendar_entries where created_at>=day_start)>=200
     or (select count(*) from public.calendar_entries where term_id=t.id)>=3000 then
    raise exception 'quota_reached' using errcode='P0001';
  end if;
  select * into e from public.calendar_entries
    where term_id=t.id and course_id=p_record->>'course_id' and kind=p_record->>'kind'
    and lower(title)=lower(p_record->>'title') and event_date=(p_record->>'event_date')::date
    and event_time is not distinct from nullif(p_record->>'event_time','')::time;
  if found then return jsonb_build_object('id',e.id,'duplicate',true); end if;
  insert into public.calendar_entries(id,term_id,course_id,kind,title,event_date,event_time,location,details,nickname)
    values(entry_id,t.id,p_record->>'course_id',p_record->>'kind',p_record->>'title',(p_record->>'event_date')::date,
      nullif(p_record->>'event_time','')::time,coalesce(p_record->>'location',''),coalesce(p_record->>'details',''),p_record->>'nickname')
    returning * into e;
  return jsonb_build_object('id',e.id,'duplicate',false);
end $$;

create function public.calendar_report_entry(p_entry_id uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare e public.calendar_entries; r public.calendar_reports;
begin
  perform pg_advisory_xact_lock(20260921,2);
  select ce.* into e from public.calendar_entries ce join public.calendar_terms t on t.id=ce.term_id
    where ce.id=p_entry_id and t.purge_after>current_date;
  if not found then raise exception 'entry_not_found' using errcode='P0001'; end if;
  select * into r from public.calendar_reports where entry_id=e.id and entry_version=e.updated_at;
  if found then return jsonb_build_object('id',r.id,'duplicate',true); end if;
  -- Each distinct report can attempt delivery three times: at most 45 submissions/month.
  if (select count(*) from public.calendar_reports where created_at>=date_trunc('month',now()))>=15 then
    raise exception 'quota_reached' using errcode='P0001';
  end if;
  insert into public.calendar_reports(entry_id,entry_version) values(e.id,e.updated_at) returning * into r;
  return jsonb_build_object('id',r.id,'duplicate',false);
end $$;

create function public.calendar_claim_reports(p_limit integer default 5) returns setof public.calendar_reports
language plpgsql security invoker set search_path='' as $$
declare remaining integer; claimed integer; this_month date=date_trunc('month',now())::date;
begin
  perform pg_advisory_xact_lock(20260921,3);
  insert into public.calendar_delivery_budget(month) values(this_month) on conflict do nothing;
  select 45-attempts into remaining from public.calendar_delivery_budget where month=this_month for update;
  return query update public.calendar_reports set status='sending', attempts=attempts+1,next_attempt_at=now()+interval '15 minutes'
  where id in (
    select id from public.calendar_reports where status in ('pending','sending') and attempts<3 and next_attempt_at<=now()
    order by created_at limit least(greatest(p_limit,1),5,remaining) for update skip locked
  ) returning *;
  get diagnostics claimed=row_count;
  update public.calendar_delivery_budget set attempts=attempts+claimed where month=this_month;
end
$$;
create function public.calendar_finish_report(p_id uuid,p_success boolean) returns void
language sql security invoker set search_path='' as $$
  update public.calendar_reports set status=case when p_success then 'sent' when attempts>=3 then 'failed' else 'pending' end,
    sent_at=case when p_success then now() else null end
  where id=p_id and status='sending';
$$;
create function public.calendar_cleanup() returns void
language plpgsql security invoker set search_path='' as $$
begin
  delete from public.calendar_entries where term_id in (select id from public.calendar_terms where purge_after<=current_date);
  -- Keep current-month delivery counters even after 30 days, to preserve the monthly cap.
  delete from public.calendar_reports where created_at<least(now()-interval '60 days',date_trunc('month',now())) and status in ('sent','failed');
  update public.calendar_reports set status='failed' where status='sending' and attempts>=3 and next_attempt_at<=now();
end $$;

revoke all on function public.calendar_touch_entry(),public.calendar_create_entry(jsonb),public.calendar_report_entry(uuid),public.calendar_claim_reports(integer),public.calendar_finish_report(uuid,boolean),public.calendar_cleanup() from public,anon,authenticated;
grant execute on function public.calendar_touch_entry(),public.calendar_create_entry(jsonb),public.calendar_report_entry(uuid),public.calendar_claim_reports(integer),public.calendar_finish_report(uuid,boolean),public.calendar_cleanup() to service_role;
commit;
