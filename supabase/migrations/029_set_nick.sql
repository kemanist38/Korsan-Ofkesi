-- Kaptan adı = giriş kullanıcı adı (029). Supabase SQL Editor'de bir kez çalıştırılır. VPS gerekmez.
-- Ad değişikliği artık sunucuda yapılır ve gerçekten kaydedildiği doğrulanır; giriş (login_email) bu adla çalışır.
create or replace function public.set_nick(p_nick text) returns text
language plpgsql security definer set search_path = public as $fn$
declare n text := trim(p_nick);
begin
  if auth.uid() is null then raise exception 'Giriş yapılmamış'; end if;
  if n is null or char_length(n) < 3 or char_length(n) > 16 or n !~ '^[[:alnum:]_.]+$' then raise exception 'Geçersiz kaptan adı'; end if;
  if exists (select 1 from profiles where lower(nick) = lower(n) and id <> auth.uid()) then raise exception 'Bu kaptan adı alınmış'; end if;
  update profiles set nick = n where id = auth.uid();
  if not found then raise exception 'Profil bulunamadı'; end if;
  return n;
end $fn$;
revoke all on function public.set_nick(text) from public, anon;
grant execute on function public.set_nick(text) to authenticated;
