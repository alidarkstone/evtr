(() => {
  const DATA = window.TOGG_DATA || [];
  const $ = s => document.querySelector(s);
  const q = $('#q'), results = $('#results'), suggest = $('#suggest');
  let model = 'all';

  // Basit SVG görseller (adım tipine göre)
  const P = {
    bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    cable:'<path d="M9 2v5M15 2v5M7 7h10v4a5 5 0 0 1-10 0zM12 16v3a3 3 0 0 0 3 3h4"/>',
    screen:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    app:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4M9 7h6M9 11h6"/>',
    phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    car:'<path d="M3 16v-4l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4z"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/><path d="M3 12h18"/>',
    key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
    battery:'<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2M6 10v4M10 10v4"/>',
    tire:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    warning:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    service:'<path d="M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3z"/><path d="M14 6l3-3"/>',
    ac:'<path d="M12 2v20M4 7l16 10M20 7 4 17"/>',
    door:'<path d="M5 3h10l4 4v14H5z"/><path d="M15 12h2"/>',
    seat:'<path d="M7 3v10h10M7 13l-2 8M17 13l2 8M7 7h6"/>',
    light:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11v2h6v-2a6 6 0 0 0-3-11z"/>',
    map:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    reset:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    wifi:'<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01"/>'
  };
  const svg = k => `<svg viewBox="0 0 24 24" class="ico" aria-hidden="true">${P[k] || P.check}</svg>`;

  // Türkçe normalizasyon
  const norm = s => (s || '').toLocaleLowerCase('tr')
    .replace(/[ıi̇]/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u')
    .replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const STOP = new Set(['ve','bir','bu','da','de','ile','icin','cok','ama','ben','benim','aracim','arac','togg','t10x','t10f','neden','nasil','oluyor','var','yok','mi','mu','ne','gibi']);

  const index = DATA.map(d => ({
    d,
    title: norm(d.title),
    kw: (d.keywords || []).map(norm),
    body: norm([d.category, ...(d.steps || []).map(s => s.text)].join(' '))
  }));

  // Önek / kısmi eşleşme (Türkçe ekler için kök benzerliği)
  const tokMatch = (t, text) => {
    if (text.includes(t)) return 1;
    if (t.length >= 5 && text.includes(t.slice(0, t.length - 2))) return .7;
    return 0;
  };

  function search(raw) {
    const nq = norm(raw);
    const toks = nq.split(' ').filter(t => t.length > 1 && !STOP.has(t));
    if (!toks.length) return [];
    return index.map(it => {
      if (model !== 'all' && it.d.models && !it.d.models.includes(model)) return null;
      let s = 0;
      if (it.kw.some(k => k && nq.includes(k))) s += 6;
      for (const t of toks) {
        s += 4 * tokMatch(t, it.title);
        s += 3 * Math.max(0, ...it.kw.map(k => tokMatch(t, k)));
        s += 1 * tokMatch(t, it.body);
      }
      return s > 0 ? { d: it.d, s } : null;
    }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 6);
  }

  // Kontrol yerleşim şeması: iç mekân / dış görünüş üzerinde konum vurgusu
  const CTL = window.TOGG_CONTROLS || {};
  const ZONES = {
    'dash-left':[70,58,'in'],'dash-center':[150,52,'in'],'screen':[150,52,'in'],'roof-console':[150,14,'in'],
    'steering-left':[66,96,'in'],'steering-right':[104,96,'in'],'steering-column':[118,80,'in'],
    'center-console':[150,118,'in'],'door':[18,90,'in'],
    'exterior-left':[60,40,'out'],'exterior-right':[60,100,'out'],'exterior-front':[182,70,'out'],'exterior-rear':[22,70,'out'],'trunk':[30,70,'out']
  };
  const BASE_IN = '<rect x="10" y="30" width="280" height="40" rx="10" class="b"/><rect x="100" y="36" width="100" height="28" rx="4" class="b"/><circle cx="85" cy="96" r="30" class="b"/><circle cx="85" cy="96" r="8" class="b"/><rect x="130" y="100" width="40" height="44" rx="8" class="b"/><rect x="120" y="6" width="60" height="16" rx="6" class="b"/><path d="M4 70v80" class="b"/>';
  const BASE_OUT = '<rect x="15" y="25" width="180" height="90" rx="36" class="b"/><rect x="60" y="35" width="90" height="70" rx="18" class="b"/><rect x="40" y="18" width="24" height="10" rx="3" class="b"/><rect x="140" y="18" width="24" height="10" rx="3" class="b"/><rect x="40" y="112" width="24" height="10" rx="3" class="b"/><rect x="140" y="112" width="24" height="10" rx="3" class="b"/><text x="160" y="136" class="t">ön →</text>';
  function ctlFig(id) {
    const c = CTL[id]; if (!c || !ZONES[c.zone]) return '';
    const [x, y, k] = ZONES[c.zone];
    const vb = k === 'in' ? '0 0 300 150' : '0 0 210 140';
    return `<figure class="ctl"><svg viewBox="${vb}" aria-hidden="true">${k === 'in' ? BASE_IN : BASE_OUT}<circle cx="${x}" cy="${y}" r="13" class="pulse"/><circle cx="${x}" cy="${y}" r="6" class="hit"/></svg>
      <figcaption><strong>${esc(c.label)}</strong>: ${esc(c.location)}${c.source ? ` <a href="${esc(c.source)}" target="_blank" rel="noopener">kaynak</a>` : ''}<br><small>Şematik çizimdir, ölçekli değildir.</small></figcaption></figure>`;
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function card(d, open) {
    const steps = (d.steps || []).map((s, i) =>
      `<li class="step"><div class="vis"><span class="n">${i + 1}</span>${svg(s.visual)}</div><div><p>${esc(s.text)}</p>${ctlFig(s.control)}</div></li>`).join('');
    const src = (d.sources || []).map(s =>
      `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join(' · ');
    const comm = (d.community || []).map(c =>
      `<li>${esc(c.tip)} ${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.source || 'kaynak')}</a>` : esc(c.source || '')}</li>`).join('');
    const solved = (d.solved || []).map(c =>
      `<li>${esc(c.tip)} ${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.source || 'kaynak')}</a>` : ''}</li>`).join('');
    return `<article class="card${open ? ' open' : ''}" data-id="${esc(d.id)}">
      <button class="card-h" aria-expanded="${open}">
        <span class="ic">${svg(d.icon)}</span>
        <span><h2>${esc(d.title)}</h2><span class="tags"><span class="tag">${esc(d.category || '')}</span><span class="tag">${esc((d.models || []).join(', '))}</span>${d.chronic ? '<span class="badge">Kronik</span>' : ''}</span></span>
        <svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="card-b">
        <ol class="steps">${steps}</ol>
        ${d.warning ? `<div class="warn">⚠︎ ${esc(d.warning)}</div>` : ''}
        ${solved ? `<div class="solved"><h3>✓ Kullanıcılarda işe yarayan çözümler</h3><ul>${solved}</ul></div>` : ''}
        ${comm ? `<div class="comm"><h3>Topluluk çözümleri</h3><ul>${comm}</ul></div>` : ''}
        <div class="src">Bu çözüm internetteki herkese açık kaynaklardan derlenmiştir; resmi Togg talimatı değildir.${src ? `<br>Kaynaklar: ${src}` : ''}</div>
        ${fb(d.id)}
      </div>
    </article>`;
  }

  function render() {
    const v = q.value.trim();
    document.body.classList.toggle('searching', v.length > 0);
    if (!v) { results.innerHTML = ''; return; }
    const r = search(v);
    if (!r.length) {
      results.innerHTML = `<div class="empty"><strong>Eşleşen çözüm bulunamadı.</strong><br>Farklı kelimelerle dene (ör. "şarj", "ekran", "anahtar") ya da Togg Care ile iletişime geç.</div>`;
      return;
    }
    results.innerHTML = `<p class="meta">${r.length} çözüm bulundu</p><div class="split"><div class="list">` +
      r.map((x, i) => card(x.d, i === 0)).join('') + `</div><aside class="detail" id="detail" aria-live="polite"></aside></div>`;
    syncDetail();
  }

  // Geniş ekranda açık kartın içeriği sağ panelde gösterilir
  const wide = matchMedia('(min-width: 900px)');
  function syncDetail() {
    const det = $('#detail'); if (!det) return;
    document.body.classList.toggle('wide', wide.matches);
    const open = results.querySelector('.list .card.open');
    if (!wide.matches || !open) { det.innerHTML = ''; det.removeAttribute('data-id'); return; }
    det.dataset.id = open.dataset.id;
    det.innerHTML = `<h2 class="d-title">${open.querySelector('h2').innerHTML}</h2>` + open.querySelector('.card-b').innerHTML;
    det.scrollTop = 0;
    slides(det);
  }

  // Sunum modu: adımlar slayt gibi, tek tek gösterilir
  function slides(root) {
    const steps = [...root.querySelectorAll('.steps .step')]; if (steps.length < 2) return;
    const ol = root.querySelector('.steps'); ol.classList.add('deck');
    const nav = document.createElement('div'); nav.className = 'deck-nav';
    nav.innerHTML = `<button data-go="-1" aria-label="Önceki">‹</button><span class="dots">${steps.map((_, i) => `<i data-i="${i}"></i>`).join('')}</span><span class="cnt"></span><button data-go="1" aria-label="Sonraki">›</button>`;
    ol.after(nav);
    let cur = 0;
    const show = i => { cur = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach((s, k) => s.classList.toggle('on', k === cur));
      nav.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === cur));
      nav.querySelector('.cnt').textContent = `Adım ${cur + 1} / ${steps.length}`;
      nav.querySelector('[data-go="-1"]').disabled = cur === 0;
      nav.querySelector('[data-go="1"]').disabled = cur === steps.length - 1; };
    nav.addEventListener('click', e => { const b = e.target.closest('[data-go]'), d = e.target.closest('[data-i]');
      if (b) show(cur + +b.dataset.go); if (d) show(+d.dataset.i); e.stopPropagation(); });
    root._go = dx => show(cur + dx);
    show(0);
  }
  document.addEventListener('keydown', e => { const det = $('#detail');
    if (!det || !det._go || document.activeElement === q) return;
    if (e.key === 'ArrowRight') det._go(1); if (e.key === 'ArrowLeft') det._go(-1); });
  wide.addEventListener('change', syncDetail);

  // Geri bildirim: İşe yaradı / yaramadı (tarayıcıda saklanır; opsiyonel FEEDBACK_URL'e gönderilir)
  const FB_KEY = 'evtr-fb';
  const fbGet = () => { try { return JSON.parse(localStorage.getItem(FB_KEY)) || {}; } catch { return {}; } };
  const fbSet = o => { try { localStorage.setItem(FB_KEY, JSON.stringify(o)); } catch {} };
  function fb(id) {
    const v = fbGet()[id];
    if (v) return `<div class="helpful done">${v === 'yes' ? '✓ Teşekkürler, işe yaradığına sevindik.' : 'Üzgünüz. Togg Care: <a href="tel:08502228644">0850 222 86 44</a>'}</div>`;
    return `<div class="helpful"><span>Bu çözüm işe yaradı mı?</span>
      <button data-fb="yes">👍 İşe yaradı</button><button data-fb="no">👎 İşe yaramadı</button></div>`;
  }

  results.addEventListener('click', e => {
    const b = e.target.closest('[data-fb]');
    if (b) {
      const id = b.closest('[data-id]').dataset.id, o = fbGet();
      o[id] = b.dataset.fb; fbSet(o);
      if (window.FEEDBACK_URL) fetch(window.FEEDBACK_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ id, vote: b.dataset.fb }) }).catch(() => {});
      results.querySelectorAll(`[data-id="${id}"] .helpful`).forEach(x => x.outerHTML = fb(id));
      return;
    }
    const h = e.target.closest('.card-h'); if (!h) return;
    const c = h.parentElement;
    if (wide.matches) results.querySelectorAll('.list .card.open').forEach(x => { if (x !== c) x.classList.remove('open'); });
    c.classList.toggle('open', wide.matches ? true : !c.classList.contains('open'));
    results.querySelectorAll('.card-h').forEach(x => x.setAttribute('aria-expanded', x.parentElement.classList.contains('open')));
    syncDetail();
  });

  let t; q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 80); });
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); q.focus(); q.select(); }
    if (e.key === 'Escape') { q.value = ''; render(); }
  });
  document.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); model = b.dataset.model; render();
  }));

  // Popüler aramalar
  const pop = ['Gıcırtı sesi', 'Kamera görüntüsü yok', 'Şarj başlamıyor', 'Ekran donuyor', 'Dijital anahtar çalışmıyor', 'Menzil düştü', 'Yazılım güncellemesi', 'Lastik basıncı uyarısı'];
  suggest.innerHTML = pop.map(p => `<button>${p}</button>`).join('');
  suggest.addEventListener('click', e => { if (e.target.tagName === 'BUTTON') { q.value = e.target.textContent; render(); q.focus(); } });

  // URL ?q= desteği
  const u = new URLSearchParams(location.search).get('q');
  if (u) { q.value = u; render(); }
  q.focus();
})();
