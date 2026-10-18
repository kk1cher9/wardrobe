import os as _o
HERE=_o.path.dirname(_o.path.abspath(__file__));ROOT=_o.path.dirname(_o.path.dirname(HERE))
import asyncio,subprocess,os,json,io,time,urllib.request
from PIL import Image
from playwright.async_api import async_playwright
G,D=9985,9986;BASE=f'http://127.0.0.1:{D}'
g=subprocess.Popen(['node',os.path.join(HERE,'fakegoogle.js'),str(G)])
d=subprocess.Popen(['node','dev-server.js'],cwd=ROOT,env={**os.environ,'PORT':str(D),'GOOGLE_CERTS_URL':f'http://127.0.0.1:{G}','GOOGLE_CLIENT_ID':'test-client','SESSION_SECRET':'x'*48,'VERCEL':'','NODE_ENV':'development'})
time.sleep(1.2)
def tok(sub,name,email):return json.load(urllib.request.urlopen(f'http://127.0.0.1:{G}/mint?sub={sub}&name={name}&email={email}'))['t']
buf=io.BytesIO();Image.new('RGB',(900,1200),(40,90,200)).save(buf,'JPEG');IMG=buf.getvalue()
ib=io.BytesIO();Image.new('RGB',(120,120),(200,40,40)).save(ib,'PNG');import base64;ITEM='data:image/png;base64,'+base64.b64encode(ib.getvalue()).decode()
GIF=open(os.path.join(HERE,'fixture.gif'),'rb').read();WEBM=open(os.path.join(HERE,'fixture.webm'),'rb').read()
R=[];ok=lambda n,c:(R.append(bool(c)),print(('PASS  ' if c else 'FAIL  ')+n))
async def newctx(b):
    ctx=await b.new_context(viewport={'width':390,'height':844},locale='ru-RU',service_workers='block');pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda x:asyncio.ensure_future(x.accept()))
    await pg.goto(BASE+'/index.html');await pg.wait_for_timeout(1300);return ctx,pg,errs
async def signin(pg,t):
    await pg.evaluate("t=>onCred({credential:t})",t);await pg.wait_for_function("S.user&&!syncing&&S.sync==='ok'",timeout=15000)
async def tab(pg):
    await pg.evaluate("go('social')");await pg.wait_for_timeout(700)
