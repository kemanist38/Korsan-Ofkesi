-- Bedava haklar kapatıldı, ihale sunucuda, savaş puanı sunucudan (018). Supabase SQL Editor'de bir kez çalıştırılır (017'den sonra), sonra VPS.
--  * Oyuncunun kendi bildirdiği serbest haklar neredeyse sıfır: bütün meşru kaynaklar (NPC, görev, boss, kuşatma, sandık, pırıltı, hazine,
--    günlük/festival, kupon, usta-çırak, ihale, satın alma) artık sunucudan ya da bedelli satın almadan gelir.
--  * İhale: teklifin altını veritabanında düşülür (geçilen teklif yanar, iade yok); kazanılan eşyayı sunucu verir.
--  * Savaş puanı: oyun sunucusunun doğruladığı oyuncu batırmasından gelir.

create or replace function public.economy_rules() returns jsonb language sql immutable as $$ select '{
  "gold":{"rate":30000,"init":40},
  "xp":{"rate":30000,"init":0},
  "ep":{"rate":2000,"init":0},
  "sp":{"rate":100,"init":0},
  "level":{"rate":4,"init":1,"max":8},
  "chain":{"rate":1000,"cur":"pearls","price":0.01,"init":2000},
  "iron":{"rate":5000,"cur":"gold","price":0.01,"init":20000},
  "elite":{"rate":0,"cur":"pearls","price":2500,"init":0,"max":1},
  "design":{"rate":0,"init":0,"max":1},
  "c_cast":{"rate":0,"cur":"gold","price":40,"init":70},
  "c_long":{"rate":0,"cur":"pearls","price":15,"init":6},
  "c_rapid":{"rate":0,"cur":"pearls","price":30,"init":4},
  "c_heavy":{"rate":0,"cur":"pearls","price":50,"init":2},
  "a_fire":{"rate":500,"cur":"pearls","price":0.013334,"init":750},
  "a_explosive":{"rate":200,"cur":"pearls","price":0.02,"init":500},
  "a_breaker":{"rate":200,"cur":"pearls","price":0.016667,"init":500},
  "a_leech":{"rate":200,"cur":"pearls","price":0.026667,"init":500},
  "a_heal":{"rate":200,"cur":"pearls","price":0.02,"init":500},
  "a_mine":{"rate":3,"cur":"pearls","price":5,"init":3},
  "a_powder":{"rate":50,"cur":"gold","price":10,"init":30},
  "a_shield":{"rate":50,"cur":"gold","price":10,"init":30},
  "a_speed":{"rate":5,"cur":"pearls","price":2,"init":10},
  "a_compass":{"rate":2,"cur":"pearls","price":1,"init":5},
  "a_spyShield":{"rate":0,"cur":"pearls","price":150,"init":0},
  "e_sail-0":{"rate":0,"cur":"gold","price":5000,"init":0},
  "e_sail-2":{"rate":0,"cur":"pearls","price":2500,"init":0},
  "e_figure-0":{"rate":0,"cur":"gold","price":8000,"init":0},
  "e_figure-2":{"rate":0,"cur":"pearls","price":3500,"init":0},
  "e_armor-0":{"rate":0,"cur":"gold","price":6000,"init":0},
  "e_armor-2":{"rate":0,"cur":"pearls","price":3000,"init":0},
  "e_carriage-0":{"rate":0,"cur":"gold","price":7000,"init":0},
  "e_carriage-2":{"rate":0,"cur":"pearls","price":3000,"init":0},
  "u_hull":{"rate":0,"upg":8,"init":0,"max":10},
  "u_damage":{"rate":0,"upg":10,"init":0,"max":10},
  "u_range":{"rate":0,"upg":9,"init":0,"max":10},
  "u_reload":{"rate":0,"upg":12,"init":0,"max":10},
  "u_speed":{"rate":0,"upg":9,"init":0,"max":10},
  "u_repair":{"rate":0,"upg":7,"init":0,"max":10},
  "o_gunner":{"rate":0,"ofc":true,"init":0,"max":5},
  "o_helmsman":{"rate":0,"ofc":true,"init":0,"max":5},
  "o_carpenter":{"rate":0,"ofc":true,"init":0,"max":5},
  "o_lookout":{"rate":0,"ofc":true,"init":0,"max":5},
  "o_quartermaster":{"rate":0,"ofc":true,"init":0,"max":5},
  "o_surgeon":{"rate":0,"ofc":true,"init":0,"max":5},
  "st_npc":{"rate":20,"init":0},
  "st_heavy":{"rate":10,"init":0},
  "st_monster":{"rate":10,"init":0},
  "st_boss":{"rate":1,"init":0},
  "st_chest":{"rate":20,"init":0},
  "st_treasure":{"rate":1,"init":0},
  "st_quest":{"rate":1,"init":0},
  "st_eliteBalls":{"rate":5000,"init":0}
}'::jsonb $$;

