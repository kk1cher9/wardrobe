/* Driply Messages — private chats with photos (Instagram-style DM). Loaded after social.js; uses the same globals + SOC.
   Server: api/dm.js. Polling (no websockets on Vercel): open chat every ~2.5 s, inbox every ~6 s, unread badge every ~25 s. */
(function () {
'use strict';
const TX = {
ru: { title: 'Чаты', newMsg: 'Новое сообщение', search: 'Поиск людей по нику или имени', noChatsT: 'Сообщений пока нет', noChatsD: 'Найдите человека и напишите первым. Можно отправлять и фото.', startChat: 'Начните переписку', you: 'Вы', photo: 'Фото', deletedMsg: 'Сообщение удалено', write: 'Сообщение…', send: 'Отправить', attach: 'Прикрепить фото', seen: 'Просмотрено', sent: 'Отправлено', sending: 'Отправляется…', failed: 'Не отправлено', retry: 'Повторить', del: 'Удалить', delQ: 'Удалить сообщение у всех?', block: 'Заблокировать', unblock: 'Разблокировать', blockQ: 'Заблокировать пользователя? Он не сможет вам писать.', blockedByMe: 'Вы заблокировали этого пользователя', blockedMe: 'Этот пользователь ограничил переписку', today: 'Сегодня', yesterday: 'Вчера', profile: 'Открыть профиль', back: 'Назад', close: 'Закрыть', cancel: 'Отмена', retryB: 'Повторить', loading: 'Загрузка…', earlier: 'Загрузить раньше', people: 'Люди', followingT: 'Вы подписаны', nobody: 'Никого не найдено', errLoad: 'Не удалось загрузить', errNet: 'Нет интернета. Проверьте соединение.', errGeneric: 'Что-то пошло не так. Повторите позже.', errRate: 'Слишком много сообщений. Подождите немного.', errImg: 'Не удалось обработать фото', errBig: 'Фото слишком большое', gateT: 'Сообщения в Driply', gateNoServer: 'Для сообщений нужен сервер: вход через Google и база данных. См. README.', gateSign: 'Войдите через Google, чтобы переписываться с другими пользователями.', needProfT: 'Сначала создайте профиль Driply', needProfD: 'Профиль нужен, чтобы вас могли найти и написать.', createProf: 'Создать профиль', msgBtn: 'Написать', photoMsg: '📷 Фото', dayfmt: 'ru' },
uk: { title: 'Чати', newMsg: 'Нове повідомлення', search: 'Пошук людей за ніком або іменем', noChatsT: 'Повідомлень поки немає', noChatsD: 'Знайдіть людину й напишіть першим. Можна надсилати й фото.', startChat: 'Почніть листування', you: 'Ви', photo: 'Фото', deletedMsg: 'Повідомлення видалено', write: 'Повідомлення…', send: 'Надіслати', attach: 'Прикріпити фото', seen: 'Переглянуто', sent: 'Надіслано', sending: 'Надсилається…', failed: 'Не надіслано', retry: 'Повторити', del: 'Видалити', delQ: 'Видалити повідомлення в усіх?', block: 'Заблокувати', unblock: 'Розблокувати', blockQ: 'Заблокувати користувача? Він не зможе вам писати.', blockedByMe: 'Ви заблокували цього користувача', blockedMe: 'Цей користувач обмежив листування', today: 'Сьогодні', yesterday: 'Вчора', profile: 'Відкрити профіль', back: 'Назад', close: 'Закрити', cancel: 'Скасувати', retryB: 'Повторити', loading: 'Завантаження…', earlier: 'Завантажити раніше', people: 'Люди', followingT: 'Ви підписані', nobody: 'Нікого не знайдено', errLoad: 'Не вдалося завантажити', errNet: 'Немає інтернету. Перевірте з’єднання.', errGeneric: 'Щось пішло не так. Спробуйте пізніше.', errRate: 'Забагато повідомлень. Зачекайте трохи.', errImg: 'Не вдалося обробити фото', errBig: 'Фото завелике', gateT: 'Повідомлення в Driply', gateNoServer: 'Для повідомлень потрібен сервер: вхід через Google і база даних. Див. README.', gateSign: 'Увійдіть через Google, щоб листуватися з іншими користувачами.', needProfT: 'Спершу створіть профіль Driply', needProfD: 'Профіль потрібен, щоб вас могли знайти й написати.', createProf: 'Створити профіль', msgBtn: 'Написати', photoMsg: '📷 Фото', dayfmt: 'uk' },
en: { title: 'Chats', newMsg: 'New message', search: 'Search people by username or name', noChatsT: 'No messages yet', noChatsD: 'Find someone and say hi. You can send photos too.', startChat: 'Start the conversation', you: 'You', photo: 'Photo', deletedMsg: 'Message deleted', write: 'Message…', send: 'Send', attach: 'Attach photo', seen: 'Seen', sent: 'Sent', sending: 'Sending…', failed: 'Not sent', retry: 'Retry', del: 'Delete', delQ: 'Delete this message for everyone?', block: 'Block', unblock: 'Unblock', blockQ: 'Block this user? They will not be able to message you.', blockedByMe: 'You blocked this user', blockedMe: 'This user limited the conversation', today: 'Today', yesterday: 'Yesterday', profile: 'View profile', back: 'Back', close: 'Close', cancel: 'Cancel', retryB: 'Retry', loading: 'Loading…', earlier: 'Load earlier', people: 'People', followingT: 'Following', nobody: 'Nobody found', errLoad: 'Could not load', errNet: 'No internet. Check your connection.', errGeneric: 'Something went wrong. Please try again later.', errRate: 'Too many messages. Wait a moment.', errImg: 'Could not process the photo', errBig: 'The photo is too large', gateT: 'Driply Messages', gateNoServer: 'Messages need a server: Google sign-in and a database. See the README.', gateSign: 'Sign in with Google to chat with other people.', needProfT: 'Create your Driply profile first', needProfD: 'A profile lets people find you and write to you.', createProf: 'Create profile', msgBtn: 'Message', photoMsg: '📷 Photo', dayfmt: 'en' }
};
Object.assign(TX.ru, { pushTest: 'Проверить', pushTestD: 'Уведомления включены. Нажмите, чтобы прислать тестовое уведомление себе.', pushSent: 'Тест отправлен — должно прийти за пару секунд', pushFail: 'Сервер уведомлений отклонил отправку', pushNoDev: 'Это устройство не зарегистрировано', pushNoSrv: 'Уведомления не настроены на сервере (нет ключей VAPID).', selfBlock: 'Нельзя заблокировать собственный аккаунт', pRecent: 'Был(а) недавно', pToday: 'Был(а) сегодня', pYest: 'Был(а) вчера', pWeek: 'Был(а) на этой неделе', pLong: 'Был(а) давно', saved: 'Избранное', savedD: 'Заметки для себя', savedEmpty: 'Пишите сюда заметки, ссылки, фото и видео — их видите только вы.', video: 'Видео', videoBig: 'Видео больше 14 МБ — выберите покороче', videoErr: 'Не удалось обработать видео', pushT: 'Уведомления о сообщениях', pushD: 'Получайте уведомление, когда вам пишут, даже если приложение закрыто.', pushOn: 'Включить', pushIos: 'Чтобы получать уведомления на iPhone, добавьте сайт на экран «Домой» и откройте его оттуда.', pushDone: 'Уведомления включены', pushDenied: 'Уведомления запрещены в настройках телефона', noFwdVid: 'Видео пока нельзя пересылать',  online: 'в сети', lastSeen: 'был(а) в сети', justNow: 'только что', mAgo: 'мин назад', hAgo: 'ч назад', todayAt: 'сегодня в', yestAt: 'вчера в', longAgo: 'давно', reply: 'Ответить', copy: 'Копировать', fwd: 'Переслать', pick: 'Выбрать', copied: 'Скопировано', fwdTo: 'Переслать в…', fwdDone: 'Переслано', fwdLabel: 'Пересланное', replyTo: 'Ответ', you2: 'Вы', photo2: 'Фото', picked: 'Выбрано', noChatsFwd: 'Сначала начните хотя бы один чат', delSelQ: 'Удалить выбранные сообщения у всех?', onlyMine: 'Удалить можно только свои сообщения' });
Object.assign(TX.uk, { pushTest: 'Перевірити', pushTestD: 'Сповіщення увімкнено. Натисніть, щоб надіслати тестове собі.', pushSent: 'Тест надіслано — має прийти за кілька секунд', pushFail: 'Сервер сповіщень відхилив надсилання', pushNoDev: 'Цей пристрій не зареєстровано', pushNoSrv: 'Сповіщення не налаштовані на сервері (немає ключів VAPID).', selfBlock: 'Не можна заблокувати власний акаунт', pRecent: 'Був(ла) нещодавно', pToday: 'Був(ла) сьогодні', pYest: 'Був(ла) вчора', pWeek: 'Був(ла) цього тижня', pLong: 'Був(ла) давно', saved: 'Збережене', savedD: 'Нотатки для себе', savedEmpty: 'Пишіть сюди нотатки, посилання, фото та відео — їх бачите лише ви.', video: 'Відео', videoBig: 'Відео більше 14 МБ — виберіть коротше', videoErr: 'Не вдалося обробити відео', pushT: 'Сповіщення про повідомлення', pushD: 'Отримуйте сповіщення, коли вам пишуть, навіть якщо застосунок закрито.', pushOn: 'Увімкнути', pushIos: 'Щоб отримувати сповіщення на iPhone, додайте сайт на екран «Додому» і відкрийте його звідти.', pushDone: 'Сповіщення увімкнено', pushDenied: 'Сповіщення заборонені в налаштуваннях телефону', noFwdVid: 'Відео поки не можна пересилати',  online: 'в мережі', lastSeen: 'був(ла) в мережі', justNow: 'щойно', mAgo: 'хв тому', hAgo: 'год тому', todayAt: 'сьогодні о', yestAt: 'вчора о', longAgo: 'давно', reply: 'Відповісти', copy: 'Копіювати', fwd: 'Переслати', pick: 'Вибрати', copied: 'Скопійовано', fwdTo: 'Переслати до…', fwdDone: 'Переслано', fwdLabel: 'Переслане', replyTo: 'Відповідь', you2: 'Ви', photo2: 'Фото', picked: 'Вибрано', noChatsFwd: 'Спершу почніть хоча б один чат', delSelQ: 'Видалити вибрані повідомлення в усіх?', onlyMine: 'Видаляти можна лише свої повідомлення' });
Object.assign(TX.en, { pushTest: 'Test', pushTestD: 'Notifications are on. Tap to send yourself a test.', pushSent: 'Test sent — it should arrive in a few seconds', pushFail: 'The push service rejected the message', pushNoDev: 'This device is not registered', pushNoSrv: 'Notifications are not configured on the server (VAPID keys missing).', selfBlock: "You can't block your own account", pRecent: 'Last seen recently', pToday: 'Last seen today', pYest: 'Last seen yesterday', pWeek: 'Last seen this week', pLong: 'Last seen a long time ago', saved: 'Saved messages', savedD: 'Notes to self', savedEmpty: 'Write notes, links, photos and videos here — only you can see them.', video: 'Video', videoBig: 'Video is over 14 MB — pick a shorter one', videoErr: 'Could not process the video', pushT: 'Message notifications', pushD: 'Get notified when someone writes to you, even when the app is closed.', pushOn: 'Turn on', pushIos: 'To get notifications on iPhone, add the site to your Home Screen and open it from there.', pushDone: 'Notifications are on', pushDenied: 'Notifications are blocked in your phone settings', noFwdVid: 'Videos cannot be forwarded yet',  online: 'online', lastSeen: 'last seen', justNow: 'just now', mAgo: 'min ago', hAgo: 'h ago', todayAt: 'today at', yestAt: 'yesterday at', longAgo: 'a while ago', reply: 'Reply', copy: 'Copy', fwd: 'Forward', pick: 'Select', copied: 'Copied', fwdTo: 'Forward to…', fwdDone: 'Forwarded', fwdLabel: 'Forwarded', replyTo: 'Reply', you2: 'You', photo2: 'Photo', picked: 'Selected', noChatsFwd: 'Start at least one chat first', delSelQ: 'Delete selected messages for everyone?', onlyMine: 'You can only delete your own messages' });
const lg = () => (window.I18N && I18N.lang) || 'ru';
const t = (k) => { const v = (TX[lg()] || TX.ru)[k]; return v === undefined ? TX.ru[k] : v; };
const loc = () => (window.I18N && I18N.loc) || 'ru-RU';
const VB = '<svg class="vb" viewBox="0 0 24 24" width="15" height="15" role="img" aria-label="verified"><circle cx="12" cy="12" r="10.5" fill="#3b82f6"/><path d="M7.600 12.400l3 3 5.800-6.200" stroke="#fff" stroke-width="2.300" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const vb = (a) => (a && a.verified ? VB : '');
const E = (s) => esc(String(s == null ? '' : s));
Object.assign(I, {
  chat2: '<path d="M20.5 11.6c0 4.2-3.8 7.4-8.5 7.4-1 0-1.9-.1-2.8-.4L4.5 20l1.3-3.7C4.4 15 3.5 13.4 3.5 11.6 3.5 7.4 7.3 4.2 12 4.2s8.5 3.2 8.5 7.4z"/>',
  send: '<path d="M4 12l16-7-6 15-2.5-6.2z"/><path d="M11.500 13.800L20 5"/>',
  clip: '<rect x="3.500" y="5" width="17" height="14" rx="2.500"/><circle cx="9" cy="10.500" r="1.600"/><path d="M4 17l5-4.500 3.500 3L16 12l4.500 4.500"/>',
  pen: '<path d="M4 20l1-4L16.500 4.500a2 2 0 013 3L8 19z"/>',
  bm: '<path d="M7 4.500h10a1 1 0 011 1V20l-6-4-6 4V5.500a1 1 0 011-1z"/>',
  play: '<path d="M8.500 5.500v13l10.500-6.500z"/>',
  rep: '<path d="M9.500 6L4 11.500 9.500 17"/><path d="M4 11.500h9a7 7 0 017 7"/>',
  cpy: '<rect x="8.500" y="8.500" width="11" height="11" rx="2.500"/><path d="M15.500 8.500v-2a2 2 0 00-2-2h-7a2 2 0 00-2 2v7a2 2 0 002 2h2"/>',
  fw: '<path d="M14.500 6L20 11.500 14.500 17"/><path d="M20 11.500h-9a7 7 0 00-7 7"/>',
  sl: '<circle cx="12" cy="12" r="9"/><path d="M8 12.300l3 3 5-5.600"/>',
  tr: '<path d="M4.500 7h15M9.500 7V4.500h5V7M6.500 7l.8 12a1.500 1.500 0 001.500 1.400h6.400a1.500 1.500 0 001.500-1.400l.8-12"/>'
});
const ico = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const mkS = () => ({ convs: null, loading: false, err: null, at: 0, unread: 0, view: 'list', q: '', res: null, following: null, searching: false, open: null, gated: 'load' });
let st = mkS();
/* ---- on-device cache: chats open instantly after a restart (photos come from the service-worker media cache) */
const LK = 'wdm:', lk = (k) => LK + (typeof UID !== 'undefined' && UID ? UID : 'g') + ':' + k; // per account
const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(lk(k)) || 'null'); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(lk(k), JSON.stringify(v)); } catch (e) { /* quota: just skip */ } };
function saveCache() {
  const me = C; if (!me || !me.id || !me.exists) return;
  const msgs = me.msgs.filter((m) => !String(m.id).startsWith('tmp')).slice(-150).map((m) => ({ ...m, local: undefined, full: undefined, _new: 0 }));
  if (msgs.length) { const ix = (lsGet('cidx') || []).filter((x) => x !== me.id); ix.unshift(me.id); ix.slice(14).forEach((id) => { try { localStorage.removeItem(lk('c:' + id)); } catch (e) { /* ignore */ } }); lsSet('cidx', ix.slice(0, 14)); }
  if (msgs.length) lsSet('c:' + me.id, { msgs, peerRead: me.peerRead, more: me.more || msgs.length >= 50, pres: me.pres && me.pres.st === 'online' ? { ...me.pres, st: 'recent' } : me.pres });
}
function wipeLocal() {
  try { Object.keys(localStorage).filter((k) => k.startsWith(LK)).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
  try { caches.delete('wd-media'); } catch (e) { /* ignore */ }
}
/* ---- notifications (Web Push) */
const u8 = (b) => { const p = '='.repeat((4 - (b.length % 4)) % 4), r = atob((b + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = () => navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
function pushState() {
  if (!(st.cfg && st.cfg.push)) return 'none';
  if (isIOS() && !standalone()) return 'ios';
  if (!('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window)) return 'none';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted' && lsGet('push')) return 'on';
  return 'ask';
}
async function subscribePush() {
  const reg = await navigator.serviceWorker.ready; let sub = await reg.pushManager.getSubscription();
  if (sub && sub.options && sub.options.applicationServerKey) { // server keys were changed -> the old subscription can never be delivered: renew it
    try { const k = new Uint8Array(sub.options.applicationServerKey), n = u8(st.cfg.push); if (k.length !== n.length || k.some((v, i) => v !== n[i])) { await pq('push', { off: 1, sub: sub.toJSON() }).catch(() => {}); await sub.unsubscribe(); sub = null; } } catch (e) { /* keep */ }
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(st.cfg.push) });
  await pq('push', { sub: sub.toJSON() }); lsSet('push', 1);
}
async function enablePush() {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast(t('pushDenied')); refresh(); return; }
    await subscribePush(); toast(t('pushDone'));
  } catch (e) { toast(errText(e)); }
  refresh();
}
function pushBanner() {
  const ps = pushState();
  if (ps === 'ask') return `<div class="ch-pb"><div><b>${E(t('pushT'))}</b><span>${E(t('pushD'))}</span></div><button onclick="CHAT.pushOn()">${E(t('pushOn'))}</button></div>`;
  if (ps === 'ios') return `<div class="ch-pb"><div><b>${E(t('pushT'))}</b><span>${E(t('pushIos'))}</span></div></div>`;
  if (ps === 'on') return `<div class="ch-pb"><div><b>${E(t('pushT'))}</b><span>${E(t('pushTestD'))}</span></div><button onclick="CHAT.pushTest()">${E(t('pushTest'))}</button></div>`;
  if (ps === 'denied') return `<div class="ch-pb"><div><b>${E(t('pushT'))}</b><span>${E(t('pushDenied'))}</span></div></div>`;
  if (st.cfg && !st.cfg.push && st.cfg.social) return `<div class="ch-pb"><div><b>${E(t('pushT'))}</b><span>${E(t('pushNoSrv'))}</span></div></div>`;
  return '';
}
async function pushTest() {
  try {
    await subscribePush(); const j = await pq('pushtest', {});
    if (!j.devices) toast(t('pushNoDev')); else if (j.ok) toast(t('pushSent')); else toast(t('pushFail') + ' (' + (j.codes || []).join(',') + ')');
  } catch (e) { toast(errText(e)); }
}
async function wipe() {
  try { const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription(); if (sub) { await pq('push', { off: 1, sub: sub.toJSON() }).catch(() => {}); await sub.unsubscribe().catch(() => {}); } } catch (e) { /* ignore */ }
  wipeLocal();
}
function openFromPush(nick) {
  if (!nick) return; let n = 0;
  const iv = setInterval(() => { if (S.user && st.cfg && st.cfg.social) { clearInterval(iv); openWith(nick); } else if (++n > 40) clearInterval(iv); }, 400);
}
const refresh = () => { if (S.tab === 'chat') render(); };
const soc = () => window.SOC && SOC.state;

/* ------------------------------------------------------------ network */
async function api(path, opt) {
  if (!navigator.onLine) { const e = new Error('offline'); e.code = 'offline'; throw e; }
  let r; try { r = await API(path, opt); } catch (x) { const e = new Error('network'); e.code = 'offline'; throw e; }
  let j = null; try { j = await r.json(); } catch (x) { /* empty */ }
  if (!r.ok) { const e = new Error((j && j.error) || 'http_' + r.status); e.code = (j && j.error) || 'http_' + r.status; e.status = r.status; throw e; }
  return j;
}
const gq = (q) => api('/api/dm?' + q);
const pq = (op, b) => api('/api/dm', { method: 'POST', body: JSON.stringify({ op, ...(b || {}) }) });
function errText(e) {
  const c = e && e.code;
  if (c === 'offline') return t('errNet');
  if (c === 'rate_limited') return t('errRate');
  if (c === 'bad_image') return t('errImg');
  if (c === 'image_too_large') return t('errBig');
  if (c === 'blocked_by_you') return t('blockedByMe');
  if (c === 'blocked') return t('blockedMe');
  if (c === 'self_block') return t('selfBlock');
  return t('errGeneric');
}

/* ------------------------------------------------------------ helpers */
const av = (u, s) => (u && u.avatar ? `<img class="sc-av" style="width:${s}px;height:${s}px" src="${E(u.avatar)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="if(this.parentNode)this.outerHTML='<span class=&quot;sc-av ph&quot; style=&quot;width:${s}px;height:${s}px;font-size:${Math.round(s * .42)}px&quot;>${E(((u && (u.name || u.nick)) || '?').slice(0, 1).toUpperCase())}</span>'">` : `<span class="sc-av ph" style="width:${s}px;height:${s}px;font-size:${Math.round(s * .42)}px">${E(((u && (u.name || u.nick)) || '?').slice(0, 1).toUpperCase())}</span>`);
const tm = (ts) => { try { return new Date(ts).toLocaleTimeString(loc(), { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
const dayStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
function dayLabel(ts) {
  const d0 = dayStart(Date.now()), d = dayStart(ts), diff = Math.round((d0 - d) / 86400000);
  if (diff === 0) return t('today'); if (diff === 1) return t('yesterday');
  try { return new Date(ts).toLocaleDateString(loc(), { day: 'numeric', month: 'long', year: new Date(ts).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }); } catch (e) { return ''; }
}
function listTime(ts) {
  const diff = Math.round((dayStart(Date.now()) - dayStart(ts)) / 86400000);
  if (diff === 0) return tm(ts);
  if (diff < 7) { try { return new Date(ts).toLocaleDateString(loc(), { weekday: 'short' }); } catch (e) { return ''; } }
  try { return new Date(ts).toLocaleDateString(loc(), { day: 'numeric', month: 'short' }); } catch (e) { return ''; }
}
const stateBox = (icon, title, desc, btn) => `<div class="sc-state">${icon ? `<div class="sc-sic">${ico(icon, 34)}</div>` : ''}<b>${E(title)}</b>${desc ? `<p>${E(desc)}</p>` : ''}${btn || ''}</div>`;
const skel = (n) => Array.from({ length: n }, () => '<div class="ch-sk"><i></i><span></span></div>').join('');
function dataBytes(u) { return Math.round((u.length - u.indexOf(',') - 1) * 3 / 4); }
const MAXV = 14 * 1024 * 1024;
async function prepVideo(file) {
  if (file.size > MAXV) throw new Error('big');
  const mime = file.type && /^video\/(mp4|quicktime|webm)$/.test(file.type) ? file.type : /\.mov$/i.test(file.name) ? 'video/quicktime' : /\.webm$/i.test(file.name) ? 'video/webm' : 'video/mp4';
  const url = URL.createObjectURL(file), v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
  try {
    await new Promise((ok_, no) => { const to = setTimeout(() => no(new Error('timeout')), 12000); v.onloadedmetadata = () => { clearTimeout(to); ok_(); }; v.onerror = () => { clearTimeout(to); no(new Error('bad')); }; });
    const dur = v.duration || 0, w = v.videoWidth || 640, h = v.videoHeight || 360;
    try { v.currentTime = Math.min(1, dur / 3); await new Promise((ok_) => { const to = setTimeout(ok_, 4000); v.onseeked = () => { clearTimeout(to); ok_(); }; }); } catch (e) { /* first frame */ }
    const sc = Math.min(1, 360 / Math.max(w, h)), cv = document.createElement('canvas'); cv.width = Math.max(2, Math.round(w * sc)); cv.height = Math.max(2, Math.round(h * sc));
    cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
    let q = .72, poster = cv.toDataURL('image/jpeg', q); while (poster.length > 90000 && q > .3) { q -= .1; poster = cv.toDataURL('image/jpeg', q); }
    if (poster.length > 90000) throw new Error('poster');
    return { file, mime, poster, dur, w, h };
  } finally { URL.revokeObjectURL(url); v.removeAttribute('src'); v.load(); }
}
const b64Chunk = (blob) => new Promise((ok_, no) => { const r = new FileReader(); r.onload = () => ok_(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); });
function setProg(p) {
  const row = C && C.el.querySelector(`.ch-row2[data-id="${CSS.escape(p.id)}"]`); if (!row) return;
  const i = row.querySelector('.ch-prog i'), b = row.querySelector('.ch-play b'); const v = Math.round(p.prog || 0);
  if (i) i.style.width = v + '%'; if (b) b.textContent = v + '%';
}
async function transmitVid(p) {
  const me = C; if (!me) return; p.st = 'sending'; p.prog = 0;
  try {
    const target = me.id && me.exists ? { id: me.id } : { nick: me.user.nick };
    const f = p.file, vs = await pq('vstart', { ...target, mime: f.type && /^video\//.test(f.type) ? f.type : 'video/mp4', size: f.size, dur: p.vid.dur, w: p.vid.w, h: p.vid.h, poster: p.vid.poster });
    for (let i = 0; i < vs.n; i++) {
      const data = await b64Chunk(f.slice(i * vs.chunk, Math.min(f.size, (i + 1) * vs.chunk)));
      for (let k = 0; ; k++) { try { await pq('vchunk', { id: vs.id, mid: vs.mid, i, data }); break; } catch (e) { if (k >= 3 || e.code === 'rate_limited') throw e; await new Promise((r) => setTimeout(r, 700 * (k + 1))); } }
      p.prog = ((i + 1) / vs.n) * 96; setProg(p);
    }
    const j = await pq('vdone', { id: vs.id, mid: vs.mid, text: p.payload.text, reply: p.payload.reply });
    p.prog = 100; setProg(p);
    if (C !== me) return;
    me.id = j.id; me.exists = true; me.pending = me.pending.filter((x) => x !== p);
    if (!me.msgs.some((m) => m.id === j.msg.id)) { if (!j.msg.re && p.re) j.msg.re = p.re; me.msgs.push(j.msg); }
    saveCache(); renderMsgs(true);
  } catch (e) {
    if (C !== me) return; p.st = 'failed';
    if (e.code === 'blocked' || e.code === 'blocked_by_you') { me.pending = me.pending.filter((x) => x !== p); if (e.code === 'blocked') me.blockedMe = true; else me.blockedByMe = true; me.el.querySelector('#ch-comp').innerHTML = composerHtml(); wireComposer(); }
    toast(e.code === 'video_too_large' ? t('videoBig') : errText(e)); renderMsgs(false);
  }
}
/* drag the full-screen viewer up/down: it follows the finger, fades, and flies away in the direction you pulled */
function swipeDismiss(v, target, bottomSafe, onClose) {
  let g = null, drag = false, closing = false; const H = () => innerHeight || 800;
  v.style.touchAction = 'none';
  const bg = (a) => { v.style.background = `rgba(0,0,0,${a})`; };
  v.addEventListener('touchstart', (e) => {
    if (closing || e.touches.length !== 1) { g = null; return; } const x = e.touches[0];
    if (bottomSafe) { const r = target.getBoundingClientRect(); if (x.clientY > r.bottom - bottomSafe) { g = null; return; } } // native video controls (scrubber) stay usable
    if (e.target.closest('.sc-ic')) { g = null; return; }
    g = { x: x.clientX, y: x.clientY, t: Date.now(), dy: 0 }; drag = false;
  }, { passive: true });
  v.addEventListener('touchmove', (e) => {
    if (!g || closing) return; const x = e.touches[0], dx = x.clientX - g.x, dy = x.clientY - g.y;
    if (!drag) { if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.2) { drag = true; v.style.transition = 'none'; target.style.transition = 'none'; target.style.willChange = 'transform'; } else if (Math.abs(dx) > 14) { g = null; return; } else return; }
    e.preventDefault(); g.dy = dy; g.last = { y: x.clientY, t: Date.now() };
    const k = Math.min(1, Math.abs(dy) / (H() * .5));
    target.style.transform = `translate3d(0,${dy}px,0) scale(${1 - k * .12})`; bg(Math.max(0, .96 * (1 - k * 1.1)));
  }, { passive: false });
  const end = () => {
    if (!g || !drag) { g = null; return; } const dy = g.dy, dt = Math.max(1, Date.now() - g.t), vel = Math.abs(dy) / dt; g = null; drag = false;
    if (Math.abs(dy) > 90 || (vel > .55 && Math.abs(dy) > 30)) { // fly out the way it was pulled
      closing = true; const dir = dy < 0 ? -1 : 1;
      target.style.transition = 'transform .26s cubic-bezier(.3,.7,.4,1)'; v.style.transition = 'background .26s ease';
      target.style.transform = `translate3d(0,${dir * H()}px,0) scale(.85)`; bg(0); onClose(260);
    } else { // not far enough: spring back
      target.style.transition = 'transform .3s cubic-bezier(.34,1.4,.5,1)'; v.style.transition = 'background .3s ease';
      target.style.transform = ''; v.style.background = '';
    }
  };
  v.addEventListener('touchend', end); v.addEventListener('touchcancel', end);
}
function viewVideo(id) {
  const m = findMsg(id); if (!m || !m.vid || !m.vid.url || m.st) return;
  const v = document.createElement('div'); v.className = 'ch-iv vv';
  v.innerHTML = `<button class="sc-ic" aria-label="${E(t('close'))}">${ico('x', 26)}</button><video controls playsinline autoplay preload="metadata" controlslist="nodownload noremoteplayback" disablepictureinpicture disableremoteplayback poster="${E(m.vid.poster)}" src="${E(m.vid.url)}"></video>`;
  const vid = v.querySelector('video'), t0 = Date.now();
  const close = (ms) => { try { vid.pause(); } catch (e) { /* ignore */ } if (ms) { setTimeout(() => { try { vid.removeAttribute('src'); vid.load(); } catch (e) { /* ignore */ } v.remove(); }, ms); return; } try { vid.removeAttribute('src'); vid.load(); } catch (e) { /* ignore */ } v.classList.add('out'); setTimeout(() => v.remove(), 180); };
  v.querySelector('button').onclick = (ev) => { ev.stopPropagation(); close(); };
  v.onclick = (ev) => { if (ev.target === v && Date.now() - t0 > 150) close(); };
  vid.addEventListener('contextmenu', (e) => e.preventDefault());
  document.body.appendChild(v); swipeDismiss(v, vid, 72, close);
}
const fmtDur = (d) => { d = Math.round(d); return Math.floor(d / 60) + ':' + String(d % 60).padStart(2, '0'); };
const fileToUrl = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
async function encodeImg(src, max, q, limit) {
  const im = await loadImg(src), k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
  let u = '', qq = q;
  for (let i = 0; i < 6; i++) { u = c.toDataURL('image/webp', qq); if (!u.startsWith('data:image/webp')) u = c.toDataURL('image/jpeg', qq); if (dataBytes(u) <= limit) return u; qq -= .1; if (qq < .3) break; }
  if (dataBytes(u) > limit) return encodeImg(u, Math.round(max * .75), .6, limit);
  return u;
}
function sheet(html) {
  document.querySelectorAll('.modal').forEach((x) => x.remove());
  const m = document.createElement('div'); m.className = 'modal sc-m'; m.id = 'md'; m.style.zIndex = 400;
  m.onclick = (ev) => { if (ev.target === m) closeM(m); };
  m.innerHTML = `<div class="sheet sc-sheet">${html}</div>`; document.body.appendChild(m); return m;
}

/* ------------------------------------------------------------ gate / me */
async function ensure() {
  const cfg = await getCfg().catch(() => null);
  st.cfg = cfg;
  if (!cfg || !cfg.social) { st.gated = 'server'; return false; }
  if (!S.user) { st.gated = 'sign'; return false; }
  const s = soc();
  if (s && s.me === undefined && !s.meLoading) await SOC.loadMe();
  const me = soc() && soc().me;
  if (!me) { st.gated = 'load'; return false; }
  if (!me.profile) { st.gated = 'profile'; return false; }
  st.gated = null; return true;
}
function gateView() {
  const g = st.gated;
  const top = `<div class="sc-top"><h2>${E(t('title'))}</h2></div>`;
  if (g === undefined || g === null && st.cfg === undefined) return top + skel(3);
  if (g === 'server') return top + stateBox('chat2', t('gateT'), t('gateNoServer'));
  if (g === 'sign') return top + `<div class="sc-state"><div class="sc-sic">${ico('chat2', 34)}</div><b>${E(t('gateT'))}</b><p>${E(t('gateSign'))}</p><div id="gbtn" class="gb" style="margin:14px auto 4px;min-height:44px;display:flex;justify-content:center"></div></div>`;
  if (g === 'profile') return top + stateBox('user', t('needProfT'), t('needProfD'), `<button class="btn" onclick="SOC.setup()">${E(t('createProf'))}</button>`);
  return top + skel(3);
}

/* ------------------------------------------------------------ inbox */
const myNick = () => { try { const m = soc() && soc().me; return (m && m.profile && m.profile.nick) || ''; } catch (e) { return ''; } };
const isSelf = (c) => !!c && !!c.user && c.user.nick === myNick();
function openSaved() { const c = st.convs && st.convs.find(isSelf); if (c) openConv(c.id); else openWith(myNick()); }
function savedRow() {
  const nk = myNick(); if (!nk) return ''; const c = st.convs && st.convs.find(isSelf), l = c && c.last;
  const prev = !l ? t('savedD') : l.t === 'del' ? t('deletedMsg') : l.t === 'img' ? t('photoMsg') : l.t === 'vid' ? '🎥 ' + t('video') : l.x;
  return `<button class="ch-row ch-sv${st.shown ? '' : ' in'}" onclick="CHAT.openSaved()"><span class="ch-svi">${ico('bm', 26)}</span><span class="ch-rt"><b>${E(t('saved'))}</b><small data-nt>${E(prev)}</small></span><span class="ch-rm"><i>${c ? E(listTime(c.ts)) : ''}</i></span></button>`;
}
function rowHtml(c) {
  const l = c.last;
  const prev = !l ? t('startChat') : l.t === 'del' ? t('deletedMsg') : (l.by === 'me' ? t('you') + ': ' : '') + (l.t === 'img' ? t('photoMsg') : l.t === 'vid' ? '🎥 ' + t('video') : l.x);
  return `<button class="ch-row${st.shown ? '' : ' in'}${c.unread ? ' un' : ''}" onclick="CHAT.openConv('${E(c.id)}')">${av(c.user, 52)}<span class="ch-rt"><b data-nt>${E(c.user.name || c.user.nick)}${vb(c.user)}</b><small data-nt>${E(prev)}</small></span><span class="ch-rm"><i>${E(listTime(c.ts))}</i>${c.unread ? `<em>${c.unread > 99 ? '99+' : c.unread}</em>` : ''}</span></button>`;
}
function listView() {
  const top = `<div class="sc-top"><h2>${E(t('title'))}</h2><button class="sc-pub" onclick="CHAT.newChat()">${ico('pen', 16)} ${E(t('newMsg'))}</button></div>`;
  if (st.err && !st.convs) return top + stateBox('chat2', t('errLoad'), errText(st.err), `<button class="btn" onclick="CHAT.reload()">${E(t('retryB'))}</button>`);
  if (!st.convs) return top + pushBanner() + `<div class="ch-list">${savedRow()}</div>` + skel(3);
  const others = st.convs.filter((c) => !isSelf(c)), sv = savedRow();
  if (!others.length) { st.shown = true; return top + pushBanner() + `<div class="ch-list">${sv}</div>` + stateBox('chat2', t('noChatsT'), t('noChatsD'), `<button class="btn" onclick="CHAT.newChat()">${E(t('newMsg'))}</button>`); }
  const h = top + pushBanner() + `<div class="ch-list">${sv}${others.map(rowHtml).join('')}</div>`; st.shown = true; return h;
}
function userRow(u) { return `<button class="ch-row in" onclick="CHAT.openWith('${E(u.nick)}')">${av(u, 46)}<span class="ch-rt"><b data-nt>${E(u.name || u.nick)}${vb(u)}</b><small data-nt>@${E(u.nick)}</small></span></button>`; }
function newView() {
  const q = st.q.trim();
  let body;
  if (q.length >= 2) body = st.searching && !st.res ? skel(2) : !st.res || !st.res.length ? stateBox('search', t('nobody')) : `<h4 class="sc-h">${E(t('people'))}</h4>${st.res.map(userRow).join('')}`;
  else body = st.following === null ? skel(2) : st.following.length ? `<h4 class="sc-h">${E(t('followingT'))}</h4>${st.following.map(userRow).join('')}` : `<p class="note" style="text-align:center">${E(t('search'))}</p>`;
  return `<div class="sc-top"><button class="sc-ic" onclick="CHAT.toList()" aria-label="${E(t('back'))}">${ico('back')}</button><h2>${E(t('newMsg'))}</h2></div><div class="sc-sb">${ico('search', 18)}<input id="ch-q" type="search" autocomplete="off" autocapitalize="off" value="${E(st.q)}" placeholder="${E(t('search'))}" oninput="CHAT.q(this.value)"></div>${body}`;
}
function view() {
  if (st.gated !== null || !S.user) { if (!S.user && st.gated === null) st.gated = 'sign'; return `<div class="sc">${gateView()}</div>`; }
  if (!st.convs && !st.err) { const cc = lsGet('convs'); if (cc) st.convs = cc; }
  return `<div class="sc">${st.view === 'new' ? newView() : listView()}</div>`;
}
async function loadList(force) {
  if (st.loading) return; st.loading = true; let same = false;
  try { const j = await gq('a=convs'); const sig = JSON.stringify(j.convs.map((c) => [c.id, c.ts, c.unread, c.last && c.last.x, c.last && c.last.t])); same = sig === st.sig && !st.err && !!st.convs; st.sig = sig; st.convs = j.convs; lsSet('convs', j.convs.slice(0, 30)); st.unread = j.unread; st.err = null; st.at = Date.now(); badge(j.unread); } catch (e) { st.err = e; st.at = Date.now(); if (!st.convs) st.convs = null; } // st.at also on failure: no instant retry loop while offline
  st.loading = false; if (S.tab === 'chat' && !st.open && st.view === 'list' && !same) refresh();
}
let pollT = null;
function after() {
  if (st.gated !== null || !S.user) {
    if (st.ensuring) return; st.ensuring = true; const before = st.gated;
    ensure().then((okk) => {
      st.ensuring = false;
      if (S.tab !== 'chat') return;
      if (okk || st.gated !== before) refresh();
      else if (st.gated === 'sign') { const g = document.getElementById('gbtn'); if (g && typeof afterSettings === 'function') afterSettings(); }
    });
    if (st.gated === 'sign') { const g = document.getElementById('gbtn'); if (g && typeof afterSettings === 'function') afterSettings(); }
    return;
  }
  if (st.view === 'list' && !st.loading && (st.convs === null && !st.err || Date.now() - st.at > 6000)) loadList();
  if (st.view === 'new' && st.following === null) loadFollowing();
  clearInterval(pollT); pollT = setInterval(() => { if (S.tab === 'chat' && !document.hidden && !st.open && st.view === 'list' && st.gated === null) loadList(); }, 6000);
}
async function loadFollowing() {
  const me = soc() && soc().me && soc().me.profile; if (!me) return;
  try { const j = await api('/api/social?a=follows&nick=' + encodeURIComponent(me.nick) + '&kind=following'); st.following = j.users || []; } catch (e) { st.following = []; }
  if (S.tab === 'chat' && st.view === 'new') softNew();
}
function softNew() { const box = document.getElementById('ch-q'), had = box && document.activeElement === box, pos = box ? box.selectionStart : 0; render(); const nb = document.getElementById('ch-q'); if (nb && had) { nb.focus(); try { nb.setSelectionRange(pos, pos); } catch (e) { /* ignore */ } } }
let qT = null;
function q(v) {
  st.q = v; clearTimeout(qT);
  if (v.trim().length < 2) { st.res = null; st.searching = false; softNew(); return; }
  st.searching = true;
  qT = setTimeout(async () => {
    const mine = v;
    try { const j = await api('/api/social?a=search&q=' + encodeURIComponent(mine.trim())); if (st.q !== mine) return; st.res = j.users.filter((u) => !u.me); } catch (e) { if (st.q === mine) st.res = []; }
    st.searching = false; softNew();
  }, 320);
}
const newChat = () => { st.view = 'new'; st.q = ''; st.res = null; st.following = null; refresh(); scrollTo(0, 0); };
const toList = () => { st.view = 'list'; refresh(); };
const reload = () => { st.err = null; st.convs = null; refresh(); };

/* ------------------------------------------------------------ unread badge on the nav button */
function badge(n) {
  st.unread = n;
  const b = typeof navEl !== 'undefined' && navEl.querySelector('[data-t=chat]'); if (!b) return;
  if (n > 0) b.dataset.b = n > 9 ? '9+' : String(n); else delete b.dataset.b;
}
async function pollBadge() {
  if (!S.user || document.hidden || !navigator.onLine || !(st.cfg && st.cfg.social)) return;
  try { const u = await gq('a=unread'); st.admin = !!u.admin; badge(u.unread); } catch (e) { /* ignore */ }
  if (!st.pushSynced && pushState() === 'on') { st.pushSynced = true; subscribePush().catch(() => {}); }
}

/* ------------------------------------------------------------ chat overlay */
let C = null; // the open conversation
const nid = () => 'tmp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const TICK1 = '<svg class="ck1" viewBox="0 0 18 12" width="15" height="10"><path d="M2 6.500l3.500 3.500L12 2"/></svg>';
const TICK2 = '<svg class="ck2" viewBox="0 0 22 12" width="19" height="10"><path d="M1.500 6.500L5 10 11.500 2"/><path d="M8.500 8.500L10 10 16.500 2"/></svg>';
function tickOf(m) { if (!m.mine || m.del) return ''; if (m.st === 'failed') return '<b class="ch-bad">!</b>'; if (m.st === 'sending') return '<svg class="ck0" viewBox="0 0 12 12" width="11" height="11"><circle cx="6" cy="6" r="4.500"/><path d="M6 3.500V6l1.800 1.200"/></svg>'; if (C.self) return TICK1; return C.peerRead >= m.ts ? TICK2.replace('class="ck2"', 'class="ck2 rd"') : TICK2; }
function chipsOf(m) {
  const ok = !m.st, it = [];
  if (ok) it.push(['rep', 'reply', 'reply']); if (m.text) it.push(['cpy', 'copy', 'copy']); if (ok && !m.vid) it.push(['fw', 'fwd', 'fwd']); it.push(['sl', 'pick', 'pick']); if (m.mine && ok) it.push(['tr', 'del', 'del', 1]);
  return `<div class="ch-chips">${it.map((i) => `<button data-a="${i[2]}"${i[3] ? ' class="dg"' : ''}>${ico(i[0], 14)}<span>${E(t(i[1]))}</span></button>`).join('')}</div>`;
}
const REACTS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👎', '🙏'];
function applyRx(me, rx) { // server reaction map -> messages; returns true when something changed
  if (!rx || typeof rx !== 'object') return false; let ch = false;
  me.msgs.forEach((m) => { const nv = rx[m.id] || undefined; if (JSON.stringify(nv || null) !== JSON.stringify(m.rx || null) && !(m._rxl && Date.now() - m._rxl < 4000)) { if (nv) m.rx = nv; else delete m.rx; ch = true; } });
  return ch;
}
const rxHtml = (m) => (m.rx && m.rx.length && !m.del ? `<div class="ch-rx">${m.rx.map((r) => `<button type="button" class="${r.me ? 'me' : ''}" data-rx="${E(m.id)}" data-e="${E(r.e)}" aria-label="${E(r.e)}"><span>${r.e}</span>${r.n > 1 ? `<b>${r.n}</b>` : ''}</button>`).join('')}</div>` : '');
async function react(id, e) {
  const m = findMsg(id); if (!m || m.st || m.del || !C || !C.id) return; const me = C, old = m.rx ? JSON.parse(JSON.stringify(m.rx)) : undefined;
  const cur = (m.rx || []).find((r) => r.me), off = !e || (cur && cur.e === e);
  let rx = (m.rx || []).map((r) => ({ ...r }));
  if (cur) { cur.n; rx = rx.map((r) => (r.me ? { ...r, n: r.n - 1, me: false } : r)).filter((r) => r.n > 0); }
  if (!off) { const x = rx.find((r) => r.e === e); if (x) { x.n++; x.me = true; } else rx.push({ e, n: 1, me: true }); }
  rx.sort((a, b) => b.n - a.n); m.rx = rx.length ? rx : undefined; m._rxl = Date.now(); renderMsgs(false);
  try { const j = await pq('react', { id: me.id, mid: id, e: off ? '' : e }); if (C === me) { m.rx = j.rx && j.rx.length ? j.rx : undefined; renderMsgs(false); } if (navigator.vibrate) { try { navigator.vibrate(8); } catch (x) { /* ignore */ } } }
  catch (x) { m.rx = old; delete m._rxl; if (C === me) renderMsgs(false); toast(errText(x)); }
}
function msgHtml(m, first, lastInGroup, lastOwn) {
  let inner;
  const ts = `<span class="ch-ts">${E(tm(m.ts))}${tickOf(m)}</span>`;
  if (m.del) inner = `<div class="ch-b del" data-nt>${E(t('deletedMsg'))}</div>`;
  else {
    const has = m.img || m.local || m.vid, dim = (m.vid && m.vid.w && m.vid.h ? m.vid.w + '/' + m.vid.h : '') || (m.iw && m.ih ? m.iw + '/' + m.ih : '') || (C.dim && C.dim[m.id]);
    const vd = m.vid ? `<div class="ch-imw vd" onclick="event.stopPropagation();CHAT.vid('${E(m.id)}')"><img class="ch-img" src="${E(m.local || m.vid.poster)}" alt="" draggable="false" decoding="async"${dim ? ` style="aspect-ratio:${dim}"` : ''}><span class="ch-play">${m.st === 'sending' ? `<b>${Math.round(m.prog || 0)}%</b>` : ico('play', 28)}</span>${m.vid.dur ? `<span class="ch-dur">${E(fmtDur(m.vid.dur))}</span>` : ''}${m.st === 'sending' ? `<span class="ch-prog"><i style="width:${Math.round(m.prog || 0)}%"></i></span>` : ''}${m.text ? '' : ts}</div>` : '';
    const img = !m.vid && has ? `<img class="ch-img" src="${E(m.local || m.th || m.img)}" alt="" draggable="false" decoding="async"${dim ? ` style="aspect-ratio:${dim}"` : ''} onclick="event.stopPropagation();CHAT.img('${E(m.id)}')">` : '';
    const re = m.re ? `<div class="ch-q" data-q="${E(m.re.id)}"><b data-nt>${E(m.re.mine ? t('you2') : (C.user.name || C.user.nick))}</b><span data-nt>${E(m.re.x || (m.re.vid ? '🎥 ' + t('video') : m.re.img ? '📷 ' + t('photo2') : '…'))}</span></div>` : '';
    const fw = m.fwd ? `<div class="ch-fw">${ico('fw', 12)} ${E(t('fwdLabel'))}</div>` : '';
    inner = `<div class="ch-b${has ? ' hasimg' : ''}${m.text ? '' : ' only'}${m.st === 'sending' ? ' wait' : ''}${m.st === 'failed' ? ' bad' : ''}">${fw}${re}${vd}${img ? `<div class="ch-imw">${img}${m.text ? '' : ts}</div>` : ''}${m.text ? `<span class="ch-tx" data-nt>${E(m.text)}</span>${ts}` : ''}</div>`;
  }
  const sel = C.sel === m.id;
  let meta = '';
  if (m.st === 'failed') meta = `<div class="ch-meta bad"><span>${E(t('failed'))}</span> · <button onclick="CHAT.retry('${E(m.id)}')">${E(t('retry'))}</button> · <button onclick="CHAT.drop('${E(m.id)}')">${E(t('del'))}</button></div>`;
  else if (!C.self && m.mine && lastOwn && m.id === lastOwn.id && !m.del && !m.st) meta = `<div class="ch-meta${C.peerRead >= m.ts ? ' rd' : ''}">${E(C.peerRead >= m.ts ? t('seen') : t('sent'))}</div>`;
  const chips = sel && !C.selMode && !m.del ? chipsOf(m) : '';
  const chk = C.selMode ? `<i class="ch-ck${C.picked.has(m.id) ? ' on' : ''}">${ico('sl', 22)}</i>` : '';
  return `<div class="ch-row2${C.selMode ? ' sm' : ''}${C.picked.has(m.id) ? ' pk' : ''}" data-id="${E(m.id)}">${chk}<div class="ch-m ${m.mine ? 'me' : 'th'}${first ? ' first' : ''}${lastInGroup ? ' last' : ''}${sel ? ' sel' : ''}">${inner}${m.del ? '' : rxHtml(m)}${chips}${meta}</div></div>`;
}
function renderMsgs(stick) {
  if (!C) return; const box = C.el.querySelector('#ch-ms'); if (!box) return;
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 140, prevH = box.scrollHeight, prevTop = box.scrollTop;
  const all = C.msgs.concat(C.pending).sort((a, b) => a.ts - b.ts);
  let lastOwn = null; all.forEach((m) => { if (m.mine && !m.del && !m.st) lastOwn = m; });
  const parts = []; // {k: stable key, h: markup}; unchanged parts keep their DOM node (no image flicker)
  if (C.more) parts.push({ k: 'more', h: `<div class="ch-more" id="ch-more">${E(C.loadingMore ? t('loading') : t('earlier'))}</div>` });
  let prevDay = 0, prevBy = null;
  if (C.loading && !all.length) parts.push({ k: 'skel', h: `<div class="ch-wr">${skel(3)}</div>` });
  if (!C.loading && !all.length && !C.err) parts.push({ k: 'empty', h: `<div class="ch-empty">${C.self ? `<span class="ch-svi lg">${ico('bm', 38)}</span><b>${E(t('saved'))}</b>` : `${av(C.user, 84)}<b data-nt>${E(C.user.name || C.user.nick)}${vb(C.user)}</b><small data-nt>@${E(C.user.nick)}</small>`}<p>${E(C.self ? t('savedEmpty') : t('startChat'))}</p></div>` });
  all.forEach((m, i) => {
    const d = dayStart(m.ts); if (d !== prevDay) { parts.push({ k: 'd' + d, h: `<div class="ch-day">${E(dayLabel(m.ts))}</div>` }); prevDay = d; prevBy = null; }
    const next = all[i + 1], lastInGroup = !next || next.mine !== m.mine || dayStart(next.ts) !== d;
    const first = prevBy !== m.mine; prevBy = m.mine;
    parts.push({ k: 'm' + m.id, h: msgHtml(m, first, lastInGroup, lastOwn), isNew: !!m._new }); m._new = 0;
  });
  if (C.err && !all.length) parts.push({ k: 'err', h: `<div class="ch-wr">${stateBox('chat2', t('errLoad'), errText(C.err), `<button class="btn" onclick="CHAT.reloadChat()">${E(t('retryB'))}</button>`)}</div>` });
  const old = new Map(); [...box.children].forEach((n) => { if (n._k) old.set(n._k, n); });
  const tpl = document.createElement('template'), out = [];
  parts.forEach((p) => {
    const n0 = old.get(p.k);
    if (n0 && n0._h === p.h) { out.push(n0); old.delete(p.k); return; }
    tpl.innerHTML = p.h; const n1 = tpl.content.firstElementChild; n1._k = p.k; n1._h = p.h;
    if (n0) { // keep already-loaded pictures instead of re-creating them
      n0.querySelectorAll('img.ch-img').forEach((a) => { const b = [...n1.querySelectorAll('img.ch-img')].find((x) => x.getAttribute('src') === a.getAttribute('src')); if (b) b.replaceWith(a); });
    } else if (p.isNew) { const mm = n1.querySelector('.ch-m'); if (mm) mm.classList.add('new'); }
    out.push(n1);
  });
  old.forEach((n) => n.remove());
  let ref = box.firstElementChild;
  out.forEach((n) => { if (n === ref) { ref = ref.nextElementSibling; } else box.insertBefore(n, ref); });
  if (stick || near) box.scrollTop = box.scrollHeight; else box.scrollTop = prevTop + (box.scrollHeight - prevH);
  C.stickLoad = !!(stick || near); hookMore();
  clearTimeout(C.sct); C.sct = setTimeout(saveCache, 700);
}
function hookMore() {
  const m = C && C.el.querySelector('#ch-more'); if (!m) return;
  m.onclick = loadEarlier;
  if ('IntersectionObserver' in window) { if (C.obs) C.obs.disconnect(); C.obs = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) loadEarlier(); }, { root: C.el.querySelector('#ch-ms'), rootMargin: '120px' }); C.obs.observe(m); }
}
async function loadEarlier() {
  if (!C || C.loadingMore || !C.more || !C.id) return; C.loadingMore = true;
  const oldest = C.msgs.length ? C.msgs[0].ts : 0, box = C.el.querySelector('#ch-ms'), h0 = box.scrollHeight, y0 = box.scrollTop;
  try {
    const j = await gq('a=msgs&id=' + C.id + '&before=' + oldest);
    const have = new Set(C.msgs.map((m) => m.id)); C.msgs = j.msgs.filter((m) => !have.has(m.id)).concat(C.msgs); applyRx(C, j.rx); C.more = j.more;
  } catch (e) { /* keep the button */ }
  C.loadingMore = false; renderMsgs(false); const b2 = C.el.querySelector('#ch-ms'); if (b2) b2.scrollTop = y0 + (b2.scrollHeight - h0);
}
function presText(p, user) {
  if (!p) return { on: false, tx: user ? '@' + user.nick : '' };
  if (p.st === 'online') return { on: true, tx: t('online') };
  if (p.seen) { // exact time: only sent by the server to the privileged account
    const d = Date.now() - p.seen, s0 = dayStart(Date.now());
    if (d < 3600000) return { on: false, tx: t('lastSeen') + ' ' + Math.max(1, Math.round(d / 60000)) + ' ' + t('mAgo') };
    if (p.seen >= s0) return { on: false, tx: t('lastSeen') + ' ' + t('todayAt') + ' ' + tm(p.seen) };
    if (p.seen >= s0 - 86400000) return { on: false, tx: t('lastSeen') + ' ' + t('yestAt') + ' ' + tm(p.seen) };
    try { return { on: false, tx: t('lastSeen') + ' ' + new Date(p.seen).toLocaleDateString(loc(), { day: 'numeric', month: 'short' }) + ' ' + tm(p.seen) }; } catch (e) { return { on: false, tx: t('longAgo') }; }
  }
  return { on: false, tx: t({ recent: 'pRecent', today: 'pToday', yesterday: 'pYest', week: 'pWeek', long: 'pLong' }[p.st] || 'pLong') };
}
function statusText() {
  if (C && C.self) return { on: false, tx: t('savedD') };
  return presText(C && C.pres, C && C.user);
}
const statusHtml = () => { const s = statusText(); return (s.on ? '<i class="ch-dot"></i>' : '') + E(s.tx); };
function paintStatus() { const el = C && C.el.querySelector('.ch-st'); if (!el) return; const h = statusHtml(); if (el._h !== h) { el._h = h; el.innerHTML = h; el.classList.toggle('on', statusText().on); } }
function header() {
  const u = C.user, sv = C.self;
  return `<div class="ch-hd"><button class="sc-ic" onclick="CHAT.close()" aria-label="${E(t('back'))}">${ico('back')}</button><button class="ch-who"${sv ? '' : ' onclick="CHAT.profile()"'}>${sv ? `<span class="ch-svi sm">${ico('bm', 20)}</span>` : av(u, 38)}<span><b${sv ? '' : ' data-nt'}>${E(sv ? t('saved') : u.name || u.nick)}${sv ? '' : vb(u)}</b><small class="ch-st"${sv ? '' : ' data-nt'}>${statusHtml()}</small></span></button>${sv ? '<span style="width:44px"></span>' : `<button class="sc-ic" onclick="CHAT.menu()" aria-label="${E(t('block'))}">${ico('dots')}</button>`}</div>`;
}
function composerHtml() {
  if (C.blockedByMe) return `<div class="ch-blk">${E(t('blockedByMe'))} <button onclick="CHAT.block(false)">${E(t('unblock'))}</button></div>`;
  if (C.blockedMe) return `<div class="ch-blk">${E(t('blockedMe'))}</div>`;
  return `<div class="ch-rp" id="ch-rp" hidden></div><div class="ch-pv" id="ch-pv" hidden></div><form class="ch-cf" id="ch-cf"><button type="button" class="ch-at" id="ch-at" aria-label="${E(t('attach'))}">${ico('clip', 24)}</button><input type="file" id="ch-f" accept="image/*,video/*" hidden><textarea id="ch-ta" rows="1" maxlength="2000" placeholder="${E(t('write'))}" enterkeyhint="send"></textarea><button type="submit" class="ch-sd" id="ch-sd" aria-label="${E(t('send'))}" disabled>${ico('send', 20)}</button></form>`;
}
function openOverlay(user, id) {
  closeChat(true);
  const el = document.createElement('div'); el.className = 'ch-ov'; el.id = 'ch-ov'; document.body.appendChild(el); document.body.style.overflow = 'hidden';
  C = { el, self: user.nick === myNick(), id: id || null, user, selMode: false, picked: new Set(), reply: null, ctx: null, msgs: [], pending: [], more: false, peerRead: 0, loading: true, err: null, sel: null, blockedByMe: false, blockedMe: false, img: null, poll: 0, loadingMore: false, exists: !!id };
  if (id) { const cc = lsGet('c:' + id); if (cc && cc.msgs) { C.msgs = cc.msgs; C.peerRead = cc.peerRead || 0; C.more = !!cc.more; C.pres = cc.pres || null; C.loading = false; C.fromCache = true; } }
  paintStatus();
  el.innerHTML = `${header()}<div class="ch-ms" id="ch-ms"></div><div id="ch-comp">${composerHtml()}</div>`;
  wireComposer(); wireGestures(el.querySelector('#ch-ms')); lockUi(el); swipeBack(el); renderMsgs(true);
  const vv = window.visualViewport;
  if (vv) { C.vv = () => { if (!C) return; C.el.style.height = vv.height + 'px'; C.el.style.transform = `translateY(${vv.offsetTop}px)`; const b = C.el.querySelector('#ch-ms'); if (b && C.kb !== vv.height) { C.kb = vv.height; b.scrollTop = b.scrollHeight; } }; const f0 = C.vv; let raf = 0; C.vv = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; f0(); }); }; vv.addEventListener('resize', C.vv); vv.addEventListener('scroll', C.vv); f0(); }
  C.lastAct = Date.now(); C.stt = setInterval(paintStatus, 20000);
  const sched = () => { if (!C || C !== me0) return; const idle = Date.now() - C.lastAct, d = idle < 30000 ? 1500 : idle < 120000 ? 4000 : 9000; C.timer = setTimeout(async () => { await pollChat(); sched(); }, document.hidden ? 15000 : d); };
  const me0 = C; sched(); ['touchstart', 'keydown', 'pointerdown'].forEach((n) => el.addEventListener(n, () => { C.lastAct = Date.now(); }, { passive: true }));
  document.addEventListener('visibilitychange', onVis);
  return C;
}
const onVis = () => { if (C && !document.hidden) pollChat(); };
function closeChat(quiet) {
  if (!C) return;
  clearTimeout(C.timer); clearInterval(C.stt); saveCache(); if (C.obs) C.obs.disconnect(); const vv = window.visualViewport; if (vv && C.vv) { vv.removeEventListener('resize', C.vv); vv.removeEventListener('scroll', C.vv); }
  document.removeEventListener('visibilitychange', onVis);
  const el0 = C.el; if (quiet) el0.remove(); else { el0.classList.add('out'); el0.style.pointerEvents = 'none'; setTimeout(() => el0.remove(), 240); }
  C = null; st.open = null; document.body.style.overflow = '';
  if (!quiet) { st.at = 0; if (S.tab === 'chat') { loadList(); } pollBadge(); }
}
async function loadChat() {
  if (!C) return; const me = C;
  try {
    if (!me.id) {
      const o = await gq('a=open&nick=' + encodeURIComponent(me.user.nick));
      if (C !== me) return; me.id = o.id; me.exists = o.exists; me.user = o.user; me.blockedByMe = o.blockedByMe; me.blockedMe = o.blockedMe; me.pres = o.pres || null;
      if (!o.exists) { me.loading = false; me.err = null; me.el.querySelector('#ch-comp').innerHTML = composerHtml(); wireComposer(); renderMsgs(true); return; }
    }
    const j = await gq('a=msgs&id=' + me.id + '&mark=1');
    if (C !== me) return;
    me.msgs = j.msgs; applyRx(me, j.rx); me.more = j.more; me.peerRead = j.peerRead; if (j.user) me.user = j.user; me.blockedByMe = j.blockedByMe; me.blockedMe = j.blockedMe; me.err = null; me.loading = false; me.pres = j.pres || null;
    me.el.querySelector('.ch-hd').outerHTML = header(); me.el.querySelector('#ch-comp').innerHTML = composerHtml(); wireComposer(); renderMsgs(true); pollBadge();
  } catch (e) { if (C !== me) return; me.loading = false; me.err = e; renderMsgs(false); }
}
async function pollChat() {
  if (!C || document.hidden || C.loading || !C.id || !C.exists || C.polling) return; const me = C; me.polling = true;
  try {
    const real = me.msgs.filter((m) => !String(m.id).startsWith('tmp')), last = real.length ? real[real.length - 1].ts : 0;
    const j = await gq('a=msgs&id=' + me.id + '&after=' + last);
    if (C !== me) return;
    let changed = false; const have = new Set(me.msgs.map((m) => m.id));
    let inc = false; j.msgs.forEach((m) => { if (!have.has(m.id)) { m._new = 1; me.msgs.push(m); changed = true; me.lastAct = Date.now(); if (!m.mine) inc = true; } });
    if (applyRx(me, j.rx)) { changed = true; }
    if (inc) pq('read', { id: me.id }).catch(() => {});
    if (j.peerRead !== me.peerRead) { me.peerRead = j.peerRead; changed = true; me.lastAct = Date.now(); }
    me.pres = j.pres || null; paintStatus();
    if (j.blockedByMe !== me.blockedByMe || j.blockedMe !== me.blockedMe) { me.blockedByMe = j.blockedByMe; me.blockedMe = j.blockedMe; me.el.querySelector('#ch-comp').innerHTML = composerHtml(); wireComposer(); }
    // messages deleted by the sender: refresh the visible window occasionally
    if (changed) { renderMsgs(false); const b = me.el.querySelector('#ch-ms'); if (b && j.msgs.some((m) => !m.mine)) pollBadge(); }
    me.tick = (me.tick || 0) + 1;
    if (me.tick % 8 === 0) { // also pick up unsend/delete changes
      const k = await gq('a=msgs&id=' + me.id); if (C === me) { const del = new Set(k.msgs.filter((m) => m.del).map((m) => m.id)); let ch = false; me.msgs.forEach((m) => { if (!m.del && del.has(m.id)) { m.del = true; ch = true; } }); if (ch) renderMsgs(false); }
    }
  } catch (e) { /* offline: try again on the next tick */ }
  if (C === me) me.polling = false;
}
const dtReact = () => { const e = (typeof S !== 'undefined' && S.set && S.set.dtr) || '👍'; return REACTS.includes(e) ? e : '👍'; };
let lastTap = null;
function wireComposer() {
  if (!C) return; const el = C.el, ta = el.querySelector('#ch-ta'), f = el.querySelector('#ch-f'); if (!ta) return;
  const upd = () => { el.querySelector('#ch-sd').disabled = !(ta.value.trim() || C.img || C.vid); };
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; };
  ta.value = C.draft || ''; grow(); upd(); paintPv(); paintRp();
  ta.oninput = () => { C.draft = ta.value; grow(); upd(); };
  ta.onkeydown = (ev) => { if (ev.key === 'Enter' && !ev.shiftKey && matchMedia('(pointer:fine)').matches) { ev.preventDefault(); doSend(); } };
  el.querySelector('#ch-at').onclick = () => f.click();
  f.onchange = async (ev) => {
    const file = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!file) return;
    if (/^video\//.test(file.type) || /\.(mov|mp4|m4v|webm)$/i.test(file.name)) { try { C.vid = await prepVideo(file); C.img = null; paintPv(); upd(); } catch (e) { toast(e && e.message === 'big' ? t('videoBig') : t('videoErr')); } return; }
    try { C.vid = null; C.img = await encodeImg(await fileToUrl(file), 1280, .8, 440 * 1024); const im0 = await loadImg(C.img); C.imgW = im0.width; C.imgH = im0.height; C.th = await encodeImg(C.img, 360, .7, 60 * 1024); paintPv(); upd(); } catch (e) { toast(t('errImg')); }
  };
  el.querySelector('#ch-cf').onsubmit = (ev) => { ev.preventDefault(); doSend(); };
}
function paintPv() {
  const pv = C && C.el.querySelector('#ch-pv'); if (!pv) return;
  if (!C.img && !C.vid) { pv.hidden = true; pv.innerHTML = ''; return; }
  pv.hidden = false; pv.innerHTML = `<div class="ch-pvi"><img src="${C.vid ? C.vid.poster : C.img}" alt="">${C.vid ? `<span class="ch-pvp">${ico('play', 22)}<em>${E(fmtDur(C.vid.dur))}</em></span>` : ''}<button type="button" aria-label="${E(t('del'))}" id="ch-pvx">${ico('x', 14)}</button></div>`;
  pv.querySelector('#ch-pvx').onclick = () => { C.img = null; C.vid = null; paintPv(); const sd = C.el.querySelector('#ch-sd'), ta = C.el.querySelector('#ch-ta'); sd.disabled = !ta.value.trim(); };
}
function doSend() {
  if (!C) return; const ta = C.el.querySelector('#ch-ta'), text = ta.value.trim(), img = C.img, vid = C.vid; if (!text && !img && !vid) return;
  const rp = C.reply, p = { vid: vid ? { poster: vid.poster, dur: vid.dur, w: vid.w, h: vid.h } : undefined, file: vid ? vid.file : undefined, prog: 0, id: nid(), mine: true, ts: Date.now(), text, local: vid ? vid.poster : (C.th || img), full: vid ? undefined : img, iw: vid ? undefined : C.imgW, ih: vid ? undefined : C.imgH, st: 'sending', re: rp ? { id: rp.id, mine: rp.mine, x: rp.x, img: rp.img, vid: rp.vid } : undefined, payload: { text, image: img, thumb: img ? C.th : undefined, iw: img ? C.imgW : undefined, ih: img ? C.imgH : undefined, reply: rp ? rp.id : undefined } };
  C.reply = null; paintRp();
  C.pending.push(p); ta.value = ''; C.draft = ''; ta.style.height = 'auto'; C.img = null; C.th = null; C.vid = null; paintPv(); C.el.querySelector('#ch-sd').disabled = true;
  renderMsgs(true); if (p.file) transmitVid(p); else transmit(p);
  if (matchMedia('(pointer:fine)').matches) ta.focus();
}
async function transmit(p) {
  const me = C; if (!me) return; p.st = 'sending';
  try {
    const body = { ...p.payload }; if (me.id && me.exists) body.id = me.id; else body.nick = me.user.nick;
    const j = await pq('send', body);
    if (C !== me) return;
    me.id = j.id; me.exists = true; me.pending = me.pending.filter((x) => x !== p);
    if (!me.msgs.some((m) => m.id === j.msg.id)) { j.msg.local = p.local; j.msg.full = p.full; if (!j.msg.re && p.re) j.msg.re = p.re; me.msgs.push(j.msg); }
    renderMsgs(true);
  } catch (e) {
    if (C !== me) return; p.st = 'failed';
    if (e.code === 'blocked' || e.code === 'blocked_by_you') { me.pending = me.pending.filter((x) => x !== p); if (e.code === 'blocked') me.blockedMe = true; else me.blockedByMe = true; me.el.querySelector('#ch-comp').innerHTML = composerHtml(); wireComposer(); }
    toast(errText(e)); renderMsgs(false);
  }
}
const retry = (id) => { const p = C && C.pending.find((x) => x.id === id); if (p) { p.st = 'sending'; p.prog = 0; renderMsgs(true); if (p.file) transmitVid(p); else transmit(p); } };
const drop = (id) => { if (C) { C.pending = C.pending.filter((x) => x.id !== id); renderMsgs(false); } };
const sel = (id) => { if (!C) return; C.sel = C.sel === id ? null : id; renderMsgs(false); };
const findMsg = (id) => C && C.msgs.concat(C.pending).find((x) => x.id === id);
const sorted = () => C.msgs.concat(C.pending).sort((a, b) => a.ts - b.ts);
function copyText(txt) {
  const done = () => toast(t('copied'));
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, () => fb()); } else fb();
  function fb() { const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0;top:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ } ta.remove(); }
}
/* ---- hold menu */
function closeCtx() { if (!C || !C.ctx) return; const cx = C.el.querySelector('.ch-cx'); C.ctx = null; if (cx) { cx.classList.add('out'); setTimeout(() => cx.remove(), 180); } C.el.querySelectorAll('.ch-m').forEach((x) => { x.style.visibility = ''; }); }
function openCtx(id) {
  if (!C || C.selMode) return; const m = findMsg(id); if (!m || m.del) return;
  closeCtx(); C.ctx = id; if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* ignore */ } }
  const row = C.el.querySelector(`.ch-row2[data-id="${CSS.escape(id)}"] .ch-m`); if (!row) { C.ctx = null; return; }
  const ok = !m.st, items = [];
  if (ok) items.push(['rep', 'reply', 'reply']);
  if (m.text) items.push(['cpy', 'copy', 'copy']);
  if (ok && !m.vid) items.push(['fw', 'fwd', 'fwd']);
  items.push(['sl', 'pick', 'pick']);
  if (m.mine && ok) items.push(['tr', 'del', 'del', 1]);
  const cx = document.createElement('div'); cx.className = 'ch-cx';
  cx.innerHTML = `<div class="ch-cxb"></div><div class="ch-cxm">${items.map((i) => `<button data-a="${i[2]}"${i[3] ? ' class="dg"' : ''}>${ico(i[0], 20)}<span>${E(t(i[1]))}</span></button>`).join('')}</div>`;
  C.el.appendChild(cx);
  const r = row.getBoundingClientRect(), o = C.el.getBoundingClientRect();
  const cl = row.cloneNode(true); cl.classList.remove('new', 'hl'); cl.classList.add('ch-cl'); cl.querySelectorAll('.ch-meta').forEach((x) => x.remove());
  cl.style.cssText = `position:absolute;left:${r.left - o.left}px;top:${r.top - o.top}px;width:${r.width}px;margin:0;max-width:none;z-index:2`; cx.insertBefore(cl, cx.querySelector('.ch-cxm')); row.style.visibility = 'hidden';
  const menu = cx.querySelector('.ch-cxm'), mh = menu.offsetHeight, mw = menu.offsetWidth;
  let top = r.bottom - o.top + 8; if (top + mh > o.height - 12) top = Math.max(70, r.top - o.top - mh - 8);
  let left = m.mine ? r.right - o.left - mw : r.left - o.left; left = Math.max(10, Math.min(left, o.width - mw - 10));
  menu.style.top = top + 'px'; menu.style.left = left + 'px'; menu.style.transformOrigin = (m.mine ? 'right ' : 'left ') + (top > r.top - o.top ? 'top' : 'bottom');
  if (ok) { // quick reactions above the bubble (below the menu when the bubble sits at the very top)
    const mine = (m.rx || []).find((x) => x.me), bar = document.createElement('div'); bar.className = 'ch-rxb';
    bar.innerHTML = REACTS.map((e) => `<button type="button" data-e="${E(e)}" class="${mine && mine.e === e ? 'on' : ''}">${e}</button>`).join(''); cx.appendChild(bar);
    const bw = bar.offsetWidth; let bt = r.top - o.top - 56; if (bt < 64) bt = top + mh + 8;
    bar.style.top = bt + 'px'; bar.style.left = Math.max(10, Math.min(m.mine ? r.right - o.left - bw : r.left - o.left, o.width - bw - 10)) + 'px'; bar.style.transformOrigin = (m.mine ? 'right ' : 'left ') + 'bottom';
    bar.onclick = (ev) => { const b = ev.target.closest('button'); if (!b) return; closeCtx(); react(id, b.dataset.e); };
  }
  cx.querySelector('.ch-cxb').onclick = closeCtx;
  menu.onclick = (ev) => { const b = ev.target.closest('button'); if (!b) return; const a = b.dataset.a; closeCtx(); act(a, id); };
}
function act(a, id) {
  const m = findMsg(id); if (!m) return;
  if (a === 'reply') setReply(m);
  else if (a === 'copy') copyText(m.text || '');
  else if (a === 'fwd') fwdPick([m]);
  else if (a === 'pick') { enterSel(id); }
  else if (a === 'del') delMsg(id);
}
function setReply(m) {
  C.reply = { id: m.id, mine: m.mine, x: (m.text || '').slice(0, 80), img: !!(m.img || m.local), vid: !!m.vid }; paintRp();
  const ta = C.el.querySelector('#ch-ta'); if (ta && matchMedia('(pointer:fine)').matches) ta.focus();
}
function paintRp() {
  const bar = C && C.el.querySelector('#ch-rp'); if (!bar) return;
  if (!C.reply) { bar.classList.remove('on'); setTimeout(() => { if (C && !C.reply) { bar.hidden = true; bar.innerHTML = ''; } }, 200); return; }
  const r = C.reply; bar.hidden = false; bar.innerHTML = `<div class="ch-rpi">${ico('rep', 18)}<div><b data-nt>${E(t('replyTo'))} · ${E(r.mine ? t('you2') : (C.user.name || C.user.nick))}</b><span data-nt>${E(r.x || (r.vid ? '🎥 ' + t('video') : r.img ? '📷 ' + t('photo2') : ''))}</span></div><button type="button" aria-label="${E(t('close'))}">${ico('x', 16)}</button></div>`;
  bar.querySelector('button').onclick = () => { C.reply = null; paintRp(); };
  requestAnimationFrame(() => bar.classList.add('on'));
}
/* ---- selection mode */
function selHeader() {
  const n = C.picked.size;
  return `<button class="sc-ic" data-s="x" aria-label="${E(t('cancel'))}">${ico('x')}</button><b class="ch-sn">${E(t('picked'))}: ${n}</b><button class="sc-ic" data-s="cpy" ${n ? '' : 'disabled'} aria-label="${E(t('copy'))}">${ico('cpy')}</button><button class="sc-ic" data-s="fw" ${n ? '' : 'disabled'} aria-label="${E(t('fwd'))}">${ico('fw')}</button><button class="sc-ic" data-s="tr" ${n ? '' : 'disabled'} aria-label="${E(t('del'))}">${ico('tr')}</button>`;
}
function paintHd() {
  const hd = C.el.querySelector('.ch-hd'); if (!hd) return;
  if (C.selMode) {
    hd.classList.add('sm'); hd.innerHTML = selHeader();
    hd.onclick = (ev) => { const b = ev.target.closest('button[data-s]'); if (!b || b.disabled) return; const k = b.dataset.s, ms = [...C.picked].map(findMsg).filter(Boolean).sort((a, b2) => a.ts - b2.ts);
      if (k === 'x') exitSel(); else if (k === 'cpy') { copyText(ms.filter((x) => x.text).map((x) => x.text).join('\n')); exitSel(); } else if (k === 'fw') fwdPick(ms.filter((x) => !x.st && !x.del)); else if (k === 'tr') delMany(ms); };
  } else { const w = document.createElement('div'); w.innerHTML = header(); hd.classList.remove('sm'); hd.innerHTML = w.firstChild.innerHTML; hd.onclick = null; }
}
function enterSel(id) { C.selMode = true; C.picked = new Set(id ? [id] : []); C.el.classList.add('selmode'); paintHd(); renderMsgs(false); }
function exitSel() { if (!C) return; C.selMode = false; C.picked = new Set(); C.el.classList.remove('selmode'); paintHd(); renderMsgs(false); }
function togglePick(id) { if (C.picked.has(id)) C.picked.delete(id); else C.picked.add(id); const hd = C.el.querySelector('.ch-hd'); hd.innerHTML = selHeader(); const ck = C.el.querySelector(`.ch-row2[data-id="${CSS.escape(id)}"] .ch-ck`); if (ck) ck.classList.toggle('on', C.picked.has(id)); }
async function delMany(ms) {
  if (!ms.length) return; if (ms.some((x) => !x.mine || x.st)) { toast(t('onlyMine')); return; }
  if (!confirm(t('delSelQ'))) return; const me = C;
  for (const m of ms) { try { await pq('delMsg', { id: me.id, mid: m.id }); m.del = true; m.text = ''; m.img = null; m.local = null; m.re = null; } catch (e) { toast(errText(e)); break; } }
  if (C === me) exitSel();
}
/* ---- forward */
async function fwdPick(ms) {
  if (ms.some((x) => x.vid)) { ms = ms.filter((x) => !x.vid); if (!ms.length) { toast(t('noFwdVid')); return; } }
  if (!ms.length) return; if (C && C.selMode) exitSel();
  try { const j = await gq('a=convs'); st.convs = j.convs; } catch (e) { /* use what we have */ }
  const list = st.convs || [];
  const md = sheet(`<div class="sc-sh"><b>${E(t('fwdTo'))}</b><button class="sc-ic" onclick="closeM(document.getElementById('md'))" aria-label="${E(t('close'))}">${ico('x')}</button></div><div class="ch-fl">${(!list.some(isSelf) && myNick() ? `<button class="ch-row" data-n="${E(myNick())}"><span class="ch-svi sm">${ico('bm', 20)}</span><span class="ch-rt"><b>${E(t('saved'))}</b><small>${E(t('savedD'))}</small></span></button>` : '') + list.map((c) => isSelf(c) ? `<button class="ch-row" data-c="${E(c.id)}"><span class="ch-svi sm">${ico('bm', 20)}</span><span class="ch-rt"><b>${E(t('saved'))}</b><small>${E(t('savedD'))}</small></span></button>` : `<button class="ch-row" data-c="${E(c.id)}">${av(c.user, 44)}<span class="ch-rt"><b data-nt>${E(c.user.name || c.user.nick)}${vb(c.user)}</b><small data-nt>@${E(c.user.nick)}</small></span></button>`).join('') || `<p class="note" style="text-align:center">${E(t('noChatsFwd'))}</p>`}</div>`);
  md.querySelector('.ch-fl').onclick = async (ev) => {
    const b = ev.target.closest('button[data-c],button[data-n]'); if (!b) return; const cid = b.dataset.c; b.disabled = true; b.style.opacity = '.5';
    try {
      for (const m of ms) {
        let image = null; const src = m.full || m.img || m.local;
        if (src) { if (src.startsWith('data:')) image = src; else { const r = await API(src), bl = await r.blob(); image = await new Promise((ok_, no) => { const fr = new FileReader(); fr.onload = () => ok_(fr.result); fr.onerror = no; fr.readAsDataURL(bl); }); } }
        let thumb, iw, ih; if (image) { try { const im1 = await loadImg(image); iw = im1.width; ih = im1.height; thumb = await encodeImg(image, 360, .7, 60 * 1024); } catch (e) { /* no thumb */ } }
        const j = await pq('send', { ...(cid ? { id: cid } : { nick: b.dataset.n }), text: m.text || '', image, thumb, iw, ih, fwd: 1 });
        if (C && C.id === j.id && !C.msgs.some((x) => x.id === j.msg.id)) { C.msgs.push(j.msg); renderMsgs(true); }
      }
      closeM(md); toast(t('fwdDone')); if (S.tab === 'chat') loadList();
    } catch (e) { b.disabled = false; b.style.opacity = ''; toast(errText(e)); }
  };
}
/* ---- gestures: hold, swipe to reply, tap */
function swipeBack(el) {
  let g = null;
  el.addEventListener('touchstart', (e) => { g = e.touches.length === 1 && !C.selMode && !C.ctx && !e.target.closest('textarea,.ch-cx') ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), on: false } : null; }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (!g) return; const t0 = e.touches[0], dx = t0.clientX - g.x, dy = t0.clientY - g.y;
    if (!g.on) { if (Math.abs(dy) > 22 && Math.abs(dy) > Math.abs(dx)) { g = null; return; } if (dx > 8 && dx > Math.abs(dy) * 1.1) { g.on = true; clearTimeout(g.h); el.style.transition = 'none'; } else return; }
    g.dx = Math.max(0, dx); el.style.translate = g.dx + 'px 0'; el.style.opacity = String(1 - Math.min(.5, g.dx / 700));
  }, { passive: true });
  const end = () => {
    if (!g || !g.on) { g = null; return; } const dx = g.dx || 0, fast = dx / Math.max(1, Date.now() - g.t) > .3; g = null;
    el.style.transition = 'translate .24s cubic-bezier(.16,1,.3,1),opacity .24s';
    if (dx > 55 || (fast && dx > 22)) { el.style.translate = '100% 0'; el.style.opacity = '0'; setTimeout(() => { if (C && C.el === el) closeChat(true); else el.remove(); if (S.tab === 'chat') { st.at = 0; loadList(); } pollBadge(); }, 230); }
    else { el.style.translate = ''; el.style.opacity = ''; }
  };
  el.addEventListener('touchend', end, { passive: true }); el.addEventListener('touchcancel', end, { passive: true });
}
function lockUi(el) {
  const stop = (e) => e.preventDefault();
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((n) => el.addEventListener(n, stop, { passive: false }));
  el.addEventListener('touchmove', (e) => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
  el.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  el.addEventListener('contextmenu', (e) => { if (!e.target.closest('textarea')) e.preventDefault(); });
  ['copy', 'cut', 'selectstart', 'dragstart'].forEach((n) => el.addEventListener(n, (e) => { if (!e.target.closest || !e.target.closest('textarea')) e.preventDefault(); }));
  // iOS scrolls the whole page when the keyboard opens: keep the chat pinned
  el.addEventListener('focusin', () => { window.scrollTo(0, 0); setTimeout(() => window.scrollTo(0, 0), 120); });
  el.addEventListener('load', (e) => { const im = e.target; if (!im || !im.classList || !im.classList.contains('ch-img') || !C) return; const row = im.closest('.ch-row2'); if (row && im.naturalWidth) { C.dim = C.dim || {}; C.dim[row.dataset.id] = im.naturalWidth + '/' + im.naturalHeight; } im.classList.add('ok'); const b = C.el.querySelector('#ch-ms'); if (b && C.stickLoad) b.scrollTop = b.scrollHeight; }, true);
}
function wireGestures(box) {
  let tm = 0, sx = 0, sy = 0, row = null, dir = '', dx = 0, held = false, tid = null;
  const clr = () => { clearTimeout(tm); tm = 0; };
  const rowOf = (e) => e.target.closest && e.target.closest('.ch-row2');
  box.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return; row = rowOf(e); if (!row) return; const t0 = e.touches[0]; sx = t0.clientX; sy = t0.clientY; dir = ''; dx = 0; held = false;
    if (e.target.closest('.ch-act,.ch-meta button')) { row = null; return; }
    tid = row.dataset.id; tm = setTimeout(() => { held = true; dir = 'x'; if (row) row.style.transform = ''; openCtx(tid); }, 420);
  }, { passive: true });
  box.addEventListener('touchmove', (e) => {
    if (!row || held) return; const t0 = e.touches[0], mx = t0.clientX - sx, my = t0.clientY - sy;
    if (!dir) { if (Math.abs(mx) > 8 || Math.abs(my) > 8) { clr(); dir = 'v'; } }
    if (dir === 'h') { e.preventDefault(); dx = Math.min(80, Math.pow(mx, .85)); const m = row.querySelector('.ch-m'); if (m) { m.style.transition = 'none'; m.style.transform = `translate3d(${dx}px,0,0)`; } row.style.setProperty('--sw', Math.min(1, dx / 56)); row.classList.add('swp'); }
  }, { passive: false });
  const end = () => {
    clr(); if (row && dir === 'h') { const m = row.querySelector('.ch-m'); if (m) { m.style.transition = 'transform .32s cubic-bezier(.16,1,.3,1)'; m.style.transform = ''; } if (dx >= 46) { const mm = findMsg(row.dataset.id); if (mm && !mm.del && !mm.st) { if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e2) { /* ignore */ } } setReply(mm); } } const r0 = row; setTimeout(() => { r0.classList.remove('swp'); }, 300); }
    row = null;
  };
  box.addEventListener('touchend', end); box.addEventListener('touchcancel', end);
  box.addEventListener('click', (e) => {
    if (held) { held = false; e.preventDefault(); return; }
    const rxb = e.target.closest('.ch-rx button'); if (rxb && !C.selMode) { e.preventDefault(); react(rxb.dataset.rx, rxb.dataset.e); return; }
    const chip = e.target.closest('.ch-chips button'); if (chip) { const rr = chip.closest('.ch-row2'); C.sel = null; const id0 = rr.dataset.id, a0 = chip.dataset.a; renderMsgs(false); act(a0, id0); return; }
    const q = e.target.closest('.ch-q'); if (q && !C.selMode) { const tgt = box.querySelector(`.ch-row2[data-id="${CSS.escape(q.dataset.q)}"] .ch-b`); if (tgt) { tgt.scrollIntoView({ block: 'center', behavior: 'smooth' }); tgt.classList.remove('fl'); void tgt.offsetWidth; tgt.classList.add('fl'); } return; }
    const r = e.target.closest('.ch-row2'); if (!r) return; if (e.target.closest('.ch-img') || e.target.closest('.ch-meta button')) return;
    if (C.selMode) { togglePick(r.dataset.id); return; }
    const nowT = Date.now(), dbl = lastTap && lastTap.id === r.dataset.id && nowT - lastTap.t < 330; lastTap = { id: r.dataset.id, t: nowT };
    if (dbl) { lastTap = null; const mm = findMsg(r.dataset.id); C.sel = null; if (mm && !mm.st && !mm.del) { const cur = (mm.rx || []).find((x) => x.me); react(mm.id, cur ? cur.e : dtReact()); } else renderMsgs(false); return; } // double tap = quick reaction, 👍 unless changed in Settings (a second double tap removes it)
    sel(r.dataset.id);
  });
  box.addEventListener('contextmenu', (e) => { const r = rowOf(e); e.preventDefault(); if (r && e.target.closest('.ch-b')) openCtx(r.dataset.id); });
  box.addEventListener('dblclick', (e) => { const r = rowOf(e); if (r && !C.selMode) { const mm = findMsg(r.dataset.id); if (mm && !mm.del && !mm.st && matchMedia('(pointer:fine)').matches) setReply(mm); } });
}
async function delMsg(id) {
  if (!C || !confirm(t('delQ'))) return; const me = C;
  try { await pq('delMsg', { id: me.id, mid: id }); const m = me.msgs.find((x) => x.id === id); if (m) { m.del = true; m.text = ''; m.img = null; m.local = null; } me.sel = null; renderMsgs(false); } catch (e) { toast(errText(e)); }
}
function viewImg(id) {
  const m = C && C.msgs.concat(C.pending).find((x) => x.id === id); if (!m) return;
  const v = document.createElement('div'); v.className = 'ch-iv'; v.innerHTML = `<button class="sc-ic" aria-label="${E(t('close'))}">${ico('x', 26)}</button><img src="${E(m.full || m.img || m.local)}" alt="">`;
  const t0 = Date.now(); let gone = false; v.onclick = (ev) => { if (gone) return; if (Date.now() - t0 < 150) { ev.stopPropagation(); return; } v.classList.add('out'); setTimeout(() => v.remove(), 180); }; document.body.appendChild(v);
  swipeDismiss(v, v.querySelector('img'), 0, (ms) => { gone = true; setTimeout(() => v.remove(), ms); });
}
function menu() {
  if (!C) return; if (C.self || C.user.nick === myNick()) { toast(t('selfBlock')); return; } const me = C;
  const m = sheet(`<div class="sc-sh"><b>@${E(me.user.nick)}</b><button class="sc-ic" onclick="closeM(document.getElementById('md'))" aria-label="${E(t('close'))}">${ico('x')}</button></div><div class="sc-menu"><button class="btn g" id="ch-m1">${E(t('profile'))}</button><button class="btn g" id="ch-m2" style="color:#ff6b6b">${E(me.blockedByMe ? t('unblock') : t('block'))}</button></div>`);
  m.querySelector('#ch-m1').onclick = () => { closeM(m); profile(); };
  m.querySelector('#ch-m2').onclick = () => { closeM(m); block(!me.blockedByMe); };
}
async function block(on) {
  if (!C) return; if (C.self || C.user.nick === myNick()) { toast(t('selfBlock')); return; }
  if (on && !confirm(t('blockQ'))) return; const me = C;
  try { await pq('block', { nick: me.user.nick, on }); me.blockedByMe = on; me.el.querySelector('#ch-comp').innerHTML = composerHtml(); wireComposer(); } catch (e) { toast(errText(e)); }
}
function profile() { if (!C) return; const nick = C.user.nick; closeChat(); if (window.SOC) { go('social'); setTimeout(() => SOC.profile(nick), 60); } }

