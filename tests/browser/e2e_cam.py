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
            b=await p.chromium.launch(args=args);c=await b.new_context(viewport={'width':390,'height':780},permissions=['camera'] if fake else [])
            pg=await c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto(f'http://localhost:{P}/');await pg.wait_for_timeout(1500)
            await pg.evaluate("SOC.storyCam()")
            if fake:
                await pg.wait_for_selector('.sc-cam',timeout=5000);await pg.wait_for_function("document.getElementById('sc-cv').videoWidth>0",timeout=8000)
                ok('camera opens first (viewfinder + shot strip + templates)',await pg.evaluate("!!document.querySelector('.sc-cs,#sc-cs')&&document.querySelectorAll('.sc-cth').length>=5"))
                await pg.click('[data-tp="4"]');await pg.click('#sc-csh');await pg.click('#sc-csh');await pg.wait_for_timeout(300)
                ok('shots appear in the left strip, Next is enabled',await pg.evaluate("document.querySelectorAll('.sc-cim').length===2&&!document.getElementById('sc-cn').disabled"))
                await pg.click('[data-rm="0"]');ok('a shot can be removed',await pg.evaluate("document.querySelectorAll('.sc-cim').length===1"))
                await pg.click('#sc-csh');await pg.click('#sc-cn');await pg.wait_for_selector('#sc-sgo',timeout=8000)
                ok('collage goes into the story composer ready to publish',await pg.evaluate("!!document.querySelector('.sc-spv img')&&!document.getElementById('sc-sgo').disabled")and not await pg.query_selector('.sc-cam'))
                await pg.evaluate("closeM(document.querySelector('.sc-comp'))") if False else None
                await pg.evaluate("document.querySelector('.modal').remove()")
                await pg.evaluate("SOC.storyCam()");await pg.wait_for_selector('.sc-cam');await pg.wait_for_function("document.getElementById('sc-cv').videoWidth>0");await pg.click('#sc-csh');await pg.wait_for_selector('#sc-sgo',timeout=8000)
                ok('single template: one shot goes straight on',True)
            else:
                await pg.wait_for_selector('#sc-sf1',state='attached',timeout=6000)
                ok('no camera: falls back to the normal story composer',not await pg.query_selector('.sc-cam'))
            ok('no page errors',not errs)
            if errs:print(errs)
            await b.close()
    finally:srv.kill()
    print(f'RESULT {n-f} / {n}');sys.exit(1 if f else 0)
asyncio.run(main())
