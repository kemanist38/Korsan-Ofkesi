# İlk sunucu güvenlik paketi — 16 Ekim 2026

Taban: 421d341. Bu paket tek başına oyunu tamamen sunucu otoriteli yapmaz.

## Değişiklikler
- Bozuk durum paketleri işlem öncesi reddedilir; WebSocket işlemleri sıralanır ve hata yakalanır.
- Hesap ekonomisi yüklenmeden oyun işlemleri başlatılmaz. Haritalarda seviye kontrolü yapılır.
- Gülle/malzeme kullanımı hasar bütçesi verilmeden önce veritabanında satır kilidiyle onaylanır. Erken mayın kullanımı bütçe vermez.
- Boss ilerlemesi bağımsız istemci bildiriminden değil, kabul edilen ilgili NPC öldürmesinden gelir.
- Kuşatma ödülü yalnız gerçekten uygulanan hasardan hesaplanır.
- Başarısız ödül yazımları aynı işlem kimliğiyle tekrar denenir; ödeme callback'i başarısız veritabanı yazımını başarılı saymaz.

## Kurulum sırası
1. Veritabanı yedeği alın. Ayrı test veritabanında 001–015 üzerine `016_server_reservations.sql` uygulayın.
2. Stok tüketimini hem istemci senkronizasyonu önce, hem sunucu rezervasyonu önce olacak şekilde deneyin. Çift düşüm olmamalı. Aynı hesaptan eşzamanlı rezervasyonda stok negatif olmamalı.
3. Aynı ödül UUID'sini iki kez çağırın: bir kez ödül yazılmalı. Başarısız/timeout isteğini aynı UUID ile tekrar deneyin.
4. Bu kontrollerden sonra canlı veritabanına 016'yı uygulayın; ardından yeni sunucu bundle'ını dağıtıp sunucuyu yeniden başlatın. Tersi sırada dağıtım atışları engeller.
5. SERVER_SECRET doğru olmalı; BENCH_AUTH canlıda kapalı olmalı. STATE_FILE kalıcı ve yazılabilir diskte tutulmalı.
6. İki gerçek test hesabıyla NPC, PvP, malzeme, görev ve ödeme testini yapın. Yeni rezervasyon RPC'sinin gecikmesini ve veritabanı yükünü ölçün.

Bu oturumda canlı veritabanına veya sunucuya erişilmedi. Migration gerçek PostgreSQL üzerinde çalıştırılmadı; PR bu nedenle taslaktır.

## Doğrulama
92 otomatik test başarılı; istemci ve sunucu derlemesi başarılı. Yerel WebSocket testinde null durum paketi sonrası sunucu ayakta kaldı. Ağ/veritabanı çağrıları yerel testte taklit edildi.

## Açık kalan işler
- Normal NPC/canavarlar ortak sunucu varlıkları değil; öldürme kontrolü hâlâ hasar bütçesine dayanır.
- Pırıltı görevlerinde gerçek toplama sayısı doğrulanmıyor; bu paket yalnız harita/seviye kontrolü ekler.
- economy_sync/wallet_sync istemci kazanç bildirimlerini sınırlı da olsa kabul eder; ödül ve alışveriş tamamen sunucu işlemlerine taşınmalı.
- Harita içi teleport, geçit komşuluğu, PvP can/şifa ve bazı kimlik alanları tam sunucu otoritesine taşınmalı.
- İstemci usageDenied yanıtını henüz kullanıcı arayüzüne yansıtmıyor; yerel iyimser stok/hasar gösterimi sunucuyla uyuşmayabilir.
- Ödül kuyruğu 60 saniyelik dosya kaydına dayanır: ani çökmede son kayıt sonrası ödüller kaybolabilir. Tam dayanıklı transaction outbox değildir.
- Yeni rezervasyon RPC'si ile gerçek veritabanı yük testi, mobil FPS, gecikme ve uzun süreli test yapılmalı. Önceki mock yük testi yeni yolun kapasitesini kanıtlamaz.
