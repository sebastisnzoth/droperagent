'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluateV10CommercialGate}=require('../src/v10-commercial-gate');
const now=Date.parse('2026-11-09T12:00:00Z');
const evidence=()=>({url:'https://supplier.example/document',verifiedAt:'2026-11-08'});
function fixture(){
 return {
   sku:'SKU_TEST_1',supplierVariantSku:'SKU_TEST_1',cjVariantId:'VID_123',
   country:'BR',currency:'BRL',destinationCep:'88000000',stockQuantity:3,criticalRisk:false,
   retailPriceBRL:'100.00',
   costsBRL:{supplier:'30.00',freight:'15.00',taxes:'10.00',paymentFees:'3.00',fxFees:'2.00',returnsReserve:'5.00',marketing:'5.00'},
   demandEvidence:evidence(),supplierEvidence:evidence(),variantMappingEvidence:evidence(),
   stockEvidence:evidence(),freightEvidence:evidence(),taxEvidence:evidence(),
   returnsPolicyEvidence:evidence(),mediaRightsEvidence:evidence(),regulatoryEvidence:evidence()
 };
}
test('complete supplied evidence only reaches manual review; money and checkout remain blocked',()=>{
 const r=evaluateV10CommercialGate(fixture(),{now});
 assert.equal(r.stage,'MANUAL_EVIDENCE_REVIEW');
 assert.equal(r.estimatedMarginBRL,'30.00');
 assert.equal(r.estimatedMarginPercent,30);
 for(const key of ['commercialPass','autoPurchaseAuthorized','checkoutReleaseAuthorized','supplierPaymentAuthorized','independentVerificationPerformed'])
   assert.equal(r[key],false,key);
});
test('missing freight or taxes and mismatched variants fail closed',()=>{
 const p=fixture();delete p.costsBRL.taxes;p.supplierVariantSku='OTHER';p.freightEvidence=null;
 const r=evaluateV10CommercialGate(p,{now});
 assert.equal(r.stage,'EVIDENCE_INSUFFICIENT');
 assert.ok(r.blockers.includes('freight_brazil_not_verified'));
 assert.ok(r.blockers.includes('supplier_variant_not_exactly_mapped'));
 assert.ok(r.blockers.includes('landed_cost_incomplete'));
 assert.equal(r.estimatedMarginBRL,null);
});
test('expired evidence, low margin, stock depletion and risk are rejected',()=>{
 const p=fixture();p.stockQuantity=0;p.freightEvidence.verifiedAt='2026-10-01';
 p.costsBRL.freight='41.00';p.criticalRisk=true;
 const r=evaluateV10CommercialGate(p,{now});
 assert.ok(r.blockers.includes('freight_brazil_not_verified'));
 assert.ok(r.blockers.includes('supplier_stock_not_available'));
 assert.ok(r.blockers.includes('net_margin_below_25_percent_or_unknown'));
 assert.ok(r.blockers.includes('critical_risk_not_cleared'));
});
test('invalid input and insecure proof URL cannot approve anything',()=>{
 const p=fixture();p.demandEvidence.url='http://unsafe.example';const r=evaluateV10CommercialGate(p,{now});
 assert.ok(r.blockers.includes('demand_not_verified'));
 assert.throws(()=>evaluateV10CommercialGate({...p,country:'CN'},{now}),TypeError);
});
