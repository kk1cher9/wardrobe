import os as _o
HERE=_o.path.dirname(_o.path.abspath(__file__));ROOT=_o.path.dirname(_o.path.dirname(HERE))
import asyncio,subprocess,os,json,io,time,urllib.request
from PIL import Image
from playwright.async_api import async_playwright
G,D=9981,9982;BASE=f'http://127.0.0.1:{D}'
g=subprocess.Popen(['node',os.path.join(HERE,'fakegoogle.js'),str(G)])
d=subprocess.Popen(['node','dev-server.js'],cwd=ROOT,env={**os.environ,'PORT':str(D),'GOOGLE_CERTS_URL':f'http://127.0.0.1:{G}','GOOGLE_CLIENT_ID':'test-client','SESSION_SECRET':'x'*48,'VERCEL':'','NODE_ENV':'development'})
time.sleep(1.2)
def tok(sub,name,email):return json.load(urllib.request.urlopen(f'http://127.0.0.1:{G}/mint?sub={sub}&name={name}&email={email}'))['t']
TA=lambda:tok('1001','Alice','alice@example.com');TB=lambda:tok('2002','Bob','bob@example.com')
buf=io.BytesIO();Image.new('RGB',(500,500),(200,40,40)).save(buf,'JPEG');IMG=buf.getvalue()
R=[];ok=lambda n,c:(R.append(c),print(('PASS  ' if c else 'FAIL  ')+n))
async def newctx(b,sw='block'):
    ctx=await b.new_context(viewport={'width':390,'height':844},service_workers=sw);pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda x:asyncio.ensure_future(x.accept()))
    await pg.goto(BASE+'/index.html');await pg.wait_for_timeout(1300);return ctx,pg,errs
async def add(pg,name):
    await pg.evaluate("openItem()");await pg.set_input_files('#fi',files=[{'name':'a.jpg','mimeType':'image/jpeg','buffer':IMG}]);await pg.wait_for_function("draft&&draft.img")
    await pg.fill('#f_n',name);await pg.click('#sv');await pg.wait_for_function("!document.getElementById('md')")
