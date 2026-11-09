import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const originalFetch=globalThis.fetch;
process.env.NODE_ENV='test';
process.env.HOST='127.0.0.1';
process.env.DROPERAGENT_DISABLE_WORKER='1';
process.env.DROPERAGENT_ADMIN_PASSWORD='cj-integration-test-password';
process.env.DROPERAGENT_API_TOKEN='';
process.env.CJ_ACCESS_TOKEN='cj-ci-only-non-production-token-12345';
let called=0;
globalThis.fetch=async (url,options={})=>{
  if(!String(url).startsWith('https://developers.cjdropshipping.com/api2.0/v1/')) {
    return originalFetch(url,options);
  }
  called++;
  assert.equal(options.method,'GET');
  assert.equal(options.headers['CJ-Access-Token'],process.env.CJ_ACCESS_TOKEN);
  return new Response(JSON.stringify({
    result:true,code:200,data:{content:[{productList:[{
      id:'CJ-PID-1',nameEn:'TWS earbud',sku:'CJ-123',
      nowPrice:'10.10',metadata:{email:'DO_NOT_LEAK'}
    }]}]}
  }),{status:200,headers:{'content-type':'application/json'}});
};
const {app}=require('../src/index.js');
test('CJ endpoints require admin auth, bounded input and expose no provider credentials',async()=>{
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const root='http://127.0.0.1:'+server.address().port;
  const request=(p,options={})=>originalFetch(root+p,{
    ...options,headers:{Origin:'https://sebastisnzoth.github.io',...(options.headers||{})}
  });
  try{
    let r=await request('/api/sourcing/cj/search?keyword=earbuds');
    assert.equal(r.status,401);assert.equal(called,0);
    r=await request('/auth/login',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({password:process.env.DROPERAGENT_ADMIN_PASSWORD})
    });
    assert.equal(r.status,200);
    const {token}=await r.json();
    const auth={Authorization:'Bearer '+token};
    r=await request('/api/sourcing/cj/status',{headers:auth});
    assert.equal(r.status,200);
    let status=await r.json();
    assert.equal(status.configured,true);
    assert.equal(status.hasAuthenticatedCJAccount,false);
    assert.equal(status.purchaseAuthorized,false);
    r=await request('/api/sourcing/cj/search?keyword=earbuds&page=1&size=10',{headers:auth});
    assert.equal(r.status,200);
    const raw=await r.text(), data=JSON.parse(raw);
    assert.equal(data.source,'cj_api_v2');
    assert.equal(data.purchaseAuthorized,false);
    assert.equal(data.items.length,1);
    assert.equal(raw.includes('DO_NOT_LEAK'),false);
    assert.equal(raw.includes(process.env.CJ_ACCESS_TOKEN),false);
    assert.equal(r.headers.get('cache-control'),'no-store');
    r=await request('/api/sourcing/cj/search?keyword=earbuds&page=1&size=200',{headers:auth});
    assert.equal(r.status,400);
    assert.equal(called,1);
    r=await request('/api/sourcing/cj/variants?pid=../orders',{headers:auth});
    assert.equal(r.status,400);
    assert.equal(called,1);
    r=await request('/api/sourcing/cj/freight-quote',{
      method:'POST',headers:{...auth,'Content-Type':'application/json'},
      body:JSON.stringify({vid:'../../orders',quantity:1})
    });
    assert.equal(r.status,400);
    assert.equal(called,1);
    r=await request('/api/sourcing/cj/stock?vid=VID-01',{headers:auth});
    assert.equal(r.status,429); // Local Free-tier API limiter blocks rapid consecutive calls.
    assert.equal(called,1);
    r=await originalFetch(root+'/api/sourcing/cj/status',{headers:{
      Origin:'https://attacker.example',...auth
    }});
    assert.equal(r.status,403);
    await request('/auth/logout',{method:'POST',headers:auth});
    r=await request('/api/sourcing/cj/status',{headers:auth});
    assert.equal(r.status,401);
  }finally{
    globalThis.fetch=originalFetch;
    await new Promise(resolve=>server.close(resolve));
  }
});
