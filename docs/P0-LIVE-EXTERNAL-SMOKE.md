# P0 — verificação externa LIVE (2026-11-08)

## Fontes e evidências

- API verificada: `https://droperagent-api.onrender.com` — serviço Render `srv-dbnui3rrjlhs739tv880`, plano Free, ramo `main`.
- Site público: `https://sebastisnzoth.github.io/droperagent/`.
- Loja persistente externa: `https://droperagent.cu.ma/`. WooCommerce ativo.
- Ação externa de verificação: `node scripts/live-public-smoke.mjs`.
- Primeira execução externa: https://github.com/sebastisnzoth/droperagent/actions/runs/42457291303 — 9/9 PASS (2026-11-08 07:05 UTC).
- Monitoramento de caráter indicativo: workflow `.github/workflows/p0-live-smoke.yml`, a cada 6 horas (sujeito à disponibilidade/agendamento do GitHub Actions). Não garante uptime contínuo.

## Comprovado por GitHub runner externo

1. GitHub Pages publica HTML e os bundles JS/CSS acessíveis.
2. Render responde HTTPS /health, status healthy, identidade `droperagent-api`, timestamp.
3. CORS permite o origin da interface e nega um origin diferente.
4. Preflight `OPTIONS /auth/me` permite a origem aprovada.
5. Sem sessão, /auth/me, /api/woo/products, /api/woo/orders e /api/automation/review respondem HTTP 401, com Cache-Control no-store.
6. /health/woocommerce executa consulta real autenticada somente-leitura ao WooCommerce e reportou `configured:true, connected:true`, timestamp.

## Limitações explícitas

- Esse smoke NÃO realiza login administrativo com senha real nem valida sessão expirada no servidor de produção (o CI isolado cobre a lógica da sessão).
- NÃO lê catálogo nem pedidos privados através do backend por não possuir uma sessão administrativa; a verificação pública de Woo usa uma consulta interna mínima.
- A conexão direta por MCP da loja permitiu consultar produtos/pedidos: 0 produtos e 0 pedidos observados no momento da auditoria. Não representa pedido de fornecedor DSers.
- WooCommerce reportou métodos de pagamento desativados; nenhum pagamento testado ou aceito.
- Nenhum cliente DSers/AliExpress verificado por API autenticada. Não habilitar auto-order ou auto-payment.
- Render Free é potencialmente suspenso por inatividade, sem armazenamento durável para fila. O worker está desativado por `DROPERAGENT_DISABLE_WORKER=1`.
- As verificações E2E de login e segurança em GitHub Actions usam ambiente descartável ou mocks; não afirmar PASS de login real de produção a partir delas.
- O frontend `web/src/App.tsx` e `.github/workflows/pages-dashboard.yml` são responsabilidade do PR #23, atualmente aberto. Não foram modificados por este trabalho.

## PRs sob responsabilidade de outros módulos

- #18 auditoria DSers variante/SKU — aberto, sem compra.
- #19 política fail-closed e skills sociais/sourcing — aberto, não é permissão financeira.
- #20 Supplier Mapping Guard — aberto, semelhante em finalidade ao #18; resolver sobreposição antes de mesclar ambos.
- #22 WooCommerce Blueprint preflight — aberto, **não** aplicar SQL ou alterar impostos.
- #23 frontend LIVE gating/identity/retry — aberto, modificar neste PR apenas arquivos externos ao seu escopo.

## Próximos critérios PASS

- Provar sessão real válida, expiração e logout com cliente autorizado sem imprimir token, senha ou PII.
- Passar E2E do navegador conectado à API real, não só mocks, com dados reais minimizados.
- Resolver PR #23 sem habilitar LIVE só por URL configurada.
- Revisar fiscalidade, frete, checkout, gateway e fluxo de compra sem tocar produção até ter aprovações.