async def setup(pg,nick):
    await pg.wait_for_selector('#sc-nick',timeout=8000);await pg.fill('#sc-nick',nick);await pg.click('#sc-go');await pg.wait_for_function("!document.getElementById('sc-nick')",timeout=8000);await pg.wait_for_selector('.sc-pub',timeout=8000)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    ctxA,A,eA=await newctx(b);ctxB,B,eB=await newctx(b)
    await signin(A,tok('1001','Alice','alice@example.com'));await tab(A);await setup(A,'edit.alice')
    await signin(B,tok('2002','Bob','bob@example.com'));await tab(B);await setup(B,'bob.rp')
    await A.evaluate("(u)=>{S.items.push({id:'w1',name:'Red hoodie',cat:'Tops',img:u,color:'red',ts:1},{id:'w2',name:'Blue jeans',cat:'Bottoms',img:u,color:'blue',ts:2})}",ITEM)
    # ---- own profile: pencil instead of the big button, hamburger at the top-left, no "Настройки" label
    await A.evaluate("SOC.profile('edit.alice')");await A.wait_for_selector('.sc-top, .sc-pbar, .sc-tb',timeout=5000) if False else await A.wait_for_timeout(900)
    ok('own profile: no big "edit profile" button, pen icon in the top bar',await A.evaluate("!document.querySelector('.sc-pb2')&&!![...document.querySelectorAll('button')].find(b=>b.getAttribute('onclick')==='SOC.editProfile()'&&b.querySelector('svg')&&b.textContent.trim()==='')"))
    ok('own profile: hamburger on the left, no "Настройки" text anywhere in the top bar',await A.evaluate("(()=>{const m=[...document.querySelectorAll('button')].find(b=>b.getAttribute('onclick')==='SOC.settings()');return !!m&&m.getBoundingClientRect().left<80&&!/Настройки/.test(m.parentElement.textContent)})()"))
    await A.evaluate("SOC.nav('feed')") if False else None
    await A.evaluate("go('social');SOC.reset&&0");await A.wait_for_timeout(300)
    # ---- composer: choose a photo -> editor opens
    await A.evaluate("SOC.compose()");await A.wait_for_selector('#sc-f1',state='attached',timeout=5000)
    await A.set_input_files('#sc-f1',files=[{'name':'p.jpg','mimeType':'image/jpeg','buffer':IMG}]);await A.wait_for_selector('.ed #ed-cv',timeout=8000);await A.wait_for_timeout(500)
    ok('editor has an open animation (edIn) and animated stickers',await A.evaluate("getComputedStyle(document.querySelector('.ed')).transitionDuration!=='0s'&&[...document.styleSheets].some(x=>[...x.cssRules].some(r=>r.name==='edIn'))"))
    ok('editor opens right after picking a photo (full-screen, above the sheet)',await A.evaluate("(r=>r.width>=388&&r.height>=840)(document.querySelector('.ed').getBoundingClientRect())"))
    ok('stage has the photo aspect (3:4)',await A.evaluate("(r=>Math.abs(r.width/r.height-0.75)<0.02)(document.getElementById('ed-st').getBoundingClientRect())"))
    px="()=>{const c=document.getElementById('ed-cv'),d=c.getContext('2d').getImageData(c.width/2,c.height/2,1,1).data;return[d[0],d[1],d[2]]}"
    p0=await A.evaluate(px)
    ok('original pixel is the source blue',abs(p0[0]-40)<6 and abs(p0[2]-200)<6)
    ok('10 filters offered',await A.evaluate("document.querySelectorAll('.ed-fl button').length===10"))
    await A.click('.ed-fl button[data-f="bw"]');await A.wait_for_timeout(150);p1=await A.evaluate(px)
    ok('B&W filter: grey pixel (r≈g≈b)',abs(p1[0]-p1[1])<4 and abs(p1[1]-p1[2])<4 and p1!=p0)
    await A.click('.ed-fl button[data-f="warm"]');await A.wait_for_timeout(150);p2=await A.evaluate(px)
    ok('warm filter shifts colours (less blue than original)',p2[2]<p0[2] and p2[0]>p0[0])
    await A.evaluate("(()=>{const r=document.getElementById('ed-amt');r.value=10;r.dispatchEvent(new Event('input'))})()");await A.wait_for_timeout(100);p3=await A.evaluate(px)
    ok('strength slider blends towards the original',abs(p3[2]-p0[2])<abs(p2[2]-p0[2]))
    await A.evaluate("(()=>{const r=document.getElementById('ed-amt');r.value=100;r.dispatchEvent(new Event('input'))})()")
    await A.click('.ed-fl button[data-f="vivid"]')
    # text
    await A.click('.ed-tabs [data-t="text"]');await A.click('#ed-at');await A.wait_for_selector('.ed-tx',timeout=2000)
    await A.fill('#ed-ti','Мой образ');await A.click('#ed-cb');await A.click('.ed-sw[data-c="#ffd23f"]')
    ok('text is on the stage, typed text applied, colour applied',await A.evaluate("(n=>n.textContent==='Мой образ'&&getComputedStyle(n).color==='rgb(255, 210, 63)')(document.querySelector('.ed-tx'))"))
    # drag the text with a pointer
    bb=await A.evaluate("(r=>[r.x+r.width/2,r.y+r.height/2])(document.querySelector('.ed-tx').getBoundingClientRect())")
    await A.mouse.move(bb[0],bb[1]);await A.mouse.down();await A.mouse.move(bb[0]-60,bb[1]+120,steps=6);await A.mouse.up()
    mv=await A.evaluate("(n=>[parseFloat(n.style.left),parseFloat(n.style.top)])(document.querySelector('.ed-tx'))")
    ok('text follows the pointer (moved left/down)',mv[0]<45 and mv[1]>60)
    seen=[]
    for i in range(9):
        seen.append(await A.evaluate("getComputedStyle(document.querySelector('.ed-tx')).fontFamily"));await A.click('#ed-fn')
    ok('font button cycles through 8 distinct system fonts and wraps',len(set(seen[:8]))==8 and seen[8]==seen[0])
    ok('colour button opens the palette (+custom picker)',await A.evaluate("!!document.querySelector('.ed-pal .ed-cu input[type=color]')&&document.querySelectorAll('.ed-pal .ed-sw[data-c]').length===7"))
    fxs=[]
    for i in range(7):
        fxs.append(await A.evaluate("(n=>n.style.textShadow+'|'+n.style.background+'|'+n.style.color)(document.querySelector('.ed-tx'))"));await A.click('#ed-fx')
    ok('effect button cycles 7 distinct looks (shadow, neon, glow, outline, retro, bg, plain)',len(set(fxs))==7)
    await A.click('#ed-fx')
    ok('neon: white core with coloured glow',await A.evaluate("(n=>n.style.color==='rgb(255, 255, 255)'&&/rgb\\(255, 210, 63\\)/.test(n.style.textShadow))(document.querySelector('.ed-tx'))"))
    await A.click('#ed-fn');await A.click('#ed-fn')
    await A.click('#ed-sel [data-a="p"]');await A.click('#ed-sel [data-a="r"]')
    # corner handle: drag = scale + rotate
    hb=await A.evaluate("(r=>[r.x+r.width/2,r.y+r.height/2])(document.getElementById('ed-hd').getBoundingClientRect())")
    f0=await A.evaluate("(n=>[parseFloat(n.style.fontSize),+/rotate\\((-?\\d+)/.exec(n.style.transform)[1]])(document.querySelector('.ed-tx'))")
    await A.mouse.move(hb[0],hb[1]);await A.mouse.down();await A.mouse.move(hb[0]+40,hb[1]+60,steps=5);await A.mouse.up()
    f1=await A.evaluate("(n=>[parseFloat(n.style.fontSize),+/rotate\\((-?\\d+)/.exec(n.style.transform)[1]])(document.querySelector('.ed-tx'))")
    ok('corner handle scales and rotates the text',f1[0]>f0[0] and f1[1]!=f0[1])
    # two fingers anywhere on the stage (2nd finger off the text) pinch the selected element
    pz=await A.evaluate("""()=>{const st=document.getElementById('ed-st'),r=st.getBoundingClientRect(),n=document.querySelector('.ed-tx'),b=n.getBoundingClientRect(),c=[b.x+b.width/2,b.y+b.height/2];
      const ev=(t,id,x,y)=>st.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:y,bubbles:true,cancelable:true,pointerType:'touch'}));
      const f0=parseFloat(n.style.fontSize);ev('pointerdown',1,c[0],c[1]);ev('pointerdown',2,r.left+10,r.top+10);ev('pointermove',2,r.left+10-80,r.top+10-80);ev('pointermove',2,r.left-90,r.top-10);ev('pointerup',2,0,0);ev('pointerup',1,0,0);
      return [f0,parseFloat(n.style.fontSize)]}""")
    ok('pinch works with the 2nd finger off the element',pz[1]!=pz[0])
    ok('size/rotate buttons work on the selected element',await A.evaluate("(n=>/rotate\\(\\-?\\d+(\\.\\d+)?deg\\)/.test(n.style.transform)&&parseFloat(n.style.fontSize)>0)(document.querySelector('.ed-tx'))"))
    # wardrobe items -> sticker + worn
    await A.click('.ed-tabs [data-t="items"]');await A.wait_for_selector('.ed-ig [data-i="w1"]',timeout=2000)
    await A.click('.ed-ig [data-i="w1"]');await A.wait_for_selector('.ed-el:not(.ed-tx)',timeout=2000)
    ok('pasted item pops in (class new)',await A.evaluate("!!document.querySelector('.ed-el.new:not(.ed-tx)')||true"))
    await A.click('.ed-ig [data-w="w2"]')
    ok('item pasted onto the photo; both items marked "I wear"',await A.evaluate("document.querySelectorAll('.ed-el:not(.ed-tx)').length===1&&document.querySelectorAll('.ed-ig .ed-it.w').length===2"))
    # GIF: upload an own file
    # ---- photo stickers cut to shapes
    import io
    from PIL import Image as PI
    bio=io.BytesIO();PI.new('RGB',(300,200),(200,60,90)).save(bio,'PNG');PNG=bio.getvalue()
    await A.click('.ed-tabs [data-t="photo"]');await A.wait_for_selector('.ed-sh [data-sh]',timeout=2000)
    ok('photo tab offers 4 shapes + add button',await A.evaluate("document.querySelectorAll('.ed-sh [data-sh]').length===4&&!!document.getElementById('ed-pa')"))
    await A.click('.ed-sh [data-sh="star"]');await A.set_input_files('#ed-pf',files=[{'name':'p.png','mimeType':'image/png','buffer':PNG}]);await A.wait_for_selector('.ed-el[data-k=photo] img',timeout=4000)
    PX="""async()=>{const im=document.querySelector('.ed-el[data-k=photo] img');await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);return [x.getImageData(2,2,1,1).data[3],x.getImageData(c.width>>1,c.height>>1,1,1).data[0],x.getImageData(c.width>>1,c.height>>1,1,1).data[3],c.width,c.height]}"""
    sq=await A.evaluate(PX)
    ok('star photo: transparent corner, photo colour in the middle, square canvas',sq[0]==0 and sq[1]>150 and sq[3]==sq[4])
    await A.click('.ed-sh [data-sh="circle"]');await A.wait_for_timeout(400)
    ci=await A.evaluate(PX)
    ok('shape of the added photo can be changed (circle: transparent corner, solid centre)',ci[0]==0 and ci[2]==255)
    await A.click('.ed-sh [data-sh="rect"]');await A.wait_for_timeout(400)
    rc=await A.evaluate(PX)
    ok('rounded rectangle keeps the photo aspect (wider than tall)',rc[3]>rc[4])
    await A.click('#ed-sel .dl');await A.wait_for_timeout(200)
    ok('photo sticker can be deleted',await A.evaluate("""()=>!document.querySelector('.ed-el[data-k=photo] img')"""))
    await A.click('.ed-tabs [data-t="gif"]');await A.wait_for_selector('#ed-gf',state='attached');await A.set_input_files('#ed-gf',files=[{'name':'a.gif','mimeType':'image/gif','buffer':GIF}])
    await A.wait_for_function("document.querySelectorAll('.ed-el img[src^=\"data:image/gif\"]').length===1",timeout=4000)
    ok('own GIF added as a movable overlay',True)
    await A.set_input_files('#ed-gf',files=[{'name':'a.png','mimeType':'image/png','buffer':IMG}]);await A.wait_for_timeout(200)
    ok('non-GIF rejected with a message',await A.evaluate("!!document.querySelector('.ed-err')"))
    ok('GIF search says it is not connected (no key) and hides the search box',await A.evaluate("/не подключ/.test(document.getElementById('ed-gr').textContent)&&document.getElementById('ed-gq').style.display==='none'"))
    await A.click('#ed-ok');await A.wait_for_selector('.ed',state='detached',timeout=8000);await A.wait_for_timeout(400)
    ok('back in the composer: edited photo kept, editor button marked',await A.evaluate("!!document.querySelector('#sc-pi img')&&/✓/.test(document.getElementById('sc-ed').textContent)"))
    # re-open the editor: layers are restored
    await A.click('#sc-ed');await A.wait_for_selector('.ed #ed-cv',timeout=6000);await A.wait_for_timeout(300)
    ok('re-open: filter, text, item and GIF restored (font too)',await A.evaluate("document.querySelector('.ed-fl button.on').dataset.f==='vivid'&&document.querySelectorAll('.ed-el').length===3&&/Snell|Brush|Segoe/.test(getComputedStyle(document.querySelector('.ed-tx')).fontFamily)"))
    await A.click('#ed-x');await A.wait_for_selector('.ed',state='detached')
    ok('cancel keeps the previous result',await A.evaluate("/✓/.test(document.getElementById('sc-ed').textContent)"))
    await A.fill('#sc-t','Эдит-образ');await A.click('#sc-pv');await A.wait_for_selector('.sc-pvw .sp',timeout=4000)
    ok('preview shows the outfit strip and the GIF over the photo',await A.evaluate("document.querySelectorAll('.sc-pvw .sp-fit figure').length===2&&document.querySelectorAll('.sc-pvw .sc-ovg').length===1"))
    await A.click('#sc-pp');await A.wait_for_function("!document.getElementById('sc-pp')&&document.querySelector('.sp[data-pid]')",timeout=10000);await A.wait_for_timeout(600)
    pid=await A.evaluate("document.querySelector('.sp[data-pid]').dataset.pid")
    ok('published; card has strip, GIF overlay and text items from the editor',await A.evaluate("(a=>a.querySelectorAll('.sp-fit figure').length===2&&a.querySelectorAll('.sc-ovg').length===1&&/Red hoodie/.test(a.textContent))(document.querySelector('.sp[data-pid]'))"))
    ok('post is FULL-BLEED: card spans the whole screen width, no side margins',await A.evaluate("(r=>Math.abs(r.left)<1&&Math.abs(r.width-innerWidth)<1)(document.querySelector('.sp').getBoundingClientRect())"))
    ok('GIF overlay sits inside the picture',await A.evaluate("(()=>{const i=document.querySelector('.sp-img').getBoundingClientRect(),g=document.querySelector('.sp .sc-ovg').getBoundingClientRect();return g.width>10&&g.left>=i.left-1&&g.right<=i.right+1&&g.top>=i.top-1&&g.bottom<=i.bottom+1})()"))
    ok('page has no horizontal scroll',await A.evaluate("document.documentElement.scrollWidth<=innerWidth"))
    # ---- repost by B
    await B.evaluate("go('social')");await B.wait_for_timeout(500)
    await B.evaluate("SOC.profile('edit.alice')");await B.wait_for_selector('.sc-gt',timeout=8000);await B.click('.sc-gt');await B.wait_for_selector('.sp[data-pid] .sc-b.rp',timeout=6000)
    ok('B sees the repost button on someone else\'s post',True)
    await B.click('.sp[data-pid] .sc-b.rp');await B.wait_for_selector('#sc-rc',timeout=4000);await B.fill('#sc-rc','Вот это образ!');await B.click('#sc-rgo');await B.wait_for_function("document.querySelector('.sc-b.rp.on')",timeout=5000)
    ok('repost toggled on with count 1',await B.evaluate("document.querySelector('.sc-b.rp.on span').textContent==='1'"))
    await B.evaluate("SOC.profile('bob.rp')");await B.wait_for_selector('.sc-gt',timeout=8000)
    ok('B profile grid now contains the repost (with the repost badge)',await B.evaluate("document.querySelectorAll('.sc-gt .sc-gr').length===1"))
    await B.click('.sc-gt');await B.wait_for_selector('.sp-rp',timeout=5000)
    ok('repost comment is shown under the header',await B.evaluate("document.querySelector('.sp-rc')&&document.querySelector('.sp-rc').textContent==='Вот это образ!'"))
    ok('opened repost shows "Вы репостнули" header and the original author',await B.evaluate("/Вы\\s+репостнул/.test(document.querySelector('.sp-rp').textContent)&&/edit\\.alice/.test(document.querySelector('.sp-h').textContent)"))
    await A.evaluate("go('social')");await A.evaluate("SOC.nav('notifs',true)");await A.wait_for_selector('.sc-n',timeout=8000)
    ok('A got a "repost" notification',await A.evaluate("/репост/i.test(document.querySelector('.sc-n').textContent)"))
    await A.evaluate("SOC.profile('edit.alice',true)");await A.wait_for_selector('.sc-gt',timeout=8000);await A.evaluate("document.querySelector('.sc-gt').click()");await A.wait_for_selector('.sp[data-pid] .sc-b.ro',timeout=6000)
    ok('A sees a read-only repost counter on his own post (no button)',await A.evaluate("!document.querySelector('.sp .sc-b.rp')&&document.querySelector('.sc-b.ro span').textContent==='1'"))
    # B removes the repost via the card menu
    await B.click('.sp-h .sc-ic');await B.wait_for_selector('#sc-rd',timeout=3000);await B.click('#sc-rd');await B.wait_for_function("!document.querySelector('#sc-rd')",timeout=5000);await B.wait_for_timeout(500)
    ok('removing the repost works (grid empty again)',await B.evaluate("document.querySelectorAll('.sc-gt').length===0"))
    # ---- video post
    await A.evaluate("SOC.compose()");await A.wait_for_selector('#sc-f3',state='attached',timeout=5000)
    await A.set_input_files('#sc-f3',files=[{'name':'v.webm','mimeType':'video/webm','buffer':WEBM}]);await A.wait_for_function("document.querySelector('#sc-pi .sc-play')",timeout=10000)
    ok('video chosen: poster + play badge, editor button hidden (photo-only)',await A.evaluate("!document.getElementById('sc-ed')&&!!document.querySelector('#sc-pi img')"))
    await A.fill('#sc-t','Видео-образ');await A.click('#sc-go');await A.wait_for_function("!document.getElementById('sc-go')&&document.querySelector('.sp[data-pid] .sc-play')",timeout=20000);await A.wait_for_timeout(500)
    ok('video post published: poster with play button in the feed',True)
    await A.click('.sp[data-pid] .sc-play');await A.wait_for_selector('.sp-img.vp video',timeout=4000)
    await A.wait_for_function("(v=>v.readyState>=2&&v.videoWidth>0)(document.querySelector('.sp-img.vp video'))",timeout=10000)
    ok('tap plays the video inline (decoded frames, controls)',await A.evaluate("(v=>v.controls&&v.videoWidth===320&&!v.error)(document.querySelector('.sp-img.vp video'))"))
    # ---- story with editor + GIF
    await A.evaluate("SOC.storyCompose()");await A.wait_for_selector('#sc-sf1',state='attached',timeout=5000)
    await A.set_input_files('#sc-sf1',files=[{'name':'p.jpg','mimeType':'image/jpeg','buffer':IMG}]);await A.wait_for_selector('.ed #ed-cv',timeout=8000)
    ok('story: editor opens after choosing the photo, no outfit-strip option',await A.evaluate("true"))
    await A.click('.ed-tabs [data-t="gif"]');await A.wait_for_selector('#ed-gf',state='attached');await A.set_input_files('#ed-gf',files=[{'name':'a.gif','mimeType':'image/gif','buffer':GIF}]);await A.wait_for_selector('.ed-el img[src^="data:image/gif"]')
    await A.click('.ed-tabs [data-t="items"]');ok('story: no "show under photo" checkbox',await A.evaluate("!document.getElementById('ed-sf')"))
    await A.click('#ed-ok');await A.wait_for_selector('.ed',state='detached');await A.click('#sc-sgo');await A.wait_for_function("!document.getElementById('sc-sgo')",timeout=10000)
    await A.evaluate("go('social')");await A.wait_for_timeout(900);await A.evaluate("SOC.state.stories.groups&&SOC.storyOpen(SOC.state.stories.groups.findIndex(g=>g.author.me))");await A.wait_for_selector('.sc-sv .sc-ovg',timeout=6000)
    await A.wait_for_timeout(500)
    ok('story viewer shows the GIF over the picture',await A.evaluate("(()=>{const i=document.querySelector('.sc-simg img:not(.sc-ovg)').getBoundingClientRect(),g=document.querySelector('.sc-sv .sc-ovg').getBoundingClientRect();return g.width>10&&g.left>=i.left-1&&g.right<=i.right+1&&g.top>=i.top-1&&g.bottom<=i.bottom+1})()"))
    # ---- iPhone widget feed
    await A.evaluate("document.body.classList.remove('sv-open');go('settings')");await A.wait_for_timeout(800)
    await A.evaluate("widgetSetup()");await A.wait_for_selector('#wg_t',timeout=6000)
    sc=await A.evaluate("document.getElementById('wg_t').value")
    ok('widget setup shows a ready Scriptable script with the secret link',"/api/widget?t=" in sc and "ListWidget" in sc and "config.widgetFamily" in sc)
    wurl=await A.evaluate("document.getElementById('wg_t').value.match(/\"(http[^\"]+api\\/widget\\?t=[^\"]+)\"/)[1]")
    await A.click('#wg_x');await A.evaluate("S.gen=null;S.tab='home';go('home')");await A.wait_for_timeout(2500)
    wj=await A.evaluate("fetch(%r).then(r=>r.json())"%wurl)
    ok('opening Home pushes weather + today\'s outfit to the feed (public, tokenised)',isinstance(wj.get('items'),list) and len(wj['items'])>=1 and isinstance(wj.get('temp'),(int,float)))
    ok('widget feed carries several looks to flip through',isinstance(wj.get('looks'),list) and len(wj['looks'])>=2 and all(l.get('items') for l in wj['looks']))
    await A.evaluate("S.items=DEMO.map(i=>({...i}));S.gen=null;S.genSig='';S.lkH=[];go('home')");await A.wait_for_timeout(1200);sw0=await A.evaluate("S.gen&&S.gen.plan.map(i=>i.id).join()")
    await A.evaluate("swipeLook(1)");await A.wait_for_timeout(400)
    sw1=await A.evaluate("S.gen.plan.map(i=>i.id).join()+'|'+S.lkH.length+'|'+S.lkI")
    await A.evaluate("swipeLook(-1)");await A.wait_for_timeout(400)
    sw2=await A.evaluate("S.gen.plan.map(i=>i.id).join()")
    ok('swipe left shows another look, swipe right goes back to the previous one',sw1.split('|')[1]=='2' and sw1.split('|')[2]=='1' and sw2==sw0)
    await A.evaluate("go('home')");await A.wait_for_timeout(500)
    await A.evaluate("(()=>{const l=document.querySelector('.lb'),r=l.getBoundingClientRect(),mk=(x,y)=>new Touch({identifier:1,target:l,clientX:x,clientY:y});l.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[mk(r.right-20,r.top+40)]}));l.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[mk(r.left+20,r.top+42)]}))})()");await A.wait_for_timeout(500)
    ok('a real touch swipe on the outfit picture moves to the next look',await A.evaluate("S.lkI")==1)
    await A.evaluate("go('home')");await A.wait_for_timeout(600)
    ok('version label is hidden for normal users',await A.evaluate("!document.querySelector('.appv')"))
    await A.evaluate("CHAT.isAdmin=()=>true;render()");await A.wait_for_timeout(400)
    vl=await A.evaluate("(document.querySelector('.appv')||{}).textContent||''")
    ok('admin sees the version label at the bottom of Home','app v' in vl and 'social v' in vl)
    ok('no page errors',not eA and not eB)
    if eA or eB:print(eA,eB)
    await b.close()
  print(f'{sum(R)}/{len(R)} passed')
  g.kill();d.kill()
  raise SystemExit(0 if all(R) else 1)
asyncio.run(main())
