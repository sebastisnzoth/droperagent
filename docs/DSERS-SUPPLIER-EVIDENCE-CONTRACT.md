# Contrato de evidência de fornecedor e margem — DROPERAGENT V4

**Estado:** implementação em PR de revisão. Não comprova conexão DSers, remessa a Brasil, custo verdadeiro, estoque nem autorização financeira.

## Objetivo

Consumir evidências comerciais não secretas, obtidas por canais autorizados (exportação oficial DSers, cotação documentada do fornecedor ou revisão manual), e realizar um **preflight determinístico de SKU/custo/margem**. O endpoint não consulta DSers nem modifica WooCommerce. Ele reutiliza o guard existente em src/supplier-mapping-guard.js, do PR #20 fusionado.

**Endpoint:** POST /api/automation/supplier-evidence-preflight

- Autenticação: Bearer da sessão administrativa existente; não oferecer acesso público.
- Content-Type: application/json.
- Limite do parser do servidor: 32 KB; no máximo 100 variantes de loja, 100 variantes de fornecedor, 100 regras e 100 cotações.
- Fonte de dados: caller_supplied_unverified. Se retornar READY_FOR_MANUAL_REVIEW **não** significa fornecedor autenticado, preço confirmado, compra autorizada ou estoque live.
- Sem side effects: não escreve em banco, preço, pedido, inventário, DSers, gateway ou proveedor.

## Dados necessários

A entrada tem os campos:
1. **storeVariants**: lista de SKU WooCommerce, options, priceBRL em string decimal, currency: BRL.
2. **supplierVariants**: SKU de fornecedor, options equivalentes, available: true apenas se houver observação humana documentada; o booleano, por si só, não autentica o fornecedor.
3. **rules**: regras opcionais do Mapping Guard (storeSku, storeOptions, supplierOptions, approved) para equivalência revisada. Nunca inferir cores/tamanhos diferentes.
4. **quotes**: uma cotação por storeSku com supplierSku correspondente ao mapping, destinationCountry: BR, currency: BRL, sourceType, sourceReference, checkedAt em UTC ISO 8601, mappingReviewed: true, stockReviewed: true, e **sete** custos obrigatórios por unidade.
5. **policy.minimumMarginPercent**: umbral de margen explícito em string decimal, 0.00 a 100.00. No existe um umbral por defecto; el operador debe definirlo.

Costos requeridos, todos como string decimal BRL con punto y dos decimales como máximo: **productBRL, shippingBRL, taxesBRL, paymentFeesBRL, advertisingBRL, returnsReserveBRL, otherFeesBRL**.

- Cualquier costo faltante = BLOCKED, no asumir cero.
- Si un costo es exactamente 0.00, se exige zeroCostRationale para ese campo (texto mínimo de 8 caracteres). Sigue sujeto a revisión humana y legal.
- Cotización con fecha superior a 72 horas = BLOCKED; fecha futura más de cinco minutos = BLOCKED.
- Moneda distinta de BRL o destino distinto de BR = BLOCKED. El sistema no inventa cotizaciones cambiarias ni tasas fiscales.
- IDs, SKU duplicados, stock no observado, proveedor errado o regla de equivalencia no aprobada = BLOCKED.

## Solicitud de ejemplo FICTICIA (no representa la tienda ni los costos reales)

Sustituir checkedAt por fecha/hora UTC actual antes de llamar:

