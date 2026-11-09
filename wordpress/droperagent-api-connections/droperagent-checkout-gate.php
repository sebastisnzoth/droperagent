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
    static function boot() {
        add_action('woocommerce_check_cart_items', array(__CLASS__, 'classic_cart_validation'), 50);
        add_action('woocommerce_after_checkout_validation',
            array(__CLASS__, 'classic_checkout_validation'), 50, 2);
        add_action('woocommerce_store_api_cart_errors',
            array(__CLASS__, 'store_api_errors'), 50, 2);
    }
}
DroperAgent_Checkout_Gate::boot();
}
