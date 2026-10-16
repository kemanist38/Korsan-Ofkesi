-- Kaptan ve Muço (usta-çırak) sunucuda. Supabase SQL Editor'de bir kez çalıştırılır (011'den sonra).
-- Muço (en çok Seviye 5) bir ustaya (en az Seviye 5, en az 2 seviye fark, en çok 3 muço) istek gönderir; usta kabul eder.
-- Seviyeler sunucudaki ekonomi tablosundan okunur. Her seviye için muçoya ve ustaya bir sandık düşer; sandığı sunucu verir:
-- inci cüzdana, altın bonus hakkı olarak ekonomiye. Muço Seviye 8'de mezun olur.
create table if not exists public.mentor_links(
  apprentice uuid primary key references public.profiles(id) on delete cascade,
  mentor uuid not null references public.profiles(id) on delete cascade,
  start_level int not null,
  graduated boolean not null default false,
  end_level int,
  created_at timestamptz not null default now()
);
alter table public.mentor_links add column if not exists end_level int;
create index if not exists mentor_links_mentor on public.mentor_links(mentor);
create table if not exists public.mentor_requests(
  apprentice uuid not null references public.profiles(id) on delete cascade,
  mentor uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (apprentice, mentor)
);
create table if not exists public.mentor_claims(
  user_id uuid not null references public.profiles(id) on delete cascade,
  key text not null,
  at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.mentor_links enable row level security;
alter table public.mentor_requests enable row level security;
alter table public.mentor_claims enable row level security;

create or replace function public.econ_level(p_uid uuid) returns int language sql stable security definer set search_path = public as
'select greatest(1, least(8, coalesce((select (state->>''level'')::int from economy where user_id = p_uid), 1)))';

-- Seviye ödülleri (1-8): muço ve usta
create or replace function public.mentor_milestone(p_level int, p_role text) returns jsonb language sql immutable as
'select case when p_role = ''app'' then jsonb_build_object(''gold'', (array[50000,75000,100000,150000,250000,300000,400000,600000])[p_level], ''pearls'', (array[20,40,60,100,200,250,350,500])[p_level])
  else jsonb_build_object(''gold'', (array[30000,50000,70000,100000,150000,200000,300000,400000])[p_level], ''pearls'', (array[30,60,90,150,300,400,550,800])[p_level]) end';

-- Kazanılmış ama alınmamış sandıklar
create or replace function public.mentor_pending(p_uid uuid) returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_out jsonb := '[]'::jsonb; v_link mentor_links; v_lvl int; s int; v_key text; r record; v_nick text;
begin
  select * into v_link from mentor_links where apprentice = p_uid;
  if found then
    v_lvl := econ_level(p_uid);
    for s in v_link.start_level .. least(8, coalesce(v_link.end_level, v_lvl)) loop
      v_key := 'app-' || s;
      if not exists (select 1 from mentor_claims where user_id = p_uid and key = v_key) then
        v_out := v_out || jsonb_build_array(mentor_milestone(s, 'app') || jsonb_build_object('key', v_key, 'label', case when s >= 8 then 'Mezuniyet sandığı' else 'Muço sandığı · Seviye ' || s end));
      end if;
    end loop;
  end if;
  for r in select l.apprentice, l.start_level, l.end_level, p.nick from mentor_links l join profiles p on p.id = l.apprentice where l.mentor = p_uid loop
    v_lvl := econ_level(r.apprentice);
    for s in r.start_level .. least(8, coalesce(r.end_level, v_lvl)) loop
      v_key := 'men-' || r.nick || '-' || s;
      if not exists (select 1 from mentor_claims where user_id = p_uid and key = v_key) then
        v_out := v_out || jsonb_build_array(mentor_milestone(s, 'men') || jsonb_build_object('key', v_key, 'label', 'Usta sandığı · ' || r.nick || ' · ' || case when s >= 8 then 'Mezuniyet' else 'Seviye ' || s end));
      end if;
    end loop;
  end loop;
  return v_out;
end $fn$;

-- Pencere için bütün durum
create or replace function public.mentor_get() returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_me uuid := auth.uid(); v_mentor jsonb; v_link mentor_links;
begin
  if v_me is null then raise exception 'Giriş gerekli'; end if;
  -- Muço Seviye 8'e ulaşınca mezun olur (usta listesinden düşer, sandıkları kalır)
  update mentor_links set graduated = true, end_level = 8 where not graduated and econ_level(apprentice) >= 8 and (apprentice = v_me or mentor = v_me);
  select * into v_link from mentor_links where apprentice = v_me;
  if found and not v_link.graduated then
    select jsonb_build_object('nick', p.nick, 'level', econ_level(p.id)) into v_mentor from profiles p where p.id = v_link.mentor;
  end if;
  return jsonb_build_object(
    'mentor', v_mentor,
    'graduated', coalesce(v_link.graduated, false),
    'hadMentor', v_link.apprentice is not null,
    'apprentices', coalesce((select jsonb_agg(jsonb_build_object('nick', p.nick, 'level', econ_level(p.id))) from mentor_links l join profiles p on p.id = l.apprentice where l.mentor = v_me and not l.graduated), '[]'::jsonb),
    'graduates', (select count(*) from mentor_links where mentor = v_me and graduated and end_level >= 8),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('nick', p.nick, 'level', econ_level(p.id))) from mentor_requests q join profiles p on p.id = q.apprentice where q.mentor = v_me), '[]'::jsonb),
    'sent', coalesce((select jsonb_agg(p.nick) from mentor_requests q join profiles p on p.id = q.mentor where q.apprentice = v_me), '[]'::jsonb),
    'pending', mentor_pending(v_me),
    'claimed', (select count(*) from mentor_claims where user_id = v_me));
