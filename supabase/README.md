# Derslerim — ortak takvim kurulumu

Bu branch arayüzü, SQL şemasını ve Edge Function kodunu içerir. `course-calendar/config.js` boş bırakıldığı sürece kullanıcılar yalnızca ders seçebilir ve kayıt formunu inceleyebilir. Henüz gerçek Supabase projesi, Turnstile anahtarları veya e-posta alıcısı yapılandırılmadı. Kurulum tamamlanmadan branch'i canlıya birleştirmeyin.

## Kullanım

- Ders seçimi cihazda saklanır; ilk açılışta planlayıcının etkin planı kullanılabilir. Seçimleri yedekleme aracıyla taşımak mümkündür.
- Sınav, ödev veya duyuru ekleyen kişi her kayda bir nickname yazar. Üyelik, kullanıcı tablosu veya öğrenci numarası yoktur.
- Eklenen kayıtlar herkese açıktır. Nickname sahiplik veya düzenleme yetkisi sağlamaz. Düzeltme/silme işlemini site sahibi Supabase panelinden yapar.
- Hatalı bilgi düğmesi bildirimi özel kuyruğa alır. Kullanıcı metin yazmaz, e-posta uygulaması açılmaz. Kuyruk beş dakikada bir işlenir.
- Aynı kaydın aynı sürümü için tek bildirim açılır. Yönetici kaydı düzelttikten sonra yeni sürüm tekrar bildirilebilir.

## Ücretsiz hizmetler ve sınırlar

21 Eylül 2026'da kontrol edilen seçenekler:

