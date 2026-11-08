'use strict';
// Read-only WooCommerce product snapshots pushed outbound from the WordPress plugin.
// Render Free storage is ephemeral: deliberately keep only a 15-minute memory cache.
const crypto = require('node:crypto');
const MAX_SKEW_MS = 5 * 60 * 1000;
const TTL_MS = 15 * 60 * 1000;
const MAX_ITEMS = 50;
function validProduct(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
  if (!Number.isSafeInteger(p.id) || p.id < 1) return false;
  if (typeof p.name !== 'string' || p.name.length > 180) return false;
  if (!['publish', 'draft', 'pending', 'private'].includes(p.status)) return false;
  if (typeof p.price !== 'string' || p.price.length > 32 || !/^[0-9.]*(?:[0-9])?$/.test(p.price)) return false;
  if (p.stock_quantity !== null && (!Number.isSafeInteger(p.stock_quantity) || p.stock_quantity < 0)) return false;
  return true;
}
function verifySignature({ secret, timestamp, nonce, signature, body, now = Date.now(), seen }) {
  if (!secret || secret.length < 32) return 'bridge_not_configured';
  if (!/^\\d{13}$/.test(String(timestamp || '')) || Math.abs(now - Number(timestamp)) > MAX_SKEW_MS) return 'invalid_timestamp';
  if (!/^[a-f0-9]{32}$/.test(nonce || '')) return 'invalid_nonce';
  if (!/^sha256=[a-f0-9]{64}$/.test(signature || '')) return 'invalid_signature';
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(timestamp + '.' + nonce + '.' + body).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return 'invalid_signature';
  for (const [key, at] of seen) if (now - at > MAX_SKEW_MS) seen.delete(key);
  if (seen.has(nonce)) return 'replayed_request';
  seen.set(nonce, now);
  return null;
}
function attachBridge(app, authorize) {
  const seen = new Map();
  let snapshot = null;
  const secret = process.env.DROPERAGENT_BRIDGE_SECRET || '';
  app.post('/api/bridge/products', (req, res) => {
    if (!secret || secret.length < 32) return res.status(503).json({ error: 'bridge_not_configured' });
    const failure = verifySignature({
      secret,
      timestamp: req.get('x-dgb-timestamp'),
      nonce: req.get('x-dgb-nonce'),
      signature: req.get('x-dgb-signature'),
      body: req.rawBody || '',
      seen
    });
    if (failure) return res.status(401).json({ error: failure });
    const data = req.body;
    if (!data || !Array.isArray(data.products) || data.products.length > MAX_ITEMS ||
        !data.products.every(validProduct) ||
        typeof data.store !== 'string' || data.store.length > 200 || !/^https:\/\//.test(data.store)) {
      return res.status(400).json({ error: 'invalid_products_payload' });
    }
    const ids = new Set(data.products.map(p => p.id));
    if (ids.size !== data.products.length) return res.status(400).json({ error: 'duplicate_product_ids' });
    snapshot = {
      products: data.products.map(p => ({ id: p.id, name: p.name, status: p.status, price: p.price, stock_quantity: p.stock_quantity })),
      store: data.store,
      receivedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + TTL_MS).toISOString()
    };
    return res.status(202).json({ accepted: true, count: snapshot.products.length, expiresAt: snapshot.expiresAt, persistence: 'memory_only' });
  });
  app.get('/api/bridge/products', authorize, (_req, res) => {
    if (!snapshot || Date.parse(snapshot.expiresAt) <= Date.now()) {
      snapshot = null;
      return res.status(404).json({ error: 'no_current_snapshot', configured: secret.length >= 32 });
    }
    return res.json({ ...snapshot, source: 'wordpress_outbound', persistence: 'memory_only' });
  });
  app.get('/api/bridge/status', authorize, (_req, res) => res.json({
    configured: secret.length >= 32, snapshotAvailable: Boolean(snapshot && Date.parse(snapshot.expiresAt) > Date.now()),
    productCount: snapshot && Date.parse(snapshot.expiresAt) > Date.now() ? snapshot.products.length : 0,
    expiresAt: snapshot?.expiresAt || null, persistence: 'memory_only', scope: 'products_readonly', ordersEnabled: false
  }));
}
module.exports = { attachBridge, verifySignature, validProduct };
