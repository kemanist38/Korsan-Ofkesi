-- Oyuncunun kendi bildirdiği hiçbir kazanç kabul edilmez (019). Supabase SQL Editor'de bir kez çalıştırılır (018'den sonra), sonra VPS.
--  * Bütün serbest saatlik haklar sıfır (seviye hariç): altın, TP, elit puan, savaş puanı, cephane, sayaçlar yalnızca oyun sunucusundan gelir.
--  * Oyuncunun bildirdiği inci kazancı yok sayılır; inci yalnızca sunucudan, satın almadan, günlük ödülden, kupondan gelir.
--  * Seviye atlamak için TP de gerekir (seviye görevine ek olarak).
--  * Başarım incileri sunucuda: oyun sunucusunun saydığı sayaçlar hedefe ulaşınca bir kez cüzdana eklenir.
-- Mevcut oyuncular için eski başarımlar: şimdiden açılmış olanlar bir kez daha verilmesin diye işaretlenir.
update public.economy set state = state
  || case when coalesce((state->>'st_npc')::numeric,0) >= 100 then '{"ah_npc-100":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_npc')::numeric,0) >= 1000 then '{"ah_npc-1000":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_npc')::numeric,0) >= 10000 then '{"ah_npc-10000":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_heavy')::numeric,0) >= 200 then '{"ah_heavy-200":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_boss')::numeric,0) >= 1 then '{"ah_boss-1":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_boss')::numeric,0) >= 16 then '{"ah_boss-16":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_chest')::numeric,0) >= 100 then '{"ah_chest-100":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_treasure')::numeric,0) >= 1 then '{"ah_treasure-1":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_treasure')::numeric,0) >= 25 then '{"ah_treasure-25":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_quest')::numeric,0) >= 10 then '{"ah_quest-10":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_quest')::numeric,0) >= 100 then '{"ah_quest-100":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'st_eliteBalls')::numeric,0) >= 10000 then '{"ah_elite-10000":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'level')::numeric,1) >= 5 then '{"ah_level-5":1}'::jsonb else '{}'::jsonb end
  || case when coalesce((state->>'level')::numeric,1) >= 8 then '{"ah_level-8":1}'::jsonb else '{}'::jsonb end
  || case when exists (select 1 from public.economy_claims c where c.user_id = economy.user_id and c.kind = 'daily' and c.n = 7) then '{"ah_daily-7":1}'::jsonb else '{}'::jsonb end;

create or replace function public.economy_rules() returns jsonb language sql immutable as $fn$ select '{
  "gold":{"rate":0,"init":40},
  "xp":{"rate":0,"init":0},
  "ep":{"rate":0,"init":0},
  "sp":{"rate":0,"init":0},
  "level":{"rate":4,"init":1,"max":8},
  "chain":{"rate":0,"cur":"pearls","price":0.01,"init":2000},
  "iron":{"rate":0,"cur":"gold","price":0.01,"init":20000},
  "elite":{"rate":0,"cur":"pearls","price":2500,"init":0,"max":1},
  "design":{"rate":0,"init":0,"max":1},
  "c_cast":{"rate":0,"cur":"gold","price":40,"init":70},
  "c_long":{"rate":0,"cur":"pearls","price":15,"init":6},
  "c_rapid":{"rate":0,"cur":"pearls","price":30,"init":4},
  "c_heavy":{"rate":0,"cur":"pearls","price":50,"init":2},
  "a_fire":{"rate":0,"cur":"pearls","price":0.013334,"init":750},
  "a_explosive":{"rate":0,"cur":"pearls","price":0.02,"init":500},
  "a_breaker":{"rate":0,"cur":"pearls","price":0.016667,"init":500},
  "a_leech":{"rate":0,"cur":"pearls","price":0.026667,"init":500},
  "a_heal":{"rate":0,"cur":"pearls","price":0.02,"init":500},
  "a_mine":{"rate":0,"cur":"pearls","price":5,"init":3},
  "a_powder":{"rate":0,"cur":"gold","price":10,"init":30},
  "a_shield":{"rate":0,"cur":"gold","price":10,"init":30},
  "a_speed":{"rate":0,"cur":"pearls","price":2,"init":10},
  "a_compass":{"rate":0,"cur":"pearls","price":1,"init":5},
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

