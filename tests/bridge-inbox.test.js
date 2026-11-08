'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { verifySignature, validProduct, attachBridge } = require('../src/bridge-inbox');
const secret='bridge-test-secret-012345678901234567890';
function sign({ timestamp, nonce, body }) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(timestamp + '.' + nonce + '.' + body).digest('hex');
}
test('HMAC accepts valid signature once and rejects replay', () => {
  const now=Date.now(),timestamp=String(now),nonce=crypto.randomBytes(16).toString('hex'),body='{"products":[]}';
  const seen=new Map(), signature=sign({timestamp,nonce,body});
  assert.equal(verifySignature({secret,timestamp,nonce,body,signature,seen,now}),null);
  assert.equal(verifySignature({secret,timestamp,nonce,body,signature,seen,now}),'replayed_request');
});
test('HMAC rejects tampering and stale timestamps', () => {
  const now=Date.now(),timestamp=String(now),nonce=crypto.randomBytes(16).toString('hex'),body='{"products":[]}';
  const signature=sign({timestamp,nonce,body});
  assert.equal(verifySignature({secret,timestamp,nonce,body:'{"products":[1]}',signature,seen:new Map(),now}),'invalid_signature');
  assert.equal(verifySignature({secret,timestamp,nonce,body,signature,seen:new Map(),now:now+6*60000}),'invalid_timestamp');
});
test('HMAC requires configured strong secret', () => {
  assert.equal(verifySignature({secret:'',timestamp:'',nonce:'',signature:'',body:'',seen:new Map()}),'bridge_not_configured');
});
test('product validator rejects client data, HTML descriptions and malformed quantities',()=>{
  assert.equal(validProduct({id:1,name:'Demo',status:'publish',price:'19.90',stock_quantity:0}),true);
  assert.equal(validProduct({id:1,name:'Demo',status:'publish',price:'19.90',stock_quantity:-2}),false);
  assert.equal(validProduct({id:1,name:'Demo',status:'publish',price:'19.90',stock_quantity:null,customer_email:'x@example.com'}),true);
});
test('inbox rejects unauthenticated POST; never exposes product snapshot publicly',async()=>{
  const app={};let routes={};
  app.post=(route,handler)=>{routes['POST '+route]=handler;};
  app.get=(route,...handlers)=>{routes['GET '+route]=handlers;};
  const old=process.env.DROPERAGENT_BRIDGE_SECRET; process.env.DROPERAGENT_BRIDGE_SECRET=secret;
  try {
    attachBridge(app,()=>{});
    let status=0,payload=null;
    const res={status(n){status=n;return this;},json(x){payload=x;return this;}};
    routes['POST /api/bridge/products']({get:()=>'',rawBody:'',body:{}},res);
    assert.equal(status,401);
    assert.equal(payload.error,'invalid_timestamp');
    assert.equal(routes['GET /api/bridge/products'].length,2);
  }finally{if(old===undefined)delete process.env.DROPERAGENT_BRIDGE_SECRET;else process.env.DROPERAGENT_BRIDGE_SECRET=old;}
});
