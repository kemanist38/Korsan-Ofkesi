-- Casus sunucuda. Supabase SQL Editor'de bir kez çalıştırılır (011'den sonra).
-- Oyun sunucusu (VPS) casusu gönderir: bedel (100 inci) cüzdandan düşer, hedefin Casus Kalkanı varsa 1 hak düşer ve konum verilmez.
-- Hedef oyunda değilse son çıkış yaptığı harita ve konum bu tablodan okunur (VPS çıkışta yazar).
create table if not exists public.last_pos(
  user_id uuid primary key references public.profiles(id) on delete cascade,
  map text not null,
  x int not null,
  y int not null,
  at timestamptz not null default now()
);
alter table public.last_pos enable row level security;

create or replace function public.spy_seen(p_secret text, p_uid uuid, p_map text, p_x int, p_y int) returns void language plpgsql security definer set search_path = public as $fn$
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  insert into last_pos(user_id, map, x, y, at) values (p_uid, p_map, p_x, p_y, now())
    on conflict (user_id) do update set map = excluded.map, x = excluded.x, y = excluded.y, at = now();
end $fn$;

create or replace function public.spy_charge(p_secret text, p_spy uuid, p_nick text) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_to uuid; v_nick text; v_pearls bigint; v_shield numeric; v_pos last_pos;
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  select id, nick into v_to, v_nick from profiles where lower(nick) = lower(trim(p_nick)) and not banned;
  if v_to is null or v_to = p_spy then return jsonb_build_object('status', 'unknown'); end if;
  insert into wallets(user_id) values (p_spy) on conflict do nothing;
  select pearls into v_pearls from wallets where user_id = p_spy for update;
  if v_pearls < 100 then return jsonb_build_object('status', 'poor'); end if;
  update wallets set pearls = pearls - 100, updated_at = now() where user_id = p_spy;
  insert into pearl_log(user_id, delta, reason) values (p_spy, -100, 'casus ' || v_nick);
  select coalesce((state->>'a_spyShield')::numeric, 0) into v_shield from economy where user_id = v_to for update;
  if coalesce(v_shield, 0) > 0 then
    update economy set state = state || jsonb_build_object('a_spyShield', v_shield - 1) where user_id = v_to;
    return jsonb_build_object('status', 'blocked', 'nick', v_nick, 'shieldLeft', v_shield - 1);
  end if;
  select * into v_pos from last_pos where user_id = v_to;
  return jsonb_build_object('status', 'found', 'nick', v_nick, 'target', v_to, 'map', v_pos.map, 'x', v_pos.x, 'y', v_pos.y);
end $fn$;

revoke all on function public.spy_seen(text, uuid, text, int, int), public.spy_charge(text, uuid, text) from public;
grant execute on function public.spy_seen(text, uuid, text, int, int), public.spy_charge(text, uuid, text) to anon, authenticated;
