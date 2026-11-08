'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { TaskEngine } = require('../src/task-engine');

function harness(t, handlers, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'droperagent-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'tasks.json');
  return { file, engine: new TaskEngine({ file, handlers, ...options }) };
}

test('runs a task and persists result across engine restarts', async (t) => {
  const { file, engine } = harness(t, { ping: async () => ({ pong: true }) });
  const created = engine.create('ping');
  assert.equal(await engine.tick(), true);
  assert.equal(engine.stats().completed, 1);
  const restarted = new TaskEngine({ file, handlers: { ping: async () => ({ pong: true }) } });
  assert.equal(restarted.list()[0].id, created.id);
  assert.deepEqual(restarted.list()[0].result, { pong: true });
  assert.equal(restarted.stats().pending, 0);
});

test('recovers RUNNING tasks after interruption', async (t) => {
  const { file, engine } = harness(t, { ping: async () => 'ok' });
  const task = engine.create('ping');
  task.status = 'RUNNING';
  engine.persist();
  const restarted = new TaskEngine({ file, handlers: { ping: async () => 'ok' } });
  assert.equal(restarted.stats().pending, 1);
  await restarted.tick();
  assert.equal(restarted.stats().completed, 1);
});

test('retries failed tasks and records terminal failure', async (t) => {
  let now = 100000;
  let calls = 0;
  const { engine } = harness(t, { broken: async () => { calls++; throw new Error('planned failure'); } }, { now: () => now });
  engine.create('broken');
  await engine.tick();
  assert.equal(engine.stats().pending, 1);
  now += 1000;
  await engine.tick();
  assert.equal(engine.stats().pending, 1);
  now += 2000;
  await engine.tick();
  assert.equal(calls, 3);
  assert.equal(engine.stats().failed, 1);
  assert.equal(engine.list()[0].attempts, 3);
});

test('rejects unknown operations without shell execution', (t) => {
  const { engine } = harness(t, { ping: async () => 'pong' });
  assert.throws(() => engine.create('curl-request', { url: 'example.com; rm -rf /' }), /Unsupported task type/);
  assert.throws(() => engine.create('ping', [], 1), /Invalid task data/);
});

test('does not claim or duplicate a task during an ongoing execution', async (t) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const { engine } = harness(t, { slow: async () => { await gate; return 'ok'; } });
  engine.create('slow');
  const first = engine.tick();
  assert.equal(await engine.tick(), false);
  release();
  await first;
  assert.equal(engine.stats().completed, 1);
});
