# App Store ve Google Play yükleme rehberi

Uygulama: **Pirate Rage: Korsan Öfkesi**. Paket kimliği: `com.piraterage.korsanofkesi` (iki mağazada da aynı; sonradan değiştirilemez).
Ana ekrandaki adı: **Pirate Rage**. Oyun dosyaları uygulamanın içinde (Capacitor 8); hesap, sunucu ve veritabanı web sitesiyle ortak.

## Depoda hazır olanlar

| Ne | Nerede |
|---|---|
| Uygulama ayarı | `capacitor.config.json` |
| Android projesi | `android/` |
| iOS projesi (Xcode, Swift Package Manager) | `ios/` |
| İkon ve açılış ekranı kaynakları | `assets/` (`npx @capacitor/assets generate` ile üretildi) |
| Uygulama paketi derleme | `npm run build:app` (site + oyun derlenir, oyun kök sayfa olur, `npx cap sync`) |
| Google Play paketi (.aab) | GitHub → Actions → **Android sürüm paketi** → Run workflow |
| Uygulama içi satın alma | `src/iap.ts` (RevenueCat), sunucu `/iap/revenuecat`, SQL `030_store_app.sql` |
| Hesap silme (iki mağaza da şart koşar) | Ayarlar → Hesap → Hesabımı sil (`delete_my_account`) |
| Gizlilik politikası | https://www.piraterage.com/gizlilik/ (hesap silme ve mağaza ödemesi eklendi) |

Uygulamada Shopier'e yönlendirme yoktur. İnci yalnızca App Store / Google Play ödemesiyle satılır. Web sitesindeki Shopier aynen çalışır.

## 1. Veritabanı (bir kez)

`supabase/migrations/030_store_app.sql` dosyasını Supabase SQL Editor'de çalıştır. Bu dosya şunları ekler:
- uygulama içi satın alma kayıtları,
- inci yükleme ve iade,
- hesap silme.

## 2. Hesaplar

- **Apple Developer Program:** yıllık 99 USD, https://developer.apple.com/programs/. Şirket olarak açacaksan D-U-N-S numarası gerekir.
- **Google Play Console:** tek seferlik 25 USD, https://play.google.com/console. Kişisel hesapta ilk yayından önce **12 test kullanıcısıyla 14 gün kapalı test** zorunlu.
- **RevenueCat:** ücretsiz başlar, https://www.revenuecat.com. Ödemeleri mağazalarla doğrulayıp oyun sunucusuna bildirir.

## 3. Mağazalarda inci ürünleri

İki mağazada da **tüketilebilir (consumable)** ürün olarak açılır. Ürün kimlikleri bire bir şöyle olmalı:

| Ürün kimliği | Paket | İnci | Fiyat (TL) |
|---|---|---|---|
| `pearls_pouch` | İnci Kesesi | 3.500 | 49,99 |
| `pearls_chest` | İnci Sandığı | 9.200 | 119,99 |
| `pearls_crate` | İnci Kasası | 20.000 | 249,99 |
| `pearls_hold` | Gemi Ambarı | 42.500 | 499,99 |
| `pearls_vault` | Kaptan Hazinesi | 92.000 | 999,99 |
| `pearls_fleet` | Amiral Hazinesi | 196.000 | 1.999,99 |

Apple fiyatları sabit basamaklardan seçilir; en yakın basamağı seç. Apple ve Google %15–30 komisyon alır.

## 4. RevenueCat ayarı

1. Proje aç; App Store uygulamasını ve Play Store uygulamasını ekle (paket kimliği yukarıdaki).
2. Apple tarafı: App Store Connect'te **In-App Purchase Key** oluştur ve RevenueCat'e yükle.
3. Google tarafı: Play Console'da **hizmet hesabı** oluştur ve RevenueCat'e bağla. RevenueCat'in kendi rehberi adım adım anlatıyor.
4. Altı ürünü RevenueCat'e ekle.
5. **Herkese açık SDK anahtarlarını** `src/iap.ts` içindeki `RC_KEYS` alanına yaz: iOS için `appl_…`, Android için `goog_…`. Bunlar gizli değildir, koda yazılabilir. Anahtarlar boşken uygulamada satış kapalı görünür.
6. **Integrations → Webhooks:**
   - URL: `https://game.piraterage.com/iap/revenuecat`
   - Authorization: kendi belirlediğin uzun rastgele bir değer.
   - Aynı değeri VPS'te `/opt/game/.env` dosyasına `REVENUECAT_WEBHOOK_AUTH=...` olarak sen ekle, sonra `pm2 restart game` çalıştır.

