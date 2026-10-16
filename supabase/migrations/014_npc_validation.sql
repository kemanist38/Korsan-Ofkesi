-- NPC ve canavar batırmaları oyun sunucusunda doğrulanır (014). Supabase SQL Editor'de bir kez çalıştırılır (011'den sonra).
--  * Oyun sunucusu (VPS) her batırmayı denizin hedefi mi ve oyuncunun hasar hızı yeter mi diye denetler; doğrulanan
--    batırmaların altın, TP ve sayaçlarını bonus hakkı olarak ekler (economy_grant, SERVER_SECRET ile).
--  * Doğrulanmamış serbest kazanç hakkı altın ve TP için saatte 1,5 milyondan 600 bine indi.
--  * Seviye atlama: 2. seviyeden sonra seviye görevindeki ağır gemi batırmalarını oyun sunucusu sayar (lqk); sayı yetmezse seviye verilmez.

create or replace function public.economy_rules() returns jsonb language sql immutable as $$ select '{
  "gold":{"rate":600000,"init":40},
  "xp":{"rate":600000,"init":0},
  "ep":{"rate":50000,"init":0},
  "sp":{"rate":3000,"init":0},
  "level":{"rate":4,"init":1,"max":8},
  "chain":{"rate":50000,"cur":"pearls","price":0.01,"init":2000},
  "iron":{"rate":20000,"cur":"gold","price":0.01,"init":20000},
  "elite":{"rate":0,"cur":"pearls","price":2500,"init":0,"max":1},
  "design":{"rate":0,"init":0,"max":1},
  "c_cast":{"rate":20,"cur":"gold","price":40,"init":70},
  "c_long":{"rate":20,"cur":"pearls","price":15,"init":6},
  "c_rapid":{"rate":20,"cur":"pearls","price":30,"init":4},
  "c_heavy":{"rate":20,"cur":"pearls","price":50,"init":2},
  "a_fire":{"rate":30000,"cur":"pearls","price":0.013334,"init":750},
  "a_explosive":{"rate":30000,"cur":"pearls","price":0.02,"init":500},
  "a_breaker":{"rate":30000,"cur":"pearls","price":0.016667,"init":500},
  "a_leech":{"rate":30000,"cur":"pearls","price":0.026667,"init":500},
  "a_heal":{"rate":30000,"cur":"pearls","price":0.02,"init":500},
  "a_mine":{"rate":100,"cur":"pearls","price":5,"init":3},
  "a_powder":{"rate":3000,"cur":"gold","price":10,"init":30},
  "a_shield":{"rate":3000,"cur":"gold","price":10,"init":30},
  "a_speed":{"rate":200,"cur":"pearls","price":2,"init":10},
  "a_compass":{"rate":50,"cur":"pearls","price":1,"init":5},
  "a_spyShield":{"rate":5,"cur":"pearls","price":150,"init":0},
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
  "st_npc":{"rate":400,"init":0},
  "st_heavy":{"rate":200,"init":0},
  "st_monster":{"rate":150,"init":0},
  "st_boss":{"rate":8,"init":0},
  "st_chest":{"rate":300,"init":0},
  "st_treasure":{"rate":12,"init":0},
  "st_quest":{"rate":6,"init":0},
  "st_eliteBalls":{"rate":250000,"init":0}
}'::jsonb $$;

