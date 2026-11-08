# DROPERAGENT — Commerce Operations (em desenvolvimento)

**Estado auditado em 2026-11-08:** site público e backend HTTPS em funcionamento, WordPress/WooCommerce conectado, plataforma de dropshipping autônoma **NÃO concluída**. Não há autorização de compras automáticas nem meio de pagamento habilitado.

- **Painel:** https://sebastisnzoth.github.io/droperagent/
- **API real:** https://droperagent-api.onrender.com
- **WordPress / WooCommerce real:** https://droperagent.cu.ma/
- **Repositório:** https://github.com/sebastisnzoth/droperagent
- **Evidência de smoke público:** https://github.com/sebastisnzoth/droperagent/actions/runs/42457291303 — 9/9 PASS
- **Detalhes da auditoria:** [docs/P0-LIVE-EXTERNAL-SMOKE.md](docs/P0-LIVE-EXTERNAL-SMOKE.md)

## Conexões verificadas

- GitHub Pages: HTML e dois assets do build responderam a teste externo HTTPS.
- Render: serviço real `droperagent-api` no plano Free, `/health` identificou serviço e timestamp.
- CORS: navegador permitido somente a partir de `https://sebastisnzoth.github.io`; origem externa recusada com 403.
- WooCommerce REST: `/health/woocommerce` registrou `configured:true,connected:true` via consulta autenticada de somente leitura.
- A API impede acesso não autenticado a catálogo, pedidos e análise comercial (401).
- A conta WordPress conectada via MCP confirmou WooCommerce ativo; na auditoria, 0 produtos e 0 pedidos reais.

## Ainda pendente / não comprovado

- Login com senha real, sessão válida/expiração/logout e leitura privada do painel **não foram provados ponta a ponta no ambiente de produção por esse smoke**. Testes isolados da API e Playwright com mocks não substituem essa verificação.
- DSers e AliExpress: sem prova de chamada autorizada a API/conta real neste backend; variantes, custo de frete e sourcing não validados.
- Pagamentos: nenhuma forma de cobrança habilitada na configuração WooCommerce observada; não há cobrança/repasse testados.
- Operação 24/7: serviço Render Free pode adormecer; worker comercial desabilitado para não usar disco efêmero. Não existe fila comercial transacional durável verificada.
- Marketing Meta e OpenClaw: fluxos reais com contas autorizadas não verificados.
- Frete e fiscalidade no Brasil: não habilitar checkout comercial sem revisão da configuração real e testes.
- O PR #23 desenvolve validação LIVE de frontend com critérios separados (não se confunde com smoke público).

## Tecnologias e controles

- Backend: Node.js/Express, sessão administrativa de 15 min, endpoints protegidos por bearer token; credenciais WooCommerce em variáveis de ambiente Render, nunca em `VITE_*`.
- WooCommerce: cliente REST para catálogo e pedidos, criação de rascunho somente com autorização na API.
- Testes: `.github/workflows/core-tests.yml`, `.github/workflows/wordpress-ci.yml` (WordPress/MariaDB/WooCommerce descartáveis), `.github/workflows/pages-dashboard.yml`, `.github/workflows/p0-live-smoke.yml`.
- Verificação externa manual: `node scripts/live-public-smoke.mjs` (sem login, sem segredo, sem escrita); cron de seis horas é amostragem, **não SLA de disponibilidade**.
- MCP stdio: `src/mcp-server.mjs`; a instância WordPress usa MCP próprio e não equivale a habilitar o worker no Render.
- Worker: `DROPERAGENT_DISABLE_WORKER=1` no blueprint; não iniciar sem storage persistente, idempotência, DLQ, controles de custo e aprovação financeira verificável.

## Módulos e propriedade do trabalho em paralelo

- PR #18: auditoria de variantes DSers; PR #20: Mapping Guard — revisar interseções antes do merge.
- PR #19: políticas de autonomia e skills de sourcing/Meta — não concede pagamentos automaticamente.
- PR #22: auditoria WooCommerce Blueprint — sem SQL, sem alterações fiscais.
- PR #23: gating da conexão LIVE do frontend — não sobrescrever seus arquivos.
- P0 smoke: este documento e `scripts/live-public-smoke.mjs`, independente de tais PRs.

**Não declarar COMMERCE PASS apenas com HTTP 200, endpoint /health ou smoke de loja.**
