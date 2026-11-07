<?php
/**
 * Plugin Name: AutoDrop MCP Integration
 * Plugin URI: https://autodrop.ai
 * Description: Integração MCP para controle de IA da loja WordPress + WooCommerce
 * Version: 1.0.0
 * Author: AutoDrop AI Team
 * Author URI: https://autodrop.ai
 * License: MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: autodrop-mcp
 * Domain Path: /languages
 */

defined('ABSPATH') || exit;

// Definir constantes
define('AUTODROP_MCP_VERSION', '1.0.0');
define('AUTODROP_MCP_PATH', plugin_dir_path(__FILE__));
define('AUTODROP_MCP_URL', plugin_dir_url(__FILE__));
define('AUTODROP_MCP_INCLUDES', AUTODROP_MCP_PATH . 'includes/');
define('AUTODROP_MCP_API_ENDPOINT', 'http://localhost:3001');

// Autoload de classes
if (file_exists(AUTODROP_MCP_INCLUDES . 'class-autoload.php')) {
    require_once AUTODROP_MCP_INCLUDES . 'class-autoload.php';
}

// Activación plugin
register_activation_hook(__FILE__, 'autodrop_mcp_activate');
function autodrop_mcp_activate() {
    // Crear tablas de log
    global $wpdb;
    $table_name = $wpdb->prefix . 'autodrop_mcp_logs';
    
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        api_key varchar(64) NOT NULL,
        action varchar(50) NOT NULL,
        request longtext,
        response longtext,
        timestamp datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY api_key (api_key)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// Desactivación plugin
register_deactivation_hook(__FILE__, 'autodrop_mcp_deactivate');
function autodrop_mcp_deactivate() {
    // Limpiar cron jobs
    wp_clear_scheduled_hook('autodrop_mcp_health_check');
}

// Incluir archivos principales
require_once AUTODROP_MCP_INCLUDES . 'class-rest-api.php';
require_once AUTODROP_MCP_INCLUDES . 'class-product-sync.php';
require_once AUTODROP_MCP_INCLUDES . 'class-order-sync.php';
require_once AUTODROP_MCP_INCLUDES . 'class-health-monitor.php';

// Registrar scripts
add_action('wp_enqueue_scripts', 'autodrop_mcp_enqueue_scripts');
function autodrop_mcp_enqueue_scripts() {
    if (!is_admin()) return;
    
    wp_enqueue_script(
        'autodrop-mcp-admin',
        AUTODROP_MCP_URL . 'js/admin.js',
        ['jquery'],
        AUTODROP_MCP_VERSION,
        true
    );
}

// Agregar menú de administración
add_action('admin_menu', 'autodrop_mcp_admin_menu');
function autodrop_mcp_admin_menu() {
    add_menu_page(
        'AutoDrop AI Control Center',
        'AutoDrop AI',
        'manage_woocommerce',
        'autodrop-mcp',
        'autodrop_mcp_admin_page',
        'dashicons-analytics',
        6
    );
}

// Página de administración
function autodrop_mcp_admin_page() {
    ?>
    <div class="wrap">
        <h1>AutoDrop AI Control Center</h1>
        <p class="subtitle">Agente de automatización para WooCommerce</p>
        
        <div class="card">
            <h2>Métricas do Dia</h2>
            <div id="mcp-metrics">
                <p>Carregando...</p>
            </div>
        </div>
        
        <div class="card">
            <h2>Pendentes de Aprovação</h2>
            <div id="mcp-approvals">
                <p>Carregando...</p>
            </div>
        </div>
    </div>
    <?php
}

// Inicializar plugin
function autodrop_mcp_init() {
    // Registrar endpoint REST
    autodrop_mcp_register_rest_routes();
    
    // Agendar health check
    if (!wp_next_scheduled('autodrop_mcp_health_check')) {
        wp_schedule_event(time(), 'hourly', 'autodrop_mcp_health_check');
    }
}
add_action('init', 'autodrop_mcp_init');

// Incluir arquivos de traducción
load_plugin_textdomain('autodrop-mcp', false, dirname(plugin_basename(__FILE__)) . '/languages/');