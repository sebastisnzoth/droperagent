import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const originalFetch=globalThis.fetch;
process.env.NODE_ENV='test';
process.env.HOST='127.0.0.1';
process.env.DROPERAGENT_DISABLE_WORKER='1';
process.env.DROPERAGENT_ADMIN_PASSWORD='v10-cj-dossier-test-password';
process.env.DROPERAGENT_API_TOKEN='';
process.env.CJ_ACCESS_TOKEN='v10-ci-non-production-token-12345678';
let outbound=[];
globalThis.fetch=async(url,opts={})=>{
 if(!String(url).startsWith('https://developers.cjdropshipping.com/api2.0/v1/'))
   return originalFetch(url,opts);
 const path=new URL(url).pathname;
 outbound.push(path);
 const result=path.endsWith('/product/variant/query')?
  [{pid:'CJ-PROD-01',vid:'CJ-VID-01',variantSku:'SKU-A',variantSellPrice:8.2,variantKey:'Black'}]:
  path.endsWith('/product/stock/queryByVid')?
   [{countryCode:'CN',cjInventoryNum:10,factoryInventoryNum:5}]:
  path.endsWith('/logistic/freightCalculate')?
   [{logisticName:'CJ BR',logisticPrice:6.2,logisticAging:'15-25',taxesFee:0}]:
   null;
 assert.ok(result!==null,'Only allowed read endpoints');
 assert.equal(opts.headers['CJ-Access-Token'],process.env.CJ_ACCESS_TOKEN);
 return new Response(JSON.stringify({result:true,code:200,data:result}),{
   status:200,headers:{'content-type':'application/json'}
 });
};
const {app}=require('../src/index.js');
test('authenticated CJ dossier performs only three provider reads and cannot release commerce',async()=>{
 const server=app.listen(0,'127.0.0.1');
 await new Promise(resolve=>server.once('listening',resolve));
 const root='http://127.0.0.1:'+server.address().port;
 const request=(path,options={})=>originalFetch(root+path,{
   ...options,headers:{Origin:'https://sebastisnzoth.github.io',...(options.headers||{})}
 });
 const endpoint='/api/sourcing/cj/v10-variant-dossier';
 const payload={pid:'CJ-PROD-01',vid:'CJ-VID-01',quantity:1,origin:'CN'};
 try{
   let r=await request(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
   assert.equal(r.status,401);assert.equal(outbound.length,0);
   r=await request('/auth/login',{method:'POST',headers:{'content-type':'application/json'},
     body:JSON.stringify({password:process.env.DROPERAGENT_ADMIN_PASSWORD})});
   assert.equal(r.status,200);const {token}=await r.json();
   const headers={Authorization:'Bearer '+token,'content-type':'application/json'};
   r=await request(endpoint,{method:'POST',headers,body:JSON.stringify({...payload,vid:'../orders'})});
   assert.equal(r.status,400);assert.equal(outbound.length,0);
   r=await request(endpoint,{method:'POST',headers,body:JSON.stringify(payload)});
   assert.equal(r.status,200);
   const body=await r.text();
   const data=JSON.parse(body);
   assert.equal(data.state,'CJ_DATA_COLLECTED_REVIEW_REQUIRED');
   assert.deepEqual(outbound.map(x=>x.split('/').slice(-2).join('/')),[
      'variant/query','stock/queryByVid','logistic/freightCalculate'
   ]);
   assert.equal(data.warehouses[0].cjInventory,10);
   assert.equal(data.freightMethods[0].freightUSD,'6.2');
   assert.equal(data.shippingToSpecificCepVerified,false);
   assert.equal(data.netMarginVerified,false);
   assert.equal(data.purchaseAuthorized,false);
   assert.equal(data.checkoutReleaseAuthorized,false);
   assert.equal(body.includes(process.env.CJ_ACCESS_TOKEN),false);
   r=await request(endpoint,{method:'POST',headers,body:JSON.stringify(payload)});
   assert.equal(r.status,429);assert.equal(outbound.length,3);
 }finally{
   globalThis.fetch=originalFetch;
   await new Promise(resolve=>server.close(resolve));
 }
});
