import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {openStore} from './store.mjs';
import {createAuth,ApiError} from './auth.mjs';

export async function buildServer({databaseUrl='sqlite::memory:',secret}={}){
 const store=await openStore(databaseUrl),auth=await createAuth(store,secret);
 const server=createServer({requestTimeout:30000,headersTimeout:10000,maxHeaderSize:8192},async(req,res)=>{
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(JSON.stringify(data));};
  try{
   const path=new URL(req.url,'http://localhost').pathname,method=req.method;
   if(method==='GET'&&path==='/health')return reply(200,{status:'ok',vpn_provisioning:false,payments:false});
   if(req.url.includes('?'))throw new ApiError(400,'Query parameters not supported');
   await auth.rateLimit(`ip:${req.socket.remoteAddress}`);
   let body={};
   if(['POST','PUT'].includes(method)){
    if(!(req.headers['content-type']??'').startsWith('application/json'))throw new ApiError(415,'JSON required');
    let size=0;const chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size>16384)throw new ApiError(413,'Body too large');chunks.push(chunk);}
    try{body=JSON.parse(Buffer.concat(chunks).toString());if(!body||Array.isArray(body)||typeof body!=='object')throw Error();}catch{throw new ApiError(400,'Invalid JSON');}
   }
   if(['/api/auth/login','/api/auth/register'].includes(path)&&typeof body.email==='string')await auth.rateLimit(`account:${body.email.trim().toLowerCase()}`);
   const token=(req.headers.authorization??'').replace(/^Bearer /,'');
   const routes={
    'POST /api/auth/register':()=>auth.register(body),'POST /api/auth/login':()=>auth.login(body),'POST /api/auth/refresh':()=>auth.refresh(body),
    'POST /api/auth/logout':()=>auth.logout(token),'POST /api/auth/logout-all':()=>auth.logout(token,true),
    'POST /api/auth/password':()=>auth.changePassword(token,body),
    'POST /api/auth/pairing':()=>auth.pair(token),'POST /api/auth/pairing/consume':()=>auth.consume(body),
    'GET /api/user/profile':()=>auth.profile(token),'GET /api/user/devices':()=>auth.devices(token),
    'GET /api/servers':()=>auth.servers(token),'GET /api/subscription':()=>auth.subscription(token)
   };
   let result;const handler=routes[`${method} ${path}`];
   if(handler)result=await handler();
   else if(method==='DELETE'&&/^\/api\/user\/devices\/[a-zA-Z0-9-]+$/.test(path))result=await auth.revoke(token,path.split('/').at(-1));
   else if(method==='GET'&&/^\/api\/servers\/[a-zA-Z0-9-]+\/config$/.test(path))result=await auth.config(token,path.split('/').at(-2));
   else throw new ApiError(404,'Endpoint not found');
   reply(path==='/api/auth/register'?201:200,result);
  }catch(error){reply(error instanceof ApiError?error.status:500,{error:error instanceof ApiError?error.message:'Internal server error'});}
 });
 server.keepAliveTimeout=5000;
 return {server,store,auth};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const app=await buildServer({databaseUrl:process.env.DATABASE_URL??'sqlite:bulgar.db',secret:process.env.JWT_SECRET});
 const port=Number(process.env.PORT??8080);app.server.listen(port,process.env.HOST??'127.0.0.1',()=>console.log(`Bulgar API listening on port ${port}; no VPN engine attached`));
 async function stop(){app.server.close(async()=>{await app.store.close();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();}
 process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
