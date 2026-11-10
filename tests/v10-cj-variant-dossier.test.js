'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {collectCJVariantDossier,assertInput}=require('../src/v10-cj-variant-dossier');
const input={pid:'CJ-PROD-01',vid:'CJ-VID-01',quantity:1,origin:'CN'};
function mocked(){
 const calls=[];
 const cj={
   async listVariants({pid}){calls.push('variants');return {variants:[{
     cjProductId:pid,cjVariantId:'CJ-VID-01',cjVariantSku:'CJ-TEST-A',
     optionLabel:'Black',catalogPriceUSD:'8.40'
   }]};},
   async getStock({vid}){calls.push('stock');return {cjVariantId:vid,warehouses:[{
     countryCode:'CN',cjInventory:15,factoryInventory:8
   }]};},
   async quoteBrazilFreight({vid,quantity,origin}){
     calls.push('freight');assert.equal(quantity,1);assert.equal(origin,'CN');
     return {cjVariantId:vid,destination:'BR',availableMethods:[{
       name:'CJ-BR',freightUSD:'4.20',taxesUSD:null,
       clearanceUSD:null,totalPostageUSD:'4.20',estimatedTransit:'15-30'
     }]};
   }
 };
 return {cj,calls};
}
test('builds bounded read-only dossier without treating catalog price as Brazil landed cost',async()=>{
 const {cj,calls}=mocked();
 const result=await collectCJVariantDossier(cj,input,{sleep:async()=>{}});
 assert.deepEqual(calls,['variants','stock','freight']);
 assert.equal(result.state,'CJ_DATA_COLLECTED_REVIEW_REQUIRED');
 assert.equal(result.variantMatched,true);
 assert.equal(result.catalogPriceUSD,'8.40');
 assert.equal(result.freightMethods[0].freightUSD,'4.20');
 for(const key of ['shippingToSpecificCepVerified','supplierStockCommitted','netMarginVerified',
   'readyToSell','purchaseAuthorized','supplierPaymentAuthorized','checkoutReleaseAuthorized'])
   assert.equal(result[key],false,key);
});
test('invalid product mapping stops after one call before consuming stock/freight requests',async()=>{
 const {cj,calls}=mocked();
 const r=await collectCJVariantDossier(cj,{...input,vid:'CJ-WRONG'},{sleep:async()=>{}});
 assert.deepEqual(calls,['variants']);assert.equal(r.state,'VARIANT_NOT_IN_PRODUCT');
 assert.equal(r.queriesAttempted,1);assert.equal(r.purchaseAuthorized,false);
});
test('rejects invalid or unsafe input before ANY external call',async()=>{
 const {cj,calls}=mocked();
 for(const bad of [{...input,pid:'../orders'},{...input,vid:'https://attacker'},
   {...input,quantity:10},{...input,origin:'CN/../../orders'},
   {...input,quantity:'1'},{...input,origin:'BR'}])
   await assert.rejects(collectCJVariantDossier(cj,bad),TypeError);
 assert.deepEqual(calls,[]);
 assert.throws(()=>assertInput(null),TypeError);
});
test('invalid upstream stock or freight fails instead of claiming readiness',async()=>{
 const {cj}=mocked();
 cj.getStock=async()=>({cjVariantId:'different',warehouses:[]});
 await assert.rejects(collectCJVariantDossier(cj,input,{sleep:async()=>{}}),/Invalid stock/);
 const other=mocked().cj;
 other.quoteBrazilFreight=async()=>({cjVariantId:'CJ-VID-01',destination:'US',availableMethods:[]});
 await assert.rejects(collectCJVariantDossier(other,input,{sleep:async()=>{}}),/Invalid freight/);
});
