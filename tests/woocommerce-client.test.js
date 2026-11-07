'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { WooCommerceClient } = require('../src/woocommerce-client');

function fakeFetch(expectedMethod, expectedPath, body) {
  return async (url, options) => {
    assert.equal(options.method, expectedMethod);
    assert.ok(url.includes(expectedPath), url);
    assert.ok(options.headers.authorization.startsWith('Basic '));
    assert.equal(options.redirect, 'error');
    if (body) assert.deepEqual(JSON.parse(options.body), body);
    return { ok: true, status: 200, json: async () => [{ id: 42, name: 'CI draft' }] };
  };
}

test('rejects remote HTTP credentials and missing config', () => {
  assert.throws(() => new WooCommerceClient({ baseUrl: 'http://example.com', consumerKey: 'a', consumerSecret: 'b' }), /HTTPS required/);
  assert.throws(() => new WooCommerceClient({ baseUrl: 'https://example.com', consumerKey: '', consumerSecret: 'b' }), /not configured/);
  assert.throws(() => new WooCommerceClient({ baseUrl: 'https://user:pass@example.com', consumerKey: 'a', consumerSecret: 'b' }), /Invalid WooCommerce URL/);
});

test('reads real WooCommerce endpoint through injectable network transport', async () => {
  const client = new WooCommerceClient({
    baseUrl: 'https://store.example.test',
    consumerKey: 'ck_example',
    consumerSecret: 'cs_example',
    fetchImpl: fakeFetch('GET', '/wp-json/wc/v3/products?page=1&per_page=10', null)
  });
  const products = await client.listProducts();
  assert.equal(products[0].id, 42);
  assert.throws(() => client.listProducts({ perPage: 200 }), /Invalid perPage/);
});

test('creates draft only and never publishes directly', async () => {
  const body = { name: 'Test product', type: 'simple', status: 'draft', regular_price: '19.90', description: '' };
  const client = new WooCommerceClient({
    baseUrl: 'http://127.0.0.1:8080',
    consumerKey: 'ck_test',
    consumerSecret: 'cs_test',
    fetchImpl: fakeFetch('POST', '/wp-json/wc/v3/products', body)
  });
  const result = await client.createDraft({ name: 'Test product', regularPrice: '19.90' });
  assert.equal(result[0].name, 'CI draft');
  await assert.rejects(() => client.createDraft({ name: '', regularPrice: '19.90' }), /Invalid product name/);
});

test('propagates WooCommerce errors without declaring success', async () => {
  const client = new WooCommerceClient({
    baseUrl: 'https://store.example.test',
    consumerKey: 'ck_test',
    consumerSecret: 'cs_test',
    fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ message: 'Invalid consumer key' }) })
  });
  await assert.rejects(() => client.getProduct(5), error => error.status === 401 && /Invalid consumer key/.test(error.message));
});
