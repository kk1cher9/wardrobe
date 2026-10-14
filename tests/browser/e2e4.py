# Languages (ru / uk / en) + offline availability of the demo pictures.
import os,subprocess,time,sys,re
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.dirname(os.path.dirname(HERE))
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 9414
srv=subprocess.Popen(['node','dev-server.js'],cwd=ROOT,env={**os.environ,'PORT':str(PORT),'ALLOW_MEMORY_DB':'1'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.2)

def pick(pg,i):
    pg.evaluate("id=>{const t=document.querySelector('.pt[data-id=\"'+id+'\"]');const g=t.closest('.gp');if(!g.classList.contains('open'))g.querySelector('.gh').click()}",'demo-'+i);pg.wait_for_timeout(60);pg.click(f'.pt[data-id="demo-{i}"]')
res=[]
def ok(n,c,d=''):res.append(bool(c));print('PASS' if c else 'FAIL',n,d)
wx={"current":{"temperature_2m":12,"apparent_temperature":9,"relative_humidity_2m":70,"precipitation":0,"weather_code":3,"wind_speed_10m":4},"hourly":{"time":[f"2026-10-11T{h:02d}:00" for h in range(24)],"temperature_2m":[6+(h if h<14 else 28-h)*0.6 for h in range(24)],"apparent_temperature":[4+(h if h<14 else 28-h)*0.6 for h in range(24)],"wind_speed_10m":[4]*24,"precipitation_probability":[20]*24,"weather_code":[3]*24},"daily":{"time":["2026-10-11","2026-10-12"],"temperature_2m_max":[14,13],"temperature_2m_min":[4,5],"precipitation_probability_max":[20,30],"weather_code":[3,3],"wind_speed_10m_max":[5,5]},"timezone":"Europe/Kyiv"}
def mk(b,loc):
    c=b.new_context(viewport={'width':390,'height':844},locale=loc);pg=c.new_page()
    pg.route('**/api.open-meteo.com/**',lambda r:r.fulfill(json=wx));pg.route('**/geocoding-api.open-meteo.com/**',lambda r:r.fulfill(json={"results":[]}))
    return c,pg
CITY="localStorage.setItem('wd:set',JSON.stringify({city:{name:'Kyiv',lat:50.45,lon:30.52,tz:'Europe/Kyiv',cc:'UA'},unit:'C'}))"
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium' if os.path.exists('/opt/pw-browsers/chromium') else None)
    errs=[]
    for loc,exp in [('ru-RU','ru'),('uk-UA','uk'),('en-US','en'),('de-DE','ru')]:
        c,pg=mk(b,loc);pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(f'http://localhost:{PORT}/');pg.evaluate(CITY);pg.reload();pg.wait_for_timeout(1500)
        ok(f'default language for browser {loc} is {exp}',pg.evaluate('I18N.lang')==exp and pg.evaluate('document.documentElement.lang')==exp)
        c.close()
    c,pg=mk(b,'ru-RU');pg.on('pageerror',lambda e:errs.append(str(e)))
    dl=[];pg.on('dialog',lambda d:(dl.append(d.message),d.accept()))
    pg.goto(f'http://localhost:{PORT}/');pg.evaluate(CITY);pg.reload();pg.wait_for_timeout(1500)
    pg.wait_for_selector('.gp')
    tc=pg.evaluate('document.body.textContent');ok('picker is Russian','Футболки и поло' in tc and 'Выбрать все' in tc)
    for i in ['tee-white','jeans-blue','sneakers-white','jacket-denim']: pick(pg,i)
    pg.click('#pgo');pg.wait_for_function("S.items.length===4",timeout=10000);pg.wait_for_timeout(800)
    pg.evaluate("go('settings')");pg.wait_for_timeout(500)
    ok('language selector lists 3 languages',pg.evaluate("[...document.querySelectorAll('select')].some(s=>[...s.options].map(o=>o.value).join()==='ru,uk,en')"))
    def lang_sel(v):
        pg.evaluate("v=>{const s=[...document.querySelectorAll('select')].find(s=>[...s.options].map(o=>o.value).join()==='ru,uk,en');s.value=v;s.dispatchEvent(new Event('change'))}",v);pg.wait_for_timeout(700)
    for v,want,bad in [('uk','Налаштування|Тема|Мова','[ыэё]'),('en','Settings|Theme|Language','[А-Яа-я]{3,}'),('ru','Тема|Язык|Настройки','')]:
        lang_sel(v);t=pg.inner_text('body')
        ok(f'switching to {v} translates the settings screen',all(re.search(w,t,re.I) for w in want.split('|')))
        if bad:
            left=[x for x in pg.evaluate("[...document.querySelectorAll('body *')].filter(e=>e.children.length===0).map(e=>e.textContent)") if re.search(bad,x) and not re.search('Русский|Українська|CEO',x)]
            ok(f'  nothing left over in {v}',not left,str(left[:5]))
        ok(f'  {v}: lang stored',pg.evaluate("localStorage.getItem('wd:lang')")==v and pg.evaluate("I18N.lang")==v and pg.evaluate("S.set.lang")==v)
    lang_sel('uk')
    pg.reload();pg.wait_for_timeout(1500)
    ok('language survives a reload',pg.evaluate('I18N.lang')=='uk' and 'Гардероб' in pg.inner_text('body'))
    pg.evaluate("go('wardrobe')");pg.wait_for_timeout(500);pg.evaluate("document.querySelectorAll('.gp').forEach(g=>g.classList.add('open'))");pg.wait_for_timeout(500);t=pg.inner_text('body')
    ok('uk: demo item names translated in the wardrobe',re.search('Біла футболка',t,re.I) is not None and 'White T-shirt' not in t)
    pg.evaluate("openItem(S.items[0].id)");pg.wait_for_timeout(500);ok('option values stay English internally',pg.evaluate("document.querySelector('#f_c').value===S.items[0].cat&&/^[A-Z]/.test(S.items[0].cat)"))
    pg.click('#cx');pg.wait_for_timeout(300)
    pg.evaluate("go('home')");pg.wait_for_timeout(600);t=pg.inner_text('body')
    ok('uk: home outfit text is Ukrainian',re.search('Підібрано для',t) is not None and not re.search('Подобрано|Picked for',t))
    pg.evaluate("alert('Удалить вещь?')");ok('alert text translated (uk)',dl and dl[-1]=='Видалити річ?',str(dl))
    pg.evaluate("go('settings')");pg.wait_for_timeout(300);lang_sel('en')
    pg.evaluate("go('home')");pg.wait_for_timeout(600);t=pg.inner_text('body')
    ok('en: home outfit text is English',re.search('Picked for',t) is not None and not re.search('[А-Яа-я]{4,}',t),t[:200])
    ok('no JS errors',not errs,str(errs))
    c.close()
    c,pg=mk(b,'ru-RU')
    pg.goto(f'http://localhost:{PORT}/');pg.evaluate(CITY);pg.reload()
    pg.evaluate("navigator.serviceWorker.ready.then(()=>1)");pg.wait_for_timeout(3500)
    n=pg.evaluate("caches.keys().then(async k=>{let n=0;for(const x of k){n+=(await (await caches.open(x)).keys()).filter(r=>/\\/demo\\/.*\\.webp$/.test(r.url)).length}return n})")
    files=len([f for f in os.listdir(os.path.join(ROOT,'demo')) if f.endswith('.webp')])
    ok(f'service worker precached all {files} demo pictures',n==files,f'{n}/{files}')
    c.set_offline(True);pg.reload();pg.wait_for_timeout(2500);pg.evaluate("document.querySelectorAll('.gp').forEach(g=>g.classList.add('open'))");pg.wait_for_timeout(1500)
    done=pg.evaluate("[...document.querySelectorAll('.pt img')].filter(i=>i.complete&&i.naturalWidth>0).length")
    tot=pg.evaluate("document.querySelectorAll('.pt img').length")
    ok('offline: picker tiles show their pictures',tot>=40 and done==tot,f'{done}/{tot}')
    c.close();b.close()
finally: srv.terminate()
print('RESULT',sum(res),'/',len(res));sys.exit(0 if all(res) else 1)
