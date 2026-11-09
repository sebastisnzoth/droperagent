#!/usr/bin/env node
'use strict';
// Read-only external smoke check. No secrets, customer records, login attempts, or store writes.
// Usage: node scripts/live-public-smoke.mjs
const API = 'https://droperagent-api.onrender.com';
const SITE = 'https://sebastisnzoth.github.io/droperagent/';
const ORIGIN = 'https://sebastisnzoth.github.io';
const checks = [];
async function request(url, options = {}) {
  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(18000), ...options });
    } catch (e) {
      last = e;
      if (attempt < 3) await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
    }
  }
  throw new Error('Network unavailable: ' + (last?.name || 'unknown'));
}
async function check(name, fn) {
  try { const result = await fn(); checks.push({ name, status: 'PASS', ...result }); }
  catch (e) { checks.push({ name, status: 'FAIL', reason: String(e?.message || e).slice(0,180) }); }
}
function requireStatus(response, expected) {
  if (response.status !== expected) throw new Error('HTTP ' + response.status + ' expected ' + expected);
}
await check('API HTTPS identity', async () => {
  const r = await request(API + '/health', { headers: { Origin: ORIGIN } });
  requireStatus(r,200);
  const body = await r.json();
  if (body.status !== 'healthy' || body.service !== 'droperagent-api')
    throw new Error('Unexpected health identity');
  if (!Number.isFinite(body.serverTimeMs)) throw new Error('Server timestamp absent');
  if (r.headers.get('access-control-allow-origin') !== ORIGIN) throw new Error('CORS origin missing');
  return { identity: body.service };
});
await check('Authenticated WooCommerce bridge', async () => {
  const r = await request(API + '/health/woocommerce', { headers: { Origin: ORIGIN } });
  requireStatus(r,200);
  const body = await r.json();
  if (body.configured !== true || body.connected !== true) throw new Error('WooCommerce authenticated read probe failed');
  if (!body.checkedAt || !Number.isFinite(Date.parse(body.checkedAt))) throw new Error('Probe timestamp missing');
  return { connected: true, checkedAt: body.checkedAt };
});
await check('Denied disallowed browser origin', async () => {
  const r = await request(API + '/health', { headers: { Origin: 'https://untrusted.example' } });
  requireStatus(r,403);
});
await check('Valid CORS preflight without credentials', async () => {
  const r = await request(API + '/auth/me', {
    method: 'OPTIONS', headers: { Origin: ORIGIN, 'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization' }
  });
  requireStatus(r,204);
  if (r.headers.get('access-control-allow-origin') !== ORIGIN) throw new Error('CORS preflight origin missing');
});
for (const path of ['/auth/me','/api/woo/products','/api/woo/orders','/api/automation/review']) {
  await check('Requires login: ' + path, async () => {
    const r = await request(API + path, { headers: { Origin: ORIGIN } });
    requireStatus(r,401);
    if (r.headers.get('cache-control') !== 'no-store') throw new Error('Missing no-store');
  });
}
// Newly deployed V4 evidence preflight must be protected even when the caller supplies no data.
// Intentionally unauthenticated: never pass tokens, supplier records or real transactions to CI.
await check('Requires login: supplier evidence preflight POST', async () => {
  const r = await request(API + '/api/automation/supplier-evidence-preflight', {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
    body: '{}'
  });
  requireStatus(r,401);
  if (r.headers.get('cache-control') !== 'no-store') throw new Error('Missing no-store');
});
// Verify the new read-only variant listing never exposes SKU/prices anonymously.
// No auth token, no product payload and no WooCommerce modifications.
await check('Requires login: live Woo variant listing', async () => {
  const r = await request(API + '/api/woo/products/46/variations', {
    headers: { Origin: ORIGIN }
  });
  requireStatus(r,401);
  if (r.headers.get('cache-control') !== 'no-store') throw new Error('Missing no-store');
});
await check('Public Pages and JS bundle', async () => {
  const r = await request(SITE);
  requireStatus(r,200);
  const html = await r.text();
  if (!html.includes('DroperAgent')) throw new Error('Unexpected Pages HTML');
  const urls = [...html.matchAll(/(?:src|href)="(\/droperagent\/assets\/[^"]+\.(?:js|css))"/g)].map(m=>m[1]);
  if (!urls.length) throw new Error('No compiled assets found');
  for (const asset of urls) {
    const ar = await request('https://sebastisnzoth.github.io' + asset);
    requireStatus(ar,200);
  }
  return { assetsVerified: urls.length };
});
for (const c of checks) console.log(c.status + ' ' + c.name + (c.status === 'FAIL' ? ': ' + c.reason : ''));
console.log(JSON.stringify({ checkedAt:new Date().toISOString(), total:checks.length, pass:checks.filter(x=>x.status==='PASS').length, fail:checks.filter(x=>x.status==='FAIL').length, checks }));
if (checks.some(x => x.status === 'FAIL')) process.exitCode = 1;
