-- ═══════════════════════════════════════════════════════
-- 0003 · Guides marketplace & live chat
-- ═══════════════════════════════════════════════════════

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  craft text not null,
  category text not null check (category in ('astrologer','tarot','healer')),
  bio text not null,
  avatar_url text,
  voice jsonb not null default '{}',
  system_prompt text not null,
  model text not null default 'gpt-4o-mini',
  rate_cents_per_min int not null,
  rate_paise_per_min int not null,
  languages text[] not null default '{en}',
  years_practice int,
  rating numeric not null default 4.8,
  session_count int not null default 0,
  is_ai boolean not null default true,
  is_online boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.guides enable row level security;
-- base table: service role only. Clients read through the view below.

create view public.guides_public
with (security_invoker = off) as
  select id, slug, name, craft, category, bio, avatar_url,
         rate_cents_per_min, rate_paise_per_min, languages,
         years_practice, rating, session_count, is_ai, is_online, active
  from public.guides
  where active;
grant select on public.guides_public to authenticated, anon;

-- ── chat sessions ─────────────────────────────────────
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  guide_id uuid not null references public.guides (id),
  status text not null default 'active'
    check (status in ('active','ended','aborted_funds')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_tick_at timestamptz not null default now(),
  billed_minutes int not null default 0,
  rate_snapshot int not null,
  currency text not null check (currency in ('USD','INR')),
  total_charged int not null default 0,
  flagged_crisis boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.chat_sessions enable row level security;
create policy "sessions: owner read" on public.chat_sessions
  for select using (user_id = auth.uid());
-- mutations via service role only (billing integrity)
create index sessions_user on public.chat_sessions (user_id, started_at desc);
create index sessions_active_sweep on public.chat_sessions (status, last_tick_at)
  where status = 'active';

-- ── chat messages ─────────────────────────────────────
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role text not null check (role in ('user','guide','system')),
  content text not null check (char_length(content) <= 8000),
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
create policy "messages: session owner read" on public.chat_messages
  for select using (
    exists (select 1 from public.chat_sessions s
            where s.id = session_id and s.user_id = auth.uid())
  );
create policy "messages: user insert own" on public.chat_messages
  for insert with check (
    role = 'user' and exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid() and s.status = 'active')
  );
create index messages_session on public.chat_messages (session_id, created_at);

-- realtime on messages + sessions
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_sessions;
