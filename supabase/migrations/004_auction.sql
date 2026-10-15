-- Saatlik altın ihalesi sunucuda: en yüksek teklif ve kazanan veritabanında belirlenir, ödül bir kez alınır.
create table if not exists public.auction_top(
  hour bigint not null,
  lot text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  nick text not null,
  amount bigint not null check (amount > 0),
  at timestamptz not null default now(),
  claimed boolean not null default false,
  primary key (hour, lot)
);
alter table public.auction_top enable row level security;
drop policy if exists "auction read" on public.auction_top;
create policy "auction read" on public.auction_top for select using (true);

create or replace function public.auction_hour_now() returns bigint language sql stable as
$$ select floor(extract(epoch from now()) / 3600)::bigint $$;

create or replace function public.auction_bid(p_hour bigint, p_lot text, p_amount bigint) returns void language plpgsql security definer set search_path = public as $$
declare t auction_top; min_next bigint; n text;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if p_hour <> auction_hour_now() then raise exception 'Bu ihale sona erdi'; end if;
  if p_lot not in ('heavy','rapid','long','explosive','leech','breaker','fire','heal','speed','mine','shield','powder') then raise exception 'Geçersiz lot'; end if;
  select nick into n from profiles where id = auth.uid();
  select * into t from auction_top where hour = p_hour and lot = p_lot for update;
  min_next := case when t is null then 1 else ceil(greatest(t.amount + 100, t.amount * 1.05) / 100.0)::bigint * 100 end;
  if p_amount < min_next then raise exception 'Teklifin en yüksek tekliften düşük, daha yüksek bir tutar dene'; end if;
  insert into auction_top(hour, lot, user_id, nick, amount, at) values (p_hour, p_lot, auth.uid(), n, p_amount, now())
  on conflict (hour, lot) do update set user_id = excluded.user_id, nick = excluded.nick, amount = excluded.amount, at = excluded.at;
end $$;

-- Biten ihalede kazanan ödülünü bir kez alır
create or replace function public.auction_claim(p_hour bigint, p_lot text) returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if p_hour >= auction_hour_now() then return false; end if;
  update auction_top set claimed = true where hour = p_hour and lot = p_lot and user_id = auth.uid() and not claimed returning true into ok;
  return coalesce(ok, false);
end $$;

revoke all on function public.auction_bid(bigint,text,bigint), public.auction_claim(bigint,text) from public, anon;
grant execute on function public.auction_bid(bigint,text,bigint), public.auction_claim(bigint,text) to authenticated;
