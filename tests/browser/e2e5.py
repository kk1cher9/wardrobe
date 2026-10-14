import os,subprocess,time,sys
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))));PORT=9415
srv=subprocess.Popen(['node','dev-server.js'],cwd=ROOT,env={**os.environ,'PORT':str(PORT),'ALLOW_MEMORY_DB':'1'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.2)

def pick(pg,i):
    pg.evaluate("id=>{const t=document.querySelector('.pt[data-id=\"'+id+'\"]');const g=t.closest('.gp');if(!g.classList.contains('open'))g.querySelector('.gh').click()}",'demo-'+i);pg.wait_for_timeout(60);pg.click(f'.pt[data-id="demo-{i}"]')
res=[]
def ok(n,c):res.append(bool(c));print('PASS' if c else 'FAIL',n)
wx={"current":{"temperature_2m":12,"apparent_temperature":9,"relative_humidity_2m":70,"precipitation":0,"weather_code":3,"wind_speed_10m":4},"hourly":{"time":[f"2026-10-11T{h:02d}:00" for h in range(24)],"temperature_2m":[8]*24,"apparent_temperature":[7]*24,"wind_speed_10m":[4]*24,"precipitation_probability":[20]*24,"weather_code":[3]*24},"daily":{"time":["2026-10-11","2026-10-12"],"temperature_2m_max":[14,13],"temperature_2m_min":[4,5],"precipitation_probability_max":[20,30],"weather_code":[3,3],"wind_speed_10m_max":[5,5]},"timezone":"Europe/Kyiv"}
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium');c=b.new_context(viewport={'width':390,'height':844},locale='ru-RU');pg=c.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
    pg.route('**/api.open-meteo.com/**',lambda r:r.fulfill(json=wx))
    pg.goto(f'http://localhost:{PORT}/');pg.evaluate("localStorage.setItem('wd:set',JSON.stringify({city:{name:'Kyiv',lat:50.45,lon:30.52,tz:'Europe/Kyiv',cc:'UA'},unit:'C'}))");pg.reload();pg.wait_for_selector('.gp')
    for i in ['tee-white','jeans-blue','sneakers-white']: pick(pg,i)
    pg.click('#pgo');pg.wait_for_function("S.items.length===3");pg.evaluate("go('wardrobe')");pg.wait_for_selector('#rebuild')
    ok('rebuild button shown in wardrobe',True)
    ok('wardrobe lists clothing types as collapsed panels',pg.evaluate("document.querySelectorAll('.gp').length>=2&&!document.querySelector('.gp.open')"))
    pg.click('.gh >> nth=0');ok('tapping a type opens its items',pg.evaluate("document.querySelectorAll('.gp.open').length===1&&getComputedStyle(document.querySelector('.gp.open .gb')).display==='block'"))
    pg.click('.gh >> nth=1');ok('only one type is open at a time',pg.evaluate("document.querySelectorAll('.gp.open').length===1"))
    pg.click('#rebuild');pg.wait_for_selector('.gp');pg.wait_for_timeout(500)
    ok('wardrobe emptied and picker shown with nothing ticked',pg.evaluate("S.items.length===0&&document.querySelectorAll('.pt.on').length===0&&S.tab==='home'"))
    ok('picker: types are collapsed panels with a counter',pg.evaluate("document.querySelectorAll('.gp').length===10&&!document.querySelector('.gp.open')&&[...document.querySelectorAll('.gc')].every(c=>/^0\\/\\d+$/.test(c.textContent))"))
    pick(pg,'tee-black');ok('picker: counter of the type updates',pg.evaluate("document.querySelector('.gp.open .gc').textContent.startsWith('1/')"))
    for i in ['jeans-black','sneakers-black','coat-wool']: pick(pg,i)
    pg.click('#pgo');pg.wait_for_function("S.items.length===4",timeout=10000)
    ok('new wardrobe built from the new selection',pg.evaluate("S.items.map(i=>i.name).join().includes('Black wool coat')&&!S.items.some(i=>/White T-shirt/.test(i.name))"))
    pg.reload();pg.wait_for_timeout(1500);ok('persists after reload',pg.evaluate("S.items.length===4"))
    ok('no JS errors',not errs)
    b.close()
finally: srv.terminate()
print('RESULT',sum(res),'/',len(res));sys.exit(0 if all(res) else 1)
