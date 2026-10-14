-- Hesaplar ve bulut kayıt. Supabase > SQL Editor'de bir kez çalıştırılır.
create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  player_no bigint generated always as identity (start with 10001) unique,
  nick text not null check (char_length(nick) between 3 and 16 and nick ~ '^[[:alnum:]_.]+$'),
  banned boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_nick_lower on public.profiles (lower(nick));
alter table public.profiles enable row level security;
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- Oyuncu yalnızca adını değiştirebilir (numara ve ban durumu korunur)
revoke update on public.profiles from anon, authenticated;
grant update (nick) on public.profiles to authenticated;

create table if not exists public.saves(
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
drop policy if exists "saves read own" on public.saves;
create policy "saves read own" on public.saves for select using (auth.uid() = user_id);
drop policy if exists "saves insert own" on public.saves;
create policy "saves insert own" on public.saves for insert with check (auth.uid() = user_id and octet_length(data::text) < 2000000);
drop policy if exists "saves update own" on public.saves;
create policy "saves update own" on public.saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id and octet_length(data::text) < 2000000);
