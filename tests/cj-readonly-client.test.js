'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {CJReadOnlyClient}=require('../src/cj-readonly-client');
const TOKEN='ci-only-not-a-real-cj-token-123456';
const SEARCH={code:200,result:true,data:{pageNumber:1,content:[{productList:[
  {id:'ABCD-1234',nameEn:'Wireless earbuds',sku:'CJ-TEST-1',nowPrice:'9.50',
   description:'SECRET_WOO_CUSTOMER',extraKey:'private'},
  {id:'ABCD-2234',nameEn:'Hair clipper',sku:'CJ-TEST-2',nowPrice:'11.20'}
]}]}};
const VARIANTS={code:200,result:true,data:[
  {pid:'ABCD-1234',vid:'VID-0001',variantSku:'CJ-TEST-1-B',variantKey:'Black',variantSellPrice:9.50,
   extraToken:'SECRET_WOO_CUSTOMER'}
]};
const STOCK={code:200,result:true,data:[{vid:'VID-0001',countryCode:'CN',cjInventoryNum:100,factoryInventoryNum:20,account:'SECRET_WOO_CUSTOMER'}]};
const QUOTE={code:200,result:true,data:[{logisticName:'CJ-BR-test',logisticAging:'15-30',
 logisticPrice:5.42,taxesFee:1.1,clearanceOperationFee:0.20,
 trackingInfo:'SECRET_WOO_CUSTOMER'}]};
