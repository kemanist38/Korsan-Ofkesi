-- Filolar: kurma, arama, başvuru, kabul/ret, ayrılma, üye atma, rol verme ve filoyu kapatma.
-- Bütün değişiklikler yetki kontrolü yapan fonksiyonlardan geçer; tablolara doğrudan yazma kapalıdır.
create table if not exists public.guilds(
  id bigint generated always as identity primary key,
  tag text not null check (char_length(tag) between 2 and 4),
  name text not null check (char_length(name) between 3 and 24),
  created_at timestamptz not null default now()
);
create unique index if not exists guilds_tag_lower on public.guilds (lower(tag));
create unique index if not exists guilds_name_lower on public.guilds (lower(name));
create table if not exists public.guild_members(
  user_id uuid primary key references public.profiles(id) on delete cascade,
  guild_id bigint not null references public.guilds(id) on delete cascade,
  role text not null check (role in ('leader','deputy','member')),
  joined_at timestamptz not null default now()
);
create index if not exists guild_members_guild on public.guild_members(guild_id);
create table if not exists public.guild_applications(
  guild_id bigint not null references public.guilds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (guild_id,user_id)
);
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.guild_applications enable row level security;
drop policy if exists "guilds read" on public.guilds;
create policy "guilds read" on public.guilds for select using (true);
drop policy if exists "members read" on public.guild_members;
create policy "members read" on public.guild_members for select using (true);
drop policy if exists "applications read" on public.guild_applications;
create policy "applications read" on public.guild_applications for select using (
  user_id = auth.uid() or exists (select 1 from public.guild_members m where m.user_id = auth.uid() and m.guild_id = guild_applications.guild_id and m.role in ('leader','deputy')));

create or replace function public.guild_create(p_tag text, p_name text) returns bigint language plpgsql security definer set search_path = public as $$
declare g bigint;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if exists (select 1 from guild_members where user_id = auth.uid()) then raise exception 'Zaten bir filodasın'; end if;
  if exists (select 1 from guilds where lower(tag) = lower(p_tag)) then raise exception 'Bu kısaltma alınmış'; end if;
  if exists (select 1 from guilds where lower(name) = lower(p_name)) then raise exception 'Bu filo adı alınmış'; end if;
  insert into guilds(tag, name) values (p_tag, p_name) returning id into g;
  insert into guild_members(user_id, guild_id, role) values (auth.uid(), g, 'leader');
  delete from guild_applications where user_id = auth.uid();
  return g;
end $$;

create or replace function public.guild_apply(p_guild bigint) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if exists (select 1 from guild_members where user_id = auth.uid()) then raise exception 'Zaten bir filodasın'; end if;
  if (select count(*) from guild_applications where user_id = auth.uid()) >= 5 then raise exception 'Aynı anda en fazla 5 başvuru yapabilirsin'; end if;
  insert into guild_applications(guild_id, user_id) values (p_guild, auth.uid()) on conflict do nothing;
end $$;

create or replace function public.guild_cancel_apply(p_guild bigint) returns void language sql security definer set search_path = public as
$$ delete from guild_applications where guild_id = p_guild and user_id = auth.uid() $$;

-- Başvuruyu kabul et / reddet: başkan ve yardımcısı
create or replace function public.guild_answer(p_user uuid, p_accept boolean) returns void language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select guild_id, role into me from guild_members where user_id = auth.uid();
  if me is null or me.role not in ('leader','deputy') then raise exception 'Yetkin yok'; end if;
  if not exists (select 1 from guild_applications where guild_id = me.guild_id and user_id = p_user) then raise exception 'Başvuru bulunamadı'; end if;
  delete from guild_applications where guild_id = me.guild_id and user_id = p_user;
  if p_accept then
    if exists (select 1 from guild_members where user_id = p_user) then raise exception 'Oyuncu başka bir filoya katılmış'; end if;
    if (select count(*) from guild_members where guild_id = me.guild_id) >= 50 then raise exception 'Filo dolu (50 üye)'; end if;
    insert into guild_members(user_id, guild_id, role) values (p_user, me.guild_id, 'member');
    delete from guild_applications where user_id = p_user;
  end if;
end $$;

-- Üye at: başkan herkesi (kendisi hariç), yardımcı yalnızca üyeleri atabilir
create or replace function public.guild_kick(p_user uuid) returns void language plpgsql security definer set search_path = public as $$
declare me record; t record;
begin
  select guild_id, role into me from guild_members where user_id = auth.uid();
  select guild_id, role into t from guild_members where user_id = p_user;
  if me is null or t is null or me.guild_id <> t.guild_id or p_user = auth.uid() then raise exception 'Oyuncu filonda değil'; end if;
  if not (me.role = 'leader' or (me.role = 'deputy' and t.role = 'member')) then raise exception 'Yetkin yok'; end if;
  delete from guild_members where user_id = p_user;
end $$;

-- Rol ver: yalnızca başkan (üye ↔ yardımcı)
create or replace function public.guild_set_role(p_user uuid, p_role text) returns void language plpgsql security definer set search_path = public as $$
declare me record;
begin
  if p_role not in ('deputy','member') then raise exception 'Geçersiz rol'; end if;
  select guild_id, role into me from guild_members where user_id = auth.uid();
  if me is null or me.role <> 'leader' then raise exception 'Yalnızca filo başkanı rol verebilir'; end if;
  update guild_members set role = p_role where user_id = p_user and guild_id = me.guild_id and role <> 'leader';
end $$;

-- Filodan ayrıl: başkan ayrılırsa başkanlık en eski yardımcıya, yoksa en eski üyeye geçer; kimse kalmazsa filo kapanır
create or replace function public.guild_leave() returns void language plpgsql security definer set search_path = public as $$
declare me record; heir uuid;
begin
  select guild_id, role into me from guild_members where user_id = auth.uid();
  if me is null then return; end if;
  delete from guild_members where user_id = auth.uid();
  if me.role = 'leader' then
    select user_id into heir from guild_members where guild_id = me.guild_id order by (role = 'deputy') desc, joined_at limit 1;
    if heir is null then delete from guilds where id = me.guild_id; else update guild_members set role = 'leader' where user_id = heir; end if;
  end if;
end $$;

-- Filoyu kapat: yalnızca başkan
create or replace function public.guild_disband() returns void language plpgsql security definer set search_path = public as $$
declare me record;
begin
  select guild_id, role into me from guild_members where user_id = auth.uid();
  if me is null or me.role <> 'leader' then raise exception 'Filoyu yalnızca başkan kapatabilir'; end if;
  delete from guilds where id = me.guild_id;
end $$;

revoke all on function public.guild_create(text,text), public.guild_apply(bigint), public.guild_cancel_apply(bigint), public.guild_answer(uuid,boolean),
  public.guild_kick(uuid), public.guild_set_role(uuid,text), public.guild_leave(), public.guild_disband() from public, anon;
grant execute on function public.guild_create(text,text), public.guild_apply(bigint), public.guild_cancel_apply(bigint), public.guild_answer(uuid,boolean),
  public.guild_kick(uuid), public.guild_set_role(uuid,text), public.guild_leave(), public.guild_disband() to authenticated;
