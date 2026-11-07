require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Rotas básicas
app.get('/', (req, res) => {
  res.json({ 
    status: 'DroperAgent ativo',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// API de processamento
app.post('/api/process', (req, res) => {
  const { item, options } = req.body;
  
  if (!item) {
    return res.status(400).json({ error: 'Item é obrigatório' });
  }
  
  // Simulação de processamento
  res.json({
    id: Date.now(),
    status: 'processed',
    input: item,
    options,
    processedAt: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`DroperAgent rodando na porta ${PORT}`);
});

module.exports = app;