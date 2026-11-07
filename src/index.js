#!/usr/bin/env node
/**
 * DroperAgent v1.0.0
 * Agente de automatización para Dropshipping WooCommerce
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
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
        description: 'Agente de automatización para Dropshipping WooCommerce',
        version: '1.0.0',
        endpoints: [
            '/health',
            '/control',
            '/api/woo/products',
            '/api/woo/orders',
            '/api/dsers/sync',
            '/api/dsers/providers',
            '/api/task'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`DroperAgent rodando na porta ${PORT}`);
});

module.exports = { app };