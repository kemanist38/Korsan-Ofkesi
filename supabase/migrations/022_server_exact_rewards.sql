-- Ödülü sunucu kesin verir (022). Önce VPS güncellenir, sonra bu SQL Supabase SQL Editor'de bir kez çalıştırılır.
--  * Oyun sunucusunun verdiği altın, TP, EP, savaş puanı, cephane ve sayaçlar olduğu gibi hesaba yazılır.
--  * Oyuncunun kendi hesapladığı kazanç sayılmaz; fazlası istenirse yalnızca satın alma olarak (inci/altın ödenerek) geçer.
--  * Eski sistemden kalan kullanılmamış paylar (b_) silinir; bir kerelik.
update public.economy set tokens = (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from jsonb_each(tokens) where key not like 'b\_%');

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
    -- Sunucunun verdiği (bonus) olduğu gibi yazılır; oyuncunun bildirdiği kazanç ancak satın almaysa (bedeli ödenirse) sayılır
    if k <> 'level' then g := greatest(g, bon); end if;
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
