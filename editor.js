/* Photo editor for posts and stories: filters, text, wardrobe items pasted on the photo, GIF stickers, "what I wear" strip.
   EDITOR.open({src, mode:'post'|'story', state}) -> Promise<null | {img, gifs, ov, worn, showFit, state}>
   - filters, text and wardrobe stickers are baked into the pixels; GIFs stay a separate overlay layer (they keep moving).
   - the filter is a per-pixel colour transform (ctx.filter is not supported on every Safari). */
(function () {
  'use strict';
  const LANG = () => (window.I18N && I18N.lang) || 'ru';
  const TX = {
    ru: { title: 'Редактор', cancel: 'Отмена', done: 'Готово', filters: 'Фильтры', text: 'Текст', items: 'Вещи', gif: 'GIF', amount: 'Сила фильтра', addText: '+ Текст', defText: 'Текст', typeHere: 'Введите текст', bg: 'Фон', del: 'Удалить', noSel: 'Выберите текст на фото', itemsHint: 'Нажмите на вещь — она появится на фото. Галочка — «на мне» (покажем под фото).', wear: 'На мне', showFit: 'Показать под фото, во что я одет(а)', noItems: 'В гардеробе пока нет вещей', gifSearch: 'Поиск GIF', gifUpload: 'Загрузить свой GIF', gifOff: 'Поиск GIF не подключён — можно загрузить свой файл.', gifBig: 'GIF слишком большой (до 260 КБ)', gifBad: 'Это не GIF', gifMax: 'Не больше 3 своих GIF и 8 наклеек', none: 'Нет', loading: 'Загрузка…', nothing: 'Ничего не найдено', err: 'Не удалось подготовить фото', f: { none: 'Оригинал', vivid: 'Яркий', warm: 'Тёплый', cool: 'Холодный', bw: 'Ч/б', noir: 'Нуар', sepia: 'Сепия', fade: 'Выцветший', vintage: 'Винтаж', drama: 'Драма' } },
    uk: { title: 'Редактор', cancel: 'Скасувати', done: 'Готово', filters: 'Фільтри', text: 'Текст', items: 'Речі', gif: 'GIF', amount: 'Сила фільтра', addText: '+ Текст', defText: 'Текст', typeHere: 'Введіть текст', bg: 'Тло', del: 'Видалити', noSel: 'Оберіть текст на фото', itemsHint: 'Натисніть на річ — вона з’явиться на фото. Пташка — «на мені» (покажемо під фото).', wear: 'На мені', showFit: 'Показати під фото, у що я вдягнений(а)', noItems: 'У гардеробі поки немає речей', gifSearch: 'Пошук GIF', gifUpload: 'Завантажити свій GIF', gifOff: 'Пошук GIF не підключено — можна завантажити свій файл.', gifBig: 'GIF завеликий (до 260 КБ)', gifBad: 'Це не GIF', gifMax: 'Не більше 3 своїх GIF і 8 наліпок', none: 'Ні', loading: 'Завантаження…', nothing: 'Нічого не знайдено', err: 'Не вдалося підготувати фото', f: { none: 'Оригінал', vivid: 'Яскравий', warm: 'Теплий', cool: 'Холодний', bw: 'Ч/б', noir: 'Нуар', sepia: 'Сепія', fade: 'Вицвілий', vintage: 'Вінтаж', drama: 'Драма' } },
    en: { title: 'Editor', cancel: 'Cancel', done: 'Done', filters: 'Filters', text: 'Text', items: 'Items', gif: 'GIF', amount: 'Filter strength', addText: '+ Text', defText: 'Text', typeHere: 'Type text', bg: 'Background', del: 'Delete', noSel: 'Select a text on the photo', itemsHint: 'Tap an item to paste it on the photo. The tick means “I wear this” (shown under the photo).', wear: 'I wear it', showFit: 'Show what I wear under the photo', noItems: 'No items in your wardrobe yet', gifSearch: 'Search GIFs', gifUpload: 'Upload your own GIF', gifOff: 'GIF search is not connected — you can upload your own file.', gifBig: 'GIF is too large (up to 260 KB)', gifBad: 'This is not a GIF', gifMax: 'Up to 3 own GIFs and 8 stickers', none: 'None', loading: 'Loading…', nothing: 'Nothing found', err: 'Could not prepare the photo', f: { none: 'Original', vivid: 'Vivid', warm: 'Warm', cool: 'Cool', bw: 'B&W', noir: 'Noir', sepia: 'Sepia', fade: 'Faded', vintage: 'Vintage', drama: 'Drama' } }
  };
  const tx = (k) => { const v = (TX[LANG()] || TX.ru)[k]; return v === undefined ? TX.ru[k] : v; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FILTERS = {
    none: {}, vivid: { c: 1.12, s: 1.45, b: 1.03 }, warm: { t: [20, 6, -16], s: 1.1, c: 1.04 }, cool: { t: [-14, 2, 20], s: 1.05 },
    bw: { s: 0, c: 1.1 }, noir: { s: 0, c: 1.4, b: .92 }, sepia: { sep: .85, c: 1.05 }, fade: { c: .82, b: 1.1, s: .8, t: [8, 8, 12] },
    vintage: { sep: .35, c: .95, s: .85, t: [14, 4, -8] }, drama: { c: 1.3, s: 1.2, b: .92 }
  };
  function applyFilter(data, f, k) { // data: Uint8ClampedArray RGBA, f: filter params, k: 0..1 strength
    const b = f.b || 1, c = f.c || 1, s = f.s == null ? 1 : f.s, sep = f.sep || 0, t = f.t || [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) {
      const r0 = data[i], g0 = data[i + 1], b0 = data[i + 2];
      let r = r0 * b, g = g0 * b, bl = b0 * b;
      r = (r - 128) * c + 128; g = (g - 128) * c + 128; bl = (bl - 128) * c + 128;
      const l = .299 * r + .587 * g + .114 * bl;
      r = l + (r - l) * s; g = l + (g - l) * s; bl = l + (bl - l) * s;
      if (sep) { const sr = .393 * r + .769 * g + .189 * bl, sg = .349 * r + .686 * g + .168 * bl, sb = .272 * r + .534 * g + .131 * bl; r += (sr - r) * sep; g += (sg - g) * sep; bl += (sb - bl) * sep; }
      r += t[0]; g += t[1]; bl += t[2];
      data[i] = r0 + (r - r0) * k; data[i + 1] = g0 + (g - g0) * k; data[i + 2] = b0 + (bl - b0) * k;
    }
  }
  const loadImage = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  const dataBytes = (u) => Math.round((u.length - u.indexOf(',') - 1) * 3 / 4);
  async function thumb(src, max, limit) { // small tile for the "what I wear" strip
    const im = await loadImage(src); max = max || 160; limit = limit || 28 * 1024;
    for (let m = max; m >= 80; m -= 30) {
      const k = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      for (let q = .75; q >= .35; q -= .1) { let u = c.toDataURL('image/webp', q); if (!u.startsWith('data:image/webp')) u = c.toDataURL('image/jpeg', q); if (dataBytes(u) <= limit) return u; }
    }
    throw new Error('thumb');
  }
  const CSS = `
.ed{position:fixed;inset:0;z-index:400;background:#000;color:#fff;display:flex;flex-direction:column;font:inherit;touch-action:manipulation;user-select:none;-webkit-user-select:none;animation:mf .2s ease}
.ed-top{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:calc(8px + env(safe-area-inset-top,0px)) 12px 8px}.ed-top b{font-size:15px}
.ed-top button{border:0;background:none;color:#fff;font:inherit;font-weight:700;font-size:15px;padding:8px 6px;cursor:pointer}.ed-top .ed-ok{background:#fff;color:#000;border-radius:20px;padding:8px 18px;font-weight:800}
.ed-area{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ed-stage{position:relative;background:#111;overflow:hidden;touch-action:none;flex:none}.ed-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.ed-el{position:absolute;transform-origin:center;touch-action:none;cursor:grab;-webkit-tap-highlight-color:transparent}.ed-el.sel{outline:2px dashed rgba(255,255,255,.9);outline-offset:4px}
.ed-el img{width:100%;display:block;pointer-events:none;-webkit-user-drag:none}.ed-tx{font-weight:800;white-space:pre;line-height:1.2;text-shadow:0 1px 6px rgba(0,0,0,.35);font-family:-apple-system,system-ui,sans-serif}.ed-tx.bg{text-shadow:none;border-radius:.25em;padding:.1em .4em}
.ed-sel{display:flex;gap:6px;justify-content:center;align-items:center;padding:6px 10px;min-height:44px}.ed-sel button{border:0;background:#262626;color:#fff;width:44px;height:36px;border-radius:18px;font:inherit;font-weight:800;font-size:17px;cursor:pointer}.ed-sel button.dl{color:#ff6b6b}
.ed-tabs{display:flex;gap:4px;padding:4px 10px;justify-content:center}.ed-tabs button{flex:1;border:0;background:#1a1a1a;color:#aaa;font:inherit;font-weight:800;font-size:13px;padding:10px 4px;border-radius:18px;cursor:pointer}.ed-tabs button.on{background:#fff;color:#000}
.ed-pn{height:150px;overflow:auto;padding:8px 10px calc(10px + env(safe-area-inset-bottom,0px));-webkit-overflow-scrolling:touch}
.ed-fl{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px}.ed-fl button{flex:none;border:0;background:none;color:#ccc;font:inherit;font-size:11px;font-weight:700;cursor:pointer;padding:0;width:64px}.ed-fl button canvas{width:64px;height:64px;border-radius:12px;display:block;margin-bottom:4px;outline:2px solid transparent}.ed-fl button.on{color:#fff}.ed-fl button.on canvas{outline-color:#fff}
.ed-rg{display:flex;align-items:center;gap:10px;font-size:12px;color:#aaa;margin-top:4px}.ed-rg input{flex:1}
.ed-tr{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.ed-tr input[type=text]{flex:1;min-width:120px;border:1px solid #333;background:#161616;color:#fff;border-radius:12px;padding:10px 12px;font:inherit;font-size:16px}.ed-tr input:disabled{opacity:.4}
.ed-sw{width:28px;height:28px;border-radius:50%;border:2px solid #444;cursor:pointer;flex:none;padding:0}.ed-sw.on{border-color:#fff;transform:scale(1.15)}
.ed-b{border:0;background:#262626;color:#fff;font:inherit;font-weight:700;font-size:13px;border-radius:16px;padding:9px 13px;cursor:pointer}.ed-b.on{background:#fff;color:#000}
.ed-ig{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px}.ed-ig .ed-it{position:relative;border:0;padding:0;background:#fff;border-radius:12px;aspect-ratio:1;overflow:hidden;cursor:pointer}.ed-ig .ed-it img{width:100%;height:100%;object-fit:contain;display:block}
.ed-ig .ed-ck{position:absolute;right:3px;top:3px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;border:1.5px solid #fff;font-size:13px;display:flex;align-items:center;justify-content:center}.ed-ig .ed-it.w .ed-ck{background:#2ecc71;border-color:#2ecc71}
.ed-note{font-size:12px;color:#999;margin:6px 0}.ed-gg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.ed-gg button{border:0;padding:0;background:#222;border-radius:10px;aspect-ratio:1;overflow:hidden;cursor:pointer}.ed-gg img{width:100%;height:100%;object-fit:cover;display:block}
.ed-err{position:absolute;left:12px;right:12px;bottom:200px;background:#ff4d6d;color:#fff;padding:9px 12px;border-radius:12px;font-weight:700;font-size:13px;text-align:center;z-index:5}
`;
  function injectCss() { if (document.getElementById('ed-css')) return; const s = document.createElement('style'); s.id = 'ed-css'; s.textContent = CSS; document.head.appendChild(s); }
  const COLORS = ['#ffffff', '#000000', '#ff4d6d', '#ffd23f', '#3ddc84', '#4cc9f0', '#b388ff'];
  let uidN = 0;

  async function open(o) {
    injectCss(); o = o || {};
    const mode = o.mode === 'story' ? 'story' : 'post';
    let base;
    try { base = await loadImage(o.src); } catch (e) { if (window.toast) toast(tx('err')); return null; }
    const BIG = 1080, k0 = Math.min(1, BIG / Math.max(base.width, base.height));
    const CW = Math.max(1, Math.round(base.width * k0)), CH = Math.max(1, Math.round(base.height * k0));
    const PK = Math.min(1, 760 / Math.max(CW, CH)), PW = Math.max(1, Math.round(CW * PK)), PH = Math.max(1, Math.round(CH * PK));
    const prevSt = o.state || {};
    const E = { filter: prevSt.filter || 'none', amt: prevSt.amt == null ? 100 : prevSt.amt, els: (prevSt.els || []).map((e) => ({ ...e, id: ++uidN })), sel: null, worn: new Set(prevSt.worn || []), showFit: prevSt.showFit !== false, tab: 'filters' };
    const imgCache = new Map(); // wardrobe item id -> HTMLImageElement
    const items = (typeof S !== 'undefined' && S.items) || [];

    return new Promise((resolve) => {
      const root = document.createElement('div'); root.className = 'ed'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', tx('title'));
      root.innerHTML = `<div class="ed-top"><button type="button" id="ed-x">${esc(tx('cancel'))}</button><b>${esc(tx('title'))}</b><button type="button" class="ed-ok" id="ed-ok">${esc(tx('done'))}</button></div>
        <div class="ed-area" id="ed-area"><div class="ed-stage" id="ed-st"><canvas id="ed-cv" width="${PW}" height="${PH}"></canvas><div id="ed-ly"></div></div></div>
        <div class="ed-sel" id="ed-sel"></div>
        <div class="ed-tabs"><button type="button" data-t="filters">${esc(tx('filters'))}</button><button type="button" data-t="text">${esc(tx('text'))}</button><button type="button" data-t="items">${esc(tx('items'))}</button><button type="button" data-t="gif">${esc(tx('gif'))}</button></div>
        <div class="ed-pn" id="ed-pn"></div>`;
      document.body.appendChild(root); const prevOv = document.body.style.overflow; document.body.style.overflow = 'hidden';
      const q = (s) => root.querySelector(s), stage = q('#ed-st'), cv = q('#ed-cv'), ly = q('#ed-ly'), ctx = cv.getContext('2d', { willReadFrequently: true });
      let closed = false;
      const finish = (v) => { if (closed) return; closed = true; window.removeEventListener('resize', size); root.remove(); document.body.style.overflow = prevOv; resolve(v); };
      const flash = (m) => { const d = document.createElement('div'); d.className = 'ed-err'; d.textContent = m; root.appendChild(d); setTimeout(() => d.remove(), 2400); };

      // ---- the picture with the filter
      const orig = document.createElement('canvas'); orig.width = PW; orig.height = PH; orig.getContext('2d').drawImage(base, 0, 0, PW, PH);
      const origData = orig.getContext('2d').getImageData(0, 0, PW, PH);
      function paintBase() {
        const id = new ImageData(new Uint8ClampedArray(origData.data), PW, PH), f = FILTERS[E.filter] || {};
        if (E.filter !== 'none') applyFilter(id.data, f, E.amt / 100);
        ctx.putImageData(id, 0, 0);
      }
      // ---- layout
      let SW = 1, SH = 1;
      function size() {
        const a = q('#ed-area').getBoundingClientRect(); if (!a.width || !a.height) return;
        const k = Math.min(a.width / CW, a.height / CH); SW = Math.max(40, Math.floor(CW * k)); SH = Math.max(40, Math.floor(CH * k));
        stage.style.width = SW + 'px'; stage.style.height = SH + 'px'; place();
      }
      window.addEventListener('resize', size);

      // ---- layers
      const itemImg = async (id) => {
        if (imgCache.has(id)) return imgCache.get(id); const it = items.find((x) => x.id === id); if (!it) return null;
        const im = await loadImage(it.img); imgCache.set(id, im); return im;
      };
      const elHtml = (e) => {
        if (e.k === 'text') return esc(e.text);
        if (e.k === 'item') { const it = items.find((x) => x.id === e.itemId); return it ? `<img alt="" src="${esc(it.img)}">` : ''; }
        return `<img alt="" src="${esc(e.src)}">`;
      };
      function style(e, node) {
        node.style.left = e.x + '%'; node.style.top = e.y + '%';
        node.style.transform = `translate(-50%,-50%) rotate(${e.r}deg)`;
        if (e.k === 'text') { node.style.fontSize = (e.fs / 100 * SW) + 'px'; node.style.color = e.color; node.style.background = e.bg ? (e.color === '#000000' ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.55)') : 'transparent'; node.style.width = ''; }
        else node.style.width = e.w + '%';
        node.classList.toggle('sel', E.sel === e.id);
      }
      function place() { ly.querySelectorAll('.ed-el').forEach((n) => { const e = E.els.find((x) => x.id === +n.dataset.id); if (e) style(e, n); }); }
      function layers() {
        ly.innerHTML = '';
        E.els.forEach((e) => {
          const n = document.createElement('div'); n.className = 'ed-el' + (e.k === 'text' ? ' ed-tx' + (e.bg ? ' bg' : '') : ''); n.dataset.id = e.id; n.innerHTML = elHtml(e); style(e, n); ly.appendChild(n);
        });
        controls();
      }
      const selEl = () => E.els.find((x) => x.id === E.sel) || null;
      function select(id) { E.sel = id; place(); controls(); if (E.tab === 'text') panel(); }
      function controls() {
        const e = selEl(), bar = q('#ed-sel');
        bar.innerHTML = e ? `<button type="button" data-a="m">−</button><button type="button" data-a="p">+</button><button type="button" data-a="l">⟲</button><button type="button" data-a="r">⟳</button><button type="button" class="dl" data-a="d" aria-label="${esc(tx('del'))}">✕</button>` : '';
        bar.querySelectorAll('button').forEach((b) => {
          b.onclick = () => {
            const s = selEl(); if (!s) return; const a = b.dataset.a;
            if (a === 'd') { E.els = E.els.filter((x) => x !== s); E.sel = null; layers(); if (E.tab === 'text') panel(); return; }
            const f = a === 'p' ? 1.12 : a === 'm' ? 1 / 1.12 : 1;
            if (s.k === 'text') s.fs = Math.max(2.5, Math.min(30, s.fs * f)); else s.w = Math.max(5, Math.min(100, s.w * f));
            if (a === 'l') s.r = Math.max(-180, s.r - 10); if (a === 'r') s.r = Math.min(180, s.r + 10);
            place();
          };
        });
      }
      // drag with one finger, pinch/rotate with two
      const ptrs = new Map(); let g = null;
      stage.addEventListener('pointerdown', (ev) => {
        const n = ev.target.closest('.ed-el');
        if (!n) { if (!ptrs.size) select(null); return; }
        const e = E.els.find((x) => x.id === +n.dataset.id); if (!e) return;
        if (E.sel !== e.id) select(e.id);
        stage.setPointerCapture && stage.setPointerCapture(ev.pointerId);
        ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        g = { e, pts: [...ptrs.values()].map((p) => ({ ...p })), x: e.x, y: e.y, w: e.w, fs: e.fs, r: e.r };
        if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; g.d0 = Math.hypot(b.x - a.x, b.y - a.y) || 1; g.a0 = Math.atan2(b.y - a.y, b.x - a.x); }
        ev.preventDefault();
      });
      stage.addEventListener('pointermove', (ev) => {
        if (!g || !ptrs.has(ev.pointerId)) return; ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        const e = g.e, r = stage.getBoundingClientRect();
        if (ptrs.size >= 2 && g.d0) {
          const [a, b] = [...ptrs.values()], d = Math.hypot(b.x - a.x, b.y - a.y) || 1, an = Math.atan2(b.y - a.y, b.x - a.x);
          const f = d / g.d0; if (e.k === 'text') e.fs = Math.max(2.5, Math.min(30, g.fs * f)); else e.w = Math.max(5, Math.min(100, g.w * f));
          e.r = Math.max(-180, Math.min(180, Math.round(g.r + (an - g.a0) * 180 / Math.PI)));
        } else if (ptrs.size === 1) {
          const p0 = g.pts[0], p = ptrs.get(ev.pointerId);
          e.x = Math.max(0, Math.min(100, g.x + (p.x - p0.x) / r.width * 100)); e.y = Math.max(0, Math.min(100, g.y + (p.y - p0.y) / r.height * 100));
        }
        const n = ly.querySelector(`[data-id="${e.id}"]`); if (n) style(e, n);
      });
      const up = (ev) => { ptrs.delete(ev.pointerId); if (!ptrs.size) g = null; else if (g) { const e = g.e; g = { e, pts: [...ptrs.values()].map((p) => ({ ...p })), x: e.x, y: e.y, w: e.w, fs: e.fs, r: e.r }; } };
      stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

      const gifCount = () => E.els.filter((e) => e.k === 'gif').length;
      const addEl = (e) => { if (E.els.length >= 24) return; e.id = ++uidN; E.els.push(e); E.sel = e.id; layers(); };

      // ---- panels
      function panel() {
        const pn = q('#ed-pn'); root.querySelectorAll('.ed-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === E.tab));
        if (E.tab === 'filters') {
          pn.innerHTML = `<div class="ed-fl">${Object.keys(FILTERS).map((k) => `<button type="button" data-f="${k}" class="${E.filter === k ? 'on' : ''}"><canvas width="64" height="64" data-c="${k}"></canvas>${esc(tx('f')[k])}</button>`).join('')}</div>
            <div class="ed-rg"><span>${esc(tx('amount'))}</span><input type="range" min="10" max="100" value="${E.amt}" id="ed-amt" ${E.filter === 'none' ? 'disabled' : ''}></div>`;
          const sm = document.createElement('canvas'); sm.width = 64; sm.height = 64; const sc = sm.getContext('2d'), kk = Math.max(64 / PW, 64 / PH);
          pn.querySelectorAll('canvas[data-c]').forEach((c) => {
            const x = c.getContext('2d'); sc.clearRect(0, 0, 64, 64); sc.drawImage(orig, (64 - PW * kk) / 2, (64 - PH * kk) / 2, PW * kk, PH * kk);
            const id = sc.getImageData(0, 0, 64, 64); if (c.dataset.c !== 'none') applyFilter(id.data, FILTERS[c.dataset.c], 1); x.putImageData(id, 0, 0);
          });
          pn.querySelectorAll('[data-f]').forEach((b) => { b.onclick = () => { E.filter = b.dataset.f; paintBase(); panel(); }; });
          const r = pn.querySelector('#ed-amt'); if (r) r.oninput = () => { E.amt = +r.value; paintBase(); };
        } else if (E.tab === 'text') {
          const s = selEl(), te = s && s.k === 'text' ? s : null;
          pn.innerHTML = `<div class="ed-tr"><button type="button" class="ed-b" id="ed-at">${esc(tx('addText'))}</button><input type="text" id="ed-ti" maxlength="80" placeholder="${esc(te ? tx('typeHere') : tx('noSel'))}" value="${te ? esc(te.text) : ''}" ${te ? '' : 'disabled'}></div>
            <div class="ed-tr" style="margin-top:10px">${COLORS.map((c) => `<button type="button" class="ed-sw${te && te.color === c ? ' on' : ''}" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<button type="button" class="ed-b${te && te.bg ? ' on' : ''}" id="ed-bg" ${te ? '' : 'disabled'}>${esc(tx('bg'))}</button></div>`;
          const live = () => { const t = selEl(); if (!t || t.k !== 'text') return null; return t; };
          q('#ed-at').onclick = () => { addEl({ k: 'text', text: tx('defText'), x: 50, y: 50, w: 0, fs: 8, r: 0, color: '#ffffff', bg: false }); panel(); const i = q('#ed-ti'); if (i) { i.focus(); i.select(); } };
          const ti = q('#ed-ti'); ti.oninput = () => { const t = live(); if (!t) return; t.text = ti.value || ' '; const n = ly.querySelector(`[data-id="${t.id}"]`); if (n) n.textContent = t.text; };
          pn.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => { const t = live(); if (!t) return; t.color = b.dataset.c; place(); panel(); }; });
          const bg = q('#ed-bg'); bg.onclick = () => { const t = live(); if (!t) return; t.bg = !t.bg; layers(); panel(); };
        } else if (E.tab === 'items') {
          if (!items.length) { pn.innerHTML = `<p class="ed-note">${esc(tx('noItems'))}</p>`; return; }
          pn.innerHTML = `<p class="ed-note">${esc(tx('itemsHint'))}</p><div class="ed-ig">${items.map((i) => `<div style="position:relative"><button type="button" class="ed-it${E.worn.has(i.id) ? ' w' : ''}" data-i="${esc(i.id)}" aria-label="${esc(i.name)}"><img src="${esc(i.img)}" alt="${esc(i.name)}" loading="lazy"></button><button type="button" class="ed-ck" data-w="${esc(i.id)}" aria-label="${esc(tx('wear'))}" style="border:1.5px solid #fff;padding:0;cursor:pointer;${E.worn.has(i.id) ? 'background:#2ecc71;border-color:#2ecc71;' : ''}">✓</button></div>`).join('')}</div>
            ${mode === 'post' ? `<label class="ed-note" style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="ed-sf" ${E.showFit ? 'checked' : ''}> ${esc(tx('showFit'))}</label>` : ''}`;
          pn.querySelectorAll('.ed-ck').forEach((b) => { b.style.cssText = 'position:absolute;right:3px;top:3px;width:22px;height:22px;border-radius:50%;background:' + (E.worn.has(b.dataset.w) ? '#2ecc71' : 'rgba(0,0,0,.55)') + ';color:#fff;border:1.5px solid ' + (E.worn.has(b.dataset.w) ? '#2ecc71' : '#fff') + ';font-size:13px;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer'; });
          pn.querySelectorAll('[data-w]').forEach((b) => { b.onclick = () => { const id = b.dataset.w; E.worn.has(id) ? E.worn.delete(id) : E.worn.add(id); panel(); }; });
          pn.querySelectorAll('[data-i]').forEach((b) => {
            b.onclick = async () => {
              const id = b.dataset.i, im = await itemImg(id).catch(() => null); if (!im) return;
              addEl({ k: 'item', itemId: id, x: 50, y: 50, w: 34, fs: 0, r: 0 }); E.worn.add(id); panel();
            };
          });
          const sf = pn.querySelector('#ed-sf'); if (sf) sf.onchange = () => { E.showFit = sf.checked; };
        } else {
          gifPanel(pn);
        }
      }
      let gifTimer = 0;
      async function gifPanel(pn) {
        pn.innerHTML = `<div class="ed-tr"><input type="text" id="ed-gq" maxlength="60" placeholder="${esc(tx('gifSearch'))}"><button type="button" class="ed-b" id="ed-gu">${esc(tx('gifUpload'))}</button></div><input type="file" id="ed-gf" accept="image/gif" hidden><div id="ed-gr"></div>`;
        const addGif = (src, own) => {
          if (E.els.filter((e) => e.k === 'gif').length >= 8 || (own && new Set(E.els.filter((e) => e.k === 'gif' && e.own).map((e) => e.src).concat([src])).size > 3)) { flash(tx('gifMax')); return; }
          addEl({ k: 'gif', src, own: !!own, x: 50, y: 50, w: 34, fs: 0, r: 0 });
        };
        q('#ed-gu').onclick = () => q('#ed-gf').click();
        q('#ed-gf').onchange = (ev) => {
          const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return;
          if (!/^image\/gif$/.test(f.type)) { flash(tx('gifBad')); return; } if (f.size > 260 * 1024) { flash(tx('gifBig')); return; }
          const r = new FileReader(); r.onload = () => addGif(String(r.result), true); r.readAsDataURL(f);
        };
        const out = q('#ed-gr');
        const search = async (term) => {
          out.innerHTML = `<p class="ed-note">${esc(tx('loading'))}</p>`;
          try {
            const j = await o.gifs(term || '');
            if (E.tab !== 'gif') return;
            if (j.off) { out.innerHTML = `<p class="ed-note">${esc(tx('gifOff'))}</p>`; q('#ed-gq').style.display = 'none'; return; }
            out.innerHTML = j.gifs.length ? `<div class="ed-gg">${j.gifs.map((x, i) => `<button type="button" data-g="${i}"><img src="${esc(x.p)}" alt="" loading="lazy"></button>`).join('')}</div>` : `<p class="ed-note">${esc(tx('nothing'))}</p>`;
            out.querySelectorAll('[data-g]').forEach((b) => { b.onclick = () => addGif(j.gifs[+b.dataset.g].u, false); });
          } catch (e) { out.innerHTML = `<p class="ed-note">${esc(tx('nothing'))}</p>`; }
        };
        q('#ed-gq').oninput = (ev) => { clearTimeout(gifTimer); gifTimer = setTimeout(() => search(ev.target.value.trim()), 450); };
        search('');
      }
      root.querySelectorAll('.ed-tabs button').forEach((b) => { b.onclick = () => { E.tab = b.dataset.t; panel(); }; });

      // ---- bake
      async function bake() {
        const c = document.createElement('canvas'); c.width = CW; c.height = CH; const x = c.getContext('2d');
        x.drawImage(base, 0, 0, CW, CH);
        if (E.filter !== 'none') { const id = x.getImageData(0, 0, CW, CH); applyFilter(id.data, FILTERS[E.filter], E.amt / 100); x.putImageData(id, 0, 0); }
        for (const e of E.els) {
          if (e.k === 'gif') continue;
          x.save(); x.translate(e.x / 100 * CW, e.y / 100 * CH); x.rotate(e.r * Math.PI / 180);
          if (e.k === 'item') { const im = await itemImg(e.itemId); if (im) { const w = e.w / 100 * CW, h = w * im.height / im.width; x.drawImage(im, -w / 2, -h / 2, w, h); } }
          else {
            const px = e.fs / 100 * CW, lines = String(e.text).split('\n'); x.font = `800 ${px}px -apple-system, system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
            const lh = px * 1.2, tw = Math.max(...lines.map((l) => x.measureText(l).width)), th = lh * lines.length;
            if (e.bg) { x.fillStyle = e.color === '#000000' ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.55)'; const pad = px * .4, r = px * .25, bw = tw + pad * 2, bh = th + px * .2; x.beginPath(); x.moveTo(-bw / 2 + r, -bh / 2); x.arcTo(bw / 2, -bh / 2, bw / 2, bh / 2, r); x.arcTo(bw / 2, bh / 2, -bw / 2, bh / 2, r); x.arcTo(-bw / 2, bh / 2, -bw / 2, -bh / 2, r); x.arcTo(-bw / 2, -bh / 2, bw / 2, -bh / 2, r); x.closePath(); x.fill(); }
            else { x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = px * .15; x.shadowOffsetY = px * .04; }
            x.fillStyle = e.color; lines.forEach((l, i) => x.fillText(l, 0, (i - (lines.length - 1) / 2) * lh));
          }
          x.restore();
        }
        return c.toDataURL('image/jpeg', .92);
      }
      q('#ed-x').onclick = () => finish(null);
      q('#ed-ok').onclick = async () => {
        const b = q('#ed-ok'); b.disabled = true;
        try {
          const img = await bake(), gifs = [], ov = [];
          E.els.filter((e) => e.k === 'gif').forEach((e) => {
            const o = { x: +e.x.toFixed(2), y: +e.y.toFixed(2), w: +e.w.toFixed(2), r: Math.round(e.r) };
            if (e.own) { let i = gifs.indexOf(e.src); if (i < 0) { gifs.push(e.src); i = gifs.length - 1; } o.g = i; } else o.u = e.src;
            ov.push(o);
          });
          const worn = items.filter((i) => E.worn.has(i.id));
          finish({ img, gifs, ov, worn, showFit: mode === 'post' && E.showFit, state: { filter: E.filter, amt: E.amt, worn: [...E.worn], showFit: E.showFit, els: E.els.map((e) => { const c = { ...e }; delete c.id; return c; }) } });
        } catch (e) { b.disabled = false; flash(tx('err')); }
      };
      paintBase(); layers(); panel();
      requestAnimationFrame(() => { size(); setTimeout(size, 120); });
    });
  }
  window.EDITOR = { open, thumb, FILTERS, applyFilter };
})();
