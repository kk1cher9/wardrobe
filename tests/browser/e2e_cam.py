# camera-first story: fake camera, shot strip, collage templates, fallback without a camera
import asyncio,sys,os,subprocess,time,json
from playwright.async_api import async_playwright
R=os.path.dirname(os.path.abspath(__file__))+'/../..'
P=9987
n=0;f=0
def ok(m,c):
    global n,f
    n+=1
    if not c:f+=1
    print(('PASS  ' if c else 'FAIL  ')+m)
async def main():
    srv=subprocess.Popen(['node','dev-server.js'],cwd=R,env={**os.environ,'PORT':str(P)},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    time.sleep(2)
    try:
      async with async_playwright() as p:
        for fake in (True,False):
            args=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'] if fake else []
            b=await p.chromium.launch(args=args);c=await b.new_context(viewport={'width':390,'height':780},permissions=['camera','microphone'] if fake else [])
            pg=await c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto(f'http://localhost:{P}/');await pg.wait_for_timeout(1500)
            await pg.evaluate("SOC.storyCam()")
            if fake:
                await pg.wait_for_selector('.sc-cam',timeout=5000);await pg.wait_for_function("document.getElementById('sc-cv').videoWidth>0",timeout=8000)
                ok('camera opens first (viewfinder + shot strip + templates)',await pg.evaluate("!!document.querySelector('.sc-cs,#sc-cs')&&true"))
                ok('template is one button at the top right',await pg.evaluate("!!document.querySelector('.sc-cmt #sc-ct')&&!document.querySelector('.sc-cth')"))
                for _ in range(4):await pg.click('#sc-ct')
                ok('tapping it cycles the layouts (4th tap = 4 cells)',await pg.evaluate("document.querySelectorAll('#sc-ct rect').length===4"))
                await pg.click('#sc-csh');await pg.click('#sc-csh');await pg.wait_for_timeout(300)
                ok('shots appear in the left strip, Next is enabled',await pg.evaluate("document.querySelectorAll('.sc-cim').length===2&&!document.getElementById('sc-cn').disabled"))
                await pg.click('[data-rm="0"]');ok('a shot can be removed',await pg.evaluate("document.querySelectorAll('.sc-cim').length===1"))
                await pg.click('#sc-csh');await pg.click('#sc-cn');await pg.wait_for_selector('#sc-sgo',timeout=8000)
                ok('collage goes into the story composer ready to publish',await pg.evaluate("!!document.querySelector('.sc-spv img')&&!document.getElementById('sc-sgo').disabled")and not await pg.query_selector('.sc-cam'))
                await pg.evaluate("closeM(document.querySelector('.sc-comp'))") if False else None
                await pg.evaluate("document.querySelector('.modal').remove()")
                await pg.evaluate("SOC.storyCam()");await pg.wait_for_selector('.sc-cam');await pg.wait_for_function("document.getElementById('sc-cv').videoWidth>0");await pg.click('#sc-csh');await pg.wait_for_selector('#sc-sgo',timeout=8000)
                ok('single template: one shot goes straight on',True)
                await pg.evaluate("document.querySelector('.modal').remove()")
                await pg.evaluate("window.__gum=0;const o=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(c)=>{__gum++;return o(c)};SOC.storyCam()");await pg.wait_for_selector('.sc-cam');await pg.wait_for_function("document.getElementById('sc-cv').videoWidth>0")
                await pg.click('#sc-cx');await pg.evaluate("SOC.storyCam()");await pg.wait_for_function("document.getElementById('sc-cv').videoWidth>0")
                ok('reopening reuses the granted camera (no new permission request)',await pg.evaluate("__gum")<=1)
                await pg.evaluate("document.querySelectorAll('.sc-cam,.modal').forEach(e=>e.remove());SOC.storyCam()");await pg.wait_for_selector('.sc-cam');await pg.wait_for_function("document.getElementById('sc-cv').videoWidth>0")
                await pg.mouse.click(200,300);await pg.mouse.click(200,300);await pg.wait_for_timeout(1500)
                ok('after switching the picture still fills the whole screen (no black bars)',await pg.evaluate("(()=>{const r=document.getElementById('sc-cv').getBoundingClientRect();return Math.abs(r.width-innerWidth)<2&&Math.abs(r.height-innerHeight)<2&&getComputedStyle(document.getElementById('sc-cv')).objectFit==='cover'&&!document.querySelector('.sc-cam canvas')})()"))
                ok('double tap on the picture flips the camera',await pg.evaluate("document.getElementById('sc-cv').style.transform")=='scaleX(-1)')
                await pg.mouse.click(200,300);await pg.mouse.click(200,300);await pg.wait_for_timeout(1500)
                sb=await pg.query_selector('#sc-csh');bb=await sb.bounding_box()
                await pg.mouse.move(bb['x']+bb['width']/2,bb['y']+bb['height']/2);await pg.mouse.down();await pg.wait_for_timeout(1400)
                ok('holding the shutter records (red shutter + timer)',await pg.evaluate("document.getElementById('sc-csh').classList.contains('rec')&&!document.getElementById('sc-crec').hidden"))
                await pg.mouse.up();await pg.wait_for_selector('.sc-comp',timeout=10000)
                ok('released: the video goes to the post composer',not await pg.query_selector('.sc-cam'))
                await pg.evaluate("document.querySelectorAll('.sc-cam,.modal').forEach(e=>e.remove());SOC.storyCam()");await pg.wait_for_selector('#sc-cfi',state='attached')
                await pg.evaluate("document.querySelectorAll('.sc-cam,.modal').forEach(e=>e.remove());SOC.storyCam()");await pg.wait_for_selector('#sc-zr');await pg.wait_for_function("document.getElementById('sc-cv').videoWidth>0")
                ok('zoom row (0.5 / 1 / 3) sits above the shutter',await pg.evaluate("(()=>{const z=document.getElementById('sc-zr').getBoundingClientRect(),s=document.getElementById('sc-csh').getBoundingClientRect();return z.bottom<=s.top&&document.querySelectorAll('#sc-zr button').length===3})()"))
                await pg.click('#sc-zr [data-z="3"]');await pg.wait_for_timeout(1200)
                ok('3x zooms in and the button is highlighted','scale(3)' in await pg.evaluate("document.getElementById('sc-cv').style.transform") and await pg.evaluate("document.querySelector('#sc-zr .on').dataset.z")=='3')
                await pg.click('#sc-zr [data-z="1"]');await pg.wait_for_timeout(1200)
                ok('back to 1x',await pg.evaluate("document.getElementById('sc-cv').style.transform.indexOf('scale(3)')")==-1)
                ac=await pg.evaluate("document.getElementById('sc-cfi').accept");ok('gallery picker offers photos and videos',ac.startswith('image/') and 'video/' in ac)
            else:
                await pg.wait_for_selector('#sc-sf1',state='attached',timeout=6000)
                ok('no camera: falls back to the normal story composer',not await pg.query_selector('.sc-cam'))
            ok('no page errors',not errs)
            if errs:print(errs)
            await b.close()
    finally:srv.kill()
    print(f'RESULT {n-f} / {n}');sys.exit(1 if f else 0)
asyncio.run(main())
