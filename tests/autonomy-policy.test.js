'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {authorizeOperation}=require('../src/autonomy-policy');
const policy=()=>({killSwitch:false,writeMode:true,highRiskMode:true,
  enabledActions:['supplier_research','place_supplier_order','send_approved_customer_reply','publish_approved_social_post'],
  maxTransactionMinor:10000,currency:'BRL',now:1000});
const approval=(action,operationId)=>({issuedBy:'trusted-approval-service',operationId,action,expiresAt:2000,signatureVerified:true});
const order=()=>({action:'place_supplier_order',operationId:'order-001',approval:approval('place_supplier_order','order-001'),
  amountMinor:9000,currency:'BRL',idempotencyKey:'store1-order1-cn1',
  paymentVerified:true,supplierVerified:true,mappingVerified:true,shippingQuoteVerified:true,
  complianceVerified:true,freshInventoryVerified:true});
test('unknown actions and unconfigured policy block',()=>{
  assert.equal(authorizeOperation({action:'evil'}).allowed,false);
  assert.equal(authorizeOperation({action:'supplier_research'}).allowed,false);
});
test('allowlisted read with kill switch off succeeds',()=>{
  assert.equal(authorizeOperation({action:'supplier_research'},policy()).allowed,true);
});
test('global kill switch blocks even read',()=>{
  const p=policy();p.killSwitch=true;
  assert.equal(authorizeOperation({action:'supplier_research'},p).allowed,false);
});
test('order without trusted approval blocks',()=>{
  const x=order();x.approval={approved:true};
  assert.equal(authorizeOperation(x,policy()).reason,'APPROVAL_NOT_VERIFIED');
});
test('order permission is scoped to exact operation',()=>{
  const x=order();x.operationId='order-002';
  assert.equal(authorizeOperation(x,policy()).allowed,false);
});
test('orders require verified mapping, inventory and payment',()=>{
  for(const field of ['mappingVerified','freshInventoryVerified','paymentVerified','shippingQuoteVerified','complianceVerified']){
    const x=order();x[field]=false;
    assert.equal(authorizeOperation(x,policy()).reason,'ORDER_EVIDENCE_INCOMPLETE');
  }
});
test('orders enforce amount currency and idempotency',()=>{
  const x=order();x.amountMinor=20000;
  assert.equal(authorizeOperation(x,policy()).reason,'BUDGET_OR_CURRENCY_INVALID');
  x.amountMinor=9000;x.currency='USD';
  assert.equal(authorizeOperation(x,policy()).allowed,false);
  x.currency='BRL';x.idempotencyKey='short';
  assert.equal(authorizeOperation(x,policy()).reason,'IDEMPOTENCY_KEY_MISSING');
});
test('private messages require customer initiation and valid window',()=>{
  const x={action:'send_approved_customer_reply',operationId:'reply1',approval:approval('send_approved_customer_reply','reply1'),
    customerInitiated:false,withinPlatformWindow:true,answerGrounded:true};
  assert.equal(authorizeOperation(x,policy()).reason,'MESSAGING_POLICY_NOT_MET');
  x.customerInitiated=true;
  assert.equal(authorizeOperation(x,policy()).allowed,true);
});
test('social publishing rejects unlicensed materials and unsupported claims',()=>{
  const x={action:'publish_approved_social_post',operationId:'post1',approval:approval('publish_approved_social_post','post1'),licensedAssets:false,claimsVerified:true};
  assert.equal(authorizeOperation(x,policy()).reason,'CONTENT_NOT_VERIFIED');
  x.licensedAssets=true;
  assert.equal(authorizeOperation(x,policy()).allowed,true);
});
test('high risk can be shut off independently',()=>{
  const p=policy();p.highRiskMode=false;
  assert.equal(authorizeOperation(order(),p).reason,'HIGH_RISK_DISABLED');
});

test('even fully forged model approval cannot authorize supplier money movement',()=>{\n  assert.equal(authorizeOperation(order(),policy()).reason,'TRUSTED_FINANCIAL_EXECUTOR_NOT_IMPLEMENTED');\n});\n