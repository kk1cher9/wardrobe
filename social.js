/* Driply — social tab of Weather Wardrobe (feed, publishing, profiles, likes, comments, saves, follows, discover, notifications).
   Loaded after the main script; uses its globals (S, API, esc, ic, I, toast, render, go, loadImg, buildCollage, shrink, colInfo, imgPut …).
   All data lives on the server (api/social.js); this file only renders it and sends user actions. */
(function () {
'use strict';
const NAME = 'Driply';
const STYLES = ['Streetwear', 'Casual', 'Minimalism', 'Old Money', 'Techwear', 'Smart Casual', 'Sporty', 'Grunge', 'Vintage', 'Y2K', 'Preppy', 'Other'];

/* ------------------------------------------------------------------ texts (ru / uk / en) */
const T = {
ru: { foryou: 'Для вас', following: 'Подписки', trending: 'Тренды', publish: '+ Опубликовать', discover: 'Поиск', notifs: 'Уведомления', saved: 'Сохранённые', posts: 'Публикации', followers: 'Подписчики', followingN: 'Подписки', back: 'Назад', close: 'Закрыть', cancel: 'Отмена', save: 'Сохранить', done: 'Готово', retry: 'Повторить', refresh: 'Обновить', loading: 'Загрузка…', more: 'ещё', less: 'свернуть',
  like: 'Нравится', comment: 'Комментарии', bookmark: 'Сохранить', share: 'Поделиться', follow: 'Подписаться', unfollow: 'Отписаться', youFollow: 'Вы подписаны', editProfile: 'Редактировать профиль', me: 'Вы', mine: 'Моя публикация',
  items: 'Вещи в образе', similar: 'Создать похожий', palette: 'Палитра', style: 'Стиль', weather: 'Погода', fits: 'Подходит для',
  emptyFeedT: 'Здесь пока нет образов', emptyFeedD: 'Опубликуйте первый образ — он появится в ленте и в вашем профиле.', emptyFollowT: 'Вы пока ни на кого не подписаны', emptyFollowD: 'Найдите авторов во вкладке «Поиск» и подписывайтесь — их образы появятся здесь.', emptyTrendT: 'Пока нет популярных образов', emptyTrendD: 'Образы с лайками и комментариями появятся здесь.', emptySavedT: 'Сохранённых образов нет', emptySavedD: 'Нажмите на закладку у понравившегося образа, чтобы вернуться к нему позже.', emptyPostsT: 'Публикаций пока нет', emptyNotifT: 'Уведомлений пока нет', emptyNotifD: 'Здесь появятся лайки, комментарии и новые подписчики.', emptySearch: 'Ничего не найдено', typeToSearch: 'Ищите по нику, названию образа, стилю или вещи',
  errLoad: 'Не удалось загрузить', errNet: 'Нет интернета. Проверьте соединение и повторите.', errGeneric: 'Что-то пошло не так. Повторите позже.', errRate: 'Слишком часто. Попробуйте чуть позже.', errNick: 'Этот ник уже занят', errBadNick: 'Ник: 3–20 символов, латиница, цифры, _ и .', errImg: 'Не удалось обработать фото', errBig: 'Фото слишком большое', errAuth: 'Войдите, чтобы продолжить', errForbidden: 'Нет прав на это действие', gone: 'Публикация удалена или недоступна',
  gateTitle: 'Driply — образы людей', gateNoServer: 'Для соцсети нужен сервер: вход через Google и база данных. Подробности — в README (раздел «Driply»).', gateOffline: 'Нет связи с сервером. Соцсеть работает только онлайн.', gateSign: 'Войдите через Google, чтобы смотреть образы, публиковать свои, подписываться и сохранять.', gateWhy: 'Ваш гардероб и настройки остаются как были — вход нужен только для социальной части.',
  setupT: 'Создайте профиль', setupD: 'Так вас увидят другие. Ник можно сменить позже.', nick: 'Ник', name: 'Имя', bio: 'О себе', story: 'История', settings: 'Настройки', yourStory: 'Ваша история', addStory: 'Добавить историю', newStory: 'Новая история', storyCap: 'Подпись (необязательно)', storyPost: 'Опубликовать историю', storyPosted: 'История опубликована', storyExp: 'Исчезнет через 24 часа', delStoryQ: 'Удалить историю?', viewers: 'Просмотры', noViewers: 'Пока никто не смотрел', storyGone: 'История недоступна', avChange: 'Сменить фото', avReset: 'Убрать фото', create: 'Создать профиль', nickHint: 'латиница, цифры, _ и .',
  newPost: 'Новая публикация', editPost: 'Редактировать публикацию', photo: 'Фото образа', pickPhoto: 'Выбрать фото', camera: 'Камера', fromToday: 'Образ на сегодня', fromSaved: 'Из сохранённых', fromWardrobe: 'Собрать из вещей', title: 'Название образа', caption: 'Подпись (необязательно)', pickStyle: 'Стиль', itemsT: 'Вещи', fromMyWardrobe: 'Из гардероба', addItem: 'Добавить', itemName: 'Название вещи', colors: 'Цвета', addColor: 'Добавить цвет', addWeather: 'Указать погоду', tmin: 'от, °C', tmax: 'до, °C', preview: 'Просмотр', draftSave: 'Черновик', draftSaved: 'Черновик сохранён', draftLoaded: 'Есть сохранённый черновик', draftUse: 'Открыть', draftDrop: 'Удалить', publishNow: 'Опубликовать', publishing: 'Публикую…', published: 'Опубликовано', edited: 'Изменения сохранены', needPhoto: 'Добавьте фото образа', noToday: 'Сегодняшний образ ещё не подобран или состоит из демо-вещей', noSaved: 'Сохранённых образов нет', pickItems: 'Выберите вещи', usePhoto: 'Использовать',
  del: 'Удалить', delPostQ: 'Удалить публикацию? Это нельзя отменить.', delCommentQ: 'Удалить комментарий?', deleted: 'Удалено', edit: 'Изменить', copyLink: 'Ссылка скопирована', shareText: 'Образ в Driply',
  writeComment: 'Добавить комментарий…', send: 'Отправить', noComments: 'Комментариев пока нет. Будьте первым!', commentsT: 'Комментарии',
  simT: 'Похожий образ из вашего гардероба', simD: 'Мы подобрали вещи из вашего гардероба. Ничего не добавляется без вашего подтверждения.', simNone: 'нет подходящей вещи', simSave: 'Сохранить как мой образ', simSaved: 'Образ сохранён в «Образы»', simEmpty: 'В вашем гардеробе нет подходящих вещей. Добавьте их во вкладке «Гардероб».', simPick: 'выбрать', simSkip: 'не использовать',
  nLike: 'лайкнул(а) ваш образ', nComment: 'прокомментировал(а)', nFollow: 'подписал(ась) на вас', newFollower: 'Новый подписчик', newLike: 'Новый лайк', newComment: 'Новый комментарий', repost: 'Репост', repostedBy: 'репостнул(а)', rpOn: 'Репост опубликован', rpOff: 'Репост удалён', rpDelQ: 'Удалить репост?', rpDel: 'Удалить репост', rpMine: 'Мой репост', newRepost: 'Новый репост', nRepost: 'сделал(а) репост вашей публикации', video: 'Видео', videoBig: 'Видео слишком большое (до 14 МБ)', videoErr: 'Не удалось прочитать видео', videoUp: 'Загрузка видео', editor: 'Редактор', outfitT: 'Образ', play: 'Воспроизвести', 
  authors: 'Авторы', trendingNow: 'Сейчас в тренде', inStyle: 'В стиле', search: 'Поиск', users: 'Люди', postsRes: 'Образы', loginAgain: 'Сессия истекла — войдите снова',
  styleN: { Streetwear: 'Стритвир', Casual: 'Кэжуал', Minimalism: 'Минимализм', 'Old Money': 'Old Money', Techwear: 'Техвир', 'Smart Casual': 'Смарт-кэжуал', Sporty: 'Спорт', Grunge: 'Гранж', Vintage: 'Винтаж', Y2K: 'Y2K', Preppy: 'Преппи', Other: 'Другое' },
  col: { black: 'чёрный', white: 'белый', gray: 'серый', 'dark gray': 'тёмно-серый', 'light gray': 'светло-серый', beige: 'бежевый', brown: 'коричневый', red: 'красный', burgundy: 'бордовый', pink: 'розовый', orange: 'оранжевый', yellow: 'жёлтый', olive: 'оливковый', green: 'зелёный', teal: 'бирюзовый', navy: 'тёмно-синий', denim: 'джинсовый', 'light blue': 'голубой', blue: 'синий', purple: 'фиолетовый' },
  pl: { comments: ['комментарий', 'комментария', 'комментариев'], likes: ['лайк', 'лайка', 'лайков'], items: ['вещь', 'вещи', 'вещей'] } },
uk: { foryou: 'Для вас', following: 'Підписки', trending: 'Тренди', publish: '+ Опублікувати', discover: 'Пошук', notifs: 'Сповіщення', saved: 'Збережені', posts: 'Публікації', followers: 'Підписники', followingN: 'Підписки', back: 'Назад', close: 'Закрити', cancel: 'Скасувати', save: 'Зберегти', done: 'Готово', retry: 'Повторити', refresh: 'Оновити', loading: 'Завантаження…', more: 'ще', less: 'згорнути',
  like: 'Подобається', comment: 'Коментарі', bookmark: 'Зберегти', share: 'Поділитися', follow: 'Підписатися', unfollow: 'Відписатися', youFollow: 'Ви підписані', editProfile: 'Редагувати профіль', me: 'Ви', mine: 'Моя публікація',
  items: 'Речі в образі', similar: 'Створити схожий', palette: 'Палітра', style: 'Стиль', weather: 'Погода', fits: 'Підходить для',
  emptyFeedT: 'Тут поки немає образів', emptyFeedD: 'Опублікуйте перший образ — він з’явиться у стрічці та у вашому профілі.', emptyFollowT: 'Ви поки ні на кого не підписані', emptyFollowD: 'Знайдіть авторів у вкладці «Пошук» і підписуйтесь — їхні образи з’являться тут.', emptyTrendT: 'Поки немає популярних образів', emptyTrendD: 'Образи з лайками та коментарями з’являться тут.', emptySavedT: 'Збережених образів немає', emptySavedD: 'Натисніть на закладку біля образу, що сподобався, щоб повернутися до нього пізніше.', emptyPostsT: 'Публікацій поки немає', emptyNotifT: 'Сповіщень поки немає', emptyNotifD: 'Тут з’являться лайки, коментарі та нові підписники.', emptySearch: 'Нічого не знайдено', typeToSearch: 'Шукайте за ніком, назвою образу, стилем або річчю',
  errLoad: 'Не вдалося завантажити', errNet: 'Немає інтернету. Перевірте з’єднання та повторіть.', errGeneric: 'Щось пішло не так. Спробуйте пізніше.', errRate: 'Занадто часто. Спробуйте трохи пізніше.', errNick: 'Цей нік уже зайнятий', errBadNick: 'Нік: 3–20 символів, латиниця, цифри, _ та .', errImg: 'Не вдалося обробити фото', errBig: 'Фото завелике', errAuth: 'Увійдіть, щоб продовжити', errForbidden: 'Немає прав на цю дію', gone: 'Публікацію видалено або вона недоступна',
  gateTitle: 'Driply — образи людей', gateNoServer: 'Для соцмережі потрібен сервер: вхід через Google і база даних. Подробиці — у README (розділ «Driply»).', gateOffline: 'Немає зв’язку із сервером. Соцмережа працює лише онлайн.', gateSign: 'Увійдіть через Google, щоб дивитися образи, публікувати свої, підписуватися та зберігати.', gateWhy: 'Ваш гардероб і налаштування лишаються як були — вхід потрібен лише для соціальної частини.',
  setupT: 'Створіть профіль', setupD: 'Так вас побачать інші. Нік можна змінити пізніше.', nick: 'Нік', name: 'Ім’я', bio: 'Про себе', story: 'Історія', settings: 'Налаштування', yourStory: 'Ваша історія', addStory: 'Додати історію', newStory: 'Нова історія', storyCap: 'Підпис (необов’язково)', storyPost: 'Опублікувати історію', storyPosted: 'Історію опубліковано', storyExp: 'Зникне через 24 години', delStoryQ: 'Видалити історію?', viewers: 'Перегляди', noViewers: 'Поки ніхто не дивився', storyGone: 'Історія недоступна', avChange: 'Змінити фото', avReset: 'Прибрати фото', create: 'Створити профіль', nickHint: 'латиниця, цифри, _ та .',
  newPost: 'Нова публікація', editPost: 'Редагувати публікацію', photo: 'Фото образу', pickPhoto: 'Обрати фото', camera: 'Камера', fromToday: 'Образ на сьогодні', fromSaved: 'Зі збережених', fromWardrobe: 'Зібрати з речей', title: 'Назва образу', caption: 'Підпис (необов’язково)', pickStyle: 'Стиль', itemsT: 'Речі', fromMyWardrobe: 'З гардероба', addItem: 'Додати', itemName: 'Назва речі', colors: 'Кольори', addColor: 'Додати колір', addWeather: 'Вказати погоду', tmin: 'від, °C', tmax: 'до, °C', preview: 'Перегляд', draftSave: 'Чернетка', draftSaved: 'Чернетку збережено', draftLoaded: 'Є збережена чернетка', draftUse: 'Відкрити', draftDrop: 'Видалити', publishNow: 'Опублікувати', publishing: 'Публікую…', published: 'Опубліковано', edited: 'Зміни збережено', needPhoto: 'Додайте фото образу', noToday: 'Сьогоднішній образ ще не підібрано або він складається з демо-речей', noSaved: 'Збережених образів немає', pickItems: 'Оберіть речі', usePhoto: 'Використати',
  del: 'Видалити', delPostQ: 'Видалити публікацію? Це неможливо скасувати.', delCommentQ: 'Видалити коментар?', deleted: 'Видалено', edit: 'Змінити', copyLink: 'Посилання скопійовано', shareText: 'Образ у Driply',
  writeComment: 'Додати коментар…', send: 'Надіслати', noComments: 'Коментарів поки немає. Будьте першим!', commentsT: 'Коментарі',
  simT: 'Схожий образ із вашого гардероба', simD: 'Ми підібрали речі з вашого гардероба. Нічого не додається без вашого підтвердження.', simNone: 'немає підхожої речі', simSave: 'Зберегти як мій образ', simSaved: 'Образ збережено в «Образи»', simEmpty: 'У вашому гардеробі немає підхожих речей. Додайте їх у вкладці «Гардероб».', simPick: 'обрати', simSkip: 'не використовувати',
  nLike: 'вподобав(ла) ваш образ', nComment: 'прокоментував(ла)', nFollow: 'підписав(лась) на вас', newFollower: 'Новий підписник', newLike: 'Новий лайк', newComment: 'Новий коментар', repost: 'Репост', repostedBy: 'зробив(ла) репост', rpOn: 'Репост опубліковано', rpOff: 'Репост видалено', rpDelQ: 'Видалити репост?', rpDel: 'Видалити репост', rpMine: 'Мій репост', newRepost: 'Новий репост', nRepost: 'зробив(ла) репост вашої публікації', video: 'Відео', videoBig: 'Відео завелике (до 14 МБ)', videoErr: 'Не вдалося прочитати відео', videoUp: 'Завантаження відео', editor: 'Редактор', outfitT: 'Образ', play: 'Відтворити', 
  authors: 'Автори', trendingNow: 'Зараз у тренді', inStyle: 'У стилі', search: 'Пошук', users: 'Люди', postsRes: 'Образи', loginAgain: 'Сесія завершилась — увійдіть знову',
  styleN: { Streetwear: 'Стрітвір', Casual: 'Кежуал', Minimalism: 'Мінімалізм', 'Old Money': 'Old Money', Techwear: 'Техвір', 'Smart Casual': 'Смарт-кежуал', Sporty: 'Спорт', Grunge: 'Ґрандж', Vintage: 'Вінтаж', Y2K: 'Y2K', Preppy: 'Преппі', Other: 'Інше' },
  col: { black: 'чорний', white: 'білий', gray: 'сірий', 'dark gray': 'темно-сірий', 'light gray': 'світло-сірий', beige: 'бежевий', brown: 'коричневий', red: 'червоний', burgundy: 'бордовий', pink: 'рожевий', orange: 'помаранчевий', yellow: 'жовтий', olive: 'оливковий', green: 'зелений', teal: 'бірюзовий', navy: 'темно-синій', denim: 'джинсовий', 'light blue': 'блакитний', blue: 'синій', purple: 'фіолетовий' },
  pl: { comments: ['коментар', 'коментарі', 'коментарів'], likes: ['лайк', 'лайки', 'лайків'], items: ['річ', 'речі', 'речей'] } },
en: { foryou: 'For You', following: 'Following', trending: 'Trending', publish: '+ Post', discover: 'Discover', notifs: 'Notifications', saved: 'Saved', posts: 'Posts', followers: 'Followers', followingN: 'Following', back: 'Back', close: 'Close', cancel: 'Cancel', save: 'Save', done: 'Done', retry: 'Retry', refresh: 'Refresh', loading: 'Loading…', more: 'more', less: 'less',
  like: 'Like', comment: 'Comments', bookmark: 'Save', share: 'Share', follow: 'Follow', unfollow: 'Unfollow', youFollow: 'Following', editProfile: 'Edit profile', me: 'You', mine: 'My post',
  items: 'Items in this look', similar: 'Create similar', palette: 'Palette', style: 'Style', weather: 'Weather', fits: 'Fits',
  emptyFeedT: 'No outfits here yet', emptyFeedD: 'Post your first outfit — it will show up in the feed and on your profile.', emptyFollowT: 'You are not following anyone yet', emptyFollowD: 'Find creators in Discover and follow them — their outfits will appear here.', emptyTrendT: 'No popular outfits yet', emptyTrendD: 'Outfits with likes and comments will show up here.', emptySavedT: 'No saved outfits', emptySavedD: 'Tap the bookmark on an outfit you like to find it again later.', emptyPostsT: 'No posts yet', emptyNotifT: 'No notifications yet', emptyNotifD: 'Likes, comments and new followers will show up here.', emptySearch: 'Nothing found', typeToSearch: 'Search by username, outfit name, style or item',
  errLoad: 'Could not load', errNet: 'No internet. Check your connection and retry.', errGeneric: 'Something went wrong. Please try again later.', errRate: 'Too many requests. Try again in a bit.', errNick: 'This username is taken', errBadNick: 'Username: 3–20 characters, latin letters, digits, _ and .', errImg: 'Could not process the photo', errBig: 'The photo is too large', errAuth: 'Sign in to continue', errForbidden: 'You are not allowed to do this', gone: 'This post was deleted or is unavailable',
  gateTitle: 'Driply — outfits by people', gateNoServer: 'The social tab needs a server: Google sign-in and a database. See the README (section “Driply”).', gateOffline: 'Cannot reach the server. The social tab works online only.', gateSign: 'Sign in with Google to browse outfits, post your own, follow people and save favourites.', gateWhy: 'Your wardrobe and settings stay as they are — sign-in is only needed for the social part.',
  setupT: 'Create your profile', setupD: 'This is how others will see you. You can change the username later.', nick: 'Username', name: 'Name', bio: 'About you', story: 'Story', settings: 'Settings', yourStory: 'Your story', addStory: 'Add story', newStory: 'New story', storyCap: 'Caption (optional)', storyPost: 'Share story', storyPosted: 'Story shared', storyExp: 'Disappears in 24 hours', delStoryQ: 'Delete this story?', viewers: 'Views', noViewers: 'No views yet', storyGone: 'Story unavailable', avChange: 'Change photo', avReset: 'Remove photo', create: 'Create profile', nickHint: 'latin letters, digits, _ and .',
  newPost: 'New post', editPost: 'Edit post', photo: 'Outfit photo', pickPhoto: 'Choose photo', camera: 'Camera', fromToday: 'Today’s outfit', fromSaved: 'From saved', fromWardrobe: 'Build from items', title: 'Outfit title', caption: 'Caption (optional)', pickStyle: 'Style', itemsT: 'Items', fromMyWardrobe: 'From wardrobe', addItem: 'Add', itemName: 'Item name', colors: 'Colours', addColor: 'Add colour', addWeather: 'Add weather', tmin: 'from, °C', tmax: 'to, °C', preview: 'Preview', draftSave: 'Draft', draftSaved: 'Draft saved', draftLoaded: 'You have a saved draft', draftUse: 'Open', draftDrop: 'Delete', publishNow: 'Publish', publishing: 'Publishing…', published: 'Published', edited: 'Changes saved', needPhoto: 'Add a photo of the outfit', noToday: 'Today’s outfit is not picked yet or consists of demo items', noSaved: 'No saved outfits', pickItems: 'Pick items', usePhoto: 'Use',
  del: 'Delete', delPostQ: 'Delete this post? This cannot be undone.', delCommentQ: 'Delete this comment?', deleted: 'Deleted', edit: 'Edit', copyLink: 'Link copied', shareText: 'An outfit on Driply',
  writeComment: 'Add a comment…', send: 'Send', noComments: 'No comments yet. Be the first!', commentsT: 'Comments',
  simT: 'A similar look from your wardrobe', simD: 'We matched items from your wardrobe. Nothing is added without your confirmation.', simNone: 'no matching item', simSave: 'Save as my outfit', simSaved: 'Outfit saved in “Outfits”', simEmpty: 'Your wardrobe has no matching items. Add some in the Wardrobe tab.', simPick: 'choose', simSkip: 'skip',
  nLike: 'liked your outfit', nComment: 'commented', nFollow: 'started following you', newFollower: 'New follower', newLike: 'New like', newComment: 'New comment', repost: 'Repost', repostedBy: 'reposted', rpOn: 'Reposted', rpOff: 'Repost removed', rpDelQ: 'Remove this repost?', rpDel: 'Remove repost', rpMine: 'My repost', newRepost: 'New repost', nRepost: 'reposted your post', video: 'Video', videoBig: 'Video is too large (up to 14 MB)', videoErr: 'Could not read the video', videoUp: 'Uploading video', editor: 'Editor', outfitT: 'Outfit', play: 'Play', 
  authors: 'Creators', trendingNow: 'Trending now', inStyle: 'In style', search: 'Search', users: 'People', postsRes: 'Outfits', loginAgain: 'Session expired — please sign in again',
  styleN: { Streetwear: 'Streetwear', Casual: 'Casual', Minimalism: 'Minimalism', 'Old Money': 'Old Money', Techwear: 'Techwear', 'Smart Casual': 'Smart Casual', Sporty: 'Sporty', Grunge: 'Grunge', Vintage: 'Vintage', Y2K: 'Y2K', Preppy: 'Preppy', Other: 'Other' },
  col: { black: 'black', white: 'white', gray: 'grey', 'dark gray': 'dark grey', 'light gray': 'light grey', beige: 'beige', brown: 'brown', red: 'red', burgundy: 'burgundy', pink: 'pink', orange: 'orange', yellow: 'yellow', olive: 'olive', green: 'green', teal: 'teal', navy: 'navy', denim: 'denim', 'light blue': 'light blue', blue: 'blue', purple: 'purple' },
  pl: { comments: ['comment', 'comments'], likes: ['like', 'likes'], items: ['item', 'items'] } }
};
const CHAT_T = { ru: 'Написать', uk: 'Написати', en: 'Message' };
const L = () => T[(window.I18N && I18N.lang) || 'ru'] || T.ru;
Object.assign(T.ru, { myStyle: 'Мой стиль', myStyleD: 'Можно выбрать несколько', otherStyle: 'Другой стиль', otherStylePh: 'Свой вариант', add: 'Добавить', earnT: 'Статус заработка', earnD: 'Необязательно. Доход и суммы указывать не нужно.', earnNone: '— не выбрано —', earn_none: 'Пока не зарабатываю', earn_start: 'Начинаю зарабатывать', earn_style: 'Зарабатываю на своём стиле', earn_clients: 'Работаю с клиентами', earn_designer: 'Работаю как дизайнер или стилист', earn_biz: 'Предприниматель', earn_other: 'Другое', earn_hidden: 'Не указывать', earnPub: 'Показывать в моём профиле', brandsT: 'Любимые бренды', brandPh: 'Добавить бренд', saving: 'Сохранение…', saved2: 'Сохранено', styleLbl: 'Стиль', brandLbl: 'Бренды', actNever: 'Нет данных об активности', actLbl: 'Активность' });
Object.assign(T.uk, { myStyle: 'Мій стиль', myStyleD: 'Можна обрати кілька', otherStyle: 'Інший стиль', otherStylePh: 'Свій варіант', add: 'Додати', earnT: 'Статус заробітку', earnD: 'Необов’язково. Дохід і суми вказувати не потрібно.', earnNone: '— не обрано —', earn_none: 'Поки не заробляю', earn_start: 'Починаю заробляти', earn_style: 'Заробляю на своєму стилі', earn_clients: 'Працюю з клієнтами', earn_designer: 'Працюю як дизайнер або стиліст', earn_biz: 'Підприємець', earn_other: 'Інше', earn_hidden: 'Не вказувати', earnPub: 'Показувати в моєму профілі', brandsT: 'Улюблені бренди', brandPh: 'Додати бренд', saving: 'Збереження…', saved2: 'Збережено', styleLbl: 'Стиль', brandLbl: 'Бренди', actNever: 'Немає даних про активність', actLbl: 'Активність' });
Object.assign(T.en, { myStyle: 'My style', myStyleD: 'Pick as many as you like', otherStyle: 'Other style', otherStylePh: 'Your own', add: 'Add', earnT: 'Earning status', earnD: 'Optional. No income or amounts needed.', earnNone: '— not set —', earn_none: 'Not earning yet', earn_start: 'Starting to earn', earn_style: 'Earning from my style', earn_clients: 'Working with clients', earn_designer: 'Working as a designer or stylist', earn_biz: 'Entrepreneur', earn_other: 'Other', earn_hidden: 'Prefer not to say', earnPub: 'Show on my profile', brandsT: 'Favourite brands', brandPh: 'Add a brand', saving: 'Saving…', saved2: 'Saved', styleLbl: 'Style', brandLbl: 'Brands', actNever: 'No activity data', actLbl: 'Activity' });
const t = (k) => { const v = L()[k]; return v === undefined ? T.ru[k] : v; };
const FSTY = ['Streetwear', 'Casual', 'Minimalism', 'Old Money', 'Techwear', 'Vintage', 'Y2K', 'Grunge', 'Sportstyle', 'Smart Casual', 'High Fashion'];
const EARN = ['none', 'start', 'style', 'clients', 'designer', 'biz', 'other', 'hidden'];
const BRANDS = ['Nike', 'Adidas', 'Stüssy', 'Carhartt WIP', 'Supreme', 'Acne Studios', 'Balenciaga', 'Rick Owens', 'New Balance', 'COS', 'Zara', 'H&M', "Levi's", 'The North Face', 'Stone Island', 'Palace', 'Dr. Martens'];
const pl = (n, k) => { const f = L().pl[k], l = (window.I18N && I18N.lang) || 'ru'; n = Math.abs(n); let i; if (l === 'en') i = n === 1 ? 0 : 1; else { const m10 = n % 10, m100 = n % 100; i = m10 === 1 && m100 !== 11 ? 0 : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? 1 : 2; } return n + ' ' + f[i]; };
const styleName = (s) => L().styleN[s] || s;
const colName = (c) => (L().col[c] || c);
const trIt = (s) => (window.I18N ? I18N.tr(String(s || '')) : String(s || ''));
const VB = '<svg class="vb" viewBox="0 0 24 24" width="15" height="15" role="img" aria-label="verified"><circle cx="12" cy="12" r="10.5" fill="#3b82f6"/><path d="M7.600 12.400l3 3 5.800-6.200" stroke="#fff" stroke-width="2.300" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const vb = (a) => (a && a.verified ? VB : '');
const E = (s) => esc(String(s == null ? '' : s));

/* ------------------------------------------------------------------ icons */
Object.assign(I, {
  heart: '<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.7a4.3 4.3 0 017.5 2.6c0 5.6-7.5 10.2-7.5 10.2z"/>',
  chat: '<path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-8l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z"/>',
  mark: '<path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z"/>',
  share: '<path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c.8-4 3.7-6 7.5-6s6.7 2 7.5 6"/>',
  dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  pen: '<path d="M4 20h4.2L19.4 8.8a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4 15.8z"/><path d="M13.5 6.5l4 4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  repost: '<path d="M17 3l3.5 3.5L17 10"/><path d="M4 11V9.5A3 3 0 017 6.500h13.500"/><path d="M7 21l-3.500-3.500L7 14"/><path d="M20 13v1.500a3 3 0 01-3 3H3.500"/>',
  play: '<path d="M8 5.500v13l11-6.500z" fill="currentColor"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  img: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10.5" r="1.6"/><path d="M4 17l5-4.5 3.5 3L16 12l4.5 4.5"/>',
  cam: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.4"/>',
  tick: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  drip: '<path d="M12 2.8c3.3 4 5.6 7 5.6 10.2a5.6 5.6 0 01-11.2 0C6.4 9.800 8.700 6.800 12 2.800z"/><path d="M9.700 13.500a2.500 2.500 0 002.100 2.500"/>'
});
const ico = (n, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

/* ------------------------------------------------------------------ state */
const mkFeed = () => ({ posts: [], next: 0, loading: false, err: null, loaded: false, at: 0, nofollow: false });
const st = {
  cfg: undefined, me: undefined, meErr: null, unread: 0,
  feed: { foryou: mkFeed(), following: mkFeed(), trending: mkFeed() }, tab: 'foryou',
  view: 'feed', stack: [], saved: mkFeed(), prof: {}, ptab: 'posts', nick: null, post: null, notifs: { list: null, loading: false, err: null }, disc: { data: null, loading: false, err: null, q: '', res: null, searching: false },
  stories: { groups: null, loading: false, err: null, at: 0 }, byId: new Map(), shown: new Set(), fxn: 0, meLoading: false, gate: null, setupShown: false
};
function reset() { // account switched / logged out: forget everything that belonged to the previous user
  st.me = undefined; st.meErr = null; st.unread = 0; st.feed = { foryou: mkFeed(), following: mkFeed(), trending: mkFeed() }; st.saved = mkFeed(); st.prof = {}; st.view = 'feed'; st.stack = []; st.notifs = { list: null, loading: false, err: null }; st.disc = { data: null, loading: false, err: null, q: '', res: null, searching: false }; st.byId = new Map(); st.setupShown = false; st.gate = null; st.stories = { groups: null, loading: false, err: null, at: 0 }; closeStory();
  document.querySelectorAll('.modal.sc-m').forEach((m) => m.remove());
}
const refresh = () => { if (S.tab === 'social') render(); };
const myNick = () => (st.me && st.me.profile ? st.me.profile.nick : null);

/* ------------------------------------------------------------------ network */
async function api(path, opt) {
  if (!navigator.onLine) { const e = new Error('offline'); e.code = 'offline'; throw e; }
  let r;
  try { r = await API(path, opt); } catch (x) { const e = new Error('network'); e.code = 'offline'; throw e; }
  let j = null; try { j = await r.json(); } catch (x) { /* empty */ }
  if (!r.ok) { const e = new Error((j && j.error) || 'http_' + r.status); e.code = (j && j.error) || 'http_' + r.status; e.status = r.status; throw e; }
  return j;
}
const gq = (q) => api('/api/social?' + q);
const pq = (op, b) => api('/api/social', { method: 'POST', body: JSON.stringify({ op, ...(b || {}) }) });
function errText(e) {
  const c = e && e.code;
  if (c === 'offline') return t('errNet');
  if (c === 'rate_limited' || c === 'too_many_comments') return t('errRate');
  if (c === 'nick_taken') return t('errNick');
  if (c === 'bad_nick') return t('errBadNick');
  if (c === 'bad_image') return t('errImg');
  if (c === 'image_too_large') return t('errBig');
  if (c === 'video_too_large') return t('videoBig');
  if (c === 'bad_video') return t('videoErr');
  if (c === 'unauthorized') return t('errAuth');
  if (c === 'forbidden') return t('errForbidden');
  if (c === 'not_found') return t('gone');
  return t('errGeneric');
}
function handleAuthErr(e) {
  if (e && e.code === 'profile_required') { st.me = { profile: null }; openSetup(); return true; }
  if (e && e.code === 'unauthorized') { toast(t('loginAgain')); return true; }
  return false;
}
const note = (e) => { if (!handleAuthErr(e)) toast(errText(e)); };

async function loadCfg() { if (st.cfg !== undefined) return st.cfg; try { st.cfg = (await getCfg()) || null; } catch (e) { st.cfg = null; } return st.cfg; }
async function loadMe(force) {
  if (st.meLoading || (st.me !== undefined && !force)) return;
  st.meLoading = true; st.meErr = null;
  try { st.me = await gq('a=me'); st.unread = st.me.unread || 0; } catch (e) { st.meErr = e; if (e.code === 'unauthorized') st.me = undefined; }
  st.meLoading = false; refresh(); window.dispatchEvent(new Event('soc:me'));
  if (st.me && st.me.profile === null && S.tab === 'social') openSetup();
}

/* ------------------------------------------------------------------ small helpers */
function ago(ts) {
  const d = (Date.now() - ts) / 1000, loc = (window.I18N && I18N.loc) || 'ru-RU';
  try {
    const rtf = new Intl.RelativeTimeFormat(loc, { numeric: 'auto', style: 'short' });
    if (d < 45) return rtf.format(0, 'second');
    if (d < 3600) return rtf.format(-Math.round(d / 60), 'minute');
    if (d < 86400) return rtf.format(-Math.round(d / 3600), 'hour');
    if (d < 7 * 86400) return rtf.format(-Math.round(d / 86400), 'day');
    return new Date(ts).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: new Date(ts).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  } catch (e) { return new Date(ts).toLocaleDateString(); }
}
const av = (a, s) => (a && a.avatar ? `<img class="sc-av" style="width:${s}px;height:${s}px" src="${E(a.avatar)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="if(this.parentNode)this.outerHTML='<span class=&quot;sc-av ph&quot; style=&quot;width:${s}px;height:${s}px;font-size:${Math.round(s * .42)}px&quot;>${E(((a && (a.name || a.nick)) || '?').slice(0, 1).toUpperCase())}</span>'">` : `<span class="sc-av ph" style="width:${s}px;height:${s}px;font-size:${Math.round(s * .42)}px">${E(((a && (a.name || a.nick)) || '?').slice(0, 1).toUpperCase())}</span>`);
const cnt = (n) => (n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n));
const wxTxt = (w) => (w ? (w.tmin != null && w.tmax != null ? `${w.tmin}…${w.tmax}°C` : w.tmin != null ? `${w.tmin}°C` : `${w.tmax}°C`) : '');
function remember(posts) { posts.forEach((p) => st.byId.set(p.id, p)); }
function stateBox(icon, title, desc, btn) {
  return `<div class="sc-state">${icon ? `<div class="sc-sic">${ico(icon, 34)}</div>` : ''}<b>${E(title)}</b>${desc ? `<p>${E(desc)}</p>` : ''}${btn || ''}</div>`;
}
const skel = (n) => Array.from({ length: n }, () => '<div class="sc-sk"><div class="sc-skh"></div><div class="sc-ski"></div></div>').join('');

/* ------------------------------------------------------------------ post card */
function actBar(p) {
  return `<button class="sc-b${p.liked ? ' on' : ''}" onclick="SOC.like('${p.id}')" aria-label="${E(t('like'))}" aria-pressed="${p.liked}">${ico('heart')}<span>${p.likes ? cnt(p.likes) : ''}</span></button>
<button class="sc-b" onclick="SOC.comments('${p.id}')" aria-label="${E(t('comment'))}">${ico('chat')}<span>${p.comments ? cnt(p.comments) : ''}</span></button>
${p.mine ? (p.reposts ? `<span class="sc-b ro" title="${E(t('repost'))}">${ico('repost')}<span>${cnt(p.reposts)}</span></span>` : '') : `<button class="sc-b rp${p.reposted ? ' on' : ''}" onclick="SOC.repost('${p.id}')" aria-label="${E(t('repost'))}" aria-pressed="${!!p.reposted}">${ico('repost')}<span>${p.reposts ? cnt(p.reposts) : ''}</span></button>`}
<button class="sc-b" onclick="SOC.share('${p.id}')" aria-label="${E(t('share'))}">${ico('share')}</button>
<button class="sc-b sv${p.saved ? ' on' : ''}" onclick="SOC.save('${p.id}')" aria-label="${E(t('bookmark'))}" aria-pressed="${p.saved}">${ico('mark')}</button>`;
}
function itemsBlock(p, open) {
  if (!p.items || !p.items.length) return '';
  const rows = p.items.map((i) => `<li><b>${E(trIt(i.n))}</b><span>${[i.c ? trIt(i.c) : '', i.col ? colName(i.col) : ''].filter(Boolean).map(E).join(' · ')}</span></li>`).join('');
  return `<div class="sc-its"><button class="sc-lnk" onclick="SOC.toggleItems('${p.id}',this)" aria-expanded="${!!open}">${E(t('items'))} · ${p.items.length} <i class="sc-chev"></i></button><div class="sc-itl${open ? ' open' : ''}"><ul>${rows}</ul><button class="btn g sc-sim" onclick="SOC.similar('${p.id}')">${ico('hang', 18)} ${E(t('similar'))}</button></div></div>`;
}
function palDots(p) { return p.palette && p.palette.length ? `<span class="sc-pal" title="${E(t('palette'))}">${p.palette.map((c) => (/^#/.test(c) ? `<i style="background:${E(c)}"></i>` : `<em>${E(trIt(c))}</em>`)).join('')}</span>` : ''; }
const fmtDur = (d) => { d = Math.round(d || 0); return Math.floor(d / 60) + ':' + String(d % 60).padStart(2, '0'); };
const ovLayer = (ov) => (ov && ov.length ? `<div class="sc-ov">${ov.map((o) => `<img class="sc-ovg" src="${E(o.u)}" alt="" draggable="false" style="left:${+o.x}%;top:${+o.y}%;width:${+o.w}%;transform:translate(-50%,-50%) rotate(${+o.r || 0}deg)">`).join('')}</div>` : '');
function placeOv(im, mode) { // the sticker layer must sit exactly over the picture (cover in feed cards, contain in stories)
  const box = im.parentElement, ly = box && box.querySelector(':scope > .sc-ov'); if (!ly || !im.naturalWidth) return;
  const cw = box.clientWidth, ch = box.clientHeight, k = (mode === 'contain' ? Math.min : Math.max)(cw / im.naturalWidth, ch / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
  ly.style.cssText = `left:${(cw - w) / 2}px;top:${(ch - h) / 2}px;width:${w}px;height:${h}px`;
}
const fitStrip = (p) => (p.fit && p.fit.length ? `<div class="sp-fit"><span>${E(t('outfitT'))}</span><div>${p.fit.map((f) => `<figure><img src="${E(f.u)}" alt="${E(trIt(f.n))}" loading="lazy" decoding="async"><figcaption>${E(trIt(f.n))}</figcaption></figure>`).join('')}</div></div>` : '');
function card(p, o) {
  o = o || {};
  const a = p.author, menu = p.mine ? `<button class="sc-ic" onclick="SOC.menu('${p.id}')" aria-label="${E(t('edit'))}">${ico('dots')}</button>` : (p.rby && p.rby.me ? `<button class="sc-ic" onclick="SOC.rpMenu('${p.id}')" aria-label="${E(t('rpMine'))}">${ico('dots')}</button>` : a.me ? '' : `<button class="sc-fl${a.following ? ' on' : ''}" data-fn="${E(a.nick)}" onclick="SOC.follow('${E(a.nick)}')">${E(a.following ? t('youFollow') : t('follow'))}</button>`);
  const chips = [p.style ? `<span class="sc-chip">${E(styleName(p.style))}</span>` : '', p.wx ? `<span class="sc-chip">${ico('cloud', 13)} ${E(wxTxt(p.wx))}</span>` : '', palDots(p)].filter(Boolean).join('');
  const fresh = !st.shown.has(p.id) && o.id !== 'preview'; st.shown.add(p.id);
  return `<article class="sp${fresh ? ' in' : ''}" data-pid="${p.id}"${fresh ? ` style="animation-delay:${Math.min(st.fxn++, 4) * 70}ms"` : ''}>
  ${p.rby ? `<button class="sp-rp" onclick="SOC.profile('${E(p.rby.nick)}')">${ico('repost', 15)} <b>${E(p.rby.me ? t('me') : p.rby.name || p.rby.nick)}</b> ${E(t('repostedBy'))}</button>` : ''}
  <header class="sp-h"><button class="sc-who" onclick="SOC.profile('${E(a.nick)}')">${av(a, 38)}<span><b>${E(a.name || a.nick)}${vb(a)}</b><small>@${E(a.nick)} · ${E(ago(p.ts))}</small></span></button>${menu}</header>
  <div class="sp-img" ondblclick="SOC.like('${p.id}',true)" onclick="${o.noOpen ? '' : `SOC.open('${p.id}')`}"><img src="${E(p.img)}" alt="${E(p.title || p.caption || '@' + a.nick)}" loading="lazy" decoding="async" onload="SOC.ovp(this)" onerror="this.closest('.sp-img').classList.add('bad')">${ovLayer(p.ov)}${p.vid ? `<button class="sc-play" onclick="event.stopPropagation();SOC.play('${p.id}')" aria-label="${E(t('play'))}">${ico('play', 26)}${p.vid.dur ? `<span>${E(fmtDur(p.vid.dur))}</span>` : ''}</button>` : ''}<i class="sc-pop">${ico('heart', 84)}</i></div>
  ${fitStrip(p)}
  <div class="sp-act">${actBar(p)}</div>
  ${p.title ? `<h3 class="sp-t" data-nt>${E(p.title)}</h3>` : ''}${p.caption ? `<p class="sp-c" data-nt>${E(p.caption)}</p>` : ''}
  ${chips ? `<div class="sp-chips">${chips}</div>` : ''}${itemsBlock(p, o.open)}
  </article>`;
}
const feedState = (f, kind) => {
  if (f.err && !f.posts.length) return stateBox('cloud', t('errLoad'), errText(f.err), `<button class="btn" onclick="SOC.reload('${kind}')">${E(t('retry'))}</button>`);
  if (f.loading && !f.posts.length) return skel(2);
  if (!f.posts.length) {
    if (kind === 'following') return stateBox('user', t('emptyFollowT'), t('emptyFollowD'), `<button class="btn" onclick="SOC.nav('discover')">${E(t('discover'))}</button>`);
    if (kind === 'trending') return stateBox('star', t('emptyTrendT'), t('emptyTrendD'));
    if (kind === 'saved') return stateBox('mark', t('emptySavedT'), t('emptySavedD'));
    return stateBox('drip', t('emptyFeedT'), t('emptyFeedD'), `<button class="btn" onclick="SOC.compose()">${E(t('publish'))}</button>`);
  }
  return '';
};
const tail = (f, kind) => (f.next !== null && f.posts.length ? `<div id="sc-more" data-k="${kind}" class="sc-more">${f.err ? `<button class="btn g" onclick="SOC.more('${kind}')">${E(t('retry'))}</button>` : E(t('loading'))}</div>` : '');
const grid = (posts) => `<div class="sc-grid">${posts.map((p) => { const k = 'g' + p.id, f = !st.shown.has(k); st.shown.add(k); return `<button class="sc-gt${f ? ' in' : ''}" ${f ? `style="animation-delay:${Math.min(st.fxn++, 12) * 35}ms"` : ''} onclick="SOC.open('${p.id}')"><img src="${E(p.th)}" alt="${E(p.title || '@' + p.author.nick)}" loading="lazy" decoding="async">${p.vid ? `<i class="sc-gv">${ico('play', 16)}</i>` : ''}${p.rby ? `<i class="sc-gr">${ico('repost', 14)}</i>` : ''}</button>`; }).join('')}</div>`;

/* ------------------------------------------------------------------ views */
function topbar(title, o) {
  o = o || {};
  return `<div class="sc-top">${o.back ? `<button class="sc-ic" onclick="SOC.back()" aria-label="${E(t('back'))}">${ico('back')}</button>` : ''}${o.left || ''}<h2>${E(title)}</h2>${o.right || ''}</div>`;
}
function gateView() {
  const c = st.cfg, bg = { right: `<button class="sc-ic" onclick="SOC.settings()" aria-label="${E(t('settings'))}">${ico('menu')}</button>` };
  if (c === undefined) return topbar(NAME, bg) + skel(1);
  if (!c || !c.social) {
    return topbar(NAME, bg) + `<div class="sc-state"><div class="sc-sic">${ico('drip', 34)}</div><b>${E(t('gateTitle'))}</b><p>${E(c === null && !navigator.onLine ? t('gateOffline') : t('gateNoServer'))}</p></div>`;
  }
  return topbar(NAME, bg) + `<div class="sc-state"><div class="sc-sic">${ico('drip', 34)}</div><b>${E(t('gateTitle'))}</b><p>${E(t('gateSign'))}</p><div id="gbtn" class="gb" style="margin:14px auto 4px;min-height:44px;display:flex;justify-content:center"></div><small>${E(t('gateWhy'))}</small></div>`;
}
function feedView() {
  const f = st.feed[st.tab];
  const tabs = ['foryou', 'following', 'trending'].map((k) => `<button class="sc-tab${st.tab === k ? ' on' : ''}" onclick="SOC.tab('${k}')">${E(t(k))}</button>`).join('');
  const bell = `<button class="sc-ic" onclick="SOC.nav('notifs')" aria-label="${E(t('notifs'))}">${ico('bell')}${st.unread ? `<i class="sc-badge">${st.unread > 9 ? '9+' : st.unread}</i>` : ''}</button>`;
  const me = st.me && st.me.profile;
  const right = `<button class="sc-pub" onclick="SOC.compose()">${E(t('publish'))}</button>`;
  return `<div class="sc-top"><h2>${NAME}</h2>${right}</div>
  ${tray()}<div class="sc-bar"><div class="sc-tabs">${tabs}</div><div class="sc-icons"><button class="sc-ic" onclick="SOC.nav('discover')" aria-label="${E(t('discover'))}">${ico('search')}</button>${bell}<button class="sc-ic me" onclick="SOC.profile('${me ? E(me.nick) : ''}')" aria-label="${E(t('me'))}">${me ? av(me, 30) : ico('user')}</button></div></div>
  ${feedState(f, st.tab)}${f.posts.map((p) => card(st.byId.get(p.id) || p)).join('')}${tail(f, st.tab)}`;
}
function profTags(p, isMe) {
  const f = p.fst || [], b = p.brands || [], e = p.earn && p.earn !== 'hidden' ? p.earn : '';
  if (!f.length && !b.length && !e) return '';
  const row = (lbl, list, cls) => (list.length ? `<div class="sc-ptr"><small>${E(lbl)}</small>${list.map((x) => `<span class="sc-chip ${cls || ''}" data-nt>${E(x)}</span>`).join('')}</div>` : '');
  const earn = e ? `<div class="sc-ptr"><small>${E(t('earnT'))}</small><span class="sc-chip earn" data-nt>${E(t('earn_' + e))}</span>${isMe && !p.earnPub ? `<em class="sc-priv">${E(L() === T.en ? 'only you' : L() === T.uk ? 'бачите лише ви' : 'видите только вы')}</em>` : ''}</div>` : '';
  return `<div class="sc-ptags">${row(t('styleLbl'), f)}${row(t('brandLbl'), b, 'br')}${earn}</div>`;
}
// last activity of another user: ONLY for the privileged account; the server answers 404 to everybody else
function actLine(d, p, isMe) {
  if (isMe || !window.CHAT || !CHAT.isAdmin || !CHAT.isAdmin()) return '';
  if (d.act === undefined && !d.actBusy) {
    d.actBusy = true;
    fetch('/api/dm?a=activity&nick=' + encodeURIComponent(p.nick), { credentials: 'same-origin', headers: { 'X-Requested-With': 'wd', 'X-Tz': String(new Date().getTimezoneOffset()) } })
      .then((r) => (r.ok ? r.json() : null)).then((j) => { d.act = j && j.pres ? j.pres : null; d.actBusy = false; if (st.nick === p.nick) refresh(); }).catch(() => { d.actBusy = false; });
  }
  if (d.act === undefined) return '';
  const x = d.act ? CHAT.presText(d.act, p) : { on: false, tx: t('actNever') };
  return `<div class="sc-act${x.on ? ' on' : ''}"><small>${E(t('actLbl'))}</small> <b>${E(x.tx)}</b></div>`;
}
function profileView() {
  const nick = st.nick, d = st.prof[nick];
  if (!d || (d.loading && !d.profile)) return topbar('@' + (nick || ''), { back: st.stack.length > 0 }) + skel(1);
  if (d.err && !d.profile) return topbar('@' + nick, { back: true }) + stateBox('user', t('errLoad'), errText(d.err), `<button class="btn" onclick="SOC.profile('${E(nick)}',true)">${E(t('retry'))}</button>`);
  const p = d.profile, isMe = p.me;
  const btn = isMe ? '' : `<div class="sc-pb2"><button class="btn${p.isFollowing ? ' g' : ''}" data-fn="${E(p.nick)}" onclick="SOC.follow('${E(p.nick)}')">${E(p.isFollowing ? t('unfollow') : t('follow'))}</button><button class="btn g" onclick="CHAT.openWith('${E(p.nick)}')">${ico('chat', 17)} ${E(CHAT_T[(window.I18N && I18N.lang) || 'ru'] || CHAT_T.ru)}</button></div>`;
  const tabs = isMe ? `<div class="sc-tabs two"><button class="sc-tab${st.ptab === 'posts' ? ' on' : ''}" onclick="SOC.ptab('posts')">${E(t('posts'))}</button><button class="sc-tab${st.ptab === 'saved' ? ' on' : ''}" onclick="SOC.ptab('saved')">${E(t('saved'))}</button></div>` : '';
  let body;
  if (isMe && st.ptab === 'saved') {
    body = feedState(st.saved, 'saved') || grid(st.saved.posts) + tail(st.saved, 'saved');
  } else {
    body = d.posts.length ? grid(d.posts) + tail(d, 'uposts') : (d.loading ? skel(1) : stateBox('drip', t('emptyPostsT'), isMe ? t('emptyFeedD') : '', isMe ? `<button class="btn" onclick="SOC.compose()">${E(t('publish'))}</button>` : ''));
  }
  return topbar('@' + p.nick, { back: st.stack.length > 0, left: isMe ? `<button class="sc-ic" onclick="SOC.settings()" aria-label="${E(t('settings'))}">${ico('menu')}</button>` : '', right: isMe ? `<button class="sc-ic" onclick="SOC.editProfile()" aria-label="${E(t('editProfile'))}">${ico('pen')}</button>` : '' }) + `<div class="sc-prof">${profAv(p, isMe)}<div class="sc-ps"><button onclick="SOC.follows('${E(p.nick)}','posts')"><b>${cnt(p.posts)}</b><small>${E(t('posts'))}</small></button><button onclick="SOC.follows('${E(p.nick)}','followers')"><b>${cnt(p.followers)}</b><small>${E(t('followers'))}</small></button><button onclick="SOC.follows('${E(p.nick)}','following')"><b>${cnt(p.following)}</b><small>${E(t('followingN'))}</small></button></div></div>
  <div class="sc-pn" data-nt><b>${E(p.name)}${vb(p)}</b>${p.bio ? `<p>${E(p.bio)}</p>` : ''}</div>${profTags(p, isMe)}${actLine(d, p, isMe)}${btn ? `<div class="sc-pbtn">${btn}</div>` : ''}${tabs}${body}`;
}
function profAv(p, isMe) {
  const gs = st.stories.groups || [], gi = gs.findIndex((g) => g.author.nick === p.nick), has = gi >= 0;
  if (!isMe && !has) return av(p, 78);
  const click = has ? `SOC.storyOpen(${gi})` : (isMe ? 'SOC.storyCompose()' : '');
  const seen = has && !isMe && gs[gi].allSeen;
  return `<span class="sc-pav${has ? ' ring' : ''}${seen ? ' seen' : ''}"><button type="button" class="sc-pavb" ${click ? `onclick="${click}"` : ''} aria-label="${E(t('story'))}">${av(p, 78)}</button>${isMe ? `<button type="button" class="sc-plus lg" onclick="SOC.storyCompose()" aria-label="${E(t('addStory'))}"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13"/></svg></button>` : ''}</span>`;
}
function postView() {
  const p = st.post && st.byId.get(st.post);
  if (!p) return topbar(NAME, { back: true }) + (st.postErr ? stateBox('drip', t('gone'), '', `<button class="btn" onclick="SOC.back()">${E(t('back'))}</button>`) : skel(1));
  return topbar(t('posts'), { back: true }) + card(p, { open: true, noOpen: true });
}
function notifsView() {
  const n = st.notifs;
  let body;
  if (n.err && !n.list) body = stateBox('bell', t('errLoad'), errText(n.err), `<button class="btn" onclick="SOC.nav('notifs',true)">${E(t('retry'))}</button>`);
  else if (!n.list) body = skel(2);
  else if (!n.list.length) body = stateBox('bell', t('emptyNotifT'), t('emptyNotifD'));
  else body = '<div class="sc-nl">' + n.list.map((x, i) => {
    const head = x.type === 'like' ? t('newLike') : x.type === 'comment' ? t('newComment') : x.type === 'repost' ? t('newRepost') : t('newFollower');
    const what = x.type === 'like' ? t('nLike') : x.type === 'comment' ? t('nComment') + (x.text ? ': «' + x.text + '»' : '') : x.type === 'repost' ? t('nRepost') : t('nFollow');
    const go_ = x.post ? `SOC.open('${x.post}')` : `SOC.profile('${E(x.actor.nick)}')`;
    return `<button class="sc-n in${x.unread ? ' un' : ''}" style="animation-delay:${Math.min(i, 8) * 45}ms" onclick="${go_}">${av(x.actor, 40)}<span><b>${E(head)}</b><small>@${E(x.actor.nick)} ${E(what)}</small><i>${E(ago(x.ts))}</i></span>${x.post ? `<img class="sc-nt" src="/api/social?a=img&id=${E(x.post)}&s=th" alt="" loading="lazy">` : ''}</button>`;
  }).join('') + '</div>';
  return topbar(t('notifs'), { back: true }) + body;
}
function userRow(u) {
  return `<div class="sc-ur in"><button class="sc-who" onclick="SOC.profile('${E(u.nick)}')">${av(u, 42)}<span><b>${E(u.name || u.nick)}${vb(u)}</b><small>@${E(u.nick)}${u.bio ? ' · ' + E(u.bio.slice(0, 40)) : ''}</small></span></button>${u.me ? '' : `<button class="sc-fl${u.isFollowing ? ' on' : ''}" data-fn="${E(u.nick)}" onclick="SOC.follow('${E(u.nick)}')">${E(u.isFollowing ? t('youFollow') : t('follow'))}</button>`}</div>`;
}
function discoverView() {
  const d = st.disc;
  const box = `<div class="sc-sb">${ico('search', 18)}<input id="sc-q" type="search" inputmode="search" autocomplete="off" autocapitalize="off" value="${E(d.q)}" placeholder="${E(t('typeToSearch'))}" oninput="SOC.q(this.value)"></div>`;
  let body;
  if (d.q && d.q.trim().length >= 2) {
    const r = d.res;
    if (d.searching && !r) body = skel(1);
    else if (!r) body = '';
    else if (!r.users.length && !r.posts.length) body = stateBox('search', t('emptySearch'));
    else body = (r.users.length ? `<h4 class="sc-h">${E(t('users'))}</h4>${r.users.map(userRow).join('')}` : '') + (r.posts.length ? `<h4 class="sc-h">${E(t('postsRes'))}</h4>${grid(r.posts)}` : '');
  } else if (d.err && !d.data) body = stateBox('cloud', t('errLoad'), errText(d.err), `<button class="btn" onclick="SOC.nav('discover',true)">${E(t('retry'))}</button>`);
  else if (!d.data) body = skel(1);
  else {
    const x = d.data;
    body = (x.trending.length ? `<h4 class="sc-h">${E(t('trendingNow'))}</h4>${grid(x.trending)}` : '')
      + x.sections.map((s) => `<h4 class="sc-h">${E(t('inStyle'))} ${E(styleName(s.style))}</h4>${grid(s.posts)}`).join('')
      + (x.authors.length ? `<h4 class="sc-h">${E(t('authors'))}</h4>${x.authors.map(userRow).join('')}` : '')
      + (!x.trending.length && !x.sections.length && !x.authors.length ? stateBox('drip', t('emptyFeedT'), t('emptyFeedD'), `<button class="btn" onclick="SOC.compose()">${E(t('publish'))}</button>`) : '');
  }
  return topbar(t('discover'), { back: true }) + box + body;
}
function view() {
  st.fxn = 0;
  const vin = st.vfx; st.vfx = 0;
  if (st.cfg === undefined || !S.user || !st.cfg || !st.cfg.social) return gateView();
  if (st.me === undefined) return st.meErr ? topbar(NAME) + stateBox('cloud', t('errLoad'), errText(st.meErr), `<button class="btn" onclick="SOC.reloadMe()">${E(t('retry'))}</button>`) : topbar(NAME) + skel(2);
  if (!st.me.profile) return topbar(NAME) + stateBox('user', t('setupT'), t('setupD'), `<button class="btn" onclick="SOC.setup()">${E(t('create'))}</button>`);
  const v = { feed: feedView, profile: profileView, post: postView, notifs: notifsView, discover: discoverView }[st.view] || feedView;
  return `<div class="sc${vin ? ' vin' : ''}">${v()}</div>`;
}

/* ------------------------------------------------------------------ loading data for the current view (called after every render of the tab) */
async function loadFeed(kind, reset) {
  const f = kind === 'saved' ? st.saved : st.feed[kind];
  if (f.loading) return;
  f.loading = true; f.err = null; if (reset) { f.next = 0; }
  if (!f.posts.length || reset) refresh();
  try {
    const j = kind === 'saved' ? await gq('a=saved&cursor=' + (reset ? 0 : f.next || 0)) : await gq('a=feed&tab=' + kind + '&cursor=' + (reset ? 0 : f.next || 0));
    remember(j.posts);
    f.posts = reset ? j.posts : f.posts.concat(j.posts.filter((p) => !f.posts.some((q) => q.id === p.id)));
    f.next = j.next; f.nofollow = !!j.nofollow; f.loaded = true; f.at = Date.now();
  } catch (e) { f.err = e; handleAuthErr(e); }
  f.loading = false; refresh();
}
async function loadProf(nick, more) {
  const d = st.prof[nick] || (st.prof[nick] = { profile: null, posts: [], next: 0, loading: false, err: null });
  if (d.loading) return;
  d.loading = true; d.err = null; refresh();
  try {
    if (!d.profile || !more) {
      const j = await gq('a=user&nick=' + encodeURIComponent(nick)); remember(j.posts);
      d.profile = j.profile; d.posts = j.posts; d.next = j.next;
    } else {
      const j = await gq('a=uposts&nick=' + encodeURIComponent(nick) + '&cursor=' + d.next); remember(j.posts);
      d.posts = d.posts.concat(j.posts.filter((p) => !d.posts.some((q) => q.id === p.id))); d.next = j.next;
    }
  } catch (e) { d.err = e; handleAuthErr(e); }
  d.loading = false; refresh();
}
async function loadDisc() {
  const d = st.disc; if (d.loading) return; d.loading = true; d.err = null; refresh();
  try { const j = await gq('a=discover'); remember(j.trending); j.sections.forEach((s) => remember(s.posts)); d.data = j; } catch (e) { d.err = e; handleAuthErr(e); }
  d.loading = false; refresh();
}
async function loadNotifs() {
  const n = st.notifs; if (n.loading) return; n.loading = true; n.err = null;
  try { const j = await gq('a=notifs'); n.list = j.notifs; setTimeout(async () => { try { await pq('notifSeen'); st.unread = 0; } catch (e) { /* ignore */ } }, 1200); } catch (e) { n.err = e; handleAuthErr(e); }
  n.loading = false; refresh();
}
let sObs = null;
function after() { // runs after render() while the social tab is visible
  if (!st.cfg && st.cfg !== null) { loadCfg().then(refresh); }
  if (st.cfg && st.cfg.social && !S.user) { const g = document.getElementById('gbtn'); if (g && typeof afterSettings === 'function') afterSettings(); }
  if (!(st.cfg && st.cfg.social && S.user)) return;
  if (st.me === undefined) { loadMe(); return; }
  if (!st.me.profile) { openSetup(); return; }
  if (st.view === 'feed') {
    if (!st.stories.loading && (st.stories.groups === null || Date.now() - st.stories.at > 90000) && !st.stories.err) loadStories();
    const f = st.feed[st.tab];
    if (!f.loaded && !f.loading && !f.err) loadFeed(st.tab, true);
    else if (f.loaded && !f.loading && Date.now() - f.at > 180000 && !st.autoAt) { st.autoAt = 1; setTimeout(() => { st.autoAt = 0; }, 60000); loadFeed(st.tab, true); }
  } else if (st.view === 'profile') {
    if (!st.stories.loading && st.stories.groups === null && !st.stories.err) loadStories();
    const d = st.prof[st.nick]; if (!d) loadProf(st.nick);
    if (st.prof[st.nick] && st.prof[st.nick].profile && st.prof[st.nick].profile.me && st.ptab === 'saved' && !st.saved.loaded && !st.saved.loading && !st.saved.err) loadFeed('saved', true);
  } else if (st.view === 'notifs') { if (!st.notifs.list && !st.notifs.loading && !st.notifs.err) loadNotifs(); }
  else if (st.view === 'discover') { if (!st.disc.data && !st.disc.loading && !st.disc.err) loadDisc(); }
  else if (st.view === 'post' && st.post && !st.byId.get(st.post) && !st.postErr && !st.postLoading) { st.postLoading = true; gq('a=post&id=' + encodeURIComponent(st.post)).then((j) => { remember([j.post]); }).catch(() => { st.postErr = 1; }).finally(() => { st.postLoading = false; refresh(); }); }
  // infinite scroll
  if (sObs) { sObs.disconnect(); sObs = null; }
  const m = document.getElementById('sc-more');
  if (m && 'IntersectionObserver' in window) { sObs = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { sObs.disconnect(); more(m.dataset.k); } }, { rootMargin: '700px' }); sObs.observe(m); }
  if (st.view === 'discover' && !st.discFocus) { st.discFocus = 1; }
  // deep link ?post=<id>
  if (st.deep) { const id = st.deep; st.deep = null; open(id); }
}
function more(kind) {
  if (kind === 'uposts') { const d = st.prof[st.nick]; if (d && d.next !== null && !d.loading) loadProf(st.nick, true); return; }
  const f = kind === 'saved' ? st.saved : st.feed[kind];
  if (f && f.next !== null && !f.loading) loadFeed(kind, false);
}

/* ------------------------------------------------------------------ navigation */
function push() { st.stack.push({ view: st.view, tab: st.tab, nick: st.nick, post: st.post, y: window.scrollY }); }
function openSettings() { go('settings'); }
function nav(v, force) {
  if (v === 'notifs') { if (force) st.notifs = { list: null, loading: false, err: null }; else if (st.notifs.list && Date.now() - (st.notifs.at || 0) > 30000) st.notifs.list = null; st.notifs.at = Date.now(); }
  if (v === 'discover' && force) st.disc = { ...st.disc, data: null, err: null };
  push(); st.view = v; st.vfx = 1; refresh(); scrollTo(0, 0);
}
function back() {
  const s = st.stack.pop();
  if (!s) { st.view = 'feed'; refresh(); return; }
  st.view = s.view; st.tab = s.tab; st.nick = s.nick; st.post = s.post; st.postErr = 0; st.vfx = 1; refresh(); requestAnimationFrame(() => scrollTo(0, s.y || 0));
}
function profile(nick, force) {
  if (!nick) return;
  if (force) delete st.prof[nick];
  if (!(st.view === 'profile' && st.nick === nick)) push();
  st.view = 'profile'; st.nick = nick; st.ptab = 'posts'; st.vfx = 1; refresh(); scrollTo(0, 0);
}
function open(id) { if (!id) return; push(); st.view = 'post'; st.post = id; st.postErr = 0; st.vfx = 1; refresh(); scrollTo(0, 0); }
function tab(k) { st.tab = k; st.shown.clear(); st.fxn = 0; st.vfx = 0; refresh(); scrollTo(0, 0); }
function ptab(k) { st.ptab = k; refresh(); }
function reload(kind) { const f = kind === 'saved' ? st.saved : st.feed[kind]; f.err = null; loadFeed(kind, true); }

/* ------------------------------------------------------------------ reactions (optimistic, rolled back on error) */
function patchPost(p) {
  document.querySelectorAll(`[data-pid="${p.id}"] .sp-act`).forEach((e) => { e.innerHTML = actBar(p); });
}
function burst(id, op) {
  document.querySelectorAll(`[data-pid="${id}"] .sc-b${op === 'save' ? '.sv' : ':first-child'}`).forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
}
async function react(id, op, on) {
  const p = st.byId.get(id); if (!p) return;
  const prev = { liked: p.liked, likes: p.likes, saved: p.saved, saves: p.saves };
  if (op === 'like') { if (p.liked === on) return; p.liked = on; p.likes = Math.max(0, p.likes + (on ? 1 : -1)); } else { if (p.saved === on) return; p.saved = on; p.saves = Math.max(0, p.saves + (on ? 1 : -1)); }
  patchPost(p); burst(id, op);
  try {
    const j = await pq(op, { id, on });
    p.likes = j.likes; p.saves = j.saves; p.comments = j.comments; patchPost(p);
    if (op === 'save') { st.saved.loaded = false; if (!on) st.saved.posts = st.saved.posts.filter((x) => x.id !== id); }
  } catch (e) { Object.assign(p, prev); patchPost(p); note(e); }
}
function like(id, dbl) {
  const p = st.byId.get(id); if (!p) return;
  if (dbl) { const el = document.querySelector(`[data-pid="${id}"] .sp-img`); if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } if (!p.liked) react(id, 'like', true); return; }
  react(id, 'like', !p.liked);
}
function drop(id, rbyMe) { // remove a post (or only my repost of it) from every cached list
  const keep = (x) => !(x.id === id && (!rbyMe || (x.rby && x.rby.me)));
  Object.values(st.feed).concat([st.saved]).forEach((f) => { f.posts = f.posts.filter(keep); });
  Object.values(st.prof).forEach((d) => { const n = d.posts.length; d.posts = d.posts.filter(keep); if (d.profile && d.profile.me && d.posts.length < n) d.profile.posts = Math.max(0, d.profile.posts - (n - d.posts.length)); });
}
async function repost(id) {
  const p = st.byId.get(id); if (!p || p.mine) return;
  const on = !p.reposted, prev = { reposts: p.reposts, reposted: p.reposted };
  p.reposted = on; p.reposts = Math.max(0, (p.reposts || 0) + (on ? 1 : -1)); patchPost(p);
  try {
    const j = await pq(on ? 'repost' : 'unrepost', { id }); p.reposts = j.reposts; p.reposted = j.reposted; patchPost(p);
    const me = st.me && st.me.profile; if (on) { if (me && st.prof[me.nick]) delete st.prof[me.nick]; } else drop(id, true);
    toast(t(on ? 'rpOn' : 'rpOff')); if (!on && st.view !== 'post') refresh();
  } catch (e) { Object.assign(p, prev); patchPost(p); note(e); }
}
function rpMenu(id) {
  const m = sheet(`${sheetHead(t('rpMine'))}<div class="sc-menu"><button class="btn g" id="sc-rd" style="color:#ff6b6b">${E(t('rpDel'))}</button></div>`);
  m.querySelector('#sc-rd').onclick = async () => {
    if (!confirm(t('rpDelQ'))) return;
    try { const j = await pq('unrepost', { id }); closeM(m); const p = st.byId.get(id); if (p) { p.reposts = j.reposts; p.reposted = false; } drop(id, true); toast(t('rpOff')); if (st.view === 'post') back(); else refresh(); } catch (e) { note(e); }
  };
}
function play(id) { // video posts: the poster turns into the player
  const p = st.byId.get(id), box = document.querySelector(`[data-pid="${id}"] .sp-img`); if (!p || !p.vid || !box) return;
  box.onclick = null; box.ondblclick = null; box.classList.add('vp');
  box.innerHTML = `<video src="${E(p.vid.url)}" poster="${E(p.img)}" controls playsinline autoplay preload="auto"></video>`;
  const v = box.querySelector('video'); v.onerror = () => { box.classList.add('bad'); toast(t('videoErr')); }; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {});
}
const save = (id) => { const p = st.byId.get(id); if (p) react(id, 'save', !p.saved); };
async function follow(nick) {
    let isF = false;
  for (const p of st.byId.values()) if (p.author.nick === nick) { isF = p.author.following; break; }
  const d = st.prof[nick]; if (d && d.profile) isF = !!d.profile.isFollowing;
  const on = !isF;
  const set = (v) => { st.byId.forEach((p) => { if (p.author.nick === nick) p.author.following = v; }); if (st.prof[nick] && st.prof[nick].profile) st.prof[nick].profile.isFollowing = v; if (st.disc.res) st.disc.res.users.forEach((u) => { if (u.nick === nick) u.isFollowing = v; }); if (st.disc.data) st.disc.data.authors.forEach((u) => { if (u.nick === nick) u.isFollowing = v; }); };
  set(on); refresh();
  try {
    const j = await pq('follow', { nick, on });
    if (st.prof[nick] && st.prof[nick].profile) st.prof[nick].profile.followers = j.followers;
    if (st.me && st.me.profile) { st.me.profile.following = j.myFollowing; if (st.prof[myNick()] && st.prof[myNick()].profile) st.prof[myNick()].profile.following = j.myFollowing; }
    st.feed.following.loaded = false; refresh();
  } catch (e) { set(isF); refresh(); note(e); }
}
async function share(id) {
  const url = location.origin + location.pathname.replace(/index\.html$/, '') + '?post=' + id, p = st.byId.get(id);
  const data = { title: NAME, text: (p && (p.title || p.caption) ? (p.title || p.caption).slice(0, 80) + ' — ' : '') + t('shareText') + (p ? ' · @' + p.author.nick : ''), url };
  try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast(t('copyLink')); } catch (e) {
    const ta = document.createElement('textarea'); ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(t('copyLink')); } catch (x) { prompt(url, url); } ta.remove();
  }
}
function toggleItems(id, btn) {
  const box = btn.nextElementSibling, o = !box.classList.contains('open'); box.classList.toggle('open', o); btn.setAttribute('aria-expanded', o);
}
let qT = null;
function q(v) {
  const d = st.disc; d.q = v;
  clearTimeout(qT);
  if (v.trim().length < 2) { d.res = null; d.searching = false; softDisc(); return; }
  d.searching = true;
  qT = setTimeout(async () => {
    const mine = v;
    try { const j = await gq('a=search&q=' + encodeURIComponent(mine.trim())); if (d.q !== mine) return; remember(j.posts); d.res = j; } catch (e) { if (d.q === mine) { d.res = { users: [], posts: [] }; note(e); } }
    d.searching = false; softDisc();
  }, 350);
}
function softDisc() { // re-render results without losing focus in the search box
  if (S.tab !== 'social' || st.view !== 'discover') return;
  const box = document.getElementById('sc-q'), val = box ? box.value : '', pos = box ? box.selectionStart : 0, had = box && document.activeElement === box;
  render();
  const nb = document.getElementById('sc-q'); if (nb && had) { nb.focus(); try { nb.setSelectionRange(pos, pos); } catch (e) { /* ignore */ } } void val;
}

