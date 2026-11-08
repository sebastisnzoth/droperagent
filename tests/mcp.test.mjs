import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

test('real MCP protocol initialization, tool listing and safe disconnected responses', async () => {
  const client = new Client({ name: 'droperagent-ci-client', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['src/mcp-server.mjs'],
    env: { ...process.env, WOOCOMMERCE_URL: '', WC_CONSUMER_KEY: '', WC_CONSUMER_SECRET: '', DROPERAGENT_MCP_ALLOW_DRAFTS: '0' }
  });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    const names = tools.tools.map(t => t.name);
    for (const name of ['store_status', 'list_products', 'get_product', 'list_orders', 'create_product_draft']) {
      assert.ok(names.includes(name), 'Missing MCP tool: ' + name);
    }
    const status = await client.callTool({ name: 'store_status', arguments: {} });
    assert.equal(status.isError, undefined);
    assert.equal(JSON.parse(status.content[0].text).woocommerce, 'not_configured');

    const products = await client.callTool({ name: 'list_products', arguments: { page: 1, perPage: 10 } });
    assert.equal(products.isError, true);
    assert.match(products.content[0].text, /not configured/i);

    const draft = await client.callTool({
      name: 'create_product_draft',
      arguments: { name: 'Demo', regularPrice: '19.90' }
    });
    assert.equal(draft.isError, true);
    assert.match(draft.content[0].text, /disabled/i);
  } finally {
    await client.close();
  }
});