Ödeme gelince sunucu inciyi oyuncunun hesabına yükler. Aynı işlem iki kez yüklenmez. Mağaza ödemeyi iade ederse inci geri alınır. VPS kayıtlarında `IAP` satırları görünür.

## 5. Android (Google Play)

1. **Yükleme anahtarı** oluştur. Bilgisayarında bir kez çalıştır, şifreleri sen belirle ve sakla:
   `keytool -genkey -v -keystore upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
2. GitHub depo ayarları → Secrets and variables → Actions bölümüne şunları ekle:
   - `ANDROID_KEYSTORE_BASE64`: `base64 -w0 upload.jks` çıktısı,
   - `ANDROID_KEYSTORE_PASSWORD`,
   - `ANDROID_KEY_ALIAS` (`upload`),
   - `ANDROID_KEY_PASSWORD`.
3. Actions → **Android sürüm paketi** → Run workflow. Sürüm numarasını her yüklemede bir artır. Çıkan `.aab` dosyasını Artifacts bölümünden indir.
4. Play Console:
   - Uygulama oluştur.
   - **Play App Signing**'i açık bırak.
   - `.aab` dosyasını önce Kapalı test kanalına yükle.
   - 12 test kullanıcısıyla 14 gün test et.
   - Sonra Üretim kanalına gönder.

## 6. iOS (App Store)

iOS paketi yalnız **Mac + Xcode** ile derlenir: Mac'in yoksa bulut Mac hizmeti (Codemagic, Bitrise, GitHub macOS) kullanılabilir.

1. Mac'te: `npm ci && npm run build:app`, ardından `npx cap open ios`.
2. Xcode'da App hedefinde:
   - Signing & Capabilities → Team seç.
   - **+ Capability → In-App Purchase** ekle.
3. Product → Archive → Distribute App → App Store Connect.
4. App Store Connect'te uygulamayı oluştur, ürünleri ekle, TestFlight ile dene, incelemeye gönder.

## 7. Mağaza sayfası için gerekenler

- **Ekran görüntüleri:**
  - iPhone: 6,9" (1320×2868 ya da 1290×2796).
  - iPad: 13" (2064×2752), iPad desteği açık kalırsa.
  - Android: telefon için en az 2 adet.
  - Google Play öne çıkan görsel: 1024×500.
- **Uygulama ikonu:** Apple ve Google için 1024×1024 ve 512×512. Şu anki ikon 512 px kaynaktan büyütüldü. Daha net olması için 1024 px bir ikon verirsen `assets/icon-only.png` yerine koyup yeniden üretirim.
- **Kısa ve uzun açıklama, anahtar kelimeler, destek adresi:** destek@piraterage.com.
- **Gizlilik politikası adresi:** https://www.piraterage.com/gizlilik/
- **Yaş derecelendirmesi:** çizgi film tarzı savaş (şiddet: hafif). Uygulama içi satın alma: var. Kullanıcılar arası sohbet: var. Bu yüzden sohbette küfür filtresi, engelleme ve bildirme önerilir. Apple sohbet olan oyunlarda bildirme ve engelleme ister.
- **Apple "App Privacy" ve Google "Data safety" formları:**
  - Toplanan veriler: e-posta, kullanıcı adı, oyun ilerlemesi, satın alma geçmişi.
  - Takip (tracking) yok. Reklam yok.
  - Veriler şifreli bağlantıyla gönderilir. Hesap silinebilir.
- **Apple inceleme notu:**
  - Oyunu deneyecek **test hesabı** (kullanıcı adı ve şifre) yaz.
  - Kayıtlar kapalıysa bu hesap şart.

## 8. Dikkat edilecekler

- `src/login.ts` içindeki `SIGNUPS_OPEN` şu an kapalı. Apple ve Google incelemesi için test hesabı yeterli; yayın günü kaydı açman gerekir.
- Uygulama güncellemesi: oyun dosyaları pakette olduğu için yeni özellikler uygulamaya **yeni sürüm yükleyince** gelir. Sunucu tarafı değişiklikler (VPS, veritabanı) anında geçerlidir.
- Web sitesinde aldığı inci, hesap ortak olduğu için uygulamada da görünür. Apple, uygulama içinden web ödemesine yönlendirmeyi yasaklar; uygulamada böyle bir bağlantı yoktur.
