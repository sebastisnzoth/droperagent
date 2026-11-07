# DroperAgent 🤖

**Agente de automatización para Dropshipping WooCommerce - Orquestrado por DeepSeek Harness**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/sebastisnzoth/droperagent)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-success.svg)](https://nodejs.org/)

## 🎯 Sobre o Projeto

O DroperAgent é um sistema de agentes de IA especializado em gerenciar operações completas de e-commerce de dropshipping com WordPress + WooCommerce + DSers + AliExpress.

Controlado pelo **DeepSeek Harness**, o sistema automatiza:
- 📊 Monitoramento de vendas e métricas
- 📦 Sincronização de pedidos com DSers
- 💰 Cálculo de preços e margens
- 🔍 Pesquisa de produtos viáveis
- 📈 Análise de performance
- 🎯 Campanhas de marketing automatizadas

## 🏗️ Arquitetura

```
DroperAgent (MCP Server)
├── Store Architect (agente 01)
├── Product Researcher (agente 02)
├── Product Manager (agente 03)
├── DSers Operator (agente 04)
├── Pricing Engine (agente 05)
├── Marketing AI (agente 06)
├── Customer Support (agente 07)
├── Finance Analyst (agente 08)
└── Quality & Security (agente 09)
```

## 🚀 Quick Start

```bash
# 1. Clone o repositório
git clone https://github.com/sebastisnzoth/droperagent.git
cd droperagent

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 4. Inicie o servidor
npm start

# 5. Acesse o painel de controle
# http://localhost:3000/control
```

## 📋 Endpoints API

| Endpoint | Método | Descrição |
|----------|--------|-------------|
| `/health` | GET | Verificação de saúde |
| `/control` | GET | Painel de controle |
| `/api/woo/products` | GET | Lista de produtos |
| `/api/woo/orders` | GET | Lista de pedidos |
| `/api/dsers/sync` | POST | Sincronizar pedido |
| `/api/dsers/providers` | GET | Fornecedores disponíveis |
| `/api/task` | POST | Executar tarefa de agente |

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Servidor
PORT=3000
NODE_ENV=development

# WooCommerce
WOOCOMMERCE_URL=http://localhost:8080
WC_CONSUMER_KEY=ck_your_key
WC_CONSUMER_SECRET=cs_your_secret

# DSers (quando disponível)
DSERS_API_KEY=your_dsers_key

# Segurança
JWT_SECRET=your_jwt_secret
```

## 🤖 Agentes Disponíveis

| Agente | Função | Status |
|--------|--------|--------|
| Store Architect | Arquitetura da loja | ✅ Ativo |
| Product Researcher | Pesquisa de produtos | ✅ Ativo |
| Product Manager | Gestão de produtos | ✅ Ativo |
| DSers Operator | Operação DSers | ✅ Ativo |
| Pricing Engine | Cálculo de preços | ✅ Ativo |
| Marketing AI | Marketing automatizado | ✅ Ativo |
| Customer Support | Suporte ao cliente | ✅ Ativo |
| Finance Analyst | Análise financeira | ✅ Ativo |
| Quality Security | Qualidade e segurança | ✅ Ativo |

## 🔗 Integrações

- **WooCommerce REST API** - Comunicação bidirecional
- **DSers API** - Sincronização de pedidos
- **MCP Protocol** - Integração com DeepSeek Harness
- **GitHub Actions** - CI/CD automatizado

## 📊 Métricas em Tempo Real

O painel de controle (`/control`) exibe:

- Vendas do dia/semana/mês
- Receita total e média por ordem
- Pedidos pendentes
- Produtos em estoque/baixo estoque
- Alertas de sincronização
- Status dos agentes

## ⚠️ Limitações Conhecidas

1. **Pagamentos**: Não são processados automaticamente - requerem intervenção manual
2. **DSers**: Algumas funções exigem aprovação manual do proprietário da conta
3. **AliExpress**: Importação de produtos requer autorização explícita

## 🛡️ Segurança

- Autenticação por API Key
- Rate limiting (100 req/min)
- Headers de segurança (Helmet)
- Logs de auditoria completos
- Validação de entrada

## 🧪 Testes

```bash
npm test           # Executar testes
npm run lint       # Verificar código
```

## 📦 Deploy

```bash
# Build
npm run build

# Docker
docker build -t autodrop-mcp .
docker run -p 3000:3000 autodrop-mcp
```

## 📜 Licença

MIT - Ver [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

Criado por **sebastisnzoth** - Specialista em automação de e-commerce e IA.

---

**Status**: ✅ Pronto para produção (requer configuração de credenciais WooCommerce)