/* ------------------------------------------------------------------ modals (reuse the app's sheet style) */
function sheet(html, cls) {
  document.querySelectorAll('.modal').forEach((x) => x.remove());
  const m = document.createElement('div'); m.className = 'modal sc-m'; m.id = 'md';
  m.onclick = (ev) => { if (ev.target === m) closeM(m); };
  m.innerHTML = `<div class="sheet sc-sheet ${cls || ''}">${html}</div>`;
  document.body.appendChild(m); return m;
}
const closeSheet = () => { const m = document.getElementById('md'); if (m) closeM(m); };
const sheetHead = (title, extra) => `<div class="sc-sh"><b>${E(title)}</b>${extra || ''}<button class="sc-ic" onclick="SOC.closeSheet()" aria-label="${E(t('close'))}">${ico('x')}</button></div>`;

/* ---- profile setup / edit ---- */
function setup() { openSetup(true); }
function openSetup(force) {
  if (!force && st.setupShown) return; st.setupShown = true;
  const sg = (st.me && st.me.suggest) || '', nm = (st.me && st.me.name) || (S.user && S.user.name) || '';
  const m = sheet(`${sheetHead(t('setupT'))}<p class="note" style="margin:0 0 4px">${E(t('setupD'))}</p>
   <label>${E(t('nick'))}</label><input id="sc-nick" value="${E(sg)}" maxlength="20" autocapitalize="off" autocomplete="off" spellcheck="false"><small class="sc-hint">${E(t('nickHint'))}</small>
   <label>${E(t('name'))}</label><input id="sc-name" value="${E(nm)}" maxlength="40">
   <label>${E(t('bio'))}</label><textarea id="sc-bio" maxlength="160" rows="2"></textarea>
   <div class="sc-err" id="sc-e"></div><div class="row"><button class="btn big" id="sc-go" style="width:100%">${E(t('create'))}</button></div>`);
  m.querySelector('#sc-go').onclick = async (ev) => {
    const b = ev.currentTarget, e = m.querySelector('#sc-e'); b.disabled = true; e.textContent = '';
    try {
      const j = await pq('profile', { nick: m.querySelector('#sc-nick').value.trim().toLowerCase(), name: m.querySelector('#sc-name').value, bio: m.querySelector('#sc-bio').value });
      void j; closeM(m); st.me = undefined; st.setupShown = false; await loadMe(true);
    } catch (x) { e.textContent = errText(x); b.disabled = false; }
  };
}
function editProfile() {
  const p = st.me && st.me.profile; if (!p) return;
  let newAv = null, reset = false;
  const m = sheet(`${sheetHead(t('editProfile'))}
   <div class="sc-avrow"><div id="sc-avp">${av(p, 78)}</div><div class="sc-avb"><button type="button" class="btn g" id="sc-avc">${ico('img', 17)} ${E(t('avChange'))}</button><button type="button" class="btn g" id="sc-avr">${E(t('avReset'))}</button></div><input type="file" id="sc-avf" accept="image/*" hidden></div>
   <label>${E(t('nick'))}</label><input id="sc-nick" value="${E(p.nick)}" maxlength="20" autocapitalize="off" autocomplete="off" spellcheck="false"><small class="sc-hint">${E(t('nickHint'))}</small>
   <label>${E(t('name'))}</label><input id="sc-name" value="${E(p.name)}" maxlength="40">
   <label>${E(t('bio'))}</label><textarea id="sc-bio" maxlength="160" rows="3">${E(p.bio || '')}</textarea>
   <label>${E(t('myStyle'))} <small class="sc-hint" style="display:inline">· ${E(t('myStyleD'))}</small></label><div class="sc-chips" id="sc-fst"></div>
   <div class="sc-addrow" id="sc-fcr" hidden><input id="sc-fci" maxlength="24" placeholder="${E(t('otherStylePh'))}" autocomplete="off"><button type="button" class="btn g" id="sc-fca">${E(t('add'))}</button></div>
   <label>${E(t('earnT'))}</label><select id="sc-earn"><option value="">${E(t('earnNone'))}</option>${EARN.map((k) => `<option value="${k}"${p.earn === k ? ' selected' : ''}>${E(t('earn_' + k))}</option>`).join('')}</select>
   <label class="sc-chk" id="sc-epl"><input type="checkbox" id="sc-epub"${p.earnPub ? ' checked' : ''}> <span>${E(t('earnPub'))}</span></label><small class="sc-hint">${E(t('earnD'))}</small>
   <label>${E(t('brandsT'))}</label><div class="sc-chips" id="sc-brs"></div>
   <div class="sc-addrow"><input id="sc-bri" maxlength="32" placeholder="${E(t('brandPh'))}" autocomplete="off"><button type="button" class="btn g" id="sc-bra">${E(t('add'))}</button></div><div class="sc-chips sugg" id="sc-brsug"></div>
   <div class="sc-err" id="sc-e"></div><div class="row"><button class="btn big" id="sc-go" style="width:100%">${E(t('save'))}</button></div>`);
  // --- styles / brands editors (state lives in these arrays; saved only with the button)
  let fst = [...(p.fst || [])], brs = [...(p.brands || [])];
  const has = (a, v) => a.some((x) => x.toLowerCase() === v.toLowerCase());
  const paintF = () => {
    const custom = fst.filter((x) => !has(FSTY, x));
    m.querySelector('#sc-fst').innerHTML = FSTY.map((x) => `<button type="button" class="sc-chip pick${has(fst, x) ? ' on' : ''}" data-s="${E(x)}">${E(x)}</button>`).join('') + custom.map((x) => `<span class="sc-chip pick on rm" data-nt>${E(x)} <button type="button" data-rf="${E(x)}" aria-label="×">×</button></span>`).join('') + `<button type="button" class="sc-chip pick" id="sc-fo">+ ${E(t('otherStyle'))}</button>`;
  };
  const paintB = () => {
    m.querySelector('#sc-brs').innerHTML = brs.map((x) => `<span class="sc-chip pick on rm" data-nt>${E(x)} <button type="button" data-rb="${E(x)}" aria-label="×">×</button></span>`).join('');
    m.querySelector('#sc-brsug').innerHTML = BRANDS.filter((x) => !has(brs, x)).slice(0, 12).map((x) => `<button type="button" class="sc-chip pick" data-ab="${E(x)}">+ ${E(x)}</button>`).join('');
  };
  const addBrand = (v) => { v = String(v || '').replace(/\s+/g, ' ').trim().slice(0, 32); if (!v || has(brs, v) || brs.length >= 20) return; brs.push(v); paintB(); };
  m.querySelector('#sc-fst').onclick = (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.id === 'sc-fo') { const r = m.querySelector('#sc-fcr'); r.hidden = !r.hidden; if (!r.hidden) m.querySelector('#sc-fci').focus(); return; }
    if (b.dataset.rf) { fst = fst.filter((x) => x !== b.dataset.rf); paintF(); return; }
    const v = b.dataset.s; if (!v) return; if (has(fst, v)) fst = fst.filter((x) => x.toLowerCase() !== v.toLowerCase()); else if (fst.length < 12) fst.push(v); paintF();
  };
  const addF = () => { const i = m.querySelector('#sc-fci'), v = i.value.replace(/\s+/g, ' ').trim().slice(0, 24); if (v && !has(fst, v) && fst.length < 12) { fst.push(v); paintF(); } i.value = ''; };
  m.querySelector('#sc-fca').onclick = addF; m.querySelector('#sc-fci').onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); addF(); } };
  m.querySelector('#sc-brs').onclick = (ev) => { const b = ev.target.closest('button[data-rb]'); if (b) { brs = brs.filter((x) => x !== b.dataset.rb); paintB(); } };
  m.querySelector('#sc-brsug').onclick = (ev) => { const b = ev.target.closest('button[data-ab]'); if (b) addBrand(b.dataset.ab); };
  m.querySelector('#sc-bra').onclick = () => { const i = m.querySelector('#sc-bri'); addBrand(i.value); i.value = ''; };
  m.querySelector('#sc-bri').onkeydown = (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); addBrand(ev.target.value); ev.target.value = ''; } };
  const earnSel = m.querySelector('#sc-earn'), syncE = () => { m.querySelector('#sc-epl').style.display = earnSel.value && earnSel.value !== 'hidden' ? '' : 'none'; };
  earnSel.onchange = syncE; syncE(); paintF(); paintB();
  const showAv = (u) => { m.querySelector('#sc-avp').innerHTML = u ? `<img class="sc-av" style="width:78px;height:78px" src="${u}" alt="">` : av({ name: m.querySelector('#sc-name').value, nick: p.nick }, 78); };
  m.querySelector('#sc-avc').onclick = () => m.querySelector('#sc-avf').click();
  m.querySelector('#sc-avf').onchange = async (ev) => {
    const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return;
    const e = m.querySelector('#sc-e'); e.textContent = '';
    try {
      // square centre crop 256px, WebP/JPEG, <= 55 KB
      const src = await fileToUrl(f), im = await loadImg(src), sz = Math.min(im.width, im.height), c = document.createElement('canvas');
      c.width = c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256);
      x.drawImage(im, (im.width - sz) / 2, (im.height - sz) / 2, sz, sz, 0, 0, 256, 256);
      let u = '', q = .85;
      for (let i = 0; i < 6; i++) { u = c.toDataURL('image/webp', q); if (!u.startsWith('data:image/webp')) u = c.toDataURL('image/jpeg', q); if (dataBytes(u) <= 55 * 1024) break; q -= .12; }
      if (dataBytes(u) > 58 * 1024) throw new Error('big');
      newAv = u; reset = false; showAv(u);
    } catch (x) { e.textContent = t('errImg'); }
  };
  m.querySelector('#sc-avr').onclick = () => { newAv = null; reset = true; showAv(null); };
  m.querySelector('#sc-go').onclick = async (ev) => {
    const b = ev.currentTarget, e = m.querySelector('#sc-e'); b.disabled = true; e.textContent = '';
    const old = p.nick;
    try {
      const body = { nick: m.querySelector('#sc-nick').value.trim().toLowerCase(), name: m.querySelector('#sc-name').value, bio: m.querySelector('#sc-bio').value, fstyles: fst, brands: brs, earn: earnSel.value, earnPub: earnSel.value && earnSel.value !== 'hidden' ? m.querySelector('#sc-epub').checked : false };
      b.textContent = t('saving'); if (newAv) body.avatar = newAv; else if (reset) body.resetAvatar = true;
      await pq('profile', body);
      closeM(m); delete st.prof[old]; st.me = undefined; st.feed = { foryou: mkFeed(), following: mkFeed(), trending: mkFeed() }; st.saved = mkFeed(); st.byId = new Map(); await loadMe(true);
      const np = st.me && st.me.profile ? st.me.profile.nick : old; st.nick = np; refresh();
    } catch (x) { e.textContent = errText(x); b.disabled = false; b.textContent = t('save'); }
  };
}

