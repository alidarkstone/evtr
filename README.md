# EVTR

Togg T10X / T10F sorun çözüm rehberi. Statik site, sunucu gerekmez.

## Dosyalar
- `index.html`, `style.css`, `app.js`: arayüz ve arama
- `data.js`: 25 sorun kaydı (`window.TOGG_DATA`). Yeni sorun eklemek için bu dosyaya kayıt ekle.

## Ücretsiz yayın
**GitHub Pages (önerilen):** GitHub'da `evtr` adlı repo oluştur, bu klasördeki dosyaları yükle, Settings > Pages > Branch: `main` / root. Adres: `https://<kullanıcı>.github.io/evtr/`

**Netlify:** app.netlify.com/drop adresine klasörü sürükle, site adını `evtr` yap. Adres: `https://evtr.netlify.app`

`evtr.com` gibi özel alan adı satın alınırsa her iki serviste de ücretsiz bağlanabilir.

## Geri bildirim butonları
"İşe yaradı / yaramadı" oyları şu an ziyaretçinin tarayıcısında saklanır. Toplu sayım için `index.html`'de `window.FEEDBACK_URL` tanımla (ör. Google Apps Script web uygulaması URL'si); oylar oraya POST edilir.
