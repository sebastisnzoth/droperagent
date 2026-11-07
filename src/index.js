#!/usr/bin/env node
/**
 * DroperAgent v1.0.0 - MCP Server
 * Agente de automatização para Dropshipping WooCommerce
 * Conexão com DeepSeek Harness via MCP Protocol
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check detalhado
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Welcome endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'DroperAgent',
        description: 'Agente de automatização para Dropshipping WooCommerce',
        version: '1.0.0',
        endpoints: [
            '/health', '/control', '/api/woo/products', '/api/woo/orders',
            '/api/woo/metrics', '/api/dsers/sync', '/api/dsers/providers',
            '/api/task', '/api/agents', '/mcp'
        ]
    });
});

// Control Center
app.get('/control', async (req, res) => {
    res.json({
        store: { sales_today: 0, orders_today: 0 },
        agents: 9,
        status: 'ready'
    });
});

// List agents
app.get('/api/agents', (req, res) => {
    res.json({
        agents: [
            { id: 'store-architect', name: 'Store Architect' },
            { id: 'product-researcher', name: 'Product Researcher' },
            { id: 'product-manager', name: 'Product Manager' },
            { id: 'dsers-operator', name: 'DSers Operator' },
            { id: 'pricing-engine', name: 'Pricing Engine' },
            { id: 'marketing-ai', name: 'Marketing AI' },
            { id: 'customer-support', name: 'Customer Support' },
            { id: 'finance-analyst', name: 'Finance Analyst' },
            { id: 'quality-security', name: 'Quality & Security' }
        ]
    });
});

// WooCommerce endpoints (when configured)
app.get('/api/woo/products', async (req, res) => {
    res.json({ 
        products: [], 
        note: 'Configure WooCommerce API in .env' 
    });
});

app.get('/api/woo/orders', async (req, res) => {
    res.json({ 
        orders: [], 
        note: 'Configure WooCommerce API in .env' 
    });
});

// DSers endpoints
app.get('/api/dsers/providers', (req, res) => {
    res.json([
        { id: 'aliexpress', name: 'AliExpress', rating: 4.5 }
    ]);
});

// Task endpoint
app.post('/api/task', async (req, res) => {
    const { agent, action } = req.body;
    res.json({ 
        success: true, 
        result: { agent, action, status: 'completed' } 
    });
});

// MCP Protocol
app.get('/mcp', (req, res) => {
    res.json({
        protocol: 'MCP',
        version: '1.0',
        tools: [
            'droperagent.list_products',
            'droperagent.create_product_draft',
            'droperagent.update_product',
            'droperagent.list_orders',
            'droperagent.get_order',
            'droperagent.get_sales',
            'droperagent.analyze_margins',
            'droperagent.get_inventory_alerts',
            'droperagent.list_approvals',
            'droperagent.run_store_healthcheck'
        ]
    });
});

// Error handler
app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal error', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`DroperAgent rodando na porta ${PORT}`);
});

module.exports = { app };