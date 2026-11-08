'use strict';
/**
 * Shared, durable local task engine.
 * One Node process owns the queue and its worker loop.
 * No shell execution, arbitrary URLs or remote agent execution.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

class TaskEngine {
  constructor({ file = path.join(process.cwd(), 'db', 'tasks.json'), handlers = {}, maxRetries = 3, now = Date.now } = {}) {
    this.file = file;
    this.handlers = handlers;
    this.maxRetries = maxRetries;
    this.now = now;
    this.busy = false;
    this.timer = null;
    this.tasks = this.load();
  }

  load() {
    if (!fs.existsSync(this.file)) return [];
    const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('Invalid task store: expected an array');
    let recovered = false;
    for (const task of parsed) {
      if (task.status === 'RUNNING') {
        task.status = 'PENDING';
        task.nextRunAt = this.now();
        task.lastError = 'Recovered after process interruption';
        recovered = true;
      }
    }
    if (recovered) this.persist(parsed);
    return parsed;
  }

  persist(tasks = this.tasks) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true, mode: 0o700 });
    const tmp = this.file + '.' + process.pid + '.tmp';
    try {
      fs.writeFileSync(tmp, JSON.stringify(tasks, null, 2), { mode: 0o600 });
      fs.renameSync(tmp, this.file);
    } finally {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
  }

  create(type, data = {}, priority = 1) {
    if (!Object.hasOwn(this.handlers, type)) throw new Error('Unsupported task type');
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid task data');
    if (!Number.isInteger(priority) || priority < 0 || priority > 10) throw new Error('Invalid priority');
    const task = {
      id: crypto.randomUUID(), type, data, priority,
      status: 'PENDING', attempts: 0,
      createdAt: new Date(this.now()).toISOString(),
      nextRunAt: this.now()
    };
    this.tasks.push(task);
    this.persist();
    return task;
  }

  list() { return this.tasks.map(t => ({ ...t })); }
  stats() {
    const counts = { pending: 0, running: 0, completed: 0, failed: 0 };
    for (const t of this.tasks) {
      const key = t.status.toLowerCase();
      if (Object.hasOwn(counts, key)) counts[key]++;
    }
    return { ...counts, total: this.tasks.length, workerRunning: Boolean(this.timer) };
  }

  async tick() {
    if (this.busy) return false;
    const task = this.tasks
      .filter(t => t.status === 'PENDING' && t.nextRunAt <= this.now())
      .sort((a, b) => b.priority - a.priority || a.nextRunAt - b.nextRunAt)[0];
    if (!task) return false;
    this.busy = true;
    try {
      task.status = 'RUNNING';
      task.attempts++;
      task.startedAt = new Date(this.now()).toISOString();
      this.persist();
      try {
        const result = await this.handlers[task.type](task.data);
        task.status = 'COMPLETED';
        task.result = result;
        task.completedAt = new Date(this.now()).toISOString();
      } catch (error) {
        task.lastError = error instanceof Error ? error.message : String(error);
        if (task.attempts >= this.maxRetries) {
          task.status = 'FAILED';
          task.failedAt = new Date(this.now()).toISOString();
        } else {
          task.status = 'PENDING';
          task.nextRunAt = this.now() + Math.min(60000, 1000 * 2 ** (task.attempts - 1));
        }
      }
      this.persist();
      return true;
    } finally {
      this.busy = false;
    }
  }

  start(intervalMs = 2000) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick().catch(error => console.error('Task worker failure:', error));
    }, intervalMs);
    this.tick().catch(error => console.error('Task worker startup failure:', error));
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

module.exports = { TaskEngine };
