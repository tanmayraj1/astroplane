-- ═══════════════════════════════════════════════════════
-- 0004 · Payments: customers, subscriptions, entitlements,
--        wallet + atomic ledger RPCs, webhook archive
-- ═══════════════════════════════════════════════════════

create table public.customers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id text unique,
  razorpay_customer_id text unique,
  created_at timestamptz not null default now()
);
alter table public.customers enable row level security;
-- service role only

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('stripe','razorpay')),
  provider_sub_id text not null unique,
  plan text not null check (plan in ('plus','pro')),
  status text not null,
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create trigger subs_updated before update on public.subscriptions
  for each row execute procedure extensions.moddatetime (updated_at);
create policy "subs: owner read" on public.subscriptions
  for select using (user_id = auth.uid());
create index subs_user on public.subscriptions (user_id);

create table public.entitlements (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','plus','pro')),
  features jsonb not null default '{}',
  valid_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.entitlements enable row level security;
create policy "entitlements: owner read" on public.entitlements
  for select using (user_id = auth.uid());

create table public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  currency text not null default 'USD' check (currency in ('USD','INR')),
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
create policy "wallets: owner read" on public.wallets
  for select using (user_id = auth.uid());

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('topup','chat_debit','refund','promo','karma_redeem')),
  amount int not null,          -- signed, minor units
  balance_after int not null,
  session_id uuid references public.chat_sessions (id),
  minute_index int,
  provider_payment_id text,
  note text,
  created_at timestamptz not null default now()
);
alter table public.wallet_transactions enable row level security;
create policy "wallet_tx: owner read" on public.wallet_transactions
  for select using (user_id = auth.uid());
create unique index wallet_tx_provider_payment
  on public.wallet_transactions (provider_payment_id)
  where provider_payment_id is not null;
create unique index wallet_tx_session_minute
  on public.wallet_transactions (session_id, minute_index)
  where session_id is not null and minute_index is not null;
create index wallet_tx_user on public.wallet_transactions (user_id, created_at desc);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe','razorpay')),
  event_id text not null unique,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
alter table public.payment_events enable row level security;
-- service role only

-- ── Atomic wallet RPCs (SECURITY DEFINER; called with service role) ──

create or replace function public.wallet_credit(
  p_user_id uuid,
  p_amount int,
  p_type text default 'topup',
  p_provider_payment_id text default null,
  p_note text default null
) returns int
language plpgsql security definer set search_path = public as $$
declare v_balance int;
begin
  if p_amount <= 0 then raise exception 'credit must be positive'; end if;
  -- idempotency: same provider payment id → no-op
  if p_provider_payment_id is not null and exists (
    select 1 from wallet_transactions where provider_payment_id = p_provider_payment_id
  ) then
    select balance into v_balance from wallets where user_id = p_user_id;
    return v_balance;
  end if;
  update wallets set balance = balance + p_amount, updated_at = now()
    where user_id = p_user_id
    returning balance into v_balance;
  if v_balance is null then raise exception 'wallet not found'; end if;
  insert into wallet_transactions (user_id, type, amount, balance_after, provider_payment_id, note)
    values (p_user_id, p_type, p_amount, v_balance, p_provider_payment_id, p_note);
  return v_balance;
end $$;

create or replace function public.wallet_debit_tick(
  p_session_id uuid,
  p_minute_index int
) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_session record;
  v_balance int;
begin
  select * into v_session from chat_sessions where id = p_session_id for update;
  if v_session is null then raise exception 'session not found'; end if;
  if v_session.status <> 'active' then return -1; end if;
  -- idempotent: minute already billed
  if exists (
    select 1 from wallet_transactions
    where session_id = p_session_id and minute_index = p_minute_index
  ) then
    select balance into v_balance from wallets where user_id = v_session.user_id;
    return v_balance;
  end if;

  select balance into v_balance from wallets where user_id = v_session.user_id for update;
  if v_balance < v_session.rate_snapshot then
    update chat_sessions
      set status = 'aborted_funds', ended_at = now()
      where id = p_session_id;
    return -1;
  end if;

  update wallets set balance = balance - v_session.rate_snapshot, updated_at = now()
    where user_id = v_session.user_id
    returning balance into v_balance;
  insert into wallet_transactions
    (user_id, type, amount, balance_after, session_id, minute_index)
    values (v_session.user_id, 'chat_debit', -v_session.rate_snapshot, v_balance,
            p_session_id, p_minute_index);
  update chat_sessions
    set billed_minutes = billed_minutes + 1,
        total_charged = total_charged + rate_snapshot,
        last_tick_at = now()
    where id = p_session_id;
  return v_balance;
end $$;

revoke execute on function public.wallet_credit from public, anon, authenticated;
revoke execute on function public.wallet_debit_tick from public, anon, authenticated;
