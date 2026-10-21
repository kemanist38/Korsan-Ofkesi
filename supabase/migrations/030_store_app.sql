-- Mağaza uygulaması (030). Supabase SQL Editor'de bir kez çalıştırılır.
-- 1) Uygulama içi satın alma (App Store / Google Play, RevenueCat üzerinden): ödeme doğrulanınca oyun sunucusu iap_credit ile
--    inciyi yükler. Ürün kimliği pearls_<paket> (ör. pearls_crate) shop_packs tablosundaki paketle eşleşir. Aynı işlem iki kez yüklenmez.
-- 2) Hesap silme (Apple ve Google şartı): oyuncu ayarlardan kendi hesabını kalıcı olarak siler; bağlı bütün oyun verisi de silinir.
create table if not exists public.iap_orders(
  tx_id text primary key,
  store text not null, product text not null, pack text, pearls bigint,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null, -- 'yüklendi' | 'paket yok' | 'oyuncu yok' | 'iade'
  at timestamptz not null default now()
);
alter table public.iap_orders enable row level security;
drop policy if exists "iap read own" on public.iap_orders;
create policy "iap read own" on public.iap_orders for select using (auth.uid() = user_id or public.is_admin());

create or replace function public.iap_credit(p_secret text, p_tx text, p_store text, p_product text, p_uid uuid)
returns text language plpgsql security definer set search_path = public as $fn$
declare pk shop_packs; st text; ok boolean;
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  if exists (select 1 from iap_orders where tx_id = p_tx) then return 'zaten işlendi'; end if;
  select * into pk from shop_packs where id = regexp_replace(coalesce(p_product, ''), '^pearls_', '');
  ok := p_uid is not null and exists (select 1 from profiles where id = p_uid);
  st := case when pk is null then 'paket yok' when not ok then 'oyuncu yok' else 'yüklendi' end;
  insert into iap_orders(tx_id, store, product, pack, pearls, user_id, status) values (p_tx, p_store, p_product, pk.id, pk.pearls, case when ok then p_uid end, st);
  if st = 'yüklendi' then
    insert into wallets(user_id) values (p_uid) on conflict do nothing;
    update wallets set pearls = pearls + pk.pearls, updated_at = now() where user_id = p_uid;
    insert into pearl_log(user_id, delta, reason) values (p_uid, pk.pearls, p_store || ' ' || p_tx);
  end if;
  return st;
end $fn$;
revoke all on function public.iap_credit(text,text,text,text,uuid) from public, authenticated;
grant execute on function public.iap_credit(text,text,text,text,uuid) to anon;

-- İade: mağaza ödemeyi geri verirse yüklenen inci geri alınır (bakiye sıfırın altına inmez)
create or replace function public.iap_refund(p_secret text, p_tx text)
returns text language plpgsql security definer set search_path = public as $fn$
declare o iap_orders;
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  select * into o from iap_orders where tx_id = p_tx for update;
  if o is null or o.status <> 'yüklendi' then return 'yok'; end if;
  update wallets set pearls = greatest(0, pearls - o.pearls), updated_at = now() where user_id = o.user_id;
  insert into pearl_log(user_id, delta, reason) values (o.user_id, -o.pearls, 'iade ' || p_tx);
  update iap_orders set status = 'iade' where tx_id = p_tx;
  return 'iade';
end $fn$;
revoke all on function public.iap_refund(text,text) from public, authenticated;
grant execute on function public.iap_refund(text,text) to anon;

-- Hesabı kalıcı olarak sil: yalnızca oturumu açık oyuncu kendi hesabını silebilir (yönetici hesabı silinemez)
create or replace function public.delete_my_account() returns void language plpgsql security definer set search_path = public, auth as $fn$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Giriş yapılmamış'; end if;
  if exists (select 1 from admins where user_id = u) then raise exception 'Yönetici hesabı buradan silinemez'; end if;
  delete from auth.users where id = u;
end $fn$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
