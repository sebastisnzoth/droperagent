<?php
/**
 * DROPERAGENT Autonomous Profit Monitor v1.
 *
 * Zero-cost, read-only WooCommerce catalog / quotation health monitor.
 * WP-Cron persists bounded aggregate snapshots but NEVER calls suppliers,
 * changes products, creates orders, posts charges or claims profit realized.
 */
defined('ABSPATH') || exit;
if (!class_exists('DroperAgent_Profit_Monitor', false)) {
final class DroperAgent_Profit_Monitor {
    const EVENT = 'droper_profit_monitor_daily_v1';
    const OPTION = 'droper_profit_monitor_report_v1';
    const MAX_PRODUCTS = 30;
    const MAX_SKUS = 240;

    static function money_cents($value) {
        if (!is_string($value) || !preg_match('/^([0-9]{1,8})(?:\.([0-9]{1,2}))?$/D', $value, $m)) return false;
        return (int) $m[1] * 100 + (isset($m[2]) ? (int) str_pad($m[2], 2, '0') : 0);
    }
    static function quote_assessment($id, $sku, $woo_price) {
        $record = get_option('droper_quote_brl_v1_' . (int) $id, false);
        if (!is_array($record)) return array('kind' => 'missing');
        if ((int) ($record['schema'] ?? 0) !== 1 ||
            !is_string($sku) || $sku === '' ||
            !hash_equals((string) ($record['sku_hash'] ?? ''), hash('sha256', $sku))) {
            return array('kind' => 'rejected');
        }
        $price = self::money_cents((string) $woo_price);
        $parts = array('supplier', 'shipping', 'import_tax', 'payment_fee', 'other');
        $total = 0;
        foreach ($parts as $part) {
            if (!isset($record[$part]) || !is_int($record[$part]) ||
                $record[$part] < 0 || $record[$part] > 9999999999) {
                return array('kind' => 'rejected');
            }
            $total += $record[$part];
        }
        if ($price === false || $price <= 0) return array('kind' => 'rejected');
        if ((int) ($record['price_at_capture'] ?? -1) !== $price) {
            return array('kind' => 'price_changed');
        }
        $dated = (int) ($record['timestamp'] ?? 0);
        if ($dated <= 0 || $dated > time() || $dated < time() - 14 * DAY_IN_SECONDS) {
            return array('kind' => 'stale');
        }
        return array('kind' => 'current_manual', 'margin_cents' => $price - $total);
    }
    static function snapshot() {
        $r = array(
            'schema' => 1, 'generated_at_utc' => gmdate('c'),
            'catalog_available' => false, 'product_count' => 0, 'sku_count' => 0,
            'truncated' => false, 'missing_sku' => 0, 'duplicate_sku' => 0,
            'low_woo_stock' => 0, 'stock_not_managed' => 0,
            'missing_weight_or_dimensions' => 0,
            'quote_missing' => 0, 'quote_rejected' => 0,
            'quote_stale' => 0, 'quote_price_changed' => 0,
            'quote_current_manual' => 0, 'quote_negative_margin' => 0,
            'quote_zero_margin' => 0,
            'shipping_enabled_methods' => 0, 'tax_calculation_enabled' => null,
            'expected_currency' => 'BRL', 'currency' => '',
            'provider_stock_verified' => false, 'shipping_costs_verified' => false,
            'bank_settlement_verified' => false, 'realized_profit_verified' => false,
            'commerce_authorized' => false, 'read_only' => true,
        );
        if (!function_exists('wc_get_products') || !function_exists('wc_get_product')) return $r;
        $r['catalog_available'] = true;
        $r['currency'] = function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : '';
        $r['tax_calculation_enabled'] = function_exists('wc_tax_enabled') ? (bool) wc_tax_enabled() : null;
        $products = wc_get_products(array(
            'type' => array('simple', 'variable'), 'status' => 'publish', 'limit' => self::MAX_PRODUCTS + 1,
            'orderby' => 'ID', 'order' => 'ASC',
        ));
        if (count($products) > self::MAX_PRODUCTS) {
            $r['truncated'] = true;
            $products = array_slice($products, 0, self::MAX_PRODUCTS);
        }
        $seen = array();
        foreach ($products as $parent) {
            $r['product_count']++;
            $ids = $parent->is_type('variable') ? (array) $parent->get_children() : array($parent->get_id());
            foreach ($ids as $id) {
                if ($r['sku_count'] >= self::MAX_SKUS) { $r['truncated'] = true; break 2; }
                $v = wc_get_product($id);
                if (!$v || !in_array($v->get_status(), array('publish'), true)) continue;
                $r['sku_count']++;
                $sku = (string) $v->get_sku('edit');
                if ($sku === '') $r['missing_sku']++;
                else {
                    if (isset($seen[$sku])) $r['duplicate_sku']++;
                    $seen[$sku] = true;
                }
                $manage = $v->get_manage_stock('edit');
                $qty = $v->get_stock_quantity('edit');
                if (!$manage || $qty === null) $r['stock_not_managed']++;
                elseif ((int) $qty <= 1) $r['low_woo_stock']++;
                if ((string) $v->get_weight() === '' || (string) $v->get_length() === '' ||
                    (string) $v->get_width() === '' || (string) $v->get_height() === '') {
                    $r['missing_weight_or_dimensions']++;
                }
                $q = self::quote_assessment((int) $id, $sku, (string) $v->get_price('edit'));
                switch ($q['kind']) {
                    case 'missing': $r['quote_missing']++; break;
                    case 'rejected': $r['quote_rejected']++; break;
                    case 'price_changed': $r['quote_price_changed']++; break;
                    case 'stale': $r['quote_stale']++; break;
                    case 'current_manual':
                        $r['quote_current_manual']++;
                        if ($q['margin_cents'] < 0) $r['quote_negative_margin']++;
                        if ($q['margin_cents'] === 0) $r['quote_zero_margin']++;
                        break;
                }
            }
        }
        if (class_exists('WC_Shipping_Zones')) {
            foreach ((array) WC_Shipping_Zones::get_zones() as $zone) {
                foreach ((array) ($zone['shipping_methods'] ?? array()) as $method) {
                    if (is_object($method) && method_exists($method, 'is_enabled') && $method->is_enabled()) {
                        $r['shipping_enabled_methods']++;
                    }
                }
            }
            $fallback = new WC_Shipping_Zone(0);
            $r['shipping_enabled_methods'] += count($fallback->get_shipping_methods(true));
        }
        // No bank/provider/fulfillment connector is authorized to verify financial truth.
        // A manually entered quotation is NOT an independent verified cost.
        return $r;
    }
    static function run() {
        $report = self::snapshot();
        update_option(self::OPTION, $report, false); // no autoload, no secrets or customer data
        return $report;
    }
    static function ensure_schedule() {
        if (!wp_next_scheduled(self::EVENT)) {
            wp_schedule_event(time() + 300, 'daily', self::EVENT);
        }
    }
    static function manual_run() {
        if (!current_user_can('manage_options')) wp_die('Sem permissão.', '', 403);
        check_admin_referer('droper_profit_monitor_run');
        self::run();
        wp_safe_redirect(add_query_arg('page', 'droperagent-profit-monitor', admin_url('admin.php')), 303);
        exit;
    }
    static function add_menu() {
        if (!class_exists('WooCommerce')) return;
        add_submenu_page('woocommerce', 'DROPERAGENT | Profit Monitor', 'DROPERAGENT Profit',
            'manage_options', 'droperagent-profit-monitor', array(__CLASS__, 'page'));
    }
    static function page() {
        if (!current_user_can('manage_options')) wp_die('Sem permissão.', '', 403);
        $r = get_option(self::OPTION, false);
        ?>
        <div class="wrap">
            <h1>DROPERAGENT — Autonomous Profit Monitor</h1>
            <p>Monitor autônomo de risco comercial, <strong>somente leitura</strong>.
              Nenhuma venda ou lucro é certificado por este relatório; estoque e cotações são valores internos do WooCommerce.</p>
            <form action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post">
                <input type="hidden" name="action" value="droper_profit_monitor_run">
                <?php wp_nonce_field('droper_profit_monitor_run'); ?>
                <button type="submit" class="button button-primary">Atualizar diagnóstico agora (sem alterações comerciais)</button>
            </form>
            <?php if (!is_array($r) || (int) ($r['schema'] ?? 0) !== 1) : ?>
                <p><strong>Primeiro diagnóstico pendente.</strong> Use o botão acima ou aguarde o primeiro ciclo programado.</p>
            <?php else : ?>
                <p><strong>Última leitura UTC:</strong> <?php echo esc_html($r['generated_at_utc']); ?>.
                <strong>Fonte:</strong> WooCommerce e cotações locais declaradas.</p>
                <table class="widefat striped" style="max-width:850px">
                <tbody>
                  <?php
                  $labels = array(
                    'product_count' => 'Produtos verificados no cadastro',
                    'sku_count' => 'Variantes/SKUs observados',
                    'missing_sku' => 'SKU ausentes',
                    'duplicate_sku' => 'SKU duplicados',
                    'low_woo_stock' => 'Estoque WooCommerce <= 1',
                    'stock_not_managed' => 'Produtos sem gerenciamento de estoque',
                    'missing_weight_or_dimensions' => 'Sem peso ou dimensões completas',
                    'quote_missing' => 'Sem cotação BRL cadastrada',
                    'quote_rejected' => 'Cotações inválidas/SKU alterado',
                    'quote_stale' => 'Cotações com mais de 14 dias',
                    'quote_price_changed' => 'Preço Woo alterado desde cotação',
                    'quote_current_manual' => 'Cotações recentes declaradas (não verificadas)',
                    'quote_negative_margin' => 'Cotações com margem estimada negativa',
                    'quote_zero_margin' => 'Cotações com margem estimada zero',
                    'shipping_enabled_methods' => 'Métodos Woo de entrega habilitados (não auditados)'
                  );
                  foreach ($labels as $key => $label) : ?>
                    <tr><th><?php echo esc_html($label); ?></th>
                        <td><?php echo esc_html((string) ($r[$key] ?? '?')); ?></td></tr>
                  <?php endforeach; ?>
                </tbody></table>
                <?php if (!empty($r['truncated'])) : ?>
                    <p><strong>Resultado parcial:</strong> varredura limitada a 30 produtos e 240 SKUs.</p>
                <?php endif; ?>
                <?php if (empty($r['catalog_available']) || ($r['currency'] ?? '') !== 'BRL') : ?>
                    <p><strong>Bloqueio:</strong> WooCommerce indisponível ou moeda diferente de BRL.</p>
                <?php endif; ?>
            <?php endif; ?>
            <p><strong>Estado: COMMERCE NÃO AUTORIZADO.</strong> Estoque do fornecedor, frete para CEP,
                conformidade fiscal, PIX bancário e lucro líquido realizado não foram verificados.
                Este monitor não altera produtos, preços, pedidos, pagamentos, taxas de entrega ou impostos.</p>
            <p>Próxima execução agendada (UTC):
               <?php $next = wp_next_scheduled(self::EVENT); echo esc_html($next ? gmdate('c', $next) : 'não agendada'); ?>.
               WP-Cron depende de visitas ao site e não garante pontualidade em hosting gratuito.</p>
            <p><a href="<?php echo esc_url(admin_url('admin.php?page=droperagent-api-connections')); ?>">
                Abrir auditoria de SKU e cotações BRL</a></p>
        </div>
        <?php
    }
    static function boot() {
        add_action('init', array(__CLASS__, 'ensure_schedule'), 20);
        add_action(self::EVENT, array(__CLASS__, 'run'));
        add_action('admin_menu', array(__CLASS__, 'add_menu'));
        add_action('admin_post_droper_profit_monitor_run', array(__CLASS__, 'manual_run'));
    }
}
DroperAgent_Profit_Monitor::boot();
}
