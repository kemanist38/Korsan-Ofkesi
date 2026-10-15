-- Kullanıcı adıyla giriş: ad ve şifre doğruysa hesabın e-postası döner (oyun bununla Supabase girişini yapar).
-- E-posta yalnızca doğru şifreyle verilir; aynı ada 15 dakikada 10'dan fazla hatalı deneme engellenir.
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.login_attempts(nick text not null, at timestamptz not null default now());
create index if not exists login_attempts_nick on public.login_attempts(nick, at);
alter table public.login_attempts enable row level security;

create or replace function public.login_email(p_nick text, p_pass text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare e text; h text; n text := lower(trim(p_nick));
begin
  if (select count(*) from login_attempts where nick = n and at > now() - interval '15 minutes') >= 10 then raise exception 'Çok fazla hatalı deneme, 15 dakika sonra tekrar dene'; end if;
  select u.email, u.encrypted_password into e, h from profiles p join auth.users u on u.id = p.id where lower(p.nick) = n;
  if e is null or h is null or h <> crypt(p_pass, h) then
    insert into login_attempts(nick) values (n);
    delete from login_attempts where at < now() - interval '1 day';
    return null;
  end if;
  return e;
end $$;
revoke all on function public.login_email(text,text) from public;
grant execute on function public.login_email(text,text) to anon, authenticated;
