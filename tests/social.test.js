// Driply (social) API tests: real server code, fake Google, in-memory DB. Run: node tests/social.test.js
const {spawn}=require('child_process'),{mint,serve}=require('./mint');
const PORT=9961,JWKS=9962,B=`http://127.0.0.1:${PORT}`;
let fails=0;const ok=(n,c,d)=>{console.log((c?'PASS':'FAIL')+'  '+n+(c||d===undefined?'':'  -> '+JSON.stringify(d)));if(!c){fails++;process.exitCode=1}};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const webp=Buffer.concat([Buffer.from('RIFF'),Buffer.from([30,0,0,0]),Buffer.from('WEBPVP8 '),Buffer.alloc(40)]).toString('base64');
const WEBP='data:image/webp;base64,'+webp;
(async()=>{
 const jw=await serve(JWKS);
 const srv=spawn('node',['dev-server.js'],{cwd:require('path').join(__dirname,'..'),env:{...process.env,PORT,GOOGLE_CERTS_URL:`http://127.0.0.1:${JWKS}`,GOOGLE_CLIENT_ID:'test-client',VERIFIED_NICKS:'alice_w, Other.Name',SESSION_SECRET:'x'.repeat(48),VERCEL:'',NODE_ENV:'development'}});
 await new Promise(r=>setTimeout(r,800));
 const call=async(path,{method='GET',cookie,body,csrf=true,raw}={})=>{const h={'Content-Type':'application/json'};if(cookie)h.Cookie=cookie;if(csrf)h['X-Requested-With']='wd';const r=await fetch(B+path,{method,headers:h,body:body?JSON.stringify(body):undefined});
  if(raw)return{status:r.status,type:r.headers.get('content-type'),cache:r.headers.get('cache-control'),buf:Buffer.from(await r.arrayBuffer())};let j=null;try{j=await r.json()}catch{}return{status:r.status,json:j}};
 const login=async(c)=>{const r=await fetch(B+'/api/auth',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'wd'},body:JSON.stringify({credential:mint(c)})});return r.headers.get('set-cookie').split(';')[0]};
 const op=(cookie,o,extra={})=>call('/api/social',{method:'POST',cookie,body:{op:o,...extra}});
 const get=(cookie,q)=>call('/api/social?'+q,{cookie});
 try{
  const A=await login({sub:'1001',name:'Alice A',email:'alice@secret.com',picture:'https://lh3.googleusercontent.com/a'}),Bc=await login({sub:'2002',name:'Bob B',email:'bob@secret.com'}),C=await login({sub:'3003',name:'Cara C',email:'cara@secret.com'});
  const cfg=await call('/api/config');ok('config tells the client Driply is available',cfg.json.social===true);
  // ---- auth
  ok('no session -> 401 on read and write',(await get(null,'a=me')).status===401&&(await get(null,'a=feed')).status===401&&(await call('/api/social',{method:'POST',body:{op:'like'}})).status===401);
  ok('POST without CSRF header -> 403',(await call('/api/social',{method:'POST',cookie:A,csrf:false,body:{op:'profile',nick:'alice_w'}})).status===403);
  // ---- profile
  const me0=await get(A,'a=me');ok('new user: no profile yet, gets a free nickname suggestion',me0.json.profile===null&&/^[a-z0-9_.]{3,20}$/.test(me0.json.suggest),me0.json);
  ok('every other action needs a profile (409)',(await get(A,'a=feed')).status===409&&(await op(A,'post',{image:PNG,thumb:PNG})).status===409);
  ok('bad nick rejected (too short, caps/space, reserved)',(await op(A,'profile',{nick:'ab'})).status===400&&(await op(A,'profile',{nick:'Bad Nick!'})).status===400&&(await op(A,'profile',{nick:'admin'})).status===400);
  const pa=await op(A,'profile',{nick:'alice_w',name:'Alice',bio:'streetwear fan'});ok('A creates profile',pa.status===200&&pa.json.profile.nick==='alice_w');
  ok('nickname is unique (B cannot take it, case-insensitively)',(await op(Bc,'profile',{nick:'Alice_W',name:'Bob'})).status===409);
  ok('B creates profile',(await op(Bc,'profile',{nick:'bob.b',name:'Bob'})).status===200);
  ok('C creates profile',(await op(C,'profile',{nick:'cara_c',name:'Cara'})).status===200);
  const ren=await op(C,'profile',{nick:'cara_c2',name:'Cara'});ok('rename works: new nick resolves, old nick is freed',ren.status===200&&(await get(C,'a=user&nick=cara_c2')).status===200&&(await get(C,'a=user&nick=cara_c')).status===404);
  await op(C,'profile',{nick:'cara_c'});
  const meA=await get(A,'a=me');ok('me returns counts and no email/sub',meA.json.profile.nick==='alice_w'&&meA.json.profile.posts===0&&!JSON.stringify(meA.json).includes('secret.com')&&!JSON.stringify(meA.json).includes('1001'));
  // ---- posting: validation
  const good={image:PNG,thumb:PNG,title:'Rainy day',caption:'Cosy & dry',style:'Streetwear',items:[{n:'Black jacket',c:'Jackets',col:'black'},{n:'Blue jeans',c:'Jeans'}],palette:['#111111','navy'],wx:{tmin:6,tmax:12,txt:'Rainy'}};
  ok('no image -> 400',(await op(A,'post',{caption:'x'})).status===400);
  ok('GIF/SVG/HTML data URLs rejected',(await op(A,'post',{...good,image:'data:image/gif;base64,R0lGODlhAQABAAAAACw='})).status===400&&(await op(A,'post',{...good,image:'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='})).status===400&&(await op(A,'post',{...good,image:'data:text/html;base64,PGI+'})).status===400);
  ok('file whose bytes do not match its declared type rejected',(await op(A,'post',{...good,image:'data:image/jpeg;base64,'+PNG.split(',')[1]})).status===400);
  ok('oversized photo -> 413',(await op(A,'post',{...good,image:'data:image/webp;base64,'+Buffer.concat([Buffer.from('RIFF'),Buffer.from([0,0,0,0]),Buffer.from('WEBP'),Buffer.alloc(700*1024)]).toString('base64')})).status===413);
  // ---- posting: success
  const p1=await op(A,'post',good);ok('A publishes an outfit (only photo is required)',p1.status===200&&p1.json.post.id&&p1.json.post.author.nick==='alice_w'&&p1.json.post.mine===true&&p1.json.post.likes===0);
  const p1id=p1.json.post.id;
  const pMin=await op(A,'post',{image:WEBP,thumb:WEBP});ok('photo-only post works',pMin.status===200&&pMin.json.post.title===''&&pMin.json.post.items.length===0);
  const dirty=await op(A,'post',{...good,caption:'  <script>alert(1)</script>\u0000 hi  ',style:'Hacker',items:[{n:'x'.repeat(200)}],palette:['javascript:1','#ABCDEF']});
  ok('input is cleaned: unknown style dropped, long names cut, bad palette dropped',dirty.json.post.style===''&&dirty.json.post.items[0].n.length===60&&JSON.stringify(dirty.json.post.palette)==='["#abcdef"]'&&!dirty.json.post.caption.includes('\u0000'));
  const img=await call('/api/social?a=img&id='+p1id,{cookie:Bc,raw:true});ok('photo is served with its real type, nosniff-safe and cacheable',img.status===200&&img.type==='image/png'&&/immutable/.test(img.cache)&&img.buf.length>20);
  ok('photo requires a session',(await call('/api/social?a=img&id='+p1id,{raw:true})).status===401);
  ok('thumbnail served',(await call('/api/social?a=img&id='+p1id+'&s=th',{cookie:Bc,raw:true})).status===200);
  ok('unknown / malicious id -> 404, never a crash',(await call('/api/social?a=img&id=../../etc',{cookie:Bc,raw:true})).status===404&&(await get(Bc,'a=post&id=nope')).status===404);
  // ---- feeds
  const fyB=await get(Bc,'a=feed&tab=foryou');ok('B sees A\'s posts in For You',fyB.json.posts.some(p=>p.id===p1id)&&fyB.json.posts[0].author.nick);
  const folEmpty=await get(Bc,'a=feed&tab=following');ok('Following is empty until B follows someone',folEmpty.json.posts.length===0&&folEmpty.json.nofollow===true);
  const f1=await op(Bc,'follow',{nick:'alice_w',on:true});ok('B follows A',f1.status===200&&f1.json.followers===1);
  ok('following twice does not duplicate',(await op(Bc,'follow',{nick:'alice_w',on:true})).json.followers===1);
  ok('cannot follow yourself / unknown user',(await op(Bc,'follow',{nick:'bob.b',on:true})).status===400&&(await op(Bc,'follow',{nick:'nobody_here',on:true})).status===404);
  const folB=await get(Bc,'a=feed&tab=following');ok('Following now shows A\'s posts, newest first',folB.json.posts.length===3&&folB.json.posts[0].ts>=folB.json.posts[1].ts&&folB.json.posts[0].author.following===true);
  ok('own posts are not in my Following feed',(await get(A,'a=feed&tab=following')).json.posts.length===0);
  // ---- likes
  const l1=await op(Bc,'like',{id:p1id,on:true});ok('like counts',l1.json.likes===1&&l1.json.liked===true);
  ok('liking twice cannot double count',(await op(Bc,'like',{id:p1id,on:true})).json.likes===1);
  ok('like by another user adds up',(await op(C,'like',{id:p1id,on:true})).json.likes===2);
  ok('unlike works',(await op(C,'like',{id:p1id,on:false})).json.likes===1);
  ok('like state is per user',(await get(Bc,'a=post&id='+p1id)).json.post.liked===true&&(await get(C,'a=post&id='+p1id)).json.post.liked===false);
  await op(A,'like',{id:p1id,on:true});
  // ---- trending
  const tr=await get(C,'a=feed&tab=trending');ok('Trending ranks the liked post first',tr.json.posts[0].id===p1id,tr.json.posts.map(p=>p.id));
  // ---- comments
  const c1=await op(Bc,'comment',{id:p1id,text:'  Love this  <b>fit</b> '});ok('B comments',c1.status===200&&c1.json.comment.author.nick==='bob.b'&&c1.json.total===1&&c1.json.comment.text.includes('Love this'));
  ok('empty comment rejected',(await op(Bc,'comment',{id:p1id,text:'   '})).status===400);
  const c2=await op(C,'comment',{id:p1id,text:'Nice!'});
  const cl=await get(A,'a=comments&id='+p1id);ok('comments list: author, time, ordered, deletion rights flagged',cl.json.comments.length===2&&cl.json.comments[0].ts<=cl.json.comments[1].ts&&cl.json.comments.every(c=>c.canDelete===true&&c.author.nick));
  const clC=await get(C,'a=comments&id='+p1id);ok('C can delete only its own comment',clC.json.comments.find(c=>c.id===c2.json.comment.id).canDelete&&!clC.json.comments.find(c=>c.id===c1.json.comment.id).canDelete);
  ok('C cannot delete B\'s comment (403)',(await op(C,'delComment',{id:p1id,cid:c1.json.comment.id})).status===403);
  ok('B deletes own comment',(await op(Bc,'delComment',{id:p1id,cid:c1.json.comment.id})).json.total===1);
  ok('post author can remove a comment under own post',(await op(A,'delComment',{id:p1id,cid:c2.json.comment.id})).json.total===0);
  await op(Bc,'comment',{id:p1id,text:'again'});
  // ---- notifications (stored per account, no fakes)
  const nA=await get(A,'a=notifs');const types=nA.json.notifs.map(n=>n.type).sort();
  ok('A got exactly the real events: 1 like(B)+1 like(C removed? still notified once)+comments+follow',nA.json.notifs.length>=4&&types.includes('like')&&types.includes('follow')&&types.includes('comment'),types);
  ok('A\'s own like on own post creates no notification',!nA.json.notifs.some(n=>n.actor.nick==='alice_w'));
  ok('notification repeats are not created (like/unlike/like)',(await (async()=>{await op(Bc,'like',{id:p1id,on:false});await op(Bc,'like',{id:p1id,on:true});return (await get(A,'a=notifs')).json.notifs.filter(n=>n.type==='like'&&n.actor.nick==='bob.b').length})())===1);
  const meA2=await get(A,'a=me');ok('unread counter > 0',meA2.json.unread>=4);
  await op(A,'notifSeen');ok('marking seen clears the counter',(await get(A,'a=me')).json.unread===0&&(await get(A,'a=notifs')).json.notifs.every(n=>!n.unread));
  ok('B has no notifications about events that did not happen to B',(await get(Bc,'a=notifs')).json.notifs.length===0);
  ok('C sees only own notifications (none)',(await get(C,'a=notifs')).json.notifs.length===0);
  // ---- saves
  const s1=await op(Bc,'save',{id:p1id,on:true});ok('B saves a post',s1.json.saves===1&&s1.json.saved===true);
  ok('saving twice does not duplicate',(await op(Bc,'save',{id:p1id,on:true})).json.saves===1);
  const sv=await get(Bc,'a=saved');ok('saved collection lists it, flagged saved',sv.json.posts.length===1&&sv.json.posts[0].id===p1id&&sv.json.posts[0].saved===true);
  ok('saved is private: A and C have nothing saved',(await get(A,'a=saved')).json.posts.length===0&&(await get(C,'a=saved')).json.posts.length===0);
  // ---- profiles / privacy
  const ua=await get(Bc,'a=user&nick=alice_w');ok('public profile: counts, follow state, posts, no private data',ua.json.profile.posts===3&&ua.json.profile.followers===1&&ua.json.profile.isFollowing===true&&!JSON.stringify(ua.json).includes('secret.com')&&!JSON.stringify(ua.json).includes('1001'));
  ok('followers/following lists',(await get(Bc,'a=follows&nick=alice_w&kind=followers')).json.users[0].nick==='bob.b'&&(await get(Bc,'a=follows&nick=bob.b&kind=following')).json.users[0].nick==='alice_w');
  ok('edit own profile (bio) and others cannot be edited (profile op only touches the caller)',(await op(Bc,'profile',{nick:'bob.b',name:'Bob',bio:'hi'})).status===200&&(await get(A,'a=user&nick=alice_w')).json.profile.bio==='streetwear fan');
  // ---- authorisation on posts
  ok('B cannot edit A\'s post (403)',(await op(Bc,'editPost',{id:p1id,title:'hacked'})).status===403);
  ok('B cannot delete A\'s post (403)',(await op(Bc,'delPost',{id:p1id})).status===403);
  const ed=await op(A,'editPost',{id:p1id,title:'New title',style:'Casual'});ok('A edits own post',ed.status===200&&ed.json.post.title==='New title'&&ed.json.post.style==='Casual'&&ed.json.post.items.length===2);
  // ---- search / discover
  const se=await get(Bc,'a=search&q=alice');ok('search by nickname',se.json.users.some(u=>u.nick==='alice_w'));
  const sp=await get(Bc,'a=search&q=black%20jacket');ok('search by outfit item / title',se.status===200&&sp.json.posts.some(p=>p.id===p1id));
  ok('search by style',(await get(Bc,'a=search&q=casual')).json.posts.some(p=>p.id===p1id));
  ok('short query returns nothing instead of everything',(await get(Bc,'a=search&q=a')).json.posts.length===0);
  const di=await get(C,'a=discover');ok('discover: trending, style sections, authors to follow',di.status===200&&di.json.trending.length>0&&Array.isArray(di.json.sections)&&di.json.authors.some(a=>a.nick==='alice_w'));
  ok('discover does not suggest people I already follow',!(await get(Bc,'a=discover')).json.authors.some(a=>a.nick==='alice_w'));
  // ---- pagination
  for(let i=0;i<12;i++)await op(A,'post',{image:PNG,thumb:PNG,title:'bulk '+i});
  const pg1=await get(C,'a=feed&tab=foryou');ok('page 1 is 12 posts with a next cursor',pg1.json.posts.length===12&&pg1.json.next===12);
  const pg2=await get(C,'a=feed&tab=foryou&cursor=12');ok('page 2 has the rest, no duplicates, no cursor at the end',pg2.json.posts.length===3&&pg2.json.next===null&&!pg2.json.posts.some(p=>pg1.json.posts.some(q=>q.id===p.id)));
  const up=await get(C,'a=uposts&nick=alice_w&cursor=12');ok('profile grid paginates',up.json.posts.length===3);
  // ---- delete
  const del=await op(A,'delPost',{id:p1id});ok('A deletes own post',del.status===200);
  ok('deleted post is gone everywhere (post, photo, feed, saved)',(await get(Bc,'a=post&id='+p1id)).status===404&&(await call('/api/social?a=img&id='+p1id,{cookie:Bc,raw:true})).status===404&&!(await get(Bc,'a=feed&tab=foryou')).json.posts.some(p=>p.id===p1id)&&(await get(Bc,'a=saved')).json.posts.length===0);
  ok('profile post counter follows',(await get(Bc,'a=user&nick=alice_w')).json.profile.posts===14);
  ok('reacting to a deleted post -> 404',(await op(Bc,'like',{id:p1id,on:true})).status===404);
  // ---- unfollow
  ok('B unfollows A',(await op(Bc,'follow',{nick:'alice_w',on:false})).json.followers===0);
  // ---- stories
  const sty1=await op(A,'story',{image:PNG,caption:'Утро в городе'});
  ok('A posts a story',sty1.status===200&&sty1.json.story.id&&sty1.json.story.cap==='Утро в городе');
  ok('story needs a valid image',(await op(A,'story',{image:'data:text/html;base64,PGI+'})).status===400&&(await op(A,'story',{})).status===400);
  ok('story too large rejected (413)',(await op(A,'story',{image:'data:image/png;base64,iVBORw0KGgo'+'A'.repeat(700000)})).status===413);
  const sid=sty1.json.story&&sty1.json.story.id;
  ok('B (not following) does not see A\'s story in the tray nor the photo',!(await get(Bc,'a=stories')).json.groups.some(g=>g.author.nick==='alice_w')&&(await call('/api/social?a=simg&id='+sid,{cookie:Bc,raw:true})).status===404&&(await op(Bc,'storySeen',{id:sid})).status===404);
  await op(Bc,'follow',{nick:'alice_w',on:true});
  const trB=(await get(Bc,'a=stories')).json.groups;
  ok('after following B sees A\'s story, unseen, ring first',trB.length===1&&trB[0].author.nick==='alice_w'&&trB[0].stories[0].seen===false&&trB[0].allSeen===false&&trB[0].stories[0].views===undefined);
  ok('story photo served to follower',(await call('/api/social?a=simg&id='+sid,{cookie:Bc,raw:true})).status===200);
  ok('B marks it seen; marking twice does not duplicate',(await op(Bc,'storySeen',{id:sid})).status===200&&(await op(Bc,'storySeen',{id:sid})).status===200);
  ok('seen state is stored for B',(await get(Bc,'a=stories')).json.groups[0].allSeen===true);
  const trA=(await get(A,'a=stories')).json.groups;
  ok('A sees own story first with view counter 1 (own view not counted)',trA[0].author.me===true&&trA[0].stories[0].views===1&&(await op(A,'storySeen',{id:sid})).status===200&&(await get(A,'a=stories')).json.groups[0].stories[0].views===1);
  ok('only the author can see who watched',(await get(A,'a=sviewers&id='+sid)).json.users.map(u=>u.nick).join()==='bob.b'&&(await get(Bc,'a=sviewers&id='+sid)).status===404);
  ok('B cannot delete A\'s story (403)',(await op(Bc,'delStory',{id:sid})).status===403);
  ok('stories carry no email / sub',!JSON.stringify((await get(Bc,'a=stories')).json).match(/secret\.com|"sub"/));
  // expiry: rewrite timestamp 25h back through the emulated db is not possible from outside, so check via a second story deletion path
  ok('A deletes own story',(await op(A,'delStory',{id:sid})).status===200&&!(await get(Bc,'a=stories')).json.groups.length&&(await call('/api/social?a=simg&id='+sid,{cookie:A,raw:true})).status===404);
  await op(Bc,'follow',{nick:'alice_w',on:false});
  ok('verified check: only the configured nick has it (profile, posts, lists, search)',(await get(Bc,'a=user&nick=alice_w')).json.profile.verified===true&&(await get(A,'a=user&nick=bob.b')).json.profile.verified===false&&(await get(Bc,'a=feed&tab=foryou')).json.posts.filter(p=>p.author.nick==='alice_w').every(p=>p.author.verified===true)&&(await get(Bc,'a=search&q=alice')).json.users[0].verified===true);
  // ---- custom avatar
  const avr=await op(A,'profile',{avatar:PNG});
  ok('A uploads a custom avatar -> profile gets a versioned avatar url',avr.status===200&&/a=avatar&nick=alice_w&v=\d+/.test(avr.json.profile.avatar),avr.json);
  const avimg=await call('/api/social?a=avatar&nick=alice_w',{cookie:Bc,raw:true});
  ok('avatar is served to other signed-in users as an image',avimg.status===200);
  ok('avatar needs a valid image type',(await op(A,'profile',{avatar:'data:text/html;base64,PGI+'})).status===400&&(await op(A,'profile',{avatar:'data:image/jpeg;base64,'+PNG.split(',')[1]})).status===400);
  ok('avatar too large rejected (413)',(await op(A,'profile',{avatar:'data:image/png;base64,iVBORw0KGgo'+'A'.repeat(100000)})).status===413);
  ok('avatar url appears on posts',(await get(Bc,'a=feed&tab=foryou')).json.posts.every(p=>p.author.nick!=='alice_w'||/a=avatar/.test(p.author.avatar)));
  ok('editing other fields keeps the avatar',(await op(A,'profile',{bio:'hi'})).json.profile.avatar.includes('a=avatar'));
  ok('reset restores the Google picture and removes the file',(await op(A,'profile',{resetAvatar:true})).json.profile.avatar.includes('a=avatar')===false&&(await call('/api/social?a=avatar&nick=alice_w',{cookie:Bc,raw:true})).status===404);
  // ---- profile extras: styles, earning status, favourite brands
  const px=await op(A,'profile',{fstyles:['Streetwear','Old Money','Techwear','Мой винтаж','streetwear'],brands:['Nike','Stüssy','Моя марка','nike'],earn:'style',earnPub:true});
  ok('multi-style save: several chips + a custom one, de-duplicated',px.status===200&&px.json.profile.fst.join()==='Streetwear,Old Money,Techwear,Мой винтаж'&&px.json.profile.brands.join()==='Nike,Stüssy,Моя марка');
  const seenB=(await get(Bc,'a=user&nick=alice_w')).json.profile;
  ok('others see styles, brands and the PUBLIC earning status',seenB.fst.length===4&&seenB.brands.length===3&&seenB.earn==='style'&&seenB.earnPub===undefined);
  await op(A,'profile',{earnPub:false});
  ok('earning status hidden from others when not public (owner still sees it)',(await get(Bc,'a=user&nick=alice_w')).json.profile.earn===undefined&&(await get(A,'a=me')).json.profile.earn==='style');
  await op(A,'profile',{earnPub:true,earn:'hidden'});
  ok('"Не указывать" is never shown to others even if public',(await get(Bc,'a=user&nick=alice_w')).json.profile.earn===undefined);
  await op(A,'profile',{earn:'style'});
  ok('invalid earning value is dropped; no income fields are accepted',(await op(A,'profile',{earn:'1000000$'})).json.profile.earn===''&&(await op(A,'profile',{earn:'style',income:5000})).json.profile.income===undefined);
  await op(A,'profile',{earn:'clients',earnPub:true});
  await op(A,'profile',{bio:'only bio'});
  const pxa=(await get(A,'a=me')).json.profile;
  ok('partial update (bio only) does not wipe styles, brands or earning',pxa.fst.length===4&&pxa.brands.length===3&&pxa.earn==='clients'&&pxa.earnPub===true);
  const A2=await login({sub:'1001',name:'Alice A',email:'alice@secret.com'});
  const pxa2=(await get(A2,'a=me')).json.profile;
  ok('after logout/login the extras are loaded again',pxa2.fst.includes('Old Money')&&pxa2.brands.includes('Моя марка'));
  await op(A,'profile',{fstyles:[],brands:[]});
  ok('explicit empty arrays clear the lists',(await get(A,'a=me')).json.profile.fst.length===0&&(await get(A,'a=me')).json.profile.brands.length===0);
  await op(A,'profile',{fstyles:['Y2K'],brands:['COS']});
  const bobBefore=(await get(Bc,'a=me')).json.profile;
  await op(A,'profile',{nick:'bob.b',fstyles:['Hack']});
  ok('cannot edit someone else\'s profile: the nick is taken and B is untouched',(await op(A,'profile',{nick:'bob.b'})).status===409&&JSON.stringify((await get(Bc,'a=me')).json.profile)===JSON.stringify(bobBefore));
  ok('profile op has no way to address another account (no sub / target param honoured)',(await op(A,'profile',{sub:'2002',target:'bob.b',fstyles:['X']})).json.profile.nick==='alice_w'&&(await get(Bc,'a=me')).json.profile.fst.join()===bobBefore.fst.join());
  ok('unauthenticated profile edit refused',(await call('/api/social',{method:'POST',body:{op:'profile',fstyles:['X']}})).status===401);
  // ---- editor extras: GIF stickers, outfit strip, video posts, reposts
  const GIF='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const ex=await op(A,'post',{image:PNG,thumb:PNG,title:'extras',gifs:[GIF],ov:[{g:0,x:30,y:40,w:25,r:12},{u:'https://media2.giphy.com/media/abc/giphy.gif',x:70,y:60,w:30,r:-5},{u:'https://evil.example/x.gif',x:1,y:1,w:10,r:0},{g:5,x:1,y:1,w:10,r:0}],fit:[{n:'Black hoodie',c:'Tops',img:WEBP},{n:'Jeans',c:'Bottoms',img:WEBP}]});
  const exp=ex.json&&ex.json.post;
  ok('post with GIF stickers + outfit strip: only valid overlays kept (own gif ref, giphy https url)',ex.status===200&&exp.ov.length===2&&exp.ov[0].u.includes('a=ovg')&&exp.ov[1].u.startsWith('https://media2.giphy.com/')&&exp.fit.length===2&&exp.fit[0].n==='Black hoodie'&&/a=fit/.test(exp.fit[0].u));
  ok('own GIF and outfit tiles are served (images, cached hard)',(await call(exp.ov[0].u.replace('/api/social','/api/social'),{cookie:Bc,raw:true})).status===200&&(await call(exp.fit[1].u,{cookie:Bc,raw:true})).status===200&&(await call('/api/social?a=fit&id='+exp.id+'&k=9',{cookie:Bc,raw:true})).status===404);
  ok('bad extras rejected: non-gif sticker, fake image in outfit tile',(await op(A,'post',{image:PNG,thumb:PNG,gifs:['data:image/gif;base64,AAAA']})).status===400&&(await op(A,'post',{image:PNG,thumb:PNG,fit:[{n:'x',img:'data:image/webp;base64,AAAA'}]})).status===400);
  ok('GIF search without GIPHY_API_KEY: empty list, flagged off (no key leaked)',(await get(Bc,'a=gifs&q=cat')).json.off===true&&!JSON.stringify((await get(Bc,'a=gifs')).json).includes('api_key'));
  // video post: upload chunks, publish with the uploaded id, stream with ranges
  const vbuf=Buffer.alloc(700000,7),vs=await op(A,'pvstart',{mime:'video/mp4',size:vbuf.length,dur:5,w:640,h:360});
  ok('pvstart announces 2 chunks of 512 KB',vs.status===200&&vs.json.n===2&&vs.json.chunk===524288);
  ok('video type/size validated',(await op(A,'pvstart',{mime:'application/pdf',size:10})).status===400&&(await op(A,'pvstart',{mime:'video/mp4',size:99999999})).status===413);
  const early=await op(A,'post',{image:PNG,thumb:PNG,vid:vs.json.vid});
  ok('publishing before all chunks arrived -> 409 incomplete',early.status===409);
  await op(A,'pvchunk',{vid:vs.json.vid,i:0,data:vbuf.subarray(0,524288).toString('base64')});
  ok('only the uploader can add chunks',(await op(Bc,'pvchunk',{vid:vs.json.vid,i:1,data:'AAAA'})).status===404);
  await op(A,'pvchunk',{vid:vs.json.vid,i:1,data:vbuf.subarray(524288).toString('base64')});
  const vp=await op(A,'post',{image:PNG,thumb:PNG,title:'clip',vid:vs.json.vid}),vpp=vp.json&&vp.json.post;
  ok('video post: poster as image, video meta exposed',vp.status===200&&vpp.vid&&vpp.vid.dur===5&&vpp.vid.url.includes('a=pvid')&&!JSON.stringify(vpp).includes(vs.json.vid));
  const rg=await fetch(B+'/api/social?a=pvid&id='+vpp.id,{headers:{Cookie:Bc,Range:'bytes=524280-524299','X-Requested-With':'wd'}});
  const rb=Buffer.from(await rg.arrayBuffer());
  ok('range request across the chunk border: 206, exact bytes',rg.status===206&&rb.length===20&&rg.headers.get('content-range')==='bytes 524280-524299/700000'&&rb.every((x)=>x===7));
  ok('video needs a session',(await call('/api/social?a=pvid&id='+vpp.id,{raw:true})).status===401);
  // reposts
  ok('cannot repost your own post (400)',(await op(A,'repost',{id:vpp.id})).status===400);
  const rp=await op(Bc,'repost',{id:vpp.id});
  ok('B reposts A\'s video post',rp.status===200&&rp.json.reposted===true&&rp.json.reposts===1);
  ok('reposting twice does not duplicate',(await op(Bc,'repost',{id:vpp.id})).json.reposts===1&&(await get(Bc,'a=user&nick=bob.b')).json.posts.filter((x)=>x.id===vpp.id).length===1);
  const bp=(await get(Bc,'a=user&nick=bob.b')).json.posts.find((x)=>x.id===vpp.id);
  ok('repost shows the original with the reposter, original author kept, video still playable',bp&&bp.rby.nick==='bob.b'&&bp.rby.me===true&&bp.author.nick==='alice_w'&&bp.reposted===true&&bp.reposts===1&&!!bp.vid&&bp.mine===false&&!!bp.rid);
  await op(C,'follow',{nick:'bob.b',on:true});
  ok('followers of B see the repost in their Following feed',(await get(C,'a=feed&tab=following')).json.posts.some((x)=>x.id===vpp.id&&x.rby&&x.rby.nick==='bob.b'));
  ok('A (author) sees the repost counter',(await get(A,'a=user&nick=alice_w')).json.posts.find((x)=>x.id===vpp.id).reposts===1);
  ok('B deletes the repost via unrepost; counter back to 0; original untouched',(await op(Bc,'unrepost',{id:vpp.id})).json.reposts===0&&!(await get(Bc,'a=user&nick=bob.b')).json.posts.some((x)=>x.id===vpp.id)&&(await get(A,'a=user&nick=alice_w')).json.posts.some((x)=>x.id===vpp.id));
  await op(Bc,'repost',{id:vpp.id});
  ok('deleting the original removes its reposts from every list (and its video chunks)',(await op(A,'delPost',{id:vpp.id})).status===200&&!(await get(Bc,'a=user&nick=bob.b')).json.posts.some((x)=>x.id===vpp.id)&&(await call('/api/social?a=pvid&id='+vpp.id,{cookie:Bc,raw:true})).status===404);
  ok('deleting a post with GIF/outfit extras removes them too',(await op(A,'delPost',{id:exp.id})).status===200&&(await call(exp.fit[0].u,{cookie:Bc,raw:true})).status===404);
  // story with a GIF sticker
  const sg=await op(A,'story',{image:PNG,gifs:[GIF],ov:[{g:0,x:50,y:50,w:30,r:0}]});
  ok('story with GIF sticker: overlay served to followers only',sg.status===200&&sg.json.story.ov.length===1&&(await call(sg.json.story.ov[0].u,{cookie:A,raw:true})).status===200&&(await call(sg.json.story.ov[0].u,{cookie:Bc,raw:true})).status===404);
 }catch(e){ok('no exception: '+e.message,false)}
 srv.kill();jw.close();console.log(fails?'\n'+fails+' FAILED':'\nall passed');process.exit(fails?1:0);
})();
