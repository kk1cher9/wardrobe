// Test helper: fake Google (JWKS server + token minter) so the REAL verification code path is exercised.
const crypto=require('crypto'),http=require('http');
const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'test-kid',alg:'RS256',use:'sig'};
const b=o=>Buffer.from(typeof o==='string'?o:JSON.stringify(o)).toString('base64url');
function mint(claims,{kid='test-kid',key=privateKey}={}){const h=b({alg:'RS256',typ:'JWT',kid}),p=b({iss:'https://accounts.google.com',aud:'test-client',exp:Math.floor(Date.now()/1000)+3600,email_verified:true,...claims});
 const sig=crypto.sign('RSA-SHA256',Buffer.from(h+'.'+p),key).toString('base64url');return h+'.'+p+'.'+sig}
function serve(port){return new Promise(r=>{const s=http.createServer((q,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({keys:[jwk]}))}).listen(port,()=>r(s))})}
module.exports={mint,serve,crypto,jwk};