/* ---- followers / following lists ---- */
async function follows(nick, kind) {
  if (kind === 'posts') return;
  const m = sheet(`${sheetHead(t(kind === 'followers' ? 'followers' : 'followingN'))}<div id="sc-fl">${skel(1)}</div>`);
  try {
    const j = await gq('a=follows&nick=' + encodeURIComponent(nick) + '&kind=' + kind);
    m.querySelector('#sc-fl').innerHTML = j.users.length ? j.users.map(userRow).join('') : stateBox('user', t('emptySearch'));
    m.querySelectorAll('.sc-who').forEach((b) => { const o = b.getAttribute('onclick'); b.setAttribute('onclick', 'SOC.closeSheet();' + o); });
  } catch (e) { m.querySelector('#sc-fl').innerHTML = stateBox('cloud', t('errLoad'), errText(e)); }
}

/* ---- comments sheet ---- */
async function comments(id) {
  const p = st.byId.get(id); if (!p) return;
  const m = sheet(`${sheetHead(t('commentsT'))}<div id="sc-cl" class="sc-cl">${skel(1)}</div>
   <form class="sc-cf" id="sc-cf"><input id="sc-ci" maxlength="500" placeholder="${E(t('writeComment'))}" autocomplete="off"><button class="btn" id="sc-cs" type="submit">${E(t('send'))}</button></form>`, 'sc-cm');
  const list = m.querySelector('#sc-cl');
  const row = (c) => `<div class="sc-c${c._new ? ' new' : ''}" data-cid="${c.id}">${av(c.author, 34)}<div><b>${E(c.author.name || c.author.nick)}${vb(c.author)}</b> <small>@${E(c.author.nick)} · ${E(ago(c.ts))}</small><p data-nt>${E(c.text)}</p></div>${c.canDelete ? `<button class="sc-ic" data-del="${c.id}" aria-label="${E(t('del'))}">${ico('x', 16)}</button>` : ''}</div>`;
  const paint = (arr) => { list.innerHTML = arr.length ? arr.map(row).join('') : `<p class="note" style="text-align:center">${E(t('noComments'))}</p>`; list.scrollTop = list.scrollHeight; };
  let arr = [];
  try { arr = (await gq('a=comments&id=' + id)).comments; paint(arr); } catch (e) { list.innerHTML = stateBox('cloud', t('errLoad'), errText(e)); if (e.code === 'not_found') toast(t('gone')); }
  list.onclick = async (ev) => {
    const b = ev.target.closest('[data-del]'); if (!b) return;
    if (!confirm(t('delCommentQ'))) return;
    try { const j = await pq('delComment', { id, cid: b.dataset.del }); arr = arr.filter((c) => c.id !== b.dataset.del); paint(arr); p.comments = j.total; patchPost(p); } catch (e) { note(e); }
  };
  m.querySelector('#sc-cf').onsubmit = async (ev) => {
    ev.preventDefault(); const inp = m.querySelector('#sc-ci'), txt = inp.value.trim(); if (!txt) return;
    const btn = m.querySelector('#sc-cs'); btn.disabled = true;
    try { const j = await pq('comment', { id, text: txt }); j.comment._new = 1; arr.push(j.comment); paint(arr); inp.value = ''; p.comments = j.total; patchPost(p); } catch (e) { note(e); }
    btn.disabled = false;
  };
}

