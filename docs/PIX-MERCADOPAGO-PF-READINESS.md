# ATUALIZAÇÃO 2026-11-08 — PRIORIDADE: dLocal Go (PF Argentina → clientes Brasil)

**Mercado Pago Brasil foi bloqueado no cadastro real do titular por exigir documento brasileiro. Não solicitar nova tentativa nem assumir aprovação via CPF/passaporte argentino. Esta alteração substitui a recomendação inicial de Mercado Pago.**

**dLocal Go é candidato, ainda sujeito a aprovação:** aceita cadastro "Emprendedor Individual / Persona Física" em Argentina, pagamento local a clientes do Brasil, plugin oficial WooCommerce, e informa não cobrar mensalidades. A documentação pública não garante que o perfil específico do comerciante, documento e banco sejam aprovados, nem que Pix esteja ativado antes de KYC.

- Cadastro: https://dashboard.dlocalgo.com/signup
- Plugin oficial: https://wordpress.org/plugins/dlocal-go-payments-for-woocommerce/
- PF/KYC e saque: https://helpcenter.dlocalgo.com/es/articles/7067139-que-documentos-necesito-para-crear-una-cuenta-en-dlocal-go
- Venda internacional: https://helpcenter.dlocalgo.com/pt-BR/articles/7846587-em-que-paises-posso-vender-com-dlocal-go
- Custos: https://helpcenter.dlocalgo.com/es/articles/6960181-que-costos-tengo-por-vender-con-dlocal-go

## Gate de habilitação
1. Usuário confirma que pode legalmente cadastrar sua atividade como pessoa física na Argentina e apresenta documentação verdadeira; exige banco em nome próprio e prova de endereço para **retirar** fundos.
2. dLocal Go aprova KYC e libera **Pix Brasil** para comércio online, com confirmação escrita das condições, taxas e prazo de liquidação.
3. Testar o plugin oficial com WooCommerce 11.x em staging ou ambiente de teste, checando Checkout Blocks e compatibilidade.
4. Checkout real fica DESATIVADO até haver método aprovado de saque e conciliação.
5. Pagamento a fornecedor AliExpress/DSers e retirada ao titular são operações separadas, com autorização e saldo liquidado. Nenhum split automático presumido.

## Alternativa secundária
InfinitePay permite abrir conta por CPF e oferece Checkout Integrado/API, porém exige validação a seu critério, não possui plugin WooCommerce oficial nem sandbox. API não oferece split/transferências a terceiros. https://www.infinitepay.io/checkout-documentacao

---

# DROPERAGENT — Pix Mercado Pago (PF/CPF) — plano de integração seguro
Data: 2026-11-08. Estado: **não habilitado**, sem contratação nem cobrança. Escopo isolado de PRs #18–#23.

## Pré-requisito de conta
O lojista tem CPF brasileiro e DNI/passaporte argentino, mas não possui documentação de residência brasileira nem CNPJ confirmados. Mercado Pago Brasil informa que conta PF pode usar CPF, documento com foto (inclusive passaporte) e selfie. **A aceitação específica do passaporte argentino está pendente de validação de KYC**; nunca inferir aprovação por leitura da documentação. Para Pix no plugin oficial, é necessário conta Mercado Pago Brasil ativa, chave Pix cadastrada, credenciais autorizadas e HTTPS.

Fontes oficiais:
- https://www.mercadopago.com.br/blog/documentos-abrir-conta-digital-mercado-pago
- https://www.mercadopago.com.br/blog/configurar-mercado-pago-woocommerce
- https://wordpress.org/plugins/woocommerce-mercadopago/
- https://www.mercadopago.com.br/developers/pt/docs/woocommerce/payments-configuration/checkout-api/pix

## Ambiente auditado
- WordPress https://droperagent.cu.ma/ e WooCommerce ativos; moeda BRL.
- Plugin droperagent-bridge 0.2.1 ativo; zero produtos e nenhum gateway Pix instalado na verificação MCP.
- API https://droperagent-api.onrender.com; painel GH Pages.
- O conector MCP atual oferece inventário/ativação de plugins já instalados, **não instalação** de gateways novos.
- As formas de pagamento bacs, cheque e cod estão desativadas; não habilitar workaround de transferência manual marcado como pago.

## Etapas de implantação (não executar sem conta aprovada)
1. Validar conta PF Mercado Pago Brasil, aceitação de passaporte argentino e direito de receber pagamentos de ecommerce; confirmar taxas, reserva, limites e titularidade do saque.
2. Instalar exclusivamente plugin oficial `woocommerce-mercadopago` via Plugins > Adicionar novo no wp-admin; registrar versão e compatibility com Checkout Blocks. Preferir ambiente de staging e backup prévio.
3. Autorizar conta por fluxo oficial; criar chave Pix dentro da conta. Nunca registrar token, access token, chave privada, client_secret ou PII no repositório/GH Pages/chat.
4. Habilitar Pix **em teste**. Verificar QR/copia e cola, vencimento, pendente → pago, idempotência, atraso, expiração, pagamento repetido, reembolso e falha de notificações. Confirmar também logs sanitizados e reconciliar com transação no painel do PSP.
5. Verificar e documentar frete, tributação, prazos, políticas de devolução e fornecedor antes de liberar produtos e pagamentos reais.

## Máquina de estados / segurança
`CREATED` → `AWAITING_PIX` → `PAID_CONFIRMED` → `SUPPLIER_REVIEW` → `SUPPLIER_AUTHORIZED` → `SUPPLIER_PAID` → `SHIPPED`.
Estados de exceção: `EXPIRED`, `PAYMENT_FAILED`, `REFUND_PENDING`, `REFUNDED`, `SUPPLIER_BLOCKED`, `MANUAL_REVIEW`.

**Regra principal:** redirect/success/QR mostrado não significa pago. Usar somente confirmação autenticada do PSP e conferência de valor, moeda, merchant account e external reference com pedido existente. Webhook seguro, reentrega idempotente, logs sem dados sensíveis e reconciliation job. Erros/timeout vão para revisão, nunca assumem sucesso.

## Repasse e sourcing
- Cobrança em Pix entra na conta do comerciante aprovado; **não** paga automaticamente AliExpress/DSers. O preço e checkout do fornecedor podem usar outros instrumentos e moedas.
- Calcular custo total com preço do item, variantes, frete, impostos, câmbio, tarifas, reservas e limites por pedido. Não assumir taxas fictícias.
- Não comprar do fornecedor automaticamente antes de validar pagamento confirmado, elegibilidade/estoque/variante/endereço, orçamento, fundos liquidáveis e autorização financeira explícita.
- Saque para o próprio titular somente conforme recursos da instituição e limites aplicáveis. Não projetar split com fornecedor chinês sem suporte bancário/contratual comprovado.
- Sem worker de compras 24/7 no Render Free enquanto faltar storage durável, DLQ, idempotência e aprovações, conforme README do projeto.

## Critérios de aceite
- [ ] Conta PF validada com documentos reais e Pix disponível.
- [ ] Plugin oficial instalado e compatibilidade WooCommerce comprovada.
- [ ] Webhook autenticado e testado; reconciliação E2E confirmada.
- [ ] Transação sandbox passando do checkout à atualização WooCommerce.
- [ ] Política de frete e impostos revisada; produto real testado.
- [ ] Sourcing separado, sem compra automática no piloto.
- [ ] Rollback testado, logs sem segredos, evidência anexada.

Sem estes critérios, registrar **PIX NOT READY** e **COMMERCE NOT READY**. Nenhuma cobrança real sem autorização do comerciante.
