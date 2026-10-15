-- Oyun içi inci için 2.000/gün sınırı kaldırıldı (pırıltı toplama artık oyunda günde 500 ile sınırlı).
-- Yalnızca açık hileye karşı çok yüksek bir güvenlik tavanı kalır.
create or replace function public.pearl_daily_cap() returns bigint language sql immutable as $$ select 100000::bigint $$;
