const {mint}=require('./mint'),http=require('http'),crypto=require('crypto');
// one process = JWKS endpoint + /mint token factory (same key pair)
const m=require('./mint');
const PORT=+process.argv[2];
http.createServer((q,res)=>{const u=new URL(q.url,'http://x');res.setHeader('Content-Type','application/json');
 if(u.pathname==='/mint'){res.end(JSON.stringify({t:mint({sub:u.searchParams.get('sub'),name:u.searchParams.get('name'),email:u.searchParams.get('email'),picture:'https://lh3.googleusercontent.com/'+u.searchParams.get('sub')})}));return}
 res.end(JSON.stringify({keys:[m.jwk||{}]}))}).listen(PORT);
