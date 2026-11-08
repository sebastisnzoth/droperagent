import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
process.env.DROPERAGENT_ADMIN_PASSWORD = 'strong-ci-only-admin-password';
process.env.DROPERAGENT_API_TOKEN = '';
process.env.NODE_ENV = 'test';
process.env.HOST = '127.0.0.1';
const { app } = require('../src/index.js');

test('admin session, protected data, logout, and CORS actually work over HTTP', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const origin = 'https://sebastisnzoth.github.io';
  const request = (path, options = {}) => fetch(base + path, {
    ...options,
    headers: { origin, ...(options.headers || {}) }
  });
  try {
    let response = await request('/tasks');
    assert.equal(response.status, 401);
    response = await request('/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({password:'incorrect'})
    });
    assert.equal(response.status, 401);
    response = await request('/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({password:'strong-ci-only-admin-password'})
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    const {token} = await response.json();
    assert.ok(token.length >= 40);
    const auth = { Authorization: 'Bearer ' + token };
    response = await request('/tasks', {headers:auth});
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.ok(Array.isArray(data.tasks));
    response = await request('/api/woo/products', {headers:auth});
    assert.equal(response.status, 503); // no real Woo credentials; never return demo data
    response = await fetch(base + '/tasks', {headers:{...auth,origin:'https://hostile.example'}});
    assert.equal(response.status, 403);
    response = await request('/auth/logout', {method:'POST',headers:auth});
    assert.equal(response.status, 200);
    response = await request('/tasks', {headers:auth});
    assert.equal(response.status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
