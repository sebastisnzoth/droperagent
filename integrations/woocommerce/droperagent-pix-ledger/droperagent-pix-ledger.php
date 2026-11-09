<?php
/**
 * Plugin Name: DroperAgent PIX — Controle de Margem (Sem Repasse)
 * Description: Calcula custos e margem de pedidos WooCommerce; não recebe, verifica nem transfere dinheiro.
 * Version: 0.1.0
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 * Text Domain: droperagent-pix-ledger
 */
if (!defined('ABSPATH')) { exit; }
require_once __DIR__ . '/includes/calculator.php';

add_action('before_woocommerce_init', function () {
    if (class_exists('\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});
add_action('admin_menu', function () {
    if (class_exists('WooCommerce')) {
        add_submenu_page('woocommerce', 'DroperAgent PIX', 'DroperAgent PIX', 'manage_woocommerce',
            'droperagent-pix-ledger', 'droperagent_pix_render');
    }
});
function droperagent_pix_labels() {
    return [
        'supplier' => 'Custo total do fornecedor (BRL)',
        'freight' => 'Frete de compra / fornecedor (BRL)',
        'fees' => 'Taxas de pagamento / câmbio (BRL)',
        'taxes' => 'Tributos e importação (BRL)',
        'other' => 'Outros custos e reserva de devoluções (BRL)',
    ];
}
function droperagent_pix_money($cents) {
    return ($cents < 0 ? '-' : '') . 'R$ ' . number_format(abs($cents) / 100, 2, ',', '.');
}
function droperagent_pix_render() {
    if (!current_user_can('manage_woocommerce')) { wp_die('Sem permissão.', '', ['response' => 403]); }
    $order_id = isset($_GET['order_id']) ? absint(wp_unslash($_GET['order_id'])) : 0;
    $order = $order_id && function_exists('wc_get_order') ? wc_get_order($order_id) : false;
    echo '<div class="wrap"><h1>DroperAgent PIX — cálculo de comissão</h1>';
    echo '<p><strong>Não executa repasses, split, cobrança, aprovação de pagamento ou pedidos DSers.</strong></p>';
    echo '<form method="get" action="' . esc_url(admin_url('admin.php')) . '">';
    echo '<input type="hidden" name="page" value="droperagent-pix-ledger">';
    echo '<label for="da_order">Pedido WooCommerce #</label> ';
    echo '<input id="da_order" type="number" min="1" name="order_id" required value="' . esc_attr($order_id ?: '') . '"> ';
    echo '<button class="button">Consultar</button></form>';
    if (!$order_id) { echo '</div>'; return; }
    if (!$order) { echo '<p>Pedido não encontrado.</p></div>'; return; }
    $ledger = $order->get_meta('_droperagent_pix_ledger_v1', true);
    $ledger = is_array($ledger) ? $ledger : [];
    $costs = isset($ledger['costs']) && is_array($ledger['costs']) ? $ledger['costs'] : [];
    $gross = (string) $order->get_total('edit');
    $result = DroperAgent_Pix_Calculator::calculate($gross, $costs);
    echo '<h2>Pedido #' . esc_html((string) $order_id) . '</h2>';
    echo '<p>Total WooCommerce: <strong>' . esc_html($gross) . ' BRL</strong> · Gateway: ' . esc_html($order->get_payment_method()) . '</p>';
    echo '<p>WooCommerce possui data de pagamento: <strong>' . ($order->get_date_paid() ? 'sim' : 'não') . '</strong>. Não é prova de liquidação bancária.</p>';
    if (isset($_GET['saved']) && $_GET['saved'] === '1') echo '<div class="notice notice-success"><p>Valores registrados sem transferência.</p></div>';
    echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
    echo '<input type="hidden" name="action" value="droperagent_pix_save">';
    echo '<input type="hidden" name="order_id" value="' . esc_attr((string) $order_id) . '">';
    wp_nonce_field('droperagent_pix_save_' . $order_id);
    echo '<table class="form-table"><tbody>';
    foreach (droperagent_pix_labels() as $key => $label) {
        $value = isset($costs[$key]) ? $costs[$key] : '';
        echo '<tr><th><label for="cost_' . esc_attr($key) . '">' . esc_html($label) . '</label></th>';
        echo '<td><input type="text" id="cost_' . esc_attr($key) . '" name="costs[' . esc_attr($key) . ']" required inputmode="decimal" value="' . esc_attr((string) $value) . '">';
        echo '<p class="description">Informe 0 só se o custo real for zero. Não estime valores desconhecidos.</p></td></tr>';
    }
    $channel = isset($ledger['channel']) ? $ledger['channel'] : 'aliexpress';
    echo '<tr><th>Tipo de fornecedor</th><td><select name="channel">';
    foreach (['aliexpress'=>'AliExpress / China — pagamento externo', 'br_pix'=>'Brasil — fornecedor recebe PIX', 'other'=>'Outro / não verificado'] as $key=>$label) {
        echo '<option value="' . esc_attr($key) . '" ' . selected($channel, $key, false) . '>' . esc_html($label) . '</option>';
    }
    echo '</select></td></tr>';
    echo '<tr><th><label for="bank_reference">Referência de extrato (opcional)</label></th><td>';
    echo '<input id="bank_reference" type="text" maxlength="80" name="bank_reference" value="' . esc_attr(isset($ledger['bank_reference']) ? (string) $ledger['bank_reference'] : '') . '">';
    echo '<p class="description">Referência informada pelo operador; não confirmada por banco. Não digite CPF, chave PIX ou número de conta.</p></td></tr>';
    echo '</tbody></table>';
    submit_button('Salvar cálculo — sem pagar ninguém');
    echo '</form>';
    if (!empty($result['ok'])) {
        echo '<hr><h2>Resumo de margem estimada</h2>';
        echo '<p>Venda: ' . esc_html(droperagent_pix_money($result['gross_cents'])) . '</p>';
        echo '<p>Custos declarados: ' . esc_html(droperagent_pix_money($result['cost_cents'])) . '</p>';
        echo '<p><strong>Margem: ' . esc_html(droperagent_pix_money($result['margin_cents'])) . '</strong></p>';
        if ($result['margin_cents'] <= 0) echo '<p><strong>Alerta: margem não positiva.</strong></p>';
        echo '<p><strong>Repasse automático DESABILITADO.</strong> Conferência bancária e pagamento do fornecedor continuam externos.</p>';
    } else {
        echo '<p>Preencha todos os custos reais para obter margem. Repasse automático indisponível.</p>';
    }
    echo '</div>';
}
add_action('admin_post_droperagent_pix_save', function () {
    if (!current_user_can('manage_woocommerce')) { wp_die('Sem permissão.', '', ['response' => 403]); }
    $order_id = isset($_POST['order_id']) ? absint(wp_unslash($_POST['order_id'])) : 0;
    check_admin_referer('droperagent_pix_save_' . $order_id);
    $order = $order_id && function_exists('wc_get_order') ? wc_get_order($order_id) : false;
    if (!$order) { wp_die('Pedido inválido.', '', ['response' => 400]); }
    $raw = isset($_POST['costs']) && is_array($_POST['costs']) ? wp_unslash($_POST['costs']) : [];
    $costs = [];
    foreach (DroperAgent_Pix_Calculator::COSTS as $key) {
        if (!isset($raw[$key]) || !is_scalar($raw[$key])) wp_die('Custo ausente.', '', ['response' => 400]);
        $costs[$key] = sanitize_text_field((string) $raw[$key]);
    }
    $check = DroperAgent_Pix_Calculator::calculate((string) $order->get_total('edit'), $costs);
    if (empty($check['ok'])) wp_die('Custos inválidos: ' . esc_html($check['error']), '', ['response' => 400]);
    $allowed = ['aliexpress', 'br_pix', 'other'];
    $channel = isset($_POST['channel']) && is_scalar($_POST['channel']) ? sanitize_key(wp_unslash((string) $_POST['channel'])) : 'other';
    if (!in_array($channel, $allowed, true)) $channel = 'other';
    $reference = isset($_POST['bank_reference']) && is_scalar($_POST['bank_reference']) ? trim(wp_unslash((string) $_POST['bank_reference'])) : '';
    if (strlen($reference) > 80 || !preg_match('/^[a-zA-Z0-9.:_-]*$/D', $reference)) wp_die('Referência inválida.', '', ['response' => 400]);
    $order->update_meta_data('_droperagent_pix_ledger_v1', [
        'costs'=>$costs, 'channel'=>$channel, 'bank_reference'=>$reference,
        'operator_id'=>get_current_user_id(), 'registered_at_utc'=>gmdate('Y-m-d\TH:i:s\Z'),
    ]);
    $order->save(); // WC CRUD, HPOS compatible. No payment status or checkout changes.
    wp_safe_redirect(admin_url('admin.php?page=droperagent-pix-ledger&order_id=' . $order_id . '&saved=1'));
    exit;
});