/* ---- post menu (edit / delete) ---- */
function menu(id) {
  const m = sheet(`${sheetHead(t('mine'))}<div class="sc-menu"><button class="btn g" id="sc-me">${E(t('edit'))}</button><button class="btn g" id="sc-md" style="color:#ff6b6b">${E(t('del'))}</button></div>`);
  m.querySelector('#sc-me').onclick = () => { closeM(m); setTimeout(() => compose({ edit: id }), 280); };
  m.querySelector('#sc-md').onclick = async () => {
    if (!confirm(t('delPostQ'))) return;
    try {
      await pq('delPost', { id }); closeM(m); st.byId.delete(id);
      Object.values(st.feed).concat([st.saved]).forEach((f) => { f.posts = f.posts.filter((x) => x.id !== id); });
      Object.values(st.prof).forEach((d) => { d.posts = d.posts.filter((x) => x.id !== id); if (d.profile && d.profile.me) d.profile.posts = Math.max(0, d.profile.posts - 1); });
      if (st.view === 'post') { back(); } else refresh();
      toast(t('deleted'));
    } catch (e) { note(e); }
  };
}

/* ---- "create similar": match the post's items against MY wardrobe, show it, apply only after confirmation ---- */
const FAMKEYS = { black: /black|чёрн|черн|чорн/i, white: /white|бел|біл/i, gray: /gr[ae]y|сер|сір/i, beige: /beige|беж|cream|крем/i, brown: /brown|корич/i, red: /\bred\b|красн|червон/i, burgundy: /burgund|бордо/i, pink: /pink|розов|рожев/i, orange: /orange|оранж|помаранч/i, yellow: /yellow|жёлт|желт|жовт/i, olive: /olive|олив|khaki|хаки/i, green: /green|зелен|зелён/i, teal: /teal|бирюз|бірюз/i, navy: /navy|тёмно-син|темно-син/i, denim: /denim|джинс/i, 'light blue': /light blue|голуб|блакит/i, blue: /\bblue\b|син/i, purple: /purple|violet|фиолет|фіолет/i };
const famOfText = (s) => { for (const [k, re] of Object.entries(FAMKEYS)) if (re.test(s || '')) return k; return ''; };
const root = (f) => (f || '').replace(/^(light|dark) /, '');
function matchItem(pi, used) {
  const cands = S.items.filter((i) => i.cat === pi.c && !used.has(i.id));
  if (!cands.length) return null;
  const want = pi.col || famOfText(pi.n), words = String(pi.n || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  let best = null, bs = -1;
  for (const i of cands) {
    let s = 0; const ci = colInfo(i), fam = ci && ci.fam;
    if (want && fam) { if (fam === want) s += 3; else if (root(fam) === root(want)) s += 2; }
    const nm = String(i.name || '').toLowerCase(); words.forEach((w) => { if (nm.includes(w)) s += .6; });
    if (s > bs) { bs = s; best = i; }
  }
  return best;
}
function similar(id) {
  const p = st.byId.get(id); if (!p) return;
  const its = (p.items || []).filter((i) => i.c);
  const used = new Set();
  const sel = its.map((pi) => { const m = matchItem(pi, used); if (m) used.add(m.id); return m ? m.id : null; });
  const paint = (m) => {
    const rows = its.map((pi, k) => {
      const own = S.items.filter((i) => i.cat === pi.c), cur = sel[k] && S.items.find((i) => i.id === sel[k]);
      const opts = `<option value="">— ${E(t('simSkip'))} —</option>` + own.map((i) => `<option value="${i.id}" ${i.id === sel[k] ? 'selected' : ''}>${E(i.name || i.cat)}</option>`).join('');
      return `<div class="sc-sr"><div class="sc-sl"><small>${E(trIt(pi.c))}</small><b>${E(trIt(pi.n))}</b>${pi.col ? `<small>${E(colName(pi.col))}</small>` : ''}</div><span class="sc-ar">→</span><div class="sc-sm">${cur ? `<img src="${cur.img}" alt="">` : `<span class="sc-no">${E(t('simNone'))}</span>`}${own.length ? `<select data-k="${k}">${opts}</select>` : ''}</div></div>`;
    }).join('');
    const any = sel.some(Boolean);
    m.querySelector('#sc-sb').innerHTML = its.length && S.items.length ? `<p class="note" style="margin:0 0 8px">${E(t('simD'))}</p>${rows}<div class="row"><button class="btn big" id="sc-ss" style="width:100%" ${any ? '' : 'disabled'}>${E(t('simSave'))}</button></div>` : stateBox('hang', t('simT'), t('simEmpty'));
    m.querySelectorAll('select[data-k]').forEach((s) => { s.onchange = () => { sel[+s.dataset.k] = s.value || null; paint(m); }; });
    const go_ = m.querySelector('#sc-ss'); if (go_) go_.onclick = async () => {
      const ids = sel.filter(Boolean); if (!ids.length) return;
      go_.disabled = true;
      try {
        const oid = 'o' + Date.now(), plan = ids.map((x) => S.items.find((i) => i.id === x)).filter(Boolean);
        const o = { id: oid, ids, label: (p.title || '@' + p.author.nick).slice(0, 60), min: p.wx && p.wx.tmin != null ? p.wx.tmin : null, max: p.wx && p.wx.tmax != null ? p.wx.tmax : null, date: dayKey(), at: Date.now(), ai: false };
        S.outfits.unshift(o); save();
        try { const src = await buildCollage(plan), url = await shrink(src, 720, .8); if (DB.db) { await imgPut(oid, url); S.oimg[oid] = url; } } catch (e) { /* collage is optional */ }
        closeM(m); toast(t('simSaved'));
      } catch (e) { go_.disabled = false; toast(t('errGeneric')); }
    };
  };
  const m = sheet(`${sheetHead(t('simT'))}<div id="sc-sb"></div>`);
  paint(m);
}

/* ---- composer ---- */
const DRAFT = () => (UID ? 'wd:u' + UID + ':sdraft' : 'wd:sdraft');
const loadDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT()) || 'null'); } catch (e) { return null; } };
const putDraft = (d) => { try { localStorage.setItem(DRAFT(), JSON.stringify(d)); return true; } catch (e) { return false; } };
const dropDraft = () => { try { localStorage.removeItem(DRAFT()); } catch (e) { /* ignore */ } };
function dataBytes(u) { return Math.round((u.length - u.indexOf(',') - 1) * 3 / 4); }
async function encodeImg(src, max, q, limit) { // longest side <= max, WebP when the browser can, JPEG otherwise; shrink quality until it fits
  const im = await loadImg(src), k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
  let u = '', qq = q;
  for (let i = 0; i < 6; i++) {
    u = c.toDataURL('image/webp', qq); if (!u.startsWith('data:image/webp')) u = c.toDataURL('image/jpeg', qq);
    if (dataBytes(u) <= limit) return u; qq -= .1; if (qq < .3) break;
  }
  if (dataBytes(u) > limit) { const s2 = Math.round(max * .75); return encodeImg(u, s2, .6, limit); }
  return u;
}
const fileToUrl = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
const MAXV = 14 * 1024 * 1024;
async function prepVid(file) { // first frame as the poster; the file itself goes up untouched in chunks
  if (file.size > MAXV) throw new Error('big');
  const mime = file.type && /^video\/(mp4|quicktime|webm)$/.test(file.type) ? file.type : /\.mov$/i.test(file.name) ? 'video/quicktime' : /\.webm$/i.test(file.name) ? 'video/webm' : 'video/mp4';
  const url = URL.createObjectURL(file), v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
  try {
    await new Promise((ok_, no) => { const to = setTimeout(() => no(new Error('timeout')), 12000); v.onloadedmetadata = () => { clearTimeout(to); ok_(); }; v.onerror = () => { clearTimeout(to); no(new Error('bad')); }; });
    const dur = v.duration || 0, w = v.videoWidth || 640, h = v.videoHeight || 360;
    try { v.currentTime = Math.min(1, dur / 3); await new Promise((ok_) => { const to = setTimeout(ok_, 4000); v.onseeked = () => { clearTimeout(to); ok_(); }; }); } catch (e) { /* first frame */ }
    const sc = Math.min(1, 1080 / Math.max(w, h)), cv = document.createElement('canvas'); cv.width = Math.max(2, Math.round(w * sc)); cv.height = Math.max(2, Math.round(h * sc));
    cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
    return { file, mime, poster: cv.toDataURL('image/jpeg', .82), dur, w, h, url: URL.createObjectURL(file) };
  } finally { URL.revokeObjectURL(url); v.removeAttribute('src'); v.load(); }
}
const b64Chunk = (blob) => new Promise((ok_, no) => { const r = new FileReader(); r.onload = () => ok_(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); });
function itemsFromPlan(plan) { return plan.filter((i) => i.cat !== 'Accessories' || true).map((i) => { const c = colInfo(i); return { n: String(i.name || '').slice(0, 60), c: i.cat, col: (c && c.fam) || '' }; }); }
function paletteFromPlan(plan) { const o = []; plan.forEach((i) => { const c = colInfo(i); if (c && c.hex && !o.includes(c.hex) && i.cat !== 'Accessories') o.push(c.hex); }); return o.slice(0, 6); }
function styleFromPlan(plan) { const sv = {}; plan.forEach((i) => { try { const tt = topStyle(i); if (tt) sv[tt[0]] = (sv[tt[0]] || 0) + tt[1]; } catch (e) { /* ignore */ } }); const top = Object.entries(sv).sort((a, b) => b[1] - a[1])[0]; const map = { streetwear: 'Streetwear', casual: 'Casual', minimalism: 'Minimalism', 'smart casual': 'Smart Casual', sporty: 'Sporty', 'old money': 'Old Money', grunge: 'Grunge' }; return top ? (map[top[0]] || '') : ''; }

