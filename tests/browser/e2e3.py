import os as _o
HERE=_o.path.dirname(_o.path.abspath(__file__));ROOT=_o.path.dirname(_o.path.dirname(HERE))
import subprocess,time,os,sys
from playwright.sync_api import sync_playwright
PORT=9421
srv=subprocess.Popen(['node','dev-server.js'],cwd=ROOT,env={**os.environ,'PORT':str(PORT),'ALLOW_MEMORY_DB':'1'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.2)
R=[];ok=lambda n,c,x='':(R.append(bool(c)),print(('PASS ' if c else 'FAIL ')+n,x))
try:
 with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.route('**/*open-meteo.com/**',lambda r:r.abort())
  pg.goto(f'http://localhost:{PORT}/');pg.wait_for_timeout(800)
  def setup(items):
      pg.evaluate("""(items)=>{S.items=items.map((it,k)=>({id:'t'+k,season:'All year',rain:false,img:'',...it}));S.hist=[];S.gen=null}""",items)
  def W(t,f=None,pop=0,wind=2,rain=False):
      pg.evaluate("""([t,f,pop,wind,rain])=>{S.w={city:'T',temp:t,feels:f,hum:50,wind,txt:'x',icon:'sun',snow:false,rain,avg:t,hrs:Array.from({length:24},()=>({t,f,pop,wind,rain,snow:false})),popDay:pop,windMax:wind,pop,hour:12,hours:[],days:[],alerts:[],source:'test',fetchedAt:Date.now()}}""",[t,f if f is not None else t,pop,wind,rain])
  rec=lambda n=1:pg.evaluate("(n)=>{const o=[];for(let k=0;k<n;k++){S.hist=[];const r=recommend(rangeCtx(S.w,'all'),S.items,null);o.push(r.plan.map(i=>i.name))}return o}",n)
  base=[{'name':'Black tee','cat':'T-shirts','color':'black','warm':1},{'name':'White tee','cat':'T-shirts','color':'white','warm':1},{'name':'Red tee','cat':'T-shirts','color':'red','warm':1},
   {'name':'Green pants','cat':'Pants','color':'green','warm':2},{'name':'Black jeans','cat':'Jeans','color':'black','warm':2},{'name':'Beige chinos','cat':'Pants','color':'beige','warm':2},
   {'name':'Pink sneakers','cat':'Sneakers','color':'pink','warm':2},{'name':'White sneakers','cat':'Sneakers','color':'white','warm':2}]
  setup(base);W(22)
  runs=rec(60);flat=[x for r in runs for x in r]
  bad=sum(1 for r in runs if 'Red tee' in r and 'Green pants' in r)
  ok('clashing saturated colours (red+green) are avoided',bad==0,str(bad))
  ok('neutral/harmonious combos dominate',sum(1 for r in runs if 'Pink sneakers' in r and 'Red tee' not in r)+sum(1 for r in runs if 'White sneakers' in r)>=50)
  # avoid combos setting
  pg.evaluate("S.set.avoid='black+white'");runs=rec(60)
  ok('user "avoid combinations" (black+white) respected',sum(1 for r in runs if ('Black tee' in r or 'Black jeans' in r) and ('White tee' in r or 'White sneakers' in r))<=3)
  pg.evaluate("S.set.avoid=''")
  # favorite colour
  pg.evaluate("S.set.fav='red'");runs=rec(60);ok('favorite colour is used more often',sum(1 for r in runs if 'Red tee' in r)>=20,str(sum(1 for r in runs if 'Red tee' in r)));pg.evaluate("S.set.fav=''")
  # style preference
  st=[{'name':'Oxford shirt','cat':'Shirts','color':'white','warm':1},{'name':'Track tee sport','cat':'T-shirts','color':'white','warm':1},{'name':'Classic chinos','cat':'Pants','color':'beige','warm':2},{'name':'Sport jogger track','cat':'Sweatpants','color':'gray','warm':1},
      {'name':'Leather loafers','cat':'Shoes','color':'brown','warm':2},{'name':'Running trainers','cat':'Sneakers','color':'white','warm':2}]
  setup(st);W(22)
  runs=rec(60);mix=sum(1 for r in runs if any('sport' in x.lower() or 'track' in x.lower() or 'jogger' in x.lower() for x in r) and any('Oxford' in x or 'Classic' in x or 'loafers' in x for x in r))
  ok('incompatible styles (sporty + classic) are rarely mixed',mix<=6,str(mix))
  pg.evaluate("S.set.style='smart casual'");runs=rec(60);ok('preferred style smart casual honoured',sum(1 for r in runs if 'Oxford shirt' in r)>=40,str(sum(1 for r in runs if 'Oxford shirt' in r)));pg.evaluate("S.set.style=''")
  # user style correction overrides
  pg.evaluate("S.items.find(i=>i.name==='Track tee sport').ai={src:'user',confidence:0,user:{style:'smart casual'}}");
  ok('manual style correction applies',pg.evaluate("topStyle(S.items.find(i=>i.name==='Track tee sport'))[0]")=='smart casual')
  # comfort range changes the outfit in the cold
  full=[{'name':'Tee','cat':'T-shirts','color':'white','warm':1},{'name':'Sweater','cat':'Sweaters','color':'navy','warm':4},{'name':'Jeans','cat':'Jeans','color':'denim','warm':2},{'name':'Jacket','cat':'Jackets','color':'black','warm':3},{'name':'Boots','cat':'Shoes','color':'black','warm':3}]
  setup(full);W(8,6)
  a=rec(15);pg.evaluate("S.set.cmin=0;S.set.cmax=10");b2=rec(15);pg.evaluate("S.set.cmin=18;S.set.cmax=28");c=rec(15);pg.evaluate("S.set.cmin=null;S.set.cmax=null")
  ok('comfort range shifts perceived temperature',pg.evaluate("comfortShift()")==0 and sum('Jacket' in r for r in c)>=sum('Jacket' in r for r in b2),f"cold-sensitive jackets={sum('Jacket' in r for r in c)} hardy={sum('Jacket' in r for r in b2)}")
  # layering
  W(12,10);pg.evaluate("S.set.layer='light'");l=rec(30);pg.evaluate("S.set.layer='layered'");y=rec(30);pg.evaluate("S.set.layer=''")
  ok('layering preference changes outer-layer use',sum('Jacket' in r for r in y)>=sum('Jacket' in r for r in l),f"layered={sum('Jacket' in r for r in y)} light={sum('Jacket' in r for r in l)}")
  # history avoidance
  setup(base+[{'name':'Navy tee','cat':'T-shirts','color':'navy','warm':1},{'name':'Grey tee','cat':'T-shirts','color':'gray','warm':1}]);W(22)
  rep=pg.evaluate("""()=>{let same=0,N=60;for(let k=0;k<N;k++){S.hist=[];const a=recommend(rangeCtx(S.w,'all'),S.items,null);recordHist(a);const b=recommend(rangeCtx(S.w,'all'),S.items,null);if(planSig(a.plan)===planSig(b.plan))same++}return same/N}""")
  base_rep=pg.evaluate("""()=>{let same=0,N=60;const keep=histPen;for(let k=0;k<N;k++){S.hist=[];const a=recommend(rangeCtx(S.w,'all'),S.items,null);const b=recommend(rangeCtx(S.w,'all'),S.items,null);if(planSig(a.plan)===planSig(b.plan))same++}return same/N}""")
  ok('history lowers immediate repeats',rep<base_rep or rep<=.1,f"with history {rep:.2f} vs without {base_rep:.2f}")
  # perf
  big=[]
  cats=[('T-shirts',1),('Longsleeves',2),('Hoodies',3),('Pants',2),('Jeans',2),('Jackets',3),('Sneakers',2),('Sweaters',4)]
  cl=['black','white','gray','navy','red','green','beige','blue','brown','pink']
  for k in range(150):
      c,w=cats[k%8];big.append({'name':f'{c} {k}','cat':c,'color':cl[k%10],'warm':w})
  setup(big);W(14,12)
  t=pg.evaluate("()=>{const t0=performance.now();for(let k=0;k<5;k++)recommend(rangeCtx(S.w,'all'),S.items,null);return (performance.now()-t0)/5}")
  ok('150 items: recommendation < 1.5 s',t<1500,f'{t:.0f} ms')
  r=pg.evaluate("(()=>{const r=recommend(rangeCtx(S.w,'all'),S.items,null);return {n:r.plan.length,rank:r.rank.length,look:r.look,tips:r.tips}})()")
  ok('result has ranked alternatives + explanation',r['rank']>=3 and len(r['look'])>=1 and len(r['tips'])>=1,str(r['look']))
  ok('no errors',not errs,str(errs[:3]))
  b.close()
finally: srv.terminate()
print('RESULT',sum(R),'/',len(R))
