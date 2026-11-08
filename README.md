# DROPERAGENT — Commerce Operations (em desenvolvimento)

**Estado atual: interface pública verificada; plataforma de dropshipping LIVE ainda incompleta.**

**Frontend:** https://sebastisnzoth.github.io/droperagent/

**Código:** https://github.com/sebastisnzoth/droperagent

O GitHub Pages publica uma interface React/Vite responsiva em português, com DEMO explícito e fluxo de login LIVE preparado. **GitHub Pages não executa Node.js, WordPress, MariaDB, MCP ou OpenClaw.**

## Implementado e verificado em GitHub Actions

- Frontend GitHub Pages: build, testes desktop/mobile com Chromium e smoke test dos recursos públicos.
- API Node.js: autenticação de administrador com sessão temporária, proteção de rotas, limite de tentativas e CORS restrito.
- Supervisor local: fila de tarefas em arquivo JSON com recuperação no reinício e reintentos, para um único processo.
- Integração WooCommerce: cliente REST real com leitura de produtos/pedidos e criação apenas de produtos em rascunho.
- Teste E2E descartável: WordPress + MariaDB + WooCommerce instalados em contêineres, chave REST de teste, conexão HTTPS autenticada, criação e releitura de um produto real.
- MCP: servidor stdio com ferramentas testadas por um cliente MCP oficial; invocações contra uma loja permanente e OpenClaw ainda não verificadas.

## Ainda não está LIVE

- Não existe nesta entrega uma hospedagem WordPress/MariaDB persistente com backups e endereço HTTPS real.
- Não existe um backend HTTPS público DROPERAGENT confirmado em execução: a criação automática do novo serviço foi bloqueada pela conexão disponível.
- Logo, o GitHub Pages permanece em DEMO até que `DROPERAGENT_API_URL` e `DROPERAGENT_LIVE_READONLY` sejam configuradas com um backend verificado.
- Nenhuma conta DSers/AliExpress foi autorizada; não há pedidos de fornecedores nem sincronização real.
- Não foi possível acessar o Mac com OpenClaw para instalar/cronometrar ou verificar agentes reais.
- Não existem pagamentos/checkout publicados ou operações comerciais reais.

## Código / documentação relevante

- `src/index.js` — API local segura, endpoints de login, produtos, pedidos, fila e agentes não conectados.
- `src/live-auth.js` — sessões em memória de 15 minutos, senha obrigatória de administrador, limitação de tentativas.
- `src/task-engine.js` — fila local. **Não é um banco de dados transacional distribuído.**
- `src/woocommerce-client.js` — adapter REST HTTP(S), autenticado pelo backend.
- `src/mcp-server.mjs` — servidor MCP stdio local.
- `docker-compose.yml` — WordPress/MariaDB local com volumes nomeados.
- `render.yaml` — Blueprint de API isolada no plano Free, ainda não implantado; o worker fica desligado porque o armazenamento gratuito é efêmero.
- `docs/REAL-DEPLOYMENT-HANDOFF.md` — configuração e bloqueios concretos do ambiente.
- `docs/OPENCLAW-MCP.md` — integração MCP local.
- `.github/workflows/wordpress-ci.yml` — E2E WooCommerce real via HTTPS em ambiente descartável.
- `.github/workflows/pages-dashboard.yml` — build, navegador e deploy estático.

## Próxima verificação necessária

Implantar um host persistente de WordPress/MariaDB com HTTPS, gerar chaves WooCommerce de teste, configurar essas chaves **somente no backend**, verificar a API pública com login e depois habilitar LIVE no build do GitHub Pages. A integração DSers exige conectar uma conta DSers autorizada à loja, configurar REST API e webhooks; não utilizar endpoints não documentados.

**Não declarar COMPLETE com base em HTTP 200 ou numa integração temporária de CI.**
