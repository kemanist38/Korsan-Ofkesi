-- Arkadaş listesi, özel mesaj küfür cezası ve süreli ban (033). Supabase SQL Editor'de bir kez çalıştırılır.
-- Arkadaşlık karşılıklı onayla kurulur (en çok 50). Listeyi yalnızca oyun sunucusu okur/yazar (server_secrets anahtarıyla).
-- Özel mesajda küfür: 1. kez 24 saat susturma (oyun sunucusunda), 2. kez 7 gün ban, 3. kez kalıcı ban.
create table if not exists public.friends(
  a uuid not null references auth.users(id) on delete cascade,
  b uuid not null references auth.users(id) on delete cascade,
  ok boolean not null default false,
  created_at timestamptz not null default now(),
  primary key(a,b),check(a<>b)
);
alter table public.friends enable row level security;
revoke all on public.friends from anon,authenticated;
alter table public.profiles add column if not exists banned_until timestamptz;
alter table public.profiles add column if not exists chat_strikes int not null default 0;

create or replace function public.server_ok(p_secret text) returns boolean language sql stable security definer set search_path=public as
$fn$ select p_secret is not null and exists(select 1 from server_secrets where name='game_server' and value=p_secret) $fn$;
revoke all on function public.server_ok(text) from public,anon,authenticated;

-- Liste: karşılıklı kabul edilenler (ok) ve bekleyen istekler (gelen/giden)
create or replace function public.friend_list(p_secret text,p_uid uuid) returns jsonb
language plpgsql security definer set search_path=public as $fn$
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id',x.other,'nick',p.nick,'ok',x.ok,'in',x.incoming) order by p.nick)
    from (select case when f.a=p_uid then f.b else f.a end as other,f.ok,(f.b=p_uid and not f.ok) as incoming
          from friends f where f.a=p_uid or f.b=p_uid) x join profiles p on p.id=x.other),'[]'::jsonb);
end $fn$;

-- İstek: karşı taraf zaten istek attıysa doğrudan arkadaş olunur
create or replace function public.friend_request(p_secret text,p_uid uuid,p_nick text) returns jsonb
language plpgsql security definer set search_path=public as $fn$
declare v_to uuid;v_nick text;
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  select id,nick into v_to,v_nick from profiles where lower(nick)=lower(trim(p_nick)) and not banned;
  if v_to is null then raise exception 'Kaptan bulunamadı'; end if;
  if v_to=p_uid then raise exception 'Kendini ekleyemezsin'; end if;
  if (select count(*) from friends where a=p_uid or b=p_uid)>=50 then raise exception 'Arkadaş listen dolu (50)'; end if;
  if exists(select 1 from friends where a=v_to and b=p_uid) then update friends set ok=true where a=v_to and b=p_uid;
    return jsonb_build_object('id',v_to,'nick',v_nick,'ok',true); end if;
  insert into friends(a,b) values(p_uid,v_to) on conflict do nothing;
  return jsonb_build_object('id',v_to,'nick',v_nick,'ok',(select ok from friends where a=p_uid and b=v_to));
end $fn$;

create or replace function public.friend_answer(p_secret text,p_uid uuid,p_from uuid,p_ok boolean) returns void
language plpgsql security definer set search_path=public as $fn$
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  if p_ok then update friends set ok=true where a=p_from and b=p_uid; else delete from friends where a=p_from and b=p_uid and not ok; end if;
end $fn$;

create or replace function public.friend_remove(p_secret text,p_uid uuid,p_other uuid) returns void
language plpgsql security definer set search_path=public as $fn$
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  delete from friends where (a=p_uid and b=p_other) or (a=p_other and b=p_uid);
end $fn$;

-- Küfür cezası: sayaç artar; 2. kez 7 gün, 3. kez kalıcı ban. Dönen değer yeni sayaç.
create or replace function public.chat_strike(p_secret text,p_uid uuid) returns int
language plpgsql security definer set search_path=public as $fn$
declare n int;
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  update profiles set chat_strikes=chat_strikes+1 where id=p_uid returning chat_strikes into n;
  if n=2 then update profiles set banned=true,banned_until=now()+interval '7 days',ban_reason='Özel mesajda küfür (7 gün)' where id=p_uid;
  elsif n>=3 then update profiles set banned=true,banned_until=null,ban_reason='Özel mesajda küfür (kalıcı)' where id=p_uid; end if;
  return coalesce(n,0);
end $fn$;

-- Süreli ban bitince girişte sunucu kaldırır
create or replace function public.ban_check(p_secret text,p_uid uuid) returns boolean
language plpgsql security definer set search_path=public as $fn$
declare b boolean;u timestamptz;
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  select banned,banned_until into b,u from profiles where id=p_uid;
  if b and u is not null and u<=now() then update profiles set banned=false,banned_until=null,ban_reason=null where id=p_uid;return false; end if;
  return coalesce(b,false);
end $fn$;

revoke all on function public.friend_list(text,uuid),public.friend_request(text,uuid,text),public.friend_answer(text,uuid,uuid,boolean),
  public.friend_remove(text,uuid,uuid),public.chat_strike(text,uuid),public.ban_check(text,uuid) from public,authenticated;
grant execute on function public.friend_list(text,uuid),public.friend_request(text,uuid,text),public.friend_answer(text,uuid,uuid,boolean),
  public.friend_remove(text,uuid,uuid),public.chat_strike(text,uuid),public.ban_check(text,uuid) to anon;
