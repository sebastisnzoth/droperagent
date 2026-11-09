'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data/sourcing/cj-brazil-rfqs-2026-11-09.json');
const {validateCjRfqs}=require('../src/cj-rfq-queue');
test('five CJ sourcing RFQs are private, unsubmitted, and do not authorize purchases',()=>{
 assert.deepEqual(validateCjRfqs(data),[]);
 assert.equal(data.requests.length,5);
 assert.deepEqual(data.requests.map(x=>x.woo_draft_id),[99,100,101,102,103]);
 assert.deepEqual(data.quote_context.test_postal_codes.map(x=>x.cep),['88010-000','01001-000']);
});
test('reject invented CJ product ID, cost or quote and implied supplier consent',()=>{
 const x=structuredClone(data);
 x.requests[0].cj_product_id='fictional';
 x.requests[0].product_cost='5.00';
 x.requests[0].account_owner_approval_to_submit=true;
 assert.ok(validateCjRfqs(x).some(v=>v.includes('Unsupported')));
});
test('reject remote submission or auto-purchase without authorization',()=>{
 const x=structuredClone(data);
 x.safety_policy.auto_purchase_enabled=true;
 x.safety_policy.submitted=true;
 assert.ok(validateCjRfqs(x).some(v=>v.includes('fail-closed')));
});
test('reject duplicate RFQs and invalid Brazilian CEP',()=>{
 const x=structuredClone(data);
 x.requests[1].request_id=x.requests[0].request_id;
 x.quote_context.test_postal_codes[0].cep='123';
 const issues=validateCjRfqs(x);
 assert.ok(issues.some(v=>v.includes('duplicate request')));
 assert.ok(issues.some(v=>v.includes('quote context')));
});
