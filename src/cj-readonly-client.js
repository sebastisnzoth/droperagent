'use strict';
/**
 * CJdropshipping API 2.0 — explicitly read-only supplier discovery.
 * Uses ONLY documented product and freight QUOTE endpoints.
 * No order, payment, product publication, customer data or WooCommerce writes.
 * Server-side access token only. Official CJ API points/rate limits apply.
 */
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1/';
const PATHS = Object.freeze({
  search: 'product/listV2',
  variants: 'product/variant/query',
  stock: 'product/stock/queryByVid',
  freight: 'logistic/freightCalculate'
});
const upper = (value, limit=200) => typeof value === 'string' && value.length>0 &&
  value.length<=limit && /^[A-Za-z0-9_-]+$/.test(value);
const simpleMoney = value => {
  if (typeof value === 'number' && Number.isFinite(value)) value = String(value);
  if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,2})?$/.test(value)) return null;
  return value;
};
const safeString = (value, max=200) => typeof value === 'string' && value.length<=max ? value : null;
const boundedInt = (x,min,max) => Number.isInteger(x) && x>=min && x<=max;
function createUpstreamError(status=502) {
  const e=new Error('CJ provider response unavailable or invalid');
  e.status=[400,401,403,408,429].includes(status)?status:502;
  return e;
}
class CJReadOnlyClient {
  constructor({ accessToken, fetchImpl=globalThis.fetch }={}) {
    if (typeof accessToken !== 'string' || accessToken.trim().length<16 ||
        accessToken.length>1024 || /[\r\n]/.test(accessToken)) throw new Error('CJ access token not configured');
    if (typeof fetchImpl !== 'function') throw new Error('fetch unavailable');
    this.accessToken=accessToken;
    this.fetchImpl=fetchImpl;
  }
  async call(kind,{params={},json}={}) {
    const path=PATHS[kind];
    if (!path) throw new Error('CJ operation not allowlisted');
    const method=kind==='freight'?'POST':'GET';
    if ((method==='GET' && json!==undefined)||(method==='POST' && json===undefined)) throw new Error('Invalid CJ method');
    const url=new URL(CJ_BASE+path);
    for(const [key,value] of Object.entries(params)) url.searchParams.set(key,String(value));
    let res;
    try {
      res=await this.fetchImpl(url.toString(),{
        method,redirect:'error',signal:AbortSignal.timeout(10000),
        headers:{'CJ-Access-Token':this.accessToken,accept:'application/json',
          ...(method==='POST'?{'content-type':'application/json'}:{})},
        ...(method==='POST'?{body:JSON.stringify(json)}:{})
      });
    }catch(_){throw createUpstreamError(502);}
    if(!res || !res.ok) throw createUpstreamError(res?.status);
    let data;
    try{data=await res.json();}catch(_){throw createUpstreamError(502);}
    if(!data || typeof data!=='object' || Array.isArray(data) ||
       data.result!==true || data.code!==200) {
      const code=Number(data?.code);
      if(code===429||code===16900500||code===1600200)throw createUpstreamError(429);
      throw createUpstreamError(502);
    }
    return data.data;
  }
  async searchProducts({keyword,page=1,size=10}={}) {
    if(typeof keyword!=='string'||keyword.trim().length<2||keyword.length>100 ||
      !boundedInt(page,1,100)||!boundedInt(size,1,20))throw new TypeError('Invalid CJ search');
    const data=await this.call('search',{params:{keyWord:keyword.trim(),page,size}});
    if(!data||!Array.isArray(data.content)||data.content.length>size*5)throw createUpstreamError(502);
    const products=[];
    for(const group of data.content) {
      if(!group||!Array.isArray(group.productList))throw createUpstreamError(502);
      for(const p of group.productList){
        if(!p||typeof p!=='object')throw createUpstreamError(502);
        if(products.length>=size)break;
        const id=safeString(p.id), sku=safeString(p.sku,160);
        if(!id||!sku)continue;
        products.push({
          cjProductId:id,cjProductSku:sku,
          name:safeString(p.nameEn,220),
          listingPriceRaw:simpleMoney(p.nowPrice),
          listingPriceCurrency:'USD',
          listingPriceIsLandedCost:false,
          productCertificationUnverified:true
        });
      }
    }
    return {
      source:'cj_api_v2',operation:'search',readOnly:true,providerAuthorized:true,
      supplierMappingVerified:false,supplierStockVerified:false,
      brazilShippingVerified:false,landedCostVerified:false,purchaseAuthorized:false,
      page,size,items:products
    };
  }
  async listVariants({pid}={}) {
    if(!upper(pid))throw new TypeError('Invalid CJ product id');
    const data=await this.call('variants',{params:{pid}});
    if(!Array.isArray(data)||data.length>200)throw createUpstreamError(502);
    const seen=new Set();
    const variants=data.map(v=>{
      if(!v||!upper(v.vid)||!upper(v.pid)||!safeString(v.variantSku,160))throw createUpstreamError(502);
      if(v.pid!==pid || seen.has(v.vid))throw createUpstreamError(502);
      seen.add(v.vid);
      return {
        cjVariantId:v.vid,cjProductId:v.pid,cjVariantSku:v.variantSku,
        optionLabel:safeString(v.variantKey,200),
        catalogPriceUSD:simpleMoney(v.variantSellPrice),
        catalogPriceIsLandedCost:false
      };
    });
    return {source:'cj_api_v2',operation:'variants',readOnly:true,
      supplierMappingVerified:false,brazilShippingVerified:false,
      purchaseAuthorized:false,cjProductId:pid,variants};
  }
  async getStock({vid}={}) {
    if(!upper(vid))throw new TypeError('Invalid CJ variant id');
    const data=await this.call('stock',{params:{vid}});
    if(!Array.isArray(data)||data.length>100)throw createUpstreamError(502);
    return {
      source:'cj_api_v2',operation:'stock',readOnly:true,cjVariantId:vid,
      checkedAt:new Date().toISOString(),
      warehouseInventoryNotSupplierCommitment:true,purchaseAuthorized:false,
      warehouses:data.map(x=>({
        countryCode:typeof x?.countryCode==='string' && /^[A-Z]{2}$/.test(x.countryCode)?x.countryCode:null,
        cjInventory:Number.isSafeInteger(x?.cjInventoryNum)&&x.cjInventoryNum>=0?x.cjInventoryNum:null,
        factoryInventory:Number.isSafeInteger(x?.factoryInventoryNum)&&x.factoryInventoryNum>=0?x.factoryInventoryNum:null
      }))
    };
  }
  async quoteBrazilFreight({vid,quantity=1,origin='CN'}={}) {
    if(!upper(vid)||!boundedInt(quantity,1,10) ||
       typeof origin!=='string'||!/^[A-Z]{2}$/.test(origin))throw new TypeError('Invalid CJ freight request');
    const data=await this.call('freight',{json:{
      startCountryCode:origin,endCountryCode:'BR',products:[{vid,quantity}]
    }});
    if(!Array.isArray(data)||data.length>50)throw createUpstreamError(502);
    return {
      source:'cj_api_v2',operation:'freight_quote',readOnly:true,
      destination:'BR',origin,cjVariantId:vid,quantity,
      currency:'USD',taxesAndCustomsNotVerified:true,
      fxToBRLRequired:true,freightIsEstimate:true,purchaseAuthorized:false,
      availableMethods:data.map(item=>({
        name:safeString(item?.logisticName,80),
        estimatedTransit:safeString(item?.logisticAging,50),
        freightUSD:simpleMoney(item?.logisticPrice),
        taxesUSD:simpleMoney(item?.taxesFee),
        clearanceUSD:simpleMoney(item?.clearanceOperationFee),
        totalPostageUSD:simpleMoney(item?.totalPostageFee)
      }))
    };
  }
}
module.exports={CJReadOnlyClient};
