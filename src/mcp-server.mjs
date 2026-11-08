#!/usr/bin/env node
/**
 * Real MCP stdio server for local OpenClaw/Harness connections.
 * The SDK owns the protocol handshake and tools/list/tools/call.
 * This process never logs to stdout outside the MCP transport.
 */
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import wcModule from './woocommerce-client.js';
const { WooCommerceClient } = wcModule;

const configured = Boolean(process.env.WOOCOMMERCE_URL && process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET);
const allowDrafts = process.env.DROPERAGENT_MCP_ALLOW_DRAFTS === '1';
let wc;
function requireClient() {
  if (!configured) throw new Error('WooCommerce credentials are not configured');
  if (!wc) wc = new WooCommerceClient({
    baseUrl: process.env.WOOCOMMERCE_URL,
    consumerKey: process.env.WC_CONSUMER_KEY,
    consumerSecret: process.env.WC_CONSUMER_SECRET
  });
  return wc;
}
const result = payload => ({ content: [{ type: 'text', text: JSON.stringify(payload) }] });
const call = handler => async args => {
  try { return result(await handler(args)); }
  catch (err) { return { isError: true, content: [{ type: 'text', text: err.message || 'Integration error' }] }; }
};

function createServer() {
  const server = new McpServer({ name: 'droperagent', version: '0.2.0' });
  server.registerTool('store_status', {
    description: 'Report configuration of WooCommerce without claiming that it is online',
    inputSchema: z.object({})
  }, call(async () => ({ woocommerce: configured ? 'configured_not_verified' : 'not_configured', draftsEnabled: allowDrafts, dsers: 'not_connected' })));

  server.registerTool('list_products', {
    description: 'List products from the actual WooCommerce REST API',
    inputSchema: z.object({
      page: z.number().int().min(1).default(1),
      perPage: z.number().int().min(1).max(100).default(10)
    })
  }, call(({ page, perPage }) => requireClient().listProducts({ page, perPage })));

  server.registerTool('get_product', {
    description: 'Read one product by WooCommerce product ID',
    inputSchema: z.object({ id: z.number().int().positive() })
  }, call(({ id }) => requireClient().getProduct(id)));

  server.registerTool('list_orders', {
    description: 'Read orders via WooCommerce REST API (contains customer data; use trusted local host only)',
    inputSchema: z.object({
      page: z.number().int().min(1).default(1),
      perPage: z.number().int().min(1).max(100).default(10)
    })
  }, call(({ page, perPage }) => requireClient().listOrders({ page, perPage })));

  server.registerTool('create_product_draft', {
    description: 'Create WooCommerce DRAFT only; disabled unless explicitly enabled with DROPERAGENT_MCP_ALLOW_DRAFTS=1',
    inputSchema: z.object({
      name: z.string().min(1).max(200),
      regularPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
      description: z.string().max(10000).default('')
    })
  }, call(async args => {
    if (!allowDrafts) throw new Error('Draft writes disabled');
    return requireClient().createDraft(args);
  }));
  return server;
}

await serveStdio(createServer);