function compose(o) {
  o = o || {};
  const edit = o.edit ? st.byId.get(o.edit) : null;
  let d = edit ? { id: edit.id, img: edit.img, title: edit.title, caption: edit.caption, style: edit.style, items: edit.items.map((i) => ({ ...i })), palette: edit.palette.slice(), wx: edit.wx ? { on: true, tmin: edit.wx.tmin, tmax: edit.wx.tmax, txt: edit.wx.txt } : { on: false, tmin: '', tmax: '', txt: '' }, edit: true }
    : { img: '', title: '', caption: '', style: '', items: [], palette: [], wx: { on: false, tmin: '', tmax: '', txt: '' }, edit: false };
  if (!edit) Object.assign(d, { base: '', edState: null, gifs: [], ov: [], fit: [], vid: null });
  let stage = 'form', busy = false, picker = null;
  const saved = !edit ? loadDraft() : null;
  const m = sheet('', 'sc-comp');
  const paint = () => {
    if (stage === 'preview') {
      const me = st.me.profile, pv = { id: 'preview', ts: Date.now(), title: d.title, caption: d.caption, style: d.style, items: d.items, palette: d.palette, wx: d.wx.on && (d.wx.tmin !== '' || d.wx.tmax !== '') ? { tmin: d.wx.tmin === '' ? null : +d.wx.tmin, tmax: d.wx.tmax === '' ? null : +d.wx.tmax } : null, author: { ...me, me: true, following: false }, likes: 0, comments: 0, saves: 0, liked: false, saved: false, mine: false, img: d.img, th: d.img, ov: (d.ov || []).map((x) => ({ ...x, u: x.u || d.gifs[x.g] })), fit: (d.fit || []).map((f) => ({ n: f.n, c: f.c, u: f.img })), vid: d.vid ? { url: d.vid.url, dur: d.vid.dur } : undefined };
      m.querySelector('.sheet').innerHTML = `${sheetHead(t('preview'))}<div class="sc-pvw">${card(pv, { noOpen: true, open: true })}</div><div class="row"><button class="btn g" id="sc-pb" style="flex:1">${E(t('back'))}</button><button class="btn" id="sc-pp" style="flex:1">${E(d.edit ? t('save') : t('publishNow'))}</button></div>`;
      m.querySelector('#sc-pb').onclick = () => { stage = 'form'; paint(); };
      m.querySelector('#sc-pp').onclick = publishNow; return;
    }
    const todayOk = (() => { try { const r = cur(); return !!(r && r.plan && r.plan.length && !r.demo && !r.sample); } catch (e) { return false; } })();
    const styleChips = STYLES.map((s) => `<button type="button" class="sc-chip pick${d.style === s ? ' on' : ''}" data-st="${s}">${E(styleName(s))}</button>`).join('');
    const itemChips = d.items.map((i, k) => `<span class="sc-chip rm">${E(trIt(i.n))}<button type="button" data-ri="${k}" aria-label="${E(t('del'))}">×</button></span>`).join('');
    const palChips = d.palette.map((c, k) => `<span class="sc-chip rm">${/^#/.test(c) ? `<i style="background:${E(c)}"></i>` : ''}${/^#/.test(c) ? '' : E(c)}<button type="button" data-rp="${k}" aria-label="${E(t('del'))}">×</button></span>`).join('');
    m.querySelector('.sheet').innerHTML = `${sheetHead(d.edit ? t('editPost') : t('newPost'))}
    ${saved && !d.edit && !d.img && !d.title && !d.caption ? `<div class="sc-draft"><span>${E(t('draftLoaded'))}</span><button class="sc-lnk" id="sc-du">${E(t('draftUse'))}</button><button class="sc-lnk" id="sc-dd">${E(t('draftDrop'))}</button></div>` : ''}
    ${d.edit ? `<div class="sc-pimg"><img src="${E(d.img)}" alt=""></div>` : `<label>${E(t('photo'))}</label>
    <div class="sc-pimg ${d.img ? '' : 'empty'}" id="sc-pi" style="position:relative">${d.img ? `<img src="${d.img}" alt="">${d.vid ? `<span class="sc-play" style="pointer-events:none">${ico('play', 26)}<span>${E(fmtDur(d.vid.dur))}</span></span>` : ''}` : `<span>${ico('img', 34)}<b>${E(t('pickPhoto'))}</b></span>`}</div>
    ${d.img && !d.vid ? `<div class="sc-edb"><button type="button" class="btn g" id="sc-ed">${ico('pen', 17)} ${E(t('editor'))}${(d.ov && d.ov.length) || (d.fit && d.fit.length) || d.edState ? ' ✓' : ''}</button></div>` : ''}
    <input type="file" id="sc-f1" accept="image/*" hidden><input type="file" id="sc-f2" accept="image/*" capture="environment" hidden><input type="file" id="sc-f3" accept="video/*" hidden>
    <div class="sc-src"><button type="button" class="btn g" id="sc-s1">${ico('img', 17)} ${E(t('pickPhoto'))}</button><button type="button" class="btn g" id="sc-s2">${ico('cam', 17)} ${E(t('camera'))}</button>
    <button type="button" class="btn g" id="sc-s3" ${todayOk ? '' : 'data-off="1"'}>${ico('star', 17)} ${E(t('fromToday'))}</button><button type="button" class="btn g" id="sc-s4">${ico('star', 17)} ${E(t('fromSaved'))}</button><button type="button" class="btn g" id="sc-s5">${ico('hang', 17)} ${E(t('fromWardrobe'))}</button><button type="button" class="btn g" id="sc-s6">${ico('play', 17)} ${E(t('video'))}</button></div>`}
    <div id="sc-pk"></div>
    <label>${E(t('title'))}</label><input id="sc-t" maxlength="80" value="${E(d.title)}">
    <label>${E(t('caption'))}</label><textarea id="sc-cp" maxlength="600" rows="3">${E(d.caption)}</textarea>
    <label>${E(t('pickStyle'))}</label><div class="sc-chips">${styleChips}</div>
    <label>${E(t('itemsT'))}</label><div class="sc-chips">${itemChips}</div>
    <div class="sc-add"><input id="sc-in" maxlength="60" placeholder="${E(t('itemName'))}"><button type="button" class="btn g" id="sc-ia">${E(t('addItem'))}</button>${S.items.length ? `<button type="button" class="btn g" id="sc-iw">${ico('hang', 17)} ${E(t('fromMyWardrobe'))}</button>` : ''}</div>
    <label>${E(t('colors'))}</label><div class="sc-chips">${palChips}<label class="sc-chip pick sc-addc">+ ${E(t('addColor'))}<input type="color" id="sc-col" value="#2a4bd7" style="position:absolute;opacity:0;width:1px;height:1px"></label></div>
    <label class="chk" style="margin-top:14px;text-transform:none;font-size:14px;color:inherit"><input type="checkbox" id="sc-wx" ${d.wx.on ? 'checked' : ''}> ${E(t('addWeather'))}</label>
    <div class="sc-wxr" style="${d.wx.on ? '' : 'display:none'}"><input id="sc-w1" type="number" inputmode="numeric" placeholder="${E(t('tmin'))}" value="${E(d.wx.tmin)}"><input id="sc-w2" type="number" inputmode="numeric" placeholder="${E(t('tmax'))}" value="${E(d.wx.tmax)}"></div>
    <div class="sc-err" id="sc-e"></div>
    <div class="row sc-actions">${d.edit ? '' : `<button class="btn g" id="sc-dr" style="flex:1">${E(t('draftSave'))}</button>`}<button class="btn g" id="sc-pv" style="flex:1">${E(t('preview'))}</button><button class="btn" id="sc-go" style="flex:1.3">${E(d.edit ? t('save') : t('publishNow'))}</button></div>`;
    wire();
  };
  const read = () => { // pull current field values into d
    const g = (s) => m.querySelector(s); if (!g('#sc-t')) return;
    d.title = g('#sc-t').value; d.caption = g('#sc-cp').value; d.wx.on = g('#sc-wx').checked; d.wx.tmin = g('#sc-w1').value; d.wx.tmax = g('#sc-w2').value;
  };
  const setImg = async (src, keep) => {
    const e = m.querySelector('#sc-e'); if (e) e.textContent = '';
    try { d.img = await encodeImg(src, 1080, .82, 560 * 1024); } catch (x) { if (e) e.textContent = t('errImg'); return false; }
    d.base = d.img; d.edState = null; d.gifs = []; d.ov = []; d.fit = []; if (d.vid) { try { URL.revokeObjectURL(d.vid.url); } catch (x) { /* ignore */ } } d.vid = null;
    read(); paint(); return true;
  };
  const openEditor = async () => { // filters / text / wardrobe stickers / GIFs; the result replaces the photo, the layers stay editable
    read(); if (!d.img || d.vid) return;
    const r = await EDITOR.open({ src: d.base || d.img, mode: 'post', state: d.edState, gifs: (q) => gq('a=gifs&q=' + encodeURIComponent(q)) }); if (!r) return;
    try { d.img = await encodeImg(r.img, 1080, .82, 560 * 1024); } catch (x) { toast(t('errImg')); return; }
    d.edState = r.state; d.gifs = r.gifs; d.ov = r.ov;
    if (r.worn.length) {
      const have = new Set(d.items.map((i) => String(i.n).toLowerCase()));
      itemsFromPlan(r.worn).forEach((i) => { if (!have.has(i.n.toLowerCase()) && d.items.length < 12) d.items.push(i); });
      const pal = paletteFromPlan(r.worn); pal.forEach((c) => { if (!d.palette.includes(c) && d.palette.length < 6) d.palette.push(c); });
    }
    try { d.fit = r.showFit ? await Promise.all(r.worn.slice(0, 6).map(async (i) => ({ n: String(i.name || '').slice(0, 60), c: i.cat || '', img: await EDITOR.thumb(i.img) }))) : []; } catch (x) { d.fit = []; }
    paint();
  };
  const pickVideo = async (f) => {
    const e = m.querySelector('#sc-e'); if (e) e.textContent = ''; read();
    try {
      const v = await prepVid(f), poster = await encodeImg(v.poster, 1080, .82, 560 * 1024);
      if (d.vid) { try { URL.revokeObjectURL(d.vid.url); } catch (x) { /* ignore */ } }
      d.img = poster; d.base = ''; d.edState = null; d.gifs = []; d.ov = []; d.fit = []; d.vid = v; paint();
    } catch (x) { const msg = x && x.message === 'big' ? t('videoBig') : t('videoErr'); if (e) e.textContent = msg; else toast(msg); }
  };
  const wire = () => {
    const g = (s) => m.querySelector(s), on = (s, ev, fn) => { const el = g(s); if (el) el[ev] = fn; };
    on('#sc-du', 'onclick', () => { d = { ...d, ...saved, wx: { ...d.wx, ...(saved.wx || {}) } }; paint(); });
    on('#sc-dd', 'onclick', () => { dropDraft(); saved && Object.keys(saved).forEach((k) => delete saved[k]); paint(); });
    const files = async (ev) => {
      const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return; read();
      if (/^video\//.test(f.type) || /\.(mov|mp4|m4v|webm)$/i.test(f.name)) { await pickVideo(f); return; }
      if (await setImg(await fileToUrl(f))) openEditor();
    };
    on('#sc-f1', 'onchange', files); on('#sc-f2', 'onchange', files); on('#sc-f3', 'onchange', files);
    on('#sc-s6', 'onclick', () => g('#sc-f3').click()); on('#sc-ed', 'onclick', openEditor);
    on('#sc-pi', 'onclick', () => g('#sc-f1').click()); on('#sc-s1', 'onclick', () => g('#sc-f1').click()); on('#sc-s2', 'onclick', () => g('#sc-f2').click());
    on('#sc-s3', 'onclick', async () => {
      const b = g('#sc-s3'); let r = null; try { r = cur(); } catch (e) { /* ignore */ }
      if (!r || !r.plan || !r.plan.length || r.demo || r.sample) { toast(t('noToday')); return; }
      b.disabled = true; read();
      try { const sig = lkSig(r.plan), src = (S.showAi !== false && S.aiL[sig]) || S.lk[sig] || await buildCollage(r.plan); d.items = itemsFromPlan(r.plan); d.palette = paletteFromPlan(r.plan); d.style = d.style || styleFromPlan(r.plan); d.wx = { on: true, tmin: Math.round(r.tmin), tmax: Math.round(r.tmax), txt: '' }; await setImg(src); } catch (e) { toast(t('errImg')); b.disabled = false; }
    });
    on('#sc-s4', 'onclick', () => {
      read(); const list = S.outfits.filter((o) => o.ids.some((id) => S.items.some((i) => i.id === id)));
      if (!list.length) { toast(t('noSaved')); return; }
      picker = 'outfits'; g('#sc-pk').innerHTML = `<div class="sc-pkl">${list.map((o) => { const im = S.oimg[o.id]; return `<button type="button" class="sc-pko" data-o="${o.id}">${im ? `<img src="${im}" alt="">` : `<span>${ico('hang', 26)}</span>`}<small>${E(o.label || '')}</small></button>`; }).join('')}</div>`;
      g('#sc-pk').querySelectorAll('[data-o]').forEach((b) => { b.onclick = async () => {
        const o = S.outfits.find((x) => x.id === b.dataset.o), plan = o.ids.map((id) => S.items.find((i) => i.id === id)).filter(Boolean);
        d.items = itemsFromPlan(plan); d.palette = paletteFromPlan(plan); d.style = d.style || styleFromPlan(plan); d.title = d.title || o.label || '';
        if (o.min != null && o.max != null) d.wx = { on: true, tmin: o.min, tmax: o.max, txt: '' };
        try { await setImg(S.oimg[o.id] || await buildCollage(plan)); } catch (e) { toast(t('errImg')); }
      }; });
    });
    const itemPicker = (forPhoto) => {
      read(); const sel = new Set(); picker = 'items';
      g('#sc-pk').innerHTML = `<div class="sc-pkh">${E(t('pickItems'))}</div><div class="sc-pkg">${S.items.map((i) => `<button type="button" class="sc-pki" data-i="${i.id}"><img src="${i.img}" alt="${E(i.name)}"></button>`).join('')}</div><div class="row"><button type="button" class="btn" id="sc-pku" style="width:100%">${E(t('usePhoto'))}</button></div>`;
      g('#sc-pk').querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { const id = b.dataset.i; sel.has(id) ? sel.delete(id) : sel.add(id); b.classList.toggle('on', sel.has(id)); }; });
      g('#sc-pku').onclick = async () => {
        const plan = [...sel].map((id) => S.items.find((i) => i.id === id)).filter(Boolean); if (!plan.length) return;
        d.items = itemsFromPlan(plan); d.palette = paletteFromPlan(plan); d.style = d.style || styleFromPlan(plan);
        if (forPhoto) { try { await setImg(await buildCollage(plan)); } catch (e) { toast(t('errImg')); } } else { paint(); }
      };
    };
    on('#sc-s5', 'onclick', () => { if (!S.items.length) { toast(t('simEmpty')); return; } itemPicker(true); });
    on('#sc-iw', 'onclick', () => itemPicker(false));
    on('#sc-ia', 'onclick', () => { read(); const v = g('#sc-in').value.trim(); if (v && d.items.length < 12) { d.items.push({ n: v.slice(0, 60), c: '', col: '' }); paint(); } });
    on('#sc-in', 'onkeydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); g('#sc-ia').click(); } });
    m.querySelectorAll('[data-st]').forEach((b) => { b.onclick = () => { read(); d.style = d.style === b.dataset.st ? '' : b.dataset.st; paint(); }; });
    m.querySelectorAll('[data-ri]').forEach((b) => { b.onclick = () => { read(); d.items.splice(+b.dataset.ri, 1); paint(); }; });
    m.querySelectorAll('[data-rp]').forEach((b) => { b.onclick = () => { read(); d.palette.splice(+b.dataset.rp, 1); paint(); }; });
    on('#sc-col', 'onchange', (ev) => { read(); const c = ev.target.value.toLowerCase(); if (!d.palette.includes(c) && d.palette.length < 6) d.palette.push(c); paint(); });
    on('#sc-wx', 'onchange', () => { read(); paint(); });
    on('#sc-dr', 'onclick', () => { read(); { const { vid, base, edState, gifs, ov, fit, ...rest } = d; toast(putDraft({ ...rest, edit: false }) ? t('draftSaved') : t('errGeneric')); }; });
    on('#sc-pv', 'onclick', () => { read(); if (!d.img) { g('#sc-e').textContent = t('needPhoto'); return; } stage = 'preview'; paint(); });
    on('#sc-go', 'onclick', () => { read(); publishNow(); });
  };
  const publishNow = async () => {
    if (busy) return; read();
    if (!d.img) { const e = m.querySelector('#sc-e'); if (e) e.textContent = t('needPhoto'); else { stage = 'form'; paint(); } return; }
    busy = true;
    const btn = m.querySelector('#sc-go') || m.querySelector('#sc-pp'), label = btn ? btn.textContent : ''; if (btn) { btn.disabled = true; btn.textContent = t('publishing'); }
    const wx = d.wx.on && (d.wx.tmin !== '' || d.wx.tmax !== '') ? { tmin: d.wx.tmin === '' ? null : +d.wx.tmin, tmax: d.wx.tmax === '' ? null : +d.wx.tmax, txt: d.wx.txt || '' } : null;
    const fields = { title: d.title, caption: d.caption, style: d.style, items: d.items, palette: d.palette, wx };
    try {
      let post;
      if (d.edit) { post = (await pq('editPost', { id: d.id, ...fields })).post; }
      else {
        const thumb = await encodeImg(d.img, 360, .72, 80 * 1024), extra = {};
        if (d.gifs && d.gifs.length) extra.gifs = d.gifs; if (d.ov && d.ov.length) extra.ov = d.ov; if (d.fit && d.fit.length) extra.fit = d.fit;
        if (d.vid) { // the raw file goes up in 512 KB chunks, then the post points at it
          const f = d.vid.file, vs = await pq('pvstart', { mime: d.vid.mime, size: f.size, dur: d.vid.dur, w: d.vid.w, h: d.vid.h });
          for (let i = 0; i < vs.n; i++) {
            const data = await b64Chunk(f.slice(i * vs.chunk, Math.min(f.size, (i + 1) * vs.chunk)));
            for (let k = 0; ; k++) { try { await pq('pvchunk', { vid: vs.vid, i, data }); break; } catch (e) { if (k >= 3 || e.code === 'rate_limited') throw e; await new Promise((r) => setTimeout(r, 700 * (k + 1))); } }
            if (btn) btn.textContent = t('videoUp') + ' ' + Math.round(((i + 1) / vs.n) * 100) + '%';
          }
          extra.vid = vs.vid;
        }
        post = (await pq('post', { image: d.img, thumb, ...fields, ...extra })).post;
      }
      remember([post]); st.byId.set(post.id, post);
      if (d.edit) { Object.values(st.feed).concat([st.saved]).forEach((f) => { f.posts = f.posts.map((x) => (x.id === post.id ? post : x)); }); Object.values(st.prof).forEach((pr) => { pr.posts = pr.posts.map((x) => (x.id === post.id ? post : x)); }); toast(t('edited')); }
      else {
        dropDraft();
        ['foryou', 'trending'].forEach((k) => { const f = st.feed[k]; if (f.loaded) f.posts.unshift(post); });
        const pr = st.prof[post.author.nick]; if (pr) { pr.posts.unshift(post); if (pr.profile) pr.profile.posts++; }
        if (st.me && st.me.profile) st.me.profile.posts = (st.me.profile.posts || 0) + 1;
        st.view = 'feed'; st.tab = 'foryou'; st.stack = []; toast(t('published'));
      }
      closeM(m); if (S.tab !== 'social') go('social'); else { refresh(); scrollTo(0, 0); }
    } catch (e) {
      busy = false; if (btn) { btn.disabled = false; btn.textContent = label; }
      if (handleAuthErr(e)) return;
      stage = 'form'; paint(); const er = m.querySelector('#sc-e'); if (er) er.textContent = errText(e);
    }
  };
  paint();
  if (!edit && o.photo) setImg(o.photo);
  return m;
}


