# İYTE Fizik Araçları

Statik GitHub Pages yapısı.

## Yapı

- `index.html`: ana karşılama/portal sayfası
- `calculator/index.html`: tek GPA hesaplama arayüzü
- `curricula/index.html`: müfredat görüntüleyici
- `resources/index.html`: ileride genişletilecek kaynaklar alanı
- `assets/js/curricula.js`: 2021–2025 müfredat verilerinin tek kaynağı
- `assets/js/calculator.js`: ortak GPA motoru
- `assets/css/*`: ortak ve sayfa bazlı stiller

## GitHub Pages'e yükleme

Bu klasörün içeriğini repository köküne yükle. GitHub Pages kullanıyorsan `Settings → Pages` altında branch'i seçip root (`/`) klasöründen yayınla.

Doğrudan yıl linkleri desteklenir:

- `calculator/?year=2021`
- `calculator/?year=2022`
- `calculator/?year=2023`
- `calculator/?year=2024`
- `calculator/?year=2025`

## Yeni yıl ekleme

Yeni müfredatı `assets/js/curricula.js` içindeki `window.CURRICULA` nesnesine aynı formatta eklemek yeterli. Hesaplayıcı ve müfredat görüntüleyici yılı otomatik listeler.
