import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
process.env.NODE_ENV='test';
process.env.HOST='127.0.0.1';
process.env.DROPERAGENT_DISABLE_WORKER='1';
process.env.DROPERAGENT_ADMIN_PASSWORD='mapping-ci-only-strong-password';
process.env.DROPERAGENT_API_TOKEN='';
const { app }=require('../src/index.js');
test('mapping preflight is authenticated, read-only and cannot authorize supplier payment',async()=>{
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const headers={Origin:'https://sebastisnzoth.github.io','Content-Type':'application/json'};
  const request=(path,options={})=>fetch(base+path,{...options,headers:{...headers,...(options.headers||{})}});
  try{
    const input={storeVariants:[{sku:'BR-38',options:{Size:'BR 38'}}],
      supplierVariants:[{sku:'CN-7',options:{Size:'CN 7'},available:true}],rules:[]};
    let r=await request('/api/automation/mapping-preflight',{method:'POST',body:JSON.stringify(input)});
    assert.equal(r.status,401);
    r=await request('/auth/login',{method:'POST',body:JSON.stringify({password:'mapping-ci-only-strong-password'})});
    assert.equal(r.status,200);
    const token=(await r.json()).token;
    const authorized={Authorization:'Bearer '+token};
    r=await request('/api/automation/mapping-preflight',{method:'POST',headers:authorized,body:JSON.stringify(input)});
    assert.equal(r.status,200);
    let d=await r.json();
    assert.equal(d.readOnly,true);
    assert.equal(d.safeToSubmit,false);
    assert.equal(d.allMapped,false);
    assert.equal(d.purchaseAuthorized,false);
    assert.equal(d.supplierAccountVerified,false);
    assert.equal(d.results[0].reason,'NO_SUPPLIER_MATCH');
    input.rules=[{storeSku:'BR-38',storeOptions:{Size:'BR 38'},supplierOptions:{Size:'CN 7'},approved:true}];
    r=await request('/api/automation/mapping-preflight',{method:'POST',headers:authorized,body:JSON.stringify(input)});
    d=await r.json();
    assert.equal(d.allMapped,true);
    assert.equal(d.safeToSubmit,false);
    assert.equal(d.purchaseAuthorized,false);
    r=await request('/api/automation/mapping-preflight',{method:'POST',headers:authorized,body:JSON.stringify({storeVariants:{},supplierVariants:[],rules:[]})});
    assert.equal(r.status,400);
    r=await request('/auth/logout',{method:'POST',headers:authorized});
    assert.equal(r.status,200);
    r=await request('/api/automation/mapping-preflight',{method:'POST',headers:authorized,body:JSON.stringify(input)});
    assert.equal(r.status,401);
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
});
