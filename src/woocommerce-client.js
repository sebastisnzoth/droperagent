'use strict';
/**
 * Strict WooCommerce REST API adapter.
 * No demo products, fake orders, fake tracking or supplier writes.
 */
class WooCommerceClient {
  constructor({ baseUrl, consumerKey, consumerSecret, fetchImpl = globalThis.fetch }) {
    if (!baseUrl || !consumerKey || !consumerSecret) throw new Error('WooCommerce not configured');
    const url = new URL(baseUrl);
    const local = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
      throw new Error('HTTPS required for remote WooCommerce connections');
    }
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported URL scheme');
    if (url.username || url.password || url.search || url.hash) throw new Error('Invalid WooCommerce URL');
    if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable');
    this.baseUrl = url.toString().replace(/\/$/, '');
    this.authorization = 'Basic ' + Buffer.from(consumerKey + ':' + consumerSecret).toString('base64');
    this.fetchImpl = fetchImpl;
  }

  async request(method, path, { query = {}, json } = {}) {
    const url = new URL(this.baseUrl + '/wp-json/wc/v3/' + path);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await this.fetchImpl(url.toString(), {
      method,
      headers: {
        authorization: this.authorization,
        accept: 'application/json',
        ...(json === undefined ? {} : { 'content-type': 'application/json' })
      },
      body: json === undefined ? undefined : JSON.stringify(json),
      signal: AbortSignal.timeout(10000),
      redirect: 'error'
    });
    let data;
    try { data = await response.json(); } catch (_) { throw new Error('WooCommerce did not return JSON'); }
    if (!response.ok) {
      const msg = typeof data?.message === 'string' ? data.message.slice(0, 160) : 'WooCommerce request failed';
      const error = new Error(msg);
      error.status = response.status;
      throw error;
    }
    return data;
  }

  listProducts({ page = 1, perPage = 10, status } = {}) {
    if (!Number.isInteger(page) || page < 1) throw new Error('Invalid page');
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) throw new Error('Invalid perPage');
    if (status && !['draft', 'publish', 'pending', 'private'].includes(status)) throw new Error('Invalid status');
    return this.request('GET', 'products', { query: { page, per_page: perPage, status } });
  }

  getProduct(id) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid product id');
    return this.request('GET', 'products/' + id);
  }

  // Read-only official WooCommerce REST v3 variation collection.
  // Pagination bounds prevent untrusted callers from triggering unbounded catalog scans.
  listProductVariations(productId, { page = 1, perPage = 30 } = {}) {
    if (!Number.isSafeInteger(productId) || productId < 1) throw new Error('Invalid product id');
    if (!Number.isInteger(page) || page < 1 || page > 100) throw new Error('Invalid page');
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) throw new Error('Invalid perPage');
    return this.request('GET', 'products/' + productId + '/variations', {
      query: { page, per_page: perPage }
    });
  }

  createDraft({ name, regularPrice, description = '' }) {
    if (typeof name !== 'string' || !name.trim() || name.length > 200) throw new Error('Invalid product name');
    if (typeof regularPrice !== 'string' || !/^\d+(\.\d{1,2})?$/.test(regularPrice)) throw new Error('Invalid regular price');
    if (typeof description !== 'string' || description.length > 10000) throw new Error('Invalid description');
    return this.request('POST', 'products', {
      json: { name: name.trim(), type: 'simple', status: 'draft', regular_price: regularPrice, description }
    });
  }

  listPaymentGateways() {
    // Read-only WooCommerce REST v3 endpoint. Never call settings update APIs.
    return this.request('GET', 'payment_gateways');
  }

  listOrders({ page = 1, perPage = 10 } = {}) {
    if (!Number.isInteger(page) || page < 1) throw new Error('Invalid page');
    if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) throw new Error('Invalid perPage');
    return this.request('GET', 'orders', { query: { page, per_page: perPage } });
  }
}

module.exports = { WooCommerceClient };
