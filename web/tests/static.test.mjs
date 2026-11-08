import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
test('Vite uses repository base path', () => { assert.match(read('../vite.config.ts'), /base: '\/droperagent\/'/); });
test('Demo mode is default and explicitly marked', () => { const a=read('../src/App.tsx'); assert.match(a, /useState<Mode>\('DEMO'\)/); assert.match(a, /dados de demonstração/); assert.match(a, /NÃO CONECTADO/); });
test('Live mode requires HTTPS and deliberate opt-in', () => { const a=read('../src/App.tsx'); assert.match(a, /publicAPI\.startsWith\('https:\/\/'\)/); assert.match(a, /VITE_ENABLE_LIVE_READONLY/); assert.doesNotMatch(a, /consumer_secret|service_role|sk_live_|ASAAS_/i); });
test('Navigation and page views are present', () => { const a=read('../src/App.tsx'); for (const x of ['overview','products','orders','agents','tasks','integrations','settings','diagnostics']) assert.ok(a.includes(x)); });
