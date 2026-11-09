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
    /**
     * CVE-2026-74019: Patchstack identified broken access control in
     * EPROLO-Dropshipping <= 2.4.2. Treat any newer version as UNREVIEWED
     * until the vendor or advisory explicitly confirms a fix.
     * This is a warning only. No plugin activation, deactivation or HTTP calls.
     */
    static function eprolo_security_state($installed, $active, $version) {
        if (!$installed) return 'not_installed';
        if (!$active) return 'inactive_mitigated';
        if (!is_string($version) || !preg_match('/^\d+\.\d+(?:\.\d+)?$/D', $version))
            return 'active_unknown_version';
        if (version_compare($version, '2.4.2', '<=')) return 'active_affected_version';
        return 'active_new_version_unreviewed';
    }
    static function eprolo_security_snapshot() {
        $relative = 'eprolo-dropshipping/eprolo.php';
        $file = defined('WP_PLUGIN_DIR') ? WP_PLUGIN_DIR . '/' . $relative : '';
        $installed = ($file !== '' && is_file($file));
        $active = in_array($relative, (array) get_option('active_plugins', array()), true);
        if (is_multisite()) {
            $network = get_site_option('active_sitewide_plugins', array());
            if (is_array($network) && isset($network[$relative])) $active = true;
        }
        $version = '';
        if ($installed && function_exists('get_file_data')) {
            $header = get_file_data($file, array('Version' => 'Version'), 'plugin');
            $version = is_array($header) && is_string($header['Version'] ?? null)
                ? trim($header['Version']) : '';
        }
        $state = self::eprolo_security_state($installed, $active, $version);
        return array(
            'plugin' => 'eprolo-dropshipping', 'version' => $version,
            'active' => (bool) $active,
            'risk_state' => $state,
            'attention' => in_array($state, array('active_affected_version',
                'active_unknown_version', 'active_new_version_unreviewed'), true),
            'advisory_id' => 'CVE-2026-74019',
            'advisory_url' => 'https://patchstack.com/database/wordpress/plugin/eprolo-dropshipping/vulnerability/wordpress-eprolo-dropshipping-plugin-2-4-2-broken-access-control-vulnerability',
            'supplier_connection_verified' => false,
            'safe_to_sync_orders' => false,
        );
    }

    /**
     * Private WooCommerce product candidates: these five IDs/slugs were verified
     * in DROPERAGENT production. ID and slug must agree to avoid mistaking a
     * different product for an approved prospect after restore/import.
     * Missing supplier evidence CANNOT be approved by any local Woo flag.
     */
    const CANDIDATE_DRAFTS = array(
        99 => 'escova-manual-pelos-caes-gatos-candidato',
        100 => 'escorredor-silicone-clipe-panelas-candidato',
        101 => 'organizadores-mala-viagem-sete-pecas-candidato',
        102 => 'organizador-adesivo-cabos-mesa-parede-kit-seis-candidato',
        103 => 'organizador-talheres-gaveta-polipropileno-candidato'
    );
    static function candidate_snapshot($expected = null, $resolver = null) {
        $expected = $expected === null ? self::CANDIDATE_DRAFTS : $expected;
        if (!is_array($expected) || count($expected) > 30) return array(
            'checked' => false, 'expected_count' => 0, 'safe_private_count' => 0,
            'attention_count' => 0, 'rows' => array(),
            'source_verified' => false, 'commercial_ready' => false
        );
        if ($resolver === null) {
            $resolver = function($id) { return function_exists('wc_get_product') ? wc_get_product($id) : null; };
        }
        $rows = array(); $safe = 0; $attention = 0;
        foreach ($expected as $id => $expected_slug) {
            $id = (int) $id;
            $product = is_callable($resolver) ? call_user_func($resolver, $id) : null;
            $issues = array();
            if (!is_object($product) || !method_exists($product, 'get_status') ||
                !method_exists($product, 'get_slug') || !method_exists($product, 'get_price') ||
                !method_exists($product, 'get_catalog_visibility') ||
                !method_exists($product, 'get_stock_status') ||
                !method_exists($product, 'is_purchasable')) {
                $issues[] = 'PRODUCT_MISSING';
            } else {
                if (!is_string($expected_slug) || (string) $product->get_slug('edit') !== $expected_slug) {
                    $issues[] = 'PRODUCT_IDENTITY_CHANGED';
                }
                if ($product->get_status('edit') !== 'draft') $issues[] = 'PRODUCT_NOT_DRAFT';
                if ($product->get_catalog_visibility('edit') !== 'hidden') $issues[] = 'PRODUCT_VISIBLE';
                if ((string) $product->get_price('edit') !== '') $issues[] = 'PRICE_SET_WITHOUT_SUPPLIER_EVIDENCE';
                if ($product->get_stock_status('edit') !== 'outofstock') $issues[] = 'STOCK_MARKED_AVAILABLE';
                if ($product->is_purchasable()) $issues[] = 'PURCHASABLE_BEFORE_REVIEW';
            }
            if ($issues) $attention++; else $safe++;
            $rows[] = array(
                'woo_id' => $id,
                'safe_private_draft' => !$issues,
                'issues' => $issues,
                'provider_variant_verified' => false,
                'supplier_stock_verified' => false,
                'landed_cost_verified' => false,
                'shipping_to_brazil_verified' => false,
                'photos_licensed' => false,
                'commerce_authorized' => false
            );
        }
        return array(
            'checked' => true, 'expected_count' => count($expected),
            'safe_private_count' => $safe, 'attention_count' => $attention,
            'rows' => $rows, 'source_verified' => false,
            'commercial_ready' => false
        );
    }

    static function snapshot() {
        $r = array(
            'schema' => 1, 'generated_at_utc' => gmdate('c'),
            'catalog_available' => false, 'product_count' => 0, 'sku_count' => 0,
            'eprolo_security' => self::eprolo_security_snapshot(),
            'private_candidates' => self::candidate_snapshot(),
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
                if ($v->needs_shipping() &&
                    ((string) $v->get_weight() === '' || (string) $v->get_length() === '' ||
                     (string) $v->get_width() === '' || (string) $v->get_height() === '')) {
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
        $ep = self::eprolo_security_snapshot();
        $candidates = self::candidate_snapshot();
        ?>
        <div class="wrap">
            <h1>DROPERAGENT — Autonomous Profit Monitor</h1>
            <p>Monitor autônomo de risco comercial, <strong>somente leitura</strong>.
              Nenhuma venda ou lucro é certificado por este relatório; estoque e cotações são valores internos do WooCommerce.</p>
            <section style="max-width:850px;padding:12px 16px;border-left:4px solid <?php echo $ep['attention'] ? '#b32d2e' : '#777'; ?>;background:#fff;margin:16px 0">
                <h2>Segurança do fornecedor EPROLO</h2>
                <p><strong>Plugin:</strong> <?php echo esc_html($ep['active'] ? 'ativo' : 'inativo'); ?>;
                <strong>versão instalada:</strong> <?php echo esc_html($ep['version'] === '' ? 'não identificada' : $ep['version']); ?>;
                <strong>avaliação:</strong> <?php echo esc_html($ep['risk_state']); ?>.</p>
                <?php if ($ep['attention']) : ?>
                    <p><strong>ATENÇÃO:</strong> existe um alerta de controle de acesso que afeta o EPROLO até 2.4.2.
                    Uma versão nova requer confirmação da correção. Recomenda-se manter o plugin desativado
                    até que uma versão corrigida seja confirmada e testada em ambiente isolado.</p>
                <?php else : ?>
                    <p>Não há plugin EPROLO afetado ativo nesta leitura. Isso não confirma nenhuma conexão,
                    disponibilidade de estoque ou autorização para sincronizar pedidos.</p>
                <?php endif; ?>
                <p><a href="<?php echo esc_url($ep['advisory_url']); ?>" target="_blank" rel="noopener noreferrer">Ver aviso CVE-2026-74019 (Patchstack)</a>.
                Nenhuma configuração, credencial ou pedido foi alterado por esta verificação.</p>
            </section>
            <section style="max-width:850px;padding:12px 16px;border-left:4px solid <?php echo $candidates['attention_count'] ? '#b32d2e' : '#777'; ?>;background:#fff;margin:16px 0">
              <h2>Product Hunter — 5 candidatos privados</h2>
              <p>Produtos pesquisados e cadastrados como rascunhos, sem preço e sem estoque vendável.
                 <strong>Privados sem alerta:</strong> <?php echo esc_html((string) $candidates['safe_private_count']); ?> /
                 <?php echo esc_html((string) $candidates['expected_count']); ?>.
                 <strong>Revisão urgente:</strong> <?php echo esc_html((string) $candidates['attention_count']); ?>.</p>
              <table class="widefat striped"><thead><tr><th>ID Woo</th><th>Estado do rascunho</th><th>Ação</th></tr></thead><tbody>
              <?php foreach ($candidates['rows'] as $item) : ?>
                <tr>
                  <td><?php echo esc_html((string) $item['woo_id']); ?></td>
                  <td><?php echo $item['safe_private_draft'] ? 'Privado e indisponível' :
                      esc_html(implode(', ', $item['issues'])); ?></td>
                  <td><?php $edit = function_exists('get_edit_post_link') ?
                      get_edit_post_link($item['woo_id']) : false;
                      if ($edit) : ?><a href="<?php echo esc_url($edit); ?>">Revisar rascunho</a><?php
                      else : ?>Produto não encontrado<?php endif; ?></td>
                </tr>
              <?php endforeach; ?>
              </tbody></table>
              <p><strong>Nenhum candidato está aprovado para venda.</strong> Faltam SKU do fornecedor,
                 custo, estoque confirmado, frete para CEP brasileiro, tributos e imagens autorizadas.
                 Este painel NÃO publica produtos e NÃO atualiza preços, estoque ou pedidos.</p>
            </section>
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
