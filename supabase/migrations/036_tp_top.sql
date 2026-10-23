-- TP sıralama madalyaları (036). Supabase SQL Editor'de bir kez çalıştırılır.
-- Oyun sunucusu ilk 100 kaptanı (seviye, sonra TP) 10 dakikada bir okur; yasaklılar ve yöneticiler sayılmaz.
create or replace function public.tp_top(p_secret text) returns jsonb
language plpgsql security definer set search_path=public as $fn$
begin
  if not server_ok(p_secret) then raise exception 'yetki yok'; end if;
  return coalesce((select jsonb_agg(x.user_id order by x.lv desc, x.xp desc) from (
    select e.user_id, coalesce((e.state->>'level')::int,1) lv, coalesce((e.state->>'xp')::bigint,0) xp
    from economy e join profiles p on p.id=e.user_id
    where not p.banned and not exists(select 1 from admins a where a.user_id=e.user_id)
    order by lv desc, xp desc limit 100) x),'[]'::jsonb);
end $fn$;
revoke all on function public.tp_top(text) from public,anon,authenticated;
