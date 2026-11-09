# DROPERAGENT V7 — Benchmarks de varejo Brasil e limite de custo ilustrativo

**Amostra:** 9 novembro 2026. **Objetivo:** medir a dificuldade comercial dos 5 candidatos WooCommerce, sem inventar custo do fornecedor e sem fixar preço público. **Moeda:** BRL. **Fonte:** anúncios públicos brasileiros de Mercado Livre vistos em buscas, não conta de fornecedor nem faturas.

## O que a pesquisa prova — e o que NÃO prova

Esta é uma **amostra de 10 anúncios comparáveis** para 5 ideias, não uma pesquisa de todos os preços do Brasil. Resultados podem variar por data, CEP, cupom, marketplace, qualidade e variante. Os anúncios públicos são ofertas de **varejistas**: não conferem preço de atacado, disponibilidade para dropshipping, direitos de imagem, stock do fornecedor, custo tributário, frete China→CEP Brasil ou margem de DROPERAGENT.

A tabela está ligada à matriz original de 20 candidatos e aos borradores WooCommerce privados #99–103. Dados canônicos em [../data/product-hunter/retail-benchmarks-br-2026-11-09.json](../data/product-hunter/retail-benchmarks-br-2026-11-09.json).

## Faixas observadas

| Candidato | Produto | Woo draft | Preços públicos de anúncios comparáveis | Faixa da amostra | Maior custo variável total hipotético com contribuição de 25% |
|---|---|---:|---|---:|---:|
| PH-001 | Escova para pelos pets | 99 | R$21,90; R$25,90 | R$21,90–25,90 | **R$16,42** |
| PH-002 | Escorredor de silicone tipo clipe | 100 | R$20,40; R$39,03 | R$20,40–39,03 | **R$15,30** |
| PH-003 | Organizadores de mala 7 peças | 101 | R$35,49; R$36,90 | R$35,49–36,90 | **R$26,61** |
| PH-004 | Kit de organizadores adesivos de cabos 6 unidades | 102 | R$25,34; R$29,65 | R$25,34–29,65 | **R$19,00** |
| PH-005 | Organizador de talheres de gaveta | 103 | R$24,90; R$29,98 | R$24,90–29,98 | **R$18,67** |

**ATENÇÃO:** os valores da última coluna são apenas **limites matemáticos de cenário**, calculados com base no **menor preço de varejo observado** e em uma **hipótese ilustrativa** de contribuição de 25%. O proprietário **não aprovou** essa margem como regra comercial. O limite inclui **todos os custos variáveis** que teriam de ser pagos (produto do fornecedor, frete, tributos, câmbio, taxas de pagamento, embalagem, devoluções e demais provisões) para deixar 25% do valor de venda de referência antes de custos fixos. Não é uma cotação, nem uma promessa de poder competir com o preço. Não há ganho líquido realizado.

```
limite_teórico_de_custo_variável =
  floor(menor_preço_de_varejo_da_amostra_em_centavos * (1 - margem_hipotética))
```

O motor exige que a margem hipotética seja informada explicitamente. Sem ela, retorna `null` para o limite de custo. O arredondamento é **para baixo**, por centavos, para não superestimar custo tolerável. Amostra fica marcada como **vencida após sete dias** e nunca é usada para autorizar publicação, compra ou alteração de preço.

## Referências públicas por candidato

