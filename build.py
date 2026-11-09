"""data.js'ten her sorun için ayrı SEO sayfası (sorun/<id>.html), index'e bağlantı listesi ve sitemap.xml üretir.
Kullanım: python3 build.py [https://site-adresi]"""
import json, html, re, sys, os
BASE = (sys.argv[1] if len(sys.argv) > 1 else '').rstrip('/')
os.chdir(os.path.dirname(os.path.abspath(__file__)))
raw = open('data.js', encoding='utf-8').read()
data = json.loads(raw[raw.index('['):raw.rindex(']') + 1])
e = html.escape
os.makedirs('sorun', exist_ok=True)

def page(d):
    models = ' ve '.join(d.get('models', []))
    title = f"Togg {models}: {d['title']} – Çözüm Adımları | EVTR"
    desc = f"Togg {models} '{d['title'].lower()}' sorunu için adım adım çözüm: " + ' '.join(s['text'] for s in d['steps'])[:120] + '…'
    steps = ''.join(f"<li>{e(s['text'])}</li>" for s in d['steps'])
    comm = ''.join(f"<li>{e(c['tip'])} <a href=\"{e(c.get('url',''))}\" rel=\"nofollow noopener\" target=\"_blank\">{e(c.get('source','kaynak'))}</a></li>" for c in d.get('community', []))
    src = ' · '.join(f"<a href=\"{e(s['url'])}\" rel=\"nofollow noopener\" target=\"_blank\">{e(s['name'])}</a>" for s in d.get('sources', []))
    ld = {"@context": "https://schema.org", "@type": "HowTo", "name": d['title'], "inLanguage": "tr",
          "step": [{"@type": "HowToStep", "position": i + 1, "text": s['text']} for i, s in enumerate(d['steps'])]}
    canon = f'<link rel="canonical" href="{BASE}/sorun/{d["id"]}.html">' if BASE else ''
    return f"""<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title><meta name="description" content="{e(desc)}">{canon}
<link rel="stylesheet" href="../style.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script></head>
<body><header class="top"><a class="brand" href="../index.html"><span class="dot"></span>EVTR</a></header>
<main><article class="card open static">
<div class="card-h"><span><h1>{e(d['title'])}</h1><span class="tags"><span class="tag">{e(d.get('category',''))}</span><span class="tag">Togg {e(models)}</span></span></span></div>
<div class="card-b"><ol class="steps plain">{steps}</ol>
{f'<div class="warn">⚠︎ {e(d["warning"])}</div>' if d.get('warning') else ''}
{f'<div class="comm"><h3>Topluluk çözümleri</h3><ul>{comm}</ul></div>' if comm else ''}
<div class="src">Bu çözüm internetteki herkese açık kaynaklardan derlenmiştir; resmi Togg talimatı değildir.<br>Kaynaklar: {src}</div>
</div></article>
<p class="back"><a href="../index.html?q={e(d['title'])}">← Başka bir sorun ara</a></p></main>
<footer class="foot"><p>EVTR bağımsız bir bilgi derlemesidir; Togg ile bağlantılı değildir. Ayrıntılar için ana sayfadaki yasal uyarıya bakın.</p></footer>
</body></html>"""

for d in data:
    open(f"sorun/{d['id']}.html", 'w', encoding='utf-8').write(page(d))

# index'e taranabilir bağlantı listesi
links = '\n'.join(f'    <li><a href="sorun/{e(d["id"])}.html">{e(d["title"])}</a></li>' for d in data)
block = f'<nav class="all" id="all" aria-label="Tüm sorunlar">\n  <h2>Tüm sorunlar</h2>\n  <ul>\n{links}\n  </ul>\n</nav>'
idx = open('index.html', encoding='utf-8').read()
idx = re.sub(r'<nav class="all".*?</nav>\n?', '', idx, flags=re.S)
idx = idx.replace('</main>', block + '\n</main>')
open('index.html', 'w', encoding='utf-8').write(idx)

if BASE:
    urls = [f'{BASE}/'] + [f'{BASE}/sorun/{d["id"]}.html' for d in data]
    open('sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '</urlset>\n')
    open('robots.txt', 'w').write(f'User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n')
print(len(data), 'sayfa üretildi')
