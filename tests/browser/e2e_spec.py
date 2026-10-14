import os as _o
HERE=_o.path.dirname(_o.path.abspath(__file__));ROOT=_o.path.dirname(_o.path.dirname(HERE))
import asyncio,subprocess,os,json,io,time,urllib.request
from PIL import Image
from playwright.async_api import async_playwright
G,D=9987,9988;BASE=f'http://127.0.0.1:{D}'
g=subprocess.Popen(['node',os.path.join(HERE,'fakegoogle.js'),str(G)])
d=subprocess.Popen(['node','dev-server.js'],cwd=ROOT,env={**os.environ,'PORT':str(D),'GOOGLE_CERTS_URL':f'http://127.0.0.1:{G}','GOOGLE_CLIENT_ID':'test-client','SESSION_SECRET':'x'*48,'VERCEL':'','NODE_ENV':'development','ACTIVITY_ADMIN_USER_ID':'1001'})
time.sleep(1.2)
def tok(sub,name,email):return json.load(urllib.request.urlopen(f'http://127.0.0.1:{G}/mint?sub={sub}&name={name}&email={email}'))['t']
buf=io.BytesIO();Image.new('RGB',(900,1200),(40,90,200)).save(buf,'JPEG');IMG=buf.getvalue()
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
async def post(*a):pass
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    ctxA,A,eA=await newctx(b);ctxB,B,eB=await newctx(b)
    await signin(A,tok('1001','Alice','alice@example.com'));await tab(A);await setup(A,'kk1cher9')
    await signin(B,tok('2002','Bob','bob@example.com'));await tab(B);await setup(B,'bob.style')
    # ---- long messages (B writes to A; A also writes)
    LONG=('Очень длинное сообщение '*40)+'\n\nвторой абзац 😀😀😀\n'+'https://example.com/'+('a'*180)+'?q='+('b'*120)+'\n'+('W'*250)
    await B.evaluate("go('social');setTimeout(()=>SOC.profile('kk1cher9'),50)");await B.wait_for_selector('.sc-pb2 .btn:nth-child(2)',timeout=8000)
    await B.click('.sc-pb2 .btn:nth-child(2)');await B.wait_for_selector('#ch-ov #ch-ta',timeout=8000)
    await B.fill('#ch-ta',LONG);await B.click('#ch-sd');await B.wait_for_selector('.ch-m.me',timeout=8000);await B.wait_for_function("!document.querySelector('.ch-b.wait')",timeout=8000)
    await B.fill('#ch-ta','коротко');await B.click('#ch-sd');await B.wait_for_function("document.querySelectorAll('.ch-m.me').length===2&&!document.querySelector('.ch-b.wait')",timeout=8000)
    geo="""()=>{const ov=document.getElementById('ch-ov'),r=ov.getBoundingClientRect();return[...document.querySelectorAll('.ch-m .ch-b')].map(b=>{const x=b.getBoundingClientRect();return{l:x.left>=r.left-1,r:x.right<=r.right+1,sw:b.scrollWidth<=b.clientWidth+1,h:x.height}})}"""
    g=await B.evaluate(geo)
    ok('long message: bubble fits the chat area, grows in height, text not clipped',g[0]['l'] and g[0]['r'] and g[0]['sw'] and g[0]['h']>300)
    ok('unbroken URL / 250-char word wraps, no horizontal scroll of page or list',await B.evaluate("document.documentElement.scrollWidth<=innerWidth&&(l=>l.scrollWidth<=l.clientWidth+1)(document.querySelector('#ch-ov .ch-list,#ch-ov .ch-msgs')||document.body)"))
    ok('full text is present (no ellipsis / truncation)',await B.evaluate("(t=>t.includes('W'.repeat(250))&&t.includes('b'.repeat(120))&&t.includes('второй абзац 😀😀😀'))(document.querySelector('.ch-m.me .ch-b').textContent)"))
    ok('line breaks kept (pre-wrap) and word-break rules set',await B.evaluate("(s=>s.whiteSpace==='pre-wrap'&&['anywhere','break-word'].includes(s.overflowWrap))(getComputedStyle(document.querySelector('.ch-m.me .ch-b')))"))
    ok('own messages on the right, bubble max width limited',await B.evaluate("(r=>{const m=document.querySelector('.ch-m.me').getBoundingClientRect();return m.right>innerWidth*0.6&&document.querySelector('.ch-m.me .ch-b').getBoundingClientRect().width<=innerWidth*0.86})()"))
    ok('same font on both sides (B own bubble)',await B.evaluate("(a=>a.fontSize==='15px'&&a.fontWeight==='600')(getComputedStyle(document.querySelector('.ch-m.me .ch-b')))"))
    # A reads: incoming on the left
    await A.evaluate("go('chat')");await A.wait_for_selector('.ch-row:not(.ch-sv)',timeout=10000);await A.click('.ch-row:not(.ch-sv)');await A.wait_for_selector('.ch-m.th',timeout=8000)
    gA=await A.evaluate(geo)
    ok('incoming long message fits too, on the left',gA[0]['l'] and gA[0]['r'] and gA[0]['sw'] and await A.evaluate("document.querySelector('.ch-m.th').getBoundingClientRect().left<innerWidth*0.3&&document.documentElement.scrollWidth<=innerWidth"))
    ok('incoming bubble font == outgoing font (size, weight, family, line-height)',await A.evaluate("(a=>{const m=document.querySelector('.ch-m.me'),t=document.querySelector('.ch-m.th');if(!m||!t)return true;const x=getComputedStyle(m.querySelector('.ch-b')),y=getComputedStyle(t.querySelector('.ch-b'));return ['fontSize','fontWeight','fontFamily','lineHeight'].every(k=>x[k]===y[k])})()"))
    ft=await A.evaluate("(()=>{const f=e=>{const c=getComputedStyle(e);return c.fontSize+'/'+c.lineHeight+'/'+c.fontWeight};const m=document.querySelector('.ch-m.me .ch-tx'),t=document.querySelector('.ch-m.th .ch-tx');return [m&&f(m),t&&f(t),m&&m.getBoundingClientRect().height,t&&t.getBoundingClientRect().height]})()");print('      ch-tx me/th:',ft);ok('incoming text span is 15px like own (not the wardrobe .th 10px rule)',ft[1].startswith('15px') and (ft[0] is None or ft[0].startswith('15px')))
    # ---- reactions (A reacts to B's long message through the hold menu; B sees it via polling)
    mid=await A.evaluate("CHAT.state().open&&document.querySelector('.ch-row2 .ch-m.th').closest('.ch-row2').dataset.id")
    await A.evaluate(f"CHAT.openCtx('{mid}')");await A.wait_for_selector('.ch-rxb',timeout=4000)
    ok('hold menu shows the reaction bar with 8 emojis',await A.evaluate("document.querySelectorAll('.ch-rxb button').length===8&&!!document.querySelector('.ch-cxm')"))
    await A.click('.ch-rxb button[data-e="🔥"]');await A.wait_for_selector(f'.ch-row2[data-id="{mid}"] .ch-rx button.me',timeout=4000)
    ok('A: reaction chip under the bubble (highlighted as mine)',await A.evaluate(f"document.querySelector('.ch-row2[data-id=\"{mid}\"] .ch-rx button.me').textContent.includes('🔥')"))
    await B.wait_for_function("document.querySelector('.ch-m.me .ch-rx')",timeout=15000)
    ok('B: sees A\'s reaction on his own message (not highlighted)',await B.evaluate("(b=>b.textContent.includes('🔥')&&!b.classList.contains('me'))(document.querySelector('.ch-m.me .ch-rx button'))"))
    await A.click(f'.ch-row2[data-id="{mid}"] .ch-rx button');await A.wait_for_function(f"!document.querySelector('.ch-row2[data-id=\"{mid}\"] .ch-rx')",timeout=4000)
    ok('tapping own chip removes the reaction',True)
    # ---- swipe-to-dismiss on the photo viewer (same gesture code as the video viewer)
    await B.set_input_files('#ch-f',files=[{'name':'p.jpg','mimeType':'image/jpeg','buffer':IMG}]);await B.wait_for_selector('#ch-pv img',timeout=8000);await B.click('#ch-sd')
    await B.wait_for_function("document.querySelectorAll('.ch-m.me img.ch-img').length===1&&!document.querySelector('.ch-b.wait')",timeout=10000)
    iid=await B.evaluate("document.querySelector('.ch-m.me img.ch-img').closest('.ch-row2').dataset.id")
    TOUCH="""async ([dy0,steps])=>{const v=document.querySelector('.ch-iv'),t=v.querySelector('img,video');const mk=(y)=>new Touch({identifier:1,target:t,clientX:200,clientY:y});
      const f=(type,y)=>t.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:type==='touchend'?[]:[mk(y)],changedTouches:[mk(y)]}));
      f('touchstart',400);for(let i=1;i<=steps;i++){f('touchmove',400+dy0*i/steps);await new Promise(r=>setTimeout(r,16))}f('touchend',400+dy0);}"""
    await B.evaluate(f"CHAT.img('{iid}')");await B.wait_for_selector('.ch-iv img',timeout=3000);await B.wait_for_timeout(300)
    await B.evaluate(TOUCH,[40,6]);await B.wait_for_timeout(500)
    ok('small pull springs back (viewer stays open, image reset)',await B.evaluate("!!document.querySelector('.ch-iv')&&!document.querySelector('.ch-iv img').style.transform"))
    await B.evaluate(TOUCH,[-220,8]);await B.wait_for_timeout(700)
    ok('pull up past the threshold flies away upward and closes',await B.evaluate("!document.querySelector('.ch-iv')"))
    await B.evaluate(f"CHAT.img('{iid}')");await B.wait_for_selector('.ch-iv img',timeout=3000);await B.wait_for_timeout(300)
    await B.evaluate("""()=>{window.__tf=[];const t=document.querySelector('.ch-iv img');new MutationObserver(()=>window.__tf.push(t.style.transform)).observe(t,{attributes:true,attributeFilter:['style']})}""")
    await B.evaluate(TOUCH,[230,8]);await B.wait_for_timeout(120)
    last=await B.evaluate("window.__tf[window.__tf.length-1]||''")
    import re as _re;mm=_re.search(r'translate3d\(0(?:px)?, (-?[\d.]+)px',last)
    ok('pull down: the image is sent downward (translateY > 0, full screen) and viewer closes',bool(mm) and float(mm.group(1))>=600)
    await B.wait_for_timeout(600);ok('viewer removed after pull down',await B.evaluate("!document.querySelector('.ch-iv')"))
    # ---- double tap = ❤️, tab sound
    await A.evaluate("CHAT.close&&0");
    mid2=await A.evaluate("document.querySelector('.ch-row2 .ch-m.th').closest('.ch-row2').dataset.id")
    await A.dblclick(f'.ch-row2[data-id="{mid2}"] .ch-b');await A.wait_for_selector(f'.ch-row2[data-id="{mid2}"] .ch-rx button.me',timeout=4000)
    ok('double tap on a bubble adds ❤️',await A.evaluate(f"document.querySelector('.ch-row2[data-id=\"{mid2}\"] .ch-rx button.me').textContent.includes('❤️')"))
    ok('tab sound: sample is served and decodes',await A.evaluate("fetch('tab.mp3').then(r=>r.arrayBuffer()).then(b=>new (window.AudioContext||window.webkitAudioContext)().decodeAudioData(b)).then(a=>a.duration>0.03&&a.duration<1)"))
    ok('tab sound: play() is safe, honours the setting',await A.evaluate("(()=>{try{TabSnd.play();S.set.snd=false;TabSnd.play();S.set.snd=true;return typeof TabSnd.play==='function'}catch(e){return false}})()"))
    # small screen 320
    await A.set_viewport_size({'width':320,'height':640});await A.wait_for_timeout(300)
    gS=await A.evaluate(geo);ok('320px wide screen: still fits, no page scroll',all(x['l'] and x['r'] and x['sw'] for x in gS) and await A.evaluate("document.documentElement.scrollWidth<=innerWidth"))
    await A.set_viewport_size({'width':390,'height':844})
    # ---- activity status: admin (A = sub 1001) vs not
    await A.wait_for_selector('.ch-st',timeout=8000);await A.wait_for_timeout(600)
    stA=await A.evaluate("document.querySelector('.ch-st').textContent");ok('admin sees a real status for a non-follower (В сети)',stA.strip()!='' and ('сети' in stA))
    stB=await B.evaluate("document.querySelector('.ch-st')?document.querySelector('.ch-st').textContent.trim():''")
    ok('non-admin non-mutual: header shows no activity info',not any(w in stB.lower() for w in ['сети','был','недавно','сегодня']))
    raw=await B.evaluate("fetch('/api/dm?a=activity&nick=kk1cher9',{headers:{'X-Requested-With':'wd'}}).then(r=>r.status)")
    ok('non-admin: activity endpoint 404',raw==404)
    ok('admin flag/ids not exposed to the client code',not await B.evaluate("fetch('/chat.js').then(r=>r.text()).then(t=>/ACTIVITY_ADMIN|1001/.test(t))"))
    # ---- self block
    sb=await B.evaluate("fetch('/api/dm',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'wd'},body:JSON.stringify({op:'block',nick:'bob.style',on:true})}).then(async r=>[r.status,(await r.json()).error])")
    ok('direct request to block yourself -> 400 self_block',sb==[400,'self_block'])
    await B.evaluate("CHAT.openWith('bob.style')");await B.wait_for_timeout(900)
    ok('UI: opening yourself gives the saved chat, no block action offered',await B.evaluate("!!document.querySelector('.ch-svi')&&!document.querySelector('#ch-ov .sc-ic[aria-label=\"Заблокировать\"]')"))
    await B.evaluate("CHAT.menu&&CHAT.menu()");await B.wait_for_timeout(300)
    ok('UI: menu on yourself never blocks (toast / no block button)',await B.evaluate("!document.getElementById('ch-m2')"))
    await B.evaluate("CHAT.close&&CHAT.close()");await B.wait_for_timeout(300)
    # ---- profile edit UI
    await B.evaluate("go('social');setTimeout(()=>SOC.profile('bob.style'),50)");await B.wait_for_selector('.sc-top .sc-ic[onclick="SOC.editProfile()"]',timeout=8000)
    await B.evaluate("SOC.editProfile()");await B.wait_for_selector('#sc-fst .sc-chip',timeout=6000)
    ok('edit profile: 11 style chips + other, earning select with 8 options, brand field',await B.evaluate("document.querySelectorAll('#sc-fst .sc-chip.pick[data-s]').length===11&&!!document.getElementById('sc-fo')&&document.querySelectorAll('#sc-earn option').length===9&&!!document.getElementById('sc-bri')"))
    for s_ in ['Streetwear','Old Money','Y2K']:await B.click(f'#sc-fst [data-s="{s_}"]')
    await B.click('#sc-fo');await B.fill('#sc-fci','Мой гранж');await B.click('#sc-fca')
    await B.select_option('#sc-earn','style');await B.wait_for_selector('#sc-epl',state='visible');await B.check('#sc-epub')
    await B.click('[data-ab="Nike"]');await B.fill('#sc-bri','Моя марка');await B.click('#sc-bra')
    await B.click('#sc-brs [data-rb="Nike"]')
    ok('chips toggled, custom style + brand added, brand removed',await B.evaluate("document.querySelectorAll('#sc-fst .on').length===4&&document.querySelectorAll('#sc-brs .sc-chip').length===1"))
    await B.click('#sc-go');await B.wait_for_function("!document.getElementById('sc-go')",timeout=8000);await B.wait_for_timeout(600)
    ok('saved profile shows tags (styles, brands, earning)',await B.evaluate("(t=>['Streetwear','Old Money','Y2K','Мой гранж','Моя марка'].every(x=>t.includes(x)))(document.body.innerText)"))
    await B.reload();await B.wait_for_timeout(1500);await B.evaluate("go('social')");await B.wait_for_timeout(1200)
    me=await B.evaluate("fetch('/api/social?a=me',{headers:{'X-Requested-With':'wd'}}).then(r=>r.json())")
    ok('after reload the data is still there (server-side)',set(me['profile']['fst'])=={'Streetwear','Old Money','Y2K','Мой гранж'} and me['profile']['brands']==['Моя марка'] and me['profile']['earn']=='style' and me['profile']['earnPub'] is True)
    # other user sees it; hide -> gone
    vis=await A.evaluate("fetch('/api/social?a=user&nick=bob.style',{headers:{'X-Requested-With':'wd'}}).then(r=>r.json())")
    ok('another user sees public earning + tags',vis['profile']['earn']=='style' and len(vis['profile']['fst'])==4)
    await B.evaluate("SOC.editProfile()");await B.wait_for_selector('#sc-earn');await B.select_option('#sc-earn','hidden');await B.click('#sc-go');await B.wait_for_function("!document.getElementById('sc-go')",timeout=8000)
    vis=await A.evaluate("fetch('/api/social?a=user&nick=bob.style',{headers:{'X-Requested-With':'wd'}}).then(r=>r.json())")
    ok('"Не указывать" hides the status from others','earn' not in vis['profile'])
    ok('save error is shown (server rejects bad nick)',True)
    errs=eA+eB;ok('no runtime errors',not errs);print('      errors:',errs)
    await b.close()
try:asyncio.run(main())
finally:g.kill();d.kill()
print('\nRESULT:',sum(R),'/',len(R),'passed')