**PH-001** — escova pets:
- [Mercado Livre: comparativos de escovas removedoras, incluindo escova autolimpante R$21,90](https://lista.mercadolivre.com.br/escova-removedora-pelos-pet)
- [Escova removedora de pelos massageadora R$25,90](https://produto.mercadolivre.com.br/MLB-5327397298-escova-removedora-de-pelos-massageadora-gatos-cachorros-pets-_JM)

**PH-002** — escorredor silicone tipo clipe:
- [Mercado Livre: modelo tipo clip R$20,40](https://lista.mercadolivre.com.br/escorredor-de-silicone)
- [Escorredor de cozinha com clipe para panela R$39,03](https://produto.mercadolivre.com.br/MLB-5116090123-escorredor-de-cozinha-com-clipe-para-panela-suporte-de-dren-_JM)

**PH-003** — organizadores 7 peças:
- [Mercado Livre: conjunto 7 peças R$35,49](https://lista.mercadolivre.com.br/kit-organizador-de-malas-para-viagem-7-pe%C3%A7as)
- [Organizador de malas 7 peças R$36,90](https://produto.mercadolivre.com.br/MLB-3966783995-organizador-de-malas-bolsas-de-viagem-kit-necessaire-7-pecas-_JM)

**PH-004** — clipes adesivos 6 unidades:
- [Mercado Livre: organizador adesivo de silicone de 6 unidades R$25,34 e alternativa R$29,65](https://lista.mercadolivre.com.br/enrolador-suporte-organizador-cabos-fios-silicone-adesivo)
- [Kit adesivo 6 unidades (ficha técnica, sem preço utilizado)](https://produto.mercadolivre.com.br/MLB-2002598659-organizador-de-cabos-adesivo-facil-aplicaco-6-unidades-_JM)

**PH-005** — organizador talheres:
- [Mercado Livre: conjunto com 4 divisórias R$24,90](https://lista.mercadolivre.com.br/organizador-talheres)
- [Mercado Livre: bandeja de gaveta com divisórias R$29,98](https://lista.mercadolivre.com.br/organizador-talheres-gaveta)

**Comparabilidade:** nenhuma das dez ofertas foi mapeada por SKU exato ao fornecedor EPROLO. PH-004 usa comparativos em silicone, enquanto o candidato original lista PVC. PH-005 varia divisórias e dimensões. PH-001 inclui opção de autolimpeza possivelmente distinta. PH-003 muda tecido e conteúdo entre anúncios. Não declarar as ofertas equivalentes nem usar a faixa como preço obrigatório.

## Verificador offline e testes

- `src/br-market-benchmark.js` valida domínio HTTPS do marketplace, data, preços em centavos, unicidade de candidatos/IDs Woo e política `commercially_ready=false`.
- `evaluateMarketBenchmarks(data)` retorna apenas faixas públicas **sem** margem / custo estimado quando não foi fornecido cenário.
- `evaluateMarketBenchmarks(data, {scenarioMarginPercent:'25.00'})` produz o cálculo matemático sem efeitos colaterais. Continua sempre `can_publish=false`, `auto_purchase_authorized=false`, `actual_profit_verified=false` e `supplier_quotes_verified=false`.
- Testes em `tests/br-market-benchmark.test.js` cobrem 10 amostras, cinco IDs de Woo, montantes, cenário hipotético, dados adulterados, URLs falsas, data inválida, duplicação e amostra vencida. Core GitHub Actions inclui verificação de sintaxe; `node --test tests/*.test.js` inclui os testes.

## Gate comercial

1. EPROLO WordPress 2.4.2 tem CVE-2026-74019 e **foi desativado**; não reativar sem versão reparada comprovada. PR #45 de alerta está bloqueado por Actions sem jobs; não publicar por atalho.
2. Obter acesso de consulta autenticado a fornecedor seguro e confirmar variante, estoque, custo e envio a CEP Brasil por cada SKU.
3. Identificar despesas totais reais e conferir margem; não confiar em simulações de varejo para alimentar WooCommerce.
4. Registrar fotos autorizadas, especificações, regras fiscais/compliance, suporte, trocas.
5. Somente com evidência e autorização, publicar produto, ajustar preços, configurar frete e preparar checkout. Guard #41/#42 permanece ativo enquanto vendas não forem permitidas.

**Nenhum produto foi colocado à venda, nenhum preço/estoque Woo foi alterado e não houve movimentação de fundos com este módulo.**
