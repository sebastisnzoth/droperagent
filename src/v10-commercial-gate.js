'use strict';
/**
 * V10 commercial evidence gate: deterministic, no I/O, no write permissions.
 * Caller-provided proof is NOT independently verified. Can only request human review.
 */
const MONEY=/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/;
const REQUIRED=['supplier','freight','taxes','paymentFees','fxFees','returnsReserve','marketing'];
function cents(v){
 if(typeof v!=='string'||!MONEY.test(v))return null;
 const [whole,fraction='']=v.split('.');
 return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
function evidence(x,now){
 if(!x||typeof x!=='object'||typeof x.url!=='string'||
    !/^https:\/\/[a-z\d.-]+(?:\/|$)/i.test(x.url)||x.url.length>400||
    /(?:token|secret|password|api[_-]?key)=/i.test(x.url)||
    typeof x.verifiedAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x.verifiedAt))return false;
 const date=Date.parse(x.verifiedAt+'T00:00:00Z');
 return Number.isFinite(date)&&date<=now&&date>=now-14*86400000;
}
function evaluateV10CommercialGate(input,{now=Date.now()}={}){
 if(!input||typeof input!=='object'||Array.isArray(input)||
    typeof input.sku!=='string'||!/^[a-z\d_-]{2,120}$/i.test(input.sku)||
    input.country!=='BR'||input.currency!=='BRL'||!Number.isFinite(now))
   throw new TypeError('Invalid gate input');
 const blockers=[];
 for(const [label,field] of [
   ['demand','demandEvidence'],['supplier_identity','supplierEvidence'],
   ['variant_mapping','variantMappingEvidence'],['stock','stockEvidence'],
   ['freight_brazil','freightEvidence'],['taxes_brazil','taxEvidence'],
   ['returns','returnsPolicyEvidence'],['media_rights','mediaRightsEvidence'],
   ['regulatory_review','regulatoryEvidence']
 ])if(!evidence(input[field],now))blockers.push(label+'_not_verified');
 if(input.criticalRisk!==false)blockers.push('critical_risk_not_cleared');
 if(input.supplierVariantSku!==input.sku||
    typeof input.cjVariantId!=='string'||!/^[a-z\d_-]{2,120}$/i.test(input.cjVariantId))
    blockers.push('supplier_variant_not_exactly_mapped');
 if(!Number.isSafeInteger(input.stockQuantity)||input.stockQuantity<1)
   blockers.push('supplier_stock_not_available');
 if(typeof input.destinationCep!=='string'||!/^\d{8}$/.test(input.destinationCep))
   blockers.push('brazil_cep_missing');
 const price=cents(input.retailPriceBRL);
 const costs=input.costsBRL;
 const amounts=costs&&typeof costs==='object'&&!Array.isArray(costs)?
   REQUIRED.map(k=>cents(costs[k])):[];
 if(price===null||price<1||amounts.length!==REQUIRED.length||amounts.some(x=>x===null))
   blockers.push('landed_cost_incomplete');
 const total=amounts.length===REQUIRED.length&&amounts.every(x=>x!==null)?
   amounts.reduce((a,b)=>a+b,0):null;
 const margin=price!==null&&total!==null?price-total:null;
 const percent=margin!==null&&price>0?Math.round(margin*10000/price)/100:null;
 if(percent===null||percent<25)blockers.push('net_margin_below_25_percent_or_unknown');
 return {
   schemaVersion:1,sku:input.sku,
   stage:blockers.length?'EVIDENCE_INSUFFICIENT':'MANUAL_EVIDENCE_REVIEW',
   blockers,currency:'BRL',estimatedMarginBRL:margin===null?null:(margin/100).toFixed(2),
   estimatedMarginPercent:percent,provenance:'caller_supplied_unverified',
   independentVerificationPerformed:false,salesVerified:false,paymentSettled:false,
   productPublished:false,checkoutReleaseAuthorized:false,autoPurchaseAuthorized:false,
   supplierPaymentAuthorized:false,approvalRequired:true,commercialPass:false
 };
}
module.exports={evaluateV10CommercialGate};
