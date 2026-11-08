import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const originalFetch=globalThis.fetch;
const upstreamMarker='sensitive-upstream-message-should-never-appear';
process.env.HOST='127.0.0.1';
process.env.NODE_ENV='test';
process.env.DROPERAGENT_DISABLE_WORKER='1';
process.env.DROPERAGENT_API_TOKEN='';
process.env.DROPERAGENT_ADMIN_PASSWORD='test-only-strong-password-for-error-redaction';
process.env.WOOCOMMERCE_URL='https://store.example.test';
process.env.WC_CONSUMER_KEY='ck_ci_only';
process.env.WC_CONSUMER_SECRET='cs_ci_only';
// The mocked remote WooCommerce response deliberately contains sensitive details.
globalThis.fetch=async (url, options) => {
  if(String(url).startsWith('https://store.example.test/')) {
    return {
      ok:false,status:401,
      json: async()=>({message:upstreamMarker+' ck_ci_only cs_ci_only'})
    };
  }
  return originalFetch(url,options);
};
const {app}=require('../src/index.js');
test('does not leak raw upstream WooCommerce messages to authenticated dashboard',async()=>{
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  const request=(path,options={})=>originalFetch(base+path,{
    ...options,headers:{Origin:'https://sebastisnzoth.github.io',...(options.headers||{})}
  });
  try{
    const login=await request('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:process.env.DROPERAGENT_ADMIN_PASSWORD})});
    assert.equal(login.status,200);
    const {token}=await login.json();
    const response=await request('/api/woo/products',{headers:{Authorization:'Bearer '+token}});
    assert.equal(response.status,401);
    const raw=await response.text();
    assert.equal(raw.includes(upstreamMarker),false);
    assert.equal(raw.includes('ck_ci_only'),false);
    assert.equal(raw.includes('cs_ci_only'),false);
    const body=JSON.parse(raw);
    assert.equal(body.error,'woocommerce_error');
    assert.equal(typeof body.detail,'string');
  } finally {
    globalThis.fetch=originalFetch;
    await new Promise(resolve=>server.close(resolve));
  }
});
