-- ═══════════════════════════════════════════════════════
-- 0001 · Identity & astrology core
-- ═══════════════════════════════════════════════════════

create extension if not exists moddatetime schema extensions;

-- ── profiles ──────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  chronotype text check (chronotype in ('lark','early','mid','owl')),
  focus_areas text[] not null default '{}',
  timezone text not null default 'UTC',
  locale text not null default 'en',
  country_code text,
  plan text not null default 'free' check (plan in ('free','plus','pro')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create trigger profiles_updated before update on public.profiles
  for each row execute procedure extensions.moddatetime (updated_at);

create policy "profiles: owner read" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: owner update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  insert into public.wallets (user_id) values (new.id);
  insert into public.entitlements (user_id) values (new.id);
  insert into public.streaks (user_id) values (new.id);
  insert into public.notification_prefs (user_id) values (new.id);
  return new;
end $$;

-- ── birth data (sensitive; separate table) ────────────
create table public.birth_data (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  birth_date date not null,
  birth_time time,
  time_known boolean not null default true,
  birth_place text not null,
  lat double precision not null,
  lng double precision not null,
  tz text not null,
  updated_at timestamptz not null default now()
);
alter table public.birth_data enable row level security;
create trigger birth_updated before update on public.birth_data
  for each row execute procedure extensions.moddatetime (updated_at);

create policy "birth: owner all" on public.birth_data
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── natal charts (computed server-side) ───────────────
create table public.natal_charts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  chart jsonb not null,
  engine_version int not null default 1,
  computed_at timestamptz not null default now()
);
alter table public.natal_charts enable row level security;
create policy "charts: owner read" on public.natal_charts
  for select using (user_id = auth.uid());
-- writes via service role only (no insert/update policy for authenticated)

-- ── shared daily sky cache ────────────────────────────
create table public.daily_sky_cache (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  tz text not null,
  lat_bucket int not null,
  lng_bucket int not null,
  sky jsonb not null,
  created_at timestamptz not null default now(),
  unique (date, tz, lat_bucket, lng_bucket)
);
alter table public.daily_sky_cache enable row level security;
create policy "sky: authenticated read" on public.daily_sky_cache
  for select using (auth.role() = 'authenticated');

-- ── per-user daily cards ──────────────────────────────
create table public.daily_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  content jsonb not null,
  model text,
  prompt_tokens int,
  completion_tokens int,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
alter table public.daily_cards enable row level security;
create policy "cards: owner read" on public.daily_cards
  for select using (user_id = auth.uid());

create index daily_cards_user_date on public.daily_cards (user_id, date desc);
