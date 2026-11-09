<?php
/**
 * Plugin Name: DROPERAGENT — Conexões API
 * Description: Painel administrativo para credenciais criptografadas de fornecedores, com teste de leitura CJ.
 * Version: 0.1.0
 * Requires PHP: 8.1
 * Author: DROPERAGENT
 * License: GPL-2.0-or-later
 */
defined('ABSPATH') || exit;

if (!class_exists('DroperAgent_API_Connections', false)) {
final class DroperAgent_API_Connections {
    const PREFIX = 'droper_api_cj_';
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
            .droper-api-admin #cj_api_key{width:100%;max-width:500px;min-height:42px}
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
            <?php
            $providers = array(
                'AliExpress' => 'Open Platform: aplicação e permissões de dropshipping pendentes.',
                'Banggood' => 'Programa de API para dropshippers: solicitar acesso.',
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
          <p class="da-warning"><strong>Modo seguro:</strong> este painel não modifica produtos, SKUs, preços, pedidos ou pagamentos. Só o administrador pode guardar ou testar a chave CJ.</p>
        </div>
        <?php
    }
    static function boot() {
        add_action('admin_menu', array(__CLASS__, 'menu'));
        add_action('admin_post_droper_api_save', array(__CLASS__, 'save'));
        add_action('admin_post_droper_api_test', array(__CLASS__, 'test'));
        add_action('admin_post_droper_api_remove', array(__CLASS__, 'remove'));
    }
}
DroperAgent_API_Connections::boot();
}