# No-AI behaviour: local outfit algorithm, demo wardrobe (real pictures), gap filling, nothing leaks into the user's wardrobe.
import os as _o
HERE=_o.path.dirname(_o.path.abspath(__file__));ROOT=_o.path.dirname(_o.path.dirname(HERE))
import subprocess,time,json,sys,os
from playwright.sync_api import sync_playwright
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 9412
env={**os.environ,'PORT':str(PORT),'ALLOW_MEMORY_DB':'1'}
srv=subprocess.Popen(['node','dev-server.js'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1.2)

def pick(pg,i):
    pg.evaluate("id=>{const t=document.querySelector('.pt[data-id=\"'+id+'\"]');const g=t.closest('.gp');if(!g.classList.contains('open'))g.querySelector('.gh').click()}",'demo-'+i);pg.wait_for_timeout(60);pg.click(f'.pt[data-id="demo-{i}"]')
res=[];errs=[]
def ok(n,c,d=''):
    res.append((n,bool(c)));print(('PASS' if c else 'FAIL'),n,d)
wx={"current":{"temperature_2m":12,"apparent_temperature":9,"relative_humidity_2m":70,"precipitation":0,"weather_code":3,"wind_speed_10m":4},
"hourly":{"time":[f"2026-10-10T{h:02d}:00" for h in range(24)],"temperature_2m":[5+(h if h<14 else 28-h)*0.7 for h in range(24)],"apparent_temperature":[3+(h if h<14 else 28-h)*0.7 for h in range(24)],"wind_speed_10m":[3]*24,"precipitation_probability":[10]*24,"weather_code":[3]*24},
"daily":{"time":["2026-10-10","2026-10-11"],"temperature_2m_max":[14,13],"temperature_2m_min":[4,5],"precipitation_probability_max":[20,30],"weather_code":[3,3],"wind_speed_10m_max":[5,5]},"timezone":"Europe/Kyiv"}
api=[]
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium' if os.path.exists('/opt/pw-browsers/chromium') else None)
    pg=b.new_page(viewport={'width':390,'height':844},ignore_https_errors=True,locale='ru-RU')
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('request',lambda r:api.append(r.url) if '/api/' in r.url else None)
    pg.route('**/api.open-meteo.com/**',lambda r:r.fulfill(json=wx))
    pg.route('**/geocoding-api.open-meteo.com/**',lambda r:r.fulfill(json={"results":[]}))
    pg.goto(f'http://localhost:{PORT}/');pg.wait_for_timeout(600)
    pg.evaluate("localStorage.setItem('wd:set',JSON.stringify({city:{name:'Київ',lat:50.45,lon:30.52,tz:'Europe/Kyiv',cc:'UA'},unit:'C',theme:'light'}))")
    pg.reload();pg.wait_for_timeout(2500)
    ok('empty wardrobe: NO outfit is generated, the user is asked to choose their clothes',pg.evaluate("cur()===null&&!!document.querySelector('.pick')&&document.querySelectorAll('.pt').length>=40&&document.querySelector('#pgo').disabled"))
    ok('picker hides outfit controls until a selection is made',not pg.evaluate("!!document.querySelector('.lb')"))
    for _id in ['tee-white','jeans-blue','sneakers-white','jacket-denim']:
        pick(pg,_id)
    pick(pg,'tee-white');pg.wait_for_timeout(100)
    ok('a tick can be removed by tapping the item again (count drops, button disables below 2)',pg.evaluate("!document.querySelector('.pt[data-id=\"demo-tee-white\"]').classList.contains('on')&&/\\(3\\)/.test(document.querySelector('#pgo').textContent)"))
    pick(pg,'tee-white');pg.wait_for_timeout(100)
    pg.click('text=Снять все отметки');pg.wait_for_timeout(100)
    ok('"Снять все отметки" clears every tick',pg.evaluate("document.querySelectorAll('.pt.on').length===0&&document.querySelector('#pgo').disabled"))
    for _id in ['tee-white','jeans-blue','sneakers-white','jacket-denim']:
        pick(pg,_id)
    ok('button enables with >=2 picks and shows count',pg.evaluate("!document.querySelector('#pgo').disabled&&/\\(4\\)/.test(document.querySelector('#pgo').textContent)"))
    pg.click('text=Выбрать все');pg.wait_for_timeout(100)
    ok('"Выбрать все" ticks every item',pg.evaluate("document.querySelectorAll('.pt.on').length===document.querySelectorAll('.pt').length&&document.querySelectorAll('.pt').length>=40"))
    pg.click('text=Снять все отметки')
    for _id in ['tee-white','jeans-blue','sneakers-white','jacket-denim']:
        pick(pg,_id)
    pg.click('#pgo');pg.wait_for_function("S.items.length===4",timeout=10000);pg.wait_for_timeout(800)
    ok('picked items are ADDED to the wardrobe as real items (cut photos, categories, names)',pg.evaluate("S.items.length===4&&S.items.every(i=>i.cut&&i.img.startsWith('data:image/')&&!i.demo&&/^i\\d+$/.test(i.id))&&['T-shirts','Jeans','Sneakers','Jackets'].every(c=>S.items.some(i=>i.cat===c))"))
    ok('wardrobe tab shows them; outfit is now built from the wardrobe (savable)',pg.evaluate("!document.querySelector('.pick')&&cur()&&cur().demo===false&&cur().plan.every(i=>S.items.includes(i))")and pg.evaluate("!!document.querySelector('[onclick*=saveOutfit]')"))
    ok('wardrobe survives reload',(pg.reload() or True) and (pg.wait_for_timeout(2500) or True) and pg.evaluate("S.items.length===4&&!document.querySelector('.pick')"))
    ok('no AI anywhere in the UI',not any(w in pg.inner_text('body') for w in ['ИИ','AI image','Claude']))
    pg.evaluate("go('wardrobe')");pg.wait_for_timeout(500)
    ok('items visible in the wardrobe list',pg.evaluate("document.querySelectorAll('.items .it').length===4"))
    pg.evaluate("S.items=[];S.gen=null;Store.set('dpick',null);go('home')")
    # partial wardrobe -> gaps filled from demo
    pg.evaluate("""async()=>{const mk=(id,cat,c)=>{const cv=document.createElement('canvas');cv.width=cv.height=100;const x=cv.getContext('2d');x.fillStyle=c;x.fillRect(0,0,100,100);return{id,name:id,cat,color:'',season:'All year',warm:2,rain:false,img:cv.toDataURL('image/jpeg',.7)}};
      S.items=[mk('g1','T-shirts','#eee'),mk('g2','Jeans','#35a')];await Promise.all(S.items.map(dbPut));S.gen=null;render()}""")
    pg.click('.btn.big');pg.wait_for_timeout(500)
    ok('gaps (shoes/outerwear) filled with demo pieces, labelled; own pieces used',pg.evaluate("cur().sample===true&&cur().plan.some(i=>i.demo)&&cur().plan.some(i=>!i.demo)&&/демо-образцы/.test(document.body.innerText)"))
    ok('sample outfit cannot be saved; wardrobe unchanged',pg.evaluate("S.items.length===2&&!document.querySelector('[onclick=\"saveOutfit()\"]')&&!(S.hist||[]).some(h=>h.ids.some(x=>/^demo-/.test(x)))"))
    # ---- background removal of the user's own photos (on device)
    pg.evaluate("go('wardrobe')");pg.wait_for_timeout(500);pg.evaluate("openItem()");pg.wait_for_timeout(500)
    pg.evaluate("""()=>{const c=document.createElement('canvas');c.width=400;c.height=500;const x=c.getContext('2d');x.fillStyle='#ece9e4';x.fillRect(0,0,400,500);x.fillStyle='#b02a2a';x.fillRect(90,80,220,330);x.fillStyle='#8a1f1f';x.fillRect(60,100,40,200);window.__tp=c.toDataURL('image/jpeg',.9)}""")
    r=pg.evaluate("async()=>{const u=await cutBg(__tp);if(!u)return null;const im=await loadImg(u),c=document.createElement('canvas');c.width=c.height=im.width;const x=c.getContext('2d');x.drawImage(im,0,0);const a=x.getImageData(0,0,c.width,c.width).data,n=c.width,al=(px,py)=>a[(py*n+px)*4+3];return{corner:al(2,2),centre:al(n>>1,n>>1),fmt:u.slice(0,15)}}")
    ok('cutBg: plain background removed (corner transparent, garment opaque)',r and r['corner']<10 and r['centre']>245,str(r))
    from PIL import Image as _I,ImageDraw as _D
    _im=_I.new('RGB',(400,500),(236,233,228));_d=_D.Draw(_im) if hasattr(_D,'Draw') else _D.ImageDraw(_im);_d.rectangle((90,80,310,410),fill=(176,42,42));_d.rectangle((60,100,100,300),fill=(138,31,31));_im.save('/tmp/_tp.jpg')
    pg.set_input_files('#fi','/tmp/_tp.jpg')
    pg.wait_for_function("!!document.querySelector('#upl img')",timeout=8000)
    pg.wait_for_timeout(600)
    ok('upload keeps the original photo by default (no automatic cutting)',pg.evaluate("!document.querySelector('#upl img.cut')"))
    pg.click('#f_bg');pg.wait_for_function("!!document.querySelector('#upl img.cut')",timeout=8000)
    ok('optional "Вырезать фон" button cuts the background on request',pg.evaluate("!!document.querySelector('#upl img.cut')"))
    ok('colour field filled from the garment only (not the transparent background)',pg.evaluate("/red|burg|brown|bord|кра|бордо/i.test($('#f_col').value)"),pg.evaluate("$('#f_col').value"))
    pg.fill('#f_n','Cut tee');pg.click('#sv');pg.wait_for_timeout(800)
    pg.evaluate("go('wardrobe')");pg.wait_for_timeout(500)
    ok('saved item keeps cut flag and shows on a glass tile in the wardrobe',pg.evaluate("S.items.some(i=>i.cut&&i.name==='Cut tee')&&!!document.querySelector('.items .it img.cut')"))
    pg.evaluate("S.items=S.items.filter(i=>!i.cut);S.gen=null;render()")
    # ---- optional bulk cut button (not automatic)
    pg.evaluate("""async()=>{const mk=(id,cat,c)=>{const cv=document.createElement('canvas');cv.width=300;cv.height=380;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,300,380);x.fillStyle=c;x.fillRect(60,50,180,280);return{id,name:id,cat,color:'',season:'All year',warm:2,rain:false,img:cv.toDataURL('image/jpeg',.9)}};
      S.items=[mk('old1','T-shirts','#2a5fa8'),mk('old2','Jeans','#222')];await Promise.all(S.items.map(dbPut));await cutAll(true)}""")
    ok('existing items: background cut, original kept in item.orig, flagged cut',pg.evaluate("S.items.every(i=>i.cut&&i.orig&&i.img.startsWith('data:image/webp')||i.img.startsWith('data:image/png'))&&S.items.length===2"))
    ok('cut items are transparent at the corner',pg.evaluate("(async()=>{const im=await loadImg(S.items[0].img),c=document.createElement('canvas');c.width=c.height=im.width;const x=c.getContext('2d');x.drawImage(im,0,0);return x.getImageData(1,1,1,1).data[3]<10&&x.getImageData(im.width>>1,im.width>>1,1,1).data[3]>245})()"))
    pg.evaluate("uncutAll()");pg.wait_for_timeout(800)
    ok('"Вернуть исходные фото" restores the original photos of cut items',pg.evaluate("S.items.every(i=>!i.cut&&i.img.startsWith('data:image/jpeg'))&&S.items.length===2"))
    pg.evaluate("S.items=[];S.gen=null;render()")
    pg.evaluate("go('settings')");pg.wait_for_timeout(500)
    ok('credit line "CEO - kk1cher" shown in settings',pg.evaluate("document.querySelector('.credit')&&document.querySelector('.credit').textContent==='CEO - kk1cher'"))
    ok('no AI endpoints were called',not any(('stylist' in u or 'analyze' in u or 'garment' in u or 'lookbook' in u) for u in api),str(api))
    ok('config exposes no AI flags',pg.evaluate("S.cfg&&!('aiStylist' in S.cfg)")if pg.evaluate("!!S.cfg") else True)
    ok('no JS errors',not errs,str(errs[:3]))
    b.close()
finally:
  srv.terminate()
n=sum(1 for _,c in res if c);print('RESULT',n,'/',len(res));sys.exit(0 if n==len(res) else 1)
