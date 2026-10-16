-- Sunucu tarafı ekonomi: altın, TP, EP, SP, seviye, gülleler, malzemeler, toplar, geliştirmeler, donanım ve elit gemi.
-- Gerçek değerler bu tabloda durur; oyun her eşitlemede (30 sn) her kalem için mevcut değeri (v), o aradaki toplam kazancı (g)
-- ve harcamayı (s) bildirir. Sunucu:
--   * harcamayı her zaman kabul eder (bakiye eksiye inmez),
--   * kazancı kalemin saatlik hakkıyla (24 saate kadar birikir) sınırlar,
--   * hakkı aşan artışı satın alma sayar: bedeli aynı eşitlemede harcanan altından/inciden düşer, bedel yoksa reddeder.
-- İnci cüzdanı (wallets) burada da kullanılır: günlük oyun içi kazanç sınırı aynen geçerlidir.
create table if not exists public.economy(
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null,
  tokens jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
alter table public.economy enable row level security;
drop policy if exists "economy read own" on public.economy;
create policy "economy read own" on public.economy for select using (auth.uid() = user_id);

-- Kalem kuralları: rate = saatlik ücretsiz kazanç hakkı, cur/price = satın alma bedeli (adet başına), init = yeni hesap değeri
create or replace function public.economy_rules() returns jsonb language sql immutable as $$ select '{
  "gold":{"rate":2000000,"init":40},
  "xp":{"rate":4000000,"init":0},
  "ep":{"rate":200000,"init":0},
  "sp":{"rate":100000,"init":0},
  "level":{"rate":4,"init":1,"max":8},
  "chain":{"rate":50000,"cur":"pearls","price":0.01,"init":2000},
  "iron":{"rate":20000,"cur":"gold","price":0.01,"init":20000},
  "elite":{"rate":0,"cur":"pearls","price":2500,"init":0,"max":1},
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
  "u_repair":{"rate":0,"upg":7,"init":0,"max":10}
}'::jsonb $$;

-- Mevcut değerler ve inci (giriş anında oyun bunları yükler)
create or replace function public.economy_get() returns jsonb language plpgsql security definer set search_path = public as $$
declare e economy; r jsonb := economy_rules(); k text; st jsonb := '{}'::jsonb; b bigint;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  select * into e from economy where user_id = auth.uid();
  if not found then
    for k in select jsonb_object_keys(r) loop st := st || jsonb_build_object(k, (r->k->>'init')::numeric); end loop;
    insert into economy(user_id, state, tokens) values (auth.uid(), st, '{}'::jsonb) returning * into e;
  end if;
  insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
  select pearls into b from wallets where user_id = auth.uid();
  return jsonb_build_object('state', e.state, 'pearls', b);
end $$;