| İş | Hizmet | Bu sürümdeki sınır |
| --- | --- | --- |
| Ortak kayıtlar ve sunucu işlevi | [Supabase Free](https://supabase.com/pricing) | Ücretsiz proje; 500 MB veritabanı. Ücretsiz projeler hareketsizlik nedeniyle duraklayabilir. |
| Kayıt/bildirim gönderim doğrulaması | [Cloudflare Turnstile Free](https://developers.cloudflare.com/turnstile/plans/) | Ücretsiz; yalnızca sitenin hostname'i için yapılandırılır. |
| Site sahibine e-posta | [Formspree Free](https://formspree.io/plans) | Ayrı bir form ve doğrulanmış alıcı. Ücretsiz 50 gönderim/ay sınırını paylaşır. |

Bu uygulama ayda en fazla 15 farklı hata bildirimi ve her biri için en fazla 3 teslim denemesi kabul eder. Ayrı sayaç, eski aylardan kalan kuyruk dahil, ayda en fazla 45 gerçek teslim denemesine izin verir. Diğer Formspree formları ve kurulum denemeleri de hesabın kotasını tüketebilir. Bunlar uygulama sınırlarıdır; hizmetlerin fiyat/koşullarını değiştirmeyeceği garantisi değildir. Ücretli plan, kart veya alan adı satın almak gerekmez. Ücretli yükseltme yapmayın; sınır aşılırsa gönderim kapalı kalsın.

Resend'in `onboarding@resend.dev` adresi üretim için kullanılmaz; gerçek gönderim alan adı doğrulaması gerektirdiğinden bu sürüm ona bağlı değildir.

## Kurulum sırası

1. Site sahibinin hesabında **ücretsiz** bir Supabase projesi seçin/oluşturun. Başka uygulamaların kullandığı projede çalışmadan önce tabloları inceleyin. `schema.sql` tek seferlik ilk kurulumdur; mevcut tablo veya kayıtları silmez ve aynı isimler varsa durur. Yeni projede önce `schema.sql`, sonra `catalog.sql` çalıştırın. Kataloğun `2026-09-01`–`2027-02-28` aralığı uygulamanın kayıt penceresidir; resmî akademik takvim iddiası değildir. Dönem yöneticisi tarihleri doğrulamalıdır.
2. `functions/course-calendar/index.ts` ve `handler.mjs` dosyalarını birlikte `course-calendar` Edge Function olarak yükleyin. `verify_jwt=false` olmalı (`config.toml`). Bu, anonim yazmayı serbest bırakmaz: her herkese açık yazma isteği aşağıdaki Turnstile doğrulamasından geçer. CLI kullanacaksanız önce kurulu sürümün `--help` çıktısını okuyun. Kalıcı migration dosyasını Supabase CLI'nin `migration new`/`db pull` akışıyla üretin; zaman damgalı dosya adını elle uydurmayın.
3. Cloudflare Turnstile'da `wololeybus.github.io` için **Managed** bir widget oluşturun. Site anahtarı herkese açıktır; secret yalnızca Edge Function secret'ına yazılır. Üretimde test anahtarları kullanmayın. Kullanıcı genellikle tek tıkla devam eder; Turnstile gerektiğinde ek insan doğrulaması isteyebilir.
4. Formspree'de site sahibinin belirlediği alıcı için ayrı bir form oluşturun ve alıcıyı doğrulayın. Kullanıcılardan e-posta istemeyin. Bu sunucudan gönderilen form için Formspree'nin ayrı reCAPTCHA kontrolünü kapatın; koruma Edge Function'da Turnstile ile zaten uygulanır. `https://formspree.io/f/FORM_ID` uç noktasını sadece sunucu secret'ında tutun. SMTP veya kişisel Gmail şifresi kullanmayın.
5. Edge Function secrets alanını aşağıdaki tabloya göre doldurun. `CALENDAR_REPORTS_ENABLED` başlangıçta **false** olsun. Supabase'in sunucuya sağladığı `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` kullanılır; anahtarı repoya veya tarayıcıya kopyalamayın.
6. Supabase panelinde `pg_cron` ve `pg_net` eklentilerini açın. Vault'ta `calendar_function_url` ve `calendar_worker_secret` değerlerini oluşturun; ikincisi Edge Function'daki worker secret ile aynı olmalı. Sonra `cron.sql` çalıştırın. Bu işlem temizlik ve e-posta kuyruğunu beş dakikada bir çalıştırır. Worker secret en az 32 rastgele karakter olsun ve yalnızca sunucuda bulunsun.
7. `course-calendar/config.js` içine yalnızca işlevin HTTPS adresini ve Turnstile'ın **site** anahtarını yazın. Gerçek service-role/worker/Turnstile secret'ı veya e-posta alıcısı bu dosyaya yazılmaz.
8. Aşağıdaki canlı kontrolü tamamlayın; sonra `CALENDAR_REPORTS_ENABLED=true` yapın. Son olarak branch'i birleştirerek GitHub Pages'e yayınlayın.

| Edge secret | Değer |
| --- | --- |
| `TURNSTILE_SECRET_KEY` | Cloudflare gizli doğrulama anahtarı |
| `CALENDAR_ALLOWED_ORIGINS` | `https://wololeybus.github.io` (sonunda `/` yok; gerekirse virgülle ayrı test origin'i) |
| `CALENDAR_SITE_URL` | `https://wololeybus.github.io/course-calendar/` |
| `CALENDAR_FORM_ENDPOINT` | Sahibin doğruladığı Formspree form adresi |
| `CALENDAR_WORKER_SECRET` | En az 32 rastgele karakter; Vault'takiyle aynı |
| `CALENDAR_REPORTS_ENABLED` | Worker ve gerçek teslim doğrulandıktan sonra `true` |

### Canlı kontrol

- RLS ve tablo/fonksiyon izinlerini Supabase security advisor ile kontrol edin. Anonim anahtarla doğrudan tablo okuma/yazma ve RPC çağrıları reddedilmeli.
- Ayrı test ortamında, açıkça `TEST` başlıklı bir kayıt gönderin; farklı tarayıcıdan seçilen derste görünmesini doğrulayın. Sunucuda katalog, tarih ve tekrar kontrolü çalışmalı.
- Site sahibinin onayladığı alıcıya tek bir test bildirimi gönderin. Kuyruk, cron ve `pg_net` sonuçlarını kontrol edin; panelde başarılı çağrı tek başına e-postanın gelen kutusuna ulaştığını kanıtlamaz. Formspree kota/teslim durumunu ve alıcının gelen kutusunu doğrulayın.
- Hata halinde kuyrukta kayıt kalmasını ve 15 dakika sonra yeniden denemeyi kontrol edin. Üç denemeden sonra durum `failed` olur; yönetici panelden inceler. Ağın teslim cevabı kaybolursa aynı e-posta tekrar gelebilir; tam olarak bir kez teslim garantisi yoktur.
- `cron.sql` yerel PGlite testine dahil değildir; gerçek `pg_cron`, `pg_net`, Vault, Turnstile ve Formspree kurulumunu ayrıca doğrulamak gerekir.

## Veri ve erişim

`calendar_terms` → `calendar_courses` → `calendar_entries` ders kataloğu ve ortak kayıtları tutar. `calendar_reports` ve `calendar_delivery_budget` özel bildirim kuyruğudur. Bütün tablolarda RLS açık; `anon` ve `authenticated` için tablo veya RPC yetkisi yok. RPC'ler `security invoker` ve boş `search_path` kullanır. Açık işlev, salt okunur listeyi ve doğrulanmış ekleme/bildirim işlemlerini sunar. Yalnızca sunucudaki service-role yetkilidir.

İstemcinin seçtiği ders listesi sunucuya gönderilmez; dönem listesi alınır, filtre tarayıcıda uygulanır. GPA, notlar, profil, transkript, planlar ve yedek dosyaları veritabanına taşınmaz. Form açıkça izin verilen alanları gönderir. E-postaya yalnızca bildirilen ders/kayıt, tarih/saat/yer, bağlantı ve bildirim numarası eklenir; nickname ve açıklama gönderilmez. Gönderi sayısı günde 200 ve dönem başına 3000 ile sınırlıdır.

Nickname ve serbest metin kişisel veri içerebilir; sağlayıcılar bağlantı/log verileri işleyebilir. Bu tasarım tam anonimlik veya KVKK muafiyeti iddiası değildir. Canlı açılıştan önce veri sorumlusunun iletişim bilgisi, amaç, gerçek hizmet sağlayıcılar, saklama süreleri ve başvuru yöntemiyle kısa aydınlatma metnini tamamlayın. Uygulama düzeyindeki temizlik sağlayıcı loglarını, servis yedeklerini veya alıcının posta kutusunu silmez.

İlk katalog için `purge_after=2027-09-01`: bu tarihte dönem kayıtları ve bağlı bildirimleri zamanlanmış görev siler. Eski `sent`/`failed` bildirimler 60 gün sonra temizlenir. Saklama politikasını yayınlamadan önce site sahibi bu süreleri doğrulamalıdır. Ders kataloğu ve toplam gönderim sayaçları kişisel içerik içermez.

## Yönetim ve geri dönüş

Düzeltme için Table Editor'da `calendar_entries` kaydını düzenleyin. Güncelleme zamanı trigger ile yenilenir. Silmek bağlı bildirimleri de siler; gerekirse önce kaydı dışa aktarın. Bir nicknamela giriş/düzenleme yolu eklemeyin.

Gönderimi durdurmak için önce `CALENDAR_REPORTS_ENABLED=false` yapın. Yeni kayıt paylaşımını kapatmak için ilgili dönemin `active=false` değerini kullanın. Tam bağlantıyı kesmek için `course-calendar/config.js` değerlerini boşaltın. Önceki araçlar ve yerel yedekler kullanılmaya devam eder. Veritabanını silmeye gerek yoktur.

## Tekrarlanabilir yerel kontroller

Node 22+:

```sh
node tests/academic-integration.cjs
node --test tests/calendar.mjs
```

Gerçek Postgres motorunda şema, yetki, tekrar ve kuyruk kontrolleri için geliştirme klasörüne sabit sürümü kurun (siteye bağımlılık eklemez):

```sh
npm install --prefix /tmp/iyte-calendar-checks --save-exact @electric-sql/pglite@0.5.8 jsdom@26.1.0
PGLITE_MODULE=/tmp/iyte-calendar-checks/node_modules/@electric-sql/pglite/dist/index.js node --test tests/calendar-database.mjs
JSDOM_MODULE=/tmp/iyte-calendar-checks/node_modules/jsdom/lib/api.js node --test tests/calendar-ui.mjs
```

Testler bellekte sahte kayıtlar ve taklit ağ yanıtları kullanır. Gerçek Supabase projesine, Turnstile'a veya posta kutusuna istek göndermez.

Referanslar: [Edge kimlik doğrulaması](https://supabase.com/docs/guides/functions/auth), [Sunucu secret'ları](https://supabase.com/docs/guides/functions/secrets), [Zamanlanmış işlevler](https://supabase.com/docs/guides/functions/schedule-functions), [Turnstile sunucu doğrulaması](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Formspree JSON gönderimi](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax/).
