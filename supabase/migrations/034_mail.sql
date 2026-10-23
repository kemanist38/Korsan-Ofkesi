-- Mesaj kutusu (034). Supabase SQL Editor'de bir kez çalıştırılır.
-- Kaptanlar arkadaşlarına konu + metin mektup gönderir; alıcı çevrim dışıyken de kutusunda kalır.
-- Gelen ve gönderilen kutuları ayrı silinir (bir taraf silince öteki kutuda kalır). Kutu başına en çok 100 mektup tutulur.
-- Tabloyu yalnız oyun sunucusu okur/yazar (server_secrets anahtarıyla).
create table if not exists public.mail(
  id bigserial primary key,
  from_uid uuid not null references auth.users(id) on delete cascade,
  to_uid uuid not null references auth.users(id) on delete cascade,
  subject text not null default '',
  body text not null,
  at timestamptz not null default now(),
  read boolean not null default false,
  del_from boolean not null default false,
  del_to boolean not null default false
);
create index if not exists mail_to_idx on public.mail(to_uid,at desc) where not del_to;
create index if not exists mail_from_idx on public.mail(from_uid,at desc) where not del_from;
alter table public.mail enable row level security;
revoke all on public.mail from anon,authenticated;

-- Gönder: yalnız kabul edilmiş arkadaşa; günde en çok 100 mektup
create or replace function public.mail_send(p_secret text,p_uid uuid,p_to uuid,p_subject text,p_body text) returns jsonb
language plpgsql security definer set search_path=public as $fn$
declare v_id bigint;
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  if not exists(select 1 from friends where ok and ((a=p_uid and b=p_to) or (a=p_to and b=p_uid))) then raise exception 'Yalnız arkadaşlarına mektup gönderebilirsin'; end if;
  if (select count(*) from mail where from_uid=p_uid and at>now()-interval '1 day')>=100 then raise exception 'Bugün çok mektup gönderdin, yarın tekrar dene'; end if;
  insert into mail(from_uid,to_uid,subject,body) values(p_uid,p_to,left(coalesce(p_subject,''),60),left(p_body,500)) returning id into v_id;
  -- Kutu taşmasın: alıcının en eski gelenleri (100 üstü) silinmiş sayılır
  update mail set del_to=true where id in(select id from mail where to_uid=p_to and not del_to order by at desc offset 100);
  update mail set del_from=true where id in(select id from mail where from_uid=p_uid and not del_from order by at desc offset 100);
  return jsonb_build_object('id',v_id);
end $fn$;

-- Kutu: 'in' gelen, 'out' gönderilen; okunmamış sayısıyla
create or replace function public.mail_box(p_secret text,p_uid uuid,p_box text) returns jsonb
language plpgsql security definer set search_path=public as $fn$
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  return jsonb_build_object('unread',(select count(*) from mail where to_uid=p_uid and not del_to and not read),
    'list',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'nick',p.nick,'other',case when p_box='out' then m.to_uid else m.from_uid end,
        'subject',m.subject,'body',m.body,'at',extract(epoch from m.at)*1000,'read',m.read) order by m.at desc)
      from mail m join profiles p on p.id=case when p_box='out' then m.to_uid else m.from_uid end
      where case when p_box='out' then m.from_uid=p_uid and not m.del_from else m.to_uid=p_uid and not m.del_to end),'[]'::jsonb));
end $fn$;

create or replace function public.mail_read(p_secret text,p_uid uuid,p_id bigint) returns void
language plpgsql security definer set search_path=public as $fn$
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  update mail set read=true where id=p_id and to_uid=p_uid;
end $fn$;

-- Sil: p_id boşsa o kutudaki bütün mektuplar
create or replace function public.mail_delete(p_secret text,p_uid uuid,p_box text,p_id bigint) returns void
language plpgsql security definer set search_path=public as $fn$
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  if p_box='out' then update mail set del_from=true where from_uid=p_uid and (p_id is null or id=p_id);
  else update mail set del_to=true,read=true where to_uid=p_uid and (p_id is null or id=p_id); end if;
  delete from mail where del_from and del_to;
end $fn$;
revoke all on function public.mail_send(text,uuid,uuid,text,text),public.mail_box(text,uuid,text),public.mail_read(text,uuid,bigint),public.mail_delete(text,uuid,text,bigint) from public,anon,authenticated;
