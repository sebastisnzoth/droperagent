# DROPERAGENT — Estado real verificado

Atualizado: 2026-11-08. Branch de referência: `main`.

| Recurso | Estado | Evidência |
| --- | --- | --- |
| GitHub Pages | PASS | Pipeline de build, Chromium desktop/mobile, deploy e smoke test HTTP |
| API Node + autenticação | PASS em CI | Testes HTTP de login, autorização, logout e CORS |
| Fila local | PASS em CI | Testes de recuperação, reintentos e prevenção de duplicatas; JSON local single-process |
| WooCommerce REST com HTTPS | PASS em CI descartável | Produto rascunho criado por API autenticada e relido; MariaDB real |
| MCP stdio | PASS em teste de protocolo | Cliente SDK fez handshake, listou ferramentas e verificou recusas |
| WordPress persistente público | BLOQUEADO | Nenhuma hospedagem + banco permanente configurados |
| API HTTPS pública persistente | BLOQUEADO | Blueprint versionado, serviço externo não criado |
| Painel LIVE com dados reais externos | BLOQUEADO | Depende de API pública, login e WooCommerce autorizado |
| OpenClaw com agentes executando | DESCONHECIDO / não verificado | Gateway local não acessível por esta conexão |
| DSers / AliExpress | BLOQUEADO | Falta conta autorizada vinculada ao WooCommerce, domínio e webhooks |
| Compras, pagamentos e checkout | NÃO IMPLEMENTADOS | Nenhuma ação financeira autorizada ou executada |

O teste WooCommerce HTTPS é real, mas roda dentro de GitHub Actions e destrói contêineres e volumes no final. Não representa uma loja persistente.

O Blueprint Render Free em `render.yaml` intencionalmente define `DROPERAGENT_DISABLE_WORKER=1`, impedindo tarefas supostamente persistentes em sistema de arquivos efêmero. Nenhum serviço UGO foi alterado.

## Próximos bloqueios técnicos

1. Autorizar e disponibilizar hospedagem persistente WordPress + MariaDB/backup, acessível por HTTPS.
2. Configurar o backend independente com senha de administrador como segredo e chaves WooCommerce em ambiente privado.
3. Verificar E2E com IDs reais do host persistente; só então publicar `DROPERAGENT_API_URL` e `DROPERAGENT_LIVE_READONLY=true`.
4. Autorizar a conexão oficial de DSers à loja e ao AliExpress; os passos documentados por DSers incluem verificação do domínio, autorização REST e webhooks.
5. Conectar e verificar OpenClaw no Mac mediante seu mecanismo local suportado e scheduler autorizado.

Veja `docs/REAL-DEPLOYMENT-HANDOFF.md` para o procedimento de implantação e seus limites. Não confundir resultados CI com produção.
