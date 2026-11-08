'use strict';
const crypto = require('node:crypto');

const SESSION_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const hash = (value) => crypto.createHash('sha256').update(value, 'utf8').digest();
const constantEqual = (a, b) => crypto.timingSafeEqual(hash(a), hash(b));

function createAdminAuth({ password = process.env.DROPERAGENT_ADMIN_PASSWORD || '', apiToken = process.env.DROPERAGENT_API_TOKEN || '', now = Date.now } = {}) {
  const sessions = new Map();
  const attempts = new Map();
  const enabled = password.length >= 16;
  function cleanup() {
    for (const [token, session] of sessions) if (session.expires <= now()) sessions.delete(token);
    for (const [ip, entry] of attempts) if (now() - entry.since >= WINDOW_MS) attempts.delete(ip);
  }
  function login(input, ip = 'local') {
    cleanup();
    if (!enabled) return { status: 503, error: 'admin_auth_not_configured' };
    const entry = attempts.get(ip) || { since: now(), count: 0 };
    if (entry.count >= MAX_ATTEMPTS) return { status: 429, error: 'too_many_attempts' };
    if (typeof input !== 'string' || !constantEqual(input, password)) {
      entry.count++;
      attempts.set(ip, entry);
      return { status: 401, error: 'invalid_credentials' };
    }
    attempts.delete(ip);
    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(token, { expires: now() + SESSION_MS });
    return { status: 200, token, expiresIn: SESSION_MS / 1000 };
  }
  function verify(value) {
    cleanup();
    if (typeof value !== 'string' || !value.startsWith('Bearer ')) return false;
    const presented = value.slice(7);
    if (apiToken && constantEqual(presented, apiToken)) return true;
    return Boolean(sessions.get(presented));
  }
  function logout(value) {
    if (typeof value === 'string' && value.startsWith('Bearer ')) sessions.delete(value.slice(7));
  }
  return { enabled, login, verify, logout };
}
module.exports = { createAdminAuth, SESSION_MS };
