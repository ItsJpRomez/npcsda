-- =========================================================
-- NPC SDA Church website: database schema
-- Run this once in Supabase → SQL Editor → New query → Run.
-- Safe to run again: it only creates what is missing and
-- refreshes the security policies.
-- =========================================================

-- ---------- Administrators ----------
-- Only users listed here can change website content or upload photos.
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Keeps updated_at current on every edit
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Church information (one row) ----------
create table if not exists public.church_info (
  id            int primary key default 1 check (id = 1),
  name          text not null default '',
  short_name    text,
  denomination  text,
  address       text,
  map_query     text,          -- what Google Maps searches for (map + directions)
  phone         text,
  email         text,
  facebook_url  text,
  member_count  text,          -- free text, e.g. "150+"
  founded_year  int,
  about_heading text,
  intro         text,          -- blank line between paragraphs
  mission       text,
  vision        text,
  history       text,          -- church history / our story
  updated_at    timestamptz not null default now()
);

-- ---------- Worship schedule ----------
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),  -- 0 = Sunday … 6 = Saturday
  start_time  time not null,
  end_time    time not null,
  is_main     boolean not null default false,
  sort_order  int not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Church history milestones ----------
create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  year        int,
  title       text not null,
  description text,
  image_url   text,
  sort_order  int not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Church officers ----------
create table if not exists public.officers (
  id          uuid primary key default gen_random_uuid(),
  full_name   text,
  position    text not null,
  image_url   text,
  bio         text,
  is_featured boolean not null default false,   -- shown as the large pastor card
  sort_order  int not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Events & announcements ----------
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null default 'event' check (kind in ('event', 'announcement')),
  title         text not null,
  category      text,
  description   text,
  starts_at     timestamptz,
  ends_at       timestamptz,
  schedule_note text,          -- optional, e.g. "Nightly, 7:00 PM"
  location      text,
  image_url     text,
  link_url      text,
  status        text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed')),
  is_featured   boolean not null default false,
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Ministries ----------
create table if not exists public.ministries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  leader      text,
  schedule    text,
  image_url   text,
  icon        text,
  sort_order  int not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Photo gallery ----------
create table if not exists public.albums (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  album_id    uuid references public.albums (id) on delete set null,
  image_url   text,            -- empty = placeholder tile until a photo is uploaded
  caption     text,
  description text,
  icon        text,
  sort_order  int not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Building fund (one row) ----------
create table if not exists public.building_fund (
  id            int primary key default 1 check (id = 1),
  title         text,
  description   text,
  goal          numeric(14, 2) not null default 0 check (goal >= 0),
  raised        numeric(14, 2) not null default 0 check (raised >= 0),
  image_url     text,
  image_caption text,
  form_url      text,          -- Google Form for donations
  updated_at    timestamptz not null default now()
);

-- ---------- Tithes & offerings ----------
create table if not exists public.giving (
  id         int primary key default 1 check (id = 1),
  note       text,
  form_url   text,             -- optional Google Form for giving
  form_label text,
  updated_at timestamptz not null default now()
);

create table if not exists public.giving_methods (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  icon           text,
  bank_name      text,
  account_name   text,
  account_number text,
  note           text,
  sort_order     int not null default 0,
  published      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- Spiritual resources ----------
create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  category    text not null default 'study',
  title       text not null,
  description text,
  url         text,
  image_url   text,
  sort_order  int not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array['church_info','services','milestones','officers','events','ministries',
                           'albums','photos','building_fund','giving','giving_methods','resources']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    execute format('create trigger touch_%1$s before update on public.%1$I
                    for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- =========================================================
-- Row Level Security
-- Visitors (anon) can only READ published content.
-- Only users in admin_users can add, change or delete.
-- =========================================================
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.admin_users from authenticated;

alter table public.admin_users enable row level security;
drop policy if exists "Admins can see their own row" on public.admin_users;
create policy "Admins can see their own row" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- Tables with a "published" switch: visitors see published rows only
do $$
declare t text;
begin
  foreach t in array array['services','milestones','officers','events','ministries',
                           'photos','giving_methods','resources']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public reads published" on public.%I', t);
    execute format('create policy "Public reads published" on public.%I
                    for select using (published or public.is_admin())', t);
    execute format('drop policy if exists "Admins manage" on public.%I', t);
    execute format('create policy "Admins manage" on public.%I
                    for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  -- Single-row settings and albums: everyone can read
  foreach t in array array['church_info','building_fund','giving','albums']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Public reads" on public.%I', t);
    execute format('create policy "Public reads" on public.%I for select using (true)', t);
    execute format('drop policy if exists "Admins manage" on public.%I', t);
    execute format('create policy "Admins manage" on public.%I
                    for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- =========================================================
-- Image storage: public "media" bucket
-- Anyone can view images; only admins can upload, replace or delete.
-- Max 5 MB, JPG / PNG / WebP only (enforced by Supabase itself).
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- (Public image links work without this; it lets admins manage files.)
drop policy if exists "Admins read media" on storage.objects;
create policy "Admins read media" on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins upload media" on storage.objects;
create policy "Admins upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins update media" on storage.objects;
create policy "Admins update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "Admins delete media" on storage.objects;
create policy "Admins delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
