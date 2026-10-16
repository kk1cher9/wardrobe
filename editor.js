/* Photo editor for posts and stories: filters, text, wardrobe items pasted on the photo, GIF stickers, "what I wear" strip.
   EDITOR.open({src, mode:'post'|'story', state}) -> Promise<null | {img, gifs, ov, worn, showFit, state}>
   - filters, text and wardrobe stickers are baked into the pixels; GIFs stay a separate overlay layer (they keep moving).
   - the filter is a per-pixel colour transform (ctx.filter is not supported on every Safari). */
(function () {
  'use strict';
  const LANG = () => (window.I18N && I18N.lang) || 'ru';
  const TX = {
    ru: { title: 'Редактор', cancel: 'Отмена', done: 'Готово', filters: 'Фильтры', text: 'Текст', items: 'Вещи', gif: 'GIF', amount: 'Сила фильтра', addText: '+ Текст', defText: 'Текст', typeHere: 'Введите текст', bg: 'Фон', fx: { none: 'Чистый', shadow: 'Тень', bg: 'Фон', neon: 'Неон', glow: 'Свечение', outline: 'Контур', retro: 'Ретро' }, photo: 'Фото', addPhoto: '+ Фото', photoHint: 'Выберите форму, затем фото из галереи. Нажмите на другую форму, чтобы изменить уже добавленное.', shapes: { rect: 'Скруглённый', star: 'Звезда', circle: 'Круг', square: 'Квадрат' }, del: 'Удалить', noSel: 'Выберите текст на фото', itemsHint: 'Нажмите на вещь — она появится на фото. Галочка — «на мне» (покажем под фото).', wear: 'На мне', showFit: 'Показать под фото, во что я одет(а)', noItems: 'В гардеробе пока нет вещей', gifSearch: 'Поиск GIF', gifUpload: 'Загрузить свой GIF', gifOff: 'Поиск GIF не подключён — можно загрузить свой файл.', gifBig: 'GIF слишком большой (до 260 КБ)', gifBad: 'Это не GIF', gifMax: 'Не больше 3 своих GIF и 8 наклеек', none: 'Нет', loading: 'Загрузка…', nothing: 'Ничего не найдено', err: 'Не удалось подготовить фото', f: { none: 'Оригинал', vivid: 'Яркий', warm: 'Тёплый', cool: 'Холодный', bw: 'Ч/б', noir: 'Нуар', sepia: 'Сепия', fade: 'Выцветший', vintage: 'Винтаж', drama: 'Драма' } },
    uk: { title: 'Редактор', cancel: 'Скасувати', done: 'Готово', filters: 'Фільтри', text: 'Текст', items: 'Речі', gif: 'GIF', amount: 'Сила фільтра', addText: '+ Текст', defText: 'Текст', typeHere: 'Введіть текст', bg: 'Тло', fx: { none: 'Чистий', shadow: 'Тінь', bg: 'Тло', neon: 'Неон', glow: 'Сяйво', outline: 'Контур', retro: 'Ретро' }, photo: 'Фото', addPhoto: '+ Фото', photoHint: 'Оберіть форму, потім фото з галереї. Натисніть іншу форму, щоб змінити вже додане.', shapes: { rect: 'Заокруглений', star: 'Зірка', circle: 'Коло', square: 'Квадрат' }, del: 'Видалити', noSel: 'Оберіть текст на фото', itemsHint: 'Натисніть на річ — вона з’явиться на фото. Пташка — «на мені» (покажемо під фото).', wear: 'На мені', showFit: 'Показати під фото, у що я вдягнений(а)', noItems: 'У гардеробі поки немає речей', gifSearch: 'Пошук GIF', gifUpload: 'Завантажити свій GIF', gifOff: 'Пошук GIF не підключено — можна завантажити свій файл.', gifBig: 'GIF завеликий (до 260 КБ)', gifBad: 'Це не GIF', gifMax: 'Не більше 3 своїх GIF і 8 наліпок', none: 'Ні', loading: 'Завантаження…', nothing: 'Нічого не знайдено', err: 'Не вдалося підготувати фото', f: { none: 'Оригінал', vivid: 'Яскравий', warm: 'Теплий', cool: 'Холодний', bw: 'Ч/б', noir: 'Нуар', sepia: 'Сепія', fade: 'Вицвілий', vintage: 'Вінтаж', drama: 'Драма' } },
    en: { title: 'Editor', cancel: 'Cancel', done: 'Done', filters: 'Filters', text: 'Text', items: 'Items', gif: 'GIF', amount: 'Filter strength', addText: '+ Text', defText: 'Text', typeHere: 'Type text', bg: 'Background', fx: { none: 'Plain', shadow: 'Shadow', bg: 'Background', neon: 'Neon', glow: 'Glow', outline: 'Outline', retro: 'Retro' }, photo: 'Photo', addPhoto: '+ Photo', photoHint: 'Pick a shape, then a photo from your gallery. Tap another shape to change one you already added.', shapes: { rect: 'Rounded', star: 'Star', circle: 'Circle', square: 'Square' }, del: 'Delete', noSel: 'Select a text on the photo', itemsHint: 'Tap an item to paste it on the photo. The tick means “I wear this” (shown under the photo).', wear: 'I wear it', showFit: 'Show what I wear under the photo', noItems: 'No items in your wardrobe yet', gifSearch: 'Search GIFs', gifUpload: 'Upload your own GIF', gifOff: 'GIF search is not connected — you can upload your own file.', gifBig: 'GIF is too large (up to 260 KB)', gifBad: 'This is not a GIF', gifMax: 'Up to 3 own GIFs and 8 stickers', none: 'None', loading: 'Loading…', nothing: 'Nothing found', err: 'Could not prepare the photo', f: { none: 'Original', vivid: 'Vivid', warm: 'Warm', cool: 'Cool', bw: 'B&W', noir: 'Noir', sepia: 'Sepia', fade: 'Faded', vintage: 'Vintage', drama: 'Drama' } }
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
  // ---- photo stickers: a gallery photo cut to a shape (rounded rectangle, star with rounded tips, circle, square), rendered to a PNG with transparent corners
  function shapePhoto(im, shape) {
    const S = 520, sq = shape !== 'rect', ar = sq ? 1 : Math.max(.6, Math.min(1.7, im.width / im.height));
    const W = ar >= 1 ? S : Math.round(S * ar), H = ar >= 1 ? Math.round(S / ar) : S;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.beginPath();
    if (shape === 'circle') x.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2);
    else if (shape === 'star') {
      const R = W / 1.902, cx = W / 2, cy = (H - 1.809 * R) / 2 + R, pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * .52 : R; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], rad = R * .17, m0 = mid(pts[9], pts[0]);
      x.moveTo(m0[0], m0[1]);
      pts.forEach((pt, i) => { const m = mid(pt, pts[(i + 1) % 10]); x.arcTo(pt[0], pt[1], m[0], m[1], rad); });
      x.closePath();
    } else if (shape === 'square') x.rect(0, 0, W, H);
    else { const r = Math.min(W, H) * .12; x.moveTo(r, 0); x.arcTo(W, 0, W, H, r); x.arcTo(W, H, 0, H, r); x.arcTo(0, H, 0, 0, r); x.arcTo(0, 0, W, 0, r); x.closePath(); }
    x.clip();
    const k = Math.max(W / im.width, H / im.height), dw = im.width * k, dh = im.height * k; x.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    return c.toDataURL('image/png');
  }
  const CSS = `
.ed{position:fixed;inset:0;z-index:400;background:#000;color:#fff;display:flex;flex-direction:column;font:inherit;touch-action:manipulation;user-select:none;-webkit-user-select:none;animation:edIn .34s cubic-bezier(.22,1,.36,1);transition:opacity .22s ease,transform .22s ease}
.ed.out{opacity:0;transform:translateY(18px)}
@keyframes edIn{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
@keyframes edFade{from{opacity:.35}to{opacity:1}}
@keyframes edPop{0%{scale:.3;opacity:0}60%{scale:1.1;opacity:1}100%{scale:1}}
.ed-stage canvas.sw{animation:edFade .25s ease}.ed-pn.tc>*{animation:edFade .22s ease}.ed-el.new{animation:edPop .38s cubic-bezier(.34,1.56,.64,1)}.ed-el{transition:outline-color .15s}
.ed-sel button{transition:transform .12s,background .15s}.ed-sel button:active{transform:scale(.88)}.ed-tabs button,.ed-b,.ed-sw{transition:background .2s,color .2s,transform .15s}.ed-b:active{transform:scale(.94)}.ed-fl button canvas{transition:outline-color .2s,transform .2s}.ed-fl button.on canvas{transform:scale(1.06)}
@media(prefers-reduced-motion:reduce){.ed,.ed-stage canvas.sw,.ed-pn.tc>*,.ed-el.new{animation:none!important}}
.ed-top{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:calc(8px + env(safe-area-inset-top,0px)) 12px 8px}.ed-top b{font-size:15px}
.ed-top button{border:0;background:none;color:#fff;font:inherit;font-weight:700;font-size:15px;padding:8px 6px;cursor:pointer}.ed-top .ed-ok{background:#fff;color:#000;border-radius:20px;padding:8px 18px;font-weight:800}
.ed-area{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ed-stage{position:relative;background:#111;overflow:hidden;touch-action:none;flex:none}.ed-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.ed-el{position:absolute;transform-origin:center;touch-action:none;cursor:grab;-webkit-tap-highlight-color:transparent}.ed-el.sel{outline:2px dashed rgba(255,255,255,.9);outline-offset:4px}
.ed-el img{width:100%;display:block;pointer-events:none;-webkit-user-drag:none}.ed-tx{font-weight:800;white-space:pre;line-height:1.2;text-shadow:0 1px 6px rgba(0,0,0,.35);font-family:-apple-system,system-ui,sans-serif}.ed-tx.bg{text-shadow:none;border-radius:.25em;padding:.1em .4em}
.ed-sel{flex:none;display:flex;gap:6px;justify-content:center;align-items:center;padding:6px 10px;min-height:44px}.ed-sel button{border:0;background:#262626;color:#fff;width:44px;height:36px;border-radius:18px;font:inherit;font-weight:800;font-size:17px;cursor:pointer}.ed-sel button.dl{color:#ff6b6b}
.ed-area{gap:6px;padding:0 8px 0 0}.ed-hd{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;z-index:8;touch-action:none;box-shadow:0 2px 8px rgba(0,0,0,.5);cursor:nwse-resize}.ed-hd[hidden]{display:none}.ed-hd svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}.ed-box{flex:1;min-width:0;min-height:0;height:100%;overflow:hidden;display:flex;align-items:center;justify-content:center}.ed-tabs{flex:none;z-index:6;display:flex;flex-direction:column;gap:10px}.ed-tabs button{display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:44px;height:44px;min-width:44px;padding:0;border:0;background:rgba(30,30,30,.72);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#fff;font:inherit;font-weight:800;font-size:13px;border-radius:50%;cursor:pointer}.ed-tabs button svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.ed-tabs button.on{background:#fff;color:#000}
.ed-pn{flex:none;height:min(190px,32vh);overflow:auto;padding:8px 10px calc(10px + env(safe-area-inset-bottom,0px));-webkit-overflow-scrolling:touch}
.ed-fl{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px}.ed-fl button{flex:none;border:0;background:none;color:#ccc;font:inherit;font-size:11px;font-weight:700;cursor:pointer;padding:0;width:64px}.ed-fl button canvas{width:64px;height:64px;border-radius:12px;display:block;margin-bottom:4px;outline:2px solid transparent}.ed-fl button.on{color:#fff}.ed-fl button.on canvas{outline-color:#fff}
.ed-rg{display:flex;align-items:center;gap:10px;font-size:12px;color:#aaa;margin-top:4px}.ed-rg input{flex:1}
.ed-tr{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.ed-tr input[type=text]{flex:1;min-width:120px;border:1px solid #333;background:#161616;color:#fff;border-radius:12px;padding:10px 12px;font:inherit;font-size:16px}.ed-tr input:disabled{opacity:.4}
.ed-sw{box-sizing:border-box;width:28px;height:28px;min-width:28px;max-width:28px;min-height:28px;max-height:28px;aspect-ratio:1/1;border-radius:50%;border:2px solid #444;cursor:pointer;flex:none;padding:0}.ed-sw.on{border-color:#fff;transform:scale(1.15)}
.ed-tb{min-width:76px;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:38px;padding:0 14px}.ed-tb i{font-style:normal;opacity:.55;font-family:system-ui}.ed-cb{width:34px;height:34px;min-width:34px;max-width:34px;min-height:34px;max-height:34px}.ed-cu{position:relative;overflow:hidden;background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red)}.ed-cu input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}.ed-shb{width:44px;height:40px;padding:0;display:inline-flex;align-items:center;justify-content:center}.ed-shb svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2}.ed-b{border:0;background:#262626;color:#fff;font:inherit;font-weight:700;font-size:13px;border-radius:16px;padding:9px 13px;cursor:pointer}.ed-b.on{background:#fff;color:#000}
.ed-ig{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px}.ed-ig .ed-it{position:relative;border:0;padding:0;background:#fff;border-radius:12px;aspect-ratio:1;overflow:hidden;cursor:pointer}.ed-ig .ed-it img{width:100%;height:100%;object-fit:contain;display:block}
.ed-ig .ed-ck{position:absolute;right:3px;top:3px;box-sizing:border-box;width:22px;height:22px;min-width:22px;max-width:22px;min-height:22px;max-height:22px;aspect-ratio:1/1;padding:0;line-height:1;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;border:1.5px solid #fff;font-size:13px;display:flex;align-items:center;justify-content:center}.ed-ig .ed-it.w .ed-ck{background:#2ecc71;border-color:#2ecc71}
.ed-note{font-size:12px;color:#999;margin:6px 0}.ed-gg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.ed-gg button{border:0;padding:0;background:#222;border-radius:10px;aspect-ratio:1;overflow:hidden;cursor:pointer}.ed-gg img{width:100%;height:100%;object-fit:cover;display:block}
.ed-err{position:absolute;left:12px;right:12px;bottom:200px;background:#ff4d6d;color:#fff;padding:9px 12px;border-radius:12px;font-weight:700;font-size:13px;text-align:center;z-index:5}
`;
  function injectCss() { if (document.getElementById('ed-css')) return; const s = document.createElement('style'); s.id = 'ed-css'; s.textContent = CSS; document.head.appendChild(s); }
  const FONTS = { // system stacks only (no downloads); each falls back sensibly on iOS / Android / Windows
    sans: { w: 800, f: "-apple-system, system-ui, 'Segoe UI', Roboto, sans-serif" },
    serif: { w: 700, f: "Georgia, 'Times New Roman', serif" },
    mono: { w: 700, f: "'Courier New', Courier, monospace" },
    script: { w: 700, f: "'Snell Roundhand', 'Brush Script MT', 'Segoe Script', cursive" },
    impact: { w: 400, f: "Impact, 'Arial Narrow Bold', Haettenschweller, sans-serif" },
    round: { w: 800, f: "'Arial Rounded MT Bold', 'Trebuchet MS', 'Varela Round', sans-serif" },
    marker: { w: 700, f: "'Marker Felt', 'Chalkboard SE', 'Comic Sans MS', cursive" },
    didot: { w: 700, f: "Didot, 'Bodoni 72', 'Bodoni MT', Georgia, serif" }
  };
  const fnt = (e) => FONTS[e.font] || FONTS.sans;
  const COLORS = ['#ffffff', '#000000', '#ff4d6d', '#ffd23f', '#3ddc84', '#4cc9f0', '#b388ff'];
  const FXS = ['shadow', 'neon', 'glow', 'outline', 'retro', 'bg', 'none'];
  const fxOf = (e) => e.fx || (e.bg ? 'bg' : 'shadow');
  const NEON = (c) => (c === '#ffffff' ? '#4cc9f0' : c);
  const CON = (c) => (c === '#000000' ? '#ffffff' : '#000000');
  // DOM look of a text layer (the canvas bake in draw() mirrors these)
  function fxCss(e) {
    const f = fxOf(e), c = e.color; let col = c, sh = 'none', bg = 'transparent';
    if (f === 'shadow') sh = '0 .04em .15em rgba(0,0,0,.35)';
    else if (f === 'bg') bg = c === '#000000' ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.55)';
    else if (f === 'neon') { const g = NEON(c); col = '#ffffff'; sh = `0 0 .06em #fff,0 0 .15em #fff,0 0 .3em ${g},0 0 .6em ${g},0 0 1em ${g}`; }
    else if (f === 'glow') sh = `0 0 .2em ${c},0 0 .5em ${c}`;
    else if (f === 'outline') { const o = CON(c); sh = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([a, b]) => `${a * .045}em ${b * .045}em 0 ${o}`).join(','); }
    else if (f === 'retro') sh = `.05em .05em 0 ${CON(c)},.1em .1em 0 ${CON(c)}`;
    return { col, sh, bg };
  }
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
    const E = { filter: prevSt.filter || 'none', amt: prevSt.amt == null ? 100 : prevSt.amt, els: (prevSt.els || []).map((e) => ({ ...e, id: ++uidN })), sel: null, worn: new Set(prevSt.worn || []), showFit: prevSt.showFit !== false, tab: 'filters', pal: false };
    const imgCache = new Map(); // wardrobe item id -> HTMLImageElement
    const items = (typeof S !== 'undefined' && S.items) || [];

    return new Promise((resolve) => {
      const root = document.createElement('div'); root.className = 'ed'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', tx('title'));
      root.innerHTML = `<div class="ed-top"><button type="button" id="ed-x">${esc(tx('cancel'))}</button><b>${esc(tx('title'))}</b><button type="button" class="ed-ok" id="ed-ok">${esc(tx('done'))}</button></div>
        <div class="ed-area" id="ed-area"><div class="ed-box" id="ed-box"><div class="ed-stage" id="ed-st"><canvas id="ed-cv" width="${PW}" height="${PH}"></canvas><div id="ed-ly"></div><div class="ed-hd" id="ed-hd" hidden aria-label="resize"><svg viewBox="0 0 24 24"><path d="M5 19L19 5M13 5h6v6M11 19H5v-6"/></svg></div></div></div><div class="ed-tabs"><button type="button" data-t="filters" title="${esc(tx('filters'))}" aria-label="${esc(tx('filters'))}"><svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="5.5"/><circle cx="15" cy="9" r="5.5"/><circle cx="12" cy="15" r="5.5"/></svg></button><button type="button" data-t="text" title="${esc(tx('text'))}" aria-label="${esc(tx('text'))}"><span style="font-size:16px;letter-spacing:-.5px">Aa</span></button><button type="button" data-t="items" title="${esc(tx('items'))}" aria-label="${esc(tx('items'))}"><svg viewBox="0 0 24 24"><path d="M8 3l-5 3 2 4 3-1v11h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/></svg></button><button type="button" data-t="photo" title="${esc(tx('photo'))}" aria-label="${esc(tx('photo'))}"><svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3.5"/><circle cx="9" cy="10" r="1.7"/><path d="M4.5 18l5-5 3.5 3.5 2.5-2.5 4 4"/></svg></button><button type="button" data-t="gif" title="${esc(tx('gif'))}" aria-label="${esc(tx('gif'))}"><span style="font-size:12px">GIF</span></button></div></div>
        <div class="ed-sel" id="ed-sel"></div>
        <div class="ed-pn" id="ed-pn"></div>`;
      document.body.appendChild(root); const prevOv = document.body.style.overflow; document.body.style.overflow = 'hidden';
      const q = (s) => root.querySelector(s), stage = q('#ed-st'), cv = q('#ed-cv'), ly = q('#ed-ly'), hd = q('#ed-hd'), ctx = cv.getContext('2d', { willReadFrequently: true });
      let closed = false;
      const finish = (v) => { if (closed) return; closed = true; window.removeEventListener('resize', size); document.body.style.overflow = prevOv; root.classList.add('out'); setTimeout(() => root.remove(), 230); resolve(v); };
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
        const a = q('#ed-box').getBoundingClientRect(); if (!a.width || !a.height) return;
        const k = Math.min(a.width / CW, a.height / CH); SW = Math.max(40, Math.floor(CW * k)); SH = Math.max(40, Math.floor(CH * k));
        stage.style.width = SW + 'px'; stage.style.height = SH + 'px'; place();
      }
      window.addEventListener('resize', size);
      if (window.ResizeObserver) { try { new ResizeObserver(() => size()).observe(q('#ed-box')); } catch (e) { /* resize event still covers it */ } }

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
      function posHd(e, node) {
        const hw = node.offsetWidth / 2 + 14, hh = node.offsetHeight / 2 + 14, a = e.r * Math.PI / 180, dx = hw * Math.cos(a) - hh * Math.sin(a), dy = hw * Math.sin(a) + hh * Math.cos(a);
        hd.hidden = false; hd.style.left = `calc(${e.x}% + ${dx}px)`; hd.style.top = `calc(${e.y}% + ${dy}px)`;
      }
      function style(e, node) {
        node.style.left = e.x + '%'; node.style.top = e.y + '%';
        node.style.transform = `translate(-50%,-50%) rotate(${e.r}deg)`;
        if (e.k === 'text') { node.style.fontSize = (e.fs / 100 * SW) + 'px'; node.style.fontFamily = fnt(e).f; node.style.fontWeight = fnt(e).w; const fc = fxCss(e); node.style.color = fc.col; node.style.background = fc.bg; node.style.textShadow = fc.sh; node.classList.toggle('bg', fxOf(e) === 'bg'); node.style.width = ''; }
        else node.style.width = e.w + '%';
        node.classList.toggle('sel', E.sel === e.id);
        if (E.sel === e.id) posHd(e, node);
      }
      function place() { ly.querySelectorAll('.ed-el').forEach((n) => { const e = E.els.find((x) => x.id === +n.dataset.id); if (e) style(e, n); }); if (!selEl()) hd.hidden = true; }
      function layers() {
        ly.innerHTML = '';
        E.els.forEach((e) => {
          const n = document.createElement('div'); n.className = 'ed-el' + (e.k === 'text' ? ' ed-tx' : ''); n.dataset.id = e.id; n.dataset.k = e.k; n.innerHTML = elHtml(e); style(e, n); ly.appendChild(n);
        });
        controls();
      }
      const selEl = () => E.els.find((x) => x.id === E.sel) || null;
      function select(id) { E.sel = id; place(); controls(); if (E.tab === 'text' || E.tab === 'photo') panel(); }
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
      const ptrs = new Map(); let g = null, hdg = null, tap = null;
      const SC = (e, f, base) => { if (e.k === 'text') e.fs = Math.max(2.5, Math.min(30, base.fs * f)); else e.w = Math.max(5, Math.min(100, base.w * f)); };
      stage.addEventListener('pointerdown', (ev) => {
        if (ev.target === hd) return;
        const n = ev.target.closest('.ed-el');
        let e = g ? g.e : (n ? E.els.find((x) => x.id === +n.dataset.id) : selEl());   // a 2nd finger anywhere pinches the element already being held
        if (!e) { select(null); return; }
        if (!g && n && E.sel !== e.id) select(e.id);
        try { stage.setPointerCapture(ev.pointerId); } catch (e2) { /* synthetic or released pointer */ }
        ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        g = { e, pts: [...ptrs.values()].map((p) => ({ ...p })), x: e.x, y: e.y, w: e.w, fs: e.fs, r: e.r, empty: !n && ptrs.size === 1 };
        if (g.empty) tap = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, moved: false };
        if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; g.d0 = Math.hypot(b.x - a.x, b.y - a.y) || 1; g.a0 = Math.atan2(b.y - a.y, b.x - a.x); g.empty = false; tap = null; }
        ev.preventDefault();
      });
      stage.addEventListener('pointermove', (ev) => {
        if (!g || !ptrs.has(ev.pointerId)) return; ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        if (tap && Math.hypot(ev.clientX - tap.x, ev.clientY - tap.y) > 8) tap.moved = true;
        const e = g.e, r = stage.getBoundingClientRect();
        if (ptrs.size >= 2 && g.d0) {
          const [a, b] = [...ptrs.values()], d = Math.hypot(b.x - a.x, b.y - a.y) || 1, an = Math.atan2(b.y - a.y, b.x - a.x);
          SC(e, d / g.d0, g);
          e.r = Math.max(-180, Math.min(180, Math.round(g.r + (an - g.a0) * 180 / Math.PI)));
        } else if (ptrs.size === 1 && !g.empty) {
          const p0 = g.pts[0], p = ptrs.get(ev.pointerId);
          e.x = Math.max(0, Math.min(100, g.x + (p.x - p0.x) / r.width * 100)); e.y = Math.max(0, Math.min(100, g.y + (p.y - p0.y) / r.height * 100));
        }
        const n = ly.querySelector(`[data-id="${e.id}"]`); if (n) style(e, n);
      });
      const up = (ev) => {
        ptrs.delete(ev.pointerId);
        if (tap && tap.id === ev.pointerId) { if (!tap.moved && !ptrs.size) select(null); tap = null; }
        if (!ptrs.size) g = null; else if (g) { const e = g.e; g = { e, pts: [...ptrs.values()].map((p) => ({ ...p })), x: e.x, y: e.y, w: e.w, fs: e.fs, r: e.r }; }
      };
      // corner handle: drag to scale + rotate around the centre in one move
      hd.addEventListener('pointerdown', (ev) => {
        const e = selEl(); if (!e) return; const r = stage.getBoundingClientRect(), cx = r.left + e.x / 100 * r.width, cy = r.top + e.y / 100 * r.height;
        hdg = { e, cx, cy, d0: Math.hypot(ev.clientX - cx, ev.clientY - cy) || 1, a0: Math.atan2(ev.clientY - cy, ev.clientX - cx), fs: e.fs, w: e.w, r: e.r };
        try { hd.setPointerCapture(ev.pointerId); } catch (e2) { /* synthetic pointer */ } ev.preventDefault(); ev.stopPropagation();
      });
      hd.addEventListener('pointermove', (ev) => {
        if (!hdg) return; const e = hdg.e, d = Math.hypot(ev.clientX - hdg.cx, ev.clientY - hdg.cy) || 1, an = Math.atan2(ev.clientY - hdg.cy, ev.clientX - hdg.cx);
        SC(e, d / hdg.d0, hdg); let rr = Math.round(hdg.r + (an - hdg.a0) * 180 / Math.PI); while (rr > 180) rr -= 360; while (rr < -180) rr += 360; e.r = rr;
        const n = ly.querySelector(`[data-id="${e.id}"]`); if (n) style(e, n);
      });
      const hup = () => { hdg = null; }; hd.addEventListener('pointerup', hup); hd.addEventListener('pointercancel', hup);
      stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

      const gifCount = () => E.els.filter((e) => e.k === 'gif').length;
      const addEl = (e) => { if (E.els.length >= 24) return; e.id = ++uidN; E.els.push(e); E.sel = e.id; layers(); const nn = ly.querySelector(`[data-id="${e.id}"]`); if (nn) nn.classList.add('new'); };

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
          pn.querySelectorAll('[data-f]').forEach((b) => { b.onclick = () => { E.filter = b.dataset.f; paintBase(); cv.classList.remove('sw'); void cv.offsetWidth; cv.classList.add('sw'); panel(); }; });
          const r = pn.querySelector('#ed-amt'); if (r) r.oninput = () => { E.amt = +r.value; paintBase(); };
        } else if (E.tab === 'text') {
          const s = selEl(), te = s && s.k === 'text' ? s : null;
          const fo = te ? (te.font || 'sans') : 'sans', fx = te ? fxOf(te) : 'shadow';
          pn.innerHTML = `<div class="ed-tr"><button type="button" class="ed-b" id="ed-at">${esc(tx('addText'))}</button><input type="text" id="ed-ti" maxlength="80" placeholder="${esc(te ? tx('typeHere') : tx('noSel'))}" value="${te ? esc(te.text) : ''}" ${te ? '' : 'disabled'}></div>
            <div class="ed-tr" style="margin-top:10px"><button type="button" class="ed-b ed-tb" id="ed-fn" ${te ? '' : 'disabled'} aria-label="font" style="font-family:${FONTS[fo].f.replace(/"/g, "'")};font-weight:${FONTS[fo].w}">Aa <i>›</i></button><button type="button" class="ed-b ed-tb" id="ed-fx" ${te ? '' : 'disabled'}>${esc(tx('fx')[fx])} <i>›</i></button><button type="button" class="ed-sw ed-cb${E.pal ? ' on' : ''}" id="ed-cb" ${te ? '' : 'disabled'} aria-label="color" style="background:${te ? te.color : '#fff'}"></button></div>
            ${E.pal && te ? `<div class="ed-tr ed-pal" style="margin-top:10px">${COLORS.map((c) => `<button type="button" class="ed-sw${te.color === c ? ' on' : ''}" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<label class="ed-sw ed-cu" aria-label="custom"><input type="color" id="ed-cc" value="${/^#[0-9a-f]{6}$/i.test(te.color) ? te.color : '#ffffff'}"></label></div>` : ''}`;
          const live = () => { const t = selEl(); if (!t || t.k !== 'text') return null; return t; };
          q('#ed-at').onclick = () => { addEl({ k: 'text', text: tx('defText'), x: 50, y: 50, w: 0, fs: 8, r: 0, color: '#ffffff', fx: 'shadow', font: 'sans' }); panel(); const i = q('#ed-ti'); if (i) { i.focus(); i.select(); } };
          const ti = q('#ed-ti'); ti.oninput = () => { const t = live(); if (!t) return; t.text = ti.value || ' '; const n = ly.querySelector(`[data-id="${t.id}"]`); if (n) n.textContent = t.text; };
          pn.querySelectorAll('[data-c]').forEach((b) => { b.onclick = () => { const t = live(); if (!t) return; t.color = b.dataset.c; place(); panel(); }; });
          const nx = (arr, v) => arr[(arr.indexOf(v) + 1) % arr.length];
          q('#ed-fn').onclick = () => { const t = live(); if (!t) return; t.font = nx(Object.keys(FONTS), t.font || 'sans'); layers(); panel(); };
          q('#ed-fx').onclick = () => { const t = live(); if (!t) return; t.fx = nx(FXS, fxOf(t)); delete t.bg; layers(); panel(); };
          q('#ed-cb').onclick = () => { E.pal = !E.pal; panel(); };
          const cc = q('#ed-cc'); if (cc) cc.oninput = () => { const t = live(); if (!t) return; t.color = cc.value; place(); const cb = q('#ed-cb'); if (cb) cb.style.background = t.color; };
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
        } else if (E.tab === 'photo') {
          photoPanel(pn);
        } else {
          gifPanel(pn);
        }
      }
      const SHAPES = ['rect', 'star', 'circle', 'square'], SHI = {
        rect: '<rect x="4" y="6" width="16" height="12" rx="4"/>',
        star: '<path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.5l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" stroke-linejoin="round"/>',
        circle: '<circle cx="12" cy="12" r="8"/>',
        square: '<rect x="5" y="5" width="14" height="14"/>' };
      function photoPanel(pn) {
        const se = selEl(), ph = se && se.k === 'photo' ? se : null, cur = ph ? ph.shape : (E.shape || 'rect');
        pn.innerHTML = `<div class="ed-tr ed-sh">${SHAPES.map((k) => `<button type="button" class="ed-b ed-shb${cur === k ? ' on' : ''}" data-sh="${k}" aria-label="${esc(tx('shapes')[k])}"><svg viewBox="0 0 24 24">${SHI[k]}</svg></button>`).join('')}<button type="button" class="ed-b" id="ed-pa">${esc(tx('addPhoto'))}</button></div><input type="file" id="ed-pf" accept="image/*" hidden><p class="ed-note">${esc(tx('photoHint'))}</p>`;
        pn.querySelectorAll('[data-sh]').forEach((b) => { b.onclick = async () => {
          E.shape = b.dataset.sh; const t = selEl();
          if (t && t.k === 'photo') { try { t.shape = E.shape; t.src = shapePhoto(await loadImage(t.raw), t.shape); layers(); } catch (e) { flash(tx('err')); } }
          panel();
        }; });
        q('#ed-pa').onclick = () => q('#ed-pf').click();
        q('#ed-pf').onchange = async (ev) => {
          const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return;
          if (E.els.length >= 24) return;
          const u = URL.createObjectURL(f);
          try {
            const im = await loadImage(u), k = Math.min(1, 1100 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            const raw = c.toDataURL('image/jpeg', .86), shape = E.shape || 'rect';
            addEl({ k: 'photo', x: 50, y: 50, w: shape === 'rect' ? 56 : 44, r: 0, shape, raw, src: shapePhoto(await loadImage(raw), shape) });
            panel();
          } catch (e) { flash(tx('err')); } finally { URL.revokeObjectURL(u); }
        };
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
      root.querySelectorAll('.ed-tabs button').forEach((b) => { b.onclick = () => { E.tab = b.dataset.t; const pn = q('#ed-pn'); pn.classList.remove('tc'); void pn.offsetWidth; pn.classList.add('tc'); panel(); }; });

      // ---- bake
      async function bake() {
        const c = document.createElement('canvas'); c.width = CW; c.height = CH; const x = c.getContext('2d');
        x.drawImage(base, 0, 0, CW, CH);
        if (E.filter !== 'none') { const id = x.getImageData(0, 0, CW, CH); applyFilter(id.data, FILTERS[E.filter], E.amt / 100); x.putImageData(id, 0, 0); }
        for (const e of E.els) {
          if (e.k === 'gif') continue;
          x.save(); x.translate(e.x / 100 * CW, e.y / 100 * CH); x.rotate(e.r * Math.PI / 180);
          if (e.k === 'photo') { const im = imgCache.get(e.src) || await loadImage(e.src); imgCache.set(e.src, im); const w = e.w / 100 * CW, h = w * im.height / im.width; x.drawImage(im, -w / 2, -h / 2, w, h); }
          else if (e.k === 'item') { const im = await itemImg(e.itemId); if (im) { const w = e.w / 100 * CW, h = w * im.height / im.width; x.drawImage(im, -w / 2, -h / 2, w, h); } }
          else {
            const px = e.fs / 100 * CW, lines = String(e.text).split('\n'); x.font = `${fnt(e).w} ${px}px ${fnt(e).f}`; x.textAlign = 'center'; x.textBaseline = 'middle';
            const lh = px * 1.2, tw = Math.max(...lines.map((l) => x.measureText(l).width)), th = lh * lines.length;
            const f = fxOf(e), c = e.color, fill = () => lines.forEach((l, i) => x.fillText(l, 0, (i - (lines.length - 1) / 2) * lh)), ln = (dx, dy) => lines.forEach((l, i) => x.fillText(l, dx, dy + (i - (lines.length - 1) / 2) * lh));
            x.fillStyle = c;
            if (f === 'bg') { x.fillStyle = c === '#000000' ? 'rgba(255,255,255,.85)' : 'rgba(0,0,0,.55)'; const pad = px * .4, r = px * .25, bw = tw + pad * 2, bh = th + px * .2; x.beginPath(); x.moveTo(-bw / 2 + r, -bh / 2); x.arcTo(bw / 2, -bh / 2, bw / 2, bh / 2, r); x.arcTo(bw / 2, bh / 2, -bw / 2, bh / 2, r); x.arcTo(-bw / 2, bh / 2, -bw / 2, -bh / 2, r); x.arcTo(-bw / 2, -bh / 2, bw / 2, -bh / 2, r); x.closePath(); x.fill(); x.fillStyle = c; fill(); }
            else if (f === 'shadow') { x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = px * .15; x.shadowOffsetY = px * .04; fill(); }
            else if (f === 'neon') { const g = NEON(c); x.fillStyle = '#fff'; x.shadowColor = g; [[.3, 1], [.6, 1], [1, 1], [.1, 1]].forEach(([bl]) => { x.shadowBlur = px * bl; fill(); }); x.shadowBlur = 0; x.shadowColor = 'transparent'; fill(); }
            else if (f === 'glow') { x.shadowColor = c; x.shadowBlur = px * .5; fill(); x.shadowBlur = px * .2; fill(); }
            else if (f === 'outline') { x.lineJoin = 'round'; x.lineWidth = px * .1; x.strokeStyle = CON(c); lines.forEach((l, i) => x.strokeText(l, 0, (i - (lines.length - 1) / 2) * lh)); fill(); }
            else if (f === 'retro') { x.fillStyle = CON(c); ln(px * .1, px * .1); ln(px * .05, px * .05); x.fillStyle = c; fill(); }
            else fill();
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
