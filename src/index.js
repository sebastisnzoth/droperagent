#!/usr/bin/env node
/**
 * DroperAgent v1.0.0 - MCP Server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Supervisor } = require('./supervisor');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Supervisor
const supervisor = new Supervisor();
supervisor.init();

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Task endpoints
app.post('/task/create', (req, res) => {
    const { type, data, priority } = req.body;
    const taskId = supervisor.createTask(type, data, priority);
    res.json({ taskId, success: true });
});

app.get('/tasks', (req, res) => {
    res.json({ 
        queue: supervisor.getQueue(),
        total: supervisor.tasks.length 
    });
});

// Dashboard
app.get('/control', (req, res) => {
    res.json({
        store: { products: 1, orders: 0 },
        agents: { count: 9, active: 9 },
        tasks: supervisor.getQueue()
    });
});

// Welcome
app.get('/', (req, res) => {
    res.json({
        name: 'DroperAgent',
        version: '1.0.0',
        endpoints: ['/health', '/control', '/tasks', '/task/create']
    });
});

// Start
app.listen(PORT, () => {
    console.log(`DroperAgent running on port ${PORT}`);
});

module.exports = { app, supervisor };