function setup(data=SEARCH,{status=200}={}) {
  const calls=[];
  const client=new CJReadOnlyClient({accessToken:TOKEN,fetchImpl:async (url,opts)=>{
    calls.push({url,method:opts.method,headers:opts.headers,body:opts.body,redirect:opts.redirect});
    return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
  }});
  return {client,calls};
}
test('CJ direct product search uses official GET, token only in header and never leaks provider blobs',async()=>{
  const {client,calls}=setup();
  const result=await client.searchProducts({keyword:'wireless earbuds',page:1,size:10});
  assert.equal(result.source,'cj_api_v2');
  assert.equal(result.purchaseAuthorized,false);
  assert.equal(result.landedCostVerified,false);
  assert.equal(result.items.length,2);
  assert.equal(result.items[0].listingPriceCurrency,'USD');
  assert.equal(result.items[0].listingPriceIsLandedCost,false);
  assert.equal(JSON.stringify(result).includes('SECRET_WOO_CUSTOMER'),false);
  assert.equal(calls[0].method,'GET');
  assert.ok(calls[0].url.startsWith('https://developers.cjdropshipping.com/api2.0/v1/product/listV2?'));
  assert.ok(calls[0].url.includes('keyWord=wireless+earbuds'));
  assert.equal(calls[0].headers['CJ-Access-Token'],TOKEN);
  assert.equal(calls[0].redirect,'error');
  assert.equal(calls[0].url.includes(TOKEN),false);
});
test('CJ catalog variants are NOT automatically WooCommerce mapped',async()=>{
  const {client,calls}=setup(VARIANTS);
  const r=await client.listVariants({pid:'ABCD-1234'});
  assert.equal(r.supplierMappingVerified,false);
  assert.equal(r.variants[0].cjVariantId,'VID-0001');
  assert.equal(r.variants[0].catalogPriceUSD,'9.5');
  assert.equal(r.purchaseAuthorized,false);
  assert.equal(JSON.stringify(r).includes('SECRET_WOO_CUSTOMER'),false);
  assert.ok(calls[0].url.includes('/product/variant/query?pid=ABCD-1234'));
});
test('CJ stock labels warehouse availability as not guaranteed by supplier',async()=>{
  const {client,calls}=setup(STOCK);
  const r=await client.getStock({vid:'VID-0001'});
  assert.equal(r.warehouseInventoryNotSupplierCommitment,true);
  assert.equal(r.warehouses[0].cjInventory,100);
  assert.equal(JSON.stringify(r).includes('SECRET_WOO_CUSTOMER'),false);
  assert.ok(calls[0].url.includes('/product/stock/queryByVid?vid=VID-0001'));
});
test('POST CJ freight is a QUOTE for BR, not an order; amounts remain in USD',async()=>{
  const {client,calls}=setup(QUOTE);
  const q=await client.quoteBrazilFreight({vid:'VID-0001',quantity:2,origin:'CN'});
  assert.equal(q.destination,'BR');
  assert.equal(q.currency,'USD');
  assert.equal(q.fxToBRLRequired,true);
  assert.equal(q.taxesAndCustomsNotVerified,true);
  assert.equal(q.availableMethods[0].freightUSD,'5.42');
  assert.equal(q.purchaseAuthorized,false);
  assert.ok(!JSON.stringify(q).includes('SECRET_WOO_CUSTOMER'));
  assert.equal(calls[0].method,'POST');
  assert.equal(new URL(calls[0].url).pathname,'/api2.0/v1/logistic/freightCalculate');
  assert.deepEqual(JSON.parse(calls[0].body),{
    startCountryCode:'CN',endCountryCode:'BR',products:[{vid:'VID-0001',quantity:2}]
  });
});
test('blocks invalid input BEFORE contacting CJ',async()=>{
  const {client,calls}=setup();
  await assert.rejects(client.searchProducts({keyword:'a'}),TypeError);
  await assert.rejects(client.searchProducts({keyword:'valid',page:0}),TypeError);
  await assert.rejects(client.searchProducts({keyword:'valid',size:101}),TypeError);
  await assert.rejects(client.quoteBrazilFreight({vid:'../order',quantity:1}),TypeError);
  await assert.rejects(client.quoteBrazilFreight({vid:'VID-0001',quantity:11}),TypeError);
  await assert.rejects(client.listVariants({pid:'https://attacker.example'}),TypeError);
  await assert.rejects(client.getStock({vid:''}),TypeError);
  assert.equal(calls.length,0);
});
test('rejects rate bursts, CJ points exhaustion and provider HTML without leaking their error bodies',async()=>{
  const {client,calls}=setup();
  await client.searchProducts({keyword:'earbuds'});
  await assert.rejects(client.searchProducts({keyword:'earbuds'}),e=>e.status===429);
  assert.equal(calls.length,1);
  const {client:quota}=setup({code:429,result:false,message:'secret upstream',pointsInfo:{remaining:0}});
  await assert.rejects(quota.searchProducts({keyword:'earbuds'}),e=>e.status===429 && !e.message.includes('secret'));
  const {client:unauthorized}=setup({error:'secret upstream'},{status:401});
  await assert.rejects(unauthorized.searchProducts({keyword:'earbuds'}),e=>e.status===401 && !e.message.includes('secret'));
  const invalid=new CJReadOnlyClient({accessToken:TOKEN,fetchImpl:async()=>new Response('PRIVATE_HTML',{status:200})});
  await assert.rejects(invalid.searchProducts({keyword:'earbuds'}),e=>e.status===502 && !e.message.includes('PRIVATE_HTML'));
});
test('rejects malformed, duplicated or foreign data; does not invent supplier eligibility',async()=>{
  const {client:malformed}=setup({code:200,result:true,data:{content:'not-an-array'}});
  await assert.rejects(malformed.searchProducts({keyword:'earbuds'}),e=>e.status===502);
  const {client:foreign}=setup({code:200,result:true,data:[{pid:'WRONG',vid:'VID-0001',variantSku:'SKU'}]});
  await assert.rejects(foreign.listVariants({pid:'ABCD-1234'}),e=>e.status===502);
  const {client:dupe}=setup({code:200,result:true,data:[VARIANTS.data[0],VARIANTS.data[0]]});
  await assert.rejects(dupe.listVariants({pid:'ABCD-1234'}),e=>e.status===502);
  assert.throws(()=>new CJReadOnlyClient({accessToken:'short'}));
});
