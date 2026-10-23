-- Savaş rütbesi (SP) kaldırıldı (035). Supabase SQL Editor'de bir kez çalıştırılır. VPS gerekmez.
-- Sıralamadaki "sp" sütunu artık batırılan rakip kaptan sayısıdır (profiles.sinks, 031_rival_sinks.sql).
-- Sonraki 6 saatlik dönemde tablo yeniden hesaplanır; hemen görmek için rank_meta sıfırlanır.
create or replace function public.rank_players() returns table(nick text, tag text, fleet text, level int, xp bigint, ep bigint, sp bigint, npc bigint, monster bigint, boss bigint, treasure bigint, me boolean, at timestamptz)
language plpgsql security definer set search_path = public as $fn$
declare v_local timestamp := now() at time zone 'Europe/Istanbul'; v_start timestamptz; v_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  v_start := (date_trunc('day', v_local) + floor(extract(hour from v_local) / 6) * interval '6 hours') at time zone 'Europe/Istanbul';
  select m.at into v_at from rank_meta m where m.id = 1;
  if v_at is null or v_at < v_start then
    perform 1 from rank_meta where id = 1 for update;
    select m.at into v_at from rank_meta m where m.id = 1;
    if v_at is null or v_at < v_start then
      delete from rank_snapshot;
      insert into rank_snapshot(user_id, nick, tag, fleet, level, xp, ep, sp, npc, monster, boss, treasure)
      select e.user_id, p.nick, g.tag, g.name, coalesce((e.state->>'level')::int, 1), coalesce((e.state->>'xp')::bigint, 0), coalesce((e.state->>'ep')::bigint, 0), coalesce(p.sinks, 0),
        coalesce((e.state->>'st_npc')::bigint, 0), coalesce((e.state->>'st_monster')::bigint, 0), coalesce((e.state->>'st_boss')::bigint, 0), coalesce((e.state->>'st_treasure')::bigint, 0)
      from economy e join profiles p on p.id = e.user_id left join guild_members gm on gm.user_id = e.user_id left join guilds g on g.id = gm.guild_id
      where not p.banned and not exists (select 1 from admins a where a.user_id = e.user_id);
      v_at := v_start;
      update rank_meta set at = v_at where id = 1;
    end if;
  end if;
  return query select s.nick, s.tag, s.fleet, s.level, s.xp, s.ep, s.sp, s.npc, s.monster, s.boss, s.treasure, s.user_id = auth.uid(), v_at
    from rank_snapshot s order by s.level desc, s.xp desc limit 2000;
end $fn$;
revoke all on function public.rank_players() from public, anon;
grant execute on function public.rank_players() to authenticated;
update public.rank_meta set at = null where id = 1;
