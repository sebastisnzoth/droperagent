# DSers Basic + WooCommerce: automação permitida a USD 0

## Fonte de verdade (8 nov 2026)

- DSers possui integração **convencional WooCommerce** para importar produtos e sincronizar pedidos; confirmar no dashboard da conta, sem presumir sessão autenticada aqui: https://help.dsers.com/woocommerce-connection-guide-website-verification-authorization-webhook-setup/
- DSers **Basic Free** permite ferramentas de pedidos em lote, mapeamento de variantes, sincronização de status e números de rastreio; consulte os limites reais da conta: https://www.dsers.com/pricing
- DSers MCP oficial `https://ai.dsers.com/mcp` exige plano Advanced ou superior e, no requisito de conexão publicado, ao menos uma loja Shopify ou Wix. **Não configura nem amplia o plano básico.** https://www.dsers.com/mcp-server
- Não usar endpoints não documentados, cookies, browser scraping, checkout automatizado ou pagamento sem autorização.
- O mapeamento automático de DSers pode selecionar uma variante e fornecedor automaticamente, mas isso **não prova equivalência correta, estoque ou frete**. Revisar `My Products > Mapping Details` após importar/remapear: https://help.dsers.com/how-to-use-automated-mapping-in-dsers/

## Implementação DROPERAGENT

`POST /api/automation/mapping-preflight`: requer sessão administrativa; JSON com `storeVariants`, `supplierVariants`, `rules`, até 100 entradas cada. Chama `evaluateMapping` local e responde `readOnly:true`, `purchaseAuthorized:false`, `supplierAccountVerified:false` e `safeToSubmit:false` **mesmo quando tudo mapeia**.

Exemplo fictício, somente para teste (NÃO assumir equivalência entre tamanhos de diferentes países):

```json
{
  "storeVariants":[{"sku":"TEST-A","options":{"Color":"Black"}}],
  "supplierVariants":[{"sku":"TEST-CN-A","options":{"Color":"Black"},"available":true}],
  "rules":[]
}
```

Esse endpoint não puxa dados DSers, não consulta fornecedor e não executa pedidos. É um bloqueio preparatório para dados exportados ou obtidos de forma autorizada.

## Sequência operacional segura

1. Verificar em DSers a conexão de `https://droperagent.cu.ma` pelo fluxo oficial de website + REST authorization + webhooks; não recriar chaves nem webhooks se já conectados.
2. Importar 1 produto de teste na lista DSers, **sem publicar/ordenar automaticamente**.
3. Comparar SKU/variantes e verificar estoque/frete ao Brasil, capturando dados fonte.
4. Usar preflight para detectar problemas e resolver mapeamentos incorretos.
5. Somente após revisão, publicar um produto aprovado e habilitar processamento de pedidos de modo supervisionado.
6. Cobro Pix manual: **não marcar pago por comprovante**. Somente sincronizar pedidos confirmados após verificar ingresso de fundos.
7. Continuar com compras/pagamentos ao fornecedor desativados; nenhum mecanismo de repetição pode cobrar ou ordenar duas vezes.

## Critérios de validação

- Código + HTTP regressão passam CI (não comprova dados DSers reais).
- Fluxo WooCommerce→DSers exige observação da loja vinculada e 2 SKU reais mapeados, sem compra.
- Quando variáveis reais estiverem ausentes, o sistema deve reportar `NÃO VERIFICADO`, não `CONECTADO`.
