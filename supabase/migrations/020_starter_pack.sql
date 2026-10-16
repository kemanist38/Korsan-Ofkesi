-- Yeni kaptanın başlangıç paketi (020). Supabase SQL Editor'de bir kez çalıştırılır (019'dan sonra). VPS gerekmez.
-- Yalnızca yeni kayıt olanlara uygulanır; mevcut hesaplar değişmez.
--  * 50.000 altın, 1.000 inci, 100 döküm + 10 uzun + 6 seri + 4 ağır top
--  * 50.000 demir, 5.000 zincir, 3.000 ateş, 1.500'er patlayıcı/kule kırıcı/can emici/şifa
--  * 100 kara barut, 100 kalkan, 10 mayın, 20 hız iksiri, 10 pusula
create or replace function public.start_pearls() returns bigint language sql immutable as $fn$ select 1000::bigint $fn$;

create or replace function public.economy_rules() returns jsonb language sql immutable as $fn$ select '{
  "gold":{"rate":0,"init":50000},
  "xp":{"rate":0,"init":0},
  "ep":{"rate":0,"init":0},
  "sp":{"rate":0,"init":0},
  "level":{"rate":4,"init":1,"max":8},
  "chain":{"rate":0,"cur":"pearls","price":0.01,"init":5000},
  "iron":{"rate":0,"cur":"gold","price":0.01,"init":50000},
  "elite":{"rate":0,"cur":"pearls","price":2500,"init":0,"max":1},
  "design":{"rate":0,"init":0,"max":1},
  "c_cast":{"rate":0,"cur":"gold","price":40,"init":100},
  "c_long":{"rate":0,"cur":"pearls","price":15,"init":10},
  "c_rapid":{"rate":0,"cur":"pearls","price":30,"init":6},
  "c_heavy":{"rate":0,"cur":"pearls","price":50,"init":4},
  "a_fire":{"rate":0,"cur":"pearls","price":0.013334,"init":3000},
  "a_explosive":{"rate":0,"cur":"pearls","price":0.02,"init":1500},
  "a_breaker":{"rate":0,"cur":"pearls","price":0.016667,"init":1500},
  "a_leech":{"rate":0,"cur":"pearls","price":0.026667,"init":1500},
  "a_heal":{"rate":0,"cur":"pearls","price":0.02,"init":1500},
  "a_mine":{"rate":0,"cur":"pearls","price":5,"init":10},
  "a_powder":{"rate":0,"cur":"gold","price":10,"init":100},
  "a_shield":{"rate":0,"cur":"gold","price":10,"init":100},
  "a_speed":{"rate":0,"cur":"pearls","price":2,"init":20},
  "a_compass":{"rate":0,"cur":"pearls","price":1,"init":10},
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
  "st_npc":{"rate":0,"init":0},
  "st_heavy":{"rate":0,"init":0},
  "st_monster":{"rate":0,"init":0},
  "st_boss":{"rate":0,"init":0},
  "st_chest":{"rate":0,"init":0},
  "st_treasure":{"rate":0,"init":0},
  "st_quest":{"rate":0,"init":0},
  "st_eliteBalls":{"rate":0,"init":0}
}'::jsonb $fn$;

create or replace function public.economy_get() returns jsonb language plpgsql security definer set search_path = public as $fn$
declare e economy; r jsonb := economy_rules(); k text; st jsonb := '{}'::jsonb; b bigint;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
  select * into e from economy where user_id = auth.uid();
  if e.user_id is null then
    for k in select jsonb_object_keys(r) loop st := st || jsonb_build_object(k, (r->k->>'init')::numeric); end loop;
    insert into economy(user_id, state, tokens) values (auth.uid(), st, '{}'::jsonb) on conflict (user_id) do nothing returning * into e;
    if e.user_id is not null then
      update wallets set pearls = pearls + start_pearls(), updated_at = now() where user_id = auth.uid();
      insert into pearl_log(user_id, delta, reason) values (auth.uid(), start_pearls(), 'başlangıç paketi');
    else
      select * into e from economy where user_id = auth.uid();
    end if;
  end if;
  select pearls into b from wallets where user_id = auth.uid();
  return jsonb_build_object('state', e.state, 'pearls', b);
end $fn$;