create or replace function public.economy_sync(p_items jsonb, p_pearl_g bigint, p_pearl_s bigint) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  e economy; r jsonb := economy_rules(); rule jsonb; it jsonb; k text; bh numeric := economy_bucket_hours();
  hrs numeric; tok numeric; bon numeric; ub numeric; old numeric; g numeric; s numeric; nv numeric; over numeric; cost numeric; lvl int; step numeric;
  st jsonb; tk jsonb; cn numeric; cu numeric; cd numeric; pay numeric; short numeric; tol numeric; pool_gold numeric := 0; pool_pearls numeric := 0; w wallets; spend bigint; earn bigint; flagged text[] := '{}'; rate numeric; gift bigint := 0; xpav numeric; need numeric; ach jsonb; a jsonb;
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
  earn := 0;
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
      need := 0; xpav := coalesce((st->>'xp')::numeric, 0) + coalesce((tk->>'b_xp')::numeric, 0);
      while step < g loop
        if lvl + step >= 2 and bon < 10 + (lvl + step - 2) * 2 then exit; end if;
        need := need + (array[0,20000,200000,500000,1500000,3200000,5800000,11400000])[lvl + step + 1];
        if xpav < need then exit; end if;
        if lvl + step >= 2 then bon := 0; end if;
        step := step + 1;
      end loop;
      if step < g then flagged := flagged || 'level'::text; end if;
      g := step; st := st || jsonb_build_object('lqk', bon);
      -- Seviye hediyesi (50 inci × yeni seviye) sunucudan cüzdana
      for lvl in old::int + 1 .. old::int + g::int loop gift := gift + 50 * lvl; end loop;
    end if;
    -- Kullanım denetimi: oyun sunucusunun saydığı kullanım (cn_) oyuncunun bildirdiği harcamayı (cu_) aşarsa fark düşülür.
    -- Önceden düşülen fark (cd_) borç sayılır; oyuncu aynı harcamayı sonra bildirirse ikinci kez düşülmez.
    if k in ('iron','chain','a_fire','a_explosive','a_breaker','a_leech','a_heal','a_powder','a_shield','a_speed','a_mine','a_compass') then
      cn := coalesce((st->>('cn_' || k))::numeric, 0); cu := coalesce((st->>('cu_' || k))::numeric, 0); cd := coalesce((st->>('cd_' || k))::numeric, 0);
      pay := least(cd, greatest(0, coalesce((it->>'s')::numeric, 0))); cd := cd - pay; s := greatest(0, s - pay); cu := cu + s;
      tol := case when k in ('iron','chain') or k like 'a\_%' and k not in ('a_powder','a_shield','a_speed','a_mine','a_compass','a_spyShield') then 4000 when k in ('a_powder','a_shield') then 60 else 2 end;
      short := cn - cu;
      if short > tol then
        s := s + short; cu := cu + short; cd := cd + short;
        if short > tol * 3 then flagged := flagged || ('kullanım ' || k)::text; end if;
      end if;
      s := least(s, old + g);
      st := st || jsonb_build_object('cu_' || k, cu, 'cd_' || k, cd);
    end if;
    nv := floor(greatest(0, old + g - s));
    if k = 'gold' then pool_gold := s; end if;
    if rule ? 'max' then nv := least(nv, (rule->>'max')::numeric); end if;
    if k = 'level' then nv := greatest(1, nv); end if;
    st := st || jsonb_build_object(k, nv);
  end loop;
  -- Başarım incileri: sayaçlar oyun sunucusunun saydığı değerlerden, bir kez
  ach := '[["npc-100","st_npc",100,10],["npc-1000","st_npc",1000,50],["npc-10000","st_npc",10000,200],["heavy-200","st_heavy",200,20],["boss-1","st_boss",1,20],["boss-16","st_boss",16,300],["chest-100","st_chest",100,15],["treasure-1","st_treasure",1,10],["treasure-25","st_treasure",25,100],["quest-10","st_quest",10,15],["quest-100","st_quest",100,150],["elite-10000","st_eliteBalls",10000,50],["level-5","level",5,30],["level-8","level",8,100]]'::jsonb;
  for a in select x from jsonb_array_elements(ach) x loop
    if not (st ? ('ah_' || (a->>0))) and coalesce((st->>(a->>1))::numeric, 0) >= (a->>2)::numeric then
      st := st || jsonb_build_object('ah_' || (a->>0), 1); gift := gift + (a->>3)::bigint;
    end if;
  end loop;
  if not (st ? 'ah_daily-7') and exists (select 1 from economy_claims where user_id = auth.uid() and kind = 'daily' and n = 7) then
    st := st || jsonb_build_object('ah_daily-7', 1); gift := gift + 30;
  end if;
  if gift > 0 then
    update wallets set pearls = pearls + gift, updated_at = now() where user_id = auth.uid();
    insert into pearl_log(user_id, delta, reason) values (auth.uid(), gift, 'seviye hediyesi');
  end if;
  update economy set state = st, tokens = tk, at = now() where user_id = auth.uid();
  if array_length(flagged, 1) > 0 then insert into economy_flags(user_id, items) values (auth.uid(), flagged); end if;
  return jsonb_build_object('state', st, 'pearls', w.pearls - spend + earn + gift);
end $fn$;

create or replace function public.wallet_sync(p_spent bigint, p_earned bigint) returns bigint language plpgsql security definer set search_path = public as $fn$
declare w wallets; spend bigint;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
  select * into w from wallets where user_id = auth.uid() for update;
  spend := least(greatest(coalesce(p_spent,0),0), w.pearls);
  update wallets set pearls = w.pearls - spend, updated_at = now() where user_id = auth.uid();
  if spend > 0 then insert into pearl_log(user_id, delta, reason) values (auth.uid(), -spend, 'harcama'); end if;
  return w.pearls - spend;
end $fn$;
