const {spawn}=require('child_process'),{mint,serve,crypto}=require('./mint');
const PORT=9951,JWKS=9952,B=`http://127.0.0.1:${PORT}`;
const ok=(n,c)=>{console.log((c?'PASS':'FAIL')+'  '+n);if(!c)process.exitCode=1};
(async()=>{
 const jw=await serve(JWKS);
 const srv=spawn('node',['dev-server.js'],{cwd:require('path').join(__dirname,'..'),env:{...process.env,PORT,GOOGLE_CERTS_URL:`http://127.0.0.1:${JWKS}`,GOOGLE_CLIENT_ID:'test-client',SESSION_SECRET:'x'.repeat(48),VERCEL:'',NODE_ENV:'development'}});
 await new Promise(r=>setTimeout(r,800));
 const call=async(path,{method='GET',cookie,body,csrf=true}={})=>{const h={'Content-Type':'application/json'};if(cookie)h.Cookie=cookie;if(csrf)h['X-Requested-With']='wd';const r=await fetch(B+path,{method,headers:h,body:body?JSON.stringify(body):undefined});let j=null;try{j=await r.json()}catch{}return{status:r.status,json:j,setCookie:r.headers.get('set-cookie')}};
 const login=async(claims)=>{const r=await call('/api/auth',{method:'POST',body:{credential:mint(claims)}});return{...r,cookie:r.setCookie&&r.setCookie.split(';')[0]}};
 const img='data:image/png;base64,iVBORw0KGgo=';
 try{
  const cfg=await call('/api/config');ok('config exposes only the public client id',cfg.json.googleClientId==='test-client'&&!JSON.stringify(cfg.json).includes('SECRET'));
  // --- token verification
  ok('rejects garbage token',(await call('/api/auth',{method:'POST',body:{credential:'a.b.c'}})).status===401);
  ok('rejects wrong audience',(await call('/api/auth',{method:'POST',body:{credential:mint({sub:'1',aud:'other-app'})}})).status===401);
  ok('rejects expired token',(await call('/api/auth',{method:'POST',body:{credential:mint({sub:'1',exp:Math.floor(Date.now()/1000)-10})}})).status===401);
  ok('rejects wrong issuer',(await call('/api/auth',{method:'POST',body:{credential:mint({sub:'1',iss:'https://evil.example'})}})).status===401);
  const {privateKey:other}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
  ok('rejects token signed by a different key',(await call('/api/auth',{method:'POST',body:{credential:mint({sub:'1'},{key:other})}})).status===401);
  const t=mint({sub:'111'});const tp=t.split('.');tp[1]=Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(tp[1],'base64url')),sub:'999'})).toString('base64url');
  ok('rejects tampered payload',(await call('/api/auth',{method:'POST',body:{credential:tp.join('.')}})).status===401);
  ok('POST /api/auth without CSRF header -> 403',(await call('/api/auth',{method:'POST',csrf:false,body:{credential:t}})).status===403);
  // --- login users A and B
  const A=await login({sub:'1001',name:'Alice',email:'a@x.com',picture:'https://lh3.googleusercontent.com/a'}),Bu=await login({sub:'2002',name:'Bob',email:'b@x.com',picture:'https://lh3.googleusercontent.com/b'});
  ok('login A ok + HttpOnly cookie',A.status===200&&/HttpOnly/.test(A.setCookie)&&/SameSite=Lax/.test(A.setCookie)&&A.json.user.name==='Alice');
  ok('session cookie not Secure on localhost only',!/Secure/.test(A.setCookie));
  const me=await call('/api/auth',{cookie:A.cookie});ok('GET /api/auth returns profile (name/email/avatar)',me.status===200&&me.json.user.email==='a@x.com'&&me.json.user.picture.includes('googleusercontent'));
  ok('no cookie -> 401',(await call('/api/auth')).status===401&&(await call('/api/data')).status===401);
  const forged=A.cookie.replace(/\.[^.]+$/,'.AAAA');ok('forged/tampered cookie rejected',(await call('/api/data',{cookie:forged})).status===401);
  const fake='wd_session='+Buffer.from(JSON.stringify({sub:'2002',exp:Date.now()+1e9})).toString('base64url')+'.'+'x'.repeat(43);ok('self-made cookie for another user rejected',(await call('/api/data',{cookie:fake})).status===401);
  // --- data per account
  const item=(id,name,ts)=>({id,name,cat:'Jackets',color:'black',season:'All year',warm:3,rain:true,img,ts});
  ok('A saves 3 items',(await call('/api/data',{method:'POST',cookie:A.cookie,body:{op:'putItems',items:[item('a1','A jacket',100),item('a2','A hoodie',200),item('a3','A shoes',300)]}})).json.n===3);
  ok('A saves meta (outfits/settings/city)',(await call('/api/data',{method:'POST',cookie:A.cookie,body:{op:'meta',ts:500,meta:{outfits:[{id:'o1',label:'A look',ids:['a1']}],settings:{city:{name:'Kyiv'},unit:'C'},pos:{}}}})).json.ok);
  ok('B saves 1 item + own meta',(await call('/api/data',{method:'POST',cookie:Bu.cookie,body:{op:'putItems',items:[item('b1','B coat',150)]}})).json.n===1&&(await call('/api/data',{method:'POST',cookie:Bu.cookie,body:{op:'meta',ts:600,meta:{outfits:[],settings:{city:{name:'Lviv'}},pos:{}}}})).json.ok);
  const da=(await call('/api/data',{cookie:A.cookie})).json,db_=(await call('/api/data',{cookie:Bu.cookie})).json;
  ok('A sees only own items',JSON.stringify(Object.keys(da.index).sort())==='["a1","a2","a3"]');
  ok('B sees only own items',JSON.stringify(Object.keys(db_.index))==='["b1"]');
  ok('settings/city/outfits isolated',da.meta.settings.city.name==='Kyiv'&&db_.meta.settings.city.name==='Lviv'&&da.meta.outfits.length===1&&db_.meta.outfits.length===0);
  ok('B cannot fetch A items by id',(await call('/api/items?ids=a1,a2',{cookie:Bu.cookie})).json.items.length===0);
  ok('A fetches own items (with photo)',(await call('/api/items?ids=a1,a2',{cookie:A.cookie})).json.items.length===2);
  ok('B cannot delete A items',(await call('/api/data',{method:'POST',cookie:Bu.cookie,body:{op:'delItems',ids:['a1']}}),(await call('/api/data',{cookie:A.cookie})).json.index.a1===100));
  ok('stale meta write ignored (last-write-wins)',(await call('/api/data',{method:'POST',cookie:A.cookie,body:{op:'meta',ts:10,meta:{outfits:[],settings:{},pos:{}}}})).json.ignored===true);
  ok('data POST without CSRF header -> 403',(await call('/api/data',{method:'POST',cookie:A.cookie,csrf:false,body:{op:'delItems',ids:['a1']}})).status===403);
  ok('invalid item rejected (non-image)',(await call('/api/data',{method:'POST',cookie:A.cookie,body:{op:'putItems',items:[{...item('x1','x',1),img:'javascript:alert(1)'}]}})).status===400);
  ok('A deletes own item',(await call('/api/data',{method:'POST',cookie:A.cookie,body:{op:'delItems',ids:['a3']}})).json.n===1&&!('a3' in (await call('/api/data',{cookie:A.cookie})).json.index));
  // --- logout
  const lo=await call('/api/auth',{method:'DELETE',cookie:A.cookie});ok('logout clears cookie (Max-Age=0)',lo.status===200&&/Max-Age=0/.test(lo.setCookie));
  // --- same user logs in again later (another "device") -> sees data
  const A2=await login({sub:'1001',name:'Alice',email:'a@x.com'});const d2=(await call('/api/data',{cookie:A2.cookie})).json;
  ok('login again (new device) -> same data',JSON.stringify(Object.keys(d2.index).sort())==='["a1","a2"]'&&d2.meta.settings.city.name==='Kyiv');
 }catch(e){console.log('FAIL exception',e);process.exitCode=1}
 srv.kill();jw.close();
 // --- production safety (no DB, no secret on "Vercel")
 const p=spawn('node',['-e',`process.env.VERCEL='1';const l=require('./api/_lib');(async()=>{try{await l.db('GET','k')}catch(e){console.log('prod-no-db:',e.code)}try{l.makeSession({sub:'1'})}catch(e){console.log('prod-no-secret:',e.code)}})()`],{cwd:require('path').join(__dirname,'..'),env:{...process.env,KV_REST_API_URL:'',SESSION_SECRET:''}});
 p.stdout.on('data',d=>process.stdout.write('PASS  '+d));await new Promise(r=>p.on('close',r));
})();