/* ------------------------------------------------------------ entry points */
function openConv(id) { const c = st.convs && st.convs.find((x) => x.id === id); if (!c) return; st.open = id; openOverlay(c.user, id); if (c.pres && !(C.pres && C.pres.seen > (c.pres.seen || 0))) C.pres = c.pres; paintStatus(); loadChat(); if (c.unread) { c.unread = 0; refresh(); } }
async function openWith(nick) {
  if (S.tab !== 'chat') { go('chat'); await new Promise((r) => setTimeout(r, 120)); }
  const ok_ = await ensure(); if (!ok_) { refresh(); return; }
  st.open = nick; openOverlay({ nick, name: nick, avatar: '' }, null); loadChat();
}

/* ------------------------------------------------------------ styles */
const css = `
nav button[data-b]::after{content:attr(data-b);position:absolute;top:2px;left:calc(50% + 6px);min-width:17px;height:17px;border-radius:9px;background:#ff4d6d;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 0 0 2px #000;animation:scBump .5s cubic-bezier(.34,1.3,.5,1)}
:root[data-theme=glass] nav button[data-b]::after{box-shadow:0 0 0 2px #3a4aa8}
#toast{z-index:500!important}
.ch-list{display:flex;flex-direction:column;gap:8px}
.ch-row{border:0;background:#000;color:#fff;border-radius:24px;padding:11px 14px;display:flex;align-items:center;gap:12px;text-align:left;font:inherit;cursor:pointer;width:100%;transition:transform .15s}.ch-row:active{transform:scale(.98)}
:root[data-theme=glass] .ch-row,:root[data-theme=glass] .ch-sk{background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.34);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.ch-row.in{animation:scUp .55s cubic-bezier(.16,1,.3,1) both}
.ch-rt{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.ch-rt b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ch-rt small{font-size:13px;color:#bdbdbd;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ch-row.un .ch-rt small{color:#fff;font-weight:800}
.ch-rm{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex:none}.ch-rm i{font-style:normal;font-size:11px;color:#9a9a9a;font-weight:700}.ch-rm em{font-style:normal;min-width:20px;height:20px;border-radius:10px;background:linear-gradient(135deg,#5b8cff,#8a5cff);font-size:11px;display:flex;align-items:center;justify-content:center;padding:0 6px}
.ch-sk{background:#000;border-radius:24px;height:74px;margin-bottom:8px;animation:p 1s infinite alternate}.ch-sk i,.ch-sk span{display:none}
.sc-pub svg{vertical-align:-3px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ch-ov{position:fixed;left:0;right:0;top:0;height:100%;z-index:120;display:flex;flex-direction:column;background:var(--bgl,#0b0d3b);color:var(--h);animation:chIn .32s cubic-bezier(.16,1,.3,1)}
@keyframes chIn{from{opacity:0;transform:translate3d(40px,0,0)}to{opacity:1;transform:none}}
:root[data-theme=glass] .ch-ov,:root[data-theme=dark] .ch-ov{color:#fff}
.ch-hd{display:flex;align-items:center;gap:6px;padding:calc(8px + env(safe-area-inset-top,0px)) 8px 8px;background:rgba(0,0,0,.28);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);flex:none;color:#fff}
.ch-hd .sc-ic{color:#fff}.ch-who{flex:1;min-width:0;border:0;background:none;color:#fff;font:inherit;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;padding:0}.ch-who span{display:flex;flex-direction:column;min-width:0}.ch-who b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ch-who small{font-size:11px;opacity:.7;font-weight:600}
.ch-ms{flex:1;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:12px 12px 6px;display:flex;flex-direction:column}
.ch-day{align-self:center;font-size:11px;font-weight:800;opacity:.8;background:rgba(0,0,0,.25);color:#fff;border-radius:12px;padding:4px 12px;margin:12px 0 8px}
.ch-more{align-self:center;font-size:12px;font-weight:800;opacity:.8;padding:8px 14px;cursor:pointer}
.ch-m{display:flex;flex-direction:column;max-width:78%;margin-top:3px;position:relative}.ch-m.first{margin-top:10px}.ch-m.me{align-self:flex-end;align-items:flex-end}.ch-m.th{align-self:flex-start;align-items:flex-start}
.ch-m.new{animation:chPop .38s cubic-bezier(.34,1.3,.5,1)}.ch-m.me.new{transform-origin:100% 100%}.ch-m.th.new{transform-origin:0 100%}
@keyframes chPop{from{opacity:0;transform:scale(.85) translate3d(0,10px,0)}to{opacity:1;transform:none}}
.ch-b{border-radius:20px;padding:9px 14px;font-size:15px;line-height:1.35;font-weight:600;overflow-wrap:anywhere;white-space:pre-wrap;cursor:pointer;transition:opacity .2s}
.ch-ov,.ch-ov *{-webkit-text-size-adjust:none;text-size-adjust:none}.ch-b,.ch-tx,.ch-ov textarea{-webkit-text-size-adjust:none;text-size-adjust:none}.ch-m .ch-b,.ch-m.me .ch-b,.ch-m.th .ch-b{font-family:inherit;font-size:15px;line-height:1.35;font-weight:600;letter-spacing:0;font-synthesis:none}.ch-m.me .ch-b.del,.ch-m.th .ch-b.del{font-size:13px}
.ch-m.me .ch-b{background:linear-gradient(135deg,#4d7bff,#7a5cff);color:#fff;border-bottom-right-radius:6px}.ch-m.me:not(.last) .ch-b{border-bottom-right-radius:20px}
.ch-m.th .ch-b{background:#000;color:#fff;border-bottom-left-radius:6px}.ch-m.th:not(.last) .ch-b{border-bottom-left-radius:20px}
:root[data-theme=glass] .ch-m.th .ch-b{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3)}
.ch-b.del{background:none!important;border:1px dashed rgba(255,255,255,.4);color:inherit;opacity:.7;font-style:italic;font-size:13px}.ch-m.th .ch-b.del{color:var(--h)}:root[data-theme=glass] .ch-m.th .ch-b.del,:root[data-theme=dark] .ch-m.th .ch-b.del{color:#fff}
.ch-b.wait{opacity:.6}.ch-b.bad{background:#7a2230!important}
.ch-b.hasimg{padding:4px}.ch-b.hasimg.only{padding:3px}.ch-b.hasimg .ch-tx{display:block;padding:6px 10px 4px}
.ch-img{display:block;max-width:100%;width:min(240px,62vw);max-height:340px;object-fit:cover;border-radius:16px;background:rgba(255,255,255,.1);cursor:zoom-in}
.ch-meta{font-size:10.5px;font-weight:700;opacity:.75;margin:3px 6px 0}.ch-meta.bad{color:#ff9aa9;opacity:1}.ch-meta button{border:0;background:none;color:inherit;font:inherit;text-decoration:underline;cursor:pointer;padding:0}
.ch-act{border:0;background:#fff;color:#c0243d;font:inherit;font-weight:800;font-size:12px;border-radius:14px;padding:5px 12px;margin-bottom:4px;cursor:pointer;animation:scUp .25s ease;min-height:0}
.ch-empty{margin:auto;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;padding:30px 20px}.ch-empty b{font-size:18px;margin-top:8px}.ch-empty small{opacity:.7}.ch-empty p{font-size:13px;opacity:.8;margin:10px 0 0}
.ch-cf{display:flex;align-items:flex-end;gap:8px;padding:8px 10px calc(10px + env(safe-area-inset-bottom,0px));flex:none}
.ch-cf textarea{flex:1;min-width:0;resize:none;border:0;outline:0;background:#000;color:#fff;font:inherit;font-weight:600;font-size:16px;line-height:1.3;border-radius:22px;padding:12px 16px;max-height:120px;min-height:44px}
:root[data-theme=glass] .ch-cf textarea{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3)}.ch-cf textarea::placeholder{color:#8a8a8a}
.ch-at,.ch-sd{border:0;border-radius:50%;width:44px;height:44px;min-height:44px;flex:none;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:transform .15s,opacity .2s,background .2s}
.ch-at{background:rgba(0,0,0,.45);color:#fff}.ch-at svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ch-sd{background:linear-gradient(135deg,#4d7bff,#7a5cff);color:#fff}.ch-sd svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.ch-sd:disabled{opacity:.35}.ch-sd:active:not(:disabled),.ch-at:active{transform:scale(.88)}
.ch-pv{padding:6px 12px 0}.ch-pvi{position:relative;display:inline-block}.ch-pvi img{height:96px;border-radius:16px;display:block}.ch-pvi button{position:absolute;top:-6px;right:-6px;width:24px;height:24px;min-height:0;border-radius:50%;border:0;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}.ch-pvi button svg{fill:none;stroke:currentColor;stroke-width:2.6}
.ch-blk{padding:14px 16px calc(16px + env(safe-area-inset-bottom,0px));text-align:center;font-size:13px;font-weight:700;opacity:.9;background:rgba(0,0,0,.25);color:#fff}.ch-blk button{border:0;background:none;color:#9ec1ff;font:inherit;font-weight:800;text-decoration:underline;cursor:pointer;padding:0 4px}
.ch-iv{position:fixed;inset:0;z-index:450;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;animation:scFade .2s ease}.ch-iv img{max-width:100%;max-height:100%;object-fit:contain}.ch-iv .sc-ic{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));right:10px;color:#fff}
@media(prefers-reduced-motion:reduce){.ch-ov,.ch-m.new,.ch-row.in{animation:none!important}}

/* --- glass chat */
.ch-ov{background:radial-gradient(120% 60% at 12% 0%,rgba(110,130,255,.35),transparent 60%),radial-gradient(110% 55% at 100% 100%,rgba(190,90,255,.28),transparent 60%),var(--bgl,#0b0d3b);will-change:transform,opacity}
.ch-ov.out{animation:chOut .24s cubic-bezier(.4,0,1,1) forwards}
@keyframes chOut{to{opacity:0;transform:translate3d(36px,0,0)}}
.ch-hd{background:rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.14);-webkit-backdrop-filter:blur(22px) saturate(1.6);backdrop-filter:blur(22px) saturate(1.6)}
.ch-hd.sm{gap:2px}.ch-sn{flex:1;font-size:16px;padding-left:6px}.ch-hd .sc-ic:disabled{opacity:.35}
.ch-ms{scroll-behavior:smooth}
.ch-row2{display:flex;align-items:flex-end;gap:8px;position:relative;transition:background .2s;border-radius:14px}
.ch-row2.sm{cursor:pointer}.ch-row2.sm .ch-m{pointer-events:none}
.ch-row2 .ch-m{flex:0 1 auto}.ch-row2:has(.ch-m.me){justify-content:flex-end}
.ch-row2.sm:has(.ch-m.me){justify-content:space-between;flex-direction:row-reverse}
.ch-row2.sm:has(.ch-m.me) .ch-m{margin-left:auto}
.ch-ck{flex:none;width:22px;height:22px;margin-bottom:6px;border-radius:50%;border:1.5px solid rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;color:transparent;transition:background .2s,border-color .2s,transform .25s cubic-bezier(.34,1.56,.64,1)}
.ch-ck svg{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;width:22px;height:22px;margin:-1.5px}
.ch-ck.on{background:#4d7bff;border-color:#4d7bff;color:#fff;transform:scale(1.08)}
.ch-row2.sm:has(.ch-ck.on){background:rgba(120,140,255,.14)}
.ch-m{max-width:min(78%,420px);transition:transform .32s cubic-bezier(.16,1,.3,1),filter .2s}
.ch-row2.sm .ch-m{max-width:calc(100% - 40px)}
.ch-row2::before{content:'';position:absolute;left:8px;top:50%;width:30px;height:30px;margin-top:-15px;border-radius:50%;background:rgba(255,255,255,.2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9.5 6L4 11.5 9.5 17'/%3E%3Cpath d='M4 11.5h9a7 7 0 017 7'/%3E%3C/svg%3E") center/18px no-repeat;opacity:0;transform:scale(.4);transition:opacity .15s,transform .15s;pointer-events:none}
.ch-row2.swp::before{opacity:var(--sw,0);transform:scale(calc(.4 + var(--sw,0)*.6))}
.ch-b{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;transition:opacity .2s,box-shadow .3s,transform .2s}
.ch-m.me .ch-b{background:linear-gradient(135deg,rgba(77,123,255,.82),rgba(122,92,255,.82));border:1px solid rgba(255,255,255,.28);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 6px 20px rgba(80,90,255,.28),inset 0 1px 0 rgba(255,255,255,.25)}
.ch-m.th .ch-b{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.26);color:#fff;-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);box-shadow:0 6px 18px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.2)}
:root[data-theme=light] .ch-m.th .ch-b{background:rgba(255,255,255,.55);color:#14162e;border-color:rgba(255,255,255,.7)}
.ch-b.fl{animation:chFl 1.1s ease}
@keyframes chFl{0%,60%{box-shadow:0 0 0 3px rgba(255,255,255,.65),0 0 24px rgba(160,180,255,.8)}100%{}}
.ch-cl{animation:chLift .28s cubic-bezier(.34,1.45,.5,1) both}.ch-cl .ch-b{box-shadow:0 14px 40px rgba(0,0,0,.45)}@keyframes chLift{to{transform:scale(1.04)}}
.ch-q{border-left:3px solid rgba(255,255,255,.8);background:rgba(0,0,0,.18);border-radius:10px;padding:5px 9px;margin:0 0 6px;display:flex;flex-direction:column;gap:1px;max-width:100%;cursor:pointer}
.ch-q b{font-size:12px;opacity:.95}.ch-q span{font-size:12.5px;opacity:.85;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}
:root[data-theme=light] .ch-m.th .ch-q{background:rgba(20,22,46,.08);border-left-color:#4d7bff}
.ch-fw{font-size:11px;font-weight:800;opacity:.8;margin:0 0 3px;display:flex;align-items:center;gap:4px}.ch-fw svg{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.ch-b.hasimg .ch-q,.ch-b.hasimg .ch-fw{margin:6px 8px 6px}
/* hold menu */
.ch-cx{position:absolute;inset:0;z-index:20;animation:scFade .18s ease}.ch-cx.out{opacity:0;transition:opacity .18s}
.ch-cxb{position:absolute;inset:0;background:rgba(5,6,25,.45);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.ch-cxm{position:absolute;min-width:200px;border-radius:20px;padding:6px;background:rgba(28,30,64,.62);border:1px solid rgba(255,255,255,.26);-webkit-backdrop-filter:blur(30px) saturate(1.8);backdrop-filter:blur(30px) saturate(1.8);box-shadow:0 18px 50px rgba(0,0,0,.45);animation:chMenu .28s cubic-bezier(.34,1.45,.5,1);color:#fff;display:flex;flex-direction:column}
@keyframes chMenu{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
.ch-cxm button{display:flex;align-items:center;gap:12px;border:0;background:none;color:#fff;font:inherit;font-weight:700;font-size:15px;padding:0 14px;min-height:44px;border-radius:14px;cursor:pointer;text-align:left;transition:background .15s}
.ch-cxm button:active,.ch-cxm button:hover{background:rgba(255,255,255,.16)}
.ch-cxm button svg{fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
.ch-cxm button+button{box-shadow:0 -1px 0 rgba(255,255,255,.1)}.ch-cxm button.dg{color:#ff7d8f}
.ch-ov.selmode #ch-comp{display:none}
/* composer glass */
#ch-comp{background:linear-gradient(to top,rgba(0,0,0,.18),transparent)}
.ch-cf textarea{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.26);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);transition:background .2s,border-color .2s,box-shadow .25s}
.ch-cf textarea:focus{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.5);box-shadow:0 0 0 3px rgba(120,140,255,.28)}
:root[data-theme=light] .ch-cf textarea{color:#14162e;background:rgba(255,255,255,.6)}
.ch-at{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.26);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.ch-sd{box-shadow:0 6px 18px rgba(90,100,255,.45);transition:transform .2s cubic-bezier(.34,1.56,.64,1),opacity .25s}.ch-sd:not(:disabled){animation:chSd .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes chSd{from{transform:scale(.7)}to{transform:none}}
.ch-day{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.ch-rp{padding:6px 12px 0;overflow:hidden;max-height:0;opacity:0;transition:max-height .28s cubic-bezier(.16,1,.3,1),opacity .2s}.ch-rp.on{max-height:70px;opacity:1}
.ch-rpi{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 12px;border-radius:16px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.24);border-left:3px solid #7a9bff;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);color:#fff}
.ch-rpi>svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none;opacity:.85}
.ch-rpi div{flex:1;min-width:0;display:flex;flex-direction:column}.ch-rpi b{font-size:12.5px}.ch-rpi span{font-size:13px;opacity:.8;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-rpi button{border:0;background:rgba(255,255,255,.2);color:#fff;width:28px;height:28px;min-height:0;min-width:0;border-radius:50%;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;flex:none}.ch-rpi button svg{fill:none;stroke:currentColor;stroke-width:2.4}
:root[data-theme=light] .ch-rpi{color:#14162e;background:rgba(255,255,255,.6)}:root[data-theme=light] .ch-rpi button{background:rgba(20,22,46,.12);color:#14162e}
.ch-fl{display:flex;flex-direction:column;gap:6px;max-height:55vh;overflow:auto}
.ch-row{-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);transition:transform .2s cubic-bezier(.16,1,.3,1),background .2s}.ch-row:active{transform:scale(.98)}
.ch-list .ch-row{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22)}

:root[data-theme=light] .ch-hd,:root[data-theme=light] .ch-hd .sc-ic,:root[data-theme=light] .ch-who{color:#14162e}:root[data-theme=light] .ch-hd{background:rgba(255,255,255,.55)}
:root[data-theme=light] .ch-day{color:#14162e;background:rgba(255,255,255,.6)}
:root[data-theme=light] .ch-ck{border-color:rgba(20,22,46,.45)}
:root[data-theme=light] .ch-ov{color:#14162e}

/* --- v3: locked, glass, shadows, in-bubble time */
.ch-ov,.ch-ov *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.ch-ov textarea{-webkit-user-select:text;user-select:text;overflow-x:hidden;touch-action:manipulation}
.ch-ov{touch-action:pan-y;overscroll-behavior:none;overflow:hidden;max-width:100vw}
.ch-hd,#ch-comp,.ch-cx{touch-action:none}
.ch-ov img{-webkit-user-drag:none;user-drag:none}
.ch-wr{display:contents}
.ch-b{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:flex-end;column-gap:12px;white-space:pre-wrap}
.ch-b>.ch-q,.ch-b>.ch-fw,.ch-b>.ch-imw{flex:0 0 100%;box-sizing:border-box}
.ch-b>.ch-tx{flex:0 1 auto;margin-right:auto;text-align:left}
.ch-ts{margin-left:auto;font-size:10.5px;font-weight:700;opacity:.78;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;padding-top:3px;line-height:1}
.ch-ts svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ch-ts .ck2.rd,.ch-ts .ck1.rd{stroke:#8ff0ff;filter:drop-shadow(0 0 3px rgba(120,230,255,.8))}.ch-ts .ck2.rd{color:#8ff0ff}
.ch-ts .ck0{opacity:.8}.ch-bad{color:#ff8a9b;font-size:12px}
.ch-imw{position:relative;display:block}.ch-imw .ch-img{width:100%;display:block}
.ch-imw .ch-ts{position:absolute;right:8px;bottom:8px;margin:0;padding:3px 8px;border-radius:10px;background:rgba(0,0,0,.42);color:#fff;opacity:1;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.ch-b.hasimg .ch-tx{padding:6px 4px 2px 8px}.ch-b.hasimg .ch-ts{padding:0 8px 4px 0}
.ch-img{animation:chImg .35s ease both;min-height:90px}
@keyframes chImg{from{opacity:0}to{opacity:1}}
.ch-m.me .ch-b{box-shadow:0 10px 26px rgba(70,80,255,.38),0 2px 6px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.3)}
.ch-m.th .ch-b{box-shadow:0 10px 26px rgba(0,0,0,.28),0 2px 6px rgba(0,0,0,.14),inset 0 1px 0 rgba(255,255,255,.24)}
.ch-meta.rd{color:#8ff0ff;opacity:1}
.ch-row2.pk{background:rgba(120,140,255,.16)}
.ch-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px;max-width:100%}.ch-m.me .ch-chips{justify-content:flex-end}
.ch-chips button{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.16);color:#fff;font:inherit;font-weight:800;font-size:12px;border-radius:14px;padding:0 11px;height:30px;min-height:0;cursor:pointer;-webkit-backdrop-filter:blur(16px) saturate(1.6);backdrop-filter:blur(16px) saturate(1.6);box-shadow:0 6px 16px rgba(0,0,0,.28);animation:chChip .3s cubic-bezier(.34,1.45,.5,1) both;transition:transform .15s,background .15s}
.ch-chips button:nth-child(2){animation-delay:.03s}.ch-chips button:nth-child(3){animation-delay:.06s}.ch-chips button:nth-child(4){animation-delay:.09s}.ch-chips button:nth-child(5){animation-delay:.12s}
.ch-chips button:active{transform:scale(.92);background:rgba(255,255,255,.3)}.ch-chips button.dg{color:#ff8d9d}
.ch-chips svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
@keyframes chChip{from{opacity:0;transform:translate3d(0,-6px,0) scale(.85)}to{opacity:1;transform:none}}
:root[data-theme=light] .ch-chips button{color:#14162e;background:rgba(255,255,255,.7);border-color:rgba(255,255,255,.9)}:root[data-theme=light] .ch-chips button.dg{color:#c0243d}
.ch-st.on{color:#7dffb0;opacity:1}.ch-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#35e07a;margin-right:5px;box-shadow:0 0 8px #35e07a;vertical-align:1px;animation:chDot 1.6s ease-in-out infinite alternate}
@keyframes chDot{to{opacity:.45;transform:scale(.8)}}
:root[data-theme=light] .ch-st.on{color:#14a85a}
.ch-cf{margin:4px 10px calc(10px + env(safe-area-inset-bottom,0px));padding:6px;gap:6px;border-radius:32px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);-webkit-backdrop-filter:blur(26px) saturate(1.7);backdrop-filter:blur(26px) saturate(1.7);box-shadow:0 14px 40px rgba(0,0,0,.38),0 2px 8px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.32)}
.ch-cf textarea{background:transparent!important;border:0!important;box-shadow:none!important;-webkit-backdrop-filter:none;backdrop-filter:none;padding:12px 8px}
:root[data-theme=light] .ch-cf{background:rgba(255,255,255,.62)}
.ch-at{background:rgba(255,255,255,.18);box-shadow:0 4px 12px rgba(0,0,0,.2)}
.ch-iv{transition:opacity .18s}.ch-iv.out{opacity:0}.ch-iv img{animation:chImg .25s ease;touch-action:none}
.ch-row2.sm .ch-b{pointer-events:none}

/* --- v4: light on GPU and battery: blur only on header + composer */
.ch-ov{will-change:auto}.ch-ms{scroll-behavior:auto;contain:layout style}.ch-row2{contain:layout style}
.ch-m .ch-b,.ch-chips button,.ch-day,.ch-row,.ch-list .ch-row,.ch-rpi,.ch-at,.ch-cf textarea,.ch-imw .ch-ts,.ch-sk,.ch-m.me .ch-b,.ch-m.th .ch-b{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
.ch-m.me .ch-b{background:linear-gradient(135deg,#4f7dff,#7a5cff);box-shadow:0 4px 12px rgba(70,80,255,.32)}
.ch-m.th .ch-b{background:rgba(255,255,255,.2);box-shadow:0 4px 12px rgba(0,0,0,.22)}
:root[data-theme=light] .ch-m.th .ch-b{background:rgba(255,255,255,.8)}
.ch-chips button{background:rgba(255,255,255,.24);box-shadow:0 3px 8px rgba(0,0,0,.22)}
:root[data-theme=light] .ch-chips button{background:rgba(255,255,255,.9)}
.ch-day{background:rgba(255,255,255,.2)}:root[data-theme=light] .ch-day{background:rgba(255,255,255,.8)}
.ch-imw .ch-ts{background:rgba(0,0,0,.5)}
.ch-dot{animation:none}
.ch-cf{box-shadow:0 8px 24px rgba(0,0,0,.3)}
.ch-img{animation-duration:.2s}

/* --- v5: video + push banner */
.ch-play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
.ch-play svg{width:46px;height:46px;padding:10px 8px 10px 12px;box-sizing:border-box;border-radius:50%;background:rgba(0,0,0,.45);color:#fff;fill:currentColor;stroke:none;box-shadow:0 4px 14px rgba(0,0,0,.4)}
.ch-play b{background:rgba(0,0,0,.55);color:#fff;border-radius:16px;padding:6px 12px;font-size:14px}
.ch-dur{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.5);color:#fff;border-radius:10px;padding:3px 8px;font-size:11px;font-weight:800;line-height:1}
.ch-prog{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(255,255,255,.25);border-radius:0 0 14px 14px;overflow:hidden}.ch-prog i{display:block;height:100%;background:#fff;transition:width .25s linear}
.ch-imw.vd{cursor:pointer;min-width:min(240px,62vw)}.ch-imw.vd .ch-img{min-height:120px;object-fit:cover;max-height:340px}
.ch-pvp{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;pointer-events:none;border-radius:16px;background:rgba(0,0,0,.25)}.ch-pvp svg{fill:currentColor;stroke:none}.ch-pvp em{position:absolute;left:6px;bottom:5px;font-style:normal;font-size:11px;font-weight:800}
.ch-iv.vv{background:rgba(0,0,0,.96)}.ch-iv.vv .sc-ic{z-index:3;background:rgba(0,0,0,.45);border-radius:50%}.ch-iv.vv video{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain;background:#000}
.ch-pb{display:flex;align-items:center;gap:12px;margin:0 0 10px;padding:12px 14px;border-radius:20px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.26);box-shadow:0 6px 18px rgba(0,0,0,.2);animation:scUp .5s cubic-bezier(.16,1,.3,1) both}
.ch-pb div{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.ch-pb b{font-size:14px}.ch-pb span{font-size:12.5px;opacity:.8;font-weight:600}
.ch-pb button{border:0;border-radius:16px;background:#fff;color:#1b2a8f;font:inherit;font-weight:800;font-size:13px;padding:0 16px;height:36px;min-height:0;cursor:pointer;flex:none}

/* --- v5: saved messages, smoother */
.ch-svi{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#4d7bff,#7a5cff);display:flex;align-items:center;justify-content:center;color:#fff;flex:none;box-shadow:0 4px 12px rgba(80,90,255,.35)}
.ch-svi svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.ch-svi.sm{width:38px;height:38px}.ch-svi.lg{width:84px;height:84px}
.ch-list{display:flex;flex-direction:column;gap:8px;margin-bottom:8px}.ch-list .ch-row{margin:0}
.ch-img{transform:translateZ(0);backface-visibility:hidden}
.ch-ms{-webkit-overflow-scrolling:touch;transform:translateZ(0)}
.ch-row2{will-change:auto}.ch-m{backface-visibility:hidden}
button,a,[onclick],.ch-row,.ch-chips button{touch-action:manipulation}

/* --- v6: long messages always wrap inside their bubble */
.ch-ms{min-width:0;overflow-x:hidden}
.ch-row2{min-width:0;max-width:100%;box-sizing:border-box}
.ch-m{min-width:0;box-sizing:border-box}
.ch-b{min-width:0;max-width:100%;box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;white-space:pre-wrap}
.ch-b>.ch-tx{min-width:0;max-width:100%;overflow-wrap:anywhere;word-break:break-word;white-space:pre-wrap}
.ch-b a{overflow-wrap:anywhere;word-break:break-all}
.ch-rx{display:flex;flex-wrap:wrap;gap:4px;margin:-7px 8px 0;position:relative;z-index:1}.ch-m.me .ch-rx{justify-content:flex-end}
.ch-rx button{display:inline-flex;align-items:center;gap:3px;min-height:0;height:24px;padding:0 8px;border-radius:12px;border:1px solid rgba(255,255,255,.28);background:rgba(34,38,86,.92);color:#fff;font:inherit;font-size:13px;font-weight:800;line-height:1;cursor:pointer;animation:chChip .22s cubic-bezier(.34,1.4,.5,1)}
.ch-rx button.me{background:#4d7bff;border-color:rgba(255,255,255,.55)}.ch-rx button span{font-size:14px}.ch-rx button b{font-size:12px}
.ch-rxb{position:absolute;z-index:3;display:flex;gap:2px;padding:5px 6px;border-radius:30px;background:rgba(28,30,64,.72);border:1px solid rgba(255,255,255,.26);-webkit-backdrop-filter:blur(30px) saturate(1.8);backdrop-filter:blur(30px) saturate(1.8);box-shadow:0 12px 34px rgba(0,0,0,.4);animation:chMenu .22s cubic-bezier(.34,1.45,.5,1)}
.ch-rxb button{min-height:0;width:38px;height:38px;border:0;border-radius:50%;background:none;font-size:24px;line-height:1;padding:0;cursor:pointer;transition:transform .15s}.ch-rxb button:active{transform:scale(1.35)}.ch-rxb button.on{background:rgba(255,255,255,.22)}
@media(prefers-reduced-motion:reduce){.ch-cxm,.ch-cx,.ch-ov.out{animation:none!important}.ch-ms{scroll-behavior:auto}}
`;
const sty = document.createElement('style'); sty.textContent = css; document.head.appendChild(sty);

/* ------------------------------------------------------------ boot */
function reset() { closeChat(true); const cfg = st.cfg; st = mkS(); st.cfg = cfg; badge(0); }
window.CHAT = { react, openSaved, view, after, reset, openConv, openWith, newChat, toList, reload, q, close: () => closeChat(), reloadChat: () => { if (C) { C.err = null; C.loading = true; renderMsgs(false); loadChat(); } }, retry, drop, sel, delMsg, vid: viewVideo, wipe, pushOn: enablePush, pushTest, openCtx, enterSel, exitSel, img: viewImg, menu, block, profile, state: () => st, isAdmin: () => !!st.admin, presText };
getCfg().then((c) => { st.cfg = c; pollBadge(); }).catch(() => {});
try { const qp = new URLSearchParams(location.search).get('chat'); if (qp) { history.replaceState(null, '', location.pathname); openFromPush(qp); } } catch (e) { /* ignore */ }
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'open-chat') openFromPush(e.data.nick); });
setInterval(pollBadge, 25000);
addEventListener('soc:me', () => { if (S.tab === 'chat') { st.gated = null; refresh(); } });
})();
