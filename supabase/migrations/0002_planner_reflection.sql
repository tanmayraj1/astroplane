-- ═══════════════════════════════════════════════════════
-- 0002 · Planner, tarot, mood, patterns
-- ═══════════════════════════════════════════════════════

-- ── tasks ─────────────────────────────────────────────
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  notes text,
  date date not null,
  start_at timestamptz,
  duration_min int check (duration_min between 5 and 720),
  window_hint text check (window_hint in ('power','neutral','friction','auto')),
  status text not null default 'todo' check (status in ('todo','done','skipped')),
  completed_at timestamptz,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create trigger tasks_updated before update on public.tasks
  for each row execute procedure extensions.moddatetime (updated_at);
create policy "tasks: owner all" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index tasks_user_date on public.tasks (user_id, date);

-- ── tarot pulls ───────────────────────────────────────
create table public.tarot_pulls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  card_key text not null,
  reversed boolean not null default false,
  spread text not null default 'daily'
    check (spread in ('daily','new_moon','relationship','career')),
  position int not null default 0,
  interpretation jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, date, spread, position)
);
alter table public.tarot_pulls enable row level security;
create policy "tarot: owner read" on public.tarot_pulls
  for select using (user_id = auth.uid());
-- inserts via server (seeded draw) only
create index tarot_user_date on public.tarot_pulls (user_id, date desc);

-- ── journal ───────────────────────────────────────────
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tarot_pull_id uuid references public.tarot_pulls (id) on delete set null,
  date date not null,
  body text not null check (char_length(body) <= 8000),
  mood_tag text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.journal_entries enable row level security;
create trigger journal_updated before update on public.journal_entries
  for each row execute procedure extensions.moddatetime (updated_at);
create policy "journal: owner all" on public.journal_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index journal_user_date on public.journal_entries (user_id, date desc);

-- ── mood check-ins ────────────────────────────────────
create table public.mood_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  slot text not null default 'evening' check (slot in ('morning','midday','evening')),
  mood int not null check (mood between 1 and 5),
  energy int check (energy between 1 and 5),
  followed_suggestions boolean,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, date, slot)
);
alter table public.mood_checkins enable row level security;
create policy "mood: owner all" on public.mood_checkins
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index mood_user_date on public.mood_checkins (user_id, date desc);

-- ── pattern insights (computed server-side) ───────────
create table public.pattern_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  kind text not null,
  stats jsonb not null,
  phrasing text,
  confidence numeric,
  sample_n int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.pattern_insights enable row level security;
create policy "insights: owner read" on public.pattern_insights
  for select using (user_id = auth.uid());
create index insights_user on public.pattern_insights (user_id, created_at desc);