/* ------------------------------------------------------------------ stories (24 h) */
async function loadStories() {
  const x = st.stories; if (x.loading) return; x.loading = true;
  try { x.groups = (await gq('a=stories')).groups; x.err = null; x.at = Date.now(); } catch (e) { x.err = e; if (x.groups === null) x.groups = []; x.at = Date.now(); handleAuthErr(e); setTimeout(() => { if (st.stories === x) x.err = null; }, 30000); }
  x.loading = false; paintTray();
}
function tray() {
  const gs = st.stories.groups || [], mine = gs.find((g) => g.author.me), me = st.me && st.me.profile;
  const ring = (cls, inner, label, click) => `<button class="sc-st ${cls}" onclick="${click}"><span class="sc-ring">${inner}</span><small>${E(label)}</small></button>`;
  const own = ring(mine ? '' : 'none', av(me, 62) + `<i class="sc-plus" onclick="event.stopPropagation();SOC.storyCompose()"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13"/></svg></i>`, t('yourStory'), mine ? `SOC.storyOpen(${gs.indexOf(mine)})` : 'SOC.storyCompose()');
  const rest = gs.map((g, i) => (g.author.me ? '' : ring(g.allSeen ? 'seen' : '', av(g.author, 62), g.author.name || g.author.nick, `SOC.storyOpen(${i})`))).join('');
  return `<div class="sc-tray" id="sc-tray">${own}${rest}</div>`;
}
function paintTray() { if (S.tab !== 'social') return; const e = document.getElementById('sc-tray'); if (e && st.view === 'feed') e.outerHTML = tray(); else if (st.view === 'profile') refresh(); }

