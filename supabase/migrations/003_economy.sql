-- İnci cüzdanı ve kupon kodları sunucuda. İnci yalnızca kupon, ödeme ve yönetici hediyesiyle sınırsız eklenir;
-- oyun içinden kazanılan inci günlük üst sınıra tabidir. Harcamalar bakiyeden düşer, bakiye eksiye inmez.
create table if not exists public.wallets(
  user_id uuid primary key references public.profiles(id) on delete cascade,
  pearls bigint not null default 0 check (pearls >= 0),
  earned_day date not null default current_date,
  earned_today bigint not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.pearl_log(
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta bigint not null,
  reason text not null,
  at timestamptz not null default now()
);
create index if not exists pearl_log_user on public.pearl_log(user_id, at desc);
alter table public.wallets enable row level security;
alter table public.pearl_log enable row level security;
drop policy if exists "wallet read own" on public.wallets;
create policy "wallet read own" on public.wallets for select using (auth.uid() = user_id);
drop policy if exists "pearl log read own" on public.pearl_log;
create policy "pearl log read own" on public.pearl_log for select using (auth.uid() = user_id);

-- Oyun içi kazanılabilecek günlük inci sınırı
create or replace function public.pearl_daily_cap() returns bigint language sql immutable as $$ select 2000::bigint $$;

create or replace function public.wallet_get() returns bigint language plpgsql security definer set search_path = public as $$
declare b bigint;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
  select pearls into b from wallets where user_id = auth.uid();
  return b;
end $$;

-- Oyun bakiyeyi eşitler: harcanan inci düşülür, kazanılan inci günlük sınıra kadar eklenir. Yeni bakiye döner.
create or replace function public.wallet_sync(p_spent bigint, p_earned bigint) returns bigint language plpgsql security definer set search_path = public as $$
declare w wallets; spend bigint; earn bigint;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
  select * into w from wallets where user_id = auth.uid() for update;
  if w.earned_day <> current_date then w.earned_day := current_date; w.earned_today := 0; end if;
  spend := least(greatest(coalesce(p_spent,0),0), w.pearls);
  earn := least(greatest(coalesce(p_earned,0),0), greatest(pearl_daily_cap() - w.earned_today, 0));
  update wallets set pearls = w.pearls - spend + earn, earned_day = w.earned_day, earned_today = w.earned_today + earn, updated_at = now() where user_id = auth.uid();
  if spend > 0 then insert into pearl_log(user_id, delta, reason) values (auth.uid(), -spend, 'harcama'); end if;
  if earn > 0 then insert into pearl_log(user_id, delta, reason) values (auth.uid(), earn, 'oyun'); end if;
  return w.pearls - spend + earn;
end $$;

-- Kuponlar: kod düz metin saklanmaz, SHA-256 özeti tutulur
create table if not exists public.coupons(
  code_hash text primary key,
  reward jsonb not null,
  until date,
  max_uses int,
  uses int not null default 0,
  note text
);
create table if not exists public.coupon_redemptions(
  user_id uuid not null references public.profiles(id) on delete cascade,
  code_hash text not null references public.coupons(code_hash) on delete cascade,
  at timestamptz not null default now(),
  primary key (user_id, code_hash)
);
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
drop policy if exists "redemptions read own" on public.coupon_redemptions;
create policy "redemptions read own" on public.coupon_redemptions for select using (auth.uid() = user_id);

create or replace function public.coupon_hash(p_code text) returns text language sql immutable as
$$ select encode(sha256(convert_to(upper(regexp_replace(translate(trim(p_code), 'iıİ', 'III'), '\s+', '', 'g')), 'UTF8')), 'hex') $$;

-- Yeni kupon (yönetici, SQL Editor'den): select public.coupon_add('KOD', '{"pearls":100,"gold":50000}', '2026-12-31', 1000, 'not');
create or replace function public.coupon_add(p_code text, p_reward jsonb, p_until date default null, p_max_uses int default null, p_note text default null)
returns text language sql security definer set search_path = public as $$
  insert into coupons(code_hash, reward, until, max_uses, note) values (coupon_hash(p_code), p_reward, p_until, p_max_uses, p_note)
  on conflict (code_hash) do update set reward = excluded.reward, until = excluded.until, max_uses = excluded.max_uses, note = excluded.note
  returning code_hash $$;

create or replace function public.coupon_redeem(p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare h text := coupon_hash(p_code); c coupons; p bigint;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  select * into c from coupons where code_hash = h for update;
  if c is null then raise exception 'Geçersiz kupon kodu'; end if;
  if c.until is not null and current_date > c.until then raise exception 'Bu kuponun süresi dolmuş'; end if;
  if c.max_uses is not null and c.uses >= c.max_uses then raise exception 'Bu kuponun kullanım hakkı dolmuş'; end if;
  if exists (select 1 from coupon_redemptions where user_id = auth.uid() and code_hash = h) then raise exception 'Bu kuponu zaten kullandın'; end if;
  insert into coupon_redemptions(user_id, code_hash) values (auth.uid(), h);
  update coupons set uses = uses + 1 where code_hash = h;
  p := coalesce((c.reward->>'pearls')::bigint, 0);
  if p > 0 then
    insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
    update wallets set pearls = pearls + p, updated_at = now() where user_id = auth.uid();
    insert into pearl_log(user_id, delta, reason) values (auth.uid(), p, 'kupon');
  end if;
  return c.reward;
end $$;

-- Yönetici inci hediyesi (SQL Editor'den): select public.gift_pearls(10001, 500, 'hediye');
create or replace function public.gift_pearls(p_player_no bigint, p_amount bigint, p_reason text default 'hediye') returns bigint
language plpgsql security definer set search_path = public as $$
declare u uuid; b bigint;
begin
  select id into u from profiles where player_no = p_player_no;
  if u is null then raise exception 'Oyuncu bulunamadı'; end if;
  insert into wallets(user_id) values (u) on conflict do nothing;
  update wallets set pearls = greatest(pearls + p_amount, 0), updated_at = now() where user_id = u returning pearls into b;
  insert into pearl_log(user_id, delta, reason) values (u, p_amount, p_reason);
  return b;
end $$;

revoke all on function public.wallet_get(), public.wallet_sync(bigint,bigint), public.coupon_redeem(text) from public, anon;
grant execute on function public.wallet_get(), public.wallet_sync(bigint,bigint), public.coupon_redeem(text) to authenticated;
revoke all on function public.coupon_add(text,jsonb,date,int,text), public.gift_pearls(bigint,bigint,text) from public, anon, authenticated;

-- Beta hoş geldin kuponu
select public.coupon_add('PIRATERAGE', '{"pearls":100,"gold":50000}', '2026-12-31', null, 'Beta hoş geldin');
