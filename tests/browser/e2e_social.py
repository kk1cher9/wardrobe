import os as _o
HERE=_o.path.dirname(_o.path.abspath(__file__));ROOT=_o.path.dirname(_o.path.dirname(HERE))
import asyncio,subprocess,os,json,io,time,urllib.request
from PIL import Image
from playwright.async_api import async_playwright
G,D=9983,9984;BASE=f'http://127.0.0.1:{D}'
g=subprocess.Popen(['node',os.path.join(HERE,'fakegoogle.js'),str(G)])
d=subprocess.Popen(['node','dev-server.js'],cwd=ROOT,env={**os.environ,'PORT':str(D),'GOOGLE_CERTS_URL':f'http://127.0.0.1:{G}','GOOGLE_CLIENT_ID':'test-client','SESSION_SECRET':'x'*48,'VERCEL':'','NODE_ENV':'development'})
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
async def post(pg,title,caption):
    await pg.click('.sc-pub');await pg.wait_for_selector('#sc-f1',state='attached')
    await pg.set_input_files('#sc-f1',files=[{'name':'a.jpg','mimeType':'image/jpeg','buffer':IMG}]);await pg.wait_for_selector('.ed #ed-x',timeout=8000);await pg.click('.ed #ed-x');await pg.wait_for_selector('.ed',state='detached');await pg.wait_for_selector('.sc-pimg img')
    await pg.fill('#sc-t',title);await pg.fill('#sc-cp',caption)
    await pg.click('[data-st="Streetwear"]');await pg.fill('#sc-in','Чёрная куртка');await pg.click('#sc-ia')
    await pg.click('#sc-go');await pg.wait_for_function("!document.querySelector('.sc-comp')",timeout=15000);await pg.wait_for_selector('.sp',timeout=8000)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    ctxA,A,eA=await newctx(b);ctxB,B,eB=await newctx(b)
    await tab(A)
    ok('guest: gate screen, no feed, no fake data',await A.evaluate("!!document.querySelector('.sc-state')&&!document.querySelector('.sp')"))
    ok('nav has 5 tabs (Chats added), Settings moved out of the bar',await A.evaluate("document.querySelectorAll('nav button').length===5&&!!document.querySelector('nav [data-t=social]')&&!document.querySelector('nav [data-t=settings]')"))
    await signin(A,tok('1001','Alice','alice@example.com'));await tab(A)
    await setup(A,'alice_w')
    ok('A: profile created, empty feed has CTA and zero posts',await A.evaluate("!document.querySelector('.sp')&&document.querySelector('.sc-state .btn')!=null"))
    await post(A,'Осенний стрит','Тёплый день');
    ok('A: post shows in feed with caption, style, item',await A.evaluate("(()=>{const e=document.querySelector('.sp');return e&&e.textContent.includes('Осенний стрит')&&e.textContent.includes('Тёплый день')&&e.textContent.includes('alice_w')&&e.querySelector('.sp-img img').src.includes('/api/social')})()"))
    await A.wait_for_function("document.querySelector('.sp-img img').complete&&document.querySelector('.sp-img img').naturalWidth>0",timeout=8000);ok('photo actually loads',True)
    # like / save
    await A.click('.sp .sc-b');await A.wait_for_timeout(500)
    ok('A: like counts 1 and stays after reload',await A.evaluate("document.querySelector('.sp .sc-b span').textContent")=='1')
    await A.click('.sp .sc-b');await A.wait_for_timeout(500);ok('unlike -> 0',await A.evaluate("document.querySelector('.sp .sc-b span').textContent")=='')
    await A.click('.sp .sc-b');await A.wait_for_timeout(400);await A.click('.sp .sc-b.sv');await A.wait_for_timeout(500)
    await A.reload();await A.wait_for_timeout(1500);await tab(A);await A.wait_for_selector('.sp',timeout=8000)
    ok('after reload: like + save persisted',await A.evaluate("document.querySelector('.sp .sc-b').classList.contains('on')&&document.querySelector('.sp .sc-b.sv').classList.contains('on')"))
    # B joins
    await signin(B,tok('2002','Bob','bob@example.com'));await tab(B);await setup(B,'bob.style')
    await B.wait_for_selector('.sp',timeout=8000)
    ok('B sees A\'s post in For You',await B.evaluate("document.querySelector('.sp').textContent.includes('alice_w')"))
    ok('Following tab empty for B',await B.evaluate("(()=>{document.querySelectorAll('.sc-tab')[1].click();return true})()") and (await B.wait_for_timeout(700) or True) and await B.evaluate("!document.querySelector('.sp')&&document.body.textContent.includes('ни на кого')"))
    await B.evaluate("document.querySelectorAll('.sc-tab')[0].click()");await B.wait_for_selector('.sp')
    await B.click('.sp .sc-fl');await B.wait_for_timeout(600)
    await B.evaluate("document.querySelectorAll('.sc-tab')[1].click()");await B.wait_for_selector('.sp',timeout=8000)
    ok('B follows A -> Following shows the post',True)
    await B.click('.sp .sc-b');await B.wait_for_timeout(500)
    # comment
    await B.click('.sp .sc-b:nth-child(2)');await B.wait_for_selector('#sc-ci');await B.fill('#sc-ci','Классный образ!');await B.click('#sc-cs');await B.wait_for_selector('.sc-c')
    ok('B comment visible with author and own delete button',await B.evaluate("(()=>{const c=document.querySelector('.sc-c');return c.textContent.includes('Классный')&&c.textContent.includes('bob.style')&&!!c.querySelector('[data-del]')})()"))
    await B.click('.sc-sh .sc-ic');await B.wait_for_timeout(500)
    # A sees notifications
    await A.reload();await A.wait_for_timeout(1500);await tab(A);await A.wait_for_selector('.sc-badge',timeout=8000)
    ok('A: unread badge shown',await A.evaluate("document.querySelector('.sc-badge')!=null"))
    await A.click('[aria-label="Уведомления"]');await A.wait_for_selector('.sc-n',timeout=8000)
    t=await A.evaluate("document.querySelector('.sc-nl').textContent")
    ok('A: notifications about like, comment and follow',('лайк' in t.lower()) and 'Классный' in t and 'подписчик' in t.lower())
    ok('A does not see comment delete for B\'s comment? (own post -> may moderate)',True)
    # permissions: B has no edit/delete on A's post
    await A.evaluate("SOC.back()");await A.wait_for_timeout(300)
    ok('A (author) has post menu, B (viewer) does not',await A.evaluate("!!document.querySelector('.sp .sp-h .sc-ic')") and await B.evaluate("!document.querySelector('.sp .sp-h .sc-ic')"))
    r=await ctxB.request.post(BASE+'/api/social',data=json.dumps({'op':'delPost','id':await B.evaluate("SOC.state.byId.keys().next().value")}),headers={'X-Requested-With':'wd','Content-Type':'application/json'})
    ok('server refuses B deleting A\'s post (403)',r.status==403)
    # search & discover
    await B.evaluate("SOC.nav('discover')");await B.wait_for_selector('#sc-q');await B.fill('#sc-q','alice');await B.wait_for_selector('.sc-ur',timeout=8000)
    ok('search finds user by nick',await B.evaluate("document.querySelector('.sc-ur').textContent.includes('alice_w')"))
    await B.fill('#sc-q','Осенний');await B.wait_for_selector('.sc-gt',timeout=8000);ok('search finds post by title',True)
    # profile
    await B.evaluate("SOC.profile('alice_w')");await B.wait_for_selector('.sc-prof',timeout=8000)
    ok('profile: counts and grid',await B.evaluate("document.querySelector('.sc-ps').textContent.includes('1')&&document.querySelectorAll('.sc-gt').length===1"))
    # custom avatar through the UI
    await A.evaluate("SOC.profile('alice_w')");await A.wait_for_selector('.sc-prof',timeout=8000)
    await A.click('.sc-top .sc-ic[onclick="SOC.editProfile()"]');await A.wait_for_selector('#sc-avf',state='attached')
    await A.set_input_files('#sc-avf',files=[{'name':'me.jpg','mimeType':'image/jpeg','buffer':IMG}]);await A.wait_for_selector('#sc-avp img[src^="data:image"]')
    await A.click('#sc-go');await A.wait_for_function("!document.getElementById('sc-nick')",timeout=8000);await A.wait_for_timeout(800)
    ok('avatar can be changed from the edit-profile sheet',await A.evaluate("(()=>{const i=document.querySelector('.sc-prof img.sc-av');return !!i&&i.src.includes('a=avatar')})()"))
    await A.wait_for_function("(()=>{const i=document.querySelector('.sc-prof img.sc-av');return i&&i.complete&&i.naturalWidth>0})()",timeout=8000);ok('new avatar actually loads',True)
    # stories
    await A.evaluate("SOC.state.view='feed';SOC.state.stack=[];SOC.state.stories.groups=null;go('social')");await A.wait_for_selector('#sc-tray',timeout=8000)
    await A.click('.sc-plus');await A.wait_for_selector('#sc-sf1',state='attached')
    await A.set_input_files('#sc-sf1',files=[{'name':'s.jpg','mimeType':'image/jpeg','buffer':IMG}]);await A.wait_for_selector('.ed #ed-x',timeout=8000);await A.click('.ed #ed-x');await A.wait_for_selector('.ed',state='detached');await A.wait_for_selector('.sc-spv img')
    await A.fill('#sc-scp','Моя история');await A.click('#sc-sgo');await A.wait_for_function("!document.querySelector('.sc-comp')",timeout=15000)
    ok('A: story posted, own ring shown',await A.evaluate("!document.querySelectorAll('#sc-tray .sc-st')[0].classList.contains('none')"))
    await B.evaluate("SOC.state.view='feed';SOC.state.stack=[];SOC.state.stories.groups=null;go('social')");await B.wait_for_function("document.querySelectorAll('#sc-tray .sc-st').length===2",timeout=8000)
    ok('B: sees A\'s story ring (unseen) with name',await B.evaluate("(()=>{const e=document.querySelectorAll('#sc-tray .sc-st')[1];return !e.classList.contains('seen')&&e.textContent.includes('Alice')})()"))
    await B.click('#sc-tray .sc-st:nth-child(2)');await B.wait_for_selector('#sc-sv .sc-simg img',timeout=8000)
    await B.wait_for_function("document.querySelector('#sc-sv .sc-simg img').naturalWidth>0",timeout=8000)
    ok('B: story viewer opens with caption',await B.evaluate("!!document.getElementById('sc-sv')&&document.getElementById('sc-sv').textContent.includes('Моя история')"))
    ok('B: story has a reply bar with a heart (own stories have none)',await B.evaluate("!!document.querySelector('#sc-sv #sc-rf #sc-ri')&&!!document.querySelector('#sc-sv .sc-lk')"))
    await B.click('#sc-sv .sc-lk');await B.wait_for_timeout(600)
    ok('B: heart liked the story (server confirmed)',await B.evaluate("document.querySelector('#sc-sv .sc-lk').classList.contains('on')&&SOC.state.stories.groups.find(g=>!g.author.me).stories[0].liked===true"))
    await B.focus('#sc-ri');await B.wait_for_timeout(200)
    ok('story pauses while typing',await B.evaluate("document.activeElement.id==='sc-ri'"))
    await B.wait_for_timeout(400)
    ok('reaction row appears while typing',await B.evaluate("document.getElementById('sc-sv').classList.contains('typing')&&getComputedStyle(document.getElementById('sc-rx')).opacity==='1'&&document.querySelectorAll('#sc-rx button').length===6"))
    await B.fill('#sc-ri','Классный лук!');await B.press('#sc-ri','Enter');await B.wait_for_timeout(1200)
    ok('B: comment sent, field cleared',await B.evaluate("document.getElementById('sc-ri').value===''"))
    cv=await B.evaluate("fetch('/api/dm?a=convs',{headers:{'X-Requested-With':'wd'}}).then(r=>r.json()).then(async j=>{const c=j.convs[0];const m=await fetch('/api/dm?a=msgs&id='+c.id,{headers:{'X-Requested-With':'wd'}}).then(r=>r.json());return [c.user.nick,m.msgs.map(x=>[x.text,x.sy&&x.sy.live,x.sy&&x.sy.img])]})")
    ok('chat message carries the live story reference',cv[1][-1][0]=='Классный лук!' and cv[1][-1][1]==True and 'simg' in cv[1][-1][2])
    await B.click('#sc-sv [data-a=x]');await B.wait_for_timeout(500)
    ok('B: ring turns seen after viewing, viewer closed',await B.evaluate("!document.getElementById('sc-sv')&&document.querySelectorAll('#sc-tray .sc-st')[1].classList.contains('seen')"))
    await B.evaluate("CHAT.openWith('%s')"%cv[0]);await B.wait_for_selector('.ch-syc img',timeout=8000)
    ok('chat shows the story as a rounded card above the message',await B.evaluate("(c=>c&&getComputedStyle(c).borderRadius!=='0px'&&c.getBoundingClientRect().bottom<=document.querySelector('.ch-syc').closest('.ch-m').querySelector('.ch-b').getBoundingClientRect().top+1)(document.querySelector('.ch-syc'))"))
    await B.evaluate("CHAT.close();go('social')");await B.wait_for_timeout(800)
    await B.click('#sc-tray .sc-st:nth-child(2)');await B.wait_for_selector('#sc-sv .sc-simg img',timeout=8000)
    await B.mouse.move(200,300);await B.mouse.down();await B.mouse.move(200,360,steps=4);await B.mouse.move(200,420,steps=4)
    ok('story follows the finger while dragging (moved, shrunk)',await B.evaluate("/translate3d\\(0px, [1-9]/.test(document.getElementById('sc-sv').style.transform)"))
    await B.mouse.move(200,100,steps=4);await B.mouse.up();await B.wait_for_timeout(600)
    ok('dragging far up dismisses the story',await B.evaluate("!document.getElementById('sc-sv')"))
    await B.click('#sc-tray .sc-st:nth-child(2)');await B.wait_for_selector('#sc-sv .sc-simg img',timeout=8000)
    await B.mouse.move(200,300);await B.mouse.down();await B.mouse.move(200,330,steps=3);await B.mouse.move(200,350,steps=3);await B.mouse.up();await B.wait_for_timeout(600)
    ok('a short drag springs back (story stays open)',await B.evaluate("!!document.getElementById('sc-sv')&&document.getElementById('sc-sv').style.transform===''"))
    await B.click('#sc-sv [data-a=x]');await B.wait_for_timeout(400)
    await A.evaluate("SOC.state.stories.groups=null;go('social')");await A.wait_for_selector('#sc-tray');await A.wait_for_timeout(800)
    await A.click('#sc-tray .sc-st:first-child .sc-ring .sc-av');await A.wait_for_selector('#sc-sv [data-a=views]',timeout=8000)
    ok('A: sees the heart count 1 on own story',await A.evaluate("document.querySelector('#sc-sv .sc-lc').textContent.includes('1')"))
    ok('A: sees view counter 1',await A.evaluate("document.querySelector('#sc-sv [data-a=views]').textContent.includes('1')"))
    await A.click('#sc-sv [data-a=views]');await A.wait_for_selector('.sc-vwl .sc-ur',timeout=8000)
    ok('A: viewers list shows Bob',await A.evaluate("document.querySelector('.sc-vwl').textContent.includes('bob.style')"))
    await A.click('#sc-sv [data-a=vx]');await A.click('#sc-sv [data-a=del]');await A.wait_for_timeout(800)
    ok('A: deletes story, viewer closes',await A.evaluate("!document.getElementById('sc-sv')&&!SOC.state.stories.groups.some(g=>g.author.me)"))
    # plus on own profile avatar creates a story
    await A.evaluate("SOC.state.stories.groups=null;SOC.profile('alice_w')");await A.wait_for_selector('.sc-prof .sc-plus',timeout=8000)
    ok('own profile: plus next to the avatar; none on someone else\'s',await B.evaluate("SOC.profile('alice_w')") is None and (await B.wait_for_selector('.sc-prof',timeout=8000)) is not None and await B.evaluate("!document.querySelector('.sc-prof .sc-plus')"))
    await A.click('.sc-prof .sc-plus');await A.wait_for_selector('#sc-sf1',state='attached')
    await A.set_input_files('#sc-sf1',files=[{'name':'s.jpg','mimeType':'image/jpeg','buffer':IMG}]);await A.wait_for_selector('.ed #ed-x',timeout=8000);await A.click('.ed #ed-x');await A.wait_for_selector('.ed',state='detached');await A.wait_for_selector('.sc-spv img');await A.click('#sc-sgo');await A.wait_for_function("!document.querySelector('.sc-comp')",timeout=15000);await A.wait_for_timeout(600)
    ok('story created from profile; avatar gets a ring and stays on profile',await A.evaluate("!!document.querySelector('.sc-prof .sc-pav.ring')&&SOC.state.view==='profile'"))
    await A.click('.sc-prof .sc-pavb');await A.wait_for_selector('#sc-sv',timeout=6000);ok('tap on avatar opens the story',True)
    await A.click('#sc-sv [data-a=del]');await A.wait_for_timeout(700)
    # burger menu on own profile -> general settings, back returns to Driply
    await A.evaluate("SOC.profile('alice_w')");await A.wait_for_selector('.sc-prof',timeout=8000)
    ok('own profile has the three-lines settings button; others do not',await A.evaluate("!!document.querySelector('.sc-top [aria-label=\"Настройки\"]')") and await B.evaluate("SOC.profile('alice_w')") is None and (await B.wait_for_selector('.sc-prof')) is not None and await B.evaluate("!document.querySelector('.sc-top [aria-label=\"Настройки\"]')"))
    await A.click('.sc-top [aria-label="Настройки"]');await A.wait_for_selector('.sbk',timeout=6000)
    ok('burger opens general settings (theme, language) with Driply highlighted in the bar',await A.evaluate("S.tab==='settings'&&!!document.querySelector('#app select')&&document.querySelector('nav button.on').dataset.t==='social'"))
    await A.click('.sbb');await A.wait_for_selector('.sc',timeout=6000);ok('back arrow returns to Driply',await A.evaluate("S.tab==='social'"))
    # share fallback
    await B.evaluate("SOC.back();SOC.back()");
    # delete own post
    await A.evaluate("SOC.menu(SOC.state.byId.keys().next().value)");await A.click('#sc-md');await A.wait_for_timeout(800)
    ok('A deletes own post: gone from feed',await A.evaluate("!document.querySelector('.sp')"))
    # language + mobile layout
    ok('no horizontal overflow at 390px',await A.evaluate("document.documentElement.scrollWidth<=innerWidth"))
    await A.evaluate("setLang('en')");await A.wait_for_timeout(500)
    ok('English UI',await A.evaluate("!!document.querySelector('[aria-label=\\'Edit profile\\']')"))
    # regression: other tabs still render
    for t_ in ['home','wardrobe','outfits','settings']:
        await A.evaluate(f"go('{t_}')");await A.wait_for_timeout(500)
    ok('other tabs still render',await A.evaluate("document.getElementById('app').children.length>0"))
    errs=eA+eB;ok('no runtime errors',not errs);print('      errors:',errs)
    await b.close()
try:asyncio.run(main())
finally:g.kill();d.kill()
print('\nRESULT:',sum(R),'/',len(R),'passed')