let V = null;
const SDUR = 5000;
function closeStory(quiet) {
  if (V) { cancelAnimationFrame(V.raf); V.el.remove(); V = null; document.body.style.overflow = ''; if (!quiet) { paintTray(); if (st.view === 'profile') refresh(); } }
}
function storyOpen(gi) {
  const groups = st.stories.groups; if (!groups || !groups[gi]) return;
  closeStory(true);
  const el = document.createElement('div'); el.className = 'sc-sv'; el.id = 'sc-sv'; document.body.appendChild(el); document.body.style.overflow = 'hidden';
  const g = groups[gi];
  V = { el, gi, si: g.author.me ? 0 : Math.max(0, g.stories.findIndex((x) => !x.seen)), left: SDUR, last: 0, paused: false, hold: false, ready: false, raf: 0, down: 0, y0: 0, panel: false };
  el.addEventListener('pointerdown', (e) => { if (e.target.closest('button,.sc-vw')) return; V.down = Date.now(); V.y0 = e.clientY; V.hold = true; });
  const rel = (e) => {
    if (!V || !V.hold) return; V.hold = false;
    const dt = Date.now() - V.down, dy = e.clientY - V.y0;
    if (dy > 90) { closeStory(); return; }
    if (dt < 260 && Math.abs(dy) < 25) { (e.clientX < innerWidth * .33 ? prevStory : nextStory)(); }
  };
  el.addEventListener('pointerup', rel); el.addEventListener('pointercancel', () => { if (V) V.hold = false; });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-a]'); if (!b || !V) return;
    const a = b.dataset.a; if (a === 'x') closeStory(); else if (a === 'del') delStory(); else if (a === 'views') viewersPanel(); else if (a === 'vx') { V.panel = false; const w = el.querySelector('.sc-vw'); if (w) w.remove(); } else if (a === 'prof') { const n = b.dataset.n; closeStory(); profile(n); }
  });
  paintStory();
}
function paintStory() {
  if (!V) return; cancelAnimationFrame(V.raf);
  const groups = st.stories.groups, g = groups[V.gi], s = g.stories[V.si];
  const bars = g.stories.map((_, i) => `<i><b style="width:${i < V.si ? 100 : 0}%"></b></i>`).join('');
  V.el.innerHTML = `<div class="sc-sbars">${bars}</div>
  <div class="sc-sh2"><button class="sc-who" data-a="prof" data-n="${E(g.author.nick)}">${av(g.author, 36)}<span><b>${E(g.author.name || g.author.nick)}${vb(g.author)}</b><small>${E(ago(s.ts))}</small></span></button>
   ${g.author.me ? `<button class="sc-ic" data-a="del" aria-label="${E(t('del'))}"><span style="font-size:13px;font-weight:800">${E(t('del'))}</span></button>` : ''}<button class="sc-ic" data-a="x" aria-label="${E(t('close'))}">${ico('x')}</button></div>
  <div class="sc-simg"><img src="${E(s.img)}" alt="" draggable="false">${ovLayer(s.ov)}</div>
  ${s.cap ? `<div class="sc-scap" data-nt>${E(s.cap)}</div>` : ''}
  ${g.author.me ? `<div class="sc-sft"><button class="sc-vb" data-a="views">${ico('user', 18)} ${E(t('viewers'))} · ${s.views || 0}</button></div>` : ''}`;
  V.left = SDUR; V.ready = false; V.last = performance.now();
  const im = V.el.querySelector('.sc-simg img');
  im.onload = () => { placeOv(im, 'contain'); if (V) { V.ready = true; V.last = performance.now(); } };
  im.onerror = () => { if (V) { V.ready = true; im.replaceWith(Object.assign(document.createElement('div'), { className: 'sc-gone', textContent: t('storyGone') })); } };
  if (im.complete && im.naturalWidth) { V.ready = true; placeOv(im, 'contain'); }
  if (!s.seen && !g.author.me) { s.seen = true; g.allSeen = g.stories.every((x) => x.seen); pq('storySeen', { id: s.id }).catch(() => {}); }
  const bar = () => V.el.querySelectorAll('.sc-sbars i b')[V.si];
  const loop = (now) => {
    if (!V) return;
    if (!V.paused && !V.hold && !V.panel && V.ready) V.left -= now - V.last;
    V.last = now;
    const b = bar(); if (b) b.style.width = Math.min(100, (1 - V.left / SDUR) * 100) + '%';
    if (V.left <= 0) return nextStory();
    V.raf = requestAnimationFrame(loop);
  };
  V.raf = requestAnimationFrame(loop);
}
function nextStory() {
  if (!V) return; const groups = st.stories.groups, g = groups[V.gi];
  if (V.si < g.stories.length - 1) { V.si++; return paintStory(); }
  if (V.gi < groups.length - 1) { V.gi++; const n = groups[V.gi]; V.si = n.author.me ? 0 : Math.max(0, n.stories.findIndex((x) => !x.seen)); return paintStory(); }
  closeStory();
}
function prevStory() {
  if (!V) return;
  if (V.si > 0) V.si--; else if (V.gi > 0) { V.gi--; V.si = 0; }
  paintStory();
}
async function delStory() {
  if (!V) return; const groups = st.stories.groups, g = groups[V.gi], s = g.stories[V.si];
  V.paused = true;
  if (!confirm(t('delStoryQ'))) { V.paused = false; return; }
  try {
    await pq('delStory', { id: s.id }); g.stories.splice(V.si, 1);
    if (!g.stories.length) { groups.splice(V.gi, 1); closeStory(); toast(t('deleted')); return; }
    if (V.si >= g.stories.length) V.si = g.stories.length - 1;
    V.paused = false; paintStory(); toast(t('deleted'));
  } catch (e) { V.paused = false; note(e); }
}
async function viewersPanel() {
  if (!V) return; const s = st.stories.groups[V.gi].stories[V.si]; V.panel = true;
  const w = document.createElement('div'); w.className = 'sc-vw'; w.innerHTML = `<div class="sc-vwh"><b>${E(t('viewers'))}</b><button class="sc-ic" data-a="vx" aria-label="${E(t('close'))}">${ico('x')}</button></div><div class="sc-vwl">${skel(1)}</div>`;
  V.el.appendChild(w);
  try {
    const j = await gq('a=sviewers&id=' + s.id);
    w.querySelector('.sc-vwl').innerHTML = j.users.length ? j.users.map((u) => `<div class="sc-ur"><span class="sc-who">${av(u, 38)}<span><b>${E(u.name || u.nick)}${vb(u)}</b><small>@${E(u.nick)}</small></span></span></div>`).join('') : `<p class="note" style="text-align:center">${E(t('noViewers'))}</p>`;
  } catch (e) { w.querySelector('.sc-vwl').innerHTML = stateBox('cloud', t('errLoad'), errText(e)); }
}
function storyCompose() {
  let img = '', busy = false, base = '', edState = null, gifs = [], ov = [];
  const m = sheet('', 'sc-comp');
  const paint = () => {
    const todayOk = (() => { try { const r = cur(); return !!(r && r.plan && r.plan.length && !r.demo && !r.sample); } catch (e) { return false; } })();
    m.querySelector('.sheet').innerHTML = `${sheetHead(t('newStory'))}
    <div class="sc-spv ${img ? '' : 'empty'}" id="sc-spv">${img ? `<img src="${img}" alt="">` : `<span>${ico('img', 34)}<b>${E(t('pickPhoto'))}</b></span>`}</div>
    ${img ? `<div class="sc-edb"><button type="button" class="btn g" id="sc-sed">${ico('pen', 17)} ${E(t('editor'))}${edState ? ' ✓' : ''}</button></div>` : ''}
    <input type="file" id="sc-sf1" accept="image/*" hidden><input type="file" id="sc-sf2" accept="image/*" capture="environment" hidden>
    <div class="sc-src"><button type="button" class="btn g" id="sc-ss1">${ico('img', 17)} ${E(t('pickPhoto'))}</button><button type="button" class="btn g" id="sc-ss2">${ico('cam', 17)} ${E(t('camera'))}</button><button type="button" class="btn g" id="sc-ss3" ${todayOk ? '' : 'data-off="1"'}>${ico('star', 17)} ${E(t('fromToday'))}</button></div>
    <label>${E(t('storyCap'))}</label><input id="sc-scp" maxlength="120" value="${E(m._cap || '')}">
    <p class="note">${E(t('storyExp'))}</p><div class="sc-err" id="sc-e"></div>
    <div class="row"><button class="btn big" id="sc-sgo" style="width:100%" ${img ? '' : 'disabled'}>${E(t('storyPost'))}</button></div>`;
    const g = (q) => m.querySelector(q), keep = () => { m._cap = g('#sc-scp').value; };
    const setImg = async (src) => { keep(); try { img = await encodeImg(src, 1280, .8, 400 * 1024); } catch (e) { g('#sc-e').textContent = t('errImg'); return false; } base = img; edState = null; gifs = []; ov = []; paint(); return true; };
    const edit = async () => {
      keep(); if (!img) return; const r = await EDITOR.open({ src: base || img, mode: 'story', state: edState, gifs: (q) => gq('a=gifs&q=' + encodeURIComponent(q)) }); if (!r) return;
      try { img = await encodeImg(r.img, 1280, .8, 400 * 1024); } catch (e) { toast(t('errImg')); return; }
      edState = r.state; gifs = r.gifs; ov = r.ov; paint();
    };
    const files = async (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (f && await setImg(await fileToUrl(f))) edit(); };
    if (g('#sc-sed')) g('#sc-sed').onclick = edit;
    g('#sc-sf1').onchange = files; g('#sc-sf2').onchange = files;
    g('#sc-spv').onclick = () => g('#sc-sf1').click(); g('#sc-ss1').onclick = () => g('#sc-sf1').click(); g('#sc-ss2').onclick = () => g('#sc-sf2').click();
    g('#sc-ss3').onclick = async () => {
      let r = null; try { r = cur(); } catch (e) { /* ignore */ }
      if (!r || !r.plan || !r.plan.length || r.demo || r.sample) { toast(t('noToday')); return; }
      try { const sig = lkSig(r.plan); await setImg((S.showAi !== false && S.aiL[sig]) || S.lk[sig] || await buildCollage(r.plan)); } catch (e) { toast(t('errImg')); }
    };
    g('#sc-sgo').onclick = async (ev) => {
      if (busy || !img) return; busy = true; keep(); const b = ev.currentTarget; b.disabled = true; b.textContent = t('publishing');
      try {
        const j = await pq('story', { image: img, caption: m._cap || '', ...(gifs.length ? { gifs } : {}), ...(ov.length ? { ov } : {}) });
        const x = st.stories, me = st.me.profile; x.groups = x.groups || [];
        let mine = x.groups.find((q) => q.author.me);
        if (!mine) { mine = { author: { ...me, me: true }, stories: [], allSeen: true, last: 0 }; x.groups.unshift(mine); }
        mine.stories.push(j.story); mine.allSeen = true; mine.last = j.story.ts;
        closeM(m); toast(t('storyPosted')); if (S.tab !== 'social') { st.view = 'feed'; go('social'); } else refresh();
      } catch (e) { busy = false; b.disabled = false; b.textContent = t('storyPost'); if (!handleAuthErr(e)) g('#sc-e').textContent = errText(e); }
    };
  };
  paint();
}

