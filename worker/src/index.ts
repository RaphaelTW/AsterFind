export interface Env { DB: D1Database }

type Channel = {
  id:string; publisher_hash:string; viewer_hash:string; command_hash:string;
  state_ciphertext:string|null; state_updated_at:number|null; command_ciphertext:string|null; command_updated_at:number|null;
  expires_at:number; created_at:number;
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Cache-Control': 'no-store'
};

function json(data: unknown, status=200){ return new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}}); }
function text(data:string,status=200){ return new Response(data,{status,headers:cors}); }

async function hashToken(token:string){
  const bytes=new TextEncoder().encode(token);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function bearer(req:Request){ const h=req.headers.get('Authorization')||''; return h.startsWith('Bearer ')?h.slice(7):''; }
function validId(id:string){ return /^[a-f0-9-]{20,64}$/i.test(id); }
function validToken(t:string){ return /^[A-Za-z0-9_-]{20,100}$/.test(t); }

async function getChannel(env:Env,id:string){
  return env.DB.prepare('SELECT * FROM channels WHERE id = ?').bind(id).first<Channel>();
}
async function authorize(req:Request,ch:Channel,role:'publisher'|'viewer'|'command'){
  const token=bearer(req); if(!token) return false;
  const hash=await hashToken(token);
  const expected = role==='publisher' ? ch.publisher_hash : role==='viewer' ? ch.viewer_hash : ch.command_hash;
  return hash===expected;
}

export default {
  async fetch(req:Request,env:Env):Promise<Response>{
    if(req.method==='OPTIONS') return new Response(null,{status:204,headers:cors});
    const url=new URL(req.url);
    if(url.pathname==='/health') return json({ok:true,service:'asterfind-relay',time:Date.now()});

    // Best-effort cleanup. Keeps the relay data-minimal.
    env.DB.prepare('DELETE FROM channels WHERE expires_at < ?').bind(Date.now()).run().catch(()=>{});

    if(url.pathname==='/v1/channels' && req.method==='POST'){
      const body=await req.json<any>().catch(()=>null);
      if(!body || !validId(body.channelId) || !validToken(body.publisherToken) || !validToken(body.viewerToken) || !validToken(body.commandToken)) return text('invalid request',400);
      const expiresAt=Number(body.expiresAt);
      if(!Number.isSafeInteger(expiresAt) || expiresAt<=Date.now() || expiresAt>253402300799000) return text('invalid expiry',400);
      const [p,v,c]=await Promise.all([hashToken(body.publisherToken),hashToken(body.viewerToken),hashToken(body.commandToken)]);
      try {
        await env.DB.prepare('INSERT INTO channels (id,publisher_hash,viewer_hash,command_hash,expires_at,created_at) VALUES (?,?,?,?,?,?)')
          .bind(body.channelId,p,v,c,expiresAt,Date.now()).run();
      } catch { return text('channel exists',409); }
      return json({ok:true},201);
    }

    const m=url.pathname.match(/^\/v1\/channels\/([^/]+)(?:\/(state|command|expiry|meta))?$/);
    if(!m || !validId(m[1])) return text('not found',404);
    const id=m[1], sub=m[2];
    const ch=await getChannel(env,id);
    if(!ch || ch.expires_at<Date.now()) return text('not found',404);

    if(!sub && req.method==='DELETE'){
      const canDelete = await authorize(req,ch,'publisher') || await authorize(req,ch,'command');
      if(!canDelete) return text('unauthorized',401);
      await env.DB.prepare('DELETE FROM channels WHERE id=?').bind(id).run();
      return new Response(null,{status:204,headers:cors});
    }

    if(sub==='expiry' && req.method==='PUT'){
      if(!await authorize(req,ch,'publisher')) return text('unauthorized',401);
      const body=await req.json<any>().catch(()=>null);
      const expiresAt=Number(body?.expiresAt);
      if(!Number.isSafeInteger(expiresAt) || expiresAt<=Date.now() || expiresAt>253402300799000) return text('invalid expiry',400);
      await env.DB.prepare('UPDATE channels SET expires_at=? WHERE id=?').bind(expiresAt,id).run();
      return json({ok:true,expiresAt});
    }

    if(sub==='meta' && req.method==='GET'){
      if(!await authorize(req,ch,'viewer')) return text('unauthorized',401);
      return json({expiresAt:ch.expires_at,stateUpdatedAt:ch.state_updated_at});
    }

    if(sub==='state' && req.method==='PUT'){
      if(!await authorize(req,ch,'publisher')) return text('unauthorized',401);
      const body=await req.json<any>().catch(()=>null);
      if(!body?.ciphertext || String(body.ciphertext).length>20_000) return text('invalid payload',400);
      const ts=Date.now();
      await env.DB.prepare('UPDATE channels SET state_ciphertext=?, state_updated_at=? WHERE id=?').bind(String(body.ciphertext),ts,id).run();
      return json({ok:true,updatedAt:ts});
    }

    if(sub==='state' && req.method==='GET'){
      if(!await authorize(req,ch,'viewer')) return text('unauthorized',401);
      if(!ch.state_ciphertext) return new Response(null,{status:204,headers:cors});
      return json({ciphertext:ch.state_ciphertext,updatedAt:ch.state_updated_at});
    }

    if(sub==='command' && req.method==='POST'){
      if(!await authorize(req,ch,'command')) return text('unauthorized',401);
      const body=await req.json<any>().catch(()=>null);
      if(!body?.ciphertext || String(body.ciphertext).length>8_000) return text('invalid payload',400);
      const ts=Date.now();
      await env.DB.prepare('UPDATE channels SET command_ciphertext=?, command_updated_at=? WHERE id=?').bind(String(body.ciphertext),ts,id).run();
      return json({ok:true,updatedAt:ts});
    }

    if(sub==='command' && req.method==='GET'){
      if(!await authorize(req,ch,'publisher')) return text('unauthorized',401);
      const after=Number(url.searchParams.get('after')||0);
      if(!ch.command_ciphertext || !ch.command_updated_at || ch.command_updated_at<=after) return new Response(null,{status:204,headers:cors});
      return json({ciphertext:ch.command_ciphertext,updatedAt:ch.command_updated_at});
    }

    return text('method not allowed',405);
  }
};
