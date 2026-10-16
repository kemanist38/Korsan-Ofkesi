-- AÇILIŞ GÜNÜ: kapalı test verisini temizler. Yönetici hesapları ve kuponlar korunur.
-- Bütün oyuncular (yöneticiler hariç) silinir; açılışta yeniden kayıt olurlar. Yöneticilerin kaydı sıfırlanır.
-- GERİ ALINAMAZ. Çalıştırmadan önce Supabase > Database > Backups bölümünden yedek olduğunu kontrol et.
begin;
delete from public.auction_top;
delete from public.coupon_redemptions;
update public.coupons set uses = 0;
delete from public.pearl_log;
delete from public.wallets;
delete from public.guild_applications;
delete from public.guild_members;
delete from public.guilds;
delete from public.saves;
delete from public.economy;
delete from public.economy_flags;
delete from public.economy_claims;
delete from public.mentor_claims;
delete from public.mentor_requests;
delete from public.mentor_links;
delete from public.last_pos;
update public.islands set guild_id = null, towers = '[]'::jsonb, ruins = '{}'::jsonb;
delete from auth.users where id not in (select user_id from public.admins);
commit;
-- Kontrol: kalan hesaplar yalnızca yöneticiler olmalı
select p.player_no, p.nick from public.profiles p;
