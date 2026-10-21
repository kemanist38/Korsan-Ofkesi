-- Batırma sayısı sunucuda (031). Supabase SQL Editor'de bir kez çalıştırılır.
-- Güverte nişanının kademesi oyuncu batırma sayısına göredir. Sayı yalnızca oyun sunucusunun doğruladığı batırmalarla artar
-- (son 60 sn'de gerçekten ateş etmiş oyuncu, aynı rakipten günde en çok 3 kez); oyuncu kendisi değiştiremez, herkes okuyabilir.
alter table public.profiles add column if not exists sinks bigint not null default 0;
grant select (sinks) on public.profiles to anon, authenticated;

create or replace function public.rival_sink(p_secret text, p_uid uuid, p_add int) returns bigint
language plpgsql security definer set search_path = public as $fn$
declare n bigint;
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  update profiles set sinks = sinks + greatest(0, least(coalesce(p_add, 0), 1)) where id = p_uid returning sinks into n;
  return coalesce(n, 0);
end $fn$;
revoke all on function public.rival_sink(text, uuid, int) from public, authenticated;
grant execute on function public.rival_sink(text, uuid, int) to anon;
