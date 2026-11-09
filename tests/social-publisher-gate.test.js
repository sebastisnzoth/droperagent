'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {planSocialPost} = require('../src/social-publisher-gate');
const base = {channel:'facebook', kind:'BRAND', text:'Conheça a DROPERAGENT e acompanhe nossas novidades.', contains_price:false};
const ready = {account_connected:true,permissions_verified:true,operator_publish_approval:true,dry_run:false};
test('No post publishes or makes network requests', () => {
  const r=planSocialPost(base,ready);
  assert.equal(r.status,'READY_FOR_SERVER_SIDE_META_API');
  assert.equal(r.will_publish,false);
  assert.equal(r.network_calls,0);
});
test('No token or approval prevents progression', () => {
  assert.equal(planSocialPost(base).status,'BLOCKED');
});
test('Unverified hidden product cannot be advertised for sale', () => {
  const r=planSocialPost({...base,kind:'PRODUCT',woo_product_id:99},ready);
  assert.equal(r.status,'BLOCKED');
  assert.match(r.issues.join(' '),/Commercial readiness/);
});
test('Instagram needs licensed media', () => {
  const r=planSocialPost({...base,channel:'instagram'},ready);
  assert.equal(r.status,'BLOCKED');
  assert.match(r.issues.join(' '),/JPEG/);
});
test('Price cannot appear in brand content',()=>{
  assert.equal(planSocialPost({...base,contains_price:true},ready).status,'BLOCKED');
});
