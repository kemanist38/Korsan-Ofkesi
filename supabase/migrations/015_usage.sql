-- Gülle, barut ve iksir kullanımı oyun sunucusunda sayılır (015). Supabase SQL Editor'de bir kez çalıştırılır (014'ten sonra).
--  * Oyun her salvoyu ve iksir/mayın/pusula kullanımını oyun sunucusuna bildirir; sunucu kullanımı sayar (cn_) ve hasarı buna göre sınırlar.
--  * Eşitlemede oyuncunun bildirdiği harcama sayılan kullanımdan azsa fark envanterden düşülür (hile: gülle harcamamak).

create or replace function public.economy_sync(p_items jsonb, p_pearl_g bigint, p_pearl_s bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  e economy; r jsonb := economy_rules(); rule jsonb; it jsonb; k text; bh numeric := economy_bucket_hours();
  hrs numeric; tok numeric; bon numeric; ub numeric; old numeric; g numeric; s numeric; nv numeric; over numeric; cost numeric; lvl int; step numeric;
  st jsonb; tk jsonb; cn numeric; cu numeric; cd numeric; pay numeric; short numeric; tol numeric; pool_gold numeric := 0; pool_pearls numeric := 0; w wallets; spend bigint; earn bigint; flagged text[] := '{}'; rate numeric;
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
    -- Kullanım denetimi: oyun sunucusunun saydığı kullanım (cn_) oyuncunun bildirdiği harcamayı (cu_) aşarsa fark düşülür.
    -- Önceden düşülen fark (cd_) borç sayılır; oyuncu aynı harcamayı sonra bildirirse ikinci kez düşülmez.
    if st ? ('cn_' || k) then
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
  update economy set state = st, tokens = tk, at = now() where user_id = auth.uid();
  if array_length(flagged, 1) > 0 then insert into economy_flags(user_id, items) values (auth.uid(), flagged); end if;
  return jsonb_build_object('state', st, 'pearls', w.pearls - spend + earn);
end $$;

-- Oyun sunucusu: doğrulanan kazanç (bonus hakkı), seviye görevi sayacı (lqk) ve sayılan kullanım (cn_) yazılır
create or replace function public.economy_grant(p_secret text, p_uid uuid, p_add jsonb) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare k text; v_bonus jsonb := '{}'::jsonb; v_st jsonb;
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  select state into v_st from economy where user_id = p_uid for update;
  if v_st is null then return null; end if;
  for k in select jsonb_object_keys(p_add) loop
    if k = 'lqk' or k like 'cn\_%' then
      v_st := v_st || jsonb_build_object(k, coalesce((v_st->>k)::numeric, 0) + greatest(0, (p_add->>k)::numeric));
    else
      v_bonus := v_bonus || jsonb_build_object(k, p_add->k);
    end if;
  end loop;
  update economy set state = v_st where user_id = p_uid;
  perform economy_bonus(p_uid, v_bonus);
  return (select state from economy where user_id = p_uid);
end $fn$;
revoke all on function public.economy_grant(text, uuid, jsonb) from public;
grant execute on function public.economy_grant(text, uuid, jsonb) to anon, authenticated;
