export async function openStore(url = 'sqlite::memory:') {
 const schema = `
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,device_limit INTEGER NOT NULL DEFAULT 5,subscription_status TEXT NOT NULL DEFAULT 'inactive');
 CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,platform TEXT NOT NULL,revoked INTEGER NOT NULL DEFAULT 0,created_at BIGINT NOT NULL);
 CREATE TABLE IF NOT EXISTS refresh_tokens(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),device_id TEXT NOT NULL REFERENCES devices(id),used INTEGER NOT NULL DEFAULT 0,expires_at BIGINT NOT NULL);
 CREATE TABLE IF NOT EXISTS pairing_codes(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),issuer_device_id TEXT NOT NULL REFERENCES devices(id),expires_at BIGINT NOT NULL,used INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS servers(id TEXT PRIMARY KEY,country TEXT NOT NULL,city TEXT NOT NULL,protocol TEXT NOT NULL,available INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires_at BIGINT NOT NULL);
 CREATE INDEX IF NOT EXISTS devices_owner ON devices(user_id,revoked);
 `;
 if (url.startsWith('sqlite:')) {
  if (process.env.NODE_ENV === 'production') throw new Error('PostgreSQL required in production');
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(url.slice(7));
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;'); db.exec(schema);
  const sql = {get: async(q,p=[])=>db.prepare(q).get(...p),all:async(q,p=[])=>db.prepare(q).all(...p),run:async(q,p=[])=>db.prepare(q).run(...p)};
  let queue = Promise.resolve();
  return {transaction(fn){const next=queue.then(async()=>{db.exec('BEGIN IMMEDIATE');try{const result=await fn(sql);db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}});queue=next.catch(()=>{});return next;},close:async()=>{await queue;db.close();}};
 }
 if (!/^postgres(ql)?:\/\//.test(url)) throw new Error('Unsupported database URL');
 const { Pool } = await import('pg');
 const pool = new Pool({connectionString:url,max:5}); await pool.query(schema);
 return {async transaction(fn){const client=await pool.connect();let active=false;const query=(q,p=[])=>{let n=0;return client.query(q.replace(/\?/g,()=>`$${++n}`),p);};try{await client.query('BEGIN');active=true;await client.query('SELECT pg_advisory_xact_lock(6049201)');const result=await fn({get:async(q,p)=>(await query(q,p)).rows[0],all:async(q,p)=>(await query(q,p)).rows,run:query});await client.query('COMMIT');return result;}catch(e){if(active)await client.query('ROLLBACK');throw e;}finally{client.release();}},close:()=>pool.end()};
}
