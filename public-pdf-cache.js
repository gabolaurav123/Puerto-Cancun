"use strict";
const crypto=require("node:crypto");

// Bounded memory cache for public PDFs. It stores no document or inventory data
// in the database, and deduplicates concurrent renders of the same revision.
function createPublicPdfCache({maxEntries=24,maxBytes=32*1024*1024,ttlMs=5*60*1000,now=Date.now}={}) {
  const entries=new Map();let bytes=0;
  function remove(key) {const entry=entries.get(key);if(!entry)return;bytes-=entry.bytes||0;entries.delete(key);}
  function prune() {
    for(const [key,entry] of entries)if(entry.expires<=now())remove(key);
    while(entries.size>maxEntries||bytes>maxBytes)remove(entries.keys().next().value);
  }
  async function get(identity,render) {
    prune();
    const key=crypto.createHash("sha256").update(JSON.stringify(identity)).digest("hex");
    if(entries.has(key)) {const entry=entries.get(key);entries.delete(key);entries.set(key,entry);return entry.promise;}
    const entry={bytes:0,expires:now()+ttlMs,promise:null};
    entry.promise=Promise.resolve().then(render).then(buffer=>{
      if(!Buffer.isBuffer(buffer))throw new Error("PDF renderer must return a Buffer.");
      if(entries.get(key)===entry){entry.bytes=buffer.length;bytes+=buffer.length;prune();}return buffer;
    }).catch(error=>{if(entries.get(key)===entry)remove(key);throw error;});
    entries.set(key,entry);prune();return entry.promise;
  }
  return {get,stats:()=>({entries:entries.size,bytes}),clear:()=>{entries.clear();bytes=0;}};
}
module.exports={createPublicPdfCache};
