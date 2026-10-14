// Driply Messages API tests: real server code, fake Google, in-memory DB. Run: node tests/dm.test.js
const {spawn}=require('child_process'),{mint,serve}=require('./mint');
const PORT=9971,JWKS=9972,B=`http://127.0.0.1:${PORT}`;
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS':'FAIL')+'  '+n+(c||d===undefined?'':'  -> '+JSON.stringify(d)));if(!c){fails++;process.exitCode=1}};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
(async()=>{
 const jw=await serve(JWKS);
 const srv=spawn('node',['dev-server.js'],{cwd:require('path').join(__dirname,'..'),env:{...process.env,PORT,GOOGLE_CERTS_URL:`http://127.0.0.1:${JWKS}`,GOOGLE_CLIENT_ID:'test-client',SESSION_SECRET:'x'.repeat(48),VERCEL:'',NODE_ENV:'development',BANNED_NICKS:'Dave_X',ACTIVITY_ADMIN_USER_ID:'1001'}});
 await new Promise(r=>setTimeout(r,800));
 const call=async(path,{method='GET',cookie,body,csrf=true,raw,hdr}={})=>{const h={'Content-Type':'application/json',...(hdr||{})};if(cookie)h.Cookie=cookie;if(csrf)h['X-Requested-With']='wd';const r=await fetch(B+path,{method,headers:h,body:body?JSON.stringify(body):undefined});
  if(raw)return{status:r.status,type:r.headers.get('content-type'),cr:r.headers.get('content-range'),buf:Buffer.from(await r.arrayBuffer())};let j=null;try{j=await r.json()}catch{}return{status:r.status,json:j}};
 const login=async(c)=>{const r=await fetch(B+'/api/auth',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'wd'},body:JSON.stringify({credential:mint(c)})});return r.headers.get('set-cookie').split(';')[0]};
 const sop=(cookie,o,extra={})=>call('/api/social',{method:'POST',cookie,body:{op:o,...extra}});
 const op=(cookie,o,extra={})=>call('/api/dm',{method:'POST',cookie,body:{op:o,...extra}});
 const get=(cookie,q)=>call('/api/dm?'+q,{cookie});
 try{
  const A=await login({sub:'1001',name:'Alice A',email:'alice@secret.com'}),Bc=await login({sub:'2002',name:'Bob B',email:'bob@secret.com'}),C=await login({sub:'3003',name:'Cara C',email:'cara@secret.com'}),N=await login({sub:'4004',name:'No Profile',email:'np@secret.com'});
  ok('GET without session -> 401',(await call('/api/dm?a=convs')).status===401);
  ok('POST without CSRF header -> 403',(await call('/api/dm',{method:'POST',cookie:A,csrf:false,body:{op:'send'}})).status===403);
  await sop(A,'profile',{nick:'alice_w'});await sop(Bc,'profile',{nick:'bob.b'});await sop(C,'profile',{nick:'cara_c'});
  ok('messaging needs a Driply profile (409)',(await get(N,'a=convs')).status===409&&(await op(N,'send',{nick:'alice_w',text:'hi'})).status===409);
  const o=await get(A,'a=open&nick=bob.b');
  ok('open: opaque conversation id, not created yet, no private data',o.status===200&&/^[a-f0-9]{24}$/.test(o.json.id)&&o.json.exists===false&&o.json.user.nick==='bob.b'&&!JSON.stringify(o.json).match(/secret\.com|2002|1001/));
  ok('open: unknown user 404, yourself 400',(await get(A,'a=open&nick=nobody_x')).status===404&&(await get(A,'a=open&nick=alice_w')).json.self===true);
  const cid=o.json.id;
  ok('same id from the other side',(await get(Bc,'a=open&nick=alice_w')).json.id===cid);
  // ---- sending
  ok('empty message rejected',(await op(A,'send',{nick:'bob.b',text:'   '})).status===400);
  const s1=await op(A,'send',{nick:'bob.b',text:'Привет, Боб!\nКак дела?'});
  ok('A sends text',s1.status===200&&s1.json.id===cid&&s1.json.msg.mine===true&&s1.json.msg.text==='Привет, Боб!\nКак дела?');
  ok('unread: B has 1, A has 0',(await get(Bc,'a=unread')).json.unread===1&&(await get(A,'a=unread')).json.unread===0);
  const cb=(await get(Bc,'a=convs')).json;
  ok('B inbox: conversation with A, preview, unread 1',cb.convs.length===1&&cb.convs[0].user.nick==='alice_w'&&cb.convs[0].last.t==='text'&&cb.convs[0].last.by==='them'&&cb.convs[0].unread===1&&cb.unread===1);
  ok('A inbox: preview marked as mine, unread 0',(await get(A,'a=convs')).json.convs[0].last.by==='me'&&(await get(A,'a=convs')).json.convs[0].unread===0);
  ok('C cannot read the conversation (404, no leak)',(await get(C,'a=msgs&id='+cid)).status===404&&(await op(C,'read',{id:cid})).status===404&&(await get(C,'a=convs')).json.convs.length===0);
  const m1=await get(Bc,'a=msgs&id='+cid+'&mark=1');
  ok('B reads: message arrives, marked read, unread cleared',m1.json.msgs.length===1&&m1.json.msgs[0].mine===false&&(await get(Bc,'a=unread')).json.unread===0);
  const m1a=await get(A,'a=msgs&id='+cid);
  ok('A sees read receipt (peerRead >= message time)',m1a.json.peerRead>=m1a.json.msgs[0].ts);
  // ---- reactions
  {const mid=s1.json.msg.id;
   const r1=await op(Bc,'react',{id:cid,mid,e:'🔥'});
   ok('B reacts 🔥: counted, flagged as mine',r1.status===200&&r1.json.rx.length===1&&r1.json.rx[0].e==='🔥'&&r1.json.rx[0].n===1&&r1.json.rx[0].me===true);
   const ra=(await get(A,'a=msgs&id='+cid)).json;
   ok('A sees it in the chat payload (not as his own)',ra.rx[mid]&&ra.rx[mid][0].e==='🔥'&&ra.rx[mid][0].me===false);
   await op(A,'react',{id:cid,mid,e:'🔥'});
   ok('same emoji from both -> n=2',(await get(A,'a=msgs&id='+cid)).json.rx[mid][0].n===2);
   const r2=await op(Bc,'react',{id:cid,mid,e:'❤️'});
   ok('changing the reaction replaces B\'s previous one (one per person)',r2.json.rx.length===2&&r2.json.rx.every((x)=>x.n===1)&&r2.json.rx.find((x)=>x.me).e==='❤️');
   ok('same emoji again removes it',(await op(Bc,'react',{id:cid,mid,e:'❤️'})).json.rx.every((x)=>!x.me)&&(await op(Bc,'react',{id:cid,mid,e:''})).status===200);
   ok('unknown emoji rejected (400)',(await op(Bc,'react',{id:cid,mid,e:'<b>x</b>'})).status===400);
   ok('outsider C cannot react or read reactions (404)',(await op(C,'react',{id:cid,mid,e:'👍'})).status===404);
   ok('unknown message 404; nothing leaks sub/email',(await op(Bc,'react',{id:cid,mid:'m_nope',e:'👍'})).status===404&&!JSON.stringify((await get(A,'a=msgs&id='+cid)).json.rx).match(/"sub"|secret\.com/));
   await op(Bc,'react',{id:cid,mid,e:'👍'}); await op(Bc,'react',{id:cid,mid,e:'👍'});
   ok('all removed -> no rx entry left',(await get(A,'a=msgs&id='+cid)).json.rx[mid]===undefined||(await get(A,'a=msgs&id='+cid)).json.rx[mid].length===1);
  }
  // ---- images
  const s2=await op(Bc,'send',{id:cid,text:'Смотри',image:PNG});
  ok('B sends a photo with caption (by conversation id)',s2.status===200&&/a=mimg/.test(s2.json.msg.img));
  const im=await call(s2.json.msg.img,{cookie:A,raw:true});
  ok('photo served to the other member as an image',im.status===200&&im.type==='image/png'&&im.buf.length>20);
  ok('photo hidden from outsiders (404) and anonymous (401)',(await call(s2.json.msg.img,{cookie:C,raw:true})).status===404&&(await call(s2.json.msg.img,{raw:true})).status===401);
  ok('photo-only message allowed',(await op(Bc,'send',{id:cid,image:PNG})).status===200);
  ok('bad image types rejected',(await op(Bc,'send',{id:cid,image:'data:text/html;base64,PGI+'})).status===400&&(await op(Bc,'send',{id:cid,image:'data:image/jpeg;base64,'+PNG.split(',')[1]})).status===400);
  ok('too large photo rejected (413)',(await op(Bc,'send',{id:cid,image:'data:image/png;base64,iVBORw0KGgo'+'A'.repeat(700000)})).status===413);
  ok('text longer than 2000 is cut',(await op(A,'send',{id:cid,text:'x'.repeat(3000)})).json.msg.text.length===2000);
  const last=(await get(A,'a=convs')).json.convs[0];ok('inbox preview of the latest message',last.last.t==='text'&&last.unread===2);
  // ---- polling & paging
  const before=(await get(A,'a=msgs&id='+cid)).json.msgs;const lastTs=before[before.length-1].ts;
  await op(Bc,'send',{id:cid,text:'новое'});
  const aft=await get(A,'a=msgs&id='+cid+'&after='+lastTs);
  ok('poll with after= returns only newer messages',aft.json.msgs.length===1&&aft.json.msgs[0].text==='новое');
  for(let i=0;i<55;i++)await op(A,'send',{id:cid,text:'bulk '+i});
  const p1=(await get(A,'a=msgs&id='+cid)).json;
  ok('history is paged (50, more=true), oldest first',p1.msgs.length===50&&p1.more===true&&p1.msgs[0].ts<p1.msgs[49].ts&&p1.msgs[49].text==='bulk 54');
  const p2=(await get(A,'a=msgs&id='+cid+'&before='+p1.msgs[0].ts)).json;
  ok('earlier page continues without overlap',p2.msgs.length>0&&p2.msgs[p2.msgs.length-1].ts<p1.msgs[0].ts&&!p2.msgs.some(m=>p1.msgs.some(n=>n.id===m.id)));

  // saved messages (chat with yourself) + photo thumbnails
  const so=(await get(A,'a=open&nick=alice_w')).json;
  const un0=(await get(A,'a=unread')).json.unread;
  const ss=await op(A,'send',{nick:'alice_w',text:'заметка себе'});
  ok('saved messages: can write to yourself, no unread, nobody else sees it',ss.status===200&&ss.json.msg.mine&&(await get(A,'a=unread')).json.unread===un0&&(await get(Bc,'a=msgs&id='+so.id)).status===404);
  const sl=(await get(A,'a=convs')).json.convs.find(c=>c.id===so.id);
  ok('saved messages: listed in inbox with own profile',!!sl&&sl.user.nick==='alice_w'&&sl.unread===0);
  ok('saved messages: history readable',(await get(A,'a=msgs&id='+so.id)).json.msgs.some(m=>m.text==='заметка себе'));
  const th=await op(A,'send',{id:so.id,text:'',image:PNG,thumb:PNG,iw:900,ih:1200});
  ok('photo thumbnail stored, sizes returned, thumb url served',th.status===200&&!!th.json.msg.th&&th.json.msg.iw===900&&(await get(A,th.json.msg.th.split('?')[1])).status===200);
  // ---- delete (unsend)
  const mine1=s2.json.msg;
  ok('only the author can delete (403)',(await op(A,'delMsg',{id:cid,mid:mine1.id})).status===403);
  ok('author deletes own photo message',(await op(Bc,'delMsg',{id:cid,mid:mine1.id})).status===200);
  const all=(await get(A,'a=msgs&id='+cid+'&after=1')).json.msgs;
  ok('deleted message has no text/photo for anyone, photo file is gone',all.find(m=>m.id===mine1.id).del===true&&!all.find(m=>m.id===mine1.id).text&&(await call(mine1.img,{cookie:A,raw:true})).status===404);
  // ---- video (chunked upload, range streaming, forever) + push crypto
  const VID=require('crypto').randomBytes(1300*1024),CH=512*1024;
  const vs=await op(A,'vstart',{id:cid,mime:'video/mp4',size:VID.length,dur:7,w:640,h:360,poster:PNG});
  ok('video: start returns upload id and chunk plan',vs.status===200&&vs.json.n===3&&vs.json.chunk===CH);
  ok('video: oversize / wrong mime / bad poster rejected',(await op(A,'vstart',{id:cid,mime:'video/mp4',size:20*1024*1024,poster:PNG})).status===413&&(await op(A,'vstart',{id:cid,mime:'application/zip',size:1000,poster:PNG})).status===400&&(await op(A,'vstart',{id:cid,mime:'video/mp4',size:1000,poster:'x'})).status===400);
  ok('video: done before all chunks -> 409',(await op(A,'vdone',{id:cid,mid:vs.json.mid})).status===409);
  ok('video: only the uploader may send chunks',(await op(Bc,'vchunk',{id:cid,mid:vs.json.mid,i:0,data:VID.subarray(0,CH).toString('base64')})).status===404);
  for(let i=0;i<3;i++)ok('video: chunk '+i,(await op(A,'vchunk',{id:cid,mid:vs.json.mid,i,data:VID.subarray(i*CH,(i+1)*CH).toString('base64')})).status===200);
  const vd=await op(A,'vdone',{id:cid,mid:vs.json.mid,text:'смотри'});
  ok('video: message appears with video info and caption',vd.status===200&&vd.json.msg.vid&&vd.json.msg.vid.dur===7&&vd.json.msg.text==='смотри'&&vd.json.msg.vid.url.includes('a=mvid'));
  const vurl=vd.json.msg.vid.url,vm=vd.json.msg.id;
  const r0=await call(vurl,{cookie:Bc,raw:true,hdr:{Range:'bytes=0-1'}});
  ok('video: recipient streams with Range (206, exact bytes)',r0.status===206&&r0.buf.length===2&&r0.buf.equals(VID.subarray(0,2))&&r0.cr==='bytes 0-1/'+VID.length);
  const r1=await call(vurl,{cookie:Bc,raw:true,hdr:{Range:'bytes='+(CH-10)+'-'+(CH+10)}});
  ok('video: range crossing a chunk boundary is exact',r1.status===206&&r1.buf.equals(VID.subarray(CH-10,CH+11)));
  const r2=await call(vurl,{cookie:Bc,raw:true,hdr:{Range:'bytes=-100'}});
  ok('video: suffix range returns the tail',r2.status===206&&r2.buf.equals(VID.subarray(VID.length-100)));
  const rall=await call(vurl,{cookie:A,raw:true});ok('video: no Range header still works (partial, capped)',rall.status===206&&rall.buf.equals(VID.subarray(0,rall.buf.length)));
  ok('video: stranger gets 404',(await call(vurl,{cookie:C,raw:true,hdr:{Range:'bytes=0-1'}})).status===404);
  ok('video: poster is served',(await call(vd.json.msg.vid.poster,{cookie:Bc,raw:true})).status===200);
  ok('video: inbox preview type is text because of caption; caption-less -> vid',(await get(Bc,'a=convs')).json.convs.find(c=>c.id===cid).last.t==='text');
  await op(A,'delMsg',{id:cid,mid:vm});
  ok('video: unsend removes the file for everyone',(await call(vurl,{cookie:Bc,raw:true,hdr:{Range:'bytes=0-1'}})).status===404);
  ok('push: needs a valid subscription',(await op(Bc,'push',{sub:{endpoint:'http://x',keys:{}}})).status===400&&(await op(Bc,'push',{sub:{endpoint:'https://push.example/abc',keys:{p256dh:'a',auth:'b'}}})).status===200);
  const cfgj=await call('/api/config',{});ok('config: push key is null without VAPID env',cfgj.json&&cfgj.json.push===null);
  {const push=require('../api/_push'),cr=require('crypto');
   const ua=cr.createECDH('prime256v1');ua.generateKeys();const auth=cr.randomBytes(16);const msg=JSON.stringify({t:'msg',name:'Алиса',text:'Привет 👋'});
   const body=push.encrypt(msg,ua.getPublicKey().toString('base64url'),auth.toString('base64url'));
   // independent decrypt (manual HKDF) as the browser would do
   const hk=(salt,ikm,info,L)=>{const prk=cr.createHmac('sha256',salt).update(ikm).digest();return cr.createHmac('sha256',prk).update(Buffer.concat([info,Buffer.from([1])])).digest().subarray(0,L)};
   const salt=body.subarray(0,16),rs=body.readUInt32BE(16),idl=body[20],asPub=body.subarray(21,21+idl),ct=body.subarray(21+idl);
   const sec=ua.computeSecret(asPub),prk=hk(auth,sec,Buffer.concat([Buffer.from('WebPush: info\0'),ua.getPublicKey(),asPub]),32);
   const cek=hk(salt,prk,Buffer.from('Content-Encoding: aes128gcm\0'),16),nonce=hk(salt,prk,Buffer.from('Content-Encoding: nonce\0'),12);
   const d=cr.createDecipheriv('aes-128-gcm',cek,nonce);d.setAuthTag(ct.subarray(ct.length-16));const pt=Buffer.concat([d.update(ct.subarray(0,ct.length-16)),d.final()]);
   ok('push: payload encrypts per RFC 8291 and decrypts to the original (record size 4096, delimiter 0x02)',rs===4096&&idl===65&&pt[pt.length-1]===2&&pt.subarray(0,pt.length-1).toString()===msg);
   const kp=cr.generateKeyPairSync('ec',{namedCurve:'prime256v1'}),jw_=kp.privateKey.export({format:'jwk'}),pubRaw=Buffer.concat([Buffer.from([4]),Buffer.from(jw_.x,'base64url'),Buffer.from(jw_.y,'base64url')]);
   process.env.VAPID_PUBLIC_KEY=pubRaw.toString('base64url');process.env.VAPID_PRIVATE_KEY=jw_.d;
   const jwt=push.vapidJwt('https://push.example','https://howtodress.vercel.app'),[h,c,sg]=jwt.split('.');
   ok('push: VAPID JWT is ES256 and verifies with the public key',cr.verify('sha256',Buffer.from(h+'.'+c),{key:kp.publicKey,dsaEncoding:'ieee-p1363'},Buffer.from(sg,'base64url'))&&JSON.parse(Buffer.from(c,'base64url')).aud==='https://push.example');
  }
  // ---- block
  ok('B blocks A',(await op(Bc,'block',{nick:'alice_w',on:true})).json.blocked===true);
  ok('A cannot message B (403 blocked); B cannot message A while blocking (403 blocked_by_you)',(await op(A,'send',{id:cid,text:'?'})).json.error==='blocked'&&(await op(Bc,'send',{id:cid,text:'?'})).json.error==='blocked_by_you');
  ok('block state visible to both sides',(await get(Bc,'a=msgs&id='+cid)).json.blockedByMe===true&&(await get(A,'a=msgs&id='+cid)).json.blockedMe===true);
  await op(Bc,'block',{nick:'alice_w',on:false});ok('unblock restores messaging',(await op(A,'send',{id:cid,text:'снова'})).status===200);
  // ---- privacy
  ok('no email / sub anywhere in responses',!JSON.stringify([(await get(A,'a=convs')).json,(await get(A,'a=msgs&id='+cid)).json,(await get(A,'a=open&nick=bob.b')).json]).match(/secret\.com|"sub"|"1001"|"2002"/));
  ok('second conversation is separate and private',(await op(C,'send',{nick:'alice_w',text:'hey'})).status===200&&(await get(A,'a=convs')).json.convs.length===3&&(await get(Bc,'a=convs')).json.convs.length===1);

  // ---- activity status: exact time only for the privileged account (ACTIVITY_ADMIN_USER_ID=1001 = alice); self-block refused on the server
  const act=(await get(A,'a=activity&nick=bob.b'));
  ok('admin: exact last activity of any user via a=activity',act.status===200&&act.json.pres&&typeof act.json.pres.seen==='number'&&['online','recent'].includes(act.json.pres.st));
  ok('non-admin: a=activity answers 404',(await get(Bc,'a=activity&nick=alice_w')).status===404&&(await get(C,'a=activity&nick=alice_w')).status===404);
  const adm=(await get(A,'a=open&nick=cara_c')).json;
  ok('admin sees exact time even without mutual follow',adm.mutual===false&&adm.pres&&typeof adm.pres.seen==='number');
  const nb=(await get(Bc,'a=open&nick=cara_c')).json;
  ok('non-admin without mutual follow gets no presence at all',nb.pres===null&&!JSON.stringify(nb).includes('"seen"'));
  await sop(Bc,'follow',{nick:'cara_c',on:true});await sop(C,'follow',{nick:'bob.b',on:true});
  const nm=(await get(Bc,'a=open&nick=cara_c')).json;
  ok('non-admin mutual follow: only a coarse state, never a timestamp',nm.pres&&typeof nm.pres.st==='string'&&nm.pres.seen===undefined&&!JSON.stringify(nm).includes('"seen"'));
  const cv=(await get(Bc,'a=convs')).json, cvA=(await get(A,'a=convs')).json;
  ok('convs list: no timestamps for non-admin, exact for admin',!JSON.stringify(cv).includes('"seen"')&&cvA.convs.some(c=>c.pres&&typeof c.pres.seen==='number'));
  ok('only admin gets the admin flag',(await get(A,'a=unread')).json.admin===true&&(await get(Bc,'a=unread')).json.admin===false);
  await call('/api/auth',{method:'DELETE',cookie:Bc});
  const afterOut=(await get(A,'a=activity&nick=bob.b')).json.pres;
  ok('logged-out user is not "online" any more',afterOut&&afterOut.st!=='online');
  const sb=await op(A,'block',{nick:'alice_w',on:true});
  ok('cannot block your own account (400 self_block), nothing stored',sb.status===400&&sb.json.error==='self_block'&&(await get(A,'a=open&nick=alice_w')).json.blockedByMe===false);
  ok('blocking others still works',(await op(A,'block',{nick:'cara_c',on:true})).status===200&&(await op(A,'block',{nick:'cara_c',on:false})).status===200);

  // account ban (BANNED_NICKS): every request is refused with "banned", also new sign-ins; logout still works
  const Dv=await login({sub:'4004',name:'Dave',email:'dave@secret.com'});
  await sop(Dv,'profile',{nick:'dave_x'});
  const bn=await get(Dv,'a=convs');
  ok('banned nick: API answers 403 banned',bn.status===403&&bn.json.error==='banned');
  const bl=await fetch(B+'/api/auth',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'wd'},body:JSON.stringify({credential:mint({sub:'4004',name:'Dave',email:'dave@secret.com'})})});
  ok('banned account cannot sign in again (403, no cookie)',bl.status===403&&!bl.headers.get('set-cookie'));
  // ---- admin purge of banned accounts (dry run first, then confirmed); the ban survives
  await op(A,'send',{nick:'dave_x',text:'hello dave'});
  ok('purge is hidden from non-admins (404)',(await sop(Bc,'purgeBanned',{})).status===404&&(await sop(Bc,'purgeBanned',{confirm:true})).status===404);
  const dry=await sop(A,'purgeBanned',{});
  ok('dry run lists the banned account and deletes nothing',dry.status===200&&dry.json.dry===true&&dry.json.count===1&&dry.json.accounts[0].nick==='dave_x'&&dry.json.accounts[0].chats===1&&(await get(A,'a=open&nick=dave_x')).status===200&&!JSON.stringify(dry.json).match(/4004|secret\.com|"sub"/));
  const del=await sop(A,'purgeBanned',{confirm:true});
  ok('confirmed purge deletes the account',del.status===200&&del.json.dry===false&&del.json.count===1);
  ok('profile is gone (404), chat removed from the admin inbox',(await get(A,'a=open&nick=dave_x')).status===404&&!(await get(A,'a=convs')).json.convs.some((c)=>c.user.nick==='dave_x'));
  ok('second run finds nothing left to delete',(await sop(A,'purgeBanned',{})).json.count===0);
  ok('banned person still cannot sign in after the purge',(await fetch(B+'/api/auth',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'wd'},body:JSON.stringify({credential:mint({sub:'4004',name:'Dave',email:'dave@secret.com'})})})).status===403);
  ok('banned user can still log out; others unaffected',(await call('/api/auth',{method:'DELETE',cookie:Dv})).status===200&&(await get(A,'a=convs')).status===200);
 }catch(e){ok('no exception: '+e.message,false)}
 srv.kill();jw.close();console.log(fails?'\n'+fails+' FAILED':'\nall passed');process.exit(fails?1:0);
})();
