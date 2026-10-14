import os as _o
HERE=_o.path.dirname(_o.path.abspath(__file__));ROOT=_o.path.dirname(_o.path.dirname(HERE))
import subprocess,time,json,sys,os
from playwright.sync_api import sync_playwright
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 9411
env={**os.environ,'PORT':str(PORT),'ALLOW_MEMORY_DB':'1'}
srv=subprocess.Popen(['node','dev-server.js'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1.2)
res=[];errs=[]
def ok(n,c,d=''):
    res.append((n,bool(c)));print(('PASS' if c else 'FAIL'),n,d)
wx={"current":{"temperature_2m":12,"apparent_temperature":9,"relative_humidity_2m":70,"precipitation":0,"weather_code":3,"wind_speed_10m":4},
"hourly":{"time":[f"2026-10-10T{h:02d}:00" for h in range(24)]*1,"temperature_2m":[5+ (h if h<14 else 28-h)*0.7 for h in range(24)],"apparent_temperature":[3+(h if h<14 else 28-h)*0.7 for h in range(24)],"wind_speed_10m":[3]*24,"precipitation_probability":[10]*24,"weather_code":[3]*24},
"daily":{"time":["2026-10-10","2026-10-11"],"temperature_2m_max":[14,13],"temperature_2m_min":[4,5],"precipitation_probability_max":[20,30],"weather_code":[3,3],"wind_speed_10m_max":[5,5]},"timezone":"Europe/Kyiv"}
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium' if os.path.exists('/opt/pw-browsers/chromium') else None)
    for vw,vh in [(390,844),(360,640),(375,667)]:
        pg=b.new_page(viewport={'width':vw,'height':vh},ignore_https_errors=True)
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.on('console',lambda m:errs.append(m.text) if m.type=='error' and 'favicon' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.route('**/api.open-meteo.com/**',lambda r:r.fulfill(json=wx))
        pg.route('**/geocoding-api.open-meteo.com/**',lambda r:r.fulfill(json={"results":[]}))
        pg.goto(f'http://localhost:{PORT}/');pg.wait_for_timeout(600)
        pg.evaluate("localStorage.setItem('wd:set',JSON.stringify({city:{name:'Київ',lat:50.45,lon:30.52,tz:'Europe/Kyiv',cc:'UA'},unit:'C',theme:'light'}))")
        # seed 30 items with real coloured photos
        pg.evaluate("""async()=>{
          const cols=[['T-shirts','#f2f2f2','White tee'],['T-shirts','#1c1c1c','Black tee'],['T-shirts','#c0392b','Red tee'],['Longsleeves','#3b5a82','Denim longsleeve'],['Shirts','#e8e0cf','Beige shirt'],['Hoodies','#4a4a4a','Grey hoodie'],['Sweaters','#6b4a2f','Brown sweater'],['Jackets','#1b2a4a','Navy jacket'],['Coats','#222','Black coat'],['Jackets','#6b6b2f','Olive jacket'],['Jeans','#3b5a82','Blue jeans'],['Pants','#111','Black pants'],['Pants','#d8c3a5','Beige chinos'],['Shorts','#8fb7e0','Light shorts'],['Sweatpants','#777','Grey sweatpants'],['Sneakers','#f5f5f5','White sneakers'],['Sneakers','#111','Black sneakers'],['Shoes','#4a2c14','Brown loafers'],['Canvas shoes','#2f5fc0','Blue keds'],['Accessories','#e67e22','Umbrella']];
          const out=[];
          for(let k=0;k<30;k++){const [cat,c,name]=cols[k%20];const cv=document.createElement('canvas');cv.width=300;cv.height=300;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,300,300);x.fillStyle=c;x.beginPath();x.roundRect(60,50,180,200,30);x.fill();
            out.push({id:'i'+(1000+k),name:name+(k>=20?' 2':''),cat,color:'',season:'All year',warm:cat==='Coats'?5:cat==='Sweaters'?4:cat==='Hoodies'?3:cat==='Jackets'?3:cat==='Shorts'||cat==='T-shirts'?1:2,rain:cat==='Accessories',img:cv.toDataURL('image/jpeg',.8)})}
          localStorage.setItem('wd:items',JSON.stringify(out));}""")
        pg.reload();pg.wait_for_timeout(2500)
        sc=pg.evaluate("[document.body.scrollHeight,innerHeight]")
        ok(f'{vw}x{vh} home has no scroll',sc[0]<=sc[1]+2,str(sc))
        ok(f'{vw}x{vh} collage image shown',pg.evaluate("!!document.querySelector('#lbimg')&&document.querySelector('#lbimg').src.startsWith('data:image')"))
        ok(f'{vw}x{vh} no horizontal overflow',pg.evaluate("document.documentElement.scrollWidth<=innerWidth"))
        if vw==390:
            pg.screenshot(path='shot_home.png')
            ai=pg.evaluate("S.items.filter(i=>i.ai).length")
            ok('device colour analysis ran for all items',ai==30,str(ai))
            cols=pg.evaluate("S.items.slice(0,20).map(i=>colInfo(i).fam)")
            ok('colours detected from photo pixels',cols.count('white')>=1 and 'black' in cols and 'red' in cols and ('denim' in cols or 'blue' in cols),str(cols))
            ok('weather source label',pg.evaluate("document.querySelector('.src').textContent").startswith('Open-Meteo'),pg.evaluate("document.querySelector('.src').textContent"))
            o1=pg.evaluate("cur().plan.map(i=>i.id).join()")
            pg.reload();pg.wait_for_timeout(2500)
            print('DBG',pg.evaluate("[S.loading,!!S.w,S.err,S.tab,!!S.gen]"),errs[-3:])
            ok('today outfit stable after reload',pg.evaluate("cur().plan.map(i=>i.id).join()")==o1)
            pg.click('.btn.big');pg.wait_for_timeout(500)
            ok('"Другой образ" gives a complete valid outfit by the local algorithm (no AI, no network)',pg.evaluate("cur().plan.length>=3&&!cur().demo&&!cur().sample"))
            pg.wait_for_timeout(500)
            pg.click('text=Save outfit');pg.wait_for_timeout(900)
            so=pg.evaluate("[S.outfits.length,!!S.outfits[0].w,Object.keys(S.oimg).length,S.tab]")
            ok('history recorded on save',pg.evaluate("S.hist.length")>=1)
            ok('save outfit (with weather, image, tab switch)',so[0]==1 and so[1] and so[2]==1 and so[3]=='outfits',str(so))
            pg.screenshot(path='shot_outfits.png',full_page=True)
            pg.reload();pg.wait_for_timeout(1800)
            ok('saved outfit + image persist',pg.evaluate("S.outfits.length==1&&Object.keys(S.oimg).length==1"))
            # settings prefs
            pg.evaluate("go('settings')");pg.wait_for_timeout(700);pg.screenshot(path='shot_settings.png',full_page=True)
            pg.evaluate("S.set.style='sporty';S.set.fav='red';S.set.avoid='black+white';S.set.layer='layered';S.set.cmin=8;S.set.cmax=18;save();S.gen=null;go('home')");pg.wait_for_timeout(700)
            ok('prefs produce an outfit',pg.evaluate("cur().plan.length>=3"))
            # open item form
            pg.evaluate("go('wardrobe')");pg.wait_for_timeout(500);pg.evaluate("openItem('i1002')");pg.wait_for_timeout(600)
            ok('item form shows detected colour',pg.evaluate("document.querySelectorAll('#f_sw i').length>=1"))
            pg.screenshot(path='shot_item.png')
        pg.close()
    b.close()
finally:
  srv.terminate()
print('JS errors:',errs[:5])
print('passed',sum(1 for _,c in res if c),'/',len(res))
