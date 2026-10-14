// BANNED_NICKS is the single switch: adding bans, removing lifts (even when the ban marker already exists)
process.env.SESSION_SECRET='x'.repeat(48);delete process.env.KV_REST_API_URL;delete process.env.KV_REST_API_TOKEN;process.env.NODE_ENV='development';
const {isBanned,db}=require('../api/_lib');let fails=0;const ok=(n,c)=>{if(!c)fails++;console.log((c?'PASS  ':'FAIL  ')+n)};
(async()=>{
 await db('SET','wd:s:nick:amfx','777');await db('SET','wd:s:prof:777',JSON.stringify({nick:'amfx'}));
 process.env.BANNED_NICKS='amfx, other';
 ok('listed nick is banned (marker stores the nick)',await isBanned('777')===true&&(await db('GET','wd:s:ban:777'))==='amfx');
 process.env.BANNED_NICKS='other';
 ok('removed from BANNED_NICKS -> ban lifted, marker deleted',await isBanned('777')===false&&!(await db('GET','wd:s:ban:777')));
 process.env.BANNED_NICKS='amfx';
 ok('re-adding bans again',await isBanned('777')===true);
 await db('SET','wd:s:ban:888','1');await db('SET','wd:s:prof:888',JSON.stringify({nick:'old_x'}));process.env.BANNED_NICKS='old_x';
 ok('legacy marker "1": still banned while the nick is listed, upgraded to the nick',await isBanned('888')===true&&(await db('GET','wd:s:ban:888'))==='old_x');
 process.env.BANNED_NICKS='';ok('empty list lifts everything',await isBanned('888')===false&&await isBanned('777')===false);
 console.log(fails?fails+' FAILED':'all passed');process.exit(fails?1:0);
})();
