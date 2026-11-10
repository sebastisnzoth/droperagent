#!/usr/bin/env node
'use strict';
/**
 * DroperAgent local supervisor API.
 * This is NOT an MCP protocol server or a WooCommerce integration yet.
 */
require('dotenv').config();
const express = require('express');
const crypto = require('node:crypto');
const { TaskEngine } = require('./task-engine');
const { WooCommerceClient } = require('./woocommerce-client');
const { createAdminAuth } = require('./live-auth');
const { attachBridge } = require('./bridge-inbox');
const { reviewCommerce } = require('./commerce-review');
const { evaluateMapping } = require('./supplier-mapping-guard');
const { evaluateSupplierEvidence } = require('./supplier-evidence-audit');
const { makeWooVariantSnapshot } = require('./woo-variation-snapshot');
const { CJReadOnlyClient } = require('./cj-readonly-client');
const { evaluateV10CommercialGate } = require('./v10-commercial-gate');
const { collectCJVariantDossier } = require('./v10-cj-variant-dossier');

const app = express();
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb', verify: (req, _res, buf) => { if (req.path === '/api/bridge/products') req.rawBody = buf.toString('utf8'); } }));
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
const apiToken = process.env.DROPERAGENT_API_TOKEN || '';
const admin = createAdminAuth({ apiToken });
const workerEnabled = process.env.DROPERAGENT_DISABLE_WORKER !== '1';
const allowedOrigin = process.env.DROPERAGENT_WEB_ORIGIN || 'https://sebastisnzoth.github.io';

