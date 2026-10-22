-- Açık deniz düellosu (032). Supabase SQL Editor'de bir kez çalıştırılır.
-- Bahisli düelloda oyun sunucusu iki kaptanın incisini düello başında kilitler (cüzdandan düşer); kazanan toplamın %90'ını
-- sunucu ödülü olarak alır, berabere biterse bahis geri verilir. Aynı kilit iki kez düşmez (p_event tekildir).
create table if not exists public.duel_stakes(
  event_id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null,created_at timestamptz not null default now()
);
alter table public.duel_stakes enable row level security;
revoke all on public.duel_stakes from anon,authenticated;

create or replace function public.duel_stake(p_secret text,p_uid uuid,p_event uuid,p_amount int) returns boolean
language plpgsql security definer set search_path=public as $fn$
declare have bigint;
begin
  if p_secret is null or not exists(select 1 from server_secrets where name='game_server' and value=p_secret) then raise exception 'yetki yok'; end if;
  if p_amount is null or p_amount<=0 or p_amount>1000 then return false; end if;
  if exists(select 1 from duel_stakes where event_id=p_event) then return true; end if;
  insert into wallets(user_id) values(p_uid) on conflict do nothing;
  select pearls into have from wallets where user_id=p_uid for update;
  if coalesce(have,0)<p_amount then return false; end if;
  update wallets set pearls=pearls-p_amount,updated_at=now() where user_id=p_uid;
  insert into pearl_log(user_id,delta,reason) values(p_uid,-p_amount,'düello bahsi');
  insert into duel_stakes(event_id,user_id,amount) values(p_event,p_uid,p_amount);
  return true;
end $fn$;
revoke all on function public.duel_stake(text,uuid,uuid,int) from public,authenticated;
grant execute on function public.duel_stake(text,uuid,uuid,int) to anon;
