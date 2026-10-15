-- Paylaşılan filo adaları: her denizin (2/1 … 8/2) adasının sahibi filo, 16 kaidedeki kuleler ve yıkık kaideler.
-- Kule canını oyun sunucusu (VPS) canlı tutar ve buraya yazar (SERVER_SECRET ile). Kule dikmeyi yalnızca adanın sahibi
-- filonun başkanı ve yardımcısı yapar; bedel kendi inci cüzdanından düşer. Yıkılan kaideye 1 saat kule dikilemez.
create table if not exists public.islands(
  map_key text primary key,
  guild_id bigint references public.guilds(id) on delete set null,
  towers jsonb not null default '[]'::jsonb,  -- 16 eleman: null ya da {"type":"cannon","hp":sayı}
  ruins jsonb not null default '{}'::jsonb,   -- {"kaide":yıkılma_ms}
  updated_at timestamptz not null default now()
);
alter table public.islands enable row level security;
drop policy if exists "islands read" on public.islands;
create policy "islands read" on public.islands for select using (true);
insert into public.islands(map_key) select k from unnest(array['2/1','2/2','3/1','3/2','4/1','4/2','5/1','5/2','6/1','6/2','7/1','7/2','8/1','8/2']) k on conflict do nothing;

-- Kule bedeli (inci) ve canı denizin seviyesine göre; oyun koduyla aynı formül (src/guild.ts, src/fleetBalance.ts)
create or replace function public.island_tower_cost(p_tier int) returns bigint language sql immutable as $$ select (200 + 100 * p_tier)::bigint $$;
create or replace function public.island_tower_hp(p_tier int) returns bigint language sql immutable as $$ select round(37800000 * (1 + .025 * greatest(0, least(8, p_tier) - 2)))::bigint $$;

create or replace function public.island_build(p_map text, p_slot int) returns bigint language plpgsql security definer set search_path = public as $$
declare i islands; g bigint; r text; tier int; cost bigint; w wallets; t jsonb; ruin bigint;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if p_slot < 0 or p_slot > 15 then raise exception 'Geçersiz kaide'; end if;
  select guild_id, role into g, r from guild_members where user_id = auth.uid();
  if g is null or r not in ('leader','deputy') then raise exception 'Kuleyi yalnızca başkan ve yardımcı dikebilir'; end if;
  select * into i from islands where map_key = p_map for update;
  if not found then raise exception 'Ada bulunamadı'; end if;
  if i.guild_id is distinct from g then raise exception 'Bu ada filonun değil'; end if;
  t := i.towers; while jsonb_array_length(t) < 16 loop t := t || 'null'::jsonb; end loop;
  if t->p_slot is not null and jsonb_typeof(t->p_slot) <> 'null' then raise exception 'Bu kaidede zaten kule var'; end if;
  ruin := (i.ruins->>p_slot::text)::bigint;
  if ruin is not null and ruin + 3600000 > (extract(epoch from now()) * 1000)::bigint then raise exception 'Yıkılan kaideye 1 saat dolmadan kule dikilemez'; end if;
  tier := split_part(p_map, '/', 1)::int; cost := island_tower_cost(tier);
  insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
  select * into w from wallets where user_id = auth.uid() for update;
  if w.pearls < cost then raise exception 'Yeterli incin yok (% inci gerekli)', cost; end if;
  update wallets set pearls = pearls - cost, updated_at = now() where user_id = auth.uid();
  insert into pearl_log(user_id, delta, reason) values (auth.uid(), -cost, 'kule ' || p_map);
  t := jsonb_set(t, array[p_slot::text], jsonb_build_object('type','cannon','hp',island_tower_hp(tier)));
  update islands set towers = t, ruins = ruins - p_slot::text, updated_at = now() where map_key = p_map;
  return cost;
end $$;

-- Oyun sunucusu: kule canlarını kaydeder (yalnız var olan kulelerin canı değişir; dikilen yeni kuleler korunur)
create or replace function public.island_hp(p_secret text, p_map text, p_hps jsonb) returns void language plpgsql security definer set search_path = public as $$
declare t jsonb; n int;
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  select towers into t from islands where map_key = p_map for update; if t is null then return; end if;
  for n in 0 .. least(jsonb_array_length(t), jsonb_array_length(p_hps)) - 1 loop
    if jsonb_typeof(t->n) = 'object' and jsonb_typeof(p_hps->n) = 'number' then t := jsonb_set(t, array[n::text, 'hp'], p_hps->n); end if;
  end loop;
  update islands set towers = t, updated_at = now() where map_key = p_map;
end $$;

-- Oyun sunucusu: kule yıkıldı (kaide 1 saat yıkık kalır)
create or replace function public.island_destroy(p_secret text, p_map text, p_slot int, p_at bigint) returns void language plpgsql security definer set search_path = public as $$
declare t jsonb;
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  select towers into t from islands where map_key = p_map for update; if t is null then return; end if;
  if p_slot < jsonb_array_length(t) then t := jsonb_set(t, array[p_slot::text], 'null'::jsonb); end if;
  update islands set towers = t, ruins = ruins || jsonb_build_object(p_slot::text, p_at), updated_at = now() where map_key = p_map;
end $$;

-- Oyun sunucusu: ada ele geçirildi (yeni sahibi bütün kaidelere hemen kule dikebilir)
create or replace function public.island_capture(p_secret text, p_map text, p_guild bigint) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  update islands set guild_id = p_guild, towers = '[]'::jsonb, ruins = '{}'::jsonb, updated_at = now() where map_key = p_map;
end $$;

revoke all on function public.island_hp(text,text,jsonb) from public;
revoke all on function public.island_destroy(text,text,int,bigint) from public;
revoke all on function public.island_capture(text,text,bigint) from public;
grant execute on function public.island_hp(text,text,jsonb) to anon, authenticated;
grant execute on function public.island_destroy(text,text,int,bigint) to anon, authenticated;
grant execute on function public.island_capture(text,text,bigint) to anon, authenticated;
grant execute on function public.island_build(text,int) to authenticated;