-- Eşitleme. p_items: {kalem:{v,g,s}}; p_pearl_g / p_pearl_s: o aradaki inci kazancı/harcaması
create or replace function public.economy_sync(p_items jsonb, p_pearl_g bigint, p_pearl_s bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  e economy; r jsonb := economy_rules(); rule jsonb; it jsonb; k text;
  hrs numeric; tok numeric; old numeric; g numeric; s numeric; nv numeric; over numeric; cost numeric; lvl int;
  st jsonb; tk jsonb; pool_gold numeric := 0; pool_pearls numeric := 0; w wallets; spend bigint; earn bigint; flagged text[] := '{}';
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  perform economy_get();
  select * into e from economy where user_id = auth.uid() for update;
  hrs := least(24, greatest(0, extract(epoch from now() - e.at) / 3600.0));
  st := e.state; tk := e.tokens;
  -- İnci: cüzdan (günlük kazanç sınırı)
  insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
  select * into w from wallets where user_id = auth.uid() for update;
  if w.earned_day <> current_date then w.earned_day := current_date; w.earned_today := 0; end if;
  spend := least(greatest(coalesce(p_pearl_s,0),0), w.pearls);
  earn := least(greatest(coalesce(p_pearl_g,0),0), greatest(pearl_daily_cap() - w.earned_today, 0));
  update wallets set pearls = w.pearls - spend + earn, earned_day = w.earned_day, earned_today = w.earned_today + earn, updated_at = now() where user_id = auth.uid();
  if spend > 0 then insert into pearl_log(user_id, delta, reason) values (auth.uid(), -spend, 'harcama'); end if;
  if earn > 0 then insert into pearl_log(user_id, delta, reason) values (auth.uid(), earn, 'oyun'); end if;
  pool_pearls := spend;
  -- Altın önce: harcanan altın satın alma havuzuna girer
  it := coalesce(p_items->'gold', '{}'::jsonb);
  old := coalesce((st->>'gold')::numeric, 0); g := greatest(0, coalesce((it->>'g')::numeric, 0)); s := least(old + g, greatest(0, coalesce((it->>'s')::numeric, 0)));
  tok := least(2000000 * 24, coalesce((tk->>'gold')::numeric, 2000000) + 2000000 * hrs);
  if g > tok then flagged := flagged || 'gold'::text; g := tok; end if;
  tk := tk || jsonb_build_object('gold', tok - g); pool_gold := s;
  st := st || jsonb_build_object('gold', floor(greatest(0, old + g - s)));
  -- Diğer kalemler
  for k in select jsonb_object_keys(r) loop
    continue when k = 'gold';
    rule := r->k; it := coalesce(p_items->k, '{}'::jsonb);
    old := coalesce((st->>k)::numeric, (rule->>'init')::numeric);
    g := greatest(0, coalesce((it->>'g')::numeric, 0)); s := least(old + g, greatest(0, coalesce((it->>'s')::numeric, 0)));
    tok := least((rule->>'rate')::numeric * 24, coalesce((tk->>k)::numeric, (rule->>'rate')::numeric) + (rule->>'rate')::numeric * hrs);
    over := greatest(0, g - tok);
    if over > 0 then
      if rule ? 'upg' then
        -- Geliştirme: her seviye ayrı fiyat (taban × 26 × (1 + seviye × 0,55)), inciyle
        cost := 0; lvl := old::int;
        for i in 1 .. over::int loop cost := cost + round((rule->>'upg')::numeric * 26 * (1 + (lvl + i - 1) * 0.55)); end loop;
        if cost <= pool_pearls then pool_pearls := pool_pearls - cost; else
          over := 0; cost := 0; lvl := old::int;
          while over < g - tok and pool_pearls >= round((rule->>'upg')::numeric * 26 * (1 + (lvl + over) * 0.55)) loop
            pool_pearls := pool_pearls - round((rule->>'upg')::numeric * 26 * (1 + (lvl + over) * 0.55)); over := over + 1; end loop;
          flagged := flagged || k::text;
        end if;
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
      g := least(g, tok + over);
      tk := tk || jsonb_build_object(k, 0);
    else
      tk := tk || jsonb_build_object(k, tok - g);
    end if;
    nv := floor(greatest(0, old + g - s));
    if rule ? 'max' then nv := least(nv, (rule->>'max')::numeric); end if;
    if k = 'level' then nv := greatest(1, nv); end if;
    st := st || jsonb_build_object(k, nv);
  end loop;
  update economy set state = st, tokens = tk, at = now() where user_id = auth.uid();
  if array_length(flagged, 1) > 0 then insert into economy_flags(user_id, items) values (auth.uid(), flagged); end if;
  return jsonb_build_object('state', st, 'pearls', w.pearls - spend + earn);
end $$;

-- Sınırı aşan bildirimler (yönetici incelemesi için)
create table if not exists public.economy_flags(
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  items text[] not null,
  at timestamptz not null default now()
);
alter table public.economy_flags enable row level security;
drop policy if exists "economy flags admin" on public.economy_flags;
create policy "economy flags admin" on public.economy_flags for select using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

revoke all on function public.economy_get(), public.economy_sync(jsonb,bigint,bigint) from public, anon;
grant execute on function public.economy_get(), public.economy_sync(jsonb,bigint,bigint) to authenticated;
