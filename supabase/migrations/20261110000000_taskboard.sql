-- TaskBoard database schema for Supabase (PostgreSQL)
-- Run this whole file once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- It creates the tables, the security rules (Row Level Security) and the realtime feed.
--
-- Roles (profiles.role):
--   owner    first person to sign up; always an admin; cannot be changed from the app
--   admin    manages plans, members, buckets, labels and user roles; sees every plan
--   member   works on tasks in the plans they belong to
--   viewer   reads the plans they belong to; cannot change anything
--   pending  signed up but not yet approved by an admin; sees nothing
--   disabled access turned off by an admin; sees nothing

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text not null default '',
  role        text not null default 'pending'
              check (role in ('owner','admin','member','viewer','pending','disabled')),
  last_seen   date,
  created_at  timestamptz not null default now()
);

create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 200),
  description text not null default '',
  color       text not null default '#0d6b70',
  code        text not null default 'PLN',
  members     uuid[] not null default '{}',
  buckets     jsonb not null default '[]'::jsonb,
  labels      jsonb not null default '[]'::jsonb,
  created_by  uuid references auth.users(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);

create table if not exists public.tasks (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references public.plans(id) on delete cascade,
  num            integer not null default 0,
  bucket_id      text not null default '',
  title          text not null default 'Untitled task' check (char_length(title) <= 500),
  notes          text not null default '',
  assignees      uuid[] not null default '{}',
  priority       text not null default 'medium' check (priority in ('urgent','important','medium','low')),
  progress       text not null default 'notstarted' check (progress in ('notstarted','inprogress','completed')),
  start_date     date,
  due_date       date,
  labels         text[] not null default '{}',
  checklist      jsonb not null default '[]'::jsonb,
  show_checklist boolean not null default false,
  links          jsonb not null default '[]'::jsonb,
  sort_order     double precision not null default 0,
  activity       jsonb not null default '[]'::jsonb,
  created_by     uuid references auth.users(id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_by     uuid references auth.users(id) on delete set null,
  updated_at     timestamptz not null default now(),
  completed_by   uuid references auth.users(id) on delete set null,
  completed_at   timestamptz
);
create index if not exists tasks_plan_idx on public.tasks(plan_id);

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks(id) on delete cascade,
  plan_id     uuid not null references public.plans(id) on delete cascade,
  author      uuid not null references auth.users(id) on delete cascade default auth.uid(),
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);
create index if not exists comments_task_idx on public.comments(task_id);

-- ---------------------------------------------------------------- helper functions
-- SECURITY DEFINER lets the policies read profiles/plans without recursing into their own policies.

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('owner','admin'), false)
$$;

create or replace function public.can_edit() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('owner','admin','member'), false)
$$;

create or replace function public.can_read() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('owner','admin','member','viewer'), false)
$$;

create or replace function public.can_see_plan(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or (public.can_read() and exists (select 1 from public.plans where id = p and auth.uid() = any(members)))
$$;

-- ---------------------------------------------------------------- triggers

-- New sign-up: create the profile. The very first account becomes the owner; everyone after waits for approval.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(4242);
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    case when exists (select 1 from public.profiles where role = 'owner') then 'pending' else 'owner' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profile guard: only admins change roles; the owner role can't be given or taken from the app; email follows auth.
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id;
  new.email := old.email;
  new.created_at := old.created_at;
  if new.role is distinct from old.role and auth.uid() is not null then
    if not public.is_admin() then raise exception 'Only admins can change roles'; end if;
    if old.role = 'owner' then raise exception 'The owner role cannot be changed'; end if;
    if new.role = 'owner' then raise exception 'The owner role cannot be given'; end if;
    if old.id = auth.uid() then raise exception 'You cannot change your own role'; end if;
  end if;
  return new;
end $$;

drop trigger if exists guard_profile on public.profiles;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

-- Tasks: number tasks per plan (PFO-1, PFO-2, ...) and stamp who changed them.
create or replace function public.task_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.plan_id::text));
  select coalesce(max(num), 0) + 1 into new.num from public.tasks where plan_id = new.plan_id;
  new.created_by := coalesce(auth.uid(), new.created_by);
  new.created_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists task_before_insert on public.tasks;
create trigger task_before_insert before insert on public.tasks
  for each row execute function public.task_before_insert();

create or replace function public.task_before_update() returns trigger
language plpgsql set search_path = public as $$
begin
  new.num := old.num;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists task_before_update on public.tasks;
create trigger task_before_update before update on public.tasks
  for each row execute function public.task_before_update();

-- Comments: take the plan from the task, so access checks can't be fooled.
create or replace function public.comment_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select plan_id into new.plan_id from public.tasks where id = new.task_id;
  new.author := coalesce(auth.uid(), new.author);
  new.created_at := now();
  return new;
end $$;

drop trigger if exists comment_before_insert on public.comments;
create trigger comment_before_insert before insert on public.comments
  for each row execute function public.comment_before_insert();

-- ---------------------------------------------------------------- row level security

alter table public.profiles enable row level security;
alter table public.plans    enable row level security;
alter table public.tasks    enable row level security;
alter table public.comments enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.can_read());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select to authenticated
  using (public.can_see_plan(id));

drop policy if exists plans_insert on public.plans;
create policy plans_insert on public.plans for insert to authenticated
  with check (public.is_admin());

drop policy if exists plans_update on public.plans;
create policy plans_update on public.plans for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists plans_delete on public.plans;
create policy plans_delete on public.plans for delete to authenticated
  using (public.is_admin());

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
  using (public.can_see_plan(plan_id));

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
  with check (public.can_edit() and public.can_see_plan(plan_id));

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
  using (public.can_edit() and public.can_see_plan(plan_id))
  with check (public.can_edit() and public.can_see_plan(plan_id));

drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated
  using (public.can_see_plan(plan_id) and (public.is_admin() or (public.can_edit() and created_by = auth.uid())));

drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select to authenticated
  using (public.can_see_plan(plan_id));

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated
  with check (public.can_edit() and public.can_see_plan(plan_id) and author = auth.uid());

drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated
  using (author = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------- privileges

revoke all on public.profiles, public.plans, public.tasks, public.comments from anon;
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.plans, public.tasks, public.comments to authenticated;

-- ---------------------------------------------------------------- realtime (live updates)

do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['profiles','plans','tasks','comments'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- existing accounts
-- If people signed up before this script ran, give them profiles (the earliest becomes owner).
insert into public.profiles (id, full_name, email, role)
select u.id,
       coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1)),
       coalesce(u.email, ''),
       case when row_number() over (order by u.created_at) = 1
             and not exists (select 1 from public.profiles where role = 'owner')
            then 'owner' else 'pending' end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
