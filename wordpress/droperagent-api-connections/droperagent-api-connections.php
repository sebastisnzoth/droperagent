<?php
/**
 * Plugin Name: DROPERAGENT — Conexões API
 * Description: Painel administrativo para credenciais criptografadas de fornecedores, com teste de leitura CJ.
 * Version: 0.4.0
 * Requires PHP: 8.1
 * Author: DROPERAGENT
 * License: GPL-2.0-or-later
 */
defined('ABSPATH') || exit;

if (!class_exists('DroperAgent_API_Connections', false)) {
final class DroperAgent_API_Connections {
    const PREFIX = 'droper_api_cj_';
    const AE_PREFIX = 'droper_api_ae_';
    const BG_PREFIX = 'droper_api_bg_';
    static function key() {
        if (!function_exists('sodium_crypto_secretbox')) return false;
        return hash('sha256', 'droperagent-api-v1|' . wp_salt('auth') . '|' . wp_salt('secure_auth'), true);
    }
    static function seal($text) {
        $key = self::key();
        if (!$key || !is_string($text) || !$text) return false;
        try {
            $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
            return 'v1:' . base64_encode($nonce . sodium_crypto_secretbox($text, $nonce, $key));
        } catch (Throwable $e) { return false; }
    }
    static function open($option) {
        $value = get_option(self::PREFIX . $option, '');
        if (!self::key() || !is_string($value) || strncmp($value, 'v1:', 3)) return false;
        $raw = base64_decode(substr($value, 3), true);
        if ($raw === false || strlen($raw) < SODIUM_CRYPTO_SECRETBOX_NONCEBYTES + SODIUM_CRYPTO_SECRETBOX_MACBYTES) return false;
        try {
            $text = sodium_crypto_secretbox_open(
                substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES),
                substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES),
                self::key()
            );
            return is_string($text) && strlen($text) ? $text : false;
        } catch (Throwable $e) { return false; }
    }
    static function store($field, $text) {
        $cipher = self::seal($text);
        if (!$cipher) return false;
        update_option(self::PREFIX . $field, $cipher, false); // autoload disabled
        return true;
    }
    static function clear() {
        foreach (array('key', 'access', 'refresh', 'check', 'last_attempt') as $field) {
            delete_option(self::PREFIX . $field);
        }
    }
    static function guard($action) {
        if (!current_user_can('manage_options')) wp_die('Sem permissão.');
        check_admin_referer('droper_api_' . $action);
    }
    static function redirect($code) {
        wp_safe_redirect(add_query_arg('da_notice', $code, admin_url('admin.php?page=droperagent-api-connections')), 303);
        exit;
    }
    static function save() {
        self::guard('save');
        if (!self::key()) self::redirect('crypto');
        $key = isset($_POST['cj_api_key']) && is_string($_POST['cj_api_key'])
            ? trim(wp_unslash($_POST['cj_api_key'])) : '';
        if ($key === '') self::redirect('unchanged');
        if (strlen($key) < 16 || strlen($key) > 200 || !preg_match('/^[\x21-\x7E]+$/D', $key)) self::redirect('invalid');
        if (!self::store('key', $key)) self::redirect('error');
        foreach (array('access', 'refresh', 'check', 'last_attempt') as $field) delete_option(self::PREFIX . $field);
        self::redirect('saved');
    }
    static function remove() {
        self::guard('remove');
        self::clear();
        self::redirect('deleted');
    }
    static function test() {
        self::guard('test');
        $key = self::open('key');
        if (!$key) self::redirect('missing');
        $last = (int) get_option(self::PREFIX . 'last_attempt', 0);
        if ($last && time() - $last < 60) self::redirect('limited');
        update_option(self::PREFIX . 'last_attempt', time(), false);
        // Only the official CJ authentication endpoint is called. No orders or payments.
        $res = wp_remote_post('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', array(
            'timeout' => 12, 'redirection' => 0, 'sslverify' => true, 'limit_response_size' => 16000,
            'headers' => array('Content-Type' => 'application/json', 'Accept' => 'application/json'),
            'body' => wp_json_encode(array('apiKey' => $key)),
        ));
        if (is_wp_error($res) || wp_remote_retrieve_response_code($res) !== 200) {
            update_option(self::PREFIX . 'check', array('ok' => false, 'checked_at' => time()), false);
            self::redirect('failed');
        }
        $data = json_decode(wp_remote_retrieve_body($res), true);
        $auth = is_array($data) && !empty($data['result']) && (int) ($data['code'] ?? 0) === 200
            ? ($data['data'] ?? null) : null;
        $access = is_array($auth) ? ($auth['accessToken'] ?? null) : null;
        $refresh = is_array($auth) ? ($auth['refreshToken'] ?? null) : null;
        if (!is_string($access) || strlen($access) < 16 || strlen($access) > 1024 ||
            !is_string($refresh) || strlen($refresh) < 16 || strlen($refresh) > 1024 ||
            !self::store('access', $access) || !self::store('refresh', $refresh)) {
            delete_option(self::PREFIX . 'access');
            delete_option(self::PREFIX . 'refresh');
            update_option(self::PREFIX . 'check', array('ok' => false, 'checked_at' => time()), false);
            self::redirect('failed');
        }
        $expiry = isset($auth['accessTokenExpiryDate']) && is_string($auth['accessTokenExpiryDate'])
            ? strtotime($auth['accessTokenExpiryDate']) : false;
        update_option(self::PREFIX . 'check', array(
            'ok' => true, 'checked_at' => time(), 'expires_at' => $expiry ? (int) $expiry : 0,
        ), false);
        self::redirect('connected');
    }
    // AliExpress Open Platform — seller OAuth is available only when the app category grants it.
    // These are NOT supplier / order API calls; no Woo writes and no money movement.
    static function ae_storage_key($field) {
        if (!in_array($field, array('app_key', 'app_secret', 'access'), true)) return false;
        return self::AE_PREFIX . $field;
    }
    static function ae_open($field) {
        $name = self::ae_storage_key($field);
        if (!$name || !self::key()) return false;
        $encrypted = get_option($name, '');
        if (!is_string($encrypted) || substr($encrypted, 0, 3) !== 'v1:') return false;
        $raw = base64_decode(substr($encrypted, 3), true);
        if (!is_string($raw) || strlen($raw) < SODIUM_CRYPTO_SECRETBOX_NONCEBYTES + SODIUM_CRYPTO_SECRETBOX_MACBYTES) return false;
        try {
            $decoded = sodium_crypto_secretbox_open(
                substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES),
                substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES),
                self::key()
            );
            return is_string($decoded) && strlen($decoded) > 0 ? $decoded : false;
        } catch (Throwable $e) { return false; }
    }
    static function ae_store($field, $value) {
        $name = self::ae_storage_key($field);
        if (!$name || !is_string($value)) return false;
        $sealed = self::seal($value);
        if (!$sealed) return false;
        update_option($name, $sealed, false); // autoload=no
        return true;
    }
    static function ae_revoke_tokens() {
        delete_option(self::AE_PREFIX . 'access');
        delete_option(self::AE_PREFIX . 'expires');
        delete_option(self::AE_PREFIX . 'last_authorized');
        delete_transient('droper_ae_oauth_' . get_current_user_id());
    }
    static function ae_save() {
        self::guard('ae_save');
        if (!self::key()) self::redirect('crypto');
        $key = isset($_POST['ae_app_key']) && is_string($_POST['ae_app_key'])
            ? trim(wp_unslash($_POST['ae_app_key'])) : '';
        $secret = isset($_POST['ae_app_secret']) && is_string($_POST['ae_app_secret'])
            ? trim(wp_unslash($_POST['ae_app_secret'])) : '';
        if ($key === '' && $secret === '') self::redirect('ae_unchanged');
        // Never save a partial key/secret pair. New app values invalidate old OAuth authorization.
        if (!preg_match('/^[A-Za-z0-9_-]{5,80}$/D', $key) ||
            strlen($secret) < 12 || strlen($secret) > 512 ||
            !preg_match('/^[\x21-\x7E]+$/D', $secret)) self::redirect('ae_invalid');
        $old_key = self::ae_open('app_key');
        $old_secret = self::ae_open('app_secret');
        if (!self::ae_store('app_key', $key) || !self::ae_store('app_secret', $secret)) {
            // Fail closed. Do not retain a mismatched credential pair.
            foreach (array('app_key', 'app_secret') as $field) delete_option(self::AE_PREFIX . $field);
            self::ae_revoke_tokens();
            self::redirect('error');
        }
        if ($old_key !== $key || $old_secret !== $secret) self::ae_revoke_tokens();
        self::redirect('ae_saved');
    }
    static function ae_remove() {
        self::guard('ae_remove');
        foreach (array('app_key', 'app_secret') as $field) delete_option(self::AE_PREFIX . $field);
        self::ae_revoke_tokens();
        self::redirect('ae_removed');
    }
    static function ae_callback_url() {
        // Register this exact HTTPS callback in AliExpress Open Platform before OAuth.
        return add_query_arg('action', 'droper_api_ae_callback', set_url_scheme(admin_url('admin-post.php'), 'https'));
    }
    static function ae_authorize() {
        self::guard('ae_authorize');
        $key = self::ae_open('app_key');
        $secret = self::ae_open('app_secret');
        if (!$key || !$secret) self::redirect('ae_missing');
        if (!is_ssl() || wp_parse_url(self::ae_callback_url(), PHP_URL_SCHEME) !== 'https') {
            self::redirect('ae_https');
        }
        try {
            $state = bin2hex(random_bytes(24));
        } catch (Throwable $e) { self::redirect('error'); }
        // One-time CSRF state is bound to the current WordPress admin account.
        set_transient('droper_ae_oauth_' . get_current_user_id(), hash('sha256', $state), 10 * MINUTE_IN_SECONDS);
        $url = add_query_arg(array(
            'response_type' => 'code', 'client_id' => $key,
            'redirect_uri' => self::ae_callback_url(), 'state' => $state,
            'view' => 'web', 'sp' => 'ae',
        ), 'https://oauth.aliexpress.com/authorize');
        nocache_headers();
        wp_redirect($url, 302, 'DROPERAGENT'); // Fixed approved AliExpress OAuth host.
        exit;
    }
    static function ae_callback() {
        if (!current_user_can('manage_options')) wp_die('Sem permissão.');
        nocache_headers();
        header('Referrer-Policy: no-referrer');
        $state = isset($_GET['state']) && is_string($_GET['state'])
            ? wp_unslash($_GET['state']) : '';
        $code = isset($_GET['code']) && is_string($_GET['code'])
            ? wp_unslash($_GET['code']) : '';
        $expected = get_transient('droper_ae_oauth_' . get_current_user_id());
        // Consume state before the token exchange to prevent replay or duplicate writes.
        delete_transient('droper_ae_oauth_' . get_current_user_id());
        if (!is_string($expected) || strlen($state) !== 48 ||
            !ctype_xdigit($state) || !hash_equals($expected, hash('sha256', $state)) ||
            $code === '' || strlen($code) > 1024 || preg_match('/[\x00-\x1F\x7F]/', $code)) {
            self::redirect('ae_oauth_invalid');
        }
        $key = self::ae_open('app_key');
        $secret = self::ae_open('app_secret');
        if (!$key || !$secret) self::redirect('ae_missing');
        $response = wp_remote_post('https://oauth.aliexpress.com/token', array(
            'timeout' => 12, 'redirection' => 0, 'sslverify' => true,
            'limit_response_size' => 16384,
            'headers' => array('Accept' => 'application/json'),
            'body' => array(
                'grant_type' => 'authorization_code', 'client_id' => $key,
                'client_secret' => $secret, 'code' => $code,
                'redirect_uri' => self::ae_callback_url(), 'sp' => 'ae',
            ),
        ));
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
            self::redirect('ae_oauth_failed');
        }
        $payload = json_decode(wp_remote_retrieve_body($response), true);
        $token = is_array($payload) ? ($payload['access_token'] ?? null) : null;
        if (!is_string($token) || strlen($token) < 16 || strlen($token) > 2048 ||
            preg_match('/[\x00-\x20\x7F]/', $token) || !self::ae_store('access', $token)) {
            self::redirect('ae_oauth_failed');
        }
        // Old official OAuth docs define expire_time in epoch milliseconds; no automatic refresh.
        $expiry = is_array($payload) ? ($payload['expire_time'] ?? null) : null;
        $expiry_seconds = is_numeric($expiry) ? (int) floor(((float) $expiry) / ((float) $expiry > 1000000000000 ? 1000 : 1)) : 0;
        if ($expiry_seconds < time() || $expiry_seconds > time() + YEAR_IN_SECONDS) $expiry_seconds = 0;
        update_option(self::AE_PREFIX . 'expires', $expiry_seconds, false);
        update_option(self::AE_PREFIX . 'last_authorized', time(), false);
        self::redirect('ae_oauth_saved');
    }

    // Banggood Open Platform — provisioning only. No API request or order permission.
    static function bg_storage_key($field) {
        if (!in_array($field, array('app_id', 'app_secret'), true)) return false;
        return self::BG_PREFIX . $field;
    }
    static function bg_open($field) {
        $name = self::bg_storage_key($field);
        if (!$name || !self::key()) return false;
        $cipher = get_option($name, '');
        if (!is_string($cipher) || substr($cipher, 0, 3) !== 'v1:') return false;
        $raw = base64_decode(substr($cipher, 3), true);
        if (!is_string($raw) ||
            strlen($raw) < SODIUM_CRYPTO_SECRETBOX_NONCEBYTES + SODIUM_CRYPTO_SECRETBOX_MACBYTES) return false;
        try {
            $plain = sodium_crypto_secretbox_open(
                substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES),
                substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES),
                self::key()
            );
            return is_string($plain) && strlen($plain) > 0 ? $plain : false;
        } catch (Throwable $e) { return false; }
    }
    static function bg_store($field, $text) {
        $name = self::bg_storage_key($field);
        if (!$name || !is_string($text) || !$text) return false;
        $sealed = self::seal($text);
        if (!$sealed) return false;
        update_option($name, $sealed, false);
        return true;
    }
    static function bg_clear() {
        foreach (array('app_id', 'app_secret') as $field) delete_option(self::BG_PREFIX . $field);
        delete_option(self::BG_PREFIX . 'reviewed_at');
    }
    static function bg_save() {
        self::guard('bg_save');
        if (!self::key()) self::redirect('crypto');
        $id = isset($_POST['bg_app_id']) && is_string($_POST['bg_app_id'])
            ? trim(wp_unslash($_POST['bg_app_id'])) : '';
        $secret = isset($_POST['bg_app_secret']) && is_string($_POST['bg_app_secret'])
            ? trim(wp_unslash($_POST['bg_app_secret'])) : '';
        if ($id === '' && $secret === '') self::redirect('bg_unchanged');
        if (!preg_match('/^[A-Za-z0-9_-]{3,100}$/D', $id) ||
            strlen($secret) < 12 || strlen($secret) > 512 ||
            !preg_match('/^[\x21-\x7E]+$/D', $secret)) self::redirect('bg_invalid');
        // No partially configured pair is permitted, and saving doesn't grant API scopes.
        if (!self::bg_store('app_id', $id) || !self::bg_store('app_secret', $secret)) {
            self::bg_clear();
            self::redirect('error');
        }
        delete_option(self::BG_PREFIX . 'reviewed_at');
        self::redirect('bg_saved');
    }
    static function bg_remove() {
        self::guard('bg_remove');
        self::bg_clear();
        self::redirect('bg_removed');
    }


    /**
     * Admin-only catalog and Brazilian shipping readiness snapshot.
     * WooCommerce-only READ operations, no supplier calls, no writes, no fake rates.
     * Bounded to 30 parent products and 240 variations per request.
     */
    static function commerce_readiness_snapshot() {
        $snapshot = array(
            'product_count' => 0, 'variant_count' => 0, 'skus_missing' => 0,
            'duplicate_skus' => 0, 'low_stock_count' => 0,
            'accessory_review_count' => 0, 'missing_dimensions' => 0,
            'truncated' => false, 'rows' => array(),
            'currency' => function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : 'unknown',
            'tax_enabled' => function_exists('wc_tax_enabled') ? (bool) wc_tax_enabled() : null,
            'shipping' => array(
                'br_zone_exists' => false, 'br_enabled_methods' => 0,
                'other_enabled_methods' => 0, 'fallback_enabled_methods' => 0,
                'cost_verified' => false, 'crossborder_freight_verified' => false
            ),
            'supplier_stock_verified' => false, 'supplier_costs_verified' => false,
            'checkout_ready' => false, 'read_only' => true,
        );
        if (!class_exists('WooCommerce') || !function_exists('wc_get_products')) return $snapshot;
        $products = wc_get_products(array('type' => 'variable', 'status' => 'publish',
            'limit' => 31, 'orderby' => 'ID', 'order' => 'ASC'));
        if (count($products) > 30) { $snapshot['truncated'] = true; $products = array_slice($products, 0, 30); }
        $seen = array();
        foreach ($products as $product) {
            $snapshot['product_count']++;
            $children = array_slice((array) $product->get_children(), 0, 241);
            if (count($children) > 240) { $snapshot['truncated'] = true; $children = array_slice($children, 0, 240); }
            foreach ($children as $child_id) {
                if (count($snapshot['rows']) >= 240) { $snapshot['truncated'] = true; break 2; }
                $v = wc_get_product($child_id);
                if (!$v || !$v->is_type('variation') || $v->get_status() !== 'publish') continue;
                $sku = (string) $v->get_sku('edit');
                $price = (string) $v->get_price('edit');
                $quantity = $v->get_stock_quantity('edit');
                $manage = $v->get_manage_stock('edit');
                $options = array();
                foreach ((array) $v->get_attributes('edit') as $name => $option) {
                    $options[] = (string) $name . '=' . (string) $option;
                }
                $opt_label = implode(', ', $options);
                $accessory = (bool) preg_match('/only.?access|no.?accessor/i', $sku . ' ' . $opt_label);
                $low_stock = $manage && $quantity !== null && (int) $quantity <= 1;
                $weight = (string) $v->get_weight();
                $length = (string) $v->get_length();
                $width  = (string) $v->get_width();
                $height = (string) $v->get_height();
                $dims_missing = ($weight === '' || $length === '' || $width === '' || $height === '');
                if ($sku === '') $snapshot['skus_missing']++;
                else {
                    if (isset($seen[$sku])) $snapshot['duplicate_skus']++;
                    $seen[$sku] = true;
                }
                if ($low_stock) $snapshot['low_stock_count']++;
                if ($accessory) $snapshot['accessory_review_count']++;
                if ($dims_missing) $snapshot['missing_dimensions']++;
                $snapshot['variant_count']++;
                $snapshot['rows'][] = array(
                    'product_id' => (int) $product->get_id(), 'variation_id' => (int) $v->get_id(),
                    'sku' => $sku, 'option' => $opt_label, 'price' => $price,
                    'stock_quantity' => $quantity === null ? null : (int) $quantity,
                    'stock_managed' => (bool) $manage,
                    'low_stock' => (bool) $low_stock, 'accessory_review' => (bool) $accessory,
                    'missing_dimensions' => (bool) $dims_missing,
                );
            }
        }
        if (class_exists('WC_Shipping_Zones')) {
            $zones = WC_Shipping_Zones::get_zones();
            foreach ((array) $zones as $zone) {
                $locations = (array) ($zone['zone_locations'] ?? array());
                $is_br = false;
                foreach ($locations as $loc) {
                    $type = (string) ($loc->type ?? '');
                    $code = (string) ($loc->code ?? '');
                    if (($type === 'country' && $code === 'BR') ||
                        ($type === 'state' && strpos($code, 'BR:') === 0)) {
                        $is_br = true;
                        break;
                    }
                }
                if ($is_br) $snapshot['shipping']['br_zone_exists'] = true;
                foreach ((array) ($zone['shipping_methods'] ?? array()) as $method) {
                    if (!is_object($method) || !method_exists($method, 'is_enabled') || !$method->is_enabled()) continue;
                    if ($is_br) $snapshot['shipping']['br_enabled_methods']++;
                    else $snapshot['shipping']['other_enabled_methods']++;
                }
            }
            // Woo's fallback zone does not necessarily cover Brazil if another zone matches.
            $fallback = new WC_Shipping_Zone(0);
            $snapshot['shipping']['fallback_enabled_methods'] = count($fallback->get_shipping_methods(true));
        }
        // Without a verified all-in supplier price and freight, this never authorizes checkout.
        return $snapshot;
    }
    static function commerce_readiness_card() {
        if (!current_user_can('manage_options')) return;
        $audit = self::commerce_readiness_snapshot();
        $shipping = $audit['shipping'];
        ?>
        <section class="da-card" style="grid-column:1/-1">
          <h2>Auditoria WooCommerce — SKU, preço, estoque e frete Brasil</h2>
          <p><span class="da-pill"><?php echo esc_html($audit['variant_count']); ?> variantes em <?php echo esc_html($audit['product_count']); ?> produtos</span>
          <span class="da-pill">Moeda: <?php echo esc_html($audit['currency']); ?></span>
          <span class="da-pill">Auditoria somente leitura</span></p>
          <p><strong>Frete Brasil:</strong>
            <?php echo $shipping['br_enabled_methods'] > 0
                ? 'Método cadastrado (valor e cobertura ainda precisam ser verificados).'
                : 'SEM método habilitado em zona Brasil.'; ?>
            <?php if ($shipping['fallback_enabled_methods'] > 0) : ?>
              Método de zona padrão encontrado; verificar se alcança o CEP do comprador.
            <?php else : ?>
              Zona padrão também sem métodos.
            <?php endif; ?>
            <br><strong>Custos logísticos e impostos de importação:</strong> não verificados.
            <br><strong>Tributos configurados em WooCommerce:</strong> <?php echo $audit['tax_enabled'] ? 'habilitados' : 'desabilitados'; ?> (não equivale a regularidade fiscal).
          </p>
          <p><a class="button" href="<?php echo esc_url(admin_url('admin.php?page=wc-settings&tab=shipping')); ?>">Abrir configurações nativas de frete WooCommerce</a>
          <a class="button" href="<?php echo esc_url(admin_url('admin.php?page=wc-settings&tab=general')); ?>">Abrir configurações gerais</a></p>
          <p><strong>Alertas:</strong>
          <?php echo esc_html($audit['skus_missing']); ?> SKU vazios,
          <?php echo esc_html($audit['duplicate_skus']); ?> SKU duplicados,
          <?php echo esc_html($audit['low_stock_count']); ?> variantes com estoque ≤ 1,
          <?php echo esc_html($audit['accessory_review_count']); ?> opções que exigem confirmação de conteúdo,
          <?php echo esc_html($audit['missing_dimensions']); ?> variantes sem peso/medidas completos.</p>
          <div style="max-width:100%;overflow-x:auto"><table class="widefat striped">
            <thead><tr><th>Produto / ID</th><th>SKU WooCommerce</th><th>Opção</th><th>Preço loja (<?php echo esc_html($audit['currency']); ?>)</th><th>Estoque na loja</th><th>Revisar</th></tr></thead>
            <tbody>
            <?php foreach ($audit['rows'] as $row) :
                $issues = array();
                if ($row['sku'] === '') $issues[] = 'SKU ausente';
                if ($row['accessory_review']) $issues[] = 'conteúdo/kit';
                if ($row['low_stock']) $issues[] = 'estoque baixo';
                if ($row['missing_dimensions']) $issues[] = 'peso/medidas';
            ?>
              <tr><td><a href="<?php echo esc_url(get_edit_post_link($row['product_id'])); ?>">#<?php echo esc_html($row['product_id']); ?></a>
                  / <?php echo esc_html($row['variation_id']); ?></td>
                <td><code><?php echo esc_html($row['sku']); ?></code></td>
                <td><?php echo esc_html($row['option']); ?></td>
                <td><?php echo esc_html($row['price'] === '' ? 'Não informado' : wc_format_localized_price($row['price'])); ?></td>
                <td><?php echo esc_html($row['stock_quantity'] === null ? 'Não informado' : (string) $row['stock_quantity']); ?></td>
                <td><?php echo esc_html($issues ? implode(', ', $issues) : 'revisão de fornecedor pendente'); ?></td></tr>
            <?php endforeach; ?></tbody></table></div>
          <?php if ($audit['truncated']) : ?><p><strong>Relatório parcial:</strong> limite de 30 produtos / 240 variantes por acesso. Não presumir auditoria completa.</p><?php endif; ?>
          <p><strong>Este relatório não confirma custo de aquisição, lucro, disponibilidade na China, conformidade ANATEL ou prazo de entrega.</strong>
          O estoque acima é somente o valor armazenado na loja. Não configurar frete grátis nem taxa fixa sem cotação comprovada.</p>
        </section>
        <?php
    }

    static function menu() {
        if (class_exists('WooCommerce')) {
            add_submenu_page('woocommerce', 'DROPERAGENT | APIs', 'DROPERAGENT APIs',
                'manage_options', 'droperagent-api-connections', array(__CLASS__, 'page'));
        }
    }
    static function form($action, $label, $disabled = false, $css = '') {
        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" style="display:inline-block;margin:5px 8px 0 0" ' . $css . '>';
        echo '<input type="hidden" name="action" value="droper_api_' . esc_attr($action) . '" />';
        wp_nonce_field('droper_api_' . $action);
        echo '<button type="submit" class="button" ' . disabled($disabled, true, false) . '>' . esc_html($label) . '</button></form>';
    }
    static function page() {
        if (!current_user_can('manage_options')) wp_die('Sem permissão.');
        $messages = array(
            'saved' => 'API Key CJ salva de forma criptografada. A conexão ainda não foi testada.',
            'connected' => 'CJ autenticado neste WordPress. Nenhuma compra foi realizada.',
            'deleted' => 'Credenciais CJ removidas.',
            'missing' => 'Cadastre sua chave CJ antes de testar.',
            'invalid' => 'Chave inválida.',
            'crypto' => 'Sodium indisponível. Não é possível guardar segredos.',
            'failed' => 'Não foi possível autenticar no CJ. Verifique a chave e HTTPS.',
            'limited' => 'Espere 60 segundos entre testes de conexão.',
            'error' => 'Falha ao salvar a chave.',
            'unchanged' => 'Nada alterado: campo de chave vazio.',
            'ae_saved' => 'AliExpress App Key e App Secret armazenados com criptografia. A API ainda requer autorização e permissões válidas.',
            'ae_removed' => 'Credenciais e token AliExpress revogados localmente.',
            'ae_unchanged' => 'Nenhuma credencial AliExpress alterada.',
            'ae_invalid' => 'AliExpress exige App Key e App Secret válidos, enviados juntos.',
            'ae_missing' => 'Cadastre App Key e App Secret AliExpress antes de autorizar.',
            'ae_https' => 'A autorização só é permitida em WordPress HTTPS.',
            'ae_oauth_invalid' => 'Retorno AliExpress inválido ou expirado. Reinicie a autorização.',
            'ae_oauth_failed' => 'AliExpress não confirmou OAuth. Confira categoria da aplicação, aprovação e URL de retorno.',
            'ae_oauth_saved' => 'Token OAuth AliExpress criptografado no WordPress. Permissões de API e sourcing AINDA NÃO VERIFICADAS.',
            'bg_saved' => 'Banggood App ID e App Secret guardados com criptografia. Aprovação e acesso à API ainda não foram verificados.',
            'bg_removed' => 'Credenciais Banggood removidas, sem alterar CJ ou AliExpress.',
            'bg_unchanged' => 'Nenhuma credencial Banggood alterada.',
            'bg_invalid' => 'Informe um App ID e um App Secret Banggood válidos, sempre juntos.',
        );
        $notice = isset($_GET['da_notice']) ? sanitize_key(wp_unslash($_GET['da_notice'])) : '';
        $has_key = (bool) get_option(self::PREFIX . 'key', false);
        $state = get_option(self::PREFIX . 'check', array());
        $ok = $has_key && is_array($state) && !empty($state['ok'])
            && !empty($state['expires_at']) && (int) $state['expires_at'] > time();
        ?>
        <div class="wrap droper-api-admin">
          <h1>DROPERAGENT | Conexões API</h1>
          <p>Gerencie fornecedores a partir do painel WooCommerce. Exclusivo para administradores. Sem compras, pagamentos ou alteração de estoque.</p>
          <?php if (isset($messages[$notice])) : ?><div class="notice notice-info is-dismissible"><p><?php echo esc_html($messages[$notice]); ?></p></div><?php endif; ?>
          <style>
            .droper-api-admin .da-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;max-width:1150px;margin-top:22px}
            .droper-api-admin .da-card{padding:23px;border:1px solid #dbe5e9;background:#fff;border-radius:13px}
            .droper-api-admin .da-card h2{margin:0 0 10px}.droper-api-admin .da-card p{line-height:1.6}
            .droper-api-admin .da-pill{display:inline-block;background:#edf1f5;padding:5px 12px;border-radius:20px;font-size:12px}
            .droper-api-admin .da-pill.good{background:#e1f7ed;color:#0a7352}.droper-api-admin .da-warning{max-width:1110px;background:#e9f7f3;padding:14px 18px;border-left:4px solid #087b69}
            .droper-api-admin #cj_api_key,.droper-api-admin #ae_app_key,.droper-api-admin #ae_app_secret,.droper-api-admin #bg_app_id,.droper-api-admin #bg_app_secret{width:100%;max-width:500px;min-height:42px}
          </style>
          <div class="da-grid">
            <section class="da-card" style="grid-column:1/-1">
              <h2>CJdropshipping</h2>
              <span class="da-pill <?php echo $ok ? 'good' : ''; ?>"><?php echo $ok ? 'CJ autenticado' : ($has_key ? 'Chave salva / autorização não verificada' : 'Não configurado'); ?></span>
              <p>Guarde sua API Key de CJ. A chave e os tokens ficam criptografados no banco de dados e nunca aparecem nesta tela.</p>
              <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" autocomplete="off">
                <input type="hidden" name="action" value="droper_api_save">
                <?php wp_nonce_field('droper_api_save'); ?>
                <label for="cj_api_key"><strong>API Key CJ</strong></label><br>
                <input id="cj_api_key" name="cj_api_key" type="password" autocomplete="new-password" maxlength="200" placeholder="<?php echo $has_key ? 'Já armazenada — digite somente para substituir' : 'Cole aqui sua chave CJ'; ?>">
                <p><button class="button button-primary" type="submit">Guardar chave</button></p>
              </form>
              <?php self::form('test', 'Testar conexão CJ', !$has_key); ?>
              <?php self::form('remove', 'Remover credenciais', !$has_key,
                  'onsubmit="return confirm(\'Remover a chave e os tokens CJ deste WordPress?\')"'); ?>
              <?php if (!empty($state['checked_at'])) : ?><p>Última verificação: <?php echo esc_html(wp_date('d/m/Y H:i', (int) $state['checked_at'])); ?></p><?php endif; ?>
              <p><a href="https://developers.cjdropshipping.com/en/api/start/apikey.html" target="_blank" rel="noopener noreferrer">Abrir instruções oficiais de CJ para gerar API Key</a></p>
              <p><small><strong>Atenção:</strong> este painel testa CJ pelo servidor WordPress. A API externa em Render usa outra configuração segura e não é sincronizada automaticamente.</small></p>
            </section>
            <section class="da-card" style="grid-column:1/-1">
              <h2>AliExpress Open Platform — Dropshipping</h2>
              <?php
              $ae_key = (bool) self::ae_open('app_key');
              $ae_secret = (bool) self::ae_open('app_secret');
              $ae_has_credentials = $ae_key && $ae_secret;
              $ae_expiry = (int) get_option(self::AE_PREFIX . 'expires', 0);
              $ae_has_token = (bool) self::ae_open('access');
              $ae_oauth_valid = $ae_has_credentials && $ae_has_token && $ae_expiry > time();
              ?>
              <span class="da-pill <?php echo $ae_oauth_valid ? 'good' : ''; ?>">
                <?php echo esc_html($ae_oauth_valid
                  ? 'OAuth autorizado — API de dropshipping não verificada'
                  : ($ae_has_credentials ? 'Credenciais salvas — autorização pendente' : 'Não configurado')); ?>
              </span>
              <p>Use uma aplicação de tipo <strong>Dropshipping</strong> aprovada pela AliExpress Open Platform. O acesso é concedido por categoria e permissões. Este painel não compra nem publica produtos.</p>
              <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" autocomplete="off">
                <input type="hidden" name="action" value="droper_api_ae_save">
                <?php wp_nonce_field('droper_api_ae_save'); ?>
                <p><label for="ae_app_key"><strong>AliExpress App Key</strong></label><br>
                <input id="ae_app_key" name="ae_app_key" type="password" autocomplete="new-password" maxlength="80" placeholder="<?php echo $ae_has_credentials ? 'Salva — informe ambas as credenciais para substituir' : 'App Key da Open Platform'; ?>"></p>
                <p><label for="ae_app_secret"><strong>AliExpress App Secret</strong></label><br>
                <input id="ae_app_secret" name="ae_app_secret" type="password" autocomplete="new-password" maxlength="512" placeholder="<?php echo $ae_has_credentials ? 'Salva — informe ambas as credenciais para substituir' : 'App Secret privado'; ?>"></p>
                <button class="button button-primary" type="submit">Guardar credenciais AliExpress</button>
              </form>
              <?php self::form('ae_authorize', 'Autorizar conta AliExpress (OAuth)', !$ae_has_credentials); ?>
              <?php self::form('ae_remove', 'Revogar credenciais AliExpress', !$ae_has_credentials,
                  'onsubmit="return confirm(\'Revogar credenciais e acesso OAuth AliExpress deste WordPress?\')"'); ?>
              <p><small>URL de retorno para cadastrar na aplicação AliExpress:</small><br>
                <code><?php echo esc_html(self::ae_callback_url()); ?></code></p>
              <p><small><strong>Importante:</strong> a autorização OAuth acima segue o fluxo de desenvolvedor publicado pela AliExpress para apps que o suportam. Algumas aplicações Dropshipping utilizam somente App Key/App Secret; se seu programa usar outra autenticação, confirme no portal oficial antes de autorizar. Nenhuma consulta de sourcing está habilitada nesta etapa.</small></p>
              <p><a href="https://console.aliexpress.com/" target="_blank" rel="noopener noreferrer">Abrir AliExpress Open Platform — criar/validar app Dropshipping</a></p>
            </section>
            <section class="da-card" style="grid-column:1/-1">
              <h2>Banggood — Dropship API</h2>
              <?php
              $bg_configured = (bool) self::bg_open('app_id') && (bool) self::bg_open('app_secret');
              ?>
              <span class="da-pill"><?php echo $bg_configured
                  ? 'Credenciais salvas — aprovação e API não verificadas'
                  : 'Não configurado'; ?></span>
              <p>O programa de dropshipping Banggood anuncia uma API gratuita para parceiros aprovados. Solicite acesso no site oficial, confirme os requisitos e obtenha App ID / App Secret. <strong>Esta etapa apenas protege as credenciais.</strong></p>
              <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" autocomplete="off">
                <input type="hidden" name="action" value="droper_api_bg_save">
                <?php wp_nonce_field('droper_api_bg_save'); ?>
                <p><label for="bg_app_id"><strong>Banggood App ID</strong></label><br>
                <input type="password" id="bg_app_id" name="bg_app_id" maxlength="100"
                    autocomplete="new-password" placeholder="<?php echo $bg_configured ? 'Salvo — informe ambos os campos para substituir' : 'App ID do Banggood Open Platform'; ?>"></p>
                <p><label for="bg_app_secret"><strong>Banggood App Secret</strong></label><br>
                <input type="password" id="bg_app_secret" name="bg_app_secret" maxlength="512"
                    autocomplete="new-password" placeholder="<?php echo $bg_configured ? 'Salvo — informe ambos os campos para substituir' : 'App Secret privado'; ?>"></p>
                <p><button type="submit" class="button button-primary">Guardar credenciais Banggood</button></p>
              </form>
              <?php self::form('bg_remove', 'Remover credenciais Banggood', !$bg_configured,
                'onsubmit="return confirm(\'Remover somente as credenciais Banggood?\')"'); ?>
              <p><a href="https://api.banggood.com/index.php?com=account&amp;t=login"
                  target="_blank" rel="noopener noreferrer">Abrir Banggood Open Platform</a> |
                <a href="https://www.banggood.com/index.php?com=dropshipcenter&amp;t=Login"
                  target="_blank" rel="noopener noreferrer">Solicitar programa Dropshipping</a></p>
              <p><small>A API oficial requer aprovação e pode exigir verificação do domínio/IP. O método de autenticação e os endpoints de consulta deverão ser confirmados na conta autorizada antes de implementar o botão de teste. Nenhum token ou conexão de fornecedor foi validado.</small></p>
              <p><small>Sem chamadas à API, pedidos, alterações de SKU/preços/estoque, compras ou pagamentos.</small></p>
            </section>
            <?php
            $providers = array(
                'Alibaba.com' => 'API B2B: requer habilitação de desenvolvedor e fornecedor.',
                'Temu' => 'Partner API para vendedores, não API pública de compras para WooCommerce.',
                'EPROLO' => 'Conector WooCommerce via plugin; acesso e preços sujeitos à conta.',
            );
            foreach ($providers as $name => $description) : ?>
              <section class="da-card"><h2><?php echo esc_html($name); ?></h2><span class="da-pill">Integração pendente</span>
                <p><?php echo esc_html($description); ?></p>
                <small>Nenhuma chave cadastrada. Compras e pedidos desabilitados.</small></section>
            <?php endforeach; ?>
          </div>
          <?php self::commerce_readiness_card(); ?>
          <p class="da-warning"><strong>Modo seguro:</strong> este painel não modifica produtos, SKUs, preços, pedidos ou pagamentos. Só o administrador pode guardar ou testar a chave CJ.</p>
        </div>
        <?php
    }
    static function boot() {
        add_action('admin_menu', array(__CLASS__, 'menu'));
        add_action('admin_post_droper_api_save', array(__CLASS__, 'save'));
        add_action('admin_post_droper_api_test', array(__CLASS__, 'test'));
        add_action('admin_post_droper_api_remove', array(__CLASS__, 'remove'));
        add_action('admin_post_droper_api_ae_save', array(__CLASS__, 'ae_save'));
        add_action('admin_post_droper_api_ae_remove', array(__CLASS__, 'ae_remove'));
        add_action('admin_post_droper_api_ae_authorize', array(__CLASS__, 'ae_authorize'));
        add_action('admin_post_droper_api_ae_callback', array(__CLASS__, 'ae_callback'));
        add_action('admin_post_droper_api_bg_save', array(__CLASS__, 'bg_save'));
        add_action('admin_post_droper_api_bg_remove', array(__CLASS__, 'bg_remove'));

    }
}
DroperAgent_API_Connections::boot();
}