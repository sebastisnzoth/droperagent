import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
process.env.NODE_ENV = 'test';
process.env.HOST = '127.0.0.1';
process.env.DROPERAGENT_DISABLE_WORKER = '1';
process.env.DROPERAGENT_ADMIN_PASSWORD = 'supplier-evidence-ci-only-password';
process.env.DROPERAGENT_API_TOKEN = '';
delete process.env.WOOCOMMERCE_URL;
delete process.env.WC_CONSUMER_KEY;
delete process.env.WC_CONSUMER_SECRET;
const { app } = require('../src/index.js');

test('supplier evidence preflight is login-protected, read-only and fail-closed', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const headers = { Origin: 'https://sebastisnzoth.github.io', 'Content-Type': 'application/json' };
  const request = (path, options = {}) => fetch(base + path, {
    ...options, headers: { ...headers, ...(options.headers || {}) }
  });
  const input = {
    storeVariants: [{ sku: 'SKU-BR-1', options: { Color: 'Black' }, currency: 'BRL', priceBRL: '100.00' }],
    supplierVariants: [{ sku: 'SKU-CN-1', options: { color: 'black' }, available: true }],
    rules: [],
    quotes: [{
      storeSku: 'SKU-BR-1', supplierSku: 'SKU-CN-1',
      destinationCountry: 'BR', currency: 'BRL',
      sourceType: 'supplier_quote', sourceReference: 'ci-fake-supplier-quote',
      checkedAt: new Date().toISOString(), mappingReviewed: true, stockReviewed: true,
      productBRL: '35.00', shippingBRL: '15.00', taxesBRL: '12.00',
      paymentFeesBRL: '5.00', advertisingBRL: '3.00',
      returnsReserveBRL: '4.00', otherFeesBRL: '1.00'
    }],
    policy: { minimumMarginPercent: '20.00' }
  };
  try {
    let response = await request('/api/automation/supplier-evidence-preflight', {
      method: 'POST', body: JSON.stringify(input)
    });
    assert.equal(response.status, 401);

    response = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ password: process.env.DROPERAGENT_ADMIN_PASSWORD })
    });
    assert.equal(response.status, 200);
    const { token } = await response.json();
    const authorized = { Authorization: 'Bearer ' + token };

    response = await request('/api/automation/supplier-evidence-preflight', {
      method: 'POST', headers: authorized, body: JSON.stringify(input)
    });
    assert.equal(response.status, 200);
    let data = await response.json();
    assert.equal(data.status, 'READY_FOR_MANUAL_REVIEW');
    assert.equal(data.results[0].estimatedProfitBRL, '25.00');
    assert.equal(data.supplierAccountVerified, false);
    assert.equal(data.purchaseAuthorized, false);
    assert.equal(data.paymentAuthorized, false);
    assert.equal(data.safeToSubmit, false);
    assert.equal(JSON.stringify(data).includes('ci-fake-supplier-quote'), false);

    input.quotes[0].shippingBRL = undefined;
    response = await request('/api/automation/supplier-evidence-preflight', {
      method: 'POST', headers: authorized, body: JSON.stringify(input)
    });
    data = await response.json();
    assert.equal(data.status, 'BLOCKED');
    assert.ok(data.results[0].reasons.includes('REQUIRED_COSTS_MISSING'));

    response = await request('/api/automation/supplier-evidence-preflight', {
      method: 'POST', headers: authorized, body: JSON.stringify({ storeVariants: [], quotes: [] })
    });
    assert.equal(response.status, 400);
    data = await response.json();
    assert.equal(data.error, 'invalid_supplier_evidence_input');

    response = await fetch(base + '/api/automation/supplier-evidence-preflight', {
      method: 'POST',
      headers: { ...headers, Origin: 'https://evil.example', ...authorized },
      body: JSON.stringify(input)
    });
    assert.equal(response.status, 403);
    await request('/auth/logout', { method: 'POST', headers: authorized });
    response = await request('/api/automation/supplier-evidence-preflight', {
      method: 'POST', headers: authorized, body: JSON.stringify(input)
    });
    assert.equal(response.status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
