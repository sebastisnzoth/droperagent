'use strict';
/**
 * One bounded CJ variant dossier. Performs at most three read-only provider calls:
 * product/variant/query, product/stock/queryByVid, logistic/freightCalculate.
 * CJ freight is destination COUNTRY BR, not a CEP-specific landed-cost promise.
 */
const ID=/^[A-Za-z0-9_-]{2,120}$/;
const CC=/^[A-Z]{2}$/;
function assertInput(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||
    !ID.test(input.pid||'')||!ID.test(input.vid||'')||
    !Number.isSafeInteger(input.quantity)||input.quantity<1||input.quantity>3||
    !CC.test(input.origin||'')||input.origin==='BR')throw new TypeError('Invalid CJ assessment input');
}
async function collectCJVariantDossier(client,input,{sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 assertInput(input);
 if(!client||typeof client.listVariants!=='function'||
    typeof client.getStock!=='function'||typeof client.quoteBrazilFreight!=='function')
   throw new TypeError('CJ read-only client required');
 // Reject wrong product/variant mapping BEFORE spending points on stock and freight.
 const list=await client.listVariants({pid:input.pid});
 if(!Array.isArray(list?.variants)||list.variants.length>200)throw new Error('Invalid variant response');
 const variant=list.variants.find(v=>v.cjVariantId===input.vid);
 if(!variant||variant.cjProductId!==input.pid||
    typeof variant.cjVariantSku!=='string'||!variant.cjVariantSku) {
   return {state:'VARIANT_NOT_IN_PRODUCT',source:'cj_api_v2',readOnly:true,
     cjProductId:input.pid,cjVariantId:input.vid,
     queriesAttempted:1,variantMatched:false,readyToSell:false,
     purchaseAuthorized:false,checkoutReleaseAuthorized:false};
 }
 await sleep(1150);
 const stock=await client.getStock({vid:input.vid});
 if(stock?.cjVariantId!==input.vid||!Array.isArray(stock.warehouses)||stock.warehouses.length>100)
   throw new Error('Invalid stock response');
 await sleep(1150);
 const freight=await client.quoteBrazilFreight({vid:input.vid,quantity:input.quantity,origin:input.origin});
 if(freight?.cjVariantId!==input.vid||freight.destination!=='BR'||
    !Array.isArray(freight.availableMethods)||freight.availableMethods.length>50)
   throw new Error('Invalid freight response');
 const warehouses=stock.warehouses.map(w=>({
   countryCode:CC.test(w.countryCode||'')?w.countryCode:null,
   cjInventory:Number.isSafeInteger(w.cjInventory)&&w.cjInventory>=0?w.cjInventory:null,
   factoryInventory:Number.isSafeInteger(w.factoryInventory)&&w.factoryInventory>=0?w.factoryInventory:null
 }));
 const availableWarehouseUnits=warehouses.reduce((n,w)=>n+(Number.isSafeInteger(w.cjInventory)?w.cjInventory:0),0);
 const hasWarehouseStock=availableWarehouseUnits>=input.quantity;
 const hasShippingMethods=freight.availableMethods.length>0;
 const blockers=[];
 if(!hasWarehouseStock)blockers.push('cj_warehouse_inventory_unavailable_or_unverified');
 if(!hasShippingMethods)blockers.push('no_brazil_shipping_method_returned');
 // This country-level quote is not a legal tax/CEP quote and is never an approval.
 blockers.push('brazil_cep_freight_not_quoted','taxes_customs_not_verified',
   'fx_and_net_margin_not_verified','demand_not_verified');
 const methods=freight.availableMethods.map(m=>({
   name:typeof m.name==='string'?m.name.slice(0,80):null,
   estimatedTransit:typeof m.estimatedTransit==='string'?m.estimatedTransit.slice(0,50):null,
   freightUSD:typeof m.freightUSD==='string'?m.freightUSD:null,
   taxesUSD:typeof m.taxesUSD==='string'?m.taxesUSD:null,
   clearanceUSD:typeof m.clearanceUSD==='string'?m.clearanceUSD:null,
   totalPostageUSD:typeof m.totalPostageUSD==='string'?m.totalPostageUSD:null
 }));
 return {
   state:hasWarehouseStock&&hasShippingMethods?'CJ_DATA_COLLECTED_REVIEW_REQUIRED':'CJ_UNFULFILLABLE_PENDING_REVIEW',
   blockers,warehouseStockForQuantityAvailable:hasWarehouseStock,
   brazilShippingMethodsReturned:hasShippingMethods,
   source:'cj_api_v2',
   checkedAt:new Date().toISOString(),readOnly:true,queriesAttempted:3,
   cjProductId:input.pid,cjVariantId:input.vid,
   variantMatched:true,cjVariantSku:variant.cjVariantSku,
   optionLabel:variant.optionLabel||null,
   catalogPriceUSD:variant.catalogPriceUSD||null,quantity:input.quantity,
   warehouses,freightMethods:methods,currency:'USD',
   shippingDestinationCountry:'BR',shippingToSpecificCepVerified:false,
   supplierStockCommitted:false,taxesAndCustomsVerified:false,
   fxToBRLVerified:false,customerDemandVerified:false,netMarginVerified:false,
   readyToSell:false,purchaseAuthorized:false,checkoutReleaseAuthorized:false,
   supplierPaymentAuthorized:false
 };
}
module.exports={assertInput,collectCJVariantDossier};
