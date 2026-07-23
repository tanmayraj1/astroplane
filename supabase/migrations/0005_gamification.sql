-- ═══════════════════════════════════════════════════════
-- 0005 · Karma, streaks, notification prefs + signup trigger
-- ═══════════════════════════════════════════════════════

create table public.karma_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in
    ('task_done','checkin','tarot_pull','journal','streak_bonus','referral','redeem')),
  points int not null,
  ref_id uuid,
  date date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.karma_events enable row level security;
create policy "karma: owner read" on public.karma_events
  for select using (user_id = auth.uid());
-- inserts via service role (server actions) only — unforgeable
create index karma_user on public.karma_events (user_id, created_at desc);
-- one karma award per kind+ref (e.g. can't re-earn for same task)
create unique index karma_kind_ref on public.karma_events (user_id, kind, ref_id)
  where ref_id is not null;

create table public.streaks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current int not null default 0,
  longest int not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);
alter table public.streaks enable row level security;
create policy "streaks: owner read" on public.streaks
  for select using (user_id = auth.uid());

create table public.notification_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  daily_card_push boolean not null default true,
  daily_card_time time not null default '07:30',
  voc_alerts boolean not null default true,
  guide_replies boolean not null default true,
  email_digest boolean not null default false,
  push_subscription jsonb,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
create trigger notif_updated before update on public.notification_prefs
  for each row execute procedure extensions.moddatetime (updated_at);
create policy "notif: owner all" on public.notification_prefs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- signup trigger (function defined in 0001, tables now all exist)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- karma balance helper
create or replace function public.karma_balance(p_user_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(points), 0)::int from karma_events where user_id = p_user_id;
$$;
grant execute on function public.karma_balance to authenticated;
