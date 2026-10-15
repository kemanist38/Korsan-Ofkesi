-- Shopier ödemeleri: Shopier, Otomatik Sipariş Bildirimi (OSB) ile oyun sunucusuna haber verir; sunucu imzayı doğrular ve
-- shopier_credit ile inciyi yükler. Fonksiyon yalnızca VPS'teki gizli anahtarı bilen sunucu tarafından çağrılabilir.
create table if not exists public.server_secrets(name text primary key, value text not null);
alter table public.server_secrets enable row level security; -- hiçbir politika yok: kimse okuyamaz

-- Paketler fiyatla eşleşir (Shopier ürün fiyatı = paket fiyatı)
create table if not exists public.shop_packs(id text primary key, name text not null, price numeric(10,2) not null unique, pearls bigint not null);
alter table public.shop_packs enable row level security;
drop policy if exists "packs read" on public.shop_packs;
create policy "packs read" on public.shop_packs for select using (true);
insert into public.shop_packs(id, name, price, pearls) values
  ('pouch','İnci Kesesi',49.99,3500),('chest','İnci Sandığı',119.99,9200),('crate','İnci Kasası',249.99,20000),
  ('hold','Gemi Ambarı',499.99,42500),('vault','Kaptan Hazinesi',999.99,92000),('fleet','Amiral Hazinesi',1999.99,196000)
on conflict (id) do update set name = excluded.name, price = excluded.price, pearls = excluded.pearls;

create table if not exists public.shopier_orders(
  order_id text primary key,
  email text, note text, price numeric(10,2), pack text, pearls bigint,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null, -- 'yüklendi' | 'eşleşmedi' | 'paket yok' | 'test'
  at timestamptz not null default now()
);
alter table public.shopier_orders enable row level security;
drop policy if exists "orders read own" on public.shopier_orders;
create policy "orders read own" on public.shopier_orders for select using (auth.uid() = user_id or public.is_admin());

-- Oyuncu: önce sipariş notundaki oyuncu numarası (#10001), yoksa Shopier e-postası = oyun hesabı e-postası
create or replace function public.shopier_credit(p_secret text, p_order text, p_email text, p_note text, p_price numeric, p_test boolean)
returns text language plpgsql security definer set search_path = public as $$
declare pk shop_packs; u uuid; no bigint; st text;
begin
  if p_secret is null or not exists (select 1 from server_secrets where name = 'game_server' and value = p_secret) then raise exception 'yetki yok'; end if;
  if exists (select 1 from shopier_orders where order_id = p_order) then return 'zaten işlendi'; end if;
  select * into pk from shop_packs where price = round(p_price, 2);
  no := nullif(substring(coalesce(p_note, '') from '(\d{5,})'), '')::bigint;
  if no is not null then select id into u from profiles where player_no = no; end if;
  if u is null and p_email is not null then select p.id into u from profiles p join auth.users a on a.id = p.id where lower(a.email) = lower(trim(p_email)); end if;
  st := case when p_test then 'test' when pk is null then 'paket yok' when u is null then 'eşleşmedi' else 'yüklendi' end;
  insert into shopier_orders(order_id, email, note, price, pack, pearls, user_id, status) values (p_order, p_email, p_note, p_price, pk.id, pk.pearls, u, st);
  if st = 'yüklendi' then
    insert into wallets(user_id) values (u) on conflict do nothing;
    update wallets set pearls = pearls + pk.pearls, updated_at = now() where user_id = u;
    insert into pearl_log(user_id, delta, reason) values (u, pk.pearls, 'shopier ' || p_order);
  end if;
  return st;
end $$;

-- Yönetici: eşleşmeyen siparişi oyuncuya elle yükle
create or replace function public.admin_order_assign(p_order text, p_player_no bigint) returns void language plpgsql security definer set search_path = public as $$
declare o shopier_orders; u uuid;
begin
  if not is_admin() then raise exception 'Yetkin yok'; end if;
  select * into o from shopier_orders where order_id = p_order for update;
  if o is null or o.status <> 'eşleşmedi' or o.pearls is null then raise exception 'Bu sipariş yüklenemez'; end if;
  select id into u from profiles where player_no = p_player_no;if u is null then raise exception 'Oyuncu bulunamadı'; end if;
  insert into wallets(user_id) values (u) on conflict do nothing;
  update wallets set pearls = pearls + o.pearls, updated_at = now() where user_id = u;
  insert into pearl_log(user_id, delta, reason) values (u, o.pearls, 'shopier ' || p_order || ' (elle)');
  update shopier_orders set user_id = u, status = 'yüklendi' where order_id = p_order;
end $$;

revoke all on function public.shopier_credit(text,text,text,text,numeric,boolean) from public, authenticated;
grant execute on function public.shopier_credit(text,text,text,text,numeric,boolean) to anon;
revoke all on function public.admin_order_assign(text,bigint) from public, anon;
grant execute on function public.admin_order_assign(text,bigint) to authenticated;
