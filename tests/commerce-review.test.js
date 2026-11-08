'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {money,reviewCommerce}=require('../src/commerce-review');
test('rejects misleading or malformed prices',()=>{
  assert.equal(money('10.00'),10);
  assert.equal(money('10,00'),null);
  assert.equal(money(''),null);
  assert.equal(money('-1'),null);
});
test('never invents supplier economics or paid orders',()=>{
  const out=reviewCommerce([{id:1,name:'X',status:'publish',price:'100.00',stock_status:'instock',total_sales:4,average_rating:'5.00',meta_data:[]}],
  [{id:22,status:'processing',total:'100.00',currency:'BRL',date_paid:null}]);
  assert.equal(out.products[0].landedCost,null);
  assert.equal(out.products[0].estimatedGrossMarginPercent,null);
  assert.equal(out.orders[0].paid,false);
  assert.equal(out.summary.paidOrdersForSupplierReview,0);
  assert.equal(out.summary.automaticSupplierPaymentsEnabled,false);
  assert.equal(out.liveCommerceAutomation,false);
  assert.equal(out.orders[0].supplierOrderPlaced,'NOT_VERIFIED');
});
test('reads explicit landed cost and safely triages paid order',()=>{
 const out=reviewCommerce([{id:3,name:'Y',status:'publish',price:'100.00',stock_status:'instock',total_sales:0,average_rating:'0',meta_data:[{key:'_droperagent_verified_landed_cost_brl',value:'65.00'},{key:'_droperagent_verified_supplier_url',value:'https://example.com'}]}],
 [{id:42,status:'processing',date_paid:'2026-11-08T00:00:00',total:'100.00',currency:'BRL'}]);
 assert.equal(out.products[0].estimatedGrossMarginPercent,35);
 assert.equal(out.orders[0].requiresSupplierReview,true);
 assert.equal(out.orders[0].supplierPayment,'NOT_VERIFIED');
});