async def settle(pg):await pg.wait_for_function("S.sync==='ok'&&!syncing&&Object.keys(Q.get().p).length+Object.keys(Q.get().d).length+Q.get().m===0",timeout=15000)
async def srv(ctx):r=await ctx.request.get(BASE+'/api/data',headers={'X-Requested-With':'wd'});return r.status,(await r.json())
names=lambda pg:pg.evaluate("S.items.map(i=>i.name).sort()")
async def signin(pg,t):
    await pg.evaluate("t=>onCred({credential:t})",t);await pg.wait_for_function("S.user&&!syncing&&S.sync==='ok'",timeout=15000)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    # ---------- 1. guest mode ----------
    ctx1,pg1,e1=await newctx(b)
    await add(pg1,'Guest jacket');await add(pg1,'Guest shoes')
    await pg1.evaluate("S.set.city={name:'Kyiv',lat:50.45,lon:30.52};S.outfits.unshift({id:'og1',label:'Guest look',ids:S.items.map(i=>i.id),min:5,max:15});save()")
    await pg1.reload();await pg1.wait_for_timeout(1200)
    ok('guest mode works without account; data survives reload',await names(pg1)==['Guest jacket','Guest shoes'] and await pg1.evaluate("S.outfits.length")==1)
    await pg1.evaluate("go('settings')");await pg1.wait_for_timeout(900)
    await pg1.wait_for_timeout(800)
    ok('Google not configured: sign-in card is removed from Settings, no "Guest mode" label',await pg1.evaluate("!document.getElementById('gbtn')&&!document.querySelector('.prof')&&!document.body.innerText.includes('Guest mode')"))
    # ---------- 2. sign in A (guest data moves into the new account) ----------
    await signin(pg1,TA())
    s,j=await srv(ctx1)
    ok('A signed in; profile cached',await pg1.evaluate("S.user.name+'|'+S.user.email")=='Alice|alice@example.com')
    ok('guest wardrobe adopted by the new account (server has 2 items, outfit, city)',s==200 and len(j['index'])==2 and len(j['meta']['outfits'])==1 and j['meta']['settings']['city']['name']=='Kyiv')
    ok('guest storage cleared after adoption',await pg1.evaluate("localStorage.getItem('wd:items')===null&&localStorage.getItem('wd:outfits')===null")and 'wardrobe' not in await pg1.evaluate("indexedDB.databases().then(a=>a.map(x=>x.name))"))
    await pg1.evaluate("go('settings')");await pg1.wait_for_timeout(900)
    prof=await pg1.evaluate("({name:document.querySelector('.prof b').textContent,email:document.querySelector('.prof small').textContent,av:document.querySelector('.prof img.av')&&document.querySelector('.prof img.av').src,logout:[...document.querySelectorAll('.prof button')].map(b=>b.textContent),sync:document.getElementById('syncst').textContent})")
    ok('Profile: avatar, name, email, Log out, sync status',prof['name']=='Alice' and prof['email']=='alice@example.com' and 'googleusercontent' in (prof['av'] or '') and 'Log out' in prof['logout'])
    print('      profile:',prof)
    # ---------- 3. persistence ----------
    await pg1.reload();await pg1.wait_for_timeout(1500)
    ok('after reload: still signed in, wardrobe+outfits+city restored',await pg1.evaluate("S.user&&S.user.name")=='Alice' and await names(pg1)==['Guest jacket','Guest shoes'] and await pg1.evaluate("S.outfits.length+'|'+S.set.city.name")=='1|Kyiv')
    await add(pg1,'Alice scarf');await pg1.evaluate("S.outfits.unshift({id:'oa2',label:'Alice look',ids:[S.items[0].id],min:0,max:9});save()");await settle(pg1)
    s,j=await srv(ctx1);ok('new item + outfit uploaded to the account',len(j['index'])==3 and len(j['meta']['outfits'])==2)
    # ---------- 4. second device ----------
    ctx2,pg2,e2=await newctx(b)
    ok('device 2 starts as guest with nothing',await names(pg2)==[])
    await signin(pg2,TA())
    ok('device 2: same account -> sees the same wardrobe, outfits, city',await names(pg2)==['Alice scarf','Guest jacket','Guest shoes'] and await pg2.evaluate("S.outfits.length+'|'+S.set.city.name")=='2|Kyiv')
    ok('photos synced (not just names)',await pg2.evaluate("S.items.every(i=>i.img&&i.img.startsWith('data:image/'))"))
    # proper delete through the UI path
    await pg2.evaluate("go('wardrobe')");await pg2.evaluate("openItem(S.items.find(i=>i.name==='Guest jacket').id)");await pg2.click('#dl');await pg2.wait_for_timeout(500);await settle(pg2)
    await pg1.evaluate("syncNow()");await pg1.wait_for_function("S.sync==='ok'&&!syncing");await pg1.wait_for_timeout(500)
    ok('deleting on device 2 propagates to device 1','Guest jacket' not in await names(pg1))
    # ---------- 5. guest data does NOT leak into an existing account ----------
    ctx3,pg3,e3=await newctx(b);await add(pg3,'Guest X')
    await signin(pg3,TA())
    ok('existing account keeps only its own data (guest item not merged)',await names(pg3)==await names(pg1) and 'Guest X' not in await names(pg3))
    await pg3.evaluate("logout()");await pg3.wait_for_function("!S.user");await pg3.wait_for_timeout(600)
    ok('after logout the guest item is still there (kept separate)',await names(pg3)==['Guest X'])
    # ---------- 6. logout, user B isolation ----------
    await pg1.evaluate("logout()");await pg1.wait_for_function("!S.user");await pg1.wait_for_timeout(700)
    ok('Logout: guest mode, nothing of A left on the device',await pg1.evaluate("!S.user&&S.items.length===0&&S.outfits.length===0")and await pg1.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('wd:u1001:')||k==='wdg:session').length===0")and not [n for n in await pg1.evaluate("indexedDB.databases().then(a=>a.map(x=>x.name))") if 'u1001' in n])
    r=await ctx1.request.get(BASE+'/api/auth');ok('server session cleared (401)',r.status==401)
    await signin(pg1,TB())
    ok('B signed in on the same device sees NONE of A\'s data',await pg1.evaluate("S.user.name")=='Bob' and await names(pg1)==[] and await pg1.evaluate("S.outfits.length")==0 and await pg1.evaluate("S.set.city===null||S.set.city.name!=='Kyiv'"))
    await add(pg1,'Bob coat');await pg1.evaluate("S.set.city={name:'Lviv',lat:49.84,lon:24.03};S.outfits.unshift({id:'ob1',label:'Bob look',ids:[S.items[0].id],min:1,max:8});save()");await settle(pg1)
    sb,jb=await srv(ctx1);ok('B data stored under B only',list(jb['index'].keys())==[(await pg1.evaluate("S.items[0].id"))] and jb['meta']['settings']['city']['name']=='Lviv')
    await pg1.evaluate("logout()");await pg1.wait_for_function("!S.user");await pg1.wait_for_timeout(600)
    await signin(pg1,TA())
    ok('A signs in again -> own wardrobe/outfits/city back, no B data',await names(pg1)==['Alice scarf','Guest shoes'] and await pg1.evaluate("S.outfits.map(o=>o.label).sort().join()")=='Alice look,Guest look' and await pg1.evaluate("S.set.city.name")=='Kyiv')
    # ---------- 7. offline queue ----------
    await ctx1.set_offline(True);await add(pg1,'Offline hat');await pg1.wait_for_timeout(400)
    ok('offline: item saved locally + queued','Offline hat' in await names(pg1) and await pg1.evaluate("Object.keys(Q.get().p).length")==1)
    await ctx1.set_offline(False);await pg1.evaluate("syncNow()");await settle(pg1)
    s,j=await srv(ctx1);ok('back online: queued item uploaded',len(j['index'])==3)
    # ---------- 8. PWA still intact; API never cached ----------
    ctx4,pg4,e4=await newctx(b,sw='allow');await pg4.wait_for_function("navigator.serviceWorker.ready.then(()=>true)");await pg4.reload();await pg4.wait_for_timeout(1500)
    await pg4.evaluate("fetch('/api/config').then(r=>r.json())");await signin(pg4,TA());await pg4.evaluate("fetch('/api/data',{headers:{'X-Requested-With':'wd'}})");await pg4.wait_for_timeout(500)
    pw=await pg4.evaluate("(async()=>{const ks=await caches.keys(),urls=[];for(const k of ks){const c=await caches.open(k);(await c.keys()).forEach(r=>urls.push(new URL(r.url).pathname))}return{ks,urls,man:(await (await fetch('/manifest.webmanifest')).json()).name,sw:!!(await navigator.serviceWorker.getRegistration())}})()")
    ok('PWA: service worker + manifest intact, shell cached',pw['sw'] and pw['man']=='Weather Wardrobe' and '/index.html' in pw['urls'])
    ok('PWA: no /api/ response is ever cached (no cross-user leakage)',not any(u.startswith('/api/') for u in pw['urls']))
    print('      caches:',pw['ks'],pw['urls'])
    errs=e1+e2+e3+e4;ok('no runtime errors in any page',not errs);print('      errors:',errs)
    await b.close()
try:asyncio.run(main())
finally:g.kill();d.kill()
print('\nRESULT:',sum(R),'/',len(R),'passed')
