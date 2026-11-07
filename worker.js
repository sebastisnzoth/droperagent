#!/usr/bin/env node
/**
 * Autonomous Worker - Persistent Task Executor
 * Designed for macOS with tmux persistence
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const CONFIG = {
    CHECK_INTERVAL: 5000,        // 5 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,             // 1 second base
    DB_PATH: path.join(__dirname, 'db', 'tasks.db'),
    LOG_FILE: path.join(__dirname, 'logs', 'worker.log'),
    SERVER_URL: 'http://localhost:3000'
};

// Simple SQLite-like storage
class TaskStorage {
    constructor() {
        this.tasks = [];
        this.load();
    }

    load() {
        try {
            const fs = require('fs');
            const data = fs.readFileSync(CONFIG.DB_PATH, 'utf8');
            this.tasks = JSON.parse(data);
        } catch (e) {
            this.tasks = [];
            this.save();
        }
    }

    save() {
        const fs = require('fs');
        const dir = path.dirname(CONFIG.DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG.DB_PATH, JSON.stringify(this.tasks, null, 2));
    }

    createTask(type, data = {}, priority = 1) {
        const task = {
            id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            priority,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            retryCount: 0
        };
        this.tasks.push(task);
        this.save();
        return task;
    }

    getNextPending(limit = 5) {
        return this.tasks
            .filter(t => t.status === 'PENDING')
            .sort((a, b) => b.priority - a.priority)
            .slice(0, limit);
    }

    markRunning(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = 'RUNNING';
            task.startedAt = new Date().toISOString();
            this.save();
        }
    }

    markCompleted(id, result) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = 'COMPLETED';
            task.completedAt = new Date().toISOString();
            task.result = result;
            this.save();
        }
    }

    markFailed(id, error) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.status = 'FAILED';
            task.error = error.message;
            task.failedAt = new Date().toISOString();
            task.retryCount++;
            if (task.retryCount < 3) {
                task.status = 'PENDING';
            }
            this.save();
        }
    }

    getStats() {
        return {
            total: this.tasks.length,
            pending: this.tasks.filter(t => t.status === 'PENDING').length,
            running: this.tasks.filter(t => t.status === 'RUNNING').length,
            completed: this.tasks.filter(t => t.status === 'COMPLETED').length,
            failed: this.tasks.filter(t => t.status === 'FAILED').length
        };
    }
}

// Logger
function log(message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}\n`;
    const logsDir = path.dirname(CONFIG.LOG_FILE);
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    fs.appendFileSync(CONFIG.LOG_FILE, entry);
    console.log(message);
}

// Task Executors
const executors = {
    'http-request': async (data) => {
        const http = require('http');
        const url = new URL(data.url || 'http://localhost:3000/health');
        
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve({ status: res.statusCode, body }));
            }).on('error', reject);
        });
    },

    'curl-request': async (data) => {
        return new Promise((resolve, reject) => {
            exec(`curl -s ${data.url || 'http://localhost:3000/health'}`, 
                { timeout: 5000 },
                (error, stdout, stderr) => {
                    if (error) reject(error);
                    else resolve({ output: stdout });
                }
            );
        });
    },

    'health-check': async (data) => {
        const response = await executors['http-request']({ url: CONFIG.SERVER_URL + '/health' });
        return { type: 'health-check', response, timestamp: new Date().toISOString() };
    },

    'ping': async (data) => {
        return { ping: 'pong', timestamp: new Date().toISOString() };
    }
};

// Main Worker Loop
async function workerLoop() {
    const storage = new TaskStorage();
    log('Worker started');

    // Create initial tasks
    if (storage.getStats().total === 0) {
        storage.createTask('health-check', {}, 1);
        storage.createTask('ping', {}, 2);
        log('Created initial tasks');
    }

    while (true) {
        try {
            const pending = storage.getNextPending(2);
            
            for (const task of pending) {
                log(`Processing task: ${task.id} (${task.type})`);
                
                try {
                    storage.markRunning(task.id);
                    const result = await (executors[task.type] || executors['ping'])(task.data);
                    storage.markCompleted(task.id, result);
                    log(`Task ${task.id} completed`);
                } catch (error) {
                    storage.markFailed(task.id, error);
                    log(`Task ${task.id} failed: ${error.message}`);
                }
            }

            // Heartbeat
            localStorage.setItem('worker-heartbeat', Date.now());
            
        } catch (error) {
            log(`Worker error: ${error.message}`);
        }

        await new Promise(r => setTimeout(r, CONFIG.CHECK_INTERVAL));
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    log('Worker shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    log('Worker interrupted...');
    process.exit(0);
});

// Start worker
workerLoop().catch(console.error);

// Export for testing
module.exports = { TaskStorage, CONFIG, executors };
