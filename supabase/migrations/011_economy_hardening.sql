-- Ekonomi sıkılaştırma (010'un üstüne). Supabase > SQL Editor'de bir kez çalıştırılır.
--  * Saatlik kazanç hakları gerçek oyun hızına indirildi, birikim 24 saatten 6 saate düştü.
--  * Günlük ödül ve Açılış Festivali ödülünü sunucu hesaplar ve verir (economy_claim); kupon ödülleri de sunucuda yazılır.
--    Bu ödüller "bonus hakkı" olarak eklenir: saatlik sınıra takılmaz, bir kez kullanılır.
--  * Başarım sayaçları (st_*), tayfa subayları (o_*) ve özel tasarım da sunucuda tutulur.
--  * Oyun içi günlük inci sınırı 100.000'den 5.000'e indi.
--  * Sıralama tabloları sunucudaki değerlerden okunur (rank_players).
--  * Oyun sunucusu (VPS) oyuncunun seviyesini ve donanımını okuyabilir (economy_peek, SERVER_SECRET ile).

create or replace function public.pearl_daily_cap() returns bigint language sql immutable as $$ select 5000::bigint $$;
create or replace function public.economy_bucket_hours() returns numeric language sql immutable as $$ select 6::numeric $$;

create or replace function public.economy_rules() returns jsonb language sql immutable as $$ select '{
  "gold":{"rate":1500000,"init":40},
  "xp":{"rate":1500000,"init":0},
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

-- Bonus hakkı ekler (günlük ödül, festival, kupon): p_add {kalem:adet}
create or replace function public.economy_bonus(p_uid uuid, p_add jsonb) returns void language plpgsql security definer set search_path = public as $$
declare k text; tk jsonb;
begin
  select tokens into tk from economy where user_id = p_uid for update;
  if tk is null then return; end if;
  for k in select jsonb_object_keys(p_add) loop
    continue when not (economy_rules() ? k);
    tk := tk || jsonb_build_object('b_' || k, coalesce((tk->>('b_' || k))::numeric, 0) + greatest(0, (p_add->>k)::numeric));
  end loop;
  update economy set tokens = tk where user_id = p_uid;
end $$;
revoke all on function public.economy_bonus(uuid, jsonb) from public, anon, authenticated;

-- Eşitleme: 010'daki gibi, ek olarak bonus hakkı önce kullanılır, birikim 6 saat, subaylar altınla alınır
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

-- Sunucunun verdiği ödüller: günlük takvim ve Açılış Festivali
create table if not exists public.economy_claims(
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  day date not null,
  n int not null,
  primary key (user_id, kind, day)
);
alter table public.economy_claims enable row level security;
drop policy if exists "claims read own" on public.economy_claims;
create policy "claims read own" on public.economy_claims for select using (auth.uid() = user_id);

-- Festival başlangıç günü (Türkiye tarihi). Açılışta tarih yazılır: ... select '2026-11-01'::date $$
create or replace function public.festival_start() returns date language sql immutable as $$ select null::date $$;

create or replace function public.economy_claim(p_kind text) returns jsonb language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Europe/Istanbul')::date; last economy_claims; n int; lvl int; g bigint; rw jsonb; fs date; p bigint; add jsonb := '{}'::jsonb; k text;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  perform economy_get();
  if exists (select 1 from economy_claims where user_id = auth.uid() and kind = p_kind and day = today) then raise exception 'Bugünün ödülünü zaten aldın'; end if;
  if p_kind = 'daily' then
    select * into last from economy_claims where user_id = auth.uid() and kind = 'daily' order by day desc limit 1;
    n := case when last.day = today - 1 then last.n % 7 + 1 else 1 end;
    select greatest(1, least(8, coalesce((state->>'level')::int, 1))) into lvl from economy where user_id = auth.uid();
    g := round(1500 * power(1.6, lvl - 1));
    rw := (jsonb_build_array(
      jsonb_build_object('gold', g, 'fire', 6000),
      jsonb_build_object('chain', 6000, 'powder', 100, 'shield', 100),
      jsonb_build_object('pearls', 50, 'breaker', 6000),
      jsonb_build_object('gold', g * 2, 'explosive', 6000, 'speed', 20),
      jsonb_build_object('pearls', 100, 'leech', 6000),
      jsonb_build_object('gold', g * 3, 'powder', 200, 'shield', 200, 'mine', 10),
      jsonb_build_object('pearls', 300, 'gold', g * 5, 'explosive', 9000, 'fire', 9000)))->(n - 1);
  elsif p_kind = 'festival' then
    fs := festival_start();
    if fs is null then raise exception 'Festival kapalı'; end if;
    n := today - fs + 1;
    if n < 1 or n > 7 then raise exception 'Festival günü değil'; end if;
    rw := ('[{"pearls":200,"fire":15000},{"chain":30000,"powder":300,"shield":300},{"pearls":300,"speed":50},{"gold":300000,"explosive":15000},'
        || '{"pearls":400,"breaker":15000},{"gold":600000,"leech":15000,"mine":30},{"pearls":500,"heal":20000}]')::jsonb->(n - 1);
    if n = 7 and (select count(*) from economy_claims where user_id = auth.uid() and kind = 'festival' and day >= fs) = 6 then
      rw := rw || jsonb_build_object('pearls', coalesce((rw->>'pearls')::int, 0) + 2500, 'explosive', coalesce((rw->>'explosive')::int, 0) + 30000, 'design', true);
    end if;
  else
    raise exception 'Geçersiz ödül';
  end if;
  insert into economy_claims(user_id, kind, day, n) values (auth.uid(), p_kind, today, n);
  p := coalesce((rw->>'pearls')::bigint, 0);
  if p > 0 then
    insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
    update wallets set pearls = pearls + p, updated_at = now() where user_id = auth.uid();
    insert into pearl_log(user_id, delta, reason) values (auth.uid(), p, p_kind);
  end if;
  for k in select jsonb_object_keys(rw) loop
    continue when k = 'pearls';
    add := add || jsonb_build_object(case when k in ('gold','chain') then k when k = 'design' then 'design' else 'a_' || k end, case when k = 'design' then 1 else (rw->>k)::numeric end);
  end loop;
  perform economy_bonus(auth.uid(), add);
  return jsonb_build_object('day', n, 'reward', rw);
end $$;

-- Bugüne kadarki günlük/festival durumu (oyun takvimi buna göre gösterir)
create or replace function public.economy_claims_get() returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('today', (now() at time zone 'Europe/Istanbul')::date, 'festivalStart', festival_start(),
    'claims', coalesce(jsonb_agg(jsonb_build_object('kind', kind, 'day', day, 'n', n) order by day), '[]'::jsonb))
  from economy_claims where user_id = auth.uid() and day > (now() at time zone 'Europe/Istanbul')::date - 30
$$;

-- Kupon: inci cüzdana, diğer ödüller bonus hakkı olarak ekonomiye
create or replace function public.coupon_redeem(p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare h text := coupon_hash(p_code); c coupons; p bigint; add jsonb := '{}'::jsonb; k text;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  select * into c from coupons where code_hash = h for update;
  if c is null then raise exception 'Geçersiz kupon kodu'; end if;
  if c.until is not null and current_date > c.until then raise exception 'Bu kuponun süresi dolmuş'; end if;
  if c.max_uses is not null and c.uses >= c.max_uses then raise exception 'Bu kuponun kullanım hakkı dolmuş'; end if;
  if exists (select 1 from coupon_redemptions where user_id = auth.uid() and code_hash = h) then raise exception 'Bu kuponu zaten kullandın'; end if;
  insert into coupon_redemptions(user_id, code_hash) values (auth.uid(), h);
  update coupons set uses = uses + 1 where code_hash = h;
  p := coalesce((c.reward->>'pearls')::bigint, 0);
  if p > 0 then
    insert into wallets(user_id) values (auth.uid()) on conflict do nothing;
    update wallets set pearls = pearls + p, updated_at = now() where user_id = auth.uid();
    insert into pearl_log(user_id, delta, reason) values (auth.uid(), p, 'kupon');
  end if;
  perform economy_get();
  if (c.reward->>'gold') is not null then add := add || jsonb_build_object('gold', (c.reward->>'gold')::numeric); end if;
  if (c.reward->>'xp') is not null then add := add || jsonb_build_object('xp', (c.reward->>'xp')::numeric); end if;
  if (c.reward->>'ep') is not null then add := add || jsonb_build_object('ep', (c.reward->>'ep')::numeric); end if;
  if jsonb_typeof(c.reward->'items') = 'object' then
    for k in select jsonb_object_keys(c.reward->'items') loop
      add := add || jsonb_build_object(case when k in ('iron','chain') then k else 'a_' || k end, (c.reward->'items'->>k)::numeric);
    end loop;
  end if;
  perform economy_bonus(auth.uid(), add);
  return c.reward;
end $$;

-- Sıralama: sunucudaki değerlerden, yasaklılar hariç
create or replace function public.rank_players() returns table(nick text, tag text, fleet text, level int, xp bigint, ep bigint, sp bigint, npc bigint, monster bigint, boss bigint, treasure bigint, me boolean)
language sql stable security definer set search_path = public as $$
  select p.nick, g.tag, g.name, coalesce((e.state->>'level')::int, 1), coalesce((e.state->>'xp')::bigint, 0), coalesce((e.state->>'ep')::bigint, 0), coalesce((e.state->>'sp')::bigint, 0),
    coalesce((e.state->>'st_npc')::bigint, 0), coalesce((e.state->>'st_monster')::bigint, 0), coalesce((e.state->>'st_boss')::bigint, 0), coalesce((e.state->>'st_treasure')::bigint, 0), p.id = auth.uid()
  from economy e join profiles p on p.id = e.user_id left join guild_members m on m.user_id = e.user_id left join guilds g on g.id = m.guild_id
  where not p.banned and not exists (select 1 from admins a where a.user_id = e.user_id)
  order by coalesce((e.state->>'level')::int, 1) desc, coalesce((e.state->>'xp')::bigint, 0) desc limit 2000
$$;

-- Oyun sunucusu: oyuncunun seviyesi, geliştirmeleri, topları ve donanımı (PvP can ve hasar denetimi için)
create or replace function public.economy_peek(p_secret text, p_uid uuid) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  return (select state from economy where user_id = p_uid);
end $$;

revoke all on function public.economy_claim(text), public.economy_claims_get(), public.economy_peek(text, uuid), public.rank_players() from public, anon;
grant execute on function public.economy_claim(text), public.economy_claims_get(), public.rank_players() to authenticated;
grant execute on function public.economy_peek(text, uuid) to anon, authenticated;