/* ------------------------------------------------------------------ styles (theme-aware: black cards by default, glass in the glass theme) */
const css = `
.sc{padding-bottom:8px}.sc h2,.sc-top h2{margin:0}
.sc-top{display:flex;align-items:center;gap:10px;margin:2px 0 14px}.sc-top h2{flex:1;min-width:0;font-size:26px;letter-spacing:-.4px}
.sc-pub{border:0;border-radius:24px;padding:11px 18px;font:inherit;font-weight:800;font-size:14px;cursor:pointer;background:#fff;color:#000;box-shadow:0 4px 18px rgba(0,0,0,.25);white-space:nowrap}
:root[data-theme=light] .sc-pub{background:#000;color:#fff}:root[data-theme=glass] .sc-pub{background:linear-gradient(135deg,#fff,#cfe3ff);color:#1a2aa0}
.sc-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px}
.sc-tabs{display:flex;gap:4px;background:#000;border-radius:24px;padding:4px;min-width:0;overflow:hidden}.sc-tabs.two{margin:6px 0 12px;width:100%}.sc-tabs.two .sc-tab{flex:1}
.sc-tab{border:0;background:none;color:#aaa;font:inherit;font-weight:800;font-size:12.5px;padding:8px 11px;border-radius:20px;cursor:pointer;white-space:nowrap}.sc-tab.on{background:#fff;color:#000}
:root[data-theme=glass] .sc-tabs,:root[data-theme=glass] .sp,:root[data-theme=glass] .sc-state,:root[data-theme=glass] .sc-sb,:root[data-theme=glass] .sc-sk{background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.34);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
:root[data-theme=glass] .sc-tab{color:rgba(255,255,255,.8)}:root[data-theme=glass] .sc-tab.on{background:#fff;color:#1a2aa0}
.sc-icons{display:flex;gap:2px;align-items:center;flex:none}
.sc-ic{position:relative;border:0;background:none;color:var(--h);width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex:none}.sc-ic.me{width:38px}
:root[data-theme=glass] .sc-ic,:root[data-theme=dark] .sc-ic{color:#fff}
.sc-badge{position:absolute;top:2px;right:0;min-width:16px;height:16px;border-radius:8px;background:#ff4d6d;color:#fff;font-size:10px;font-style:normal;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px}
.vb{display:inline-block;vertical-align:-2px;margin-left:4px;flex:none}.sc-who b .vb{vertical-align:-3px}
.sc-av{border-radius:50%;object-fit:cover;background:#2a2a2a;flex:none;display:inline-block}.sc-av.ph{display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;background:linear-gradient(135deg,#3b5bdb,#1a2aa0)}
.sp{background:#000;color:#fff;border-radius:0;margin:0 -16px 16px;overflow:hidden;padding-bottom:12px;contain:layout paint}
.sp-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 12px 10px 14px}
.sc-who{border:0;background:none;color:inherit;font:inherit;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;min-width:0;padding:0}.sc-who span{display:flex;flex-direction:column;min-width:0}.sc-who b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sc-who small{font-size:11px;color:var(--mut);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sc-fl{border:1.5px solid #fff;background:none;color:#fff;border-radius:18px;padding:6px 13px;font:inherit;font-weight:800;font-size:12px;cursor:pointer;flex:none}.sc-fl.on{border-color:#555;color:#aaa}
.sp-img{position:relative;aspect-ratio:4/5;background:#151515;cursor:pointer;overflow:hidden;-webkit-tap-highlight-color:transparent}.sp-img img{width:100%;height:100%;object-fit:cover;display:block}.sp-img.bad::after{content:'';position:absolute;inset:0;background:#151515}
.sc-pop{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;opacity:0;pointer-events:none}.sc-pop svg{fill:#fff;stroke:none;filter:drop-shadow(0 4px 18px rgba(0,0,0,.45))}.sp-img.pop .sc-pop{animation:scpop .8s ease}
@keyframes scpop{0%{opacity:0;transform:scale(.4)}25%{opacity:1;transform:scale(1.1)}60%{opacity:1;transform:scale(.95)}100%{opacity:0;transform:scale(1)}}
.sp-act{display:flex;align-items:center;gap:2px;padding:8px 8px 2px}.sc-b{border:0;background:none;color:#fff;display:flex;align-items:center;gap:5px;padding:7px 9px;border-radius:20px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;min-width:40px;justify-content:center}.sc-b.sv{margin-left:auto}
.sc-b.on svg{fill:currentColor}.sc-b.on:not(.sv){color:#ff4d6d}.sc-b.sv.on{color:#ffd34d}.sc-b:active svg{transform:scale(.85)}.sc-b svg{transition:transform .15s}
.sp-t{margin:6px 16px 0;font-size:16px}.sp-c{margin:4px 16px 0;font-size:14px;line-height:1.4;font-weight:600;white-space:pre-wrap;overflow-wrap:anywhere;color:#e8e8e8}
.sp-chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 16px 0;align-items:center}
.sc-chip{display:inline-flex;align-items:center;gap:5px;border-radius:14px;background:rgba(255,255,255,.14);color:inherit;font-size:12px;font-weight:700;padding:5px 11px;border:1px solid transparent;position:relative}
.sc-chip.pick{cursor:pointer;font:inherit;font-size:12px;font-weight:700}.sc-chip.pick.on{background:#fff;color:#000}.sc-chip.rm button{border:0;background:none;color:inherit;font-size:16px;line-height:1;padding:0 0 0 4px;cursor:pointer}.sc-chip i{width:14px;height:14px;border-radius:50%;display:inline-block;border:1px solid rgba(255,255,255,.4)}
.sc-pal{display:inline-flex;gap:4px;align-items:center}.sc-pal i{width:18px;height:18px;border-radius:50%;border:1.5px solid rgba(255,255,255,.55);display:inline-block}.sc-pal em{font-style:normal;font-size:11px;color:var(--mut)}
.sc-its{margin:8px 16px 0}.sc-lnk{border:0;background:none;color:#cfd8ff;font:inherit;font-weight:800;font-size:13px;cursor:pointer;padding:6px 0;display:inline-flex;align-items:center;gap:6px}
.sc-chev{width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);margin-top:-3px;transition:transform .2s}[aria-expanded=true]>.sc-chev{transform:rotate(-135deg);margin-top:3px}
.sc-itl{display:none}.sc-itl.open{display:block}.sc-itl ul{list-style:none;margin:4px 0 10px;padding:0}.sc-itl li{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.12);font-size:13px}.sc-itl li:last-child{border:0}.sc-itl li span{color:var(--mut);font-weight:600;text-align:right}.sc-sim{width:100%;display:flex;align-items:center;justify-content:center;gap:8px}
.sc-state{background:#000;color:#fff;border-radius:30px;padding:30px 22px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:16px}.sc-state p{margin:0;font-size:13px;color:#cfcfcf;line-height:1.45;font-weight:600;max-width:320px}.sc-state small{font-size:11px;color:var(--mut);font-weight:600;max-width:300px}.sc-state .btn{margin-top:10px}.sc-sic{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center}
.sc-sk{background:#000;border-radius:30px;margin-bottom:16px;overflow:hidden;animation:p 1s infinite alternate}.sc-skh{height:60px}.sc-ski{aspect-ratio:4/5;background:rgba(255,255,255,.08)}
.sc-more{text-align:center;color:var(--mut);font-size:12px;padding:14px 0 6px;font-weight:700}
.sc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin-bottom:14px}.sc-gt{border:0;padding:0;background:#151515;border-radius:12px;overflow:hidden;aspect-ratio:4/5;cursor:pointer}.sc-gt img{width:100%;height:100%;object-fit:cover;display:block}
.sc-prof{display:flex;align-items:center;gap:16px;margin:4px 2px 12px}.sc-ps{display:flex;flex:1;justify-content:space-around;min-width:0}.sc-ps button{border:0;background:none;color:var(--h);font:inherit;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 6px}:root[data-theme=glass] .sc-ps button,:root[data-theme=dark] .sc-ps button{color:#fff}.sc-ps b{font-size:18px}.sc-ps small{font-size:11px;font-weight:700;opacity:.75}
.sc-pn{margin:0 4px 12px;color:var(--h)}:root[data-theme=glass] .sc-pn,:root[data-theme=dark] .sc-pn{color:#fff}.sc-pn p{margin:4px 0 0;font-size:13px;font-weight:600;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere;opacity:.85}.sc-pbtn{margin-bottom:12px}.sc-pbtn .btn{width:100%}.sc-pb2{display:flex;gap:8px}.sc-pb2 .btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding-left:8px;padding-right:8px}
.sc-h{margin:18px 4px 8px;font-size:13px;text-transform:uppercase;letter-spacing:.4px;color:var(--h)}:root[data-theme=glass] .sc-h,:root[data-theme=dark] .sc-h{color:#fff}
.sc-sb{display:flex;align-items:center;gap:8px;background:#000;border-radius:22px;padding:0 14px;margin-bottom:12px;color:#fff}.sc-sb input{background:none!important;padding:13px 0!important;border-radius:0!important;min-width:0}.sc-sb input::placeholder{color:#888}
.sc-ur{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#000;color:#fff;border-radius:22px;padding:10px 12px;margin-bottom:8px}:root[data-theme=glass] .sc-ur,:root[data-theme=glass] .sc-n{background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.34)}
.sc-nl{display:flex;flex-direction:column;gap:8px}.sc-n{display:flex;align-items:center;gap:12px;border:0;background:#000;color:#fff;border-radius:22px;padding:11px 12px;text-align:left;font:inherit;cursor:pointer;width:100%}.sc-n.un{box-shadow:inset 3px 0 0 #4d8bff}.sc-n span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.sc-n b{font-size:13px}.sc-n small{font-size:12px;color:#cfcfcf;font-weight:600;overflow-wrap:anywhere}.sc-n i{font-style:normal;font-size:11px;color:var(--mut)}.sc-nt{width:46px;height:56px;object-fit:cover;border-radius:10px;flex:none}
.sc-sheet{max-height:94%}.sc-sh{display:flex;align-items:center;gap:8px;margin:-8px -8px 10px 0;font-size:16px}.sc-sh b{flex:1;font-size:16px}.sc-sheet textarea{width:100%;background:#1c1c1c;border:0;color:#fff;border-radius:16px;padding:13px;font:inherit;font-weight:600;font-size:15px;resize:vertical}.sc-hint{display:block;color:var(--mut);font-size:11px;margin-top:4px;font-weight:600}.sc-err{color:#ff7b7b;font-size:13px;font-weight:700;margin-top:10px;min-height:0}
.sc-pimg{border-radius:24px;overflow:hidden;background:#1c1c1c;aspect-ratio:4/5;max-height:46vh;display:flex;align-items:center;justify-content:center;cursor:pointer}.sc-pimg img{width:100%;height:100%;object-fit:cover}.sc-pimg.empty span{display:flex;flex-direction:column;align-items:center;gap:8px;color:#aaa;font-size:13px}
.sc-src{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.sc-src .btn{padding:9px 13px;font-size:12px;display:inline-flex;align-items:center;gap:6px}.sc-src .btn[data-off]{opacity:.5}
.sc-chips{display:flex;flex-wrap:wrap;gap:6px}.sc-add{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}.sc-add input{flex:1;min-width:120px}.sc-add .btn{padding:10px 14px;font-size:12px;display:inline-flex;align-items:center;gap:6px}
.sc-wxr{display:flex;gap:8px;margin-top:8px}.sc-actions{position:sticky;bottom:-24px;background:linear-gradient(transparent,#000 22%);padding:16px 0 4px;margin-top:14px}:root[data-theme=glass] .sc-actions{background:linear-gradient(transparent,rgba(24,38,120,.9) 22%)}.sc-actions .btn{padding:13px 4px;font-size:11.5px;white-space:nowrap}
.sc-draft{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.1);border-radius:16px;padding:10px 14px;font-size:13px;margin-bottom:6px}.sc-draft span{flex:1}
.sc-pkl,.sc-pkg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.sc-pko,.sc-pki{border:2px solid transparent;background:#1c1c1c;border-radius:16px;padding:4px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;font:inherit}.sc-pko img,.sc-pki img{width:100%;aspect-ratio:1;object-fit:contain;border-radius:12px}.sc-pko small{font-size:10px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sc-pki.on{border-color:#fff;background:rgba(255,255,255,.2)}.sc-pkh{margin-top:10px;font-size:12px;color:var(--mut);text-transform:uppercase}
.sc-pvw .sp{margin:0 0 14px}
.sc-cl{max-height:48vh;overflow:auto;margin-bottom:10px}.sc-c{display:flex;gap:10px;padding:9px 0;align-items:flex-start}.sc-c>div{flex:1;min-width:0}.sc-c b{font-size:13px}.sc-c small{font-size:11px;color:var(--mut);font-weight:600}.sc-c p{margin:3px 0 0;font-size:14px;line-height:1.35;font-weight:600;white-space:pre-wrap;overflow-wrap:anywhere}
.sc-cf{display:flex;gap:8px;align-items:center;position:sticky;bottom:-24px;padding:10px 0 2px;background:#000}:root[data-theme=glass] .sc-cf{background:rgba(24,38,120,.92)}.sc-cf input{flex:1}.sc-cf .btn{padding:12px 16px}
.sc-avrow{display:flex;align-items:center;gap:14px;margin-bottom:6px}.sc-avb{display:flex;flex-direction:column;gap:8px}.sc-avb .btn{padding:9px 14px;font-size:12px;display:inline-flex;align-items:center;gap:6px;justify-content:center}

.sc-tray{display:flex;gap:12px;overflow-x:auto;margin:0 -16px 12px;padding:2px 16px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.sc-tray::-webkit-scrollbar{display:none}
.sc-st{border:0;background:none;color:var(--h);font:inherit;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;flex:none;width:82px;padding:0}:root[data-theme=glass] .sc-st,:root[data-theme=dark] .sc-st{color:#fff}
.sc-st small{font-size:11px;font-weight:700;max-width:82px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sc-ring{position:relative;display:inline-flex;line-height:0;width:68px;height:68px;box-sizing:border-box;overflow:visible;align-items:center;justify-content:center;padding:0;border-radius:50%;background:linear-gradient(135deg,#4d8bff,#9b6bff 55%,#ff6bb5)}.sc-ring .sc-av,.sc-pav .sc-av{display:flex;flex:none}.sc-ring .sc-av{border:2px solid #0b0d3b;box-sizing:border-box}
.sc-st.seen .sc-ring{background:rgba(255,255,255,.35)}.sc-st.none .sc-ring{background:rgba(255,255,255,.2)}
.sc-pav{position:relative;display:inline-flex;flex:none;border-radius:50%;padding:0}.sc-pav.ring{padding:3px;background:linear-gradient(135deg,#4d8bff,#9b6bff 55%,#ff6bb5)}.sc-pav.ring.seen{background:rgba(255,255,255,.35)}.sc-pav.ring .sc-av{border:2px solid #0b0d3b;box-sizing:border-box}.sc-pavb{border:0;background:none;padding:0;border-radius:50%;display:flex;cursor:pointer}
.sc-plus{min-height:0!important;min-width:0!important;flex:none;-webkit-appearance:none;appearance:none;box-sizing:border-box;line-height:0;position:absolute;right:-1px;bottom:-1px;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#5b8cff,#8a5cff);color:#fff;border:2.5px solid #1b2590;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 3px 10px rgba(20,30,120,.45);cursor:pointer;transition:transform .2s cubic-bezier(.3,1.4,.5,1)}.sc-plus:active{transform:scale(.85)}.sc-plus svg{fill:none;stroke:currentColor;stroke-width:3.4;stroke-linecap:round;display:block}
.sc-plus.lg{width:26px!important;height:26px!important;min-height:26px!important;max-height:26px!important;min-width:26px!important;aspect-ratio:1;flex:none;-webkit-appearance:none;appearance:none;right:-3px;bottom:-3px}.sc-plus.lg svg{width:14px;height:14px}
.sc-sv{position:fixed;inset:0;z-index:200;background:#000;color:#fff;display:flex;flex-direction:column;touch-action:none;user-select:none;-webkit-user-select:none;animation:mf .2s ease}
.sc-sbars{display:flex;gap:4px;padding:calc(10px + env(safe-area-inset-top,0px)) 10px 6px;position:relative;z-index:2}.sc-sbars i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.3);overflow:hidden}.sc-sbars b{display:block;height:100%;background:#fff}
.sc-sh2{display:flex;align-items:center;gap:6px;padding:4px 10px;position:relative;z-index:2}.sc-sh2 .sc-who{flex:1;color:#fff}.sc-sh2 .sc-ic{color:#fff;width:auto;padding:0 10px;gap:4px;display:flex}
.sc-simg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}.sc-simg{overflow:hidden}.sc-simg img:not(.sc-ovg){width:100%;height:100%;object-fit:contain;pointer-events:none}.sc-simg .sc-ovg{width:auto}.sc-gone{color:#aaa;font-weight:700}
.sc-scap{position:absolute;left:0;right:0;bottom:calc(70px + env(safe-area-inset-bottom,0px));text-align:center;padding:10px 20px;font-weight:700;font-size:16px;background:linear-gradient(transparent,rgba(0,0,0,.6) 40%);z-index:2;overflow-wrap:anywhere}
.sc-sft{position:absolute;left:0;right:0;bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;justify-content:center;z-index:2}.sc-vb{border:0;background:rgba(255,255,255,.18);color:#fff;font:inherit;font-weight:800;font-size:13px;border-radius:22px;padding:10px 18px;display:flex;align-items:center;gap:8px;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.sc-vw{position:absolute;left:0;right:0;bottom:0;max-height:62%;background:#111;border-radius:28px 28px 0 0;padding:14px 16px calc(18px + env(safe-area-inset-bottom,0px));z-index:5;display:flex;flex-direction:column}.sc-vwh{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.sc-vwl{overflow:auto}
.sc-spv{border-radius:24px;overflow:hidden;background:#1c1c1c;aspect-ratio:9/14;max-height:50vh;margin:0 auto;display:flex;align-items:center;justify-content:center;cursor:pointer}.sc-spv img{width:100%;height:100%;object-fit:cover}.sc-spv.empty span{display:flex;flex-direction:column;align-items:center;gap:8px;color:#aaa;font-size:13px}

@keyframes scUp{from{opacity:0;transform:translate3d(0,16px,0) scale(.99)}to{opacity:1;transform:none}}
@keyframes scFade{from{opacity:0}to{opacity:1}}
@keyframes scTile{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}
@keyframes scBump{0%{transform:scale(1)}30%{transform:scale(1.38)}55%{transform:scale(.88)}80%{transform:scale(1.1)}100%{transform:scale(1)}}
@keyframes scShim{0%{background-position:-240px 0}100%{background-position:240px 0}}
@keyframes scGlow{0%,100%{box-shadow:0 0 0 0 rgba(120,140,255,.45)}60%{box-shadow:0 0 0 7px rgba(120,140,255,0)}}
@keyframes scShine{0%,70%{transform:translateX(-120%) skewX(-20deg)}100%{transform:translateX(240%) skewX(-20deg)}}
@keyframes scSl{from{opacity:0;transform:translate3d(0,-12px,0)}to{opacity:1;transform:none}}
@keyframes scZoom{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:none}}
@keyframes scOpen{from{opacity:0;transform:scale(.9) translate3d(0,30px,0);border-radius:40px}to{opacity:1;transform:none}}
.sp.in,.sc-n.in,.sc-ur.in{animation:scUp .7s cubic-bezier(.16,1,.3,1) both}
@keyframes scView{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}.sc.vin{animation:scView .45s cubic-bezier(.16,1,.3,1) both}
.sc-gt.in{animation:scTile .55s cubic-bezier(.16,1,.3,1) both}
.sc-b.bump svg{animation:scBump .55s cubic-bezier(.34,1.3,.5,1)}
.sc-c.new{animation:scUp .35s cubic-bezier(.22,1,.36,1)}
.sc-sk .sc-skh,.sc-sk .sc-ski{background:linear-gradient(100deg,rgba(255,255,255,.05) 20%,rgba(255,255,255,.16) 40%,rgba(255,255,255,.05) 60%) 0 0/480px 100%,rgba(255,255,255,.06);animation:scShim 1.3s linear infinite}
.sc-sk{animation:none}
.sc-pub{position:relative;overflow:hidden;transition:transform .15s}.sc-pub::after{content:'';position:absolute;top:0;bottom:0;width:40%;left:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);animation:scShine 4.5s ease-in-out infinite}.sc-pub:active{transform:scale(.94)}
.sc-st:not(.seen):not(.none) .sc-ring{animation:scGlow 3s ease-in-out infinite}.sc-st{transition:transform .15s}.sc-st:active{transform:scale(.92)}.sc-pav.ring:not(.seen){animation:scGlow 2.4s ease-in-out infinite}
.sc-tab{transition:background .25s,color .25s,transform .15s}.sc-tab:active{transform:scale(.94)}.sc-fl{transition:all .25s}.sc-fl:active,.sc-b:active,.sc-ic:active{transform:scale(.9)}.sc-ic{transition:transform .15s,background .2s}.sc-ic:active{background:rgba(255,255,255,.14)}
.sc-badge{animation:scBump .6s ease .4s both}
.sc-sv{animation:scOpen .32s cubic-bezier(.22,1,.36,1)}.sc-simg img:not(.sc-ovg){animation:scZoom .45s cubic-bezier(.22,1,.36,1)}.sc-sh2,.sc-sbars{animation:scSl .4s ease both}.sc-scap,.sc-sft{animation:scUp .45s .1s cubic-bezier(.22,1,.36,1) both}
.sc-vw{animation:scUp .3s cubic-bezier(.22,1,.36,1)}
.sc-sheet .sc-chip.pick{transition:background .2s,color .2s,transform .15s}.sc-chip.pick:active{transform:scale(.93)}
.sc-itl{transition:none}.sc-itl.open{animation:scFade .3s ease}
.sc-state{animation:scUp .5s cubic-bezier(.22,1,.36,1) both}
.sp-rp{display:flex;align-items:center;gap:6px;border:0;background:none;color:#aaa;font:inherit;font-size:12px;font-weight:700;padding:10px 14px 0;cursor:pointer}.sp-rp b{color:#fff}.sp-rp svg{flex:none}
.sp-img .sc-ov img.sc-ovg{height:auto;object-fit:fill;transition:none}.sc-ov{position:absolute;pointer-events:none;overflow:visible}.sc-ovg{position:absolute;display:block;height:auto;pointer-events:none;-webkit-user-drag:none}
.sc-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:0;background:rgba(0,0,0,.5);color:#fff;border-radius:34px;min-width:60px;height:60px;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 16px;cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font:inherit;font-weight:800;font-size:13px;z-index:2}
.sp-img.vp{background:#000;aspect-ratio:auto;min-height:200px}.sp-img.vp video{width:100%;max-height:80vh;display:block;background:#000}
.sp-fit{padding:10px 14px 2px}.sp-fit>span{display:block;font-size:11px;font-weight:800;color:#aaa;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px}.sp-fit>div{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}.sp-fit>div::-webkit-scrollbar{display:none}
.sp-fit figure{flex:none;margin:0;width:68px}.sp-fit img{width:68px;height:68px;border-radius:12px;object-fit:contain;background:#fff;display:block}.sp-fit figcaption{font-size:10.5px;color:#ccc;margin-top:4px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sc-b.rp.on{color:#3ddc84}.sc-b.ro{cursor:default;color:#aaa}
.sc-gt{position:relative}.sc-gv,.sc-gr{position:absolute;top:6px;right:6px;display:flex;color:#fff;filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))}.sc-gr{right:auto;left:6px}
.sc-simg .sc-ov{z-index:1}
.sc-pimg .vbadge{position:absolute}
.sc-edb{display:flex;gap:8px;margin:8px 0 2px}.sc-edb .btn{flex:1}
.sc-vprog{height:4px;border-radius:2px;background:#333;overflow:hidden;margin-top:8px}.sc-vprog i{display:block;height:100%;width:0;background:#3ddc84;transition:width .2s}
.sp-img img{transition:opacity .4s}
@media(prefers-reduced-motion:reduce){.sc.vin,.sp.in,.sc-n.in,.sc-ur.in,.sc-gt.in,.sc-c.new,.sc-b.bump svg,.sc-pub::after,.sc-st .sc-ring,.sc-pav.ring,.sc-badge,.sc-sv,.sc-simg img,.sc-sh2,.sc-sbars,.sc-scap,.sc-sft,.sc-vw,.sc-state,.sc-sk .sc-skh,.sc-sk .sc-ski{animation:none!important}}
.sc-menu{display:flex;flex-direction:column;gap:10px}.sc-menu .btn{width:100%}
.sc-sr{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.08);border-radius:18px;padding:10px;margin-bottom:8px}.sc-sl{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.sc-sl small{color:var(--mut);font-size:11px;font-weight:700}.sc-sl b{font-size:13px;overflow-wrap:anywhere}.sc-ar{color:var(--mut)}.sc-sm{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;align-items:stretch}.sc-sm img{width:100%;max-height:96px;object-fit:contain;border-radius:12px;background:rgba(255,255,255,.12)}.sc-no{font-size:12px;color:#ff9b9b;font-weight:700;text-align:center}.sc-sm select{padding:8px;font-size:12px}
@media(prefers-reduced-motion:reduce){.sp-img.pop .sc-pop{animation:none}}

.sc-ptags{display:flex;flex-direction:column;gap:7px;margin:8px 0 2px}.sc-ptr{display:flex;flex-wrap:wrap;align-items:center;gap:5px}.sc-ptr>small{font-size:11px;font-weight:800;opacity:.7;margin-right:2px}
.sc-chip.br{background:rgba(120,150,255,.22)}.sc-chip.earn{background:rgba(90,220,170,.2)}.sc-priv{font-style:normal;font-size:11px;opacity:.65}
.sc-act{margin:8px 0 0;font-size:12.5px;padding:7px 12px;border-radius:14px;background:rgba(120,150,255,.16);display:inline-block}.sc-act small{opacity:.7;font-weight:800}.sc-act.on b{color:#7dffb0}
.sc-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}.sc-chips.sugg{margin-top:0}
.sc-addrow{display:flex;gap:8px;margin:2px 0 8px}.sc-addrow input{flex:1;min-width:0}.sc-addrow .btn{flex:none;width:auto}
.sc-chk{display:flex;align-items:center;gap:10px;margin:8px 0 2px;font-weight:700}.sc-chk input{width:20px;height:20px;min-height:0;flex:none}
`;
const sty = document.createElement('style'); sty.textContent = css; document.head.appendChild(sty);

/* ------------------------------------------------------------------ public API + boot */
addEventListener('resize', () => { document.querySelectorAll('.sp-img > img').forEach((im) => placeOv(im, 'cover')); document.querySelectorAll('.sc-simg > img:not(.sc-ovg)').forEach((im) => placeOv(im, 'contain')); });
window.SOC = { view, after, reset, nav, back, tab, ptab, profile, open, like, save, follow, share, comments, menu, compose, similar, toggleItems, repost, rpMenu, play, ovp: (im) => placeOv(im, 'cover'),  q, more, reload, setup, editProfile, follows, closeSheet, loadMe, setup: () => openSetup(true), settings: openSettings, storyOpen, storyCompose, reloadMe: () => { st.meErr = null; st.me = undefined; refresh(); }, state: st, name: NAME };
try { const u = new URL(location.href), pid = u.searchParams.get('post'); if (pid && /^[a-z0-9]{6,32}$/.test(pid)) { st.deep = pid; u.searchParams.delete('post'); history.replaceState(null, '', u.pathname + (u.search || '') + u.hash); setTimeout(() => { if (S.tab !== 'social') go('social'); }, 600); } } catch (e) { /* ignore */ }
loadCfg().then(() => { if (S.tab === 'social') render(); });
})();
