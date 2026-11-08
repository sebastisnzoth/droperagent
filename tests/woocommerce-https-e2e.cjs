'use strict';
const assert = require('node:assert/strict');
const { WooCommerceClient } = require('../src/woocommerce-client');

async function run() {
  const key = process.env.WOO_CI_KEY;
  const secret = process.env.WOO_CI_SECRET;
  if (!key || !secret) throw new Error('Missing ephemeral WooCommerce CI credentials');
  const wc = new WooCommerceClient({
    baseUrl: 'https://localhost:8443',
    consumerKey: key,
    consumerSecret: secret
  });
  const initial = await wc.listProducts({ status: 'draft', perPage: 100 });
  assert.ok(initial.some(p => p.name === 'CI Draft Product'), 'Original MariaDB draft not visible over authenticated HTTPS REST');
  const created = await wc.createDraft({ name: 'CI HTTPS REST Draft', regularPrice: '22.90' });
  assert.ok(Number.isSafeInteger(created.id) && created.id > 0, 'Woo REST did not return a real id');
  assert.equal(created.status, 'draft');
  const reread = await wc.getProduct(created.id);
  assert.equal(reread.name, 'CI HTTPS REST Draft');
  assert.equal(reread.status, 'draft');
  assert.equal(reread.regular_price, '22.90');
  const orders = await wc.listOrders();
  assert.ok(Array.isArray(orders), 'WooCommerce orders API did not return an array');
  console.log('PASS: WooCommerce HTTPS authenticated REST create/read/draft/orders');
  console.log('Created test-only draft product ID:', created.id);
}
run().catch(error => { console.error('WooCommerce HTTPS REST E2E failed:', error.message); process.exitCode=1; });