end $fn$;

-- Muço: ustaya istek gönderir
create or replace function public.mentor_request(p_nick text) returns void language plpgsql security definer set search_path = public as $fn$
declare v_me uuid := auth.uid(); v_to uuid; v_lvl int; v_tl int;
begin
  if v_me is null then raise exception 'Giriş gerekli'; end if;
  select id into v_to from profiles where lower(nick) = lower(trim(p_nick)) and not banned;
  if v_to is null then raise exception 'Bu adda kaptan yok'; end if;
  if v_to = v_me then raise exception 'Kendine istek gönderemezsin'; end if;
  if exists (select 1 from mentor_links where apprentice = v_me) then raise exception 'Daha önce bir ustan oldu; yeniden muço olamazsın'; end if;
  v_lvl := econ_level(v_me); v_tl := econ_level(v_to);
  if v_lvl > 5 then raise exception 'Muço olmak için en çok Seviye 5 olmalısın'; end if;
  if v_tl < 5 then raise exception 'Usta en az Seviye 5 olmalı'; end if;
  if v_tl - v_lvl < 2 then raise exception 'Aranızda en az 2 seviye fark olmalı'; end if;
  if (select count(*) from mentor_requests where apprentice = v_me) >= 5 then raise exception 'En çok 5 bekleyen isteğin olabilir'; end if;
  insert into mentor_requests(apprentice, mentor) values (v_me, v_to) on conflict do nothing;
end $fn$;

-- Usta: isteği kabul eder ya da reddeder
create or replace function public.mentor_answer(p_nick text, p_accept boolean) returns void language plpgsql security definer set search_path = public as $fn$
declare v_me uuid := auth.uid(); v_app uuid; v_lvl int; v_al int;
begin
  if v_me is null then raise exception 'Giriş gerekli'; end if;
  select q.apprentice into v_app from mentor_requests q join profiles p on p.id = q.apprentice where q.mentor = v_me and lower(p.nick) = lower(p_nick);
  if v_app is null then raise exception 'İstek bulunamadı'; end if;
  if not p_accept then delete from mentor_requests where apprentice = v_app and mentor = v_me; return; end if;
  v_lvl := econ_level(v_me); v_al := econ_level(v_app);
  if v_lvl < 5 then raise exception 'Usta olmak için en az Seviye 5 olmalısın'; end if;
  if exists (select 1 from mentor_links where apprentice = v_me and not graduated) then raise exception 'Ustan varken muço kabul edemezsin'; end if;
  if (select count(*) from mentor_links where mentor = v_me and not graduated) >= 3 then raise exception 'En fazla 3 muçon olabilir'; end if;
  if v_al > 5 then raise exception 'Bu kaptan artık muço olamaz'; end if;
  if v_lvl - v_al < 2 then raise exception 'Aranızda en az 2 seviye fark olmalı'; end if;
  if exists (select 1 from mentor_links where apprentice = v_app) then delete from mentor_requests where apprentice = v_app; raise exception 'Bu kaptanın zaten ustası var'; end if;
  insert into mentor_links(apprentice, mentor, start_level) values (v_app, v_me, v_al);
  delete from mentor_requests where apprentice = v_app;
end $fn$;

-- Usta muçosunu çıkarır (muço bir daha muço olamaz, kazandığı sandıklar alınmamışsa düşer)
create or replace function public.mentor_remove(p_nick text) returns void language plpgsql security definer set search_path = public as $fn$
declare v_me uuid := auth.uid(); v_app uuid;
begin
  if v_me is null then raise exception 'Giriş gerekli'; end if;
  select l.apprentice into v_app from mentor_links l join profiles p on p.id = l.apprentice where l.mentor = v_me and lower(p.nick) = lower(p_nick) and not l.graduated;
  if v_app is null then raise exception 'Muço bulunamadı'; end if;
  update mentor_links set graduated = true, end_level = econ_level(v_app) where apprentice = v_app;
end $fn$;

-- Sandık: sunucu verir
create or replace function public.mentor_claim(p_key text) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_me uuid := auth.uid(); v_r jsonb; v_p bigint;
begin
  if v_me is null then raise exception 'Giriş gerekli'; end if;
  select x into v_r from jsonb_array_elements(mentor_pending(v_me)) x where x->>'key' = p_key;
  if v_r is null then raise exception 'Bu sandık alınamaz'; end if;
  insert into mentor_claims(user_id, key) values (v_me, p_key);
  v_p := (v_r->>'pearls')::bigint;
  if v_p > 0 then
    insert into wallets(user_id) values (v_me) on conflict do nothing;
    update wallets set pearls = pearls + v_p, updated_at = now() where user_id = v_me;
    insert into pearl_log(user_id, delta, reason) values (v_me, v_p, 'muço sandığı');
  end if;
  perform economy_get();
  perform economy_bonus(v_me, jsonb_build_object('gold', (v_r->>'gold')::numeric));
  return v_r;
end $fn$;

revoke all on function public.mentor_get(), public.mentor_request(text), public.mentor_answer(text, boolean), public.mentor_remove(text), public.mentor_claim(text), public.mentor_pending(uuid), public.econ_level(uuid) from public, anon;
grant execute on function public.mentor_get(), public.mentor_request(text), public.mentor_answer(text, boolean), public.mentor_remove(text), public.mentor_claim(text) to authenticated;
