/* Weather Wardrobe — interface language (ru / uk / en).
   The app was written with mixed English/Russian strings, so translation is done at the DOM level:
   every text node / placeholder / title / alt is looked up in a dictionary (or matched by a sentence pattern)
   and replaced with the chosen language. The original text is remembered per node, so switching language is lossless. */
(function(){
'use strict';
var LANGS=['ru','uk','en'],LOC={ru:'ru-RU',uk:'uk-UA',en:'en-US'};
function detect(){var n=(navigator.language||'ru').toLowerCase();return n.indexOf('uk')===0?'uk':n.indexOf('en')===0?'en':'ru'}
var lang=(function(){try{var v=localStorage.getItem('wd:lang');if(LANGS.indexOf(v)>=0)return v}catch(e){}return detect()})();

/* ---- dictionary: [sources ('|' separated, any language), ru, uk, en] ---- */
var R=[
// navigation / generic
['Home','Главная','Головна','Home'],['Chats','Чаты','Чати','Chats'],['Wardrobe','Гардероб','Гардероб','Wardrobe'],['Outfits','Образы','Образи','Outfits'],['Settings','Настройки','Налаштування','Settings'],
['My wardrobe','Мой гардероб','Мій гардероб','My wardrobe'],['+ Add clothing','+ Добавить вещь','+ Додати річ','+ Add clothing'],['Add clothing','Добавить вещь','Додати річ','Add clothing'],
['Add clothes','Добавить вещи','Додати речі','Add clothes'],['Edit clothing','Изменить вещь','Змінити річ','Edit clothing'],
["Today's outfit",'Образ на сегодня','Образ на сьогодні',"Today's outfit"],['Save outfit','Сохранить образ','Зберегти образ','Save outfit'],
['Create outfit','Создать образ','Створити образ','Create outfit'],['Saved outfits','Сохранённые образы','Збережені образи','Saved outfits'],['Recent outfits','Недавние образы','Нещодавні образи','Recent outfits'],
['Outfit','Образ','Образ','Outfit'],['Outfit saved','Образ сохранён','Образ збережено','Outfit saved'],['Outfit deleted','Образ удалён','Образ видалено','Outfit deleted'],
['Edit','Изменить','Змінити','Edit'],['Duplicate','Дублировать','Дублювати','Duplicate'],['Delete','Удалить','Видалити','Delete'],['Cancel','Отмена','Скасувати','Cancel'],['Save','Сохранить','Зберегти','Save'],
['Reset','Сбросить','Скинути','Reset'],['Retry','Повторить','Повторити','Retry'],['OK','OK','OK','OK'],['Create','Создать','Створити','Create'],['Enter','Ввод','Ввід','Enter'],
['Outfit name','Название образа','Назва образу','Outfit name'],['Casual autumn','Осенний кэжуал','Осінній кежуал','Casual autumn'],
['Temperature range, °C (min → max)','Диапазон температур, °C (мин → макс)','Діапазон температур, °C (мін → макс)','Temperature range, °C (min → max)'],
['from','от','від','from'],['to','до','до','to'],['from, e.g. 18','от, напр. 18','від, напр. 18','from, e.g. 18'],['to, e.g. 30','до, напр. 30','до, напр. 30','to, e.g. 30'],
['Гардероб пуст.','Гардероб пуст.','Гардероб порожній.','The wardrobe is empty.'],['Добавьте первую вещь.','Добавьте первую вещь.','Додайте першу річ.','Add your first item.'],
['Образа пока нет. Нажмите «Другой образ».','Образа пока нет. Нажмите «Другой образ».','Образу поки немає. Натисніть «Інший образ».','No outfit yet. Tap “Another outfit”.'],
['Другой образ','Другой образ','Інший образ','Another outfit'],['Изменить выбор','Изменить выбор','Змінити вибір','Change selection'],
['Сохранённых образов нет.','Сохранённых образов нет.','Збережених образів немає.','No saved outfits.'],
['Нажмите «Create outfit» или сохраните образ на главной.','Нажмите «Создать образ» или сохраните образ на главной.','Натисніть «Створити образ» або збережіть образ на головній.','Tap “Create outfit” or save an outfit on the home screen.'],
['Нет вещей в этой категории','Нет вещей в этой категории','Немає речей у цій категорії','No items in this category'],
['Прогноз изменился с момента подбора — нажмите «Другой образ».','Прогноз изменился с момента подбора — нажмите «Другой образ».','Прогноз змінився з моменту підбору — натисніть «Інший образ».','The forecast has changed since this was picked — tap “Another outfit”.'],
['Вещи удалены из гардероба','Вещи удалены из гардероба','Речі видалено з гардероба','Items were removed from the wardrobe'],
['подходит сегодня','подходит сегодня','підходить сьогодні','fits today'],['демо','демо','демо','demo'],
['Из выбранных вами вещей (картинки-образцы, не ваши фото).','Из выбранных вами вещей (картинки-образцы, не ваши фото).','З вибраних вами речей (картинки-зразки, не ваші фото).','From the items you picked (sample pictures, not your photos).'],
['Часть вещей — демо-образцы, не из вашего гардероба.','Часть вещей — демо-образцы, не из вашего гардероба.','Частина речей — демо-зразки, не з вашого гардероба.','Some items are demo samples, not from your wardrobe.'],
['Часть вещей — демо-образцы','Часть вещей — демо-образцы','Частина речей — демо-зразки','Some items are demo samples'],
['(помечены «демо»): в вашем гардеробе нет вещей этой группы. Они не добавлены в гардероб.','(помечены «демо»): в вашем гардеробе нет вещей этой группы. Они не добавлены в гардероб.','(позначені «демо»): у вашому гардеробі немає речей цієї групи. Їх не додано до гардероба.','(marked “demo”): your wardrobe has no items of this kind. They were not added to the wardrobe.'],
['Образ из выбранных вами вещей:','Образ из выбранных вами вещей:','Образ із вибраних вами речей:','Outfit from the items you picked:'],
['Демо: этих вещей нет в вашем гардеробе','Демо: этих вещей нет в вашем гардеробе','Демо: цих речей немає у вашому гардеробі','Demo: you don’t have these items'],
// picker
['Ваш гардероб','Ваш гардероб','Ваш гардероб','Your wardrobe'],
['Отметьте, какие вещи у вас есть: выберите похожие на ваши. Отмеченные вещи добавятся в ваш гардероб, образы подберём из них. Нажмите на вещь ещё раз, чтобы снять отметку. Свои фото можно добавить кнопкой +.','Отметьте, какие вещи у вас есть: выберите похожие на ваши. Отмеченные вещи добавятся в ваш гардероб, образы подберём из них. Нажмите на вещь ещё раз, чтобы снять отметку. Свои фото можно добавить кнопкой +.','Позначте, які речі у вас є: оберіть схожі на ваші. Позначені речі додадуться до вашого гардероба, образи підберемо з них. Натисніть на річ ще раз, щоб зняти позначку. Свої фото можна додати кнопкою +.','Tick the items you own: pick the ones that look like yours. Ticked items are added to your wardrobe and outfits are built from them. Tap an item again to untick it. You can add your own photos with the + button.'],
['Пересобрать гардероб','Пересобрать гардероб','Зібрати гардероб заново','Rebuild wardrobe'],
['Пересобрать гардероб? Все текущие вещи будут удалены, и вы выберете одежду заново.','Пересобрать гардероб? Все текущие вещи будут удалены, и вы выберете одежду заново.','Зібрати гардероб заново? Усі поточні речі буде видалено, і ви оберете одяг наново.','Rebuild the wardrobe? All current items will be deleted and you will pick your clothes again.'],
['Выбрать все','Выбрать все','Вибрати всі','Select all'],['Снять все отметки','Снять все отметки','Зняти всі позначки','Clear all'],
['Выберите минимум 2 вещи','Выберите минимум 2 вещи','Оберіть щонайменше 2 речі','Pick at least 2 items'],['Добавляю…','Добавляю…','Додаю…','Adding…'],
['Не удалось добавить вещи','Не удалось добавить вещи','Не вдалося додати речі','Could not add the items'],
['Футболки и поло','Футболки и поло','Футболки та поло','T-shirts & polos'],['Лонгсливы','Лонгсливы','Лонгсліви','Long sleeves'],['Рубашки','Рубашки','Сорочки','Shirts'],['Худи','Худи','Худі','Hoodies'],
['Свитеры','Свитеры','Светри','Sweaters'],['Куртки','Куртки','Куртки','Jackets'],['Пальто','Пальто','Пальто','Coats'],['Джинсы и брюки','Джинсы и брюки','Джинси та штани','Jeans & trousers'],
['Спортивные штаны и шорты','Спортивные штаны и шорты','Спортивні штани та шорти','Sweatpants & shorts'],['Обувь','Обувь','Взуття','Shoes'],
// categories / seasons / style / fit / pattern
['T-shirts','Футболки','Футболки','T-shirts'],['Longsleeves','Лонгсливы','Лонгсліви','Longsleeves'],['Shirts','Рубашки','Сорочки','Shirts'],['Hoodies','Худи','Худі','Hoodies'],
['Sweaters','Свитеры','Светри','Sweaters'],['Jackets','Куртки','Куртки','Jackets'],['Coats','Пальто','Пальто','Coats'],['Pants','Брюки','Штани','Pants'],['Sweatpants','Спортивные штаны','Спортивні штани','Sweatpants'],
['Jeans','Джинсы','Джинси','Jeans'],['Shorts','Шорты','Шорти','Shorts'],['Shoes','Обувь','Взуття','Shoes'],['Sneakers','Кроссовки','Кросівки','Sneakers'],['Canvas shoes','Кеды','Кеди','Canvas shoes'],['Accessories','Аксессуары','Аксесуари','Accessories'],
['All year','Круглый год','Цілий рік','All year'],['Summer','Лето','Літо','Summer'],['Autumn','Осень','Осінь','Autumn'],['Winter','Зима','Зима','Winter'],['Spring','Весна','Весна','Spring'],
['streetwear','стритвир','стрітвір','streetwear'],['casual','кэжуал','кежуал','casual'],['minimalism','минимализм','мінімалізм','minimalism'],['smart casual','смарт-кэжуал','смарт-кежуал','smart casual'],
['sporty','спортивный','спортивний','sporty'],['old money','old money','old money','old money'],['grunge','гранж','ґрандж','grunge'],
['oversized','оверсайз','оверсайз','oversized'],['loose','свободная','вільна','loose'],['regular','обычная','звичайна','regular'],['slim','узкая','вузька','slim'],['fitted','приталенная','приталена','fitted'],
['solid','однотонная','однотонна','solid'],['striped','в полоску','у смужку','striped'],['checked','в клетку','у клітинку','checked'],['graphic','с принтом','з принтом','graphic'],['logo','с логотипом','з логотипом','logo'],['other','другое','інше','other'],
['Photo','Фото','Фото','Photo'],['Gallery','Галерея','Галерея','Gallery'],['Camera','Камера','Камера','Camera'],['Upload photo','Загрузить фото','Завантажити фото','Upload photo'],
['Category','Категория','Категорія','Category'],['Color','Цвет','Колір','Color'],['Detected colours','Найденные цвета','Знайдені кольори','Detected colours'],['Auto','Авто','Авто','Auto'],
['Style · fit · pattern','Стиль · крой · принт','Стиль · крій · принт','Style · fit · pattern'],['Style: auto','Стиль: авто','Стиль: авто','Style: auto'],['Fit: auto','Крой: авто','Крій: авто','Fit: auto'],['Pattern: auto','Принт: авто','Принт: авто','Pattern: auto'],
['Season','Сезон','Сезон','Season'],['Warmth (1 light – 5 very warm)','Тепло (1 лёгкая – 5 очень тёплая)','Тепло (1 легка – 5 дуже тепла)','Warmth (1 light – 5 very warm)'],
['Suitable for rain','Подходит для дождя','Підходить для дощу','Suitable for rain'],['Wind resistant','Не продувается','Не продувається','Wind resistant'],
['Comfort range °C (optional)','Комфортный диапазон °C (необязательно)','Комфортний діапазон °C (необов’язково)','Comfort range °C (optional)'],
['Black jacket','Чёрная куртка','Чорна куртка','Black jacket'],['Black','Чёрный','Чорний','Black'],['Correct colour','Исправить цвет','Виправити колір','Correct colour'],
['AI analyze','Анализ по фото','Аналіз за фото','Analyse photo'],['Показать исходное фото','Показать исходное фото','Показати вихідне фото','Show original photo'],['Вырезать фон','Вырезать фон','Вирізати фон','Cut out background'],
['вручную','вручную','вручну','manual'],['по фото','по фото','за фото','from photo'],['ИИ','ИИ','ШІ','AI'],['по названию','по названию','за назвою','from name'],
['Цвет определён неуверенно — проверьте и при необходимости исправьте.','Цвет определён неуверенно — проверьте и при необходимости исправьте.','Колір визначено невпевнено — перевірте та за потреби виправте.','The colour is uncertain — check it and correct if needed.'],
['Пальто','Пальто','Пальто','Coats'],
// colours (Russian names are produced by the app)
['чёрный','чёрный','чорний','black'],['белый','белый','білий','white'],['серый','серый','сірий','grey'],['тёмно-серый','тёмно-серый','темно-сірий','dark grey'],['светло-серый','светло-серый','світло-сірий','light grey'],
['бежевый','бежевый','бежевий','beige'],['коричневый','коричневый','коричневий','brown'],['красный','красный','червоний','red'],['бордовый','бордовый','бордовий','burgundy'],['розовый','розовый','рожевий','pink'],
['оранжевый','оранжевый','помаранчевий','orange'],['жёлтый','жёлтый','жовтий','yellow'],['оливковый','оливковый','оливковий','olive'],['зелёный','зелёный','зелений','green'],['бирюзовый','бирюзовый','бірюзовий','teal'],
['тёмно-синий','тёмно-синий','темно-синій','navy'],['джинсовый','джинсовый','джинсовий','denim'],['голубой','голубой','блакитний','light blue'],['синий','синий','синій','blue'],['фиолетовый','фиолетовый','фіолетовий','purple'],
// weather
['Sunny','Солнечно','Сонячно','Sunny'],['Cloudy','Облачно','Хмарно','Cloudy'],['Fog','Туман','Туман','Fog'],['Rainy','Дождь','Дощ','Rainy'],['Snow','Снег','Сніг','Snow'],['Storm','Гроза','Гроза','Storm'],['Windy','Ветрено','Вітряно','Windy'],
['Average today','Средняя за день','Середня за день','Average today'],['Low','Мин.','Мін.','Low'],['High','Макс.','Макс.','High'],['Next hours','Ближайшие часы','Найближчі години','Next hours'],['Forecast','Прогноз','Прогноз','Forecast'],
['Sun','Вс','Нд','Sun'],['Mon','Пн','Пн','Mon'],['Tue','Вт','Вт','Tue'],['Wed','Ср','Ср','Wed'],['Thu','Чт','Чт','Thu'],['Fri','Пт','Пт','Fri'],['Sat','Сб','Сб','Sat'],
['Daytime','Днём','Вдень','Daytime'],['Daytime only','Только днём','Тільки вдень','Daytime only'],['Copy account ID','Скопировать ID аккаунта','Скопіювати ID акаунта','Copy account ID'],['Account ID copied','ID аккаунта скопирован','ID акаунта скопійовано','Account ID copied'],['Morning → Day','Утро → день','Ранок → день','Morning → Day'],['Day → Evening','День → вечер','День → вечір','Day → Evening'],['Whole day','Весь день','Весь день','Whole day'],['Midday','Полдень','Полудень','Midday'],['Morning','Утро','Ранок','Morning'],['Evening','Вечер','Вечір','Evening'],
['Нет интернета — показаны сохранённые данные','Нет интернета — показаны сохранённые данные','Немає інтернету — показано збережені дані','No internet — showing saved data'],
['Нет интернета.','Нет интернета.','Немає інтернету.','No internet.'],['Демо-данные (погода недоступна)','Демо-данные (погода недоступна)','Демо-дані (погода недоступна)','Demo data (weather unavailable)'],
['Доступ к геолокации запрещён. Выберите город вручную.','Доступ к геолокации запрещён. Выберите город вручную.','Доступ до геолокації заборонено. Оберіть місто вручну.','Location access is denied. Choose a city manually.'],
['Open-Meteo недоступен.','Open-Meteo недоступен.','Open-Meteo недоступний.','Open-Meteo is unavailable.'],
['Нет связи с сервером приложения (WeatherKit).','Нет связи с сервером приложения (WeatherKit).','Немає зв’язку із сервером застосунку (WeatherKit).','Cannot reach the app server (WeatherKit).'],
['WeatherKit отклонил ключ Apple (проверьте APPLE_* в Vercel).','WeatherKit отклонил ключ Apple (проверьте APPLE_* в Vercel).','WeatherKit відхилив ключ Apple (перевірте APPLE_* у Vercel).','WeatherKit rejected the Apple key (check APPLE_* in Vercel).'],
['Лимит запросов WeatherKit исчерпан.','Лимит запросов WeatherKit исчерпан.','Ліміт запитів WeatherKit вичерпано.','The WeatherKit request limit is exhausted.'],
['WeatherKit не настроен на сервере.','WeatherKit не настроен на сервере.','WeatherKit не налаштовано на сервері.','WeatherKit is not configured on the server.'],
['Apple WeatherKit временно недоступен.','Apple WeatherKit временно недоступен.','Apple WeatherKit тимчасово недоступний.','Apple WeatherKit is temporarily unavailable.'],
['WeatherKit вернул пустой прогноз.','WeatherKit вернул пустой прогноз.','WeatherKit повернув порожній прогноз.','WeatherKit returned an empty forecast.'],
['Open-Meteo (без WeatherKit)','Open-Meteo (без WeatherKit)','Open-Meteo (без WeatherKit)','Open-Meteo (without WeatherKit)'],['Open-Meteo (по выбору)','Open-Meteo (по выбору)','Open-Meteo (за вибором)','Open-Meteo (by choice)'],
['устарело','устарело','застаріло','outdated'],['My location','Моё место','Моє місце','My location'],['Demo city','Демо-город','Демо-місто','Demo city'],
['Город не найден','Город не найден','Місто не знайдено','City not found'],['Поиск города недоступен. Проверьте соединение.','Поиск города недоступен. Проверьте соединение.','Пошук міста недоступний. Перевірте з’єднання.','City search is unavailable. Check your connection.'],
['Weather Wardrobe','Погодный гардероб','Погодний гардероб','Weather Wardrobe'],
// settings
['Name','Имя','Ім’я','Name'],['City','Город','Місто','City'],['Use my location','Моё местоположение','Моє місцезнаходження','Use my location'],['Detect','Определить','Визначити','Detect'],
['Language','Язык','Мова','Language'],['Units','Единицы','Одиниці','Units'],['Weather source','Источник погоды','Джерело погоди','Weather source'],
['Auto (WeatherKit if configured)','Авто (WeatherKit, если настроен)','Авто (WeatherKit, якщо налаштовано)','Auto (WeatherKit if configured)'],['Open-Meteo only','Только Open-Meteo','Лише Open-Meteo','Open-Meteo only'],
['Outfit weather range','Период погоды для образа','Період погоди для образу','Outfit weather range'],['Preferred style','Любимый стиль','Улюблений стиль','Preferred style'],['Any','Любой','Будь-який','Any'],
['Favorite colors','Любимые цвета','Улюблені кольори','Favorite colors'],['Avoid combinations','Избегать сочетаний','Уникати поєднань','Avoid combinations'],
['black, beige, blue','чёрный, бежевый, синий','чорний, бежевий, синій','black, beige, blue'],['red+green, black+brown','красный+зелёный, чёрный+коричневый','червоний+зелений, чорний+коричневий','red+green, black+brown'],
['Layering','Слои одежды','Шари одягу','Layering'],['Balanced','Сбалансированно','Збалансовано','Balanced'],['Light (fewer layers)','Легко (меньше слоёв)','Легко (менше шарів)','Light (fewer layers)'],['Layered','Многослойно','Багатошарово','Layered'],
['Comfort temperature °C','Комфортная температура, °C','Комфортна температура, °C','Comfort temperature °C'],['Theme','Тема','Тема','Theme'],['Light','Светлая','Світла','Light'],['Dark','Тёмная','Темна','Dark'],['Glass','Стекло','Скло','Glass'],
['Home layout','Расположение на главной','Розташування на головній','Home layout'],['Notifications','Уведомления','Сповіщення','Notifications'],['Banned accounts','Заблокированные аккаунты','Заблоковані акаунти','Banned accounts'],['Delete…','Удалить…','Видалити…','Delete…'],['Tab switch sound','Звук переключения вкладок','Звук перемикання вкладок','Tab switch sound'],['Notification','Уведомление','Сповіщення','Notification'],
['AI wardrobe analysis','Анализ гардероба','Аналіз гардероба','Wardrobe analysis'],['Re-analyse colours','Пересчитать цвета','Перерахувати кольори','Re-analyse colours'],
['Добавьте вещи, чтобы получить анализ.','Добавьте вещи, чтобы получить анализ.','Додайте речі, щоб отримати аналіз.','Add items to get an analysis.'],
['Цвета определяются на устройстве по реальным фото. Стили, крой и принт без ИИ-анализа оцениваются по категории и названию.','Цвета определяются на устройстве по реальным фото. Стили, крой и принт оцениваются по категории и названию.','Кольори визначаються на пристрої за реальними фото. Стиль, крій і принт оцінюються за категорією та назвою.','Colours are detected on your device from the real photos. Style, fit and pattern are estimated from the category and name.'],
['Вырезать фон у всех вещей','Вырезать фон у всех вещей','Вирізати фон у всіх речей','Cut out the background of all items'],['Вернуть исходные фото','Вернуть исходные фото','Повернути вихідні фото','Restore original photos'],
['Фон уже вырезан у всех вещей','Фон уже вырезан у всех вещей','Фон уже вирізано в усіх речей','The background is already cut out for all items'],
['Не удалось вырезать фон: на фото он не однотонный.','Не удалось вырезать фон: на фото он не однотонный.','Не вдалося вирізати фон: на фото він не однотонний.','Could not cut out the background: it is not uniform in the photos.'],
['Не удалось отделить фон: он не однотонный или совпадает с цветом вещи','Не удалось отделить фон: он не однотонный или совпадает с цветом вещи','Не вдалося відокремити фон: він не однотонний або збігається з кольором речі','Could not separate the background: it is not uniform or matches the item colour'],
['Исходных фото нет на этом устройстве.','Исходных фото нет на этом устройстве.','Вихідних фото немає на цьому пристрої.','There are no original photos on this device.'],['Вырезанных фото нет.','Вырезанных фото нет.','Вирізаних фото немає.','There are no cut-out photos.'],
['Анализ цветов…','Анализ цветов…','Аналіз кольорів…','Analysing colours…'],['Цвета обновлены.','Цвета обновлены.','Кольори оновлено.','Colours updated.'],
['Интеграции: API приложения недоступно (офлайн или статический хостинг)','Интеграции: API приложения недоступно (офлайн или статический хостинг)','Інтеграції: API застосунку недоступне (офлайн або статичний хостинг)','Integrations: the app API is unavailable (offline or static hosting)'],
['Данные хранятся на этом устройстве.','Данные хранятся на этом устройстве.','Дані зберігаються на цьому пристрої.','Data is stored on this device.'],
['Данные синхронизируются с вашим аккаунтом (фото образов хранятся только на устройстве).','Данные синхронизируются с вашим аккаунтом (фото образов хранятся только на устройстве).','Дані синхронізуються з вашим акаунтом (фото образів зберігаються лише на пристрої).','Data syncs with your account (outfit photos stay on this device only).'],
['На главном экране зажмите карточку, чтобы переместить её.','На главном экране зажмите карточку, чтобы переместить её.','На головному екрані втримуйте картку, щоб перемістити її.','On the home screen, press and hold a card to move it.'],
['Войти через Google нужно только для синхронизации между устройствами.','Войти через Google нужно только для синхронизации между устройствами.','Увійти через Google потрібно лише для синхронізації між пристроями.','Signing in with Google is only needed to sync between devices.'],
['Google sign-in is not configured (GOOGLE_CLIENT_ID).','Вход через Google не настроен (GOOGLE_CLIENT_ID).','Вхід через Google не налаштовано (GOOGLE_CLIENT_ID).','Google sign-in is not configured (GOOGLE_CLIENT_ID).'],
['Sign-in needs an internet connection and the app API.','Для входа нужны интернет и API приложения.','Для входу потрібні інтернет і API застосунку.','Sign-in needs an internet connection and the app API.'],
['Could not load Google sign-in. Check your connection.','Не удалось загрузить вход через Google. Проверьте соединение.','Не вдалося завантажити вхід через Google. Перевірте з’єднання.','Could not load Google sign-in. Check your connection.'],
['Wardrobe, outfits, history and settings are saved in your account.','Гардероб, образы, история и настройки сохранены в вашем аккаунте.','Гардероб, образи, історія та налаштування збережено у вашому акаунті.','Wardrobe, outfits, history and settings are saved in your account.'],
['Log out','Выйти','Вийти','Log out'],['Session expired — please sign in again','Сессия истекла — войдите снова','Сесія закінчилась — увійдіть знову','Session expired — please sign in again'],['Logged out','Вы вышли','Ви вийшли','Logged out'],
['Log out? Your data stays safe in your account.','Выйти? Ваши данные сохранятся в аккаунте.','Вийти? Ваші дані залишаться в акаунті.','Log out? Your data stays safe in your account.'],
['Some changes are not synced yet and will be lost on this device. Log out anyway?','Некоторые изменения ещё не синхронизированы и пропадут на этом устройстве. Всё равно выйти?','Деякі зміни ще не синхронізовано, і вони зникнуть на цьому пристрої. Усе одно вийти?','Some changes are not synced yet and will be lost on this device. Log out anyway?'],
['Не удалось войти через Google. Попробуйте ещё раз.','Не удалось войти через Google. Попробуйте ещё раз.','Не вдалося увійти через Google. Спробуйте ще раз.','Could not sign in with Google. Please try again.'],
['Synced','Синхронизировано','Синхронізовано','Synced'],['Syncing…','Синхронизация…','Синхронізація…','Syncing…'],['Offline — will sync when online','Офлайн — синхронизируем при подключении','Офлайн — синхронізуємо після підключення','Offline — will sync when online'],
['Sync error — will retry','Ошибка синхронизации — повторим','Помилка синхронізації — повторимо','Sync error — will retry'],['Cloud storage not configured','Облачное хранилище не настроено','Хмарне сховище не налаштовано','Cloud storage not configured'],
['Хранилище переполнено — удалите часть вещей.','Хранилище переполнено — удалите часть вещей.','Сховище переповнене — видаліть частину речей.','Storage is full — delete some items.'],
['Не удалось сохранить: на устройстве закончилось место.','Не удалось сохранить: на устройстве закончилось место.','Не вдалося зберегти: на пристрої закінчилося місце.','Could not save: the device is out of space.'],
['Удалить образ?','Удалить образ?','Видалити образ?','Delete this outfit?'],['Удалить вещь?','Удалить вещь?','Видалити річ?','Delete this item?'],
['Выберите хотя бы одну вещь','Выберите хотя бы одну вещь','Оберіть хоча б одну річ','Pick at least one item'],['Загрузите фото','Загрузите фото','Завантажте фото','Upload a photo'],['Укажите название','Укажите название','Вкажіть назву','Enter a name'],
['Не удалось прочитать фото','Не удалось прочитать фото','Не вдалося прочитати фото','Could not read the photo'],
['Образ с демо-вещами нельзя сохранить: их нет в гардеробе','Образ с демо-вещами нельзя сохранить: их нет в гардеробе','Образ із демо-речами не можна зберегти: їх немає в гардеробі','An outfit with demo items can’t be saved: they are not in your wardrobe'],
['Top','Верх','Верх','Top'],['Bottom','Низ','Низ','Bottom'],['Outerwear','Верхняя одежда','Верхній одяг','Outerwear'],
['подходящего верха','подходящего верха','відповідного верху','a suitable top'],['подходящих брюк или шорт','подходящих брюк или шорт','відповідних штанів або шортів','suitable trousers or shorts'],
['подходящей обуви','подходящей обуви','відповідного взуття','suitable shoes'],['подходящей верхней одежды','подходящей верхней одежды','відповідного верхнього одягу','suitable outerwear'],
['Футболки достаточно — верхний слой не нужен.','Футболки достаточно — верхний слой не нужен.','Футболки достатньо — верхній шар не потрібен.','A T-shirt is enough — no outer layer needed.'],
['Дополнительный верхний слой не нужен.','Дополнительный верхний слой не нужен.','Додатковий верхній шар не потрібен.','No extra outer layer needed.'],
['Не хватает тёплых вещей — выбрано самое тёплое из доступного.','Не хватает тёплых вещей — выбрано самое тёплое из доступного.','Бракує теплих речей — вибрано найтепліше з наявного.','Not enough warm items — the warmest available was chosen.'],
['Лёгких вещей для такой погоды нет — выбрано самое лёгкое.','Лёгких вещей для такой погоды нет — выбрано самое лёгкое.','Легких речей для такої погоди немає — вибрано найлегше.','No light items for this weather — the lightest available was chosen.'],
['Снег — тёплая непромокаемая обувь.','Снег — тёплая непромокаемая обувь.','Сніг — тепле водонепроникне взуття.','Snow — warm waterproof shoes.'],
['Сильный ветер — куртка защищает от ветра.','Сильный ветер — куртка защищает от ветра.','Сильний вітер — куртка захищає від вітру.','Strong wind — the jacket blocks the wind.'],['Сильный ветер.','Сильный ветер.','Сильний вітер.','Strong wind.'],
// demo catalogue names
['White T-shirt','Белая футболка','Біла футболка','White T-shirt'],['Black T-shirt','Чёрная футболка','Чорна футболка','Black T-shirt'],['Grey melange T-shirt','Серая футболка меланж','Сіра футболка меланж','Grey melange T-shirt'],
['Navy striped longsleeve','Тёмно-синий лонгслив в полоску','Темно-синій лонгслів у смужку','Navy striped longsleeve'],['White Oxford shirt','Белая рубашка оксфорд','Біла сорочка оксфорд','White Oxford shirt'],
['Light blue Oxford shirt','Голубая рубашка оксфорд','Блакитна сорочка оксфорд','Light blue Oxford shirt'],['Grey hoodie','Серое худи','Сіре худі','Grey hoodie'],['Navy knit sweater','Тёмно-синий вязаный свитер','Темно-синій в’язаний светр','Navy knit sweater'],
['Beige cable-knit sweater','Бежевый свитер с косами','Бежевий светр із косами','Beige cable-knit sweater'],['Blue jeans','Синие джинсы','Сині джинси','Blue jeans'],['Black jeans','Чёрные джинсы','Чорні джинси','Black jeans'],
['Beige chinos','Бежевые чиносы','Бежеві чиноси','Beige chinos'],['Black trousers','Чёрные брюки','Чорні штани','Black trousers'],['Grey sweatpants','Серые спортивные штаны','Сірі спортивні штани','Grey sweatpants'],
['Light denim shorts','Светлые джинсовые шорты','Світлі джинсові шорти','Light denim shorts'],['Black quilted bomber jacket','Чёрный стёганый бомбер','Чорний стьобаний бомбер','Black quilted bomber jacket'],
['Navy hooded rain jacket','Тёмно-синяя дождевик-куртка с капюшоном','Темно-синя куртка-дощовик з капюшоном','Navy hooded rain jacket'],['Blue denim jacket','Синяя джинсовая куртка','Синя джинсова куртка','Blue denim jacket'],
['Black wool coat','Чёрное шерстяное пальто','Чорне вовняне пальто','Black wool coat'],['Beige trench coat','Бежевый тренчкот','Бежевий тренчкот','Beige trench coat'],
['White leather sneakers','Белые кожаные кроссовки','Білі шкіряні кросівки','White leather sneakers'],['Black running sneakers','Чёрные беговые кроссовки','Чорні бігові кросівки','Black running sneakers'],
['Brown leather loafers','Коричневые кожаные лоферы','Коричневі шкіряні лофери','Brown leather loafers'],['Light blue flared jeans','Голубые расклешённые джинсы','Блакитні розкльошені джинси','Light blue flared jeans'],
['Black flared jeans with blue inserts','Чёрные расклешённые джинсы с синими вставками','Чорні розкльошені джинси із синіми вставками','Black flared jeans with blue inserts'],['Black wide-leg carpenter jeans','Чёрные широкие джинсы-карпентеры','Чорні широкі джинси-карпентери','Black wide-leg carpenter jeans'],
['Black polo shirt','Чёрная рубашка поло','Чорна сорочка поло','Black polo shirt'],['White polo shirt','Белая рубашка поло','Біла сорочка поло','White polo shirt'],['Black zip hoodie with fleece lining','Чёрное худи на молнии с флисом','Чорне худі на блискавці з флісом','Black zip hoodie with fleece lining'],
['Black quarter-zip cable sweater','Чёрный свитер с косами на короткой молнии','Чорний светр із косами на короткій блискавці','Black quarter-zip cable sweater'],['Black cable-knit sweater','Чёрный свитер с косами','Чорний светр із косами','Black cable-knit sweater'],
['White cable-knit sweater','Белый свитер с косами','Білий светр із косами','White cable-knit sweater'],['Grey cable-knit sweater','Серый свитер с косами','Сірий светр із косами','Grey cable-knit sweater'],['Pink cable-knit sweater','Розовый свитер с косами','Рожевий светр із косами','Pink cable-knit sweater'],
['White and grey leather sneakers with gum sole','Бело-серые кожаные кроссовки на каучуковой подошве','Біло-сірі шкіряні кросівки на каучуковій підошві','White and grey leather sneakers with gum sole'],
['Black leather sneakers with gum sole','Чёрные кожаные кроссовки на каучуковой подошве','Чорні шкіряні кросівки на каучуковій підошві','Black leather sneakers with gum sole'],
['Black washed jacket with high collar','Чёрная варёная куртка с высоким воротником','Чорна варена куртка з високим коміром','Black washed jacket with high collar'],['Black hooded puffer jacket','Чёрный пуховик с капюшоном','Чорний пуховик з капюшоном','Black hooded puffer jacket'],
['Black denim jacket','Чёрная джинсовая куртка','Чорна джинсова куртка','Black denim jacket'],['White hooded puffer jacket','Белый пуховик с капюшоном','Білий пуховик з капюшоном','White hooded puffer jacket'],
['Beige suede jacket with chest pockets','Бежевая замшевая куртка с нагрудными карманами','Бежева замшева куртка з нагрудними кишенями','Beige suede jacket with chest pockets']
];

/* ---- sentence patterns (source text is the app's native Russian/English). $1.. are translated captures ---- */
var P=[];
function p(re,ru,uk,en,fn,multi){P.push({re:re,t:{ru:ru,uk:uk,en:en},fn:fn,multi:multi})}
p(/^Подобрано для (.+)\.$/,'Подобрано для $1.','Підібрано для $1.','Picked for $1.');
p(/^В начале прохладно — добавлена верхняя одежда \((.+)\), позже её можно снять\.$/,'В начале прохладно — добавлена верхняя одежда ($1), позже её можно снять.','Спочатку прохолодно — додано верхній одяг ($1), пізніше його можна зняти.','It is cool at first — an outer layer ($1) was added; you can take it off later.');
p(/^К концу похолодает — возьмите (.+)\.$/,'К концу похолодает — возьмите $1.','Надвечір похолодає — візьміть $1.','It gets colder later — take $1.');
p(/^(.+) понадобится весь период\.$/,'$1 понадобится весь период.','$1 знадобиться весь період.','You will need $1 for the whole period.');
p(/^Дождь(?: \((\d+)%\))?: (есть водостойкая вещь|водостойких вещей нет)\.$/,'','','',function(m,L){var pc=m[1]?' ('+m[1]+'%)':'',ok=m[2]==='есть водостойкая вещь';return L==='ru'?'Дождь'+pc+(ok?': есть водостойкая вещь.':': водостойких вещей нет.'):L==='uk'?'Дощ'+pc+(ok?': є водостійка річ.':': водостійких речей немає.'):'Rain'+pc+(ok?': there is a water-resistant item.':': no water-resistant items.')});
p(/^Палитра: (.+?)( — нейтральная гамма| — один акцент)?\.$/,'','','',function(m,L,tr){var names=m[1].split(' + ').map(tr).join(' + '),neu=m[2]===' — нейтральная гамма',acc=m[2]===' — один акцент',h={ru:'Палитра: ',uk:'Палітра: ',en:'Palette: '}[L];return h+names+(neu?{ru:' — нейтральная гамма',uk:' — нейтральна гама',en:' — a neutral palette'}[L]:acc?{ru:' — один акцент',uk:' — один акцент',en:' — a single accent'}[L]:'')+'.'});
p(/^Стиль: (.+?)( \(ваш любимый\))?\.$/,'','','',function(m,L,tr){return {ru:'Стиль: ',uk:'Стиль: ',en:'Style: '}[L]+tr(m[1])+(m[2]?{ru:' (ваш любимый)',uk:' (ваш улюблений)',en:' (your favourite)'}[L]:'')+'.'});
p(/^Есть любимый цвет: (.+)\.$/,'Есть любимый цвет: $1.','Є улюблений колір: $1.','Includes a favourite colour: $1.');
p(/^Средняя температура сегодня: (.+)$/,'Средняя температура сегодня: $1','Середня температура сьогодні: $1','Average temperature today: $1');
p(/^Подходит для: (.+)$/,'Подходит для: $1','Підходить для: $1','Suitable for: $1');
p(/^warm (\d)\/5$/,'тепло $1/5','тепло $1/5','warm $1/5');
p(/^feels (.+)$/,'ощущается $1','відчувається $1','feels $1');
p(/^rain (\d+)%$/,'дождь $1%','дощ $1%','rain $1%');
p(/^([\d.,]+) m\/s$/,'$1 м/с','$1 м/с','$1 m/s');
p(/^Signed in as (.+)$/,'Вы вошли как $1','Ви увійшли як $1','Signed in as $1');
p(/^Добавить в гардероб \((\d+)\)$/,'Добавить в гардероб ($1)','Додати до гардероба ($1)','Add to wardrobe ($1)');
p(/^Добавлено в гардероб: (\d+)$/,'Добавлено в гардероб: $1','Додано до гардероба: $1','Added to wardrobe: $1');
p(/^Вырезаю фон: (\d+)\/(\d+)$/,'Вырезаю фон: $1/$2','Вирізаю фон: $1/$2','Cutting out backgrounds: $1/$2');
p(/^Фон вырезан у (\d+) из (\d+) вещей\.$/,'Фон вырезан у $1 из $2 вещей.','Фон вирізано в $1 з $2 речей.','Background cut out for $1 of $2 items.');
p(/^Исходные фото возвращены у (\d+) вещей\.(?: У (\d+) исходного фото нет \(оно хранится только на устройстве, где вещь добавлена\)\.)?$/,'','','',function(m,L){var a=m[1],b=m[2];return {ru:'Исходные фото возвращены у '+a+' вещей.'+(b?' У '+b+' исходного фото нет (оно хранится только на устройстве, где вещь добавлена).':''),uk:'Вихідні фото повернуто в '+a+' речей.'+(b?' У '+b+' вихідного фото немає (воно зберігається лише на пристрої, де річ додано).':''),en:'Original photos restored for '+a+' items.'+(b?' '+b+' have no original (it is kept only on the device where the item was added).':'')}[L]},1);
p(/^Анализ цветов по фото: (\d+)\/(\d+) вещ\. · нейтральных: (\d+)% · доминирующий стиль: (.+?)(?: · неуверенный цвет: (\d+) \(проверьте в карточке вещи\))?$/,'','','',function(m,L,tr){var st=m[4].split(', ').map(tr).join(', ');return {ru:'Анализ цветов по фото: '+m[1]+'/'+m[2]+' вещ. · нейтральных: '+m[3]+'% · доминирующий стиль: '+st+(m[5]?' · неуверенный цвет: '+m[5]+' (проверьте в карточке вещи)':''),uk:'Аналіз кольорів за фото: '+m[1]+'/'+m[2]+' реч. · нейтральних: '+m[3]+'% · домінуючий стиль: '+st+(m[5]?' · невпевнений колір: '+m[5]+' (перевірте в картці речі)':''),en:'Colour analysis from photos: '+m[1]+'/'+m[2]+' items · neutral: '+m[3]+'% · dominant style: '+st+(m[5]?' · uncertain colour: '+m[5]+' (check the item card)':'')}[L]});
p(/^Интеграции: вход Google (\S) · хранилище (\S) · WeatherKit (\S)$/,'Интеграции: вход Google $1 · хранилище $2 · WeatherKit $3','Інтеграції: вхід Google $1 · сховище $2 · WeatherKit $3','Integrations: Google sign-in $1 · storage $2 · WeatherKit $3');
p(/^Не удалось получить погоду \((.+)\)\.$/,'Не удалось получить погоду ($1).','Не вдалося отримати погоду ($1).','Could not get the weather ($1).');
p(/^Последнее (успешное )?обновление: (.+?) \((.+)\)\.$/,'','','',function(m,L,tr){var ok=!!m[1];return {ru:'Последнее '+(ok?'успешное ':'')+'обновление: '+m[2]+' ('+tr(m[3])+').',uk:'Останнє '+(ok?'успішне ':'')+'оновлення: '+m[2]+' ('+tr(m[3])+').',en:'Last '+(ok?'successful ':'')+'update: '+m[2]+' ('+tr(m[3])+').'}[L]});
p(/^Вырезаю фон$/,'Вырезаю фон','Вирізаю фон','Cutting out backgrounds');

/* ---- engine ---- */
var map={};
R.forEach(function(r,i){r[0].split('|').concat([r[1],r[2],r[3]]).forEach(function(k){if(!(k in map))map[k]=i})});
var cache={};
function sub(tpl,m,tr){return tpl.replace(/\$(\d)/g,function(_,n){return m[+n]==null?'':tr(m[+n])})}
function T(core){
  if(core in map)return R[map[core]][LANGS.indexOf(lang)+1];
  var i,q,m;
  for(i=0;i<P.length;i++){q=P[i];if(q.multi&&(m=core.match(q.re)))return q.fn?q.fn(m,lang,tr1):sub(q.t[lang],m,tr1)}
  var s=core.split(/(?<=[.!?])\s+(?=[А-ЯЁІЇЄA-Z«])/);
  if(s.length>1)return s.map(T).join(' ');
  for(i=0;i<P.length;i++){q=P[i];if(!q.multi&&(m=core.match(q.re)))return q.fn?q.fn(m,lang,tr1):sub(q.t[lang],m,tr1)}
  if(core.slice(0,2)==='· ')return '· '+T(core.slice(2));
  if(core.slice(-2)===' ·')return T(core.slice(0,-2))+' ·';
  var g=core.split(' · ');
  if(g.length>1)return g.map(T).join(' · ');
  return core;
}
function tr1(x){return tr(x)}
function tr(s){
  if(!s||!/[A-Za-zА-Яа-яІіЇїЄє]/.test(s))return s;
  var m=s.match(/^(\s*)([\s\S]*?)(\s*)$/),core=m[2];if(!core)return s;
  var k=lang+'|'+core,v=cache[k];if(v===undefined){v=T(core);cache[k]=v}
  return m[1]+v+m[3];
}
var ATTRS=['placeholder','title','aria-label','alt'],busy=false;
function txt(n,force){
  var p=n.parentNode;if(p&&(p.nodeName==='SCRIPT'||p.nodeName==='STYLE'||p.nodeName==='TEXTAREA'||(p.closest&&p.closest('[data-nt]'))))return;
  var v=n.nodeValue;
  if(n.__t!==undefined&&v===n.__t){if(!force)return;v=n.__o}else n.__o=v;
  var t=tr(v);n.__t=t;if(t!==n.nodeValue)n.nodeValue=t;
}
function attrs(e,force){
  for(var i=0;i<ATTRS.length;i++){var a=ATTRS[i];if(!e.hasAttribute(a))continue;var v=e.getAttribute(a),st=e.__a||(e.__a={}),r=st[a];
    if(r&&r.t===v){if(!force)continue;v=r.o}else r=st[a]={o:v};
    var t=tr(v);r.t=t;if(t!==e.getAttribute(a))e.setAttribute(a,t)}
}
function walk(root,force){
  if(root.nodeType===3){txt(root,force);return}
  if(root.nodeType!==1)return;
  attrs(root,force);
  var w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT),n;
  while(n=w.nextNode()){n.nodeType===3?txt(n,force):attrs(n,force)}
}
var obs=null;
function run(fn){busy=true;try{fn()}finally{busy=false}}
function start(){
  if(obs)return;
  obs=new MutationObserver(function(ms){
    if(busy)return;busy=true;
    try{ms.forEach(function(m){
      if(m.type==='childList')m.addedNodes.forEach(function(n){walk(n)});
      else if(m.type==='characterData')txt(m.target);
      else if(m.type==='attributes')attrs(m.target)})}finally{busy=false}
  });
  obs.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  document.documentElement.lang=lang;walk(document.body);
}
function set(l,persist){
  if(LANGS.indexOf(l)<0)l=detect();
  var ch=l!==lang;lang=l;
  if(persist!==false){try{localStorage.setItem('wd:lang',l)}catch(e){}}
  document.documentElement.lang=l;
  if(document.body)run(function(){walk(document.body,true)});
  return ch;
}
var nativeAlert=window.alert,nativeConfirm=window.confirm;
window.alert=function(m){return nativeAlert.call(window,tr(String(m)))};
window.confirm=function(m){return nativeConfirm.call(window,tr(String(m)))};
window.I18N={get lang(){return lang},get loc(){return LOC[lang]},langs:LANGS,detect:detect,set:set,tr:tr,start:start,
  names:{ru:'Русский',uk:'Українська',en:'English'}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
