-- Elit puan tam sayıya geçti (021). Supabase SQL Editor'de bir kez çalıştırılır (020'den sonra), sonra VPS.
--  * Her özel gülle 1 ya da 2 EP verir; eşikler 10 katına çıktı (Elit 15 = 36.000.000 EP).
--  * Mevcut kaptanların EP'si 10 ile çarpılır, elit sınıfları korunur. İkinci kez çalışmasın diye işaret konur.
update public.economy
set state = state || jsonb_build_object('ep', round(coalesce((state->>'ep')::numeric, 0) * 10), 'ep_v3', 1),
    tokens = tokens || jsonb_build_object('b_ep', round(coalesce((tokens->>'b_ep')::numeric, 0) * 10))
where not (state ? 'ep_v3');
