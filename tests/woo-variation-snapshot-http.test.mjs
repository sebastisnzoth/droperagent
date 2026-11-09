import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const originalFetch = globalThis.fetch;
process.env.NODE_ENV = 'test';
process.env.HOST = '127.0.0.1';
process.env.DROPERAGENT_DISABLE_WORKER = '1';
process.env.DROPERAGENT_ADMIN_PASSWORD = 'woo-variation-ci-only-password';
process.env.DROPERAGENT_API_TOKEN = '';
process.env.WOOCOMMERCE_URL = 'https://woo-ci.example.test';
process.env.WC_CONSUMER_KEY = 'ck_fake_ci';
process.env.WC_CONSUMER_SECRET = 'cs_fake_ci';
let upstreamCount = 0;
let invalidPayload = false;
const fakeVariation = {
  id: 62, parent_id: 46, sku: '14:350852#OnlyAccess_20273939',
  price: '6.44', stock_quantity: 234, stock_status: 'instock',
  status: 'publish', purchasable: true,
  attributes: [{name:'Color',option:'OnlyAccess'}],
  meta_data: [{key:'private_supplier',value:'secret-supplier-DONT-LEAK'}],
  description: 'secret-description-DONT-LEAK'
};
globalThis.fetch = async (url,options={}) => {
  if (!String(url).startsWith('https://woo-ci.example.test/')) {
    return originalFetch(url,options);
  }
  upstreamCount++;
  assert.equal(options.method, 'GET', 'upstream must be read-only');
  assert.ok(options.headers.authorization.startsWith('Basic '));
  if (String(url).includes('/products/46/variations')) {
    assert.ok(String(url).includes('per_page=30'));
    return new Response(JSON.stringify(invalidPayload ? {error:'upstream secret'} : [fakeVariation]),
      {status:200,headers:{'content-type':'application/json'}});
  }
  if (String(url).includes('/products/46')) {
    return new Response(JSON.stringify({id:46,type:'variable',status:'publish'}),
      {status:200,headers:{'content-type':'application/json'}});
  }
  if (String(url).includes('/products/85')) {
    return new Response(JSON.stringify({id:85,type:'simple',status:'publish'}),
      {status:200,headers:{'content-type':'application/json'}});
  }
  throw new Error('Unexpected upstream request');
};
const { app } = require('../src/index.js');

test('live variant endpoint is authenticated, bounded, GET-only and redacted', async () => {
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const base = 'http://127.0.0.1:'+server.address().port;
  const request = (path,opts={}) => originalFetch(base+path,{
    ...opts,headers:{Origin:'https://sebastisnzoth.github.io',...(opts.headers||{})}
  });
  try {
    let response = await request('/api/woo/products/46/variations');
    assert.equal(response.status,401);
    assert.equal(upstreamCount,0);

    response = await request('/auth/login', {method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:process.env.DROPERAGENT_ADMIN_PASSWORD})});
    assert.equal(response.status,200);
    const token = (await response.json()).token;
    const auth = {Authorization:'Bearer '+token};

    response = await request('/api/woo/products/46/variations',{headers:auth});
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
    const text = await response.text();
    const data = JSON.parse(text);
    assert.equal(data.count,1);
    assert.equal(data.readOnly,true);
    assert.equal(data.currencyVerified,false);
    assert.equal(data.supplierMappingVerified,false);
    assert.equal(data.supplierCostsVerified,false);
    assert.equal(data.supplierStockVerified,false);
    assert.equal(data.purchaseAuthorized,false);
    assert.equal(data.variants[0].stockQuantity,234);
    assert.equal(data.variants[0].sku,fakeVariation.sku);
    assert.equal(text.includes('DONT-LEAK'),false);
    assert.equal(text.includes('ck_fake_ci'),false);

    const count = upstreamCount;
    response = await request('/api/woo/products/46/variations?page=101',{headers:auth});
    assert.equal(response.status,400);
    assert.equal(upstreamCount,count);
    response = await request('/api/woo/products/46/variations?per_page=1000',{headers:auth});
    assert.equal(response.status,400);
    assert.equal(upstreamCount,count);

    response = await request('/api/woo/products/85/variations',{headers:auth});
    assert.equal(response.status,409);
    assert.equal((await response.json()).error,'not_variable_product');

    invalidPayload = true;
    response = await request('/api/woo/products/46/variations',{headers:auth});
    assert.equal(response.status,502);
    assert.equal((await response.text()).includes('upstream secret'),false);

    response = await request('/auth/logout',{method:'POST',headers:auth});
    assert.equal(response.status,200);
    response = await request('/api/woo/products/46/variations',{headers:auth});
    assert.equal(response.status,401);
  } finally {
    globalThis.fetch=originalFetch;
    await new Promise(resolve=>server.close(resolve));
  }
});
