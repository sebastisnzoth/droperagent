'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditBlueprint}=require('../src/woo-blueprint-audit');
const opts=(options)=>({steps:[{step:'setSiteOptions',options}]});
test('tax calculation disabled blocks auto-import',()=>{
  const r=auditBlueprint(opts({woocommerce_calc_taxes:'no'}));
  assert.equal(r.status,'BLOCKED');
  assert.equal(r.safeToImport,false);
  assert(r.findings.some(f=>f.code==='TAX_CALCULATION_DISABLED'));
});
test('SQL always blocks without execution',()=>{
  const r=auditBlueprint({steps:[{step:'runSql',sql:{resource:'literal',contents:'DROP TABLE users'}}]});
  assert(r.findings.some(f=>f.code==='SQL_REQUIRES_MANUAL_REVIEW'));
  assert.equal(r.safeToImport,false);
});
test('coming soon and checkout rate limit surface review',()=>{
  const r=auditBlueprint(opts({woocommerce_coming_soon:'yes',woocommerce_feature_rate_limit_checkout_enabled:'no'}));
  assert.equal(r.status,'MANUAL_REVIEW_REQUIRED');
  assert(r.findings.some(f=>f.code==='CHECKOUT_RATE_LIMIT_DISABLED'));
});
test('WooCommerce MCP disabled is not mistaken for DSers',()=>{
  const r=auditBlueprint(opts({woocommerce_feature_mcp_integration_enabled:'no'}));
  assert(r.findings.some(f=>f.code==='WOO_MCP_DISABLED'));
  assert.equal(r.safeToImport,false);
});
test('conflicting settings block',()=>{
  const r=auditBlueprint({steps:[
    {step:'setSiteOptions',options:{woocommerce_calc_taxes:'yes'}},
    {step:'setSiteOptions',options:{woocommerce_calc_taxes:'no'}}
  ]});
  assert(r.findings.some(f=>f.code==='CONFLICTING_OPTION'));
});
test('unknown step blocks and malformed input fails closed',()=>{
  assert.equal(auditBlueprint({steps:[{step:'deleteAllOrders'}]}).status,'BLOCKED');
  assert.throws(()=>auditBlueprint(null),TypeError);
});
test('extension install is reviewed not silently allowed',()=>{
  const r=auditBlueprint({steps:[{step:'installPlugin',pluginData:{slug:'woocommerce'}}]});
  assert.equal(r.status,'MANUAL_REVIEW_REQUIRED');
  assert.equal(r.safeToImport,false);
});
test('does not disclose values of options or SQL in results',()=>{
  const secret='SENSITIVE_VALUE_NEVER_LOGGED';
  const r=auditBlueprint({steps:[
    {step:'runSql',sql:{contents:secret}},
    {step:'setSiteOptions',options:{woocommerce_store_address:secret}}
  ]});
  assert.equal(JSON.stringify(r).includes(secret),false);
});
test('empty blueprint not approved',()=>{
  const r=auditBlueprint({steps:[]});
  assert.equal(r.safeToImport,false);
  assert.equal(r.status,'NO_FINDINGS_NOT_APPROVED');
});
