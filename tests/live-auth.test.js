'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createAdminAuth } = require('../src/live-auth');

test('no admin password means login disabled', () => {
  const auth = createAdminAuth({ password: '' });
  assert.equal(auth.login('any').status, 503);
  assert.equal(auth.verify('Bearer fake'), false);
});
test('authentication rejects invalid passwords, then accepts a valid one', () => {
  const auth = createAdminAuth({ password: 'long-test-only-password-123' });
  assert.equal(auth.login('wrong', 'client').status, 401);
  const result = auth.login('long-test-only-password-123', 'client');
  assert.equal(result.status, 200);
  assert.equal(auth.verify('Bearer ' + result.token), true);
  auth.logout('Bearer ' + result.token);
  assert.equal(auth.verify('Bearer ' + result.token), false);
});
test('session expiry and rate limit work', () => {
  let time = 1000;
  const auth = createAdminAuth({ password: 'another-test-only-password', now: () => time });
  for (let i = 0; i < 5; i++) assert.equal(auth.login('bad', 'attacker').status, 401);
  assert.equal(auth.login('another-test-only-password', 'attacker').status, 429);
  const session = auth.login('another-test-only-password', 'trusted');
  assert.equal(auth.verify('Bearer ' + session.token), true);
  time += 15 * 60 * 1000 + 1;
  assert.equal(auth.verify('Bearer ' + session.token), false);
  assert.equal(auth.login('another-test-only-password', 'attacker').status, 200);
});
test('a configured local CLI bearer token remains compatible', () => {
  const auth = createAdminAuth({ password: '', apiToken: 'cli-token-for-test' });
  assert.equal(auth.verify('Bearer cli-token-for-test'), true);
  assert.equal(auth.verify('Bearer cli-token-for-tesx'), false);
});