```json
{
  "storeVariants": [
    {"sku":"DEMO-BR-001","options":{"Color":"Black"},"priceBRL":"100.00","currency":"BRL"}
  ],
  "supplierVariants": [
    {"sku":"DEMO-CN-001","options":{"color":"black"},"available":true}
  ],
  "rules": [],
  "quotes": [
    {
      "storeSku":"DEMO-BR-001",
      "supplierSku":"DEMO-CN-001",
      "destinationCountry":"BR",
      "currency":"BRL",
      "sourceType":"supplier_quote",
      "sourceReference":"demo-source-001",
      "checkedAt":"2026-11-08T21:00:00Z",
      "mappingReviewed":true,
      "stockReviewed":true,
      "productBRL":"35.00",
      "shippingBRL":"15.00",
      "taxesBRL":"12.00",
      "paymentFeesBRL":"5.00",
      "advertisingBRL":"3.00",
      "returnsReserveBRL":"4.00",
      "otherFeesBRL":"1.00"
    }
  ],
  "policy":{"minimumMarginPercent":"20.00"}
}
```

Resultado de **ejemplo**: precio R$100,00, costos R$75,00, beneficio estimado R$25,00, margen estimado 25,00%, status READY_FOR_MANUAL_REVIEW. La respuesta siempre contiene:
- readOnly: true, supplierAccountVerified: false, priceVerifiedAgainstWooCommerce: false
- purchaseAuthorized: false, paymentAuthorized: false, safeToSubmit: false
- summary y results con bloqueos sin revelar sourceReference.

Si el cuerpo tiene forma inválida: HTTP 400, error invalid_supplier_evidence_input. Si el cuerpo es válido pero evidencia insuficiente: HTTP 200, status BLOCKED y reasons por SKU.

## Procedimiento operativo DSers Basic sin MCP pago

1. Verificar en sesión oficial DSers **la conexión exacta de la tienda** y los mapeos reales de las 12 variantes. No reautorizar ni rotar webhook a ciegas.
2. Obtener exportación o cotizaciones autorizadas que identifiquen SKU, contenido de caja, proveedor, costo, envío a Brasil, disponibilidad y fecha. El usuario o proceso autorizado debe revisar equivalencia.
3. Calcular/imputar cada costo en BRL con fuente documentada y referencias no secretas. Validar política y fiscalidad con especialistas cuando corresponda.
4. Ejecutar preflight desde la API propia con sesión administrativa, sin añadir información de cliente ni credenciales.
5. Si hay BLOCKED, corregir evidencia en origen. Si hay READY_FOR_MANUAL_REVIEW, **seguir sin compras ni pagos**: falta la revisión final y la autorización de operar.
6. Mantener DSers oficial como canal de proveedor; no utilizar scraping de sesión ni endpoints privados.

## Pruebas incorporadas

- tests/supplier-evidence-audit.test.js: validación determinista de SKUs, mapping, moneda/destino, vencimiento, costos obligatorios, cero documentado, margen, duplicados y confirmación de que nunca habilita compra/pago.
- tests/supplier-evidence-preflight-http.test.mjs: login Bearer, CORS, respuesta positiva solo para revisión, rechazo de datos incompletos, sin filtración de reference ni habilitación financiera.
- .github/workflows/core-tests.yml: los ejecuta en PR y rechaza regresiones.

Ejecutar: node --test tests/supplier-evidence-audit.test.js
Luego, con dependencias del repositorio instaladas: node --test tests/supplier-evidence-preflight-http.test.mjs

## Límites y próximos pasos

- Ningún endpoint de este PR obtiene realmente datos DSers. Se requiere conexión oficial o exportaciones autorizadas.
- Estos datos no se almacenan ni historizan; antes de usarlo comercialmente hay que construir persistencia confiable, trazabilidad de versiones, inmutabilidad de eventos, seguridad de roles e idempotencia.
- Verificación legal BR (importación/reventa, fiscalidad, protección del consumidor y ANATEL cuando corresponda) y validación de frete/checkout **siguen bloqueando ventas**.
- Este módulo tampoco debe aceptar autorización de compras de ningún agente.
- Revisar docs/DROPERAGENT-SUPREME-MASTER.md antes de cada continuación (“seguir”).

Referencias: https://github.com/dsers/dsers-agent-skills ; https://github.com/dsers/dsers-mcp-server ; https://help.dsers.com/ ; https://developer.woocommerce.com/docs/apis/rest-api/
