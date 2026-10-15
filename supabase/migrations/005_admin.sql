-- Yönetici paneli (/yonetim/): oyuncu arama, inci hediye, ban, kupon oluşturma. Yalnızca admins tablosundaki hesaplar kullanabilir.
create table if not exists public.admins(user_id uuid primary key references public.profiles(id) on delete cascade);
alter table public.admins enable row level security;
drop policy if exists "admins read own" on public.admins;
create policy "admins read own" on public.admins for select using (auth.uid() = user_id);
alter table public.profiles add column if not exists ban_reason text;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from admins where user_id = auth.uid()) $$;

create or replace function public.admin_find(p_q text) returns table(player_no bigint, nick text, email text, banned boolean, ban_reason text, pearls bigint, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Yetkin yok'; end if;
  return query select p.player_no, p.nick, u.email::text, p.banned, p.ban_reason, coalesce(w.pearls, 0), p.created_at
    from profiles p join auth.users u on u.id = p.id left join wallets w on w.user_id = p.id
    where p_q = '' or p.nick ilike '%' || p_q || '%' or u.email ilike '%' || p_q || '%' or p.player_no::text = p_q
    order by p.player_no desc limit 50;
end $$;

create or replace function public.admin_gift(p_player_no bigint, p_amount bigint, p_reason text) returns bigint language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Yetkin yok'; end if;
  return gift_pearls(p_player_no, p_amount, coalesce(nullif(p_reason, ''), 'hediye'));
end $$;

create or replace function public.admin_ban(p_player_no bigint, p_banned boolean, p_reason text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Yetkin yok'; end if;
  update profiles set banned = p_banned, ban_reason = case when p_banned then nullif(p_reason, '') else null end where player_no = p_player_no;
  if not found then raise exception 'Oyuncu bulunamadı'; end if;
end $$;

create or replace function public.admin_coupon(p_code text, p_reward jsonb, p_until date, p_max_uses int, p_note text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Yetkin yok'; end if;
  perform coupon_add(p_code, p_reward, p_until, p_max_uses, p_note);
end $$;

-- Banlı hesap kayıt yazamaz ve inci eşitleyemez
drop policy if exists "saves update own" on public.saves;
create policy "saves update own" on public.saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id and octet_length(data::text) < 2000000 and not exists (select 1 from public.profiles where id = auth.uid() and banned));

revoke all on function public.admin_find(text), public.admin_gift(bigint,bigint,text), public.admin_ban(bigint,boolean,text), public.admin_coupon(text,jsonb,date,int,text) from public, anon;
grant execute on function public.is_admin(), public.admin_find(text), public.admin_gift(bigint,bigint,text), public.admin_ban(bigint,boolean,text), public.admin_coupon(text,jsonb,date,int,text) to authenticated;