create or replace function public.economy_sync(p_items jsonb, p_pearl_g bigint, p_pearl_s bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  e economy; r jsonb := economy_rules(); rule jsonb; it jsonb; k text; bh numeric := economy_bucket_hours();
  hrs numeric; tok numeric; bon numeric; ub numeric; old numeric; g numeric; s numeric; nv numeric; over numeric; cost numeric; lvl int; step numeric;
  st jsonb; tk jsonb; pool_gold numeric := 0; pool_pearls numeric := 0; w wallets; spend bigint; earn bigint; flagged text[] := '{}'; rate numeric;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  perform economy_get();
  select * into e from economy where user_id = auth.uid() for update;
  hrs := least(bh, greatest(0, extract(epoch from now() - e.at) / 3600.0));
  st := e.state; tk := e.tokens;
  insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
  select * into w from wallets where user_id = auth.uid() for update;
  if w.earned_day <> current_date then w.earned_day := current_date; w.earned_today := 0; end if;
  spend := least(greatest(coalesce(p_pearl_s,0),0), w.pearls);
  earn := least(greatest(coalesce(p_pearl_g,0),0), greatest(pearl_daily_cap() - w.earned_today, 0));
  if coalesce(p_pearl_g,0) > earn then flagged := flagged || 'pearls'::text; end if;
  update wallets set pearls = w.pearls - spend + earn, earned_day = w.earned_day, earned_today = w.earned_today + earn, updated_at = now() where user_id = auth.uid();
  if spend > 0 then insert into pearl_log(user_id, delta, reason) values (auth.uid(), -spend, 'harcama'); end if;
  if earn > 0 then insert into pearl_log(user_id, delta, reason) values (auth.uid(), earn, 'oyun'); end if;
  pool_pearls := spend;
  -- Altın önce: harcanan altın satın alma havuzuna girer
  for k in select x from jsonb_object_keys(r) x order by x <> 'gold', x loop
    rule := r->k; it := coalesce(p_items->k, '{}'::jsonb); rate := (rule->>'rate')::numeric;
    old := coalesce((st->>k)::numeric, (rule->>'init')::numeric);
    g := greatest(0, coalesce((it->>'g')::numeric, 0)); s := least(old + g, greatest(0, coalesce((it->>'s')::numeric, 0)));
    tok := least(rate * bh, coalesce((tk->>k)::numeric, rate * 0.25) + rate * hrs);
    bon := coalesce((tk->>('b_' || k))::numeric, 0);
    ub := least(bon, g); bon := bon - ub;
    over := greatest(0, g - ub - tok);
    if over > 0 then
      if rule ? 'upg' or rule ? 'ofc' then
        -- Geliştirme (inci) ve subay (altın): her seviyenin fiyatı ayrı
        lvl := old::int; step := 0;
        while step < over loop
          cost := case when rule ? 'upg' then round((rule->>'upg')::numeric * 26 * (1 + (lvl + step) * 0.55)) else round(150 * power(1.75, lvl + step)) end;
          if rule ? 'upg' then exit when pool_pearls < cost; pool_pearls := pool_pearls - cost;
          else exit when pool_gold < cost; pool_gold := pool_gold - cost; end if;
          step := step + 1;
        end loop;
        if step < over then flagged := flagged || k::text; end if;
        over := step;
      elsif rule ? 'cur' then
        cost := over * (rule->>'price')::numeric;
        if rule->>'cur' = 'gold' then
          if cost <= pool_gold then pool_gold := pool_gold - cost; else over := floor(pool_gold / (rule->>'price')::numeric); pool_gold := pool_gold - over * (rule->>'price')::numeric; flagged := flagged || k::text; end if;
        else
          if cost <= pool_pearls then pool_pearls := pool_pearls - cost; else over := floor(pool_pearls / (rule->>'price')::numeric); pool_pearls := pool_pearls - over * (rule->>'price')::numeric; flagged := flagged || k::text; end if;
        end if;
      else
        over := 0; flagged := flagged || k::text;
      end if;
      g := ub + tok + over; tok := 0;
    else
      tok := tok - (g - ub);
    end if;
    tk := tk || jsonb_build_object(k, tok, 'b_' || k, bon);
    -- Seviye: 2. seviyeden sonra her seviye için oyun sunucusunun saydığı seviye görevi batırmaları (lqk) gerekir
    if k = 'level' and g > 0 then
      step := 0; lvl := old::int; bon := coalesce((st->>'lqk')::numeric, 0);
      while step < g loop
        if lvl + step >= 2 and bon < 10 + (lvl + step - 2) * 2 then exit; end if;
        if lvl + step >= 2 then bon := 0; end if;
        step := step + 1;
      end loop;
      if step < g then flagged := flagged || 'level'::text; end if;
      g := step; st := st || jsonb_build_object('lqk', bon);
    end if;
    nv := floor(greatest(0, old + g - s));
    if k = 'gold' then pool_gold := s; end if;
    if rule ? 'max' then nv := least(nv, (rule->>'max')::numeric); end if;
    if k = 'level' then nv := greatest(1, nv); end if;
    st := st || jsonb_build_object(k, nv);
  end loop;
  update economy set state = st, tokens = tk, at = now() where user_id = auth.uid();
  if array_length(flagged, 1) > 0 then insert into economy_flags(user_id, items) values (auth.uid(), flagged); end if;
  return jsonb_build_object('state', st, 'pearls', w.pearls - spend + earn);
end $$;

create or replace function public.economy_grant(p_secret text, p_uid uuid, p_add jsonb) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_lq numeric := coalesce((p_add->>'lqk')::numeric, 0);
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  if not exists (select 1 from economy where user_id = p_uid) then return null; end if;
  perform economy_bonus(p_uid, p_add - 'lqk');
  if v_lq > 0 then update economy set state = state || jsonb_build_object('lqk', coalesce((state->>'lqk')::numeric, 0) + v_lq) where user_id = p_uid; end if;
  return (select state from economy where user_id = p_uid);
end $fn$;
revoke all on function public.economy_grant(text, uuid, jsonb) from public;
grant execute on function public.economy_grant(text, uuid, jsonb) to anon, authenticated;
