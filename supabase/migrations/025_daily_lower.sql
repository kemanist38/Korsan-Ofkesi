-- Günlük ödül düşürüldü (025): 2 kat kaldırıldı, altın tabanı 5.000 (herkese aynı). Bir kez çalıştırılır.
create or replace function public.economy_claim(p_kind text) returns jsonb language plpgsql security definer set search_path = public as $fn$
declare today date := (now() at time zone 'Europe/Istanbul')::date; prev_day date; prev_n int; n int; lvl int; g bigint; rw jsonb; fs date; p bigint; add jsonb := '{}'::jsonb; k text;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  perform economy_get();
  if exists (select 1 from economy_claims where user_id = auth.uid() and kind = p_kind and day = today) then raise exception 'Bugünün ödülünü zaten aldın'; end if;
  if p_kind = 'daily' then
    select c.day, c.n into prev_day, prev_n from economy_claims c where c.user_id = auth.uid() and c.kind = 'daily' order by c.day desc limit 1;
    n := case when prev_day = today - 1 then prev_n % 7 + 1 else 1 end;
    g := 5000;
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
end $fn$;