create or replace function public.auction_bid(p_hour bigint, p_lot text, p_amount bigint) returns void language plpgsql security definer set search_path = public as $fn$
declare t auction_top; min_next bigint; n text; v_cost bigint; v_gold numeric;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if p_hour <> auction_hour_now() then raise exception 'Bu ihale sona erdi'; end if;
  if p_lot not in ('heavy','rapid','long','explosive','leech','breaker','fire','heal','speed','mine','shield','powder') then raise exception 'Geçersiz lot'; end if;
  select nick into n from profiles where id = auth.uid();
  select * into t from auction_top where hour = p_hour and lot = p_lot for update;
  min_next := case when t is null then 1 else ceil(greatest(t.amount + 100, t.amount * 1.05) / 100.0)::bigint * 100 end;
  if p_amount < min_next then raise exception 'Teklifin en yüksek tekliften düşük, daha yüksek bir tutar dene'; end if;
  v_cost := p_amount - case when t.user_id = auth.uid() then t.amount else 0 end;
  perform economy_get();
  select coalesce((state->>'gold')::numeric, 0) into v_gold from economy where user_id = auth.uid() for update;
  if v_gold < v_cost then raise exception 'Yeterli altın yok (kazandığın altın birkaç saniye içinde hesabına geçer)'; end if;
  update economy set state = state || jsonb_build_object('gold', v_gold - v_cost) where user_id = auth.uid();
  insert into auction_top(hour, lot, user_id, nick, amount, at) values (p_hour, p_lot, auth.uid(), n, p_amount, now())
  on conflict (hour, lot) do update set user_id = excluded.user_id, nick = excluded.nick, amount = excluded.amount, at = excluded.at;
end $fn$;

create or replace function public.auction_claim(p_hour bigint, p_lot text) returns boolean language plpgsql security definer set search_path = public as $fn$
declare ok boolean; v_item text; v_qty numeric;
begin
  if p_hour >= auction_hour_now() then return false; end if;
  update auction_top set claimed = true where hour = p_hour and lot = p_lot and user_id = auth.uid() and not claimed returning true into ok;
  if not coalesce(ok, false) then return false; end if;
  v_item := case when p_lot in ('heavy','rapid','long') then 'c_' || p_lot else 'a_' || p_lot end;
  v_qty := case p_lot when 'heavy' then 20 when 'rapid' then 20 when 'long' then 20 when 'speed' then 20 when 'mine' then 15 when 'shield' then 300 when 'powder' then 300 else 3000 end;
  perform economy_get();
  perform economy_bonus(auth.uid(), jsonb_build_object(v_item, v_qty));
  return true;
end $fn$;
revoke all on function public.auction_bid(bigint,text,bigint), public.auction_claim(bigint,text) from public, anon;
grant execute on function public.auction_bid(bigint,text,bigint), public.auction_claim(bigint,text) to authenticated;