if (!apiToken && !admin.enabled && host !== '127.0.0.1' && host !== '::1') {
  throw new Error('Admin authentication required for public API');
}
if (process.env.NODE_ENV === 'production' && host !== '127.0.0.1' && host !== '::1' && !admin.enabled) {
  throw new Error('DROPERAGENT_ADMIN_PASSWORD must be set for public deployment');
}
app.disable('etag');
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
  const origin = req.get('origin');
  if (origin && origin !== allowedOrigin) return res.status(403).json({ error: 'origin_not_allowed' });
  if (origin === allowedOrigin) {
    res.set('Access-Control-Allow-Origin', allowedOrigin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
function authorize(req, res, next) {
  if (!admin.verify(req.get('authorization') || '')) return res.status(401).json({ error: 'unauthorized' });
  next();
}
app.post('/auth/login', (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.status(403).json({ error: 'https_required' });
  }
  const outcome = admin.login(req.body?.password, req.ip);
  res.status(outcome.status).json(outcome.status === 200 ? { token: outcome.token, expiresIn: outcome.expiresIn } : { error: outcome.error });
});
app.get('/auth/me', authorize, (_req, res) => res.json({ authenticated: true, role: 'admin' }));
app.post('/auth/logout', authorize, (req, res) => { admin.logout(req.get('authorization')); res.json({ success: true }); });

const handlers = {
  ping: async () => ({ pong: true, time: new Date().toISOString() }),
  'health-check': async () => {
    const url = 'http://' + (host === '::1' ? '[::1]' : host) + ':' + port + '/health';
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Health HTTP ' + response.status);
    const body = await response.json();
    if (body.status !== 'healthy') throw new Error('Health returned unhealthy status');
    return { status: body.status, checkedAt: new Date().toISOString() };
  }
};
// CJ API uses a backend-only access token, never a browser VITE_* variable.
const cj = process.env.CJ_ACCESS_TOKEN
  ? new CJReadOnlyClient({ accessToken: process.env.CJ_ACCESS_TOKEN }) : null;
function requireCJ(_req,res,next) {
  if (!cj) return res.status(503).json({ error:'cj_not_configured' });
  next();
}
function safeCJError(error,res) {
  if (error instanceof TypeError) return res.status(400).json({ error:'invalid_cj_query' });
  const code=Number.isInteger(error?.status) && [400,401,403,408,429].includes(error.status)
    ? error.status : 502;
  return res.status(code).json({error: code===429?'cj_rate_limited':'cj_provider_unavailable'});
}
const wcConfigured = Boolean(process.env.WOOCOMMERCE_URL && process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET);
const wc = wcConfigured ? new WooCommerceClient({
  baseUrl: process.env.WOOCOMMERCE_URL,
  consumerKey: process.env.WC_CONSUMER_KEY,
  consumerSecret: process.env.WC_CONSUMER_SECRET
}) : null;
if (wc) {
  handlers['woo-create-draft'] = data => wc.createDraft(data);
}
// Safe, read-only connectivity check. Never returns keys, product data or provider errors.
// Cache in-flight probes to avoid public polling hammering the WooCommerce host.
let wooProbe = { checkedAt: 0, connected: false };
let wooProbePending = null;
app.get('/health/woocommerce', async (_req, res) => {
  if (!wc) return res.json({ configured: false, connected: false, checkedAt: null });
  const now = Date.now();
  if (now - wooProbe.checkedAt < 300000) {
    return res.json({ configured: true, connected: wooProbe.connected, checkedAt: new Date(wooProbe.checkedAt).toISOString() });
  }
  if (!wooProbePending) {
    wooProbePending = (async () => {
      let connected = false;
      try {
        const products = await wc.listProducts({ page: 1, perPage: 1 });
        connected = Array.isArray(products);
      } catch (_) { /* Do not leak sensitive provider errors to public clients. */ }
      wooProbe = { checkedAt: Date.now(), connected };
    })().finally(() => { wooProbePending = null; });
  }
  await wooProbePending;
  return res.json({ configured: true, connected: wooProbe.connected, checkedAt: new Date(wooProbe.checkedAt).toISOString() });
});

const engine = new TaskEngine({ handlers });

function requireWoo(req, res, next) {
  if (!wc) return res.status(503).json({ error: 'not_configured', detail: 'WooCommerce credentials not configured' });
  next();
}
function handleWooError(error, res) {
  // Provider error.message can contain remote HTML, credentials or customer data.
  // Preserve only a safe HTTP classification; never reflect provider text to clients.
  const status = Number.isInteger(error?.status) && [400, 401, 403, 404, 408, 409, 422, 429].includes(error.status)
    ? error.status : 502;
  const details = {
    400: 'WooCommerce request rejected',
    401: 'WooCommerce authentication rejected',
    403: 'WooCommerce permission denied',
    404: 'WooCommerce resource not found',
    408: 'WooCommerce request timed out',
    409: 'WooCommerce conflict',
    422: 'WooCommerce validation failed',
    429: 'WooCommerce rate limited',
    502: 'WooCommerce temporarily unavailable'
  };
  res.status(status).json({ error: 'woocommerce_error', detail: details[status] });
}

app.get('/health', (_req, res) => res.json({
  status: 'healthy', service: 'droperagent-api', uptime: process.uptime(), serverTimeMs: Date.now(),
  note: 'API health does not verify WordPress, WooCommerce, DSers or MCP'
}));
app.get('/tasks', authorize, (_req, res) => res.json({ queue: engine.stats(), tasks: engine.list() }));
app.post('/task', authorize, (req, res) => {
  if (!workerEnabled) return res.status(503).json({ error: 'worker_disabled', detail: 'Durable task storage must be configured before enabling writes' });
  try {
    const { type, data, priority } = req.body || {};
    const task = engine.create(type, data || {}, priority === undefined ? 1 : priority);
    res.status(202).json({ success: true, task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
// DSers/WooCommerce mapping safety preflight: caller-supplied evidence only.
// Read-only and authenticated; never contacts DSers or submits/pays supplier orders.
app.post('/api/automation/mapping-preflight', authorize, (req, res) => {
  const input = req.body || {};
  if (!Array.isArray(input.storeVariants) || !Array.isArray(input.supplierVariants) || !Array.isArray(input.rules) ||
      input.storeVariants.length > 100 || input.supplierVariants.length > 100 || input.rules.length > 100) {
    return res.status(400).json({ error: 'invalid_mapping_input', detail: 'Use arrays up to 100 variants and mapping rules' });
  }
  try {
    const audit = evaluateMapping({
      storeVariants: input.storeVariants,
      supplierVariants: input.supplierVariants,
      rules: input.rules
    });
    // Audit decisions are advisory; even allMapped cannot authorize purchases.
    res.json({ source: 'supplied_mapping_evidence', readOnly: true, supplierAccountVerified: false,
      purchaseAuthorized: false, ...audit });
  } catch (_) {
    res.status(400).json({ error: 'invalid_mapping_input', detail: 'Invalid mapping options' });
  }
});
// Caller-supplied supplier quotes. No DSers request, store change, order or payment.
app.post('/api/automation/supplier-evidence-preflight', authorize, (req, res) => {
  try {
    const audit = evaluateSupplierEvidence(req.body || {});
    return res.json(audit);
  } catch (_) {
    // Never reflect raw supplier input or remote quote references to the client.
    return res.status(400).json({
      error: 'invalid_supplier_evidence_input',
      detail: 'Provide bounded mapping, BRL/Brazil quotations and explicit margin policy'
    });
  }
});
// Private V10 preflight of caller-supplied evidence; never verifies it against the provider.
// Does not touch WooCommerce, create orders, settle PIX or approve checkout.
app.post('/api/automation/v10-commercial-preflight', authorize, (req,res) => {
  try {
    res.json(evaluateV10CommercialGate(req.body));
  } catch (_) {
    res.status(400).json({error:'invalid_v10_commercial_evidence'});
  }
});
// Bounded CJ V10 dossier. Only authenticated read-only catalogue/stock/freight operations.
// One active request per instance, with a 120s interval to conserve CJ API points.
let cjDossierBusy=false;
let cjDossierLastStartedAt=0;
app.post('/api/sourcing/cj/v10-variant-dossier',authorize,requireCJ,async(req,res)=>{
  if(cjDossierBusy || Date.now()-cjDossierLastStartedAt<120000)
    return res.status(429).json({error:'cj_dossier_rate_limited'});
  // Validate BEFORE reserving a call or sending credentials to CJ.
  const body=req.body||{};
  try { require('./v10-cj-variant-dossier').assertInput(body); }
  catch (_) { return res.status(400).json({error:'invalid_cj_dossier_input'}); }
  cjDossierBusy=true;
  cjDossierLastStartedAt=Date.now();
  try {res.json(await collectCJVariantDossier(cj,body));}
  catch(e){safeCJError(e,res);}
  finally{cjDossierBusy=false;}
});
// CJ API 2.0 direct sourcing: authenticated, only read endpoints and freight estimate.
// NO purchase, payment, order creation, Woo updates, DSers access or automatic supplier matching.
app.get('/api/sourcing/cj/status',authorize,(_req,res)=>res.json({
  configured:Boolean(cj),readOnly:true,
  hasAuthenticatedCJAccount:false, // do not assume env configured means live account verified
  purchaseAuthorized:false,pointsUsageUnknown:true
}));
app.get('/api/sourcing/cj/search',authorize,requireCJ,async(req,res)=>{
  try {
    const page=req.query.page===undefined?1:Number(req.query.page);
    const size=req.query.size===undefined?10:Number(req.query.size);
    res.json(await cj.searchProducts({keyword:req.query.keyword,page,size}));
  } catch(e) {safeCJError(e,res);}
});
app.get('/api/sourcing/cj/variants',authorize,requireCJ,async(req,res)=>{
  try {res.json(await cj.listVariants({pid:req.query.pid}));}
  catch(e) {safeCJError(e,res);}
});
app.get('/api/sourcing/cj/stock',authorize,requireCJ,async(req,res)=>{
  try {res.json(await cj.getStock({vid:req.query.vid}));}
  catch(e) {safeCJError(e,res);}
});
// POST here is a CALCULATION only (CJ logistic/freightCalculate), never order/payment.
app.post('/api/sourcing/cj/freight-quote',authorize,requireCJ,async(req,res)=>{
  try {
    const body=req.body||{};
    res.json(await cj.quoteBrazilFreight({vid:body.vid,quantity:body.quantity,origin:body.origin}));
  } catch(e) {safeCJError(e,res);}
});
app.get('/api/woo/products', authorize, requireWoo, async (req, res) => {
  try {
    const products = await wc.listProducts({
      page: Number(req.query.page || 1), perPage: Number(req.query.per_page || 10), status: req.query.status
    });
    res.json({ products: products.map(p => ({ id: p.id, name: p.name, status: p.status, price: p.price, stock_quantity: p.stock_quantity, categories: (p.categories || []).map(c => ({ name: c.name })) })), source: 'woocommerce' });
  } catch (error) { handleWooError(error, res); }
});
app.get('/api/woo/products/:id', authorize, requireWoo, async (req, res) => {
  try { const p = await wc.getProduct(Number(req.params.id)); res.json({ id: p.id, name: p.name, status: p.status, price: p.price, stock_quantity: p.stock_quantity, description: p.description }); }
  catch (error) { handleWooError(error, res); }
});
// Authenticated LIVE Woo variation snapshot. SKU/attributes/retail prices only:
// NEVER assume DSers supplier mapping, landed cost, supplier stock or currency.
app.get('/api/woo/products/:id/variations', authorize, requireWoo, async (req, res) => {
  const productId = Number(req.params.id);
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const perPage = req.query.per_page === undefined ? 30 : Number(req.query.per_page);
  if (!Number.isSafeInteger(productId) || productId < 1 ||
      !Number.isInteger(page) || page < 1 || page > 100 ||
      !Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
    return res.status(400).json({ error: 'invalid_variation_query' });
  }
  try {
    const product = await wc.getProduct(productId);
    if (product.type !== 'variable') return res.status(409).json({ error: 'not_variable_product' });
    const raw = await wc.listProductVariations(productId, { page, perPage });
    const snapshot = makeWooVariantSnapshot(product, raw, { page, perPage });
    return res.json(snapshot);
  } catch (error) {
    // Invalid/foreign upstream payload must fail closed with no provider details.
    if (error instanceof TypeError) return res.status(502).json({ error: 'invalid_variation_upstream_response' });
    return handleWooError(error, res);
  }
});
app.post('/api/woo/products/drafts', authorize, requireWoo, async (req, res) => {
  try {
    const product = await wc.createDraft(req.body || {});
    res.status(201).json({ product, source: 'woocommerce' });
  } catch (error) { handleWooError(error, res); }
});
// Live review uses authenticated WooCommerce, never fabricates DSers orders, payments or market data.
// Gateway configuration is NOT evidence that a charge was accepted or funds settled.
app.get('/api/automation/payment-readiness', authorize, requireWoo, async (_req, res) => {
  try {
    const gateways = await wc.listPaymentGateways();
    if (!Array.isArray(gateways)) return res.status(502).json({ error: 'invalid_payment_gateway_response' });
    const providers = gateways.map(g => ({
      id: typeof g.id === 'string' ? g.id : 'unknown',
      enabled: Boolean(g.enabled),
      description: typeof g.title === 'string' ? g.title.slice(0,80) : ''
    }));
    const enabled = providers.filter(g => g.enabled);
    return res.json({
      source:'woocommerce_authenticated', readOnly:true,
      availableGatewayCount:providers.length,
      enabledGateways:enabled,
      onlinePaymentGatewayConfigured:enabled.some(g => !['bacs','cheque','cod'].includes(g.id)),
      realChargeVerified:false, settlementVerified:false,
      automaticSupplierPurchasesEnabled:false,
      note:'Gateway enabled does not prove onboarding, customer payment or Pix settlement. No test charge attempted.'
    });
  } catch (error) { handleWooError(error,res); }
});

app.get('/api/automation/review', authorize, requireWoo, async (_req, res) => {
  try {
    const [products, orders] = await Promise.all([
      wc.listProducts({ page: 1, perPage: 50 }),
      wc.listOrders({ page: 1, perPage: 50 }),
    ]);
    res.json(reviewCommerce(products, orders));
  } catch (error) { handleWooError(error, res); }
});

app.get('/api/woo/orders', authorize, requireWoo, async (req, res) => {
  try {
    const orders = await wc.listOrders({ page: Number(req.query.page || 1), perPage: Number(req.query.per_page || 10) });
    res.json({ orders: orders.map(o => ({ id: o.id, status: o.status, total: o.total, currency: o.currency, date_created: o.date_created, items: (o.line_items || []).map(i => ({ name: i.name, quantity: i.quantity })) })), source: 'woocommerce' });
  } catch (error) { handleWooError(error, res); }
});
attachBridge(app, authorize);
app.get('/api/agents', authorize, (_req, res) => res.json({ agents: [], source: 'unconfigured', note: 'No OpenClaw telemetry connected' }));
app.get('/control', authorize, (_req, res) => res.json({
  supervisor: { ...engine.stats(), disabled: !workerEnabled, persistence: workerEnabled ? 'local_file_requires_persistent_disk' : 'disabled' },
  integrations: { wordpress: 'NOT_VERIFIED', woocommerce: wcConfigured ? 'CONFIGURED_NOT_VERIFIED' : 'NOT_CONFIGURED', dsers: 'NOT_CONFIGURED', mcp: 'NOT_IMPLEMENTED' },
  note: 'No fabricated products, sales, agent activity or metrics'
}));
app.get('/', (_req, res) => res.json({
  name: 'DroperAgent Local Supervisor', endpoints: ['/health', '/tasks', '/task', '/control', '/api/woo/products', '/api/woo/orders'],
  integrations: 'Not yet connected to WordPress/WooCommerce/DSers'
}));

let server;
function start() {
  server = app.listen(port, host, () => {
    console.log('DroperAgent supervisor listening at http://' + host + ':' + port);
    if (workerEnabled) engine.start();
    else console.log('Worker disabled: no durable storage configured');
    // Boot-time read-only audit; logs only gateway IDs, never credentials or customer data.
    if (wc) wc.listPaymentGateways().then(gateways => {
      const enabled = Array.isArray(gateways)
        ? gateways.filter(g => g && g.enabled && typeof g.id === 'string').map(g => g.id.slice(0,50))
        : [];
      console.log('WooCommerce enabled payment gateway IDs:', JSON.stringify(enabled));
      console.log('WooCommerce customer charge/settlement: NOT_VERIFIED');
    }).catch(() => console.log('WooCommerce payment gateway inspection: UNAVAILABLE'));

  });
  return server;
}
if (require.main === module) start();
module.exports = { app, engine, start, authorize };
