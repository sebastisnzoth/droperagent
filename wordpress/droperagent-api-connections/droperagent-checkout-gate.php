<?php
/**
 * DROPERAGENT commerce validation gate.
 *
 * This file is an extension of the existing DROPERAGENT WordPress integration,
 * not a separate plugin or a payment gateway. It is loaded for public requests
 * from the existing theme bootstrap until the module is migrated to a plugin.
 *
 * FAIL-CLOSED launch policy for physically delivered products:
 * Never take a new checkout payment while supplier product cost, shipping BR,
 * regulatory status and incoming PIX settlement remain unverified.
 */
defined('ABSPATH') || exit;

if (!class_exists('DroperAgent_Checkout_Gate', false)) {
final class DroperAgent_Checkout_Gate {
    static function is_approved() {
        // The launch gate requires a deliberate reviewed code change + green CI.
        // Manual quote entries in DROPERAGENT APIs NEVER approve commerce.
        return false;
    }
    static function message() {
        return 'Entrega temporariamente indisponível. Estamos validando frete, fornecedor e impostos antes de aceitar pedidos. Entre em contato para consultar disponibilidade.';
    }
    static function requires_delivery($cart) {
        if (!is_object($cart) || !method_exists($cart, 'get_cart')) return false;
        foreach ((array) $cart->get_cart() as $item) {
            $product = is_array($item) ? ($item['data'] ?? null) : null;
            if (is_object($product) && method_exists($product, 'needs_shipping') &&
                $product->needs_shipping()) {
                return true;
            }
        }
        return false;
    }
    static function is_blocked($cart) {
        return !self::is_approved() && self::requires_delivery($cart);
    }
    // WooCommerce Blocks / Store API. Adds an explicit 409 cart validation error.
    static function store_api_errors($errors, $cart) {
        if (!is_object($errors) || !method_exists($errors, 'add')) return;
        if (self::is_blocked($cart)) {
            $errors->add('droper_shipping_pending', self::message());
        }
    }
    // Classic Cart and Classic Checkout, also supported by WooCommerce Blocks.
    static function classic_cart_validation() {
        if (!function_exists('WC') || !WC() || !isset(WC()->cart) ||
            !function_exists('wc_add_notice')) return;
        if (self::is_blocked(WC()->cart)) {
            $message = self::message();
            if (!function_exists('wc_has_notice') || !wc_has_notice($message, 'error')) {
                wc_add_notice($message, 'error');
            }
        }
    }
    // Additional Classic Checkout guard before any payment operation.
    static function classic_checkout_validation($data, $errors) {
        if (!function_exists('WC') || !WC() || !isset(WC()->cart) ||
            !is_object($errors) || !method_exists($errors, 'add')) return;
        if (self::is_blocked(WC()->cart)) {
            $errors->add('droper_shipping_pending', self::message());
        }
    }
    /**
     * Existing pending orders can be paid using /checkout/order-pay/ID and
     * POST /wc/store/v1/checkout/ID without revisiting the live cart.
     * Treat deleted/unknown products as requiring review (fail closed).
     */
    static function order_requires_delivery($order) {
        if (!is_object($order) || !method_exists($order, 'get_items')) return false;
        $items = (array) $order->get_items('line_item');
        foreach ($items as $item) {
            if (!is_object($item) || !method_exists($item, 'get_product')) return true;
            $product = $item->get_product();
            if (!is_object($product) || !method_exists($product, 'needs_shipping') ||
                $product->needs_shipping()) return true;
        }
        return false;
    }
    static function is_blocked_order($order) {
        return !self::is_approved() && self::order_requires_delivery($order);
    }
    /**
     * Reduce payment gateway exposure for unapproved physical carts and order-pay.
     * Also guards customers returning to a pre-existing pending invoice.
     */
    static function available_payment_gateways($gateways) {
        if (!is_array($gateways) || self::is_approved()) return $gateways;
        if (function_exists('WC') && WC() && isset(WC()->cart) &&
            self::is_blocked(WC()->cart)) return array();
        if (function_exists('is_checkout_pay_page') && is_checkout_pay_page() &&
            function_exists('wc_get_order') && function_exists('get_query_var')) {
            $order_id = absint(get_query_var('order-pay'));
            if ($order_id && self::is_blocked_order(wc_get_order($order_id))) return array();
        }
        return $gateways;
    }
    /**
     * Legacy /checkout/order-pay/ submits through WC_Form_Handler::pay_action().
     * That route is not protected by cart/checkout validation and checks payment
     * gateways only after woocommerce_before_pay_action, so halt it here.
     */
    static function legacy_before_pay_action($order) {
        if (!self::is_blocked_order($order)) return;
        wp_die(esc_html(self::message()), esc_html__('Checkout indisponível', 'woocommerce'),
            array('response' => 403));
    }
    /**
     * Store API also supports paying existing orders (/checkout/{ORDER_ID}).
     * This official hook runs before payment attempts and covers both that
     * endpoint and ordinary Checkout Blocks as an independent last resort.
     */
    static function store_api_before_payment($order) {
        if (!self::is_blocked_order($order)) return;
        if (class_exists('Automattic\\WooCommerce\\StoreApi\\Exceptions\\RouteException')) {
            throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException(
                'droper_shipping_pending', self::message(), 403
            );
        }
        // Fail closed even when the Store API exception class is unavailable.
        wp_die(esc_html(self::message()), esc_html__('Checkout indisponível', 'woocommerce'),
            array('response' => 403));
    }

    static function boot() {
        add_action('woocommerce_check_cart_items', array(__CLASS__, 'classic_cart_validation'), 50);
        add_action('woocommerce_after_checkout_validation',
            array(__CLASS__, 'classic_checkout_validation'), 50, 2);
        add_action('woocommerce_store_api_cart_errors',
            array(__CLASS__, 'store_api_errors'), 50, 2);
        add_filter('woocommerce_available_payment_gateways',
            array(__CLASS__, 'available_payment_gateways'), 50);
        add_action('woocommerce_before_pay_action',
            array(__CLASS__, 'legacy_before_pay_action'), 5);
        add_action('woocommerce_store_api_checkout_order_processed',
            array(__CLASS__, 'store_api_before_payment'), 5);
    }
}
DroperAgent_Checkout_Gate::boot();
}
