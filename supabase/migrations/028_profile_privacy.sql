-- Profil gizliliği (028). Supabase SQL Editor'de bir kez çalıştırılır. VPS gerekmez.
-- Ban sebebi artık herkese açık değil: yalnızca oyuncunun kendisi (my_ban_reason) ve yönetim paneli (admin_find) görür.
revoke select on public.profiles from anon, authenticated;
grant select (id, player_no, nick, banned, created_at) on public.profiles to anon, authenticated;

create or replace function public.my_ban_reason() returns text language sql stable security definer set search_path = public as $fn$
  select ban_reason from profiles where id = auth.uid()
$fn$;
revoke all on function public.my_ban_reason() from public, anon;
grant execute on function public.my_ban_reason() to authenticated;
