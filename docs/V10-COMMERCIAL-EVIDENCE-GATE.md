# DROPERAGENT SUPREME V10 — Entrega 1: Gate Comercial (BR)

**Estado:** PR de integração; não disponível em produção até CI e revisão.

O objetivo é usar a saída do radar CJ como hipótese de pesquisa, não como prova de vendas. Um SKU só pode avançar para análise humana se o operador documentar origem e data das evidências, variante exata, estoque, frete para CEP BR, impostos, riscos e margem. Todos os itens exigem validação externa; URLs fornecidas não são verificadas automaticamente.

## Endpoint

`POST /api/automation/v10-commercial-preflight` — autenticado com Bearer de administrador da API DroperAgent. **Sem operações WooCommerce, CJ ou bancárias.** Rejeita payloads inválidos com 400 e não devolve segredos.

Exemplo de entrada (valores **fictícios para teste**, nunca cotação comercial):

```json
{
  "sku":"SKU_TEST_1","supplierVariantSku":"SKU_TEST_1","cjVariantId":"VID_123",
  "country":"BR","currency":"BRL","destinationCep":"88000000",
  "stockQuantity":3,"criticalRisk":false,"retailPriceBRL":"100.00",
  "costsBRL":{"supplier":"30.00","freight":"15.00","taxes":"10.00",
    "paymentFees":"3.00","fxFees":"2.00","returnsReserve":"5.00","marketing":"5.00"},
  "demandEvidence":{"url":"https://example.org/proof","verifiedAt":"2026-11-08"},
  "supplierEvidence":{"url":"https://example.org/proof","verifiedAt":"2026-11-08"},
  "variantMappingEvidence":{"url":"https://example.org/proof","verifiedAt":"2026-11-08"},
  "stockEvidence":{"url":"https://example.org/proof","verifiedAt":"2026-11-08"},
  "freightEvidence":{"url":"https://example.org/proof","verifiedAt":"2026-11-08"},
  "taxEvidence":{"url":"https://example.org/proof","verifiedAt":"2026-11-08"},
  "returnsPolicyEvidence":{"url":"https://example.org/proof","verifiedAt":"2026-11-08"},
  "mediaRightsEvidence":{"url":"https://example.org/proof","verifiedAt":"2026-11-08"},
  "regulatoryEvidence":{"url":"https://example.org/proof","verifiedAt":"2026-11-08"}
}
```

O exemplo acima é **mock** e jamais pode ser usado como liberação comercial. Os campos `verifiedAt` identificam a data informada pelo operador, **não** uma verificação independente do sistema. A janela inicial é de 14 dias e a meta de margem de contribuição usada nesta primeira implementação é de 25%. Falta torná-la configurável em etapa posterior.

Respostas possíveis: `EVIDENCE_INSUFFICIENT` (lista de bloqueios) ou `MANUAL_EVIDENCE_REVIEW`. **Nenhuma resposta autoriza publicação, checkout, compra, Pix, fulfillment ou movimentação financeira.**

## Critérios de integração

1. Testes de unidade `tests/v10-commercial-gate.test.js` e testes completos de CI passando.
2. Auditoria de segurança do endpoint e payload sem PII ou credenciais.
3. Validação externa de fonte e data por integrações autorizadas (não implementado).
4. Regras fiscais, homologação, política de devoluções e frete real BR validados antes de habilitar a venda.
5. Evidência bancária para conciliação PIX. QR code e comprovante não bastam.
6. Worker durável, idempotência, DLQ, logs e autorização humana antes de qualquer fulfillment real.

## Fonte de verdade / divergência detectada

A documentação legada `ESTADO-ACTIVO.md`, `REAL_STATUS.md` e `STATUS.md` descreve uma instalação local histórica sem WooCommerce. Ela **não corresponde ao WordPress real** já conectado em `https://droperagent.cu.ma/`. O backend GitHub/Render e os módulos PHP privados do WordPress são sistemas separados: uma autenticação CJ em WordPress não comprova configuração `CJ_ACCESS_TOKEN` no Render.

Dados observados na auditoria WordPress em 2026-11-10: WooCommerce ativo; 2 produtos variáveis publicados; 5 candidatos em rascunho; 0 pedidos; EPROLO 2.4.2 inativo; nenhuma zona de frete com método habilitado para BR. O checkout comercial continua protegido. Estes dados são snapshot, não monitoramento ao vivo.

**Próximo P0:** integrar obtenção de evidências CJ por variante e frete Brasil com escopos read-only e fonte independente de demanda. Depois reconciliar V10 com o worker persistente e painel de um clique, sem duplicar o radar WordPress existente.